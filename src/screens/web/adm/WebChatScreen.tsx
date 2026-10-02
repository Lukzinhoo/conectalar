import React, {
  useCallback,
  useEffect,
  useMemo,
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
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  User,
} from 'lucide-react-native';

import WebSidebar from '../../../components/WebSidebar';
import { colors } from '../../../theme/theme';
import { supabase } from '../../../services/supabase';

type MensagemBanco = {
  id: string;
  morador_id: string;
  remetente_id: string;
  remetente_tipo: 'morador' | 'administracao';
  mensagem: string;
  lida: boolean;
  criado_em: string;
};

type PerfilMorador = {
  id: string;
  nome: string;
  casa: string | null;
  quadra: string | null;
};

type Conversa = {
  id: string;
  morador: string;
  residencia: string;
  ultimaMensagem: string;
  horario: string;
  naoLidas: number;
};

function formatarHorario(data: string) {
  try {
    const dataMensagem = new Date(data);
    const hoje = new Date();

    const mesmaData =
      dataMensagem.getDate() === hoje.getDate() &&
      dataMensagem.getMonth() === hoje.getMonth() &&
      dataMensagem.getFullYear() === hoje.getFullYear();

    if (mesmaData) {
      return dataMensagem.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return dataMensagem.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  } catch {
    return '';
  }
}

function formatarHorarioMensagem(data: string) {
  try {
    return new Date(data).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function montarResidencia(perfil: PerfilMorador) {
  const casa = perfil.casa?.trim();
  const quadra = perfil.quadra?.trim();

  if (casa && quadra) {
    return `${casa} • ${quadra}`;
  }

  if (casa) {
    return casa;
  }

  if (quadra) {
    return quadra;
  }

  return 'Residência não informada';
}

export default function WebChatScreen() {
  const [conversas, setConversas] = useState<Conversa[]>([]);

  const [
    conversaSelecionada,
    setConversaSelecionada,
  ] = useState<string | null>(null);

  const [mensagens, setMensagens] = useState<
    Record<string, MensagemBanco[]>
  >({});

  const [busca, setBusca] = useState('');
  const [novaMensagem, setNovaMensagem] = useState('');

  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const carregarChat = useCallback(async () => {
    try {
      setCarregando(true);
      setErro('');

      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        setErro('Sua sessão não foi encontrada.');
        return;
      }

      const {
        data: perfilAdmin,
        error: perfilAdminError,
      } = await supabase
        .from('perfis')
        .select('id, tipo, ativo')
        .eq('id', userData.user.id)
        .maybeSingle();

      if (perfilAdminError) {
        console.error(
          'ERRO PERFIL ADMIN:',
          perfilAdminError
        );

        setErro(
          'Não foi possível verificar o perfil administrativo.'
        );

        return;
      }

      if (
        !perfilAdmin ||
        !perfilAdmin.ativo ||
        !['admin', 'sindico', 'subsindico'].includes(
          perfilAdmin.tipo
        )
      ) {
        setErro(
          'Esta conta não possui acesso ao chat administrativo.'
        );

        return;
      }

      const {
        data: mensagensData,
        error: mensagensError,
      } = await supabase
        .from('chat_mensagens')
        .select(`
          id,
          morador_id,
          remetente_id,
          remetente_tipo,
          mensagem,
          lida,
          criado_em
        `)
        .order('criado_em', {
          ascending: true,
        });

      if (mensagensError) {
        console.error(
          'ERRO AO CARREGAR CHAT:',
          mensagensError
        );

        setErro(
          `Não foi possível carregar o chat: ${mensagensError.message}`
        );

        return;
      }

      const lista =
        (mensagensData ?? []) as MensagemBanco[];

      if (lista.length === 0) {
        setConversas([]);
        setMensagens({});
        setConversaSelecionada(null);
        return;
      }

      const idsMoradores = [
        ...new Set(
          lista.map((item) => item.morador_id)
        ),
      ];

      const {
        data: perfisData,
        error: perfisError,
      } = await supabase
        .from('perfis')
        .select(`
          id,
          nome,
          casa,
          quadra
        `)
        .in('id', idsMoradores);

      if (perfisError) {
        console.error(
          'ERRO AO CARREGAR MORADORES:',
          perfisError
        );

        setErro(
          `Não foi possível carregar os moradores: ${perfisError.message}`
        );

        return;
      }

      const perfis =
        (perfisData ?? []) as PerfilMorador[];

      const mapaPerfis = new Map(
        perfis.map((perfil) => [
          perfil.id,
          perfil,
        ])
      );

      const mensagensPorMorador: Record<
        string,
        MensagemBanco[]
      > = {};

      lista.forEach((mensagem) => {
        if (!mensagensPorMorador[mensagem.morador_id]) {
          mensagensPorMorador[mensagem.morador_id] = [];
        }

        mensagensPorMorador[mensagem.morador_id].push(
          mensagem
        );
      });

      const novasConversas: Conversa[] =
        Object.entries(mensagensPorMorador)
          .map(([moradorId, listaMensagens]) => {
            const perfil = mapaPerfis.get(moradorId);

            const ultima =
              listaMensagens[
                listaMensagens.length - 1
              ];

            const naoLidas =
              listaMensagens.filter(
                (mensagem) =>
                  mensagem.remetente_tipo ===
                    'morador' &&
                  !mensagem.lida
              ).length;

            return {
              id: moradorId,

              morador:
                perfil?.nome ??
                'Morador',

              residencia: perfil
                ? montarResidencia(perfil)
                : 'Residência não informada',

              ultimaMensagem:
                ultima?.mensagem ?? '',

              horario: ultima
                ? formatarHorario(
                    ultima.criado_em
                  )
                : '',

              naoLidas,
            };
          })
          .sort((a, b) => {
            const mensagensA =
              mensagensPorMorador[a.id];

            const mensagensB =
              mensagensPorMorador[b.id];

            const ultimaA =
              mensagensA[
                mensagensA.length - 1
              ];

            const ultimaB =
              mensagensB[
                mensagensB.length - 1
              ];

            return (
              new Date(
                ultimaB.criado_em
              ).getTime() -
              new Date(
                ultimaA.criado_em
              ).getTime()
            );
          });

      setMensagens(mensagensPorMorador);
      setConversas(novasConversas);

      setConversaSelecionada((atual) => {
        if (
          atual &&
          novasConversas.some(
            (item) => item.id === atual
          )
        ) {
          return atual;
        }

        return novasConversas[0]?.id ?? null;
      });
    } catch (error) {
      console.error(
        'ERRO INESPERADO CHAT ADMIN:',
        error
      );

      setErro(
        'Ocorreu um erro ao carregar o chat.'
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarChat();
  }, [carregarChat]);

  const conversaAtual = conversas.find(
    (item) =>
      item.id === conversaSelecionada
  );

  const mensagensAtuais =
    conversaSelecionada
      ? mensagens[conversaSelecionada] ?? []
      : [];

  const conversasFiltradas = useMemo(() => {
    const termo = busca
      .trim()
      .toLowerCase();

    if (!termo) {
      return conversas;
    }

    return conversas.filter(
      (item) =>
        item.morador
          .toLowerCase()
          .includes(termo) ||
        item.residencia
          .toLowerCase()
          .includes(termo)
    );
  }, [busca, conversas]);

  async function selecionarConversa(id: string) {
    setConversaSelecionada(id);

    const lista = mensagens[id] ?? [];

    const idsNaoLidas = lista
      .filter(
        (item) =>
          item.remetente_tipo === 'morador' &&
          !item.lida
      )
      .map((item) => item.id);

    if (idsNaoLidas.length === 0) {
      return;
    }

    const { error } = await supabase
      .from('chat_mensagens')
      .update({
        lida: true,
      })
      .in('id', idsNaoLidas);

    if (error) {
      console.error(
        'ERRO AO MARCAR COMO LIDA:',
        error
      );

      return;
    }

    setMensagens((atual) => ({
      ...atual,

      [id]: (atual[id] ?? []).map(
        (item) =>
          idsNaoLidas.includes(item.id)
            ? {
                ...item,
                lida: true,
              }
            : item
      ),
    }));

    setConversas((atual) =>
      atual.map((item) =>
        item.id === id
          ? {
              ...item,
              naoLidas: 0,
            }
          : item
      )
    );
  }

  async function enviarMensagem() {
    const texto = novaMensagem.trim();

    if (
      !texto ||
      !conversaSelecionada ||
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

      if (userError || !userData.user) {
        setErro(
          'Sua sessão não foi encontrada.'
        );

        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from('chat_mensagens')
        .insert({
          morador_id:
            conversaSelecionada,

          remetente_id:
            userData.user.id,

          remetente_tipo:
            'administracao',

          mensagem: texto,

          lida: false,
        })
        .select(`
          id,
          morador_id,
          remetente_id,
          remetente_tipo,
          mensagem,
          lida,
          criado_em
        `)
        .single();

      if (error) {
        console.error(
          'ERRO AO ENVIAR MENSAGEM:',
          error
        );

        setErro(
          `Não foi possível enviar a mensagem: ${error.message}`
        );

        return;
      }

      const mensagem =
        data as MensagemBanco;

      setMensagens((atual) => ({
        ...atual,

        [conversaSelecionada]: [
          ...(atual[
            conversaSelecionada
          ] ?? []),

          mensagem,
        ],
      }));

      setConversas((atual) =>
        atual
          .map((item) =>
            item.id ===
            conversaSelecionada
              ? {
                  ...item,
                  ultimaMensagem:
                    mensagem.mensagem,
                  horario:
                    formatarHorario(
                      mensagem.criado_em
                    ),
                }
              : item
          )
      );

      setNovaMensagem('');
    } catch (error) {
      console.error(
        'ERRO INESPERADO AO ENVIAR:',
        error
      );

      setErro(
        'Ocorreu um erro ao enviar a mensagem.'
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={styles.container}>
      <WebSidebar active="chat" />

      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Chat
            </Text>

            <Text style={styles.subtitle}>
              Converse diretamente com os moradores.
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              style={styles.refreshButton}
              onPress={carregarChat}
            >
              <RefreshCw
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>

            <View style={styles.headerIcon}>
              <MessageCircle
                size={24}
                color={colors.primary}
              />
            </View>
          </View>
        </View>

        {!!erro && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              {erro}
            </Text>
          </View>
        )}

        <View style={styles.chatContainer}>
          <View style={styles.conversasArea}>
            <View style={styles.conversasHeader}>
              <Text style={styles.sectionTitle}>
                Conversas
              </Text>

              <Text style={styles.totalText}>
                {conversas.length}{' '}
                {conversas.length === 1
                  ? 'morador'
                  : 'moradores'}
              </Text>
            </View>

            <View style={styles.searchBox}>
              <Search
                size={17}
                color={colors.textSecondary}
              />

              <TextInput
                value={busca}
                onChangeText={setBusca}
                placeholder="Buscar morador..."
                placeholderTextColor={
                  colors.textLight
                }
                style={styles.searchInput}
              />
            </View>

            <ScrollView
              style={styles.listaConversas}
              showsVerticalScrollIndicator={false}
            >
              {carregando ? (
                <View style={styles.listaVazia}>
                  <ActivityIndicator
                    size="small"
                    color={colors.primary}
                  />

                  <Text style={styles.listaVaziaText}>
                    Carregando conversas...
                  </Text>
                </View>
              ) : conversasFiltradas.length ===
                0 ? (
                <View style={styles.listaVazia}>
                  <MessageCircle
                    size={30}
                    color={colors.textLight}
                  />

                  <Text style={styles.listaVaziaText}>
                    Nenhuma conversa encontrada.
                  </Text>
                </View>
              ) : (
                conversasFiltradas.map(
                  (item) => {
                    const ativa =
                      item.id ===
                      conversaSelecionada;

                    return (
                      <Pressable
                        key={item.id}
                        style={[
                          styles.conversaItem,

                          ativa &&
                            styles.conversaItemAtiva,
                        ]}
                        onPress={() =>
                          selecionarConversa(
                            item.id
                          )
                        }
                      >
                        <View
                          style={[
                            styles.avatar,

                            ativa &&
                              styles.avatarAtivo,
                          ]}
                        >
                          <User
                            size={20}
                            color={
                              ativa
                                ? '#FFFFFF'
                                : colors.primary
                            }
                          />
                        </View>

                        <View
                          style={
                            styles.conversaInfo
                          }
                        >
                          <View
                            style={
                              styles.conversaLinha
                            }
                          >
                            <Text
                              numberOfLines={1}
                              style={[
                                styles.moradorNome,

                                ativa &&
                                  styles.textoAtivo,
                              ]}
                            >
                              {item.morador}
                            </Text>

                            <Text
                              style={[
                                styles.horarioLista,

                                ativa &&
                                  styles.textoAtivoSecundario,
                              ]}
                            >
                              {item.horario}
                            </Text>
                          </View>

                          <Text
                            style={[
                              styles.residencia,

                              ativa &&
                                styles.textoAtivoSecundario,
                            ]}
                          >
                            {item.residencia}
                          </Text>

                          <View
                            style={
                              styles.previewLinha
                            }
                          >
                            <Text
                              numberOfLines={1}
                              style={[
                                styles.preview,

                                ativa &&
                                  styles.textoAtivoSecundario,
                              ]}
                            >
                              {
                                item.ultimaMensagem
                              }
                            </Text>

                            {item.naoLidas >
                              0 && (
                              <View
                                style={
                                  styles.badge
                                }
                              >
                                <Text
                                  style={
                                    styles.badgeText
                                  }
                                >
                                  {
                                    item.naoLidas
                                  }
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </Pressable>
                    );
                  }
                )
              )}
            </ScrollView>
          </View>

          <View style={styles.mensagensArea}>
            {conversaAtual ? (
              <>
                <View
                  style={
                    styles.mensagemHeader
                  }
                >
                  <View
                    style={
                      styles.avatarGrande
                    }
                  >
                    <User
                      size={22}
                      color={colors.primary}
                    />
                  </View>

                  <View>
                    <Text
                      style={
                        styles.mensagemNome
                      }
                    >
                      {
                        conversaAtual.morador
                      }
                    </Text>

                    <Text
                      style={
                        styles.mensagemResidencia
                      }
                    >
                      {
                        conversaAtual.residencia
                      }
                    </Text>
                  </View>
                </View>

                <ScrollView
                  style={
                    styles.mensagensScroll
                  }
                  contentContainerStyle={
                    styles.mensagensContent
                  }
                  showsVerticalScrollIndicator={
                    false
                  }
                >
                  {mensagensAtuais.map(
                    (mensagem) => {
                      const admin =
                        mensagem.remetente_tipo ===
                        'administracao';

                      return (
                        <View
                          key={mensagem.id}
                          style={[
                            styles.mensagemLinha,

                            admin
                              ? styles.mensagemLinhaAdmin
                              : styles.mensagemLinhaMorador,
                          ]}
                        >
                          <View
                            style={[
                              styles.balao,

                              admin
                                ? styles.balaoAdmin
                                : styles.balaoMorador,
                            ]}
                          >
                            <Text
                              style={[
                                styles.mensagemTexto,

                                admin &&
                                  styles.mensagemTextoAdmin,
                              ]}
                            >
                              {
                                mensagem.mensagem
                              }
                            </Text>

                            <Text
                              style={[
                                styles.mensagemHorario,

                                admin &&
                                  styles.mensagemHorarioAdmin,
                              ]}
                            >
                              {formatarHorarioMensagem(
                                mensagem.criado_em
                              )}
                            </Text>
                          </View>
                        </View>
                      );
                    }
                  )}
                </ScrollView>

                <View
                  style={styles.enviarArea}
                >
                  <TextInput
                    value={novaMensagem}
                    onChangeText={
                      setNovaMensagem
                    }
                    placeholder="Digite uma mensagem..."
                    placeholderTextColor={
                      colors.textLight
                    }
                    style={
                      styles.mensagemInput
                    }
                    multiline
                    maxLength={1000}
                    editable={!enviando}
                  />

                  <Pressable
                    style={[
                      styles.enviarButton,

                      (!novaMensagem.trim() ||
                        enviando) &&
                        styles.enviarButtonDisabled,
                    ]}
                    onPress={enviarMensagem}
                    disabled={
                      !novaMensagem.trim() ||
                      enviando
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
              </>
            ) : (
              <View style={styles.vazio}>
                <MessageCircle
                  size={40}
                  color={colors.textLight}
                />

                <Text style={styles.vazioTitle}>
                  Nenhuma conversa
                </Text>

                <Text style={styles.vazioText}>
                  Quando um morador enviar uma mensagem, a conversa aparecerá aqui.
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },

  content: {
    flex: 1,
    padding: 28,
    minWidth: 0,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
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
    color: colors.textSecondary,
    marginTop: 5,
  },

  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorBox: {
    backgroundColor: colors.dangerLight,
    borderRadius: 10,
    padding: 11,
    marginBottom: 14,
  },

  errorText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '700',
  },

  chatContainer: {
    flex: 1,
    minHeight: 550,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
  },

  conversasArea: {
    width: 340,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.surface,
  },

  conversasHeader: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },

  totalText: {
    fontSize: 10,
    color: colors.textSecondary,
  },

  searchBox: {
    marginHorizontal: 16,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    height: 40,
    marginLeft: 8,
    fontSize: 12,
    color: colors.text,
    outlineStyle: 'none',
  } as any,

  listaConversas: {
    flex: 1,
  },

  listaVazia: {
    paddingVertical: 45,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  listaVaziaText: {
    color: colors.textSecondary,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 10,
  },

  conversaItem: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  conversaItemAtiva: {
    backgroundColor: colors.primary,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  avatarAtivo: {
    backgroundColor: 'rgba(255,255,255,0.20)',
  },

  conversaInfo: {
    flex: 1,
    minWidth: 0,
  },

  conversaLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  moradorNome: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    marginRight: 8,
  },

  horarioLista: {
    fontSize: 9,
    color: colors.textSecondary,
  },

  residencia: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 2,
  },

  previewLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  preview: {
    flex: 1,
    fontSize: 10,
    color: colors.textSecondary,
    marginRight: 6,
  },

  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },

  textoAtivo: {
    color: '#FFFFFF',
  },

  textoAtivoSecundario: {
    color: 'rgba(255,255,255,0.75)',
  },

  mensagensArea: {
    flex: 1,
    minWidth: 0,
  },

  mensagemHeader: {
    height: 72,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  avatarGrande: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  mensagemNome: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },

  mensagemResidencia: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },

  mensagensScroll: {
    flex: 1,
    backgroundColor: colors.background,
  },

  mensagensContent: {
    padding: 20,
  },

  mensagemLinha: {
    width: '100%',
    marginBottom: 12,
  },

  mensagemLinhaAdmin: {
    alignItems: 'flex-end',
  },

  mensagemLinhaMorador: {
    alignItems: 'flex-start',
  },

  balao: {
    maxWidth: '72%',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  balaoAdmin: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },

  balaoMorador: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },

  mensagemTexto: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.text,
  },

  mensagemTextoAdmin: {
    color: '#FFFFFF',
  },

  mensagemHorario: {
    fontSize: 8,
    color: colors.textSecondary,
    marginTop: 5,
    textAlign: 'right',
  },

  mensagemHorarioAdmin: {
    color: 'rgba(255,255,255,0.70)',
  },

  enviarArea: {
    minHeight: 76,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  mensagemInput: {
    flex: 1,
    minHeight: 46,
    maxHeight: 90,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 12,
    color: colors.text,
    outlineStyle: 'none',
  } as any,

  enviarButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  enviarButtonDisabled: {
    opacity: 0.45,
  },

  vazio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  vazioTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },

  vazioText: {
    marginTop: 5,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});