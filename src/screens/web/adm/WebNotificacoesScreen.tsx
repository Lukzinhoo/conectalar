import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  Bell,
  BellRing,
  CalendarCheck,
  CheckCircle2,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react-native';

import WebSidebar from '../../../components/WebSidebar';
import { colors } from '../../../theme/theme';
import { supabase } from '../../../services/supabase';

/* =====================================================
   TIPOS
===================================================== */

type TipoNotificacao =
  | 'sistema'
  | 'reserva'
  | 'comunicado'
  | 'ocorrencia'
  | 'mensagem';

type DestinatarioTipo =
  | 'morador'
  | 'administracao';

type NotificacaoBanco = {
  id: string;
  morador_id: string;
  titulo: string;
  mensagem: string;
  tipo: TipoNotificacao;
  lida: boolean;
  criado_em: string;
  destinatario_tipo: DestinatarioTipo;
};

type NotificacaoAgrupada = {
  chave: string;
  titulo: string;
  mensagem: string;
  tipo: TipoNotificacao;
  criado_em: string;
  quantidade: number;
  lidas: number;
  ids: string[];
  destinatario_tipo: DestinatarioTipo;
};

type PerfilMorador = {
  id: string;
  nome: string;
  ativo: boolean;
  tipo: string;
};

/* =====================================================
   FUNÇÕES AUXILIARES
===================================================== */

function tipoLabel(
  tipo: TipoNotificacao
) {
  switch (tipo) {
    case 'sistema':
      return 'Sistema';

    case 'reserva':
      return 'Reserva';

    case 'comunicado':
      return 'Comunicado';

    case 'ocorrencia':
      return 'Ocorrência';

    case 'mensagem':
      return 'Mensagem';

    default:
      return 'Sistema';
  }
}

function formatarData(
  dataIso: string
) {
  try {
    return new Date(
      dataIso
    ).toLocaleString(
      'pt-BR',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  } catch {
    return dataIso;
  }
}

/* =====================================================
   TELA
===================================================== */

export default function WebNotificacoesScreen() {
  const [
    notificacoesAdministracao,
    setNotificacoesAdministracao,
  ] = useState<
    NotificacaoAgrupada[]
  >([]);

  const [
    notificacoesEnviadas,
    setNotificacoesEnviadas,
  ] = useState<
    NotificacaoAgrupada[]
  >([]);

  const [busca, setBusca] =
    useState('');

  const [
    modalAberto,
    setModalAberto,
  ] = useState(false);

  const [titulo, setTitulo] =
    useState('');

  const [mensagem, setMensagem] =
    useState('');

  const [tipo, setTipo] =
    useState<TipoNotificacao>(
      'sistema'
    );

  const [erro, setErro] =
    useState('');

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    atualizando,
    setAtualizando,
  ] = useState(false);

  const [salvando, setSalvando] =
    useState(false);

  const [
    excluindo,
    setExcluindo,
  ] = useState<string | null>(
    null
  );

  const [aba, setAba] =
    useState<
      'recebidas' | 'enviadas'
    >('recebidas');

  /* ===================================================
     CARREGAMENTO
  =================================================== */

  useEffect(() => {
    carregarNotificacoes(false);
  }, []);

  /* ===================================================
     VERIFICAR ADMIN
  =================================================== */

  async function verificarAdministrador() {
    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (
      userError ||
      !user
    ) {
      return {
        permitido: false,
        mensagem:
          'Não foi possível identificar o administrador.',
      };
    }

    const {
      data: perfil,
      error: perfilError,
    } = await supabase
      .from('perfis')
      .select(
        'id, tipo, ativo'
      )
      .eq('id', user.id)
      .maybeSingle();

    if (
      perfilError ||
      !perfil
    ) {
      return {
        permitido: false,
        mensagem:
          'Perfil administrativo não encontrado.',
      };
    }

    const permitido =
      perfil.ativo === true &&
      [
        'admin',
        'sindico',
        'subsindico',
      ].includes(
        perfil.tipo
      );

    return {
      permitido,

      mensagem: permitido
        ? ''
        : 'Este usuário não possui permissão administrativa.',
    };
  }

  /* ===================================================
     AGRUPAR NOTIFICAÇÕES
  =================================================== */

  function agruparNotificacoes(
    registros: NotificacaoBanco[]
  ) {
    const grupos =
      new Map<
        string,
        NotificacaoAgrupada
      >();

    registros.forEach(
      (item) => {
        const data =
          new Date(
            item.criado_em
          );

        data.setMilliseconds(
          0
        );

        const chave = [
          item.titulo,
          item.mensagem,
          item.tipo,
          item.destinatario_tipo,
          data.toISOString(),
        ].join('|');

        const existente =
          grupos.get(chave);

        if (existente) {
          existente.quantidade +=
            1;

          if (item.lida) {
            existente.lidas +=
              1;
          }

          existente.ids.push(
            item.id
          );

          return;
        }

        grupos.set(
          chave,
          {
            chave,
            titulo:
              item.titulo,

            mensagem:
              item.mensagem,

            tipo:
              item.tipo,

            criado_em:
              item.criado_em,

            quantidade: 1,

            lidas:
              item.lida
                ? 1
                : 0,

            ids: [
              item.id,
            ],

            destinatario_tipo:
              item.destinatario_tipo,
          }
        );
      }
    );

    return Array.from(
      grupos.values()
    ).sort(
      (a, b) =>
        new Date(
          b.criado_em
        ).getTime() -
        new Date(
          a.criado_em
        ).getTime()
    );
  }

  /* ===================================================
     CARREGAR
  =================================================== */

  async function carregarNotificacoes(
    mostrarAtualizando = true
  ) {
    try {
      if (
        mostrarAtualizando
      ) {
        setAtualizando(true);
      } else {
        setCarregando(true);
      }

      setErro('');

      const acesso =
        await verificarAdministrador();

      if (
        !acesso.permitido
      ) {
        setErro(
          acesso.mensagem
        );

        setNotificacoesAdministracao(
          []
        );

        setNotificacoesEnviadas(
          []
        );

        return;
      }

      /* -----------------------------------------------
         NOTIFICAÇÕES RECEBIDAS PELA ADMINISTRAÇÃO
      ------------------------------------------------ */

      const {
        data:
          recebidasData,
        error:
          recebidasError,
      } = await supabase
        .from(
          'notificacoes'
        )
        .select(`
          id,
          morador_id,
          titulo,
          mensagem,
          tipo,
          lida,
          criado_em,
          destinatario_tipo
        `)
        .eq(
          'destinatario_tipo',
          'administracao'
        )
        .order(
          'criado_em',
          {
            ascending:
              false,
          }
        );

      if (
        recebidasError
      ) {
        console.error(
          'ERRO AO CARREGAR NOTIFICAÇÕES DA ADMINISTRAÇÃO:',
          recebidasError
        );

        setErro(
          `Não foi possível carregar as notificações: ${recebidasError.message}`
        );

        return;
      }

      /* -----------------------------------------------
         NOTIFICAÇÕES ENVIADAS AOS MORADORES
      ------------------------------------------------ */

      const {
        data:
          enviadasData,
        error:
          enviadasError,
      } = await supabase
        .from(
          'notificacoes'
        )
        .select(`
          id,
          morador_id,
          titulo,
          mensagem,
          tipo,
          lida,
          criado_em,
          destinatario_tipo
        `)
        .eq(
          'destinatario_tipo',
          'morador'
        )
        .order(
          'criado_em',
          {
            ascending:
              false,
          }
        );

      if (
        enviadasError
      ) {
        console.error(
          'ERRO AO CARREGAR NOTIFICAÇÕES ENVIADAS:',
          enviadasError
        );

        setErro(
          `Não foi possível carregar as notificações enviadas: ${enviadasError.message}`
        );

        return;
      }

      const recebidas =
        (
          recebidasData ??
          []
        ) as NotificacaoBanco[];

      const enviadas =
        (
          enviadasData ??
          []
        ) as NotificacaoBanco[];

      setNotificacoesAdministracao(
        agruparNotificacoes(
          recebidas
        )
      );

      setNotificacoesEnviadas(
        agruparNotificacoes(
          enviadas
        )
      );
    } catch (error) {
      console.error(
        'ERRO INESPERADO:',
        error
      );

      setErro(
        'Não foi possível carregar as notificações.'
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  /* ===================================================
     ABRIR MODAL
  =================================================== */

  function abrirNovaNotificacao() {
    setTitulo('');
    setMensagem('');

    setTipo(
      'sistema'
    );

    setErro('');

    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) {
      return;
    }

    setModalAberto(false);

    setTitulo('');
    setMensagem('');

    setTipo(
      'sistema'
    );

    setErro('');
  }

  /* ===================================================
     ENVIAR NOTIFICAÇÃO AOS MORADORES
  =================================================== */

  async function enviarNotificacao() {
    const tituloLimpo =
      titulo.trim();

    const mensagemLimpa =
      mensagem.trim();

    if (
      !tituloLimpo
    ) {
      setErro(
        'Informe o título da notificação.'
      );

      return;
    }

    if (
      !mensagemLimpa
    ) {
      setErro(
        'Informe a mensagem da notificação.'
      );

      return;
    }

    try {
      setSalvando(true);

      setErro('');

      const acesso =
        await verificarAdministrador();

      if (
        !acesso.permitido
      ) {
        setErro(
          acesso.mensagem
        );

        return;
      }

      const {
        data: moradores,
        error:
          moradoresError,
      } = await supabase
        .from('perfis')
        .select(`
          id,
          nome,
          ativo,
          tipo
        `)
        .eq(
          'tipo',
          'morador'
        )
        .eq(
          'ativo',
          true
        );

      if (
        moradoresError
      ) {
        setErro(
          `Não foi possível buscar os moradores: ${moradoresError.message}`
        );

        return;
      }

      const listaMoradores =
        (
          moradores ?? []
        ) as PerfilMorador[];

      if (
        listaMoradores.length ===
        0
      ) {
        setErro(
          'Não existem moradores ativos para receber esta notificação.'
        );

        return;
      }

      const criadoEm =
        new Date().toISOString();

      /*
       * IMPORTANTE:
       * notificações criadas pelo ADM
       * são destinadas aos moradores.
       */

      const registros =
        listaMoradores.map(
          (morador) => ({
            morador_id:
              morador.id,

            titulo:
              tituloLimpo,

            mensagem:
              mensagemLimpa,

            tipo,

            lida: false,

            criado_em:
              criadoEm,

            destinatario_tipo:
              'morador' as const,
          })
        );

      const {
        error:
          insertError,
      } = await supabase
        .from(
          'notificacoes'
        )
        .insert(
          registros
        );

      if (
        insertError
      ) {
        console.error(
          'ERRO AO ENVIAR:',
          insertError
        );

        setErro(
          `Não foi possível enviar a notificação: ${insertError.message}`
        );

        return;
      }

      setModalAberto(
        false
      );

      setTitulo('');
      setMensagem('');

      setTipo(
        'sistema'
      );

      setAba(
        'enviadas'
      );

      await carregarNotificacoes(
        false
      );
    } catch (error) {
      console.error(
        'ERRO AO ENVIAR:',
        error
      );

      setErro(
        'Ocorreu um erro ao enviar a notificação.'
      );
    } finally {
      setSalvando(false);
    }
  }

  /* ===================================================
     EXCLUIR
  =================================================== */

  async function excluirNotificacao(
    notificacao:
      NotificacaoAgrupada
  ) {
    const executar =
      async () => {
        try {
          setExcluindo(
            notificacao.chave
          );

          setErro('');

          const acesso =
            await verificarAdministrador();

          if (
            !acesso.permitido
          ) {
            setErro(
              acesso.mensagem
            );

            return;
          }

          const {
            error,
          } = await supabase
            .from(
              'notificacoes'
            )
            .delete()
            .in(
              'id',
              notificacao.ids
            );

          if (error) {
            setErro(
              `Não foi possível excluir: ${error.message}`
            );

            return;
          }

          await carregarNotificacoes(
            false
          );
        } catch (error) {
          console.error(
            'ERRO AO EXCLUIR:',
            error
          );

          setErro(
            'Não foi possível excluir a notificação.'
          );
        } finally {
          setExcluindo(
            null
          );
        }
      };

    if (
      typeof window !==
        'undefined' &&
      typeof window.confirm ===
        'function'
    ) {
      const confirmou =
        window.confirm(
          `Excluir a notificação "${notificacao.titulo}"?`
        );

      if (
        confirmou
      ) {
        await executar();
      }

      return;
    }

    Alert.alert(
      'Excluir notificação',
      `Deseja excluir "${notificacao.titulo}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style:
            'destructive',
          onPress: () => {
            executar();
          },
        },
      ]
    );
  }

  /* ===================================================
     LISTA ATUAL
  =================================================== */

  const listaAtual =
    aba === 'recebidas'
      ? notificacoesAdministracao
      : notificacoesEnviadas;

  const notificacoesFiltradas =
    useMemo(() => {
      const termo =
        busca
          .trim()
          .toLowerCase();

      if (!termo) {
        return listaAtual;
      }

      return listaAtual.filter(
        (item) =>
          item.titulo
            .toLowerCase()
            .includes(
              termo
            ) ||
          item.mensagem
            .toLowerCase()
            .includes(
              termo
            ) ||
          tipoLabel(
            item.tipo
          )
            .toLowerCase()
            .includes(
              termo
            )
      );
    }, [
      busca,
      listaAtual,
    ]);

  const totalRecebidas =
    notificacoesAdministracao.length;

  const totalEnviadas =
    notificacoesEnviadas.length;

  /* ===================================================
     INTERFACE
  =================================================== */

  return (
    <View
      style={
        styles.container
      }
    >
      <WebSidebar
        active="notificacoes"
      />

      <View
        style={
          styles.content
        }
      >
        {/* CABEÇALHO */}

        <View
          style={
            styles.header
          }
        >
          <View>
            <Text
              style={
                styles.title
              }
            >
              Notificações
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Acompanhe solicitações e envie avisos aos moradores.
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
                carregarNotificacoes()
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

            <Pressable
              style={
                styles.novaButton
              }
              onPress={
                abrirNovaNotificacao
              }
            >
              <Plus
                size={18}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.novaButtonText
                }
              >
                Nova notificação
              </Text>
            </Pressable>
          </View>
        </View>

        {!!erro && (
          <View
            style={
              styles.erroBox
            }
          >
            <Text
              style={
                styles.erroText
              }
            >
              {erro}
            </Text>
          </View>
        )}

        {/* RESUMO */}

        <View
          style={
            styles.cards
          }
        >
          <ResumoCard
            titulo="Recebidas"
            valor={
              totalRecebidas
            }
            tipo="recebida"
          />

          <ResumoCard
            titulo="Enviadas"
            valor={
              totalEnviadas
            }
            tipo="enviada"
          />
        </View>

        {/* ABAS */}

        <View
          style={
            styles.abas
          }
        >
          <Pressable
            style={[
              styles.abaButton,

              aba ===
                'recebidas' &&
                styles.abaButtonAtiva,
            ]}
            onPress={() =>
              setAba(
                'recebidas'
              )
            }
          >
            <BellRing
              size={17}
              color={
                aba ===
                'recebidas'
                  ? '#FFFFFF'
                  : colors.primary
              }
            />

            <Text
              style={[
                styles.abaText,

                aba ===
                  'recebidas' &&
                  styles.abaTextAtiva,
              ]}
            >
              Administração (
              {
                totalRecebidas
              }
              )
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.abaButton,

              aba ===
                'enviadas' &&
                styles.abaButtonAtiva,
            ]}
            onPress={() =>
              setAba(
                'enviadas'
              )
            }
          >
            <Send
              size={16}
              color={
                aba ===
                'enviadas'
                  ? '#FFFFFF'
                  : colors.primary
              }
            />

            <Text
              style={[
                styles.abaText,

                aba ===
                  'enviadas' &&
                  styles.abaTextAtiva,
              ]}
            >
              Enviadas aos moradores (
              {
                totalEnviadas
              }
              )
            </Text>
          </Pressable>
        </View>

        {/* BUSCA */}

        <View
          style={
            styles.searchRow
          }
        >
          <View
            style={
              styles.searchBox
            }
          >
            <Search
              size={18}
              color={
                colors.textSecondary
              }
            />

            <TextInput
              value={busca}
              onChangeText={
                setBusca
              }
              placeholder="Buscar notificação..."
              placeholderTextColor={
                colors.textLight
              }
              style={
                styles.searchInput
              }
            />
          </View>

          <Text
            style={
              styles.resultadoText
            }
          >
            {
              notificacoesFiltradas.length
            }{' '}
            {notificacoesFiltradas.length ===
            1
              ? 'notificação'
              : 'notificações'}
          </Text>
        </View>

        {/* LISTA */}

        <ScrollView
          style={
            styles.scroll
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          {carregando ? (
            <View
              style={
                styles.vazio
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
                  styles.vazioSubtitulo
                }
              >
                Carregando notificações...
              </Text>
            </View>
          ) : notificacoesFiltradas.length ===
            0 ? (
            <View
              style={
                styles.vazio
              }
            >
              <Bell
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
                Nenhuma notificação encontrada
              </Text>

              <Text
                style={
                  styles.vazioSubtitulo
                }
              >
                {aba ===
                'recebidas'
                  ? 'As solicitações dos moradores aparecerão aqui.'
                  : 'As notificações enviadas aos moradores aparecerão aqui.'}
              </Text>
            </View>
          ) : (
            notificacoesFiltradas.map(
              (
                notificacao
              ) => (
                <View
                  key={
                    notificacao.chave
                  }
                  style={
                    styles.notificacaoCard
                  }
                >
                  <View
                    style={
                      styles.notificacaoIcon
                    }
                  >
                    {notificacao.tipo ===
                    'reserva' ? (
                      <CalendarCheck
                        size={
                          21
                        }
                        color={
                          colors.primary
                        }
                      />
                    ) : (
                      <BellRing
                        size={
                          21
                        }
                        color={
                          colors.primary
                        }
                      />
                    )}
                  </View>

                  <View
                    style={
                      styles.notificacaoInfo
                    }
                  >
                    <View
                      style={
                        styles.cardTopo
                      }
                    >
                      <View
                        style={
                          styles.tituloArea
                        }
                      >
                        <Text
                          style={
                            styles.notificacaoTitulo
                          }
                        >
                          {
                            notificacao.titulo
                          }
                        </Text>

                        <View
                          style={
                            styles.tipoBadge
                          }
                        >
                          <Text
                            style={
                              styles.tipoText
                            }
                          >
                            {tipoLabel(
                              notificacao.tipo
                            )}
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        style={
                          styles.deleteButton
                        }
                        disabled={
                          excluindo ===
                          notificacao.chave
                        }
                        onPress={() =>
                          excluirNotificacao(
                            notificacao
                          )
                        }
                      >
                        {excluindo ===
                        notificacao.chave ? (
                          <ActivityIndicator
                            size="small"
                            color={
                              colors.danger
                            }
                          />
                        ) : (
                          <Trash2
                            size={
                              16
                            }
                            color={
                              colors.danger
                            }
                          />
                        )}
                      </Pressable>
                    </View>

                    <Text
                      style={
                        styles.notificacaoMensagem
                      }
                    >
                      {
                        notificacao.mensagem
                      }
                    </Text>

                    <View
                      style={
                        styles.cardFooter
                      }
                    >
                      <Text
                        style={
                          styles.dataText
                        }
                      >
                        {formatarData(
                          notificacao.criado_em
                        )}
                      </Text>

                      {aba ===
                      'enviadas' ? (
                        <Text
                          style={
                            styles.destinatariosText
                          }
                        >
                          Enviada para{' '}
                          {
                            notificacao.quantidade
                          }{' '}
                          {notificacao.quantidade ===
                          1
                            ? 'morador'
                            : 'moradores'}
                          {' • '}
                          {
                            notificacao.lidas
                          }{' '}
                          {notificacao.lidas ===
                          1
                            ? 'leitura'
                            : 'leituras'}
                        </Text>
                      ) : (
                        <Text
                          style={
                            styles.destinatariosText
                          }
                        >
                          Destinada à administração
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              )
            )
          )}
        </ScrollView>
      </View>

      {/* =================================================
          MODAL
      ================================================= */}

      <Modal
        visible={
          modalAberto
        }
        transparent
        animationType="fade"
        onRequestClose={
          fecharModal
        }
      >
        <View
          style={
            styles.overlay
          }
        >
          <View
            style={
              styles.modal
            }
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  Nova notificação
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  A mensagem será enviada para todos os moradores ativos.
                </Text>
              </View>

              <Pressable
                style={
                  styles.closeButton
                }
                onPress={
                  fecharModal
                }
                disabled={
                  salvando
                }
              >
                <X
                  size={20}
                  color={
                    colors.textSecondary
                  }
                />
              </Pressable>
            </View>

            <Text
              style={
                styles.label
              }
            >
              Tipo
            </Text>

            <View
              style={
                styles.tipos
              }
            >
              {(
                [
                  'sistema',
                  'comunicado',
                  'reserva',
                  'ocorrencia',
                  'mensagem',
                ] as TipoNotificacao[]
              ).map(
                (
                  item
                ) => (
                  <Pressable
                    key={
                      item
                    }
                    style={[
                      styles.tipoButton,

                      tipo ===
                        item &&
                        styles.tipoButtonAtivo,
                    ]}
                    onPress={() =>
                      setTipo(
                        item
                      )
                    }
                    disabled={
                      salvando
                    }
                  >
                    <Text
                      style={[
                        styles.tipoButtonText,

                        tipo ===
                          item &&
                          styles.tipoButtonTextAtivo,
                      ]}
                    >
                      {tipoLabel(
                        item
                      )}
                    </Text>
                  </Pressable>
                )
              )}
            </View>

            <Text
              style={
                styles.label
              }
            >
              Título
            </Text>

            <TextInput
              value={titulo}
              onChangeText={
                setTitulo
              }
              placeholder="Ex.: Aviso importante"
              placeholderTextColor={
                colors.textLight
              }
              style={
                styles.input
              }
              maxLength={
                150
              }
              editable={
                !salvando
              }
            />

            <Text
              style={
                styles.label
              }
            >
              Mensagem
            </Text>

            <TextInput
              value={
                mensagem
              }
              onChangeText={
                setMensagem
              }
              placeholder="Digite a mensagem..."
              placeholderTextColor={
                colors.textLight
              }
              style={[
                styles.input,
                styles.textarea,
              ]}
              multiline
              maxLength={
                1500
              }
              textAlignVertical="top"
              editable={
                !salvando
              }
            />

            {!!erro && (
              <View
                style={
                  styles.erroBoxModal
                }
              >
                <Text
                  style={
                    styles.erroText
                  }
                >
                  {erro}
                </Text>
              </View>
            )}

            <View
              style={
                styles.modalButtons
              }
            >
              <Pressable
                style={
                  styles.cancelButton
                }
                onPress={
                  fecharModal
                }
                disabled={
                  salvando
                }
              >
                <Text
                  style={
                    styles.cancelText
                  }
                >
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.sendButton,

                  salvando &&
                    styles.buttonDisabled,
                ]}
                onPress={
                  enviarNotificacao
                }
                disabled={
                  salvando
                }
              >
                {salvando ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <>
                    <Send
                      size={
                        16
                      }
                      color="#FFFFFF"
                    />

                    <Text
                      style={
                        styles.sendText
                      }
                    >
                      Enviar
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* =====================================================
   RESUMO
===================================================== */

function ResumoCard({
  titulo,
  valor,
  tipo,
}: {
  titulo: string;
  valor: number;
  tipo:
    | 'recebida'
    | 'enviada';
}) {
  return (
    <View
      style={
        styles.resumoCard
      }
    >
      <View
        style={
          styles.resumoIcon
        }
      >
        {tipo ===
        'recebida' ? (
          <BellRing
            size={20}
            color={
              colors.primary
            }
          />
        ) : (
          <CheckCircle2
            size={20}
            color={
              colors.primary
            }
          />
        )}
      </View>

      <View>
        <Text
          style={
            styles.resumoValor
          }
        >
          {valor}
        </Text>

        <Text
          style={
            styles.resumoTitulo
          }
        >
          {titulo}
        </Text>
      </View>
    </View>
  );
}

/* =====================================================
   ESTILOS
===================================================== */

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      flexDirection:
        'row',
      backgroundColor:
        colors.background,
    },

    content: {
      flex: 1,
      padding: 28,
      minWidth: 0,
    },

    header: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      marginBottom: 20,
    },

    headerActions: {
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    title: {
      fontSize: 28,
      fontWeight:
        '800',
      color:
        colors.text,
    },

    subtitle: {
      fontSize: 13,
      color:
        colors.textSecondary,
      marginTop: 5,
    },

    refreshButton: {
      height: 44,
      borderRadius: 11,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.surface,
      paddingHorizontal: 14,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight: 9,
    },

    refreshText: {
      color:
        colors.primary,
      fontSize: 11,
      fontWeight:
        '800',
      marginLeft: 6,
    },

    novaButton: {
      height: 44,
      borderRadius: 11,
      backgroundColor:
        colors.primary,
      paddingHorizontal: 16,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    novaButtonText: {
      color:
        '#FFFFFF',
      fontSize: 12,
      fontWeight:
        '800',
      marginLeft: 7,
    },

    erroBox: {
      backgroundColor:
        colors.dangerLight,
      borderRadius: 9,
      padding: 10,
      marginBottom: 14,
    },

    erroBoxModal: {
      backgroundColor:
        colors.dangerLight,
      borderRadius: 9,
      padding: 10,
      marginTop: 12,
    },

    erroText: {
      color:
        colors.danger,
      fontSize: 10,
      fontWeight:
        '700',
    },

    cards: {
      flexDirection:
        'row',
      marginBottom: 16,
    },

    resumoCard: {
      minWidth: 190,
      backgroundColor:
        colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        colors.border,
      padding: 14,
      flexDirection:
        'row',
      alignItems:
        'center',
      marginRight: 12,
    },

    resumoIcon: {
      width: 40,
      height: 40,
      borderRadius: 11,
      backgroundColor:
        colors.primaryLight,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight: 11,
    },

    resumoValor: {
      fontSize: 18,
      fontWeight:
        '900',
      color:
        colors.text,
    },

    resumoTitulo: {
      fontSize: 9,
      color:
        colors.textSecondary,
      marginTop: 1,
    },

    abas: {
      flexDirection:
        'row',
      marginBottom: 16,
    },

    abaButton: {
      height: 42,
      borderRadius: 10,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.surface,
      paddingHorizontal: 14,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight: 8,
    },

    abaButtonAtiva: {
      backgroundColor:
        colors.primary,
      borderColor:
        colors.primary,
    },

    abaText: {
      color:
        colors.primary,
      fontSize: 10,
      fontWeight:
        '800',
      marginLeft: 6,
    },

    abaTextAtiva: {
      color:
        '#FFFFFF',
    },

    searchRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
      marginBottom: 16,
    },

    searchBox: {
      height: 44,
      width: '100%',
      maxWidth: 440,
      borderRadius: 11,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.surface,
      flexDirection:
        'row',
      alignItems:
        'center',
      paddingHorizontal: 13,
    },

    searchInput: {
      flex: 1,
      height: 42,
      marginLeft: 8,
      fontSize: 12,
      color:
        colors.text,
      outlineStyle:
        'none',
    } as any,

    resultadoText: {
      marginLeft: 12,
      fontSize: 9,
      fontWeight:
        '700',
      color:
        colors.textSecondary,
    },

    scroll: {
      flex: 1,
    },

    notificacaoCard: {
      backgroundColor:
        colors.surface,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        colors.border,
      padding: 17,
      flexDirection:
        'row',
      marginBottom: 11,
    },

    notificacaoIcon: {
      width: 43,
      height: 43,
      borderRadius: 12,
      backgroundColor:
        colors.primaryLight,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight: 14,
    },

    notificacaoInfo: {
      flex: 1,
      minWidth: 0,
    },

    cardTopo: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'flex-start',
    },

    tituloArea: {
      flex: 1,
      flexDirection:
        'row',
      alignItems:
        'center',
      flexWrap:
        'wrap',
    },

    notificacaoTitulo: {
      fontSize: 14,
      fontWeight:
        '800',
      color:
        colors.text,
      marginRight: 8,
    },

    tipoBadge: {
      backgroundColor:
        colors.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 7,
    },

    tipoText: {
      color:
        colors.primary,
      fontSize: 8,
      fontWeight:
        '800',
    },

    notificacaoMensagem: {
      fontSize: 11,
      lineHeight: 17,
      color:
        colors.textSecondary,
      marginTop: 8,
    },

    cardFooter: {
      flexDirection:
        'row',
      alignItems:
        'center',
      flexWrap:
        'wrap',
      marginTop: 8,
    },

    dataText: {
      fontSize: 8,
      color:
        colors.textLight,
      marginRight: 12,
    },

    destinatariosText: {
      fontSize: 8,
      color:
        colors.textSecondary,
      fontWeight:
        '700',
    },

    deleteButton: {
      width: 34,
      height: 34,
      borderRadius: 9,
      backgroundColor:
        colors.background,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginLeft: 10,
    },

    vazio: {
      minHeight: 300,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    vazioTitle: {
      marginTop: 10,
      fontSize: 14,
      fontWeight:
        '800',
      color:
        colors.text,
    },

    vazioSubtitulo: {
      marginTop: 6,
      fontSize: 10,
      color:
        colors.textSecondary,
    },

    overlay: {
      flex: 1,
      backgroundColor:
        'rgba(15, 23, 42, 0.45)',
      alignItems:
        'center',
      justifyContent:
        'center',
      padding: 20,
    },

    modal: {
      width: '100%',
      maxWidth: 600,
      maxHeight: '90%',
      backgroundColor:
        colors.surface,
      borderRadius: 18,
      padding: 22,
    },

    modalHeader: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'flex-start',
      marginBottom: 14,
    },

    modalTitle: {
      fontSize: 20,
      fontWeight:
        '800',
      color:
        colors.text,
    },

    modalSubtitle: {
      fontSize: 10,
      color:
        colors.textSecondary,
      marginTop: 3,
    },

    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 9,
      backgroundColor:
        colors.background,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    label: {
      fontSize: 11,
      fontWeight:
        '700',
      color:
        colors.text,
      marginBottom: 6,
      marginTop: 11,
    },

    tipos: {
      flexDirection:
        'row',
      flexWrap:
        'wrap',
    },

    tipoButton: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.background,
      paddingHorizontal: 10,
      paddingVertical: 7,
      marginRight: 6,
      marginBottom: 6,
    },

    tipoButtonAtivo: {
      backgroundColor:
        colors.primary,
      borderColor:
        colors.primary,
    },

    tipoButtonText: {
      fontSize: 9,
      fontWeight:
        '700',
      color:
        colors.textSecondary,
    },

    tipoButtonTextAtivo: {
      color:
        '#FFFFFF',
    },

    input: {
      width: '100%',
      minHeight: 45,
      borderRadius: 10,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.background,
      paddingHorizontal: 13,
      fontSize: 12,
      color:
        colors.text,
      outlineStyle:
        'none',
    } as any,

    textarea: {
      minHeight: 120,
      paddingTop: 12,
    },

    modalButtons: {
      flexDirection:
        'row',
      justifyContent:
        'flex-end',
      marginTop: 20,
    },

    cancelButton: {
      height: 42,
      paddingHorizontal: 16,
      borderRadius: 10,
      borderWidth: 1,
      borderColor:
        colors.border,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight: 8,
    },

    cancelText: {
      color:
        colors.textSecondary,
      fontSize: 11,
      fontWeight:
        '700',
    },

    sendButton: {
      minWidth: 100,
      height: 42,
      paddingHorizontal: 17,
      borderRadius: 10,
      backgroundColor:
        colors.primary,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    buttonDisabled: {
      opacity: 0.65,
    },

    sendText: {
      color:
        '#FFFFFF',
      fontSize: 11,
      fontWeight:
        '800',
      marginLeft: 6,
    },
  });