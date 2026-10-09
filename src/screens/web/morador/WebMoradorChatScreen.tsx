import React, {
  useCallback,
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
  useWindowDimensions,
} from 'react-native';

import {
  CheckCheck,
  Circle,
  MessageCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  User,
} from 'lucide-react-native';

import { colors } from '../../../theme/theme';
import WebMoradorSidebar from '../../../components/WebMoradorSidebar';
import WebLayout from '../../../components/WebLayout';
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

function formatarHorario(data: string) {
  try {
    return new Date(data).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function formatarData(data: string) {
  try {
    return new Date(data).toLocaleDateString('pt-BR');
  } catch {
    return '';
  }
}

export default function WebMoradorChatScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [mensagens, setMensagens] = useState<MensagemBanco[]>([]);
  const [texto, setTexto] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [moradorId, setMoradorId] = useState<string | null>(null);

  const moradorIdRef = useRef<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    moradorIdRef.current = moradorId;
  }, [moradorId]);

  /* =========================================================
     CARREGAR MENSAGENS
  ========================================================= */

  const carregarMensagens = useCallback(async () => {
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

      const usuario = userData.user;

      const {
        data: perfil,
        error: perfilError,
      } = await supabase
        .from('perfis')
        .select('id, tipo, ativo')
        .eq('id', usuario.id)
        .maybeSingle();

      if (perfilError) {
        console.error('ERRO PERFIL:', perfilError);
        setErro('Não foi possível verificar seu perfil.');
        return;
      }

      if (!perfil || perfil.tipo !== 'morador') {
        setErro('Esta conta não possui acesso ao chat do morador.');
        return;
      }

      if (!perfil.ativo) {
        setErro('Este usuário está desativado.');
        return;
      }

      setMoradorId(usuario.id);
      moradorIdRef.current = usuario.id;

      const {
        data,
        error,
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
        .eq('morador_id', usuario.id)
        .order('criado_em', {
          ascending: true,
        });

      if (error) {
        console.error('ERRO CHAT:', error);

        setErro(
          `Não foi possível carregar as mensagens: ${error.message}`
        );

        return;
      }

      const lista = (data ?? []) as MensagemBanco[];

      setMensagens(lista);

      const idsNaoLidas = lista
        .filter(
          item =>
            item.remetente_tipo === 'administracao' &&
            !item.lida
        )
        .map(item => item.id);

      if (idsNaoLidas.length > 0) {
        const {
          error: leituraError,
        } = await supabase
          .from('chat_mensagens')
          .update({
            lida: true,
          })
          .in('id', idsNaoLidas);

        if (leituraError) {
          console.error(
            'ERRO AO MARCAR MENSAGENS COMO LIDAS:',
            leituraError
          );
        } else {
          setMensagens(atual =>
            atual.map(item =>
              idsNaoLidas.includes(item.id)
                ? {
                    ...item,
                    lida: true,
                  }
                : item
            )
          );
        }
      }
    } catch (error) {
      console.error(
        'ERRO INESPERADO CHAT:',
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
    carregarMensagens();
  }, [carregarMensagens]);

  /* =========================================================
     REALTIME
  ========================================================= */

  useEffect(() => {
    let canal:
      | ReturnType<typeof supabase.channel>
      | null = null;

    let ativo = true;

    async function iniciarRealtime() {
      let idMorador = moradorIdRef.current;

      if (!idMorador) {
        const {
          data: userData,
          error: userError,
        } = await supabase.auth.getUser();

        if (
          userError ||
          !userData.user ||
          !ativo
        ) {
          return;
        }

        idMorador = userData.user.id;
        moradorIdRef.current = idMorador;
      }

      canal = supabase
        .channel(
          `morador-chat-${idMorador}`
        )

        /* NOVA MENSAGEM */
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_mensagens',
            filter: `morador_id=eq.${idMorador}`,
          },
          async payload => {
            const novaMensagem =
              payload.new as MensagemBanco;

            if (!novaMensagem?.id) {
              return;
            }

            setMensagens(atual => {
              const jaExiste = atual.some(
                item =>
                  item.id === novaMensagem.id
              );

              if (jaExiste) {
                return atual;
              }

              return [
                ...atual,
                novaMensagem,
              ];
            });

            /*
             * Se veio da administração,
             * marca como lida.
             */
            if (
              novaMensagem.remetente_tipo ===
                'administracao' &&
              !novaMensagem.lida
            ) {
              const {
                error: leituraError,
              } = await supabase
                .from('chat_mensagens')
                .update({
                  lida: true,
                })
                .eq(
                  'id',
                  novaMensagem.id
                );

              if (leituraError) {
                console.error(
                  'ERRO REALTIME AO MARCAR COMO LIDA:',
                  leituraError
                );

                return;
              }

              setMensagens(atual =>
                atual.map(item =>
                  item.id === novaMensagem.id
                    ? {
                        ...item,
                        lida: true,
                      }
                    : item
                )
              );
            }
          }
        )

        /* ATUALIZAÇÃO DO ✓✓ */
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_mensagens',
            filter: `morador_id=eq.${idMorador}`,
          },
          payload => {
            const atualizada =
              payload.new as MensagemBanco;

            if (!atualizada?.id) {
              return;
            }

            setMensagens(atual =>
              atual.map(item =>
                item.id === atualizada.id
                  ? atualizada
                  : item
              )
            );
          }
        )

        .subscribe(status => {
          console.log(
            'REALTIME CHAT MORADOR:',
            status
          );
        });
    }

    iniciarRealtime();

    return () => {
      ativo = false;

      if (canal) {
        supabase.removeChannel(canal);
      }
    };
  }, []);

  /* =========================================================
     INFORMAÇÕES
  ========================================================= */

  const totalMensagens =
    mensagens.length;

  const ultimaMensagem =
    useMemo(() => {
      if (mensagens.length === 0) {
        return null;
      }

      return mensagens[
        mensagens.length - 1
      ];
    }, [mensagens]);

  /* =========================================================
     ENVIAR MENSAGEM
  ========================================================= */

  async function enviarMensagem() {
    const mensagemLimpa =
      texto.trim();

    if (
      !mensagemLimpa ||
      enviando
    ) {
      return;
    }

    /*
     * Limpa imediatamente.
     */
    setTexto('');
    setEnviando(true);
    setErro('');

    try {
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (
        userError ||
        !userData.user
      ) {
        setTexto(mensagemLimpa);

        setErro(
          'Sua sessão não foi encontrada.'
        );

        return;
      }

      const usuario =
        userData.user;

      const idMorador =
        moradorIdRef.current ??
        moradorId ??
        usuario.id;

      const {
        data,
        error,
      } = await supabase
        .from('chat_mensagens')
        .insert({
          morador_id:
            idMorador,

          remetente_id:
            usuario.id,

          remetente_tipo:
            'morador',

          mensagem:
            mensagemLimpa,

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

        setTexto(mensagemLimpa);

        setErro(
          `Não foi possível enviar a mensagem: ${error.message}`
        );

        return;
      }

      const novaMensagem =
        data as MensagemBanco;

      /*
       * Adiciona imediatamente,
       * sem esperar o Realtime.
       */
      setMensagens(atual => {
        const jaExiste =
          atual.some(
            item =>
              item.id ===
              novaMensagem.id
          );

        if (jaExiste) {
          return atual;
        }

        return [
          ...atual,
          novaMensagem,
        ];
      });
    } catch (error) {
      console.error(
        'ERRO INESPERADO AO ENVIAR:',
        error
      );

      setTexto(mensagemLimpa);

      setErro(
        'Ocorreu um erro ao enviar a mensagem.'
      );
    } finally {
      setEnviando(false);
    }
  }

  /* =========================================================
     TELA
  ========================================================= */

  return (
    <WebLayout
      sidebar={
        <WebMoradorSidebar
          active="chat"
        />
      }
    >
      <View
        style={[
          styles.content,
          isMobile &&
            styles.contentMobile,
        ]}
      >
        {/* CABEÇALHO */}

        <View
          style={[
            styles.header,
            isMobile &&
              styles.headerMobile,
          ]}
        >
          <View
            style={
              isMobile
                ? styles.headerTitleMobile
                : undefined
            }
          >
            <Text
              style={styles.title}
            >
              Chat com a Administração
            </Text>

            <Text
              style={styles.subtitle}
            >
              Converse diretamente com o síndico, subsíndico ou administração.
            </Text>
          </View>

          <View
            style={[
              styles.headerActions,
              isMobile &&
                styles.headerActionsMobile,
            ]}
          >
            <Pressable
              style={[
                styles.refreshButton,
                isMobile &&
                  styles.refreshButtonMobile,
              ]}
              onPress={
                carregarMensagens
              }
            >
              <RefreshCw
                size={17}
                color={
                  colors.textSecondary
                }
              />
            </Pressable>

            <View
              style={[
                styles.onlineBadge,
                isMobile &&
                  styles.onlineBadgeMobile,
              ]}
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
                Canal disponível
              </Text>
            </View>
          </View>
        </View>

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

        {/* ÁREA PRINCIPAL */}

        <View
          style={[
            styles.chatLayout,
            isMobile &&
              styles.chatLayoutMobile,
          ]}
        >
          {/* INFORMAÇÕES */}

          <View
            style={[
              styles.infoPanel,
              isMobile &&
                styles.infoPanelMobile,
            ]}
          >
            <View
              style={
                styles.adminAvatar
              }
            >
              <ShieldCheck
                size={28}
                color={colors.primary}
              />
            </View>

            <Text
              style={styles.adminTitle}
            >
              Administração
            </Text>

            <Text
              style={
                styles.adminDescription
              }
            >
              Este canal é destinado à comunicação direta entre você e a administração do condomínio.
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
                Tipo de conversa
              </Text>

              <Text
                style={styles.infoValue}
              >
                Privada
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
                Morador e administração
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
                {totalMensagens}
              </Text>
            </View>

            <View
              style={styles.noticeBox}
            >
              <MessageCircle
                size={17}
                color={colors.primary}
              />

              <Text
                style={
                  styles.noticeText
                }
              >
                Utilize este canal para dúvidas, solicitações e assuntos relacionados ao condomínio.
              </Text>
            </View>
          </View>

          {/* CHAT */}

          <View
            style={[
              styles.chatBox,
              isMobile &&
                styles.chatBoxMobile,
            ]}
          >
            <View
              style={
                styles.chatHeader
              }
            >
              <View
                style={
                  styles.chatHeaderAvatar
                }
              >
                <ShieldCheck
                  size={20}
                  color="#FFFFFF"
                />
              </View>

              <View
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Text
                  style={
                    styles.chatHeaderTitle
                  }
                >
                  Administração do condomínio
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
                    Canal de atendimento
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
              contentContainerStyle={[
                styles.messagesContent,
                isMobile &&
                  styles.messagesContentMobile,
              ]}
              showsVerticalScrollIndicator={
                false
              }
              onContentSizeChange={() => {
                scrollRef.current?.scrollToEnd({
                  animated: true,
                });
              }}
            >
              {carregando ? (
                <View
                  style={
                    styles.emptyMessages
                  }
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
                  style={
                    styles.emptyMessages
                  }
                >
                  <MessageCircle
                    size={35}
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
                    Envie uma mensagem para iniciar a conversa.
                  </Text>
                </View>
              ) : (
                mensagens.map(
                  (
                    mensagem,
                    index
                  ) => {
                    const minha =
                      mensagem.remetente_tipo ===
                      'morador';

                    const anterior =
                      index > 0
                        ? mensagens[
                            index - 1
                          ]
                        : null;

                    const mostrarData =
                      !anterior ||
                      formatarData(
                        anterior.criado_em
                      ) !==
                        formatarData(
                          mensagem.criado_em
                        );

                    return (
                      <React.Fragment
                        key={
                          mensagem.id
                        }
                      >
                        {mostrarData && (
                          <View
                            style={
                              styles.dateBadge
                            }
                          >
                            <Text
                              style={
                                styles.dateBadgeText
                              }
                            >
                              {formatarData(
                                mensagem.criado_em
                              )}
                            </Text>
                          </View>
                        )}

                        <View
                          style={[
                            styles.messageRow,
                            minha
                              ? styles.messageRowMine
                              : styles.messageRowAdmin,
                          ]}
                        >
                          {!minha && (
                            <View
                              style={
                                styles.messageAvatar
                              }
                            >
                              <ShieldCheck
                                size={15}
                                color={
                                  colors.primary
                                }
                              />
                            </View>
                          )}

                          <View
                            style={[
                              styles.messageBubble,

                              isMobile &&
                                styles.messageBubbleMobile,

                              minha
                                ? styles.myBubble
                                : styles.adminBubble,
                            ]}
                          >
                            {!minha && (
                              <Text
                                style={
                                  styles.senderName
                                }
                              >
                                Administração
                              </Text>
                            )}

                            <Text
                              style={[
                                styles.messageText,

                                minha &&
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

                                  minha &&
                                    styles.myMessageTime,
                                ]}
                              >
                                {formatarHorario(
                                  mensagem.criado_em
                                )}
                              </Text>

                              {minha && (
                                <CheckCheck
                                  size={13}
                                  color={
                                    mensagem.lida
                                      ? '#FFFFFF'
                                      : 'rgba(255,255,255,0.65)'
                                  }
                                />
                              )}
                            </View>
                          </View>

                          {minha && (
                            <View
                              style={[
                                styles.messageAvatar,
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
                      </React.Fragment>
                    );
                  }
                )
              )}
            </ScrollView>

            {/* CAMPO DE MENSAGEM */}

            <View
              style={[
                styles.inputArea,
                isMobile &&
                  styles.inputAreaMobile,
              ]}
            >
              <View
                style={
                  styles.inputContainer
                }
              >
                <TextInput
                  style={styles.input}
                  value={texto}
                  onChangeText={
                    setTexto
                  }
                  placeholder="Digite sua mensagem..."
                  placeholderTextColor={
                    colors.textLight
                  }
                  multiline
                  maxLength={1000}
                  editable={!enviando}
                />

                {!isMobile && (
                  <Text
                    style={
                      styles.characterCount
                    }
                  >
                    {texto.length}/1000
                  </Text>
                )}
              </View>

              <Pressable
                style={[
                  styles.sendButton,

                  (!texto.trim() ||
                    enviando) &&
                    styles.sendButtonDisabled,
                ]}
                onPress={
                  enviarMensagem
                }
                disabled={
                  !texto.trim() ||
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
                    size={18}
                    color="#FFFFFF"
                  />
                )}
              </Pressable>
            </View>

            <View
              style={
                styles.inputFooter
              }
            >
              <Text
                style={
                  styles.inputFooterText
                }
              >
                {ultimaMensagem
                  ? `Última mensagem às ${formatarHorario(
                      ultimaMensagem.criado_em
                    )}`
                  : 'Nenhuma mensagem enviada'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </WebLayout>
  );
}

/* =========================================================
   ESTILOS
========================================================= */

const styles = StyleSheet.create({
  content: {
    flex: 1,
    width: '100%',
    minWidth: 0,
  },

  contentMobile: {
    width: '100%',
    minWidth: 0,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 24,
  },

  headerMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginBottom: 18,
  },

  headerTitleMobile: {
    width: '100%',
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerActionsMobile: {
    width: '100%',
    marginTop: 14,
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
    lineHeight: 17,
  },

  refreshButton: {
    width: 35,
    height: 35,
    borderRadius: 9,
    borderWidth: 1,
    borderColor:
      colors.border,
    backgroundColor:
      colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  refreshButtonMobile: {
    width: 42,
    height: 42,
    flexShrink: 0,
  },

  onlineBadge: {
    minHeight: 35,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor:
      '#DCFCE7',
    flexDirection: 'row',
    alignItems: 'center',
  },

  onlineBadgeMobile: {
    minHeight: 42,
    flex: 1,
    justifyContent: 'center',
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
    padding: 11,
    marginBottom: 15,
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
    width: '100%',
  },

  chatLayoutMobile: {
    flexDirection: 'column',
    width: '100%',
  },

  infoPanel: {
    width: 260,
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius: 16,
    padding: 20,
    marginRight: 18,
  },

  infoPanelMobile: {
    width: '100%',
    marginRight: 0,
    marginBottom: 16,
  },

  adminAvatar: {
    width: 58,
    height: 58,
    borderRadius: 17,
    backgroundColor:
      colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  adminTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },

  adminDescription: {
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

  noticeText: {
    color:
      colors.textSecondary,
    fontSize: 8,
    lineHeight: 14,
    marginTop: 7,
  },

  chatBox: {
    flex: 1,
    minWidth: 0,
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius: 16,
    overflow: 'hidden',
  },

  chatBoxMobile: {
    width: '100%',
    minWidth: 0,
    minHeight: 600,
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

  chatHeaderAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor:
      colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
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

  messagesContentMobile: {
    paddingHorizontal: 10,
    paddingVertical: 16,
    paddingBottom: 24,
  },

  dateBadge: {
    alignSelf: 'center',
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor:
      colors.border,
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
    marginBottom: 15,
    alignItems: 'flex-end',
  },

  messageRowMine: {
    justifyContent:
      'flex-end',
  },

  messageRowAdmin: {
    justifyContent:
      'flex-start',
  },

  messageAvatar: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor:
      colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
  },

  myAvatar: {
    backgroundColor:
      colors.primary,
    marginRight: 0,
    marginLeft: 8,
  },

  messageBubble: {
    maxWidth: '70%',
    minWidth: 0,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },

  messageBubbleMobile: {
    maxWidth: '78%',
  },

  adminBubble: {
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderBottomLeftRadius: 4,
  },

  myBubble: {
    backgroundColor:
      colors.primary,
    borderBottomRightRadius: 4,
  },

  senderName: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: '800',
    marginBottom: 5,
  },

  messageText: {
    color: colors.text,
    fontSize: 10,
    lineHeight: 16,
    flexShrink: 1,
  },

  myMessageText: {
    color: '#FFFFFF',
  },

  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'flex-end',
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
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  inputAreaMobile: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },

  inputContainer: {
    flex: 1,
    minWidth: 0,
    minHeight: 45,
    maxHeight: 90,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius: 12,
    backgroundColor:
      colors.background,
    flexDirection: 'row',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    minWidth: 0,
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
    flexShrink: 0,
  },

  sendButtonDisabled: {
    opacity: 0.45,
  },

  inputFooter: {
    minHeight: 27,
    backgroundColor:
      colors.surface,
    paddingHorizontal: 17,
    paddingVertical: 7,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  inputFooterText: {
    color: colors.textLight,
    fontSize: 7,
    textAlign: 'right',
  },

  emptyMessages: {
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
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
    marginTop: 8,
    textAlign: 'center',
  },
});