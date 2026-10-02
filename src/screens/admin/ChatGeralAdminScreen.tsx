import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  ArrowLeft,
  Send,
  Users,
} from 'lucide-react-native';

import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../theme/theme';
import { supabase } from '../../services/supabase';

type MensagemGeral = {
  id: string;
  remetente_id: string;
  nome_remetente: string;
  casa: string | null;
  remetente_tipo:
    | 'morador'
    | 'admin'
    | 'sindico'
    | 'subsindico';
  mensagem: string;
  created_at: string;
};

export default function ChatGeralAdminScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const scrollRef =
    useRef<ScrollView | null>(null);

  const [usuarioId, setUsuarioId] =
    useState<string | null>(null);

  const [mensagens, setMensagens] =
    useState<MensagemGeral[]>([]);

  const [texto, setTexto] =
    useState('');

  const [carregando, setCarregando] =
    useState(true);

  const [enviando, setEnviando] =
    useState(false);

  const carregarChat =
    useCallback(async () => {
      try {
        setCarregando(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          Alert.alert(
            'Erro',
            'Não foi possível identificar o administrador.'
          );
          return;
        }

        setUsuarioId(user.id);

        const {
          data,
          error,
        } = await supabase
          .from('mensagens_chat_geral')
          .select('*')
          .order('created_at', {
            ascending: true,
          });

        if (error) {
          console.error(
            'Erro ao carregar Chat Geral:',
            error
          );

          Alert.alert(
            'Erro',
            'Não foi possível carregar o Chat Geral.'
          );
          return;
        }

        setMensagens(data || []);
      } catch (error) {
        console.error(
          'Erro ao carregar Chat Geral:',
          error
        );
      } finally {
        setCarregando(false);
      }
    }, []);

  useFocusEffect(
    useCallback(() => {
      carregarChat();
    }, [carregarChat])
  );

  useEffect(() => {
    const channel = supabase
      .channel('chat-geral-admin')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens_chat_geral',
        },
        (payload) => {
          const nova =
            payload.new as MensagemGeral;

          setMensagens((anteriores) => {
            const existe =
              anteriores.some(
                (item) =>
                  item.id === nova.id
              );

            if (existe) {
              return anteriores;
            }

            return [
              ...anteriores,
              nova,
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  async function enviarMensagem() {
    const mensagemLimpa =
      texto.trim();

    if (
      !mensagemLimpa ||
      !usuarioId ||
      enviando
    ) {
      return;
    }

    try {
      setEnviando(true);

      const {
        data: novaMensagem,
        error,
      } = await supabase
        .from('mensagens_chat_geral')
        .insert({
          remetente_id: usuarioId,
          nome_remetente:
            'Administração',
          casa: null,
          remetente_tipo: 'admin',
          mensagem: mensagemLimpa,
        })
        .select()
        .single();

      if (error) {
        console.error(
          'Erro ao enviar mensagem:',
          error
        );

        Alert.alert(
          'Erro',
          'Não foi possível enviar a mensagem.'
        );
        return;
      }

      setMensagens((anteriores) => {
        const existe =
          anteriores.some(
            (item) =>
              item.id ===
              novaMensagem.id
          );

        if (existe) {
          return anteriores;
        }

        return [
          ...anteriores,
          novaMensagem,
        ];
      });

      setTexto('');
    } catch (error) {
      console.error(
        'Erro ao enviar mensagem:',
        error
      );

      Alert.alert(
        'Erro',
        'Não foi possível enviar a mensagem.'
      );
    } finally {
      setEnviando(false);
    }
  }

  function formatarHora(
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

  function nomeDaMensagem(
    mensagem: MensagemGeral
  ) {
    if (
      mensagem.remetente_tipo ===
        'admin' ||
      mensagem.remetente_tipo ===
        'sindico' ||
      mensagem.remetente_tipo ===
        'subsindico'
    ) {
      return 'Administração';
    }

    if (mensagem.casa) {
      return `${mensagem.nome_remetente} • Casa ${mensagem.casa}`;
    }

    return mensagem.nome_remetente;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : 'height'
      }
    >
      <View
        style={[
          styles.header,
          {
            paddingTop:
              Math.max(
                insets.top,
                20
              ) + 8,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed &&
              styles.pressed,
          ]}
          onPress={() =>
            navigation.goBack()
          }
        >
          <ArrowLeft
            size={22}
            color="#FFFFFF"
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>
            Chat Geral
          </Text>

          <Text
            style={styles.headerSubtitle}
          >
            Moradores e administração
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Users
            size={22}
            color="#FFFFFF"
          />
        </View>
      </View>

      {carregando ? (
        <View style={styles.loading}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text
            style={styles.loadingText}
          >
            Carregando Chat Geral...
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={
              styles.messagesContent
            }
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
          >
            {mensagens.length === 0 ? (
              <View
                style={
                  styles.emptyContainer
                }
              >
                <View
                  style={styles.emptyIcon}
                >
                  <Users
                    size={32}
                    color={colors.primary}
                  />
                </View>

                <Text
                  style={styles.emptyTitle}
                >
                  Chat Geral
                </Text>

                <Text
                  style={
                    styles.emptyDescription
                  }
                >
                  Ainda não há mensagens.
                  Envie uma mensagem para
                  todos os moradores do
                  condomínio.
                </Text>
              </View>
            ) : (
              mensagens.map(
                (mensagem) => {
                  const minhaMensagem =
                    mensagem.remetente_id ===
                    usuarioId;

                  return (
                    <View
                      key={mensagem.id}
                      style={[
                        styles.messageRow,
                        minhaMensagem
                          ? styles.myMessageRow
                          : styles.otherMessageRow,
                      ]}
                    >
                      <View
                        style={[
                          styles.messageBubble,
                          minhaMensagem
                            ? styles.myMessage
                            : styles.otherMessage,
                        ]}
                      >
                        <Text
                          style={[
                            styles.sender,
                            minhaMensagem &&
                              styles.mySender,
                          ]}
                        >
                          {nomeDaMensagem(
                            mensagem
                          )}
                        </Text>

                        <Text
                          style={[
                            styles.messageText,
                            minhaMensagem &&
                              styles.myMessageText,
                          ]}
                        >
                          {
                            mensagem.mensagem
                          }
                        </Text>

                        <Text
                          style={[
                            styles.time,
                            minhaMensagem &&
                              styles.myTime,
                          ]}
                        >
                          {formatarHora(
                            mensagem.created_at
                          )}
                        </Text>
                      </View>
                    </View>
                  );
                }
              )
            )}
          </ScrollView>

          <View
            style={[
              styles.inputArea,
              {
                paddingBottom:
                  Math.max(
                    insets.bottom,
                    10
                  ),
              },
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
                onChangeText={setTexto}
                placeholder="Mensagem para todos..."
                placeholderTextColor={
                  colors.textSecondary
                }
                multiline
                maxLength={1000}
                textAlignVertical="top"
                returnKeyType="default"
                blurOnSubmit={false}
              />

              <Pressable
                style={({ pressed }) => [
                  styles.sendButton,
                  (!texto.trim() ||
                    enviando) &&
                    styles.sendDisabled,
                  pressed &&
                    texto.trim() &&
                    !enviando &&
                    styles.pressed,
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
                    size={19}
                    color="#FFFFFF"
                  />
                )}
              </Pressable>
            </View>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  header: {
    backgroundColor:
      colors.primaryDark,
    paddingHorizontal: 18,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor:
      'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pressed: {
    opacity: 0.7,
  },

  headerText: {
    flex: 1,
    marginLeft: 13,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },

  headerSubtitle: {
    color: '#CBD5E1',
    fontSize: 10,
    marginTop: 2,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor:
      'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 12,
  },

  messages: {
    flex: 1,
  },

  messagesContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
  },

  emptyContainer: {
    flex: 1,
    minHeight: 400,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 35,
  },

  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor:
      colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 17,
  },

  emptyDescription: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
  },

  messageRow: {
    width: '100%',
    marginBottom: 10,
  },

  myMessageRow: {
    alignItems: 'flex-end',
  },

  otherMessageRow: {
    alignItems: 'flex-start',
  },

  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 17,
  },

  myMessage: {
    backgroundColor:
      colors.primary,
    borderBottomRightRadius: 5,
  },

  otherMessage: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 5,
  },

  sender: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 4,
  },

  mySender: {
    color:
      'rgba(255,255,255,0.85)',
  },

  messageText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },

  myMessageText: {
    color: '#FFFFFF',
  },

  time: {
    color: colors.textSecondary,
    fontSize: 8,
    marginTop: 5,
    alignSelf: 'flex-end',
  },

  myTime: {
    color:
      'rgba(255,255,255,0.75)',
  },

  inputArea: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 12,
    paddingTop: 10,
  },

  inputContainer: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
  },

  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 110,
    color: colors.text,
    fontSize: 13,
    paddingTop: 9,
    paddingBottom: 8,
    paddingRight: 8,
  },

  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor:
      colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendDisabled: {
    opacity: 0.45,
  },
});
