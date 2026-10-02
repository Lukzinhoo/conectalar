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
  const [mensagens, setMensagens] = useState<MensagemBanco[]>([]);
  const [texto, setTexto] = useState('');

  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const [moradorId, setMoradorId] = useState<string | null>(null);

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
        setErro(`Não foi possível carregar as mensagens: ${error.message}`);
        return;
      }

      const lista = (data ?? []) as MensagemBanco[];

      setMensagens(lista);

      const idsNaoLidas = lista
        .filter(
          (item) =>
            item.remetente_tipo === 'administracao' &&
            !item.lida
        )
        .map((item) => item.id);

      if (idsNaoLidas.length > 0) {
        const { error: leituraError } = await supabase
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
          setMensagens((atual) =>
            atual.map((item) =>
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
      console.error('ERRO INESPERADO CHAT:', error);

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

  const totalMensagens = mensagens.length;

  const ultimaMensagem = useMemo(() => {
    if (mensagens.length === 0) {
      return null;
    }

    return mensagens[mensagens.length - 1];
  }, [mensagens]);

  async function enviarMensagem() {
    const mensagemLimpa = texto.trim();

    if (!mensagemLimpa || enviando) {
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
        setErro('Sua sessão não foi encontrada.');
        return;
      }

      const usuario = userData.user;

      const idMorador = moradorId ?? usuario.id;

      const {
        data,
        error,
      } = await supabase
        .from('chat_mensagens')
        .insert({
          morador_id: idMorador,
          remetente_id: usuario.id,
          remetente_tipo: 'morador',
          mensagem: mensagemLimpa,
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
        console.error('ERRO AO ENVIAR MENSAGEM:', error);

        setErro(
          `Não foi possível enviar a mensagem: ${error.message}`
        );

        return;
      }

      setMensagens((atual) => [
        ...atual,
        data as MensagemBanco,
      ]);

      setTexto('');
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
      <WebMoradorSidebar active="chat" />

      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Chat com a Administração
            </Text>

            <Text style={styles.subtitle}>
              Converse diretamente com o síndico, subsíndico ou administração.
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              style={styles.refreshButton}
              onPress={carregarMensagens}
            >
              <RefreshCw
                size={17}
                color={colors.textSecondary}
              />
            </Pressable>

            <View style={styles.onlineBadge}>
              <Circle
                size={8}
                color="#15803D"
                fill="#15803D"
              />

              <Text style={styles.onlineText}>
                Canal disponível
              </Text>
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

        <View style={styles.chatLayout}>
          <View style={styles.infoPanel}>
            <View style={styles.adminAvatar}>
              <ShieldCheck
                size={28}
                color={colors.primary}
              />
            </View>

            <Text style={styles.adminTitle}>
              Administração
            </Text>

            <Text style={styles.adminDescription}>
              Este canal é destinado à comunicação direta entre você e a
              administração do condomínio.
            </Text>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>
                Tipo de conversa
              </Text>

              <Text style={styles.infoValue}>
                Privada
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>
                Participantes
              </Text>

              <Text style={styles.infoValue}>
                Morador e administração
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>
                Mensagens
              </Text>

              <Text style={styles.infoValue}>
                {totalMensagens}
              </Text>
            </View>

            <View style={styles.noticeBox}>
              <MessageCircle
                size={17}
                color={colors.primary}
              />

              <Text style={styles.noticeText}>
                Utilize este canal para dúvidas, solicitações e assuntos
                relacionados ao condomínio.
              </Text>
            </View>
          </View>

          <View style={styles.chatBox}>
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderAvatar}>
                <ShieldCheck
                  size={20}
                  color="#FFFFFF"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.chatHeaderTitle}>
                  Administração do condomínio
                </Text>

                <View style={styles.chatStatus}>
                  <Circle
                    size={7}
                    color="#15803D"
                    fill="#15803D"
                  />

                  <Text style={styles.chatStatusText}>
                    Canal de atendimento
                  </Text>
                </View>
              </View>
            </View>

            <ScrollView
              style={styles.messagesArea}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {carregando ? (
                <View style={styles.emptyMessages}>
                  <ActivityIndicator
                    size="large"
                    color={colors.primary}
                  />

                  <Text style={styles.emptyText}>
                    Carregando mensagens...
                  </Text>
                </View>
              ) : mensagens.length === 0 ? (
                <View style={styles.emptyMessages}>
                  <MessageCircle
                    size={35}
                    color={colors.textLight}
                  />

                  <Text style={styles.emptyTitle}>
                    Nenhuma mensagem
                  </Text>

                  <Text style={styles.emptyText}>
                    Envie uma mensagem para iniciar a conversa.
                  </Text>
                </View>
              ) : (
                mensagens.map((mensagem, index) => {
                  const minha =
                    mensagem.remetente_tipo === 'morador';

                  const anterior =
                    index > 0
                      ? mensagens[index - 1]
                      : null;

                  const mostrarData =
                    !anterior ||
                    formatarData(anterior.criado_em) !==
                      formatarData(mensagem.criado_em);

                  return (
                    <React.Fragment key={mensagem.id}>
                      {mostrarData && (
                        <View style={styles.dateBadge}>
                          <Text style={styles.dateBadgeText}>
                            {formatarData(mensagem.criado_em)}
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
                          <View style={styles.messageAvatar}>
                            <ShieldCheck
                              size={15}
                              color={colors.primary}
                            />
                          </View>
                        )}

                        <View
                          style={[
                            styles.messageBubble,
                            minha
                              ? styles.myBubble
                              : styles.adminBubble,
                          ]}
                        >
                          {!minha && (
                            <Text style={styles.senderName}>
                              Administração
                            </Text>
                          )}

                          <Text
                            style={[
                              styles.messageText,
                              minha && styles.myMessageText,
                            ]}
                          >
                            {mensagem.mensagem}
                          </Text>

                          <View style={styles.messageFooter}>
                            <Text
                              style={[
                                styles.messageTime,
                                minha && styles.myMessageTime,
                              ]}
                            >
                              {formatarHorario(mensagem.criado_em)}
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
                })
              )}
            </ScrollView>

            <View style={styles.inputArea}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={texto}
                  onChangeText={setTexto}
                  placeholder="Digite sua mensagem..."
                  placeholderTextColor={colors.textLight}
                  multiline
                  maxLength={1000}
                  editable={!enviando}
                />

                <Text style={styles.characterCount}>
                  {texto.length}/1000
                </Text>
              </View>

              <Pressable
                style={[
                  styles.sendButton,
                  (!texto.trim() || enviando) &&
                    styles.sendButtonDisabled,
                ]}
                onPress={enviarMensagem}
                disabled={!texto.trim() || enviando}
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

            <View style={styles.inputFooter}>
              <Text style={styles.inputFooterText}>
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
    minWidth: 0,
    padding: 30,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 5,
  },

  refreshButton: {
    width: 35,
    height: 35,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
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
    backgroundColor: colors.dangerLight,
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
  },

  infoPanel: {
    width: 260,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    marginRight: 18,
  },

  adminAvatar: {
    width: 58,
    height: 58,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
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
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
    marginTop: 7,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 18,
  },

  infoItem: {
    marginBottom: 14,
  },

  infoLabel: {
    color: colors.textSecondary,
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
    backgroundColor: colors.primaryLight,
    borderRadius: 11,
    padding: 12,
    marginTop: 5,
  },

  noticeText: {
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 14,
    marginTop: 7,
  },

  chatBox: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: 'hidden',
  },

  chatHeader: {
    minHeight: 72,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  chatHeaderAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    color: colors.textSecondary,
    fontSize: 8,
    marginLeft: 5,
  },

  messagesArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  messagesContent: {
    padding: 20,
    paddingBottom: 30,
  },

  dateBadge: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 5,
    marginBottom: 20,
  },

  dateBadgeText: {
    color: colors.textSecondary,
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
    justifyContent: 'flex-end',
  },

  messageRowAdmin: {
    justifyContent: 'flex-start',
  },

  messageAvatar: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  myAvatar: {
    backgroundColor: colors.primary,
    marginRight: 0,
    marginLeft: 8,
  },

  messageBubble: {
    maxWidth: '70%',
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },

  adminBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },

  myBubble: {
    backgroundColor: colors.primary,
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
    color: colors.textSecondary,
    fontSize: 7,
    marginRight: 4,
  },

  myMessageTime: {
    color: 'rgba(255,255,255,0.75)',
  },

  inputArea: {
    minHeight: 76,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
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
    backgroundColor: colors.background,
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
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 9,
  },

  sendButtonDisabled: {
    opacity: 0.45,
  },

  inputFooter: {
    minHeight: 27,
    backgroundColor: colors.surface,
    paddingHorizontal: 17,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  inputFooterText: {
    color: colors.textLight,
    fontSize: 7,
  },

  emptyMessages: {
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
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 8,
  },
});