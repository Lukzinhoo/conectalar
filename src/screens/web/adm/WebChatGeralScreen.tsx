import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  MessageSquare,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react-native';

import WebSidebar from '../../../components/WebSidebar';
import { colors } from '../../../theme/theme';
import { supabase } from '../../../services/supabase';

// =====================================================
// TIPOS
// =====================================================

type AutorTipo =
  | 'morador'
  | 'administracao';

type Perfil = {
  id: string;
  nome: string;
  casa: string | null;
  quadra: string | null;
  tipo: string;
};

type MensagemBanco = {
  id: string;
  remetente_id: string;
  mensagem: string;
  criado_em: string;
};

type MensagemGeral = {
  id: string;
  autorId: string;
  autorNome: string;
  residencia?: string;
  autorTipo: AutorTipo;
  texto: string;
  horario: string;
  criadoEm: string;
};

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function formatarHorario(
  data: string
) {
  try {
    return new Date(
      data
    ).toLocaleTimeString(
      'pt-BR',
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  } catch {
    return '';
  }
}

function montarResidencia(
  perfil?: Perfil
) {
  if (!perfil) {
    return undefined;
  }

  const partes: string[] = [];

  if (perfil.casa) {
    partes.push(`Casa ${perfil.casa}`);
  }

  if (perfil.quadra) {
    partes.push(`Quadra ${perfil.quadra}`);
  }

  if (partes.length === 0) {
    return undefined;
  }

  return partes.join(' • ');
}

function tipoAdministrativo(
  tipo?: string
) {
  return (
    tipo === 'admin' ||
    tipo === 'sindico' ||
    tipo === 'subsindico'
  );
}

// =====================================================
// TELA
// =====================================================

export default function WebChatGeralScreen() {
  const [mensagens, setMensagens] =
    useState<MensagemGeral[]>([]);

  const [
    novaMensagem,
    setNovaMensagem,
  ] = useState('');

  const [
    usuarioAtualId,
    setUsuarioAtualId,
  ] = useState('');

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    enviando,
    setEnviando,
  ] = useState(false);

  const [
    excluindoId,
    setExcluindoId,
  ] = useState<string | null>(
    null
  );

  const [erro, setErro] =
    useState('');

  const [
    atualizando,
    setAtualizando,
  ] = useState(false);

  const scrollRef =
    useRef<ScrollView | null>(
      null
    );

  // ===================================================
  // INICIALIZAÇÃO
  // ===================================================

  useEffect(() => {
    iniciarChat();
  }, []);

  // ===================================================
  // ROLAGEM AUTOMÁTICA
  // ===================================================

  useEffect(() => {
    if (mensagens.length === 0) {
      return;
    }

    const timer = setTimeout(
      () => {
        scrollRef.current?.scrollToEnd({
          animated: true,
        });
      },
      100
    );

    return () =>
      clearTimeout(timer);
  }, [mensagens]);

  // ===================================================
  // INICIAR
  // ===================================================

  async function iniciarChat() {
    try {
      setCarregando(true);
      setErro('');

      const {
        data: userData,
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !userData.user
      ) {
        setErro(
          'Não foi possível identificar o usuário.'
        );
        return;
      }

      const usuarioId =
        userData.user.id;

      setUsuarioAtualId(
        usuarioId
      );

      const {
        data: perfil,
        error: perfilError,
      } = await supabase
        .from('perfis')
        .select(
          'id, nome, casa, quadra, tipo, ativo'
        )
        .eq('id', usuarioId)
        .maybeSingle();

      if (
        perfilError ||
        !perfil
      ) {
        setErro(
          'Perfil administrativo não encontrado.'
        );
        return;
      }

      if (
        !perfil.ativo ||
        !tipoAdministrativo(
          perfil.tipo
        )
      ) {
        setErro(
          'Este usuário não possui acesso ao Chat Geral administrativo.'
        );
        return;
      }

      await carregarMensagens(
        false
      );
    } catch (error) {
      console.error(
        'Erro ao iniciar Chat Geral:',
        error
      );

      setErro(
        'Não foi possível abrir o Chat Geral.'
      );
    } finally {
      setCarregando(false);
    }
  }

  // ===================================================
  // CARREGAR MENSAGENS
  // ===================================================

  async function carregarMensagens(
    mostrarCarregamento = true
  ) {
    try {
      if (mostrarCarregamento) {
        setAtualizando(true);
      }

      setErro('');

      const {
        data,
        error,
      } = await supabase
        .from(
          'chat_geral_mensagens'
        )
        .select(`
          id,
          remetente_id,
          mensagem,
          criado_em
        `)
        .order('criado_em', {
          ascending: true,
        });

      if (error) {
        console.error(
          'Erro ao carregar mensagens:',
          error
        );

        setErro(
          `Não foi possível carregar as mensagens: ${error.message}`
        );

        return;
      }

      const mensagensBanco =
        (data ??
          []) as MensagemBanco[];

      if (
        mensagensBanco.length ===
        0
      ) {
        setMensagens([]);
        return;
      }

      const ids =
        Array.from(
          new Set(
            mensagensBanco.map(
              (item) =>
                item.remetente_id
            )
          )
        );

      const {
        data: perfisData,
        error: perfisError,
      } = await supabase
        .from('perfis')
        .select(`
          id,
          nome,
          casa,
          quadra,
          tipo
        `)
        .in('id', ids);

      if (perfisError) {
        console.error(
          'Erro ao carregar perfis:',
          perfisError
        );

        setErro(
          `As mensagens foram encontradas, mas não foi possível carregar os autores: ${perfisError.message}`
        );

        return;
      }

      const perfis =
        (perfisData ??
          []) as Perfil[];

      const mapaPerfis =
        new Map<
          string,
          Perfil
        >();

      perfis.forEach(
        (perfil) => {
          mapaPerfis.set(
            perfil.id,
            perfil
          );
        }
      );

      const mensagensTela =
        mensagensBanco.map(
          (
            item
          ): MensagemGeral => {
            const perfil =
              mapaPerfis.get(
                item.remetente_id
              );

            const admin =
              tipoAdministrativo(
                perfil?.tipo
              );

            return {
              id: item.id,
              autorId:
                item.remetente_id,

              autorNome: admin
                ? 'Administração'
                : perfil?.nome ??
                  'Morador',

              residencia: admin
                ? undefined
                : montarResidencia(
                    perfil
                  ),

              autorTipo: admin
                ? 'administracao'
                : 'morador',

              texto:
                item.mensagem,

              horario:
                formatarHorario(
                  item.criado_em
                ),

              criadoEm:
                item.criado_em,
            };
          }
        );

      setMensagens(
        mensagensTela
      );
    } catch (error) {
      console.error(
        'Erro inesperado ao carregar mensagens:',
        error
      );

      setErro(
        'Não foi possível carregar as mensagens.'
      );
    } finally {
      if (mostrarCarregamento) {
        setAtualizando(false);
      }
    }
  }

  // ===================================================
  // ENVIAR
  // ===================================================

  async function enviarMensagem() {
    const texto =
      novaMensagem.trim();

    if (
      !texto ||
      enviando
    ) {
      return;
    }

    try {
      setEnviando(true);
      setErro('');

      const {
        data: userData,
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !userData.user
      ) {
        setErro(
          'Sua sessão não foi encontrada. Entre novamente.'
        );
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from(
          'chat_geral_mensagens'
        )
        .insert({
          remetente_id:
            userData.user.id,

          mensagem: texto,
        })
        .select(`
          id,
          remetente_id,
          mensagem,
          criado_em
        `)
        .single();

      if (error) {
        console.error(
          'Erro ao enviar mensagem:',
          error
        );

        setErro(
          `Não foi possível enviar a mensagem: ${error.message}`
        );

        return;
      }

      setNovaMensagem('');

      const nova: MensagemGeral =
        {
          id: data.id,

          autorId:
            data.remetente_id,

          autorNome:
            'Administração',

          autorTipo:
            'administracao',

          texto:
            data.mensagem,

          horario:
            formatarHorario(
              data.criado_em
            ),

          criadoEm:
            data.criado_em,
        };

      setMensagens(
        (atual) => [
          ...atual,
          nova,
        ]
      );
    } catch (error) {
      console.error(
        'Erro inesperado ao enviar mensagem:',
        error
      );

      setErro(
        'Não foi possível enviar a mensagem.'
      );
    } finally {
      setEnviando(false);
    }
  }

  // ===================================================
  // EXCLUIR
  // ADMIN PODE MODERAR QUALQUER MENSAGEM
  // ===================================================

  async function excluirMensagem(
    mensagem: MensagemGeral
  ) {
    if (excluindoId) {
      return;
    }

    const confirmar =
      typeof window !==
      'undefined'
        ? window.confirm(
            `Deseja excluir esta mensagem de ${mensagem.autorNome}?`
          )
        : true;

    if (!confirmar) {
      return;
    }

    try {
      setExcluindoId(
        mensagem.id
      );

      setErro('');

      const { error } =
        await supabase
          .from(
            'chat_geral_mensagens'
          )
          .delete()
          .eq(
            'id',
            mensagem.id
          );

      if (error) {
        console.error(
          'Erro ao excluir mensagem:',
          error
        );

        setErro(
          `Não foi possível excluir a mensagem: ${error.message}`
        );

        return;
      }

      setMensagens(
        (atual) =>
          atual.filter(
            (item) =>
              item.id !==
              mensagem.id
          )
      );
    } catch (error) {
      console.error(
        'Erro inesperado ao excluir mensagem:',
        error
      );

      setErro(
        'Não foi possível excluir a mensagem.'
      );
    } finally {
      setExcluindoId(null);
    }
  }

  // ===================================================
  // PARTICIPANTES
  // ===================================================

  const participantes =
    useMemo(() => {
      return new Set(
        mensagens.map(
          (item) =>
            item.autorId
        )
      ).size;
    }, [mensagens]);

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <View style={styles.container}>
      <WebSidebar
        active="chatGeral"
      />

      <View style={styles.content}>
        {/* CABEÇALHO */}

        <View style={styles.header}>
          <View>
            <Text
              style={styles.title}
            >
              Chat Geral
            </Text>

            <Text
              style={styles.subtitle}
            >
              Acompanhe e participe da conversa da comunidade.
            </Text>
          </View>

          <View
            style={
              styles.headerActions
            }
          >
            <Pressable
              style={
                styles.refreshButton
              }
              onPress={() =>
                carregarMensagens()
              }
              disabled={
                atualizando ||
                carregando
              }
            >
              {atualizando ? (
                <ActivityIndicator
                  size="small"
                  color={
                    colors.primary
                  }
                />
              ) : (
                <RefreshCw
                  size={16}
                  color={
                    colors.primary
                  }
                />
              )}

              <Text
                style={
                  styles.refreshText
                }
              >
                Atualizar
              </Text>
            </Pressable>

            <View
              style={
                styles.headerIcon
              }
            >
              <Users
                size={24}
                color={
                  colors.primary
                }
              />
            </View>
          </View>
        </View>

        {/* ERRO */}

        {!!erro && (
          <View
            style={styles.errorBox}
          >
            <Text
              style={styles.errorText}
            >
              {erro}
            </Text>
          </View>
        )}

        {/* INFORMAÇÕES */}

        <View style={styles.cards}>
          <View
            style={styles.infoCard}
          >
            <View
              style={styles.infoIcon}
            >
              <MessageSquare
                size={20}
                color={
                  colors.primary
                }
              />
            </View>

            <View>
              <Text
                style={
                  styles.infoValue
                }
              >
                {mensagens.length}
              </Text>

              <Text
                style={
                  styles.infoLabel
                }
              >
                Mensagens
              </Text>
            </View>
          </View>

          <View
            style={styles.infoCard}
          >
            <View
              style={styles.infoIcon}
            >
              <Users
                size={20}
                color={
                  colors.primary
                }
              />
            </View>

            <View>
              <Text
                style={
                  styles.infoValue
                }
              >
                {participantes}
              </Text>

              <Text
                style={
                  styles.infoLabel
                }
              >
                Participantes
              </Text>
            </View>
          </View>

          <View
            style={styles.infoCard}
          >
            <View
              style={styles.infoIcon}
            >
              <ShieldCheck
                size={20}
                color={
                  colors.primary
                }
              />
            </View>

            <View>
              <Text
                style={
                  styles.infoValue
                }
              >
                Administração
              </Text>

              <Text
                style={
                  styles.infoLabel
                }
              >
                Moderação ativa
              </Text>
            </View>
          </View>
        </View>

        {/* CHAT */}

        <View style={styles.chatCard}>
          <View
            style={styles.chatHeader}
          >
            <View>
              <Text
                style={
                  styles.chatHeaderTitle
                }
              >
                Comunidade ConectaLar
              </Text>

              <Text
                style={
                  styles.chatHeaderText
                }
              >
                Espaço de comunicação entre moradores e administração.
              </Text>
            </View>

            <View
              style={styles.onlineBox}
            >
              <View
                style={styles.onlineDot}
              />

              <Text
                style={styles.onlineText}
              >
                Chat geral
              </Text>
            </View>
          </View>

          {/* MENSAGENS */}

          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={
              styles.mensagens
            }
            showsVerticalScrollIndicator={
              false
            }
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd(
                {
                  animated: true,
                }
              )
            }
          >
            {carregando ? (
              <View
                style={styles.vazio}
              >
                <ActivityIndicator
                  size="large"
                  color={
                    colors.primary
                  }
                />

                <Text
                  style={
                    styles.vazioText
                  }
                >
                  Carregando mensagens...
                </Text>
              </View>
            ) : mensagens.length ===
              0 ? (
              <View
                style={styles.vazio}
              >
                <MessageSquare
                  size={42}
                  color={
                    colors.textLight
                  }
                />

                <Text
                  style={
                    styles.vazioTitle
                  }
                >
                  Nenhuma mensagem
                </Text>

                <Text
                  style={
                    styles.vazioText
                  }
                >
                  Seja o primeiro a enviar uma mensagem para a comunidade.
                </Text>
              </View>
            ) : (
              mensagens.map(
                (mensagem) => {
                  const admin =
                    mensagem.autorTipo ===
                    'administracao';

                  return (
                    <View
                      key={
                        mensagem.id
                      }
                      style={[
                        styles.mensagemLinha,

                        admin
                          ? styles.linhaAdmin
                          : styles.linhaMorador,
                      ]}
                    >
                      <View
                        style={[
                          styles.mensagemBox,

                          admin
                            ? styles.mensagemAdmin
                            : styles.mensagemMorador,
                        ]}
                      >
                        {/* AUTOR */}

                        <View
                          style={
                            styles.autorLinha
                          }
                        >
                          <View
                            style={[
                              styles.avatar,

                              admin &&
                                styles.avatarAdmin,
                            ]}
                          >
                            <Text
                              style={[
                                styles.avatarText,

                                admin &&
                                  styles.avatarTextAdmin,
                              ]}
                            >
                              {admin
                                ? 'A'
                                : mensagem.autorNome
                                    .charAt(
                                      0
                                    )
                                    .toUpperCase()}
                            </Text>
                          </View>

                          <View
                            style={
                              styles.autorInfo
                            }
                          >
                            <View
                              style={
                                styles.nomeLinha
                              }
                            >
                              <Text
                                style={[
                                  styles.autorNome,

                                  admin &&
                                    styles.textoAdmin,
                                ]}
                              >
                                {
                                  mensagem.autorNome
                                }
                              </Text>

                              {admin && (
                                <View
                                  style={
                                    styles.adminBadge
                                  }
                                >
                                  <Text
                                    style={
                                      styles.adminBadgeText
                                    }
                                  >
                                    ADM
                                  </Text>
                                </View>
                              )}
                            </View>

                            {!!mensagem.residencia && (
                              <Text
                                style={[
                                  styles.residencia,

                                  admin &&
                                    styles.textoAdminSecundario,
                                ]}
                              >
                                {
                                  mensagem.residencia
                                }
                              </Text>
                            )}
                          </View>

                          {/* ADMIN MODERA TODAS */}

                          <Pressable
                            style={
                              styles.deleteButton
                            }
                            onPress={() =>
                              excluirMensagem(
                                mensagem
                              )
                            }
                            disabled={
                              excluindoId ===
                              mensagem.id
                            }
                          >
                            {excluindoId ===
                            mensagem.id ? (
                              <ActivityIndicator
                                size="small"
                                color={
                                  admin
                                    ? '#FFFFFF'
                                    : colors.danger
                                }
                              />
                            ) : (
                              <Trash2
                                size={15}
                                color={
                                  admin
                                    ? '#FFFFFF'
                                    : colors.danger
                                }
                              />
                            )}
                          </Pressable>
                        </View>

                        {/* TEXTO */}

                        <Text
                          style={[
                            styles.mensagemTexto,

                            admin &&
                              styles.textoAdmin,
                          ]}
                        >
                          {mensagem.texto}
                        </Text>

                        <Text
                          style={[
                            styles.horario,

                            admin &&
                              styles.textoAdminSecundario,
                          ]}
                        >
                          {mensagem.horario}
                        </Text>
                      </View>
                    </View>
                  );
                }
              )
            )}
          </ScrollView>

          {/* ESCREVER */}

          <View
            style={styles.enviarArea}
          >
            <TextInput
              value={novaMensagem}
              onChangeText={
                setNovaMensagem
              }
              placeholder="Escreva uma mensagem para a comunidade..."
              placeholderTextColor={
                colors.textLight
              }
              style={styles.input}
              multiline
              maxLength={1000}
              editable={
                !enviando &&
                !carregando
              }
            />

            <Text
              style={
                styles.characterCount
              }
            >
              {novaMensagem.length}/1000
            </Text>

            <Pressable
              style={[
                styles.sendButton,

                (!novaMensagem.trim() ||
                  enviando ||
                  carregando) &&
                  styles.sendDisabled,
              ]}
              onPress={
                enviarMensagem
              }
              disabled={
                !novaMensagem.trim() ||
                enviando ||
                carregando
              }
            >
              {enviando ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Send
                  size={19}
                  color="#FFFFFF"
                />
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

// =====================================================
// ESTILOS
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor:
      colors.background,
  },

  content: {
    flex: 1,
    padding: 28,
    minWidth: 0,
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 20,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },

  subtitle: {
    fontSize: 13,
    color:
      colors.textSecondary,
    marginTop: 5,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor:
      colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  refreshButton: {
    height: 42,
    paddingHorizontal: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor:
      colors.border,
    backgroundColor:
      colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  refreshText: {
    marginLeft: 6,
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
  },

  // ===================================================
  // ERRO
  // ===================================================

  errorBox: {
    backgroundColor:
      colors.dangerLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 15,
  },

  errorText: {
    color: colors.danger,
    fontSize: 10,
    fontWeight: '700',
  },

  // ===================================================
  // CARDS
  // ===================================================

  cards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },

  infoCard: {
    minWidth: 190,
    backgroundColor:
      colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor:
      colors.border,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor:
      colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },

  infoLabel: {
    fontSize: 9,
    color:
      colors.textSecondary,
    marginTop: 2,
  },

  // ===================================================
  // CHAT
  // ===================================================

  chatCard: {
    flex: 1,
    minHeight: 520,
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius: 18,
    overflow: 'hidden',
  },

  chatHeader: {
    minHeight: 70,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  chatHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },

  chatHeaderText: {
    fontSize: 10,
    color:
      colors.textSecondary,
    marginTop: 3,
  },

  onlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      colors.background,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor:
      colors.primary,
    marginRight: 6,
  },

  onlineText: {
    fontSize: 9,
    fontWeight: '700',
    color:
      colors.textSecondary,
  },

  scroll: {
    flex: 1,
    backgroundColor:
      colors.background,
  },

  mensagens: {
    padding: 20,
  },

  mensagemLinha: {
    width: '100%',
    marginBottom: 13,
  },

  linhaAdmin: {
    alignItems: 'flex-end',
  },

  linhaMorador: {
    alignItems: 'flex-start',
  },

  mensagemBox: {
    width: 'auto',
    maxWidth: '70%',
    borderRadius: 15,
    padding: 13,
  },

  mensagemMorador: {
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderBottomLeftRadius: 4,
  },

  mensagemAdmin: {
    backgroundColor:
      colors.primary,
    borderBottomRightRadius: 4,
  },

  autorLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor:
      colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  avatarAdmin: {
    backgroundColor:
      'rgba(255,255,255,0.18)',
  },

  avatarText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },

  avatarTextAdmin: {
    color: '#FFFFFF',
  },

  autorInfo: {
    flex: 1,
  },

  nomeLinha: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  autorNome: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text,
  },

  residencia: {
    fontSize: 8,
    color:
      colors.textSecondary,
    marginTop: 1,
  },

  adminBadge: {
    marginLeft: 6,
    borderRadius: 5,
    backgroundColor:
      'rgba(255,255,255,0.18)',
    paddingHorizontal: 5,
    paddingVertical: 2,
  },

  adminBadgeText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '900',
  },

  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  mensagemTexto: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.text,
  },

  horario: {
    marginTop: 6,
    fontSize: 8,
    color:
      colors.textSecondary,
    textAlign: 'right',
  },

  textoAdmin: {
    color: '#FFFFFF',
  },

  textoAdminSecundario: {
    color:
      'rgba(255,255,255,0.72)',
  },

  // ===================================================
  // ENVIAR
  // ===================================================

  enviarArea: {
    minHeight: 76,
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 90,
    borderRadius: 12,
    borderWidth: 1,
    borderColor:
      colors.border,
    backgroundColor:
      colors.background,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 12,
    color: colors.text,
    outlineStyle: 'none',
  } as any,

  characterCount: {
    marginLeft: 8,
    fontSize: 8,
    color:
      colors.textLight,
  },

  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor:
      colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  sendDisabled: {
    opacity: 0.45,
  },

  // ===================================================
  // VAZIO
  // ===================================================

  vazio: {
    minHeight: 350,
    alignItems: 'center',
    justifyContent: 'center',
  },

  vazioTitle: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },

  vazioText: {
    marginTop: 7,
    fontSize: 10,
    color:
      colors.textSecondary,
  },
});