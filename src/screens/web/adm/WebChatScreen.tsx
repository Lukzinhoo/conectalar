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
  useWindowDimensions,
  View,
} from 'react-native';

import {
  ArrowLeft,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  User,
} from 'lucide-react-native';

import WebLayout from '../../../components/WebLayout';
import WebSidebar from '../../../components/WebSidebar';
import { colors } from '../../../theme/theme';
import { supabase } from '../../../services/supabase';

/* =====================================================
   TIPOS
===================================================== */

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

/* =====================================================
   FUNÇÕES
===================================================== */

function formatarHorario(data: string) {
  try {
    const mensagem = new Date(data);
    const hoje = new Date();

    const mesmaData =
      mensagem.getDate() === hoje.getDate() &&
      mensagem.getMonth() === hoje.getMonth() &&
      mensagem.getFullYear() === hoje.getFullYear();

    if (mesmaData) {
      return mensagem.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return mensagem.toLocaleDateString('pt-BR', {
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

  if (casa) return casa;
  if (quadra) return quadra;

  return 'Residência não informada';
}

/* =====================================================
   COMPONENTE
===================================================== */

export default function WebChatScreen() {
  const { width } = useWindowDimensions();

  const isMobile = width < 768;

  const [conversas, setConversas] =
    useState<Conversa[]>([]);

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
  const [atualizando, setAtualizando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [erro, setErro] = useState('');

  const [chatMobileAberto, setChatMobileAberto] =
    useState(false);

  const mensagensScrollRef =
    useRef<ScrollView | null>(null);

  const conversaSelecionadaRef =
    useRef<string | null>(null);

  /* =====================================================
     MANTER REF ATUALIZADA
  ===================================================== */

  useEffect(() => {
    conversaSelecionadaRef.current =
      conversaSelecionada;
  }, [conversaSelecionada]);

  /* =====================================================
     BUSCAR PERFIL
  ===================================================== */

  const buscarPerfilMorador = useCallback(
    async (
      moradorId: string
    ): Promise<PerfilMorador | null> => {
      const { data, error } = await supabase
        .from('perfis')
        .select(`
          id,
          nome,
          casa,
          quadra
        `)
        .eq('id', moradorId)
        .maybeSingle();

      if (error) {
        console.error(
          'ERRO AO BUSCAR MORADOR:',
          error
        );

        return null;
      }

      return data as PerfilMorador | null;
    },
    []
  );

  /* =====================================================
     CARREGAR CHAT
  ===================================================== */

  const carregarChat = useCallback(
    async (mostrarAtualizando = false) => {
      try {
        if (mostrarAtualizando) {
          setAtualizando(true);
        } else {
          setCarregando(true);
        }

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

        /* VERIFICAR ADMIN */

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
          ![
            'admin',
            'sindico',
            'subsindico',
          ].includes(perfilAdmin.tipo)
        ) {
          setErro(
            'Esta conta não possui acesso ao chat administrativo.'
          );

          return;
        }

        /* MENSAGENS */

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
          (mensagensData ??
            []) as MensagemBanco[];

        if (lista.length === 0) {
          setMensagens({});
          setConversas([]);
          setConversaSelecionada(null);
          conversaSelecionadaRef.current = null;
          setChatMobileAberto(false);

          return;
        }

        /* MORADORES */

        const idsMoradores = [
          ...new Set(
            lista.map(
              item => item.morador_id
            )
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
            'ERRO MORADORES:',
            perfisError
          );

          setErro(
            'Não foi possível carregar os moradores.'
          );

          return;
        }

        const perfis =
          (perfisData ??
            []) as PerfilMorador[];

        const mapaPerfis = new Map(
          perfis.map(perfil => [
            perfil.id,
            perfil,
          ])
        );

        /* AGRUPAR */

        const agrupadas: Record<
          string,
          MensagemBanco[]
        > = {};

        lista.forEach(mensagem => {
          if (
            !agrupadas[
              mensagem.morador_id
            ]
          ) {
            agrupadas[
              mensagem.morador_id
            ] = [];
          }

          agrupadas[
            mensagem.morador_id
          ].push(mensagem);
        });

        /* CONVERSAS */

        const novasConversas =
          Object.entries(agrupadas)
            .map(
              ([
                moradorId,
                listaMensagens,
              ]) => {
                const perfil =
                  mapaPerfis.get(
                    moradorId
                  );

                const ultima =
                  listaMensagens[
                    listaMensagens.length -
                      1
                  ];

                const naoLidas =
                  listaMensagens.filter(
                    item =>
                      item.remetente_tipo ===
                        'morador' &&
                      !item.lida
                  ).length;

                return {
                  id: moradorId,

                  morador:
                    perfil?.nome ??
                    'Morador',

                  residencia: perfil
                    ? montarResidencia(
                        perfil
                      )
                    : 'Residência não informada',

                  ultimaMensagem:
                    ultima?.mensagem ?? '',

                  horario: ultima
                    ? formatarHorario(
                        ultima.criado_em
                      )
                    : '',

                  naoLidas,

                  _data:
                    ultima?.criado_em ??
                    '',
                };
              }
            )
            .sort(
              (a, b) =>
                new Date(
                  b._data
                ).getTime() -
                new Date(
                  a._data
                ).getTime()
            )
            .map(
              ({
                _data,
                ...conversa
              }) => conversa
            );

        setMensagens(agrupadas);
        setConversas(
          novasConversas
        );

        setConversaSelecionada(
          atual => {
            if (
              atual &&
              novasConversas.some(
                item =>
                  item.id === atual
              )
            ) {
              conversaSelecionadaRef.current =
                atual;

              return atual;
            }

            if (isMobile) {
              conversaSelecionadaRef.current =
                null;

              return null;
            }

            const primeira =
              novasConversas[0]?.id ??
              null;

            conversaSelecionadaRef.current =
              primeira;

            return primeira;
          }
        );
      } catch (error) {
        console.error(
          'ERRO CHAT ADMIN:',
          error
        );

        setErro(
          'Ocorreu um erro ao carregar o chat.'
        );
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    [isMobile]
  );

  useEffect(() => {
    carregarChat();
  }, [carregarChat]);

  /* =====================================================
     REALTIME
  ===================================================== */

  useEffect(() => {
    let ativo = true;

    const canal = supabase
      .channel(
        `admin-chat-${Date.now()}`
      )

      /* NOVA MENSAGEM */

      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_mensagens',
        },
        async payload => {
          if (!ativo) return;

          const mensagem =
            payload.new as MensagemBanco;

          if (
            !mensagem?.id ||
            !mensagem.morador_id
          ) {
            return;
          }

          const moradorId =
            mensagem.morador_id;

          /* ADICIONAR MENSAGEM */

          setMensagens(atual => {
            const listaAtual =
              atual[moradorId] ?? [];

            if (
              listaAtual.some(
                item =>
                  item.id ===
                  mensagem.id
              )
            ) {
              return atual;
            }

            return {
              ...atual,

              [moradorId]: [
                ...listaAtual,
                mensagem,
              ],
            };
          });

          /* PERFIL */

          const perfil =
            await buscarPerfilMorador(
              moradorId
            );

          if (!ativo) return;

          const conversaAberta =
            conversaSelecionadaRef.current ===
            moradorId;

          /* ATUALIZAR CONVERSA */

          setConversas(atual => {
            const existente =
              atual.find(
                item =>
                  item.id ===
                  moradorId
              );

            const recebida =
              mensagem.remetente_tipo ===
                'morador' &&
              !mensagem.lida;

            const conversa: Conversa = {
              id: moradorId,

              morador:
                existente?.morador ??
                perfil?.nome ??
                'Morador',

              residencia:
                existente?.residencia ??
                (perfil
                  ? montarResidencia(
                      perfil
                    )
                  : 'Residência não informada'),

              ultimaMensagem:
                mensagem.mensagem,

              horario:
                formatarHorario(
                  mensagem.criado_em
                ),

              naoLidas:
                conversaAberta
                  ? 0
                  : recebida
                    ? (existente?.naoLidas ??
                        0) + 1
                    : existente?.naoLidas ??
                      0,
            };

            return [
              conversa,

              ...atual.filter(
                item =>
                  item.id !==
                  moradorId
              ),
            ];
          });

          /* MARCAR COMO LIDA */

          if (
            conversaAberta &&
            mensagem.remetente_tipo ===
              'morador' &&
            !mensagem.lida
          ) {
            const { error } =
              await supabase
                .from(
                  'chat_mensagens'
                )
                .update({
                  lida: true,
                })
                .eq(
                  'id',
                  mensagem.id
                );

            if (error) {
              console.error(
                'ERRO AO MARCAR REALTIME COMO LIDA:',
                error
              );

              return;
            }

            setMensagens(atual => ({
              ...atual,

              [moradorId]: (
                atual[moradorId] ??
                []
              ).map(item =>
                item.id ===
                mensagem.id
                  ? {
                      ...item,
                      lida: true,
                    }
                  : item
              ),
            }));
          }
        }
      )

      /* ATUALIZAÇÃO */

      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_mensagens',
        },
        payload => {
          if (!ativo) return;

          const atualizada =
            payload.new as MensagemBanco;

          if (
            !atualizada?.id ||
            !atualizada.morador_id
          ) {
            return;
          }

          setMensagens(atual => ({
            ...atual,

            [atualizada.morador_id]:
              (
                atual[
                  atualizada.morador_id
                ] ?? []
              ).map(item =>
                item.id ===
                atualizada.id
                  ? atualizada
                  : item
              ),
          }));
        }
      )

      .subscribe(status => {
        console.log(
          'REALTIME CHAT ADMIN:',
          status
        );
      });

    return () => {
      ativo = false;

      supabase.removeChannel(
        canal
      );
    };
  }, [buscarPerfilMorador]);

  /* =====================================================
     CONVERSA ATUAL
  ===================================================== */

  const conversaAtual =
    conversas.find(
      item =>
        item.id ===
        conversaSelecionada
    );

  const mensagensAtuais =
    conversaSelecionada
      ? mensagens[
          conversaSelecionada
        ] ?? []
      : [];

  /* =====================================================
     FILTRO
  ===================================================== */

  const conversasFiltradas =
    useMemo(() => {
      const termo =
        busca
          .trim()
          .toLowerCase();

      if (!termo) {
        return conversas;
      }

      return conversas.filter(
        item =>
          item.morador
            .toLowerCase()
            .includes(termo) ||
          item.residencia
            .toLowerCase()
            .includes(termo)
      );
    }, [busca, conversas]);

  /* =====================================================
     SCROLL AUTOMÁTICO
  ===================================================== */

  useEffect(() => {
    if (
      !conversaSelecionada ||
      mensagensAtuais.length === 0
    ) {
      return;
    }

    const timer = setTimeout(
      () => {
        mensagensScrollRef.current?.scrollToEnd(
          {
            animated: true,
          }
        );
      },
      100
    );

    return () =>
      clearTimeout(timer);
  }, [
    conversaSelecionada,
    mensagensAtuais.length,
  ]);

  /* =====================================================
     SELECIONAR CONVERSA
  ===================================================== */

  async function selecionarConversa(
    id: string
  ) {
    setConversaSelecionada(id);

    conversaSelecionadaRef.current =
      id;

    setNovaMensagem('');

    if (isMobile) {
      setChatMobileAberto(true);
    }

    setConversas(atual =>
      atual.map(item =>
        item.id === id
          ? {
              ...item,
              naoLidas: 0,
            }
          : item
      )
    );

    const lista =
      mensagens[id] ?? [];

    const idsNaoLidas =
      lista
        .filter(
          item =>
            item.remetente_tipo ===
              'morador' &&
            !item.lida
        )
        .map(item => item.id);

    if (
      idsNaoLidas.length === 0
    ) {
      return;
    }

    /* ATUALIZA LOCALMENTE */

    setMensagens(atual => ({
      ...atual,

      [id]: (
        atual[id] ?? []
      ).map(item =>
        idsNaoLidas.includes(
          item.id
        )
          ? {
              ...item,
              lida: true,
            }
          : item
      ),
    }));

    /* ATUALIZA BANCO */

    const { error } =
      await supabase
        .from('chat_mensagens')
        .update({
          lida: true,
        })
        .in(
          'id',
          idsNaoLidas
        );

    if (error) {
      console.error(
        'ERRO AO MARCAR COMO LIDA:',
        error
      );
    }
  }

  /* =====================================================
     VOLTAR MOBILE
  ===================================================== */

  function voltarConversas() {
    setChatMobileAberto(false);
  }

  /* =====================================================
     ENVIAR
  ===================================================== */

  async function enviarMensagem() {
    const texto =
      novaMensagem.trim();

    const moradorId =
      conversaSelecionadaRef.current ??
      conversaSelecionada;

    if (
      !texto ||
      !moradorId ||
      enviando
    ) {
      return;
    }

    /* LIMPA IMEDIATAMENTE */

    setNovaMensagem('');
    setEnviando(true);
    setErro('');

    try {
      const {
        data: userData,
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !userData.user
      ) {
        setNovaMensagem(texto);

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
            moradorId,

          remetente_id:
            userData.user.id,

          remetente_tipo:
            'administracao',

          mensagem:
            texto,

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
          'ERRO AO ENVIAR:',
          error
        );

        setNovaMensagem(texto);

        setErro(
          `Não foi possível enviar a mensagem: ${error.message}`
        );

        return;
      }

      const mensagem =
        data as MensagemBanco;

      /* ADICIONA SEM DUPLICAR */

      setMensagens(atual => {
        const lista =
          atual[moradorId] ?? [];

        if (
          lista.some(
            item =>
              item.id ===
              mensagem.id
          )
        ) {
          return atual;
        }

        return {
          ...atual,

          [moradorId]: [
            ...lista,
            mensagem,
          ],
        };
      });

      /* ATUALIZA CONVERSA */

      setConversas(atual => {
        const conversa =
          atual.find(
            item =>
              item.id ===
              moradorId
          );

        if (!conversa) {
          return atual;
        }

        const atualizada: Conversa = {
          ...conversa,

          ultimaMensagem:
            mensagem.mensagem,

          horario:
            formatarHorario(
              mensagem.criado_em
            ),
        };

        return [
          atualizada,

          ...atual.filter(
            item =>
              item.id !==
              moradorId
          ),
        ];
      });
    } catch (error) {
      console.error(
        'ERRO INESPERADO AO ENVIAR:',
        error
      );

      setNovaMensagem(texto);

      setErro(
        'Ocorreu um erro ao enviar a mensagem.'
      );
    } finally {
      setEnviando(false);
    }
  }

  /* =====================================================
     LISTA DE CONVERSAS
  ===================================================== */

  const listaConversas = (
    <View
      style={[
        styles.conversasArea,
        isMobile &&
          styles.conversasAreaMobile,
      ]}
    >
      <View
        style={
          styles.conversasHeader
        }
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          Conversas
        </Text>

        <Text
          style={styles.totalText}
        >
          {conversas.length}{' '}
          {conversas.length === 1
            ? 'morador'
            : 'moradores'}
        </Text>
      </View>

      <View
        style={styles.searchBox}
      >
        <Search
          size={17}
          color={
            colors.textSecondary
          }
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
        style={
          styles.listaConversas
        }
        contentContainerStyle={
          styles.listaConversasContent
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        {carregando ? (
          <View
            style={styles.listaVazia}
          >
            <ActivityIndicator
              size="small"
              color={colors.primary}
            />

            <Text
              style={
                styles.listaVaziaText
              }
            >
              Carregando conversas...
            </Text>
          </View>
        ) : conversasFiltradas.length ===
          0 ? (
          <View
            style={styles.listaVazia}
          >
            <MessageCircle
              size={30}
              color={
                colors.textLight
              }
            />

            <Text
              style={
                styles.listaVaziaText
              }
            >
              Nenhuma conversa encontrada.
            </Text>
          </View>
        ) : (
          conversasFiltradas.map(
            item => {
              const ativa =
                item.id ===
                conversaSelecionada;

              return (
                <Pressable
                  key={item.id}
                  style={({
                    pressed,
                  }) => [
                    styles.conversaItem,

                    ativa &&
                      styles.conversaItemAtiva,

                    pressed &&
                      !ativa &&
                      styles.conversaItemPressed,
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
                      numberOfLines={1}
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
                          style={[
                            styles.badge,

                            ativa &&
                              styles.badgeAtiva,
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,

                              ativa &&
                                styles.badgeTextAtiva,
                            ]}
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
  );

  /* =====================================================
     ÁREA DE MENSAGENS
  ===================================================== */

  const areaMensagens = (
    <View
      style={[
        styles.mensagensArea,

        isMobile &&
          styles.mensagensAreaMobile,
      ]}
    >
      {conversaAtual ? (
        <>
          <View
            style={[
              styles.mensagemHeader,

              isMobile &&
                styles.mensagemHeaderMobile,
            ]}
          >
            {isMobile && (
              <Pressable
                style={({
                  pressed,
                }) => [
                  styles.backButton,

                  pressed &&
                    styles.buttonPressed,
                ]}
                onPress={
                  voltarConversas
                }
              >
                <ArrowLeft
                  size={20}
                  color={
                    colors.primary
                  }
                />
              </Pressable>
            )}

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

            <View
              style={
                styles.mensagemHeaderInfo
              }
            >
              <Text
                numberOfLines={1}
                style={
                  styles.mensagemNome
                }
              >
                {
                  conversaAtual.morador
                }
              </Text>

              <Text
                numberOfLines={1}
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

          {/* MENSAGENS */}

          <View
            style={
              styles.mensagensContainer
            }
          >
            <ScrollView
              ref={
                mensagensScrollRef
              }
              style={
                styles.mensagensScroll
              }
              contentContainerStyle={[
                styles.mensagensContent,

                isMobile &&
                  styles.mensagensContentMobile,
              ]}
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              onContentSizeChange={() =>
                mensagensScrollRef.current?.scrollToEnd(
                  {
                    animated: true,
                  }
                )
              }
            >
              {mensagensAtuais.map(
                mensagem => {
                  const admin =
                    mensagem.remetente_tipo ===
                    'administracao';

                  return (
                    <View
                      key={
                        mensagem.id
                      }
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

                          isMobile &&
                            styles.balaoMobile,

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
          </View>

          {/* ENVIO */}

          <View
            style={[
              styles.enviarArea,

              isMobile &&
                styles.enviarAreaMobile,
            ]}
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
              multiline
              style={[
                styles.mensagemInput,

                isMobile &&
                  styles.mensagemInputMobile,
              ]}
              onKeyPress={event => {
                if (
                  !isMobile &&
                  event.nativeEvent.key ===
                    'Enter'
                ) {
                  // O botão continua sendo
                  // a forma segura de enviar
                  // mensagens multilinha.
                }
              }}
            />

            <Pressable
              style={({
                pressed,
              }) => [
                styles.enviarButton,

                (!novaMensagem.trim() ||
                  enviando) &&
                  styles.enviarButtonDisabled,

                pressed &&
                  styles.buttonPressed,
              ]}
              onPress={
                enviarMensagem
              }
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
        <View
          style={styles.vazio}
        >
          <MessageCircle
            size={40}
            color={colors.textLight}
          />

          <Text
            style={
              styles.vazioTitle
            }
          >
            Nenhuma conversa
          </Text>

          <Text
            style={
              styles.vazioText
            }
          >
            Quando um morador enviar
            uma mensagem, a conversa
            aparecerá aqui.
          </Text>
        </View>
      )}
    </View>
  );

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <WebLayout
      sidebar={
        <WebSidebar active="chat" />
      }
      scroll={isMobile}
      contentStyle={
        styles.layoutContent
      }
    >
      <View
        style={[
          styles.page,

          isMobile &&
            styles.pageMobile,
        ]}
      >
        {/* HEADER */}

        <View
          style={[
            styles.header,

            isMobile &&
              styles.headerMobile,
          ]}
        >
          <View
            style={
              styles.headerTextArea
            }
          >
            <Text
              style={[
                styles.title,

                isMobile &&
                  styles.titleMobile,
              ]}
            >
              Chat
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Converse diretamente
              com os moradores.
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
              style={({
                pressed,
              }) => [
                styles.refreshButton,

                isMobile &&
                  styles.refreshButtonMobile,

                pressed &&
                  styles.buttonPressed,
              ]}
              onPress={() =>
                carregarChat(true)
              }
              disabled={
                carregando ||
                atualizando
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
                  size={18}
                  color={
                    colors.textSecondary
                  }
                />
              )}

              {isMobile && (
                <Text
                  style={
                    styles.refreshText
                  }
                >
                  Atualizar
                </Text>
              )}
            </Pressable>

            {!isMobile && (
              <View
                style={
                  styles.headerIcon
                }
              >
                <MessageCircle
                  size={24}
                  color={
                    colors.primary
                  }
                />
              </View>
            )}
          </View>
        </View>

        {/* ERRO */}

        {!!erro && (
          <View
            style={
              styles.errorBox
            }
          >
            <Text
              style={
                styles.errorText
              }
            >
              {erro}
            </Text>
          </View>
        )}

        {/* DESKTOP */}

        {!isMobile && (
          <View
            style={
              styles.chatContainer
            }
          >
            {listaConversas}
            {areaMensagens}
          </View>
        )}

        {/* MOBILE */}

        {isMobile && (
          <View
            style={
              styles.chatContainerMobile
            }
          >
            {chatMobileAberto &&
            conversaAtual
              ? areaMensagens
              : listaConversas}
          </View>
        )}
      </View>
    </WebLayout>
  );
}

/* =====================================================
   ESTILOS
===================================================== */

const styles = StyleSheet.create({
  layoutContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },

  page: {
    flex: 1,
    width: '100%',
    minWidth: 0,
  },

  pageMobile: {
    flex: 0,
    flexGrow: 0,
    flexShrink: 0,
    width: '100%',
    minWidth: 0,
    paddingBottom: 30,
  },

  /* HEADER */

  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 22,
    flexShrink: 0,
  },

  headerMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  headerTextArea: {
    flex: 1,
    minWidth: 0,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },

  headerActionsMobile: {
    width: '100%',
    marginLeft: 0,
    marginTop: 14,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },

  titleMobile: {
    fontSize: 23,
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color:
      colors.textSecondary,
    marginTop: 5,
  },

  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
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
    width: '100%',
    flexDirection: 'row',
    marginRight: 0,
  },

  refreshText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
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

  buttonPressed: {
    opacity: 0.7,
  },

  /* ERRO */

  errorBox: {
    width: '100%',
    backgroundColor:
      colors.dangerLight,
    borderRadius: 10,
    padding: 11,
    marginBottom: 14,
    flexShrink: 0,
  },

  errorText: {
    color: colors.danger,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '700',
  },

  /* CHAT */

  chatContainer: {
    flex: 1,
    width: '100%',
    minHeight: 500,
    minWidth: 0,
    backgroundColor:
      colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor:
      colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
  },

  /*
   * IMPORTANTE:
   * altura fixa no mobile evita
   * o chat desaparecer/encolher.
   */

  chatContainerMobile: {
    flex: 0,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 620,

    width: '100%',
    minWidth: 0,

    height: 620,
    minHeight: 620,
    maxHeight: 620,

    backgroundColor:
      colors.surface,

    borderRadius: 14,
    borderWidth: 1,
    borderColor:
      colors.border,

    overflow: 'hidden',
    marginBottom: 20,
  },

  /* CONVERSAS */

  conversasArea: {
    width: 340,
    minWidth: 300,
    borderRightWidth: 1,
    borderRightColor:
      colors.border,
    backgroundColor:
      colors.surface,
  },

  conversasAreaMobile: {
    flex: 1,
    width: '100%',
    minWidth: 0,
    minHeight: 0,
    borderRightWidth: 0,
  },

  conversasHeader: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    flexShrink: 0,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },

  totalText: {
    fontSize: 10,
    color:
      colors.textSecondary,
  },

  /* BUSCA */

  searchBox: {
    marginHorizontal: 16,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor:
      colors.border,
    backgroundColor:
      colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
    flexShrink: 0,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    height: 40,
    marginLeft: 8,
    fontSize: 12,
    color: colors.text,
    outlineStyle: 'none',
  } as any,

  listaConversas: {
    flex: 1,
    minHeight: 0,
  },

  listaConversasContent: {
    flexGrow: 1,
  },

  listaVazia: {
    paddingVertical: 45,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  listaVaziaText: {
    color:
      colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 10,
  },

  /* ITEM */

  conversaItem: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },

  conversaItemPressed: {
    backgroundColor:
      colors.background,
  },

  conversaItemAtiva: {
    backgroundColor:
      colors.primary,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor:
      colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    flexShrink: 0,
  },

  avatarAtivo: {
    backgroundColor:
      'rgba(255,255,255,0.20)',
  },

  conversaInfo: {
    flex: 1,
    minWidth: 0,
  },

  conversaLinha: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  moradorNome: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    marginRight: 8,
  },

  horarioLista: {
    fontSize: 9,
    color:
      colors.textSecondary,
    flexShrink: 0,
  },

  residencia: {
    fontSize: 9,
    color:
      colors.textSecondary,
    marginTop: 2,
  },

  previewLinha: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  preview: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    color:
      colors.textSecondary,
    marginRight: 6,
  },

  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor:
      colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  badgeAtiva: {
    backgroundColor:
      '#FFFFFF',
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },

  badgeTextAtiva: {
    color: colors.primary,
  },

  textoAtivo: {
    color: '#FFFFFF',
  },

  textoAtivoSecundario: {
    color:
      'rgba(255,255,255,0.75)',
  },

  /* ÁREA MENSAGENS */

  mensagensArea: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    backgroundColor:
      colors.surface,
  },

  mensagensAreaMobile: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    width: '100%',
    minWidth: 0,
    minHeight: 0,
    overflow: 'hidden',
  },

  mensagemHeader: {
    height: 72,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    flexShrink: 0,
  },

  mensagemHeaderMobile: {
    height: 68,
    minHeight: 68,
    maxHeight: 68,
    paddingHorizontal: 10,
    flexShrink: 0,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor:
      colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
    flexShrink: 0,
  },

  avatarGrande: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor:
      colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    flexShrink: 0,
  },

  mensagemHeaderInfo: {
    flex: 1,
    minWidth: 0,
  },

  mensagemNome: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },

  mensagemResidencia: {
    fontSize: 10,
    color:
      colors.textSecondary,
    marginTop: 2,
  },

  /* CONTAINER INTERNO */

  mensagensContainer: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    width: '100%',
    minHeight: 0,
    overflow: 'hidden',
    backgroundColor:
      colors.background,
  },

  mensagensScroll: {
    flex: 1,
    flexGrow: 1,
    width: '100%',
    minHeight: 0,
    backgroundColor:
      colors.background,
  },

  mensagensContent: {
    flexGrow: 1,
    padding: 20,
  },

  mensagensContentMobile: {
    paddingHorizontal: 12,
    paddingVertical: 16,
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

  balaoMobile: {
    maxWidth: '88%',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  balaoAdmin: {
    backgroundColor:
      colors.primary,
    borderBottomRightRadius: 4,
  },

  balaoMorador: {
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor:
      colors.border,
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
    color:
      colors.textSecondary,
    marginTop: 5,
    textAlign: 'right',
  },

  mensagemHorarioAdmin: {
    color:
      'rgba(255,255,255,0.70)',
  },

  /* ENVIO */

  enviarArea: {
    width: '100%',
    minHeight: 76,
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
    backgroundColor:
      colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexShrink: 0,
  },

  enviarAreaMobile: {
    width: '100%',

    height: 76,
    minHeight: 76,
    maxHeight: 76,

    paddingHorizontal: 10,
    paddingVertical: 10,

    flexShrink: 0,
    flexGrow: 0,
  },

  mensagemInput: {
    flex: 1,
    minWidth: 0,
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

  mensagemInputMobile: {
    height: 46,
    minHeight: 46,
    maxHeight: 46,
    paddingHorizontal: 11,
  },

  enviarButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor:
      colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    flexShrink: 0,
  },

  enviarButtonDisabled: {
    opacity: 0.45,
  },

  /* VAZIO */

  vazio: {
    flex: 1,
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  vazioTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },

  vazioText: {
    marginTop: 5,
    maxWidth: 300,
    fontSize: 11,
    lineHeight: 17,
    color:
      colors.textSecondary,
    textAlign: 'center',
  },
});