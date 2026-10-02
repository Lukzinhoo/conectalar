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
  MessageCircle,
  Send,
} from 'lucide-react-native';

import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../theme/theme';
import { supabase } from '../../services/supabase';
import {
  obterPerfilAtual,
  PerfilUsuario,
} from '../../services/authService';

type Mensagem = {
  id: string;
  conversa_id: string;
  remetente_id: string;
  remetente_tipo:
    | 'morador'
    | 'admin'
    | 'sindico'
    | 'subsindico';
  mensagem: string;
  lida: boolean;
  created_at: string;
};

export default function ChatMoradorScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const scrollRef =
    useRef<ScrollView | null>(null);

  const [perfil, setPerfil] =
    useState<PerfilUsuario | null>(null);

  const [conversaId, setConversaId] =
    useState<string | null>(null);

  const [mensagens, setMensagens] =
    useState<Mensagem[]>([]);

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

        const perfilAtual =
          await obterPerfilAtual();

        if (!perfilAtual) {
          Alert.alert(
            'Erro',
            'Não foi possível identificar o morador.'
          );

          return;
        }

        setPerfil(perfilAtual);

        const {
          data: conversa,
          error: conversaError,
        } = await supabase
          .from('conversas')
          .select('*')
          .eq(
            'morador_id',
            perfilAtual.id
          )
          .eq('status', 'aberta')
          .order('created_at', {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (conversaError) {
          console.error(
            'Erro ao buscar conversa:',
            conversaError
          );

          Alert.alert(
            'Erro',
            'Não foi possível carregar a conversa.'
          );

          return;
        }

        if (!conversa) {
          setConversaId(null);
          setMensagens([]);
          return;
        }

        setConversaId(conversa.id);

        const {
          data: mensagensData,
          error: mensagensError,
        } = await supabase
          .from('mensagens')
          .select('*')
          .eq(
            'conversa_id',
            conversa.id
          )
          .order('created_at', {
            ascending: true,
          });

        if (mensagensError) {
          console.error(
            'Erro ao carregar mensagens:',
            mensagensError
          );

          Alert.alert(
            'Erro',
            'Não foi possível carregar as mensagens.'
          );

          return;
        }

        setMensagens(
          mensagensData || []
        );
      } catch (error) {
        console.error(
          'Erro ao carregar chat:',
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

  /*
   * Atualização em tempo real.
   * Quando uma mensagem for inserida,
   * o chat é recarregado.
   */
  useEffect(() => {
    const channel = supabase
      .channel('chat-morador')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mensagens',
        },
        () => {
          carregarChat();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversas',
        },
        () => {
          carregarChat();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [carregarChat]);

  useEffect(() => {
    if (mensagens.length === 0) {
      return;
    }

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({
        animated: true,
      });
    }, 100);
  }, [mensagens]);

  async function criarConversa() {
    if (!perfil) {
      return null;
    }

    const {
      data,
      error,
    } = await supabase
      .from('conversas')
      .insert({
        morador_id: perfil.id,
        nome_morador:
          perfil.nome || 'Morador',
        status: 'aberta',
      })
      .select()
      .single();

    if (error) {
      console.error(
        'Erro ao criar conversa:',
        error
      );

      throw error;
    }

    setConversaId(data.id);

    return data.id as string;
  }

  async function enviarMensagem() {
    const mensagemLimpa =
      texto.trim();

    if (!mensagemLimpa) {
      return;
    }

    if (!perfil) {
      Alert.alert(
        'Erro',
        'Não foi possível identificar o morador.'
      );

      return;
    }

    if (enviando) {
      return;
    }

    try {
      setEnviando(true);

      let idConversa =
        conversaId;

      /*
       * A primeira mensagem cria
       * automaticamente a conversa.
       */
      if (!idConversa) {
        idConversa =
          await criarConversa();
      }

      if (!idConversa) {
        throw new Error(
          'Conversa não encontrada.'
        );
      }

      const {
        data: novaMensagem,
        error: mensagemError,
      } = await supabase
        .from('mensagens')
        .insert({
          conversa_id: idConversa,
          remetente_id: perfil.id,
          remetente_tipo: 'morador',
          mensagem: mensagemLimpa,
          lida: false,
        })
        .select()
        .single();

      if (mensagemError) {
        console.error(
          'Erro ao enviar mensagem:',
          mensagemError
        );

        Alert.alert(
          'Erro',
          'Não foi possível enviar a mensagem.'
        );

        return;
      }

      /*
       * Coloca a mensagem imediatamente
       * na tela.
       */
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

      /*
       * Atualiza a conversa para ela
       * subir para o topo no painel
       * administrativo.
       */
      const {
        error: atualizarError,
      } = await supabase
        .from('conversas')
        .update({
          updated_at:
            new Date().toISOString(),
        })
        .eq('id', idConversa);

      if (atualizarError) {
        console.error(
          'Erro ao atualizar conversa:',
          atualizarError
        );
      }
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : 'height'
      }
    >
      {/* CABEÇALHO */}

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

        <View
          style={styles.headerText}
        >
          <Text
            style={styles.headerTitle}
          >
            Chat
          </Text>

          <Text
            style={
              styles.headerSubtitle
            }
          >
            Fale com a administração
          </Text>
        </View>

        <View
          style={styles.headerIcon}
        >
          <MessageCircle
            size={22}
            color="#FFFFFF"
          />
        </View>
      </View>

      {/* MENSAGENS */}

      {carregando ? (
        <View
          style={styles.loading}
        >
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text
            style={styles.loadingText}
          >
            Carregando conversa...
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
                  <MessageCircle
                    size={32}
                    color={colors.primary}
                  />
                </View>

                <Text
                  style={styles.emptyTitle}
                >
                  Inicie uma conversa
                </Text>

                <Text
                  style={
                    styles.emptyDescription
                  }
                >
                  Envie uma mensagem para
                  falar com a administração
                  do condomínio.
                </Text>
              </View>
            ) : (
              mensagens.map(
                (mensagem) => {
                  const minhaMensagem =
                    mensagem.remetente_tipo ===
                    'morador';

                  return (
                    <View
                      key={
                        mensagem.id
                      }
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
                          {minhaMensagem
                            ? `${perfil?.nome || 'Morador'}${
                                perfil?.casa
                                  ? ` • Casa ${perfil.casa}`
                                  : ''
                              }`
                            : 'Administração'}
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

          {/* CAMPO DE MENSAGEM */}

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
              style={styles.inputContainer}
            >
              <TextInput
                style={styles.input}
                value={texto}
                onChangeText={setTexto}
                placeholder="Digite sua mensagem..."
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
                style={({
                  pressed,
                }) => [
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
    color: 'rgba(255,255,255,0.85)',
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