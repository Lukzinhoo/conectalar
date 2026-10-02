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
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  ArrowLeft,
  ChevronRight,
  MessageCircle,
  Send,
  User,
} from 'lucide-react-native';

import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../theme/theme';
import { supabase } from '../../services/supabase';

type Conversa = {
  id: string;
  morador_id: string;
  nome_morador: string;
  status: 'aberta' | 'encerrada';
  created_at: string;
  updated_at: string;
};

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

export default function ChatAdminScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const scrollRef =
    useRef<ScrollView | null>(null);

  const [conversas, setConversas] =
    useState<Conversa[]>([]);

  const [conversaSelecionada, setConversaSelecionada] =
    useState<Conversa | null>(null);

  const [mensagens, setMensagens] =
    useState<Mensagem[]>([]);

  const [texto, setTexto] = useState('');

  const [carregando, setCarregando] =
    useState(true);

  const [carregandoMensagens, setCarregandoMensagens] =
    useState(false);

  const [atualizando, setAtualizando] =
    useState(false);

  const [enviando, setEnviando] =
    useState(false);

  const carregarConversas =
    useCallback(async () => {
      try {
        const { data, error } = await supabase
          .from('conversas')
          .select('*')
          .order('updated_at', {
            ascending: false,
          });

        if (error) {
          console.error(
            'Erro ao carregar conversas:',
            error
          );
          return;
        }

        setConversas(data || []);
      } catch (error) {
        console.error(
          'Erro ao carregar conversas:',
          error
        );
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    }, []);

  const carregarMensagens =
    useCallback(async (conversaId: string) => {
      try {
        setCarregandoMensagens(true);

        const { data, error } = await supabase
          .from('mensagens')
          .select('*')
          .eq('conversa_id', conversaId)
          .order('created_at', {
            ascending: true,
          });

        if (error) {
          console.error(
            'Erro ao carregar mensagens:',
            error
          );

          Alert.alert(
            'Erro',
            'Não foi possível carregar as mensagens.'
          );
          return;
        }

        setMensagens(data || []);
      } catch (error) {
        console.error(
          'Erro ao carregar mensagens:',
          error
        );
      } finally {
        setCarregandoMensagens(false);
      }
    }, []);

  useFocusEffect(
    useCallback(() => {
      carregarConversas();
    }, [carregarConversas])
  );

  useEffect(() => {
    const channel = supabase
      .channel('admin-chat-completo')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversas',
        },
        () => {
          carregarConversas();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mensagens',
        },
        (payload) => {
          carregarConversas();

          if (
            conversaSelecionada &&
            (
              (payload.new as any)?.conversa_id ===
                conversaSelecionada.id ||
              (payload.old as any)?.conversa_id ===
                conversaSelecionada.id
            )
          ) {
            carregarMensagens(
              conversaSelecionada.id
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    carregarConversas,
    carregarMensagens,
    conversaSelecionada,
  ]);

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

  function atualizar() {
    setAtualizando(true);
    carregarConversas();
  }

  function abrirConversa(conversa: Conversa) {
    setConversaSelecionada(conversa);
    setMensagens([]);
    setTexto('');
    carregarMensagens(conversa.id);
  }

  function voltar() {
    if (conversaSelecionada) {
      setConversaSelecionada(null);
      setMensagens([]);
      setTexto('');
      carregarConversas();
      return;
    }

    navigation.goBack();
  }

  async function enviarMensagem() {
    const mensagemLimpa = texto.trim();

    if (
      !mensagemLimpa ||
      !conversaSelecionada ||
      enviando
    ) {
      return;
    }

    try {
      setEnviando(true);

      const {
        data: authData,
        error: authError,
      } = await supabase.auth.getUser();

      if (
        authError ||
        !authData.user
      ) {
        Alert.alert(
          'Erro',
          'Não foi possível identificar o administrador.'
        );
        return;
      }

      const {
        data: novaMensagem,
        error: mensagemError,
      } = await supabase
        .from('mensagens')
        .insert({
          conversa_id:
            conversaSelecionada.id,
          remetente_id:
            authData.user.id,
          remetente_tipo: 'admin',
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

      setMensagens((anteriores) => {
        const existe = anteriores.some(
          (item) =>
            item.id === novaMensagem.id
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

      const { error: atualizarError } =
        await supabase
          .from('conversas')
          .update({
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            'id',
            conversaSelecionada.id
          );

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

  function formatarData(data: string) {
    try {
      return new Date(
        data
      ).toLocaleDateString(
        'pt-BR',
        {
          day: '2-digit',
          month: '2-digit',
        }
      );
    } catch {
      return '';
    }
  }

  function formatarHora(data: string) {
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

  const telaConversa =
    conversaSelecionada !== null;

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
            pressed && styles.pressed,
          ]}
          onPress={voltar}
        >
          <ArrowLeft
            size={22}
            color="#FFFFFF"
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text
            style={styles.headerTitle}
            numberOfLines={1}
          >
            {telaConversa
              ? conversaSelecionada.nome_morador
              : 'Chat'}
          </Text>

          <Text
            style={styles.headerSubtitle}
            numberOfLines={1}
          >
            {telaConversa
              ? 'Conversa com o morador'
              : 'Conversas com moradores'}
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <MessageCircle
            size={22}
            color="#FFFFFF"
          />
        </View>
      </View>

      {!telaConversa ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom:
                Math.max(
                  insets.bottom,
                  20
                ) + 20,
            },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={atualizar}
            />
          }
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Conversas
            </Text>

            <Text
              style={
                styles.sectionDescription
              }
            >
              Abra uma conversa para visualizar
              e responder ao morador.
            </Text>
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
                Carregando conversas...
              </Text>
            </View>
          ) : conversas.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <MessageCircle
                  size={30}
                  color={colors.primary}
                />
              </View>

              <Text
                style={styles.emptyTitle}
              >
                Nenhuma conversa
              </Text>

              <Text
                style={
                  styles.emptyDescription
                }
              >
                Quando um morador iniciar uma
                conversa, ela aparecerá aqui.
              </Text>
            </View>
          ) : (
            conversas.map((conversa) => (
              <Pressable
                key={conversa.id}
                style={({ pressed }) => [
                  styles.conversaCard,
                  pressed &&
                    styles.conversaPressed,
                ]}
                onPress={() =>
                  abrirConversa(conversa)
                }
              >
                <View style={styles.avatar}>
                  <User
                    size={22}
                    color={colors.primary}
                  />
                </View>

                <View
                  style={
                    styles.conversaContent
                  }
                >
                  <View
                    style={
                      styles.conversaTop
                    }
                  >
                    <Text
                      style={
                        styles.nomeMorador
                      }
                      numberOfLines={1}
                    >
                      {
                        conversa.nome_morador
                      }
                    </Text>

                    <Text
                      style={styles.data}
                    >
                      {formatarData(
                        conversa.updated_at
                      )}
                    </Text>
                  </View>

                  <Text
                    style={styles.status}
                    numberOfLines={1}
                  >
                    {conversa.status ===
                    'aberta'
                      ? 'Conversa aberta'
                      : 'Conversa encerrada'}
                  </Text>
                </View>

                <View style={styles.arrow}>
                  <ChevronRight
                    size={19}
                    color={
                      colors.textSecondary
                    }
                  />
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      ) : (
        <>
          {carregandoMensagens ? (
            <View style={styles.loadingChat}>
              <ActivityIndicator
                size="large"
                color={colors.primary}
              />

              <Text
                style={styles.loadingText}
              >
                Carregando mensagens...
              </Text>
            </View>
          ) : (
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
                    styles.emptyMessages
                  }
                >
                  <MessageCircle
                    size={34}
                    color={colors.primary}
                  />

                  <Text
                    style={
                      styles.emptyMessagesTitle
                    }
                  >
                    Nenhuma mensagem
                  </Text>
                </View>
              ) : (
                mensagens.map(
                  (mensagem) => {
                    const mensagemAdmin =
                      mensagem.remetente_tipo !==
                      'morador';

                    return (
                      <View
                        key={mensagem.id}
                        style={[
                          styles.messageRow,
                          mensagemAdmin
                            ? styles.adminMessageRow
                            : styles.moradorMessageRow,
                        ]}
                      >
                        <View
                          style={[
                            styles.messageBubble,
                            mensagemAdmin
                              ? styles.adminMessage
                              : styles.moradorMessage,
                          ]}
                        >
                          <Text
                            style={[
                              styles.sender,
                              mensagemAdmin &&
                                styles.adminSender,
                            ]}
                          >
                            {mensagemAdmin
                              ? 'Administração'
                              : conversaSelecionada.nome_morador}
                          </Text>

                          <Text
                            style={[
                              styles.messageText,
                              mensagemAdmin &&
                                styles.adminMessageText,
                            ]}
                          >
                            {
                              mensagem.mensagem
                            }
                          </Text>

                          <Text
                            style={[
                              styles.time,
                              mensagemAdmin &&
                                styles.adminTime,
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
          )}

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
                placeholder="Digite sua resposta..."
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
                onPress={enviarMensagem}
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
    backgroundColor: colors.primaryDark,
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

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 22,
  },

  sectionHeader: {
    marginBottom: 16,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },

  sectionDescription: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
  },

  loadingChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 12,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 45,
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor:
      colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 16,
  },

  emptyDescription: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 260,
  },

  conversaCard: {
    minHeight: 82,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 13,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  conversaPressed: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor:
      colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  conversaContent: {
    flex: 1,
    marginLeft: 12,
  },

  conversaTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  nomeMorador: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },

  data: {
    color: colors.textSecondary,
    fontSize: 9,
    marginLeft: 8,
  },

  status: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 5,
  },

  arrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
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

  emptyMessages: {
    flex: 1,
    minHeight: 350,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyMessagesTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 12,
  },

  messageRow: {
    width: '100%',
    marginBottom: 10,
  },

  adminMessageRow: {
    alignItems: 'flex-end',
  },

  moradorMessageRow: {
    alignItems: 'flex-start',
  },

  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 17,
  },

  adminMessage: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 5,
  },

  moradorMessage: {
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

  adminSender: {
    color: 'rgba(255,255,255,0.85)',
  },

  messageText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },

  adminMessageText: {
    color: '#FFFFFF',
  },

  time: {
    color: colors.textSecondary,
    fontSize: 8,
    marginTop: 5,
    alignSelf: 'flex-end',
  },

  adminTime: {
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
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendDisabled: {
    opacity: 0.45,
  },
});

