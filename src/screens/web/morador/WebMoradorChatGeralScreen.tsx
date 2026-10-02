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
  CheckCheck,
  Circle,
  Info,
  MessageCircle,
  MessagesSquare,
  RefreshCw,
  Send,
  User,
  Users,
} from 'lucide-react-native';

import { colors } from '../../../theme/theme';
import WebMoradorSidebar from '../../../components/WebMoradorSidebar';
import { supabase } from '../../../services/supabase';

// =====================================================
// TIPOS
// =====================================================

type Perfil = {
  id: string;
  nome: string;
  casa: string | null;
  quadra: string | null;
  tipo: string;
  ativo?: boolean;
};

type MensagemBanco = {
  id: string;
  remetente_id: string;
  mensagem: string;
  criado_em: string;
};

type Mensagem = {
  id: string;
  autorId: string;
  nome: string;
  residencia: string;
  mensagem: string;
  horario: string;
  minha: boolean;
  administracao: boolean;
  criadoEm: string;
};

// =====================================================
// FUNÇÕES
// =====================================================

function formatarHorario(data: string) {
  try {
    return new Date(data).toLocaleTimeString(
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
    return '';
  }

  const partes: string[] = [];

  if (perfil.casa) {
    partes.push(`Casa ${perfil.casa}`);
  }

  if (perfil.quadra) {
    partes.push(`Quadra ${perfil.quadra}`);
  }

  return partes.join(' • ');
}

function ehAdministracao(tipo?: string) {
  return (
    tipo === 'admin' ||
    tipo === 'sindico' ||
    tipo === 'subsindico'
  );
}

// =====================================================
// TELA
// =====================================================

export default function WebMoradorChatGeralScreen() {
  const [mensagens, setMensagens] =
    useState<Mensagem[]>([]);

  const [texto, setTexto] =
    useState('');

  const [usuarioId, setUsuarioId] =
    useState('');

  const [carregando, setCarregando] =
    useState(true);

  const [atualizando, setAtualizando] =
    useState(false);

  const [enviando, setEnviando] =
    useState(false);

  const [erro, setErro] =
    useState('');

  const scrollRef =
    useRef<ScrollView | null>(null);

  // ===================================================
  // INICIAR
  // ===================================================

  useEffect(() => {
    iniciarChat();
  }, []);

  // ===================================================
  // ROLAR PARA ÚLTIMA MENSAGEM
  // ===================================================

  useEffect(() => {
    if (mensagens.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({
        animated: true,
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [mensagens]);

  // ===================================================
  // INICIALIZAÇÃO
  // ===================================================

  async function iniciarChat() {
    try {
      setCarregando(true);
      setErro('');

      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (
        userError ||
        !userData.user
      ) {
        setErro(
          'Não foi possível identificar o morador.'
        );
        return;
      }

      const id = userData.user.id;

      const {
        data: perfil,
        error: perfilError,
      } = await supabase
        .from('perfis')
        .select(`
          id,
          nome,
          casa,
          quadra,
          tipo,
          ativo
        `)
        .eq('id', id)
        .maybeSingle();

      if (
        perfilError ||
        !perfil
      ) {
        setErro(
          'Perfil do morador não encontrado.'
        );
        return;
      }

      if (
        perfil.tipo !== 'morador' ||
        !perfil.ativo
      ) {
        setErro(
          'Este usuário não possui acesso ao Chat Geral dos moradores.'
        );
        return;
      }

      setUsuarioId(id);

      await carregarMensagens(
        id,
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
    idAtual?: string,
    mostrarCarregamento = true
  ) {
    try {
      if (mostrarCarregamento) {
        setAtualizando(true);
      }

      setErro('');

      let id = idAtual || usuarioId;

      if (!id) {
        const {
          data: userData,
        } = await supabase.auth.getUser();

        id =
          userData.user?.id ?? '';
      }

      if (!id) {
        setErro(
          'Sua sessão não foi encontrada.'
        );
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from('chat_geral_mensagens')
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
          'Erro ao carregar Chat Geral:',
          error
        );

        setErro(
          `Não foi possível carregar as mensagens: ${error.message}`
        );
        return;
      }

      const mensagensBanco =
        (data ?? []) as MensagemBanco[];

      if (
        mensagensBanco.length === 0
      ) {
        setMensagens([]);
        return;
      }

      const idsAutores = Array.from(
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
        .in('id', idsAutores);

      if (perfisError) {
        console.error(
          'Erro ao carregar autores:',
          perfisError
        );

        setErro(
          `Não foi possível carregar os autores das mensagens: ${perfisError.message}`
        );
        return;
      }

      const perfis =
        (perfisData ?? []) as Perfil[];

      const mapaPerfis =
        new Map<string, Perfil>();

      perfis.forEach((perfil) => {
        mapaPerfis.set(
          perfil.id,
          perfil
        );
      });

      const mensagensTela =
        mensagensBanco.map(
          (item): Mensagem => {
            const perfil =
              mapaPerfis.get(
                item.remetente_id
              );

            const minha =
              item.remetente_id === id;

            const administracao =
              ehAdministracao(
                perfil?.tipo
              );

            let nome =
              perfil?.nome ??
              'Usuário';

            let residencia =
              montarResidencia(
                perfil
              );

            if (minha) {
              nome = 'Você';

              residencia =
                residencia ||
                'Minha residência';
            }

            if (administracao) {
              nome =
                minha
                  ? 'Você'
                  : 'Administração';

              residencia =
                'Administração';
            }

            return {
              id: item.id,
              autorId:
                item.remetente_id,

              nome,

              residencia,

              mensagem:
                item.mensagem,

              horario:
                formatarHorario(
                  item.criado_em
                ),

              minha,

              administracao,

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
        'Erro inesperado ao carregar Chat Geral:',
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
  // ENVIAR MENSAGEM
  // ===================================================

  async function enviarMensagem() {
    const mensagemLimpa =
      texto.trim();

    if (
      !mensagemLimpa ||
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
      } = await supabase.auth.getUser();

      if (
        userError ||
        !userData.user
      ) {
        setErro(
          'Sua sessão não foi encontrada. Entre novamente.'
        );
        return;
      }

      const id =
        userData.user.id;

      const {
        data,
        error,
      } = await supabase
        .from('chat_geral_mensagens')
        .insert({
          remetente_id: id,
          mensagem:
            mensagemLimpa,
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

      const {
        data: perfil,
      } = await supabase
        .from('perfis')
        .select(`
          id,
          nome,
          casa,
          quadra,
          tipo
        `)
        .eq('id', id)
        .maybeSingle();

      const novaMensagem: Mensagem = {
        id: data.id,

        autorId:
          data.remetente_id,

        nome: 'Você',

        residencia:
          montarResidencia(
            perfil as Perfil
          ) ||
          'Minha residência',

        mensagem:
          data.mensagem,

        horario:
          formatarHorario(
            data.criado_em
          ),

        minha: true,

        administracao: false,

        criadoEm:
          data.criado_em,
      };

      setMensagens((atual) => [
        ...atual,
        novaMensagem,
      ]);

      setTexto('');
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
      <WebMoradorSidebar
        active="chatGeral"
      />

      <View style={styles.content}>
        {/* CABEÇALHO */}

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Chat Geral
            </Text>

            <Text style={styles.subtitle}>
              Converse com os moradores do condomínio.
            </Text>
          </View>

          <View style={styles.headerRight}>
            <Pressable
              style={styles.refreshButton}
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
                  size={15}
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
                styles.onlineBadge
              }
            >
              <Circle
                size={8}
                color="#15803D"
                fill="#15803D"
              />

              <Text
                style={
                  styles.onlineText
                }
              >
                Chat disponível
              </Text>
            </View>
          </View>
        </View>

        {!!erro && (
          <View style={styles.errorBox}>
            <Text
              style={styles.errorText}
            >
              {erro}
            </Text>
          </View>
        )}

        {/* CONTEÚDO */}

        <View
          style={styles.chatLayout}
        >
          {/* PAINEL ESQUERDO */}

          <View
            style={styles.infoPanel}
          >
            <View
              style={styles.groupIcon}
            >
              <Users
                size={29}
                color={
                  colors.primary
                }
              />
            </View>

            <Text
              style={styles.groupTitle}
            >
              Comunidade
            </Text>

            <Text
              style={
                styles.groupDescription
              }
            >
              Espaço para comunicação entre os moradores do condomínio.
            </Text>

            <View
              style={styles.divider}
            />

            <View
              style={styles.infoItem}
            >
              <Text
                style={styles.infoLabel}
              >
                Canal
              </Text>

              <Text
                style={styles.infoValue}
              >
                Chat Geral
              </Text>
            </View>

            <View
              style={styles.infoItem}
            >
              <Text
                style={styles.infoLabel}
              >
                Participantes
              </Text>

              <Text
                style={styles.infoValue}
              >
                {participantes}
              </Text>
            </View>

            <View
              style={styles.infoItem}
            >
              <Text
                style={styles.infoLabel}
              >
                Mensagens
              </Text>

              <Text
                style={styles.infoValue}
              >
                {mensagens.length}
              </Text>
            </View>

            <View
              style={styles.noticeBox}
            >
              <Info
                size={17}
                color={
                  colors.primary
                }
              />

              <Text
                style={
                  styles.noticeTitle
                }
              >
                Convivência
              </Text>

              <Text
                style={
                  styles.noticeText
                }
              >
                Mantenha uma comunicação respeitosa com os demais moradores.
              </Text>
            </View>
          </View>

          {/* CHAT */}

          <View
            style={styles.chatBox}
          >
            <View
              style={
                styles.chatHeader
              }
            >
              <View
                style={
                  styles.chatHeaderIcon
                }
              >
                <MessagesSquare
                  size={20}
                  color="#FFFFFF"
                />
              </View>

              <View
                style={
                  styles.chatHeaderInfo
                }
              >
                <Text
                  style={
                    styles.chatHeaderTitle
                  }
                >
                  Chat Geral do condomínio
                </Text>

                <View
                  style={
                    styles.chatStatus
                  }
                >
                  <Circle
                    size={7}
                    color="#15803D"
                    fill="#15803D"
                  />

                  <Text
                    style={
                      styles.chatStatusText
                    }
                  >
                    Comunidade de moradores
                  </Text>
                </View>
              </View>
            </View>

            {/* MENSAGENS */}

            <ScrollView
              ref={scrollRef}
              style={
                styles.messagesArea
              }
              contentContainerStyle={
                styles.messagesContent
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
              <View
                style={styles.dateBadge}
              >
                <Text
                  style={
                    styles.dateBadgeText
                  }
                >
                  Hoje
                </Text>
              </View>

              {carregando ? (
                <View
                  style={styles.empty}
                >
                  <ActivityIndicator
                    size="large"
                    color={
                      colors.primary
                    }
                  />

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    Carregando mensagens...
                  </Text>
                </View>
              ) : mensagens.length ===
                0 ? (
                <View
                  style={styles.empty}
                >
                  <MessageCircle
                    size={36}
                    color={
                      colors.textLight
                    }
                  />

                  <Text
                    style={
                      styles.emptyTitle
                    }
                  >
                    Nenhuma mensagem
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    Seja o primeiro a conversar no Chat Geral.
                  </Text>
                </View>
              ) : (
                mensagens.map(
                  (mensagem) => (
                    <View
                      key={
                        mensagem.id
                      }
                      style={[
                        styles.messageRow,

                        mensagem.minha
                          ? styles.messageRowMine
                          : styles.messageRowOther,
                      ]}
                    >
                      {!mensagem.minha && (
                        <View
                          style={
                            styles.avatar
                          }
                        >
                          <User
                            size={15}
                            color={
                              colors.primary
                            }
                          />
                        </View>
                      )}

                      <View
                        style={[
                          styles.messageContainer,

                          mensagem.minha &&
                            styles.messageContainerMine,
                        ]}
                      >
                        {!mensagem.minha && (
                          <View
                            style={
                              styles.senderHeader
                            }
                          >
                            <Text
                              style={
                                styles.senderName
                              }
                            >
                              {
                                mensagem.nome
                              }
                            </Text>

                            <Text
                              style={
                                styles.senderResidence
                              }
                            >
                              {
                                mensagem.residencia
                              }
                            </Text>
                          </View>
                        )}

                        <View
                          style={[
                            styles.messageBubble,

                            mensagem.minha
                              ? styles.myBubble
                              : styles.otherBubble,

                            mensagem.administracao &&
                              !mensagem.minha &&
                              styles.adminBubble,
                          ]}
                        >
                          <Text
                            style={[
                              styles.messageText,

                              mensagem.minha &&
                                styles.myMessageText,
                            ]}
                          >
                            {
                              mensagem.mensagem
                            }
                          </Text>

                          <View
                            style={
                              styles.messageFooter
                            }
                          >
                            <Text
                              style={[
                                styles.messageTime,

                                mensagem.minha &&
                                  styles.myMessageTime,
                              ]}
                            >
                              {
                                mensagem.horario
                              }
                            </Text>

                            {mensagem.minha && (
                              <CheckCheck
                                size={13}
                                color="#FFFFFF"
                              />
                            )}
                          </View>
                        </View>
                      </View>

                      {mensagem.minha && (
                        <View
                          style={[
                            styles.avatar,
                            styles.myAvatar,
                          ]}
                        >
                          <User
                            size={15}
                            color="#FFFFFF"
                          />
                        </View>
                      )}
                    </View>
                  )
                )
              )}
            </ScrollView>

            {/* CAMPO */}

            <View
              style={styles.inputArea}
            >
              <View
                style={
                  styles.inputContainer
                }
              >
                <TextInput
                  style={styles.input}
                  value={texto}
                  onChangeText={setTexto}
                  placeholder="Escreva uma mensagem para os moradores..."
                  placeholderTextColor={
                    colors.textLight
                  }
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
                  {texto.length}/1000
                </Text>
              </View>

              <Pressable
                style={[
                  styles.sendButton,

                  (!texto.trim() ||
                    enviando ||
                    carregando) &&
                    styles.sendButtonDisabled,
                ]}
                onPress={
                  enviarMensagem
                }
                disabled={
                  !texto.trim() ||
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
                    size={18}
                    color="#FFFFFF"
                  />
                )}
              </Pressable>
            </View>

            <View
              style={styles.inputFooter}
            >
              <Text
                style={
                  styles.inputFooterText
                }
              >
                As mensagens deste canal poderão ser visualizadas pelos moradores e pela administração.
              </Text>
            </View>
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
    minWidth: 0,
    padding: 30,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 24,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },

  subtitle: {
    color:
      colors.textSecondary,
    fontSize: 11,
    marginTop: 5,
  },

  refreshButton: {
    minHeight: 35,
    paddingHorizontal: 12,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor:
      colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 9,
  },

  refreshText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 6,
  },

  onlineBadge: {
    minHeight: 35,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: '#DCFCE7',
    flexDirection: 'row',
    alignItems: 'center',
  },

  onlineText: {
    color: '#15803D',
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 6,
  },

  errorBox: {
    backgroundColor:
      colors.dangerLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },

  errorText: {
    color: colors.danger,
    fontSize: 9,
    fontWeight: '700',
  },

  chatLayout: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
  },

  infoPanel: {
    width: 260,
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    marginRight: 18,
  },

  groupIcon: {
    width: 58,
    height: 58,
    borderRadius: 17,
    backgroundColor:
      colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  groupTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },

  groupDescription: {
    color:
      colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
    marginTop: 7,
  },

  divider: {
    height: 1,
    backgroundColor:
      colors.border,
    marginVertical: 18,
  },

  infoItem: {
    marginBottom: 14,
  },

  infoLabel: {
    color:
      colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
  },

  infoValue: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 3,
  },

  noticeBox: {
    backgroundColor:
      colors.primaryLight,
    borderRadius: 11,
    padding: 12,
    marginTop: 5,
  },

  noticeTitle: {
    color: colors.text,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 7,
  },

  noticeText: {
    color:
      colors.textSecondary,
    fontSize: 8,
    lineHeight: 14,
    marginTop: 4,
  },

  chatBox: {
    flex: 1,
    minWidth: 0,
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: 'hidden',
  },

  chatHeader: {
    minHeight: 72,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  chatHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor:
      colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  chatHeaderInfo: {
    flex: 1,
  },

  chatHeaderTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },

  chatStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  chatStatusText: {
    color:
      colors.textSecondary,
    fontSize: 8,
    marginLeft: 5,
  },

  messagesArea: {
    flex: 1,
    backgroundColor:
      colors.background,
  },

  messagesContent: {
    padding: 20,
    paddingBottom: 30,
  },

  dateBadge: {
    alignSelf: 'center',
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 5,
    marginBottom: 20,
  },

  dateBadgeText: {
    color:
      colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
  },

  messageRow: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },

  messageRowMine: {
    justifyContent: 'flex-end',
  },

  messageRowOther: {
    justifyContent: 'flex-start',
  },

  avatar: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor:
      colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  myAvatar: {
    backgroundColor:
      colors.primary,
    marginRight: 0,
    marginLeft: 8,
  },

  messageContainer: {
    maxWidth: '70%',
  },

  messageContainerMine: {
    alignItems: 'flex-end',
  },

  senderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    marginLeft: 3,
  },

  senderName: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: '800',
  },

  senderResidence: {
    color: colors.textLight,
    fontSize: 7,
    marginLeft: 7,
  },

  messageBubble: {
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },

  otherBubble: {
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },

  adminBubble: {
    borderColor:
      colors.primary,
  },

  myBubble: {
    backgroundColor:
      colors.primary,
    borderBottomRightRadius: 4,
  },

  messageText: {
    color: colors.text,
    fontSize: 10,
    lineHeight: 16,
  },

  myMessageText: {
    color: '#FFFFFF',
  },

  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
  },

  messageTime: {
    color:
      colors.textSecondary,
    fontSize: 7,
    marginRight: 4,
  },

  myMessageTime: {
    color:
      'rgba(255,255,255,0.75)',
  },

  inputArea: {
    minHeight: 76,
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
    backgroundColor:
      colors.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  inputContainer: {
    flex: 1,
    minHeight: 45,
    maxHeight: 90,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor:
      colors.background,
    flexDirection: 'row',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    minHeight: 43,
    maxHeight: 85,
    color: colors.text,
    fontSize: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,

    outlineStyle: 'none',
  } as any,

  characterCount: {
    color: colors.textLight,
    fontSize: 7,
    marginRight: 10,
  },

  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor:
      colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 9,
  },

  sendButtonDisabled: {
    opacity: 0.45,
  },

  inputFooter: {
    minHeight: 27,
    backgroundColor:
      colors.surface,
    paddingHorizontal: 17,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  inputFooterText: {
    color: colors.textLight,
    fontSize: 7,
  },

  empty: {
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 10,
  },

  emptyText: {
    color:
      colors.textSecondary,
    fontSize: 9,
    marginTop: 5,
  },
});