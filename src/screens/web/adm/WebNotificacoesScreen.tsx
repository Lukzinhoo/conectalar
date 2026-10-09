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
  useWindowDimensions,
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
  UserRound,
  X,
} from 'lucide-react-native';

import WebSidebar from '../../../components/WebSidebar';
import WebLayout from '../../../components/WebLayout';
import { colors } from '../../../theme/theme';
import { supabase } from '../../../services/supabase';

// =====================================================
// TIPOS
// =====================================================

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

type PerfilMorador = {
  id: string;
  nome: string;
  ativo: boolean;
  tipo: string;
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

  // NOVO
  morador_id: string | null;
  nome_morador: string | null;
};

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

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

// =====================================================
// TELA
// =====================================================

export default function WebNotificacoesScreen() {
  const { width } =
    useWindowDimensions();

  const isMobile =
    width < 768;

  const isTablet =
    width >= 768 &&
    width < 1100;

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

  const [
    mensagem,
    setMensagem,
  ] = useState('');

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

  const [
    salvando,
    setSalvando,
  ] = useState(false);

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

  // ===================================================
  // CARREGAMENTO INICIAL
  // ===================================================

  useEffect(() => {
    carregarNotificacoes(false);
  }, []);

  // ===================================================
  // VERIFICAR ADMIN
  // ===================================================

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

  // ===================================================
  // AGRUPAR NOTIFICAÇÕES
  // ===================================================

  function agruparNotificacoes(
    registros: NotificacaoBanco[],
    nomesMoradores: Map<
      string,
      string
    >
  ) {
    const grupos =
      new Map<
        string,
        NotificacaoAgrupada
      >();

    registros.forEach(
      item => {
        const data =
          new Date(
            item.criado_em
          );

        data.setMilliseconds(
          0
        );

        /*
         * Para notificações enviadas em massa,
         * NÃO colocamos morador_id na chave.
         *
         * Assim uma notificação enviada para
         * todos continua aparecendo como apenas
         * um card.
         */
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

          /*
           * Se houver mais de um morador,
           * o card deixa de representar
           * uma única pessoa.
           */
          if (
            existente.morador_id !==
            item.morador_id
          ) {
            existente.morador_id =
              null;

            existente.nome_morador =
              null;
          }

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

            morador_id:
              item.morador_id,

            nome_morador:
              nomesMoradores.get(
                item.morador_id
              ) ?? null,
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

  // ===================================================
  // CARREGAR
  // ===================================================

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

      // ===============================================
      // BUSCAR NOMES DOS MORADORES
      // ===============================================

      const {
        data: perfisData,
        error: perfisError,
      } = await supabase
        .from('perfis')
        .select(
          'id, nome, tipo, ativo'
        )
        .eq(
          'tipo',
          'morador'
        );

      if (perfisError) {
        console.error(
          'ERRO AO BUSCAR MORADORES:',
          perfisError
        );
      }

      const mapaNomes =
        new Map<
          string,
          string
        >();

      (
        (perfisData ??
          []) as PerfilMorador[]
      ).forEach(
        perfil => {
          if (
            perfil.id &&
            perfil.nome
          ) {
            mapaNomes.set(
              perfil.id,
              perfil.nome
            );
          }
        }
      );

      // ===============================================
      // RECEBIDAS PELA ADMINISTRAÇÃO
      // ===============================================

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

      // ===============================================
      // ENVIADAS AOS MORADORES
      // ===============================================

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
          recebidas,
          mapaNomes
        )
      );

      setNotificacoesEnviadas(
        agruparNotificacoes(
          enviadas,
          mapaNomes
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

  // ===================================================
  // MODAL
  // ===================================================

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

  // ===================================================
  // ENVIAR
  // ===================================================

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

      const registros =
        listaMoradores.map(
          morador => ({
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

  // ===================================================
  // EXCLUIR
  // ===================================================

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

  // ===================================================
  // FILTROS
  // ===================================================

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
        item =>
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
            ) ||
          (
            item.nome_morador ??
            ''
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

  // ===================================================
  // INTERFACE
  // ===================================================

  return (
    <WebLayout
      sidebar={
        <WebSidebar
          active="notificacoes"
        />
      }
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
              ? styles.headerTextMobile
              : undefined
          }
        >
          <Text
            style={[
              styles.title,

              isMobile &&
                styles.titleMobile,
            ]}
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
                styles.actionButtonMobile,
            ]}
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
            style={[
              styles.novaButton,

              isMobile &&
                styles.actionButtonMobile,
            ]}
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

      {!!erro &&
        !modalAberto && (
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
        style={[
          styles.cards,

          (isMobile ||
            isTablet) &&
            styles.cardsResponsive,
        ]}
      >
        <ResumoCard
          titulo="Recebidas"
          valor={
            totalRecebidas
          }
          tipo="recebida"
          responsive={
            isMobile ||
            isTablet
          }
        />

        <ResumoCard
          titulo="Enviadas"
          valor={
            totalEnviadas
          }
          tipo="enviada"
          responsive={
            isMobile ||
            isTablet
          }
        />
      </View>

      {/* ABAS */}

      <View
        style={[
          styles.abas,

          isMobile &&
            styles.abasMobile,
        ]}
      >
        <Pressable
          style={[
            styles.abaButton,

            isMobile &&
              styles.abaButtonMobile,

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
            numberOfLines={
              isMobile
                ? 2
                : 1
            }
            style={[
              styles.abaText,

              aba ===
                'recebidas' &&
                styles.abaTextAtiva,
            ]}
          >
            Administração (
            {totalRecebidas})
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.abaButton,

            isMobile &&
              styles.abaButtonMobile,

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
            numberOfLines={
              isMobile
                ? 2
                : 1
            }
            style={[
              styles.abaText,

              aba ===
                'enviadas' &&
                styles.abaTextAtiva,
            ]}
          >
            Enviadas aos moradores (
            {totalEnviadas})
          </Text>
        </Pressable>
      </View>

      {/* BUSCA */}

      <View
        style={[
          styles.searchRow,

          isMobile &&
            styles.searchRowMobile,
        ]}
      >
        <View
          style={[
            styles.searchBox,

            isMobile &&
              styles.searchBoxMobile,
          ]}
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
            placeholder="Buscar por notificação ou morador..."
            placeholderTextColor={
              colors.textLight
            }
            style={
              styles.searchInput
            }
          />
        </View>

        <Text
          style={[
            styles.resultadoText,

            isMobile &&
              styles.resultadoTextMobile,
          ]}
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

      <View
        style={
          styles.listaArea
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
            notificacao => (
              <View
                key={
                  notificacao.chave
                }
                style={[
                  styles.notificacaoCard,

                  isMobile &&
                    styles.notificacaoCardMobile,
                ]}
              >
                <View
                  style={[
                    styles.notificacaoIcon,

                    isMobile &&
                      styles.notificacaoIconMobile,
                  ]}
                >
                  {notificacao.tipo ===
                  'reserva' ? (
                    <CalendarCheck
                      size={21}
                      color={
                        colors.primary
                      }
                    />
                  ) : (
                    <BellRing
                      size={21}
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
                  {/* NOME DO MORADOR */}

                  {notificacao.quantidade ===
                    1 &&
                    notificacao.nome_morador && (
                      <View
                        style={
                          styles.moradorArea
                        }
                      >
                        <UserRound
                          size={14}
                          color={
                            colors.primary
                          }
                        />

                        <Text
                          style={
                            styles.moradorNome
                          }
                        >
                          {
                            notificacao.nome_morador
                          }
                        </Text>
                      </View>
                    )}

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
                          size={16}
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
                    style={[
                      styles.cardFooter,

                      isMobile &&
                        styles.cardFooterMobile,
                    ]}
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
                        {notificacao.nome_morador
                          ? `Enviada por ${notificacao.nome_morador}`
                          : 'Destinada à administração'}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )
          )
        )}
      </View>

      {/* MODAL */}

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
          style={[
            styles.overlay,

            isMobile &&
              styles.overlayMobile,
          ]}
        >
          <View
            style={[
              styles.modal,

              isMobile &&
                styles.modalMobile,
            ]}
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <View
                style={
                  styles.modalHeaderText
                }
              >
                <Text
                  style={[
                    styles.modalTitle,

                    isMobile &&
                      styles.modalTitleMobile,
                  ]}
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

            <ScrollView
              style={
                styles.modalScroll
              }
              contentContainerStyle={
                styles.modalScrollContent
              }
              showsVerticalScrollIndicator={
                false
              }
              keyboardShouldPersistTaps="handled"
            >
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
                  item => (
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
                value={
                  titulo
                }
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
            </ScrollView>

            <View
              style={[
                styles.modalButtons,

                isMobile &&
                  styles.modalButtonsMobile,
              ]}
            >
              <Pressable
                style={[
                  styles.cancelButton,

                  isMobile &&
                    styles.modalActionMobile,
                ]}
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

                  isMobile &&
                    styles.modalActionMobile,

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
                      size={16}
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
    </WebLayout>
  );
}

// =====================================================
// RESUMO
// =====================================================

function ResumoCard({
  titulo,
  valor,
  tipo,
  responsive,
}: {
  titulo: string;
  valor: number;
  tipo:
    | 'recebida'
    | 'enviada';
  responsive?: boolean;
}) {
  return (
    <View
      style={[
        styles.resumoCard,

        responsive &&
          styles.resumoCardResponsive,
      ]}
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

// =====================================================
// ESTILOS
// =====================================================

const styles =
  StyleSheet.create({
    header: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      marginBottom: 20,
      width: '100%',
    },

    headerMobile: {
      flexDirection:
        'column',
      alignItems:
        'stretch',
    },

    headerTextMobile: {
      width: '100%',
      marginBottom: 16,
    },

    headerActions: {
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    headerActionsMobile: {
      width: '100%',
      alignItems:
        'stretch',
    },

    title: {
      fontSize: 28,
      fontWeight:
        '800',
      color:
        colors.text,
    },

    titleMobile: {
      fontSize: 24,
    },

    subtitle: {
      fontSize: 13,
      lineHeight: 19,
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

    actionButtonMobile: {
      flex: 1,
      minWidth: 0,
      paddingHorizontal: 8,
    },

    erroBox: {
      backgroundColor:
        colors.dangerLight,
      borderRadius: 9,
      padding: 10,
      marginBottom: 14,
      width: '100%',
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
      width: '100%',
    },

    cardsResponsive: {
      flexDirection:
        'column',
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

    resumoCardResponsive: {
      width: '100%',
      minWidth: 0,
      marginRight: 0,
      marginBottom: 10,
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
      width: '100%',
    },

    abasMobile: {
      alignItems:
        'stretch',
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

    abaButtonMobile: {
      flex: 1,
      minWidth: 0,
      height: 54,
      paddingHorizontal: 7,
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
      width: '100%',
    },

    searchRowMobile: {
      flexDirection:
        'column',
      alignItems:
        'stretch',
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

    searchBoxMobile: {
      maxWidth: '100%',
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
      color:
        colors.textSecondary,
      fontSize: 10,
    },

    resultadoTextMobile: {
      marginLeft: 0,
      marginTop: 8,
    },

    listaArea: {
      width: '100%',
    },

    vazio: {
      width: '100%',
      minHeight: 260,
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 14,
      alignItems:
        'center',
      justifyContent:
        'center',
      padding: 24,
    },

    vazioTitle: {
      marginTop: 12,
      fontSize: 15,
      fontWeight:
        '800',
      color:
        colors.text,
      textAlign:
        'center',
    },

    vazioSubtitulo: {
      marginTop: 7,
      fontSize: 11,
      lineHeight: 17,
      color:
        colors.textSecondary,
      textAlign:
        'center',
    },

    notificacaoCard: {
      width: '100%',
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 14,
      padding: 15,
      flexDirection:
        'row',
      alignItems:
        'flex-start',
      marginBottom: 10,
    },

    notificacaoCardMobile: {
      padding: 12,
    },

    notificacaoIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor:
        colors.primaryLight,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight: 13,
      flexShrink: 0,
    },

    notificacaoIconMobile: {
      width: 38,
      height: 38,
      borderRadius: 10,
      marginRight: 9,
    },

    notificacaoInfo: {
      flex: 1,
      minWidth: 0,
    },

    // NOVO - NOME DO MORADOR

    moradorArea: {
      flexDirection:
        'row',
      alignItems:
        'center',
      marginBottom: 6,
    },

    moradorNome: {
      flex: 1,
      minWidth: 0,
      marginLeft: 5,
      color:
        colors.primary,
      fontSize: 11,
      lineHeight: 16,
      fontWeight:
        '800',
    },

    cardTopo: {
      width: '100%',
      flexDirection:
        'row',
      alignItems:
        'flex-start',
      justifyContent:
        'space-between',
    },

    tituloArea: {
      flex: 1,
      minWidth: 0,
      paddingRight: 8,
    },

    notificacaoTitulo: {
      color:
        colors.text,
      fontSize: 13,
      lineHeight: 18,
      fontWeight:
        '800',
    },

    tipoBadge: {
      alignSelf:
        'flex-start',
      backgroundColor:
        colors.primaryLight,
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginTop: 6,
    },

    tipoText: {
      color:
        colors.primary,
      fontSize: 8,
      fontWeight:
        '800',
    },

    deleteButton: {
      width: 34,
      height: 34,
      borderRadius: 8,
      backgroundColor:
        colors.dangerLight,
      alignItems:
        'center',
      justifyContent:
        'center',
      flexShrink: 0,
    },

    notificacaoMensagem: {
      color:
        colors.textSecondary,
      fontSize: 11,
      lineHeight: 17,
      marginTop: 9,
    },

    cardFooter: {
      width: '100%',
      marginTop: 11,
      paddingTop: 9,
      borderTopWidth: 1,
      borderTopColor:
        colors.border,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },

    cardFooterMobile: {
      flexDirection:
        'column',
      alignItems:
        'flex-start',
    },

    dataText: {
      color:
        colors.textLight,
      fontSize: 9,
    },

    destinatariosText: {
      color:
        colors.textSecondary,
      fontSize: 9,
      lineHeight: 14,
    },

    overlay: {
      flex: 1,
      backgroundColor:
        'rgba(15,23,42,0.55)',
      alignItems:
        'center',
      justifyContent:
        'center',
      padding: 20,
    },

    overlayMobile: {
      padding: 9,
    },

    modal: {
      width: '100%',
      maxWidth: 620,
      maxHeight: '90%',
      backgroundColor:
        colors.surface,
      borderRadius: 16,
      padding: 20,
      overflow:
        'hidden',
    },

    modalMobile: {
      width: '100%',
      maxWidth: '100%',
      height: '94%',
      maxHeight: '94%',
      padding: 14,
    },

    modalHeader: {
      width: '100%',
      flexDirection:
        'row',
      alignItems:
        'flex-start',
      justifyContent:
        'space-between',
      marginBottom: 8,
      flexShrink: 0,
    },

    modalHeaderText: {
      flex: 1,
      minWidth: 0,
      paddingRight: 10,
    },

    modalTitle: {
      fontSize: 21,
      fontWeight:
        '900',
      color:
        colors.text,
    },

    modalTitleMobile: {
      fontSize: 18,
    },

    modalSubtitle: {
      marginTop: 4,
      color:
        colors.textSecondary,
      fontSize: 10,
      lineHeight: 15,
    },

    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 9,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.background,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    modalScroll: {
      flex: 1,
      minHeight: 0,
      width: '100%',
    },

    modalScrollContent: {
      flexGrow: 1,
      paddingBottom: 12,
    },

    label: {
      marginTop: 13,
      marginBottom: 7,
      color:
        colors.text,
      fontSize: 10,
      fontWeight:
        '800',
    },

    tipos: {
      width: '100%',
      flexDirection:
        'row',
      flexWrap:
        'wrap',
    },

    tipoButton: {
      minHeight: 35,
      paddingHorizontal: 11,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.background,
      borderRadius: 8,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight: 7,
      marginBottom: 7,
    },

    tipoButtonAtivo: {
      backgroundColor:
        colors.primary,
      borderColor:
        colors.primary,
    },

    tipoButtonText: {
      color:
        colors.textSecondary,
      fontSize: 9,
      fontWeight:
        '700',
    },

    tipoButtonTextAtivo: {
      color:
        '#FFFFFF',
    },

    input: {
      width: '100%',
      height: 44,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 9,
      backgroundColor:
        colors.background,
      paddingHorizontal: 12,
      color:
        colors.text,
      fontSize: 11,
      outlineStyle:
        'none',
    } as any,

    textarea: {
      height: 120,
      paddingTop: 11,
    },

    modalButtons: {
      width: '100%',
      flexDirection:
        'row',
      alignItems:
        'center',
      borderTopWidth: 1,
      borderTopColor:
        colors.border,
      paddingTop: 12,
      marginTop: 6,
      flexShrink: 0,
    },

    modalButtonsMobile: {
      width: '100%',
    },

    modalActionMobile: {
      minWidth: 0,
    },

    cancelButton: {
      flex: 1,
      height: 44,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 9,
      backgroundColor:
        colors.surface,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight: 8,
    },

    cancelText: {
      color:
        colors.textSecondary,
      fontSize: 10,
      fontWeight:
        '800',
    },

    sendButton: {
      flex: 1.3,
      height: 44,
      borderRadius: 9,
      backgroundColor:
        colors.primary,
      alignItems:
        'center',
      justifyContent:
        'center',
      flexDirection:
        'row',
    },

    sendText: {
      color:
        '#FFFFFF',
      fontSize: 10,
      fontWeight:
        '800',
      marginLeft: 6,
    },

    buttonDisabled: {
      opacity: 0.6,
    },
  });