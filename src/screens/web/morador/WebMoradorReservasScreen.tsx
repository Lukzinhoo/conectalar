import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  RefreshCw,
  Users,
  XCircle,
} from 'lucide-react-native';

import { colors } from '../../../theme/theme';
import WebMoradorSidebar from '../../../components/WebMoradorSidebar';
import WebLayout from '../../../components/WebLayout';
import { supabase } from '../../../services/supabase';

type StatusReserva =
  | 'pendente'
  | 'aprovada'
  | 'recusada'
  | 'cancelada';

type Espaco = {
  id: string;
  nome: string;
  descricao: string | null;
  capacidade: number | null;
  horario_inicio: string | null;
  horario_fim: string | null;
  ativo: boolean;
};

type ReservaBanco = {
  id: string;
  morador_id: string;
  espaco_id: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  observacao: string | null;
  status: StatusReserva;
  criado_em: string;
};

type ReservaTela = ReservaBanco & {
  espaco: string;
};

type OcupacaoCalendario = {
  espaco_id: string;
  data: string;
  status: 'pendente' | 'aprovada';
};

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const DIAS_SEMANA = [
  'DOM',
  'SEG',
  'TER',
  'QUA',
  'QUI',
  'SEX',
  'SÁB',
];

function doisDigitos(valor: number) {
  return String(valor).padStart(2, '0');
}

function dataLocalParaBanco(
  ano: number,
  mes: number,
  dia: number
) {
  return `${ano}-${doisDigitos(
    mes + 1
  )}-${doisDigitos(dia)}`;
}

function formatarData(data: string) {
  if (!data) return '-';

  const partes = data.split('-');

  if (partes.length !== 3) {
    return data;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function limparHorario(
  valor: string | null
) {
  if (!valor) return '';

  return valor.substring(0, 5);
}

function hojeBanco() {
  const hoje = new Date();

  return dataLocalParaBanco(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate()
  );
}

function statusTexto(status: StatusReserva) {
  switch (status) {
    case 'aprovada':
      return 'Aprovada';

    case 'recusada':
      return 'Recusada';

    case 'cancelada':
      return 'Cancelada';

    default:
      return 'Pendente';
  }
}

export default function WebMoradorReservasScreen() {
  const { width } = useWindowDimensions();

  const isMobile = width < 768;

  const hoje = useMemo(
    () => new Date(),
    []
  );

  const [espacos, setEspacos] =
    useState<Espaco[]>([]);

  const [reservas, setReservas] =
    useState<ReservaTela[]>([]);

  const [ocupacoes, setOcupacoes] =
    useState<OcupacaoCalendario[]>([]);

  const [
    espacoSelecionadoId,
    setEspacoSelecionadoId,
  ] = useState('');

  const [
    dataSelecionada,
    setDataSelecionada,
  ] = useState('');

  const [
    mesAtual,
    setMesAtual,
  ] = useState(
    new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      1
    )
  );

  const [
    observacao,
    setObservacao,
  ] = useState('');

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState('');

  const [
    sucesso,
    setSucesso,
  ] = useState('');

  const carregarDados =
    useCallback(
      async (
        mostrarCarregamento = true
      ) => {
        try {
          if (mostrarCarregamento) {
            setCarregando(true);
          }

          setErro('');

          const {
            data: userData,
            error: userError,
          } =
            await supabase.auth.getUser();

          if (
            userError ||
            !userData.user
          ) {
            setErro(
              'Não foi possível identificar o morador conectado.'
            );

            return;
          }

          const usuario =
            userData.user;

          const {
            data: perfil,
            error: perfilError,
          } = await supabase
            .from('perfis')
            .select(
              'id, tipo, ativo'
            )
            .eq(
              'id',
              usuario.id
            )
            .maybeSingle();

          if (
            perfilError ||
            !perfil
          ) {
            setErro(
              'Não foi possível verificar seu perfil.'
            );

            return;
          }

          if (
            perfil.tipo !== 'morador' ||
            !perfil.ativo
          ) {
            setErro(
              'Seu perfil não possui acesso às reservas.'
            );

            return;
          }

          const {
            data: espacosData,
            error: espacosError,
          } = await supabase
            .from('espacos_reserva')
            .select(`
              id,
              nome,
              descricao,
              capacidade,
              horario_inicio,
              horario_fim,
              ativo
            `)
            .eq('ativo', true)
            .order(
              'nome',
              {
                ascending: true,
              }
            );

          if (espacosError) {
            setErro(
              `Não foi possível carregar os espaços: ${espacosError.message}`
            );

            return;
          }

          const listaEspacos =
            (espacosData ?? []) as Espaco[];

          setEspacos(listaEspacos);

          setEspacoSelecionadoId(
            (atual) => {
              if (
                atual &&
                listaEspacos.some(
                  (item) =>
                    item.id === atual
                )
              ) {
                return atual;
              }

              return (
                listaEspacos[0]?.id ??
                ''
              );
            }
          );

          const {
            data: minhasData,
            error: minhasError,
          } = await supabase
            .from('reservas')
            .select(`
              id,
              morador_id,
              espaco_id,
              data,
              horario_inicio,
              horario_fim,
              observacao,
              status,
              criado_em
            `)
            .eq(
              'morador_id',
              usuario.id
            )
            .order(
              'criado_em',
              {
                ascending: false,
              }
            );

          if (minhasError) {
            setErro(
              `Não foi possível carregar suas reservas: ${minhasError.message}`
            );

            return;
          }

          const mapaEspacos =
            new Map(
              listaEspacos.map(
                (item) => [
                  item.id,
                  item.nome,
                ]
              )
            );

          const listaReservas =
            (
              (minhasData ??
                []) as ReservaBanco[]
            ).map(
              (reserva) => ({
                ...reserva,

                espaco:
                  mapaEspacos.get(
                    reserva.espaco_id
                  ) ??
                  'Espaço não encontrado',
              })
            );

          setReservas(
            listaReservas
          );

          const {
            data: ocupacoesData,
            error: ocupacoesError,
          } = await supabase
            .from('reservas')
            .select(`
              espaco_id,
              data,
              status
            `)
            .in(
              'status',
              [
                'pendente',
                'aprovada',
              ]
            );

          if (ocupacoesError) {
            setErro(
              `Não foi possível carregar a disponibilidade: ${ocupacoesError.message}`
            );

            return;
          }

          setOcupacoes(
            (ocupacoesData ??
              []) as OcupacaoCalendario[]
          );
        } catch (error) {
          console.error(
            'Erro ao carregar reservas:',
            error
          );

          setErro(
            'Ocorreu um erro ao carregar as reservas.'
          );
        } finally {
          if (
            mostrarCarregamento
          ) {
            setCarregando(false);
          }
        }
      },
      []
    );

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const espacoSelecionado =
    useMemo(
      () =>
        espacos.find(
          (item) =>
            item.id ===
            espacoSelecionadoId
        ) ?? null,
      [
        espacos,
        espacoSelecionadoId,
      ]
    );

  const totalAprovadas =
    useMemo(
      () =>
        reservas.filter(
          (item) =>
            item.status ===
            'aprovada'
        ).length,
      [reservas]
    );

  const totalPendentes =
    useMemo(
      () =>
        reservas.filter(
          (item) =>
            item.status ===
            'pendente'
        ).length,
      [reservas]
    );

  function obterStatusData(
    dataBanco: string
  ):
    | 'livre'
    | 'pendente'
    | 'aprovada' {
    const encontrados =
      ocupacoes.filter(
        (item) =>
          item.espaco_id ===
            espacoSelecionadoId &&
          item.data === dataBanco
      );

    if (
      encontrados.some(
        (item) =>
          item.status ===
          'aprovada'
      )
    ) {
      return 'aprovada';
    }

    if (
      encontrados.some(
        (item) =>
          item.status ===
          'pendente'
      )
    ) {
      return 'pendente';
    }

    return 'livre';
  }

  function mesAnterior() {
    setDataSelecionada('');

    setMesAtual(
      (atual) =>
        new Date(
          atual.getFullYear(),
          atual.getMonth() - 1,
          1
        )
    );
  }

  function proximoMes() {
    setDataSelecionada('');

    setMesAtual(
      (atual) =>
        new Date(
          atual.getFullYear(),
          atual.getMonth() + 1,
          1
        )
    );
  }

  function selecionarEspaco(
    id: string
  ) {
    setEspacoSelecionadoId(id);
    setDataSelecionada('');
    setObservacao('');
    setErro('');
    setSucesso('');
  }

  function selecionarDia(
    dia: number
  ) {
    const dataBanco =
      dataLocalParaBanco(
        mesAtual.getFullYear(),
        mesAtual.getMonth(),
        dia
      );

    if (
      dataBanco < hojeBanco()
    ) {
      return;
    }

    if (
      obterStatusData(
        dataBanco
      ) !== 'livre'
    ) {
      return;
    }

    setDataSelecionada(
      dataBanco
    );

    setErro('');
    setSucesso('');
  }

  const diasCalendario =
    useMemo(() => {
      const ano =
        mesAtual.getFullYear();

      const mes =
        mesAtual.getMonth();

      const primeiroDia =
        new Date(
          ano,
          mes,
          1
        ).getDay();

      const totalDias =
        new Date(
          ano,
          mes + 1,
          0
        ).getDate();

      const itens:
        Array<number | null> = [];

      for (
        let i = 0;
        i < primeiroDia;
        i++
      ) {
        itens.push(null);
      }

      for (
        let dia = 1;
        dia <= totalDias;
        dia++
      ) {
        itens.push(dia);
      }

      while (
        itens.length % 7 !== 0
      ) {
        itens.push(null);
      }

      return itens;
    }, [mesAtual]);

  async function solicitarReserva() {
    if (salvando) return;

    try {
      setErro('');
      setSucesso('');

      if (
        !espacoSelecionado
      ) {
        setErro(
          'Selecione um espaço.'
        );

        return;
      }

      if (
        !dataSelecionada
      ) {
        setErro(
          'Selecione uma data livre no calendário.'
        );

        return;
      }

      const horaInicio =
        limparHorario(
          espacoSelecionado
            .horario_inicio
        );

      const horaFim =
        limparHorario(
          espacoSelecionado
            .horario_fim
        );

      if (
        !horaInicio ||
        !horaFim
      ) {
        setErro(
          'A administração ainda não cadastrou o horário deste espaço.'
        );

        return;
      }

      setSalvando(true);

      const {
        data: userData,
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !userData.user
      ) {
        setErro(
          'Sua sessão expirou. Entre novamente.'
        );

        return;
      }

      const {
        data: conflito,
        error: conflitoError,
      } = await supabase
        .from('reservas')
        .select(
          'id, status'
        )
        .eq(
          'espaco_id',
          espacoSelecionado.id
        )
        .eq(
          'data',
          dataSelecionada
        )
        .in(
          'status',
          [
            'pendente',
            'aprovada',
          ]
        )
        .limit(1);

      if (conflitoError) {
        setErro(
          `Não foi possível confirmar a disponibilidade: ${conflitoError.message}`
        );

        return;
      }

      if (
        conflito &&
        conflito.length > 0
      ) {
        setErro(
          'Essa data acabou de ser ocupada. Escolha outra data.'
        );

        await carregarDados(
          false
        );

        return;
      }

      const {
        error: insertError,
      } = await supabase
        .from('reservas')
        .insert({
          morador_id:
            userData.user.id,

          espaco_id:
            espacoSelecionado.id,

          data:
            dataSelecionada,

          horario_inicio:
            horaInicio,

          horario_fim:
            horaFim,

          observacao:
            observacao.trim() ||
            null,

          status:
            'pendente',
        });

      if (insertError) {
        if (
          insertError.code ===
          '23505'
        ) {
          setErro(
            'Essa data já foi solicitada ou reservada por outro morador. Escolha outra data.'
          );

          await carregarDados(
            false
          );

          return;
        }

        setErro(
          `Não foi possível solicitar a reserva: ${insertError.message}`
        );

        return;
      }

      setSucesso(
        `Reserva de ${espacoSelecionado.nome} para ${formatarData(
          dataSelecionada
        )} solicitada com sucesso. Aguarde a aprovação da administração.`
      );

      setDataSelecionada('');
      setObservacao('');

      await carregarDados(false);
    } catch (error) {
      console.error(
        'Erro ao solicitar reserva:',
        error
      );

      setErro(
        'Ocorreu um erro ao solicitar a reserva.'
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <WebLayout
      sidebar={
        <WebMoradorSidebar
          active="reservas"
        />
      }
    >
      <View style={styles.page}>
        <View
          style={[
            styles.header,
            isMobile &&
              styles.headerMobile,
          ]}
        >
          <View style={styles.headerText}>
            <Text style={styles.title}>
              Reservas
            </Text>

            <Text style={styles.subtitle}>
              Escolha o espaço e uma data disponível no calendário.
            </Text>
          </View>

          <Pressable
            style={[
              styles.refreshButton,
              isMobile &&
                styles.refreshButtonMobile,
            ]}
            onPress={() =>
              carregarDados()
            }
          >
            <RefreshCw
              size={17}
              color={
                colors.textSecondary
              }
            />

            <Text
              style={
                styles.refreshText
              }
            >
              Atualizar
            </Text>
          </Pressable>
        </View>

        {!!erro && (
          <View style={styles.errorBox}>
            <XCircle
              size={17}
              color={colors.danger}
            />

            <Text style={styles.errorText}>
              {erro}
            </Text>
          </View>
        )}

        {!!sucesso && (
          <View
            style={
              styles.successBox
            }
          >
            <CheckCircle2
              size={17}
              color="#15803D"
            />

            <Text
              style={
                styles.successText
              }
            >
              {sucesso}
            </Text>
          </View>
        )}

        {carregando ? (
          <View
            style={
              styles.loadingContainer
            }
          >
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />

            <Text
              style={
                styles.loadingText
              }
            >
              Carregando reservas...
            </Text>
          </View>
        ) : (
          <>
            <View
              style={[
                styles.summary,
                isMobile &&
                  styles.summaryMobile,
              ]}
            >
              <SummaryCard
                titulo="Minhas reservas"
                valor={reservas.length}
                mobile={isMobile}
                icon={
                  <CalendarDays
                    size={21}
                    color={
                      colors.primary
                    }
                  />
                }
              />

              <SummaryCard
                titulo="Aprovadas"
                valor={
                  totalAprovadas
                }
                mobile={isMobile}
                icon={
                  <CheckCircle2
                    size={21}
                    color={
                      colors.primary
                    }
                  />
                }
              />

              <SummaryCard
                titulo="Pendentes"
                valor={
                  totalPendentes
                }
                mobile={isMobile}
                ultimo
                icon={
                  <Clock3
                    size={21}
                    color={
                      colors.primary
                    }
                  />
                }
              />
            </View>

            <Text
              style={
                styles.sectionTitle
              }
            >
              Escolha o espaço
            </Text>

            {espacos.length === 0 ? (
              <View style={styles.emptyBox}>
                <MapPin
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
                  Nenhum espaço disponível
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.spaces,
                  isMobile &&
                    styles.spacesMobile,
                ]}
              >
                {espacos.map(
                  (espaco) => {
                    const ativo =
                      espaco.id ===
                      espacoSelecionadoId;

                    return (
                      <Pressable
                        key={espaco.id}
                        style={[
                          styles.spaceCard,
                          isMobile &&
                            styles.spaceCardMobile,
                          ativo &&
                            styles.spaceCardActive,
                        ]}
                        onPress={() =>
                          selecionarEspaco(
                            espaco.id
                          )
                        }
                      >
                        <View
                          style={
                            styles.spaceIcon
                          }
                        >
                          <MapPin
                            size={22}
                            color={
                              colors.primary
                            }
                          />
                        </View>

                        <View
                          style={
                            styles.spaceInfo
                          }
                        >
                          <Text
                            style={
                              styles.spaceTitle
                            }
                          >
                            {espaco.nome}
                          </Text>

                          <Text
                            style={
                              styles.spaceDescription
                            }
                          >
                            {espaco.descricao ||
                              'Espaço disponível para reserva.'}
                          </Text>

                          <View
                            style={
                              styles.spaceDetails
                            }
                          >
                            <Users
                              size={13}
                              color={
                                colors.textSecondary
                              }
                            />

                            <Text
                              style={
                                styles.spaceDetailText
                              }
                            >
                              {espaco.capacidade
                                ? `Até ${espaco.capacidade} pessoas`
                                : 'Capacidade não informada'}
                            </Text>
                          </View>

                          <View
                            style={
                              styles.spaceDetails
                            }
                          >
                            <Clock3
                              size={13}
                              color={
                                colors.textSecondary
                              }
                            />

                            <Text
                              style={
                                styles.spaceDetailText
                              }
                            >
                              {espaco.horario_inicio &&
                              espaco.horario_fim
                                ? `${limparHorario(
                                    espaco.horario_inicio
                                  )} às ${limparHorario(
                                    espaco.horario_fim
                                  )}`
                                : 'Horário não cadastrado'}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  }
                )}
              </View>
            )}

            {espacoSelecionado && (
              <>
                <Text
                  style={[
                    styles.sectionTitle,
                    styles.calendarSectionTitle,
                  ]}
                >
                  Escolha a data
                </Text>

                <View
                  style={[
                    styles.bookingArea,
                    isMobile &&
                      styles.bookingAreaMobile,
                  ]}
                >
                  <View
                    style={[
                      styles.calendarCard,
                      isMobile &&
                        styles.calendarCardMobile,
                    ]}
                  >
                    <View
                      style={
                        styles.calendarHeader
                      }
                    >
                      <Pressable
                        style={
                          styles.monthButton
                        }
                        onPress={
                          mesAnterior
                        }
                      >
                        <ChevronLeft
                          size={19}
                          color={
                            colors.text
                          }
                        />
                      </Pressable>

                      <View
                        style={
                          styles.monthTitleArea
                        }
                      >
                        <Text
                          style={
                            styles.monthTitle
                          }
                        >
                          {
                            MESES[
                              mesAtual.getMonth()
                            ]
                          }
                        </Text>

                        <Text
                          style={
                            styles.yearTitle
                          }
                        >
                          {mesAtual.getFullYear()}
                        </Text>
                      </View>

                      <Pressable
                        style={
                          styles.monthButton
                        }
                        onPress={
                          proximoMes
                        }
                      >
                        <ChevronRight
                          size={19}
                          color={
                            colors.text
                          }
                        />
                      </Pressable>
                    </View>

                    <View
                      style={
                        styles.weekHeader
                      }
                    >
                      {DIAS_SEMANA.map(
                        (dia) => (
                          <View
                            key={dia}
                            style={
                              styles.weekCell
                            }
                          >
                            <Text
                              style={
                                styles.weekText
                              }
                            >
                              {isMobile
                                ? dia.substring(
                                    0,
                                    1
                                  )
                                : dia}
                            </Text>
                          </View>
                        )
                      )}
                    </View>

                    <View
                      style={
                        styles.calendarGrid
                      }
                    >
                      {diasCalendario.map(
                        (
                          dia,
                          index
                        ) => {
                          if (
                            dia === null
                          ) {
                            return (
                              <View
                                key={`vazio-${index}`}
                                style={
                                  styles.dayCell
                                }
                              />
                            );
                          }

                          const dataBanco =
                            dataLocalParaBanco(
                              mesAtual.getFullYear(),
                              mesAtual.getMonth(),
                              dia
                            );

                          const passado =
                            dataBanco <
                            hojeBanco();

                          const status =
                            obterStatusData(
                              dataBanco
                            );

                          const selecionado =
                            dataSelecionada ===
                            dataBanco;

                          const bloqueado =
                            passado ||
                            status !==
                              'livre';

                          return (
                            <View
                              key={
                                dataBanco
                              }
                              style={
                                styles.dayCell
                              }
                            >
                              <Pressable
                                disabled={
                                  bloqueado
                                }
                                onPress={() =>
                                  selecionarDia(
                                    dia
                                  )
                                }
                                style={[
                                  styles.dayButton,

                                  passado &&
                                    styles.dayPast,

                                  status ===
                                    'pendente' &&
                                    styles.dayPending,

                                  status ===
                                    'aprovada' &&
                                    styles.dayApproved,

                                  selecionado &&
                                    styles.daySelected,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.dayText,

                                    passado &&
                                      styles.dayPastText,

                                    status ===
                                      'pendente' &&
                                      styles.dayPendingText,

                                    status ===
                                      'aprovada' &&
                                      styles.dayApprovedText,

                                    selecionado &&
                                      styles.daySelectedText,
                                  ]}
                                >
                                  {dia}
                                </Text>
                              </Pressable>
                            </View>
                          );
                        }
                      )}
                    </View>

                    <View
                      style={
                        styles.legend
                      }
                    >
                      <Legenda
                        cor="#DCFCE7"
                        borda="#86EFAC"
                        titulo="Livre"
                      />

                      <Legenda
                        cor="#FEF3C7"
                        borda="#FCD34D"
                        titulo="Pendente"
                      />

                      <Legenda
                        cor="#FEE2E2"
                        borda="#FCA5A5"
                        titulo="Reservada"
                      />
                    </View>
                  </View>

                  <View
                    style={[
                      styles.detailsCard,
                      isMobile &&
                        styles.detailsCardMobile,
                    ]}
                  >
                    <View
                      style={
                        styles.detailsIcon
                      }
                    >
                      <CalendarDays
                        size={25}
                        color={
                          colors.primary
                        }
                      />
                    </View>

                    <Text
                      style={
                        styles.detailsTitle
                      }
                    >
                      {dataSelecionada
                        ? formatarData(
                            dataSelecionada
                          )
                        : 'Selecione uma data'}
                    </Text>

                    <Text
                      style={
                        styles.detailsSubtitle
                      }
                    >
                      {
                        espacoSelecionado.nome
                      }
                    </Text>

                    <View
                      style={
                        styles.divider
                      }
                    />

                    <Text
                      style={
                        styles.smallLabel
                      }
                    >
                      HORÁRIO DA RESERVA
                    </Text>

                    <View
                      style={
                        styles.timeBox
                      }
                    >
                      <Clock3
                        size={21}
                        color={
                          colors.primary
                        }
                      />

                      <View
                        style={
                          styles.timeInfo
                        }
                      >
                        <Text
                          style={
                            styles.timeValue
                          }
                        >
                          {espacoSelecionado.horario_inicio &&
                          espacoSelecionado.horario_fim
                            ? `${limparHorario(
                                espacoSelecionado.horario_inicio
                              )} às ${limparHorario(
                                espacoSelecionado.horario_fim
                              )}`
                            : 'Não informado'}
                        </Text>

                        <Text
                          style={
                            styles.timeHint
                          }
                        >
                          Uma reserva por dia
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={
                        styles.smallLabel
                      }
                    >
                      OBSERVAÇÃO
                    </Text>

                    <TextInput
                      value={observacao}
                      onChangeText={
                        setObservacao
                      }
                      style={
                        styles.observationInput
                      }
                      placeholder="Observação opcional..."
                      placeholderTextColor={
                        colors.textLight
                      }
                      multiline
                      textAlignVertical="top"
                    />

                    <Pressable
                      style={[
                        styles.reserveButton,
                        (!dataSelecionada ||
                          salvando) &&
                          styles.reserveButtonDisabled,
                      ]}
                      disabled={
                        !dataSelecionada ||
                        salvando
                      }
                      onPress={
                        solicitarReserva
                      }
                    >
                      {salvando ? (
                        <ActivityIndicator
                          size="small"
                          color="#FFFFFF"
                        />
                      ) : (
                        <>
                          <CheckCircle2
                            size={17}
                            color="#FFFFFF"
                          />

                          <Text
                            style={
                              styles.reserveButtonText
                            }
                          >
                            Solicitar reserva
                          </Text>
                        </>
                      )}
                    </Pressable>

                    <Text
                      style={
                        styles.approvalHint
                      }
                    >
                      A solicitação ficará pendente até a aprovação da administração.
                    </Text>
                  </View>
                </View>
              </>
            )}

            <Text
              style={[
                styles.sectionTitle,
                styles.myReservationsTitle,
              ]}
            >
              Minhas reservas
            </Text>

            {reservas.length === 0 ? (
              <View
                style={
                  styles.emptyReservas
                }
              >
                <CalendarDays
                  size={32}
                  color={
                    colors.textLight
                  }
                />

                <Text
                  style={
                    styles.emptyReservationsText
                  }
                >
                  Você ainda não possui reservas.
                </Text>
              </View>
            ) : isMobile ? (
              <View
                style={
                  styles.mobileReservations
                }
              >
                {reservas.map(
                  (reserva) => (
                    <View
                      key={reserva.id}
                      style={
                        styles.mobileReservationCard
                      }
                    >
                      <View
                        style={
                          styles.mobileReservationTop
                        }
                      >
                        <View
                          style={
                            styles.mobileReservationIcon
                          }
                        >
                          <CalendarDays
                            size={19}
                            color={
                              colors.primary
                            }
                          />
                        </View>

                        <View
                          style={
                            styles.mobileReservationTitleArea
                          }
                        >
                          <Text
                            style={
                              styles.mobileReservationTitle
                            }
                          >
                            {
                              reserva.espaco
                            }
                          </Text>

                          <Text
                            style={
                              styles.mobileReservationDate
                            }
                          >
                            {formatarData(
                              reserva.data
                            )}
                          </Text>
                        </View>

                        <StatusBadge
                          status={
                            reserva.status
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.mobileReservationDetails
                        }
                      >
                        <Clock3
                          size={15}
                          color={
                            colors.textSecondary
                          }
                        />

                        <Text
                          style={
                            styles.mobileReservationDetailText
                          }
                        >
                          {limparHorario(
                            reserva.horario_inicio
                          )}{' '}
                          às{' '}
                          {limparHorario(
                            reserva.horario_fim
                          )}
                        </Text>
                      </View>

                      {!!reserva.observacao && (
                        <Text
                          style={
                            styles.mobileObservation
                          }
                        >
                          {
                            reserva.observacao
                          }
                        </Text>
                      )}
                    </View>
                  )
                )}
              </View>
            ) : (
              <View
                style={
                  styles.reservasContainer
                }
              >
                <View
                  style={
                    styles.tableHeader
                  }
                >
                  <Text
                    style={[
                      styles.tableHeaderText,
                      styles.colEspaco,
                    ]}
                  >
                    ESPAÇO
                  </Text>

                  <Text
                    style={[
                      styles.tableHeaderText,
                      styles.colData,
                    ]}
                  >
                    DATA
                  </Text>

                  <Text
                    style={[
                      styles.tableHeaderText,
                      styles.colHorario,
                    ]}
                  >
                    HORÁRIO
                  </Text>

                  <Text
                    style={[
                      styles.tableHeaderText,
                      styles.colStatus,
                    ]}
                  >
                    STATUS
                  </Text>
                </View>

                {reservas.map(
                  (reserva) => (
                    <View
                      key={reserva.id}
                      style={
                        styles.tableRow
                      }
                    >
                      <Text
                        style={[
                          styles.tableText,
                          styles.colEspaco,
                        ]}
                      >
                        {reserva.espaco}
                      </Text>

                      <Text
                        style={[
                          styles.tableText,
                          styles.colData,
                        ]}
                      >
                        {formatarData(
                          reserva.data
                        )}
                      </Text>

                      <Text
                        style={[
                          styles.tableText,
                          styles.colHorario,
                        ]}
                      >
                        {limparHorario(
                          reserva.horario_inicio
                        )}{' '}
                        às{' '}
                        {limparHorario(
                          reserva.horario_fim
                        )}
                      </Text>

                      <View
                        style={
                          styles.colStatus
                        }
                      >
                        <StatusBadge
                          status={
                            reserva.status
                          }
                        />
                      </View>
                    </View>
                  )
                )}
              </View>
            )}
          </>
        )}
      </View>
    </WebLayout>
  );
}

function SummaryCard({
  titulo,
  valor,
  icon,
  mobile = false,
  ultimo = false,
}: {
  titulo: string;
  valor: number;
  icon: React.ReactNode;
  mobile?: boolean;
  ultimo?: boolean;
}) {
  return (
    <View
      style={[
        styles.summaryCard,
        mobile &&
          styles.summaryCardMobile,
        ultimo &&
          styles.lastSummaryCard,
      ]}
    >
      <View
        style={
          styles.summaryIcon
        }
      >
        {icon}
      </View>

      <View
        style={
          styles.summaryInfo
        }
      >
        <Text
          style={
            styles.summaryLabel
          }
        >
          {titulo}
        </Text>

        <Text
          style={
            styles.summaryValue
          }
        >
          {valor}
        </Text>
      </View>
    </View>
  );
}

function Legenda({
  cor,
  borda,
  titulo,
}: {
  cor: string;
  borda: string;
  titulo: string;
}) {
  return (
    <View
      style={
        styles.legendItem
      }
    >
      <View
        style={[
          styles.legendColor,
          {
            backgroundColor:
              cor,
            borderColor:
              borda,
          },
        ]}
      />

      <Text
        style={
          styles.legendText
        }
      >
        {titulo}
      </Text>
    </View>
  );
}

function StatusBadge({
  status,
}: {
  status: StatusReserva;
}) {
  return (
    <View
      style={[
        styles.statusBadge,

        status ===
          'aprovada' &&
          styles.statusApproved,

        status ===
          'pendente' &&
          styles.statusPending,

        status ===
          'recusada' &&
          styles.statusRejected,

        status ===
          'cancelada' &&
          styles.statusCanceled,
      ]}
    >
      <Text
        style={[
          styles.statusText,

          status ===
            'aprovada' &&
            styles.statusApprovedText,

          status ===
            'pendente' &&
            styles.statusPendingText,

          status ===
            'recusada' &&
            styles.statusRejectedText,

          status ===
            'cancelada' &&
            styles.statusCanceledText,
        ]}
      >
        {statusTexto(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
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
  },

  headerText: {
    flex: 1,
    minWidth: 0,
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
    lineHeight: 17,
    marginTop: 5,
  },

  refreshButton: {
    height: 43,
    borderRadius: 11,
    borderWidth: 1,
    borderColor:
      colors.border,
    backgroundColor:
      colors.surface,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  refreshButtonMobile: {
    width: '100%',
    marginTop: 15,
  },

  refreshText: {
    marginLeft: 7,
    color:
      colors.textSecondary,
    fontSize: 9,
    fontWeight: '800',
  },

  errorBox: {
    borderRadius: 11,
    padding: 13,
    backgroundColor:
      colors.dangerLight,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '700',
    marginLeft: 8,
  },

  successBox: {
    borderRadius: 11,
    padding: 13,
    backgroundColor:
      '#DCFCE7',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  successText: {
    flex: 1,
    color: '#15803D',
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '700',
    marginLeft: 8,
  },

  loadingContainer: {
    minHeight: 350,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color:
      colors.textSecondary,
    fontSize: 10,
    marginTop: 12,
  },

  summary: {
    flexDirection: 'row',
    marginBottom: 28,
  },

  summaryMobile: {
    flexDirection: 'column',
  },

  summaryCard: {
    flex: 1,
    minHeight: 95,
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius: 14,
    padding: 16,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },

  summaryCardMobile: {
    width: '100%',
    flexGrow: 0,
    flexShrink: 0,
    marginRight: 0,
    marginBottom: 10,
    minHeight: 82,
  },

  lastSummaryCard: {
    marginRight: 0,
  },

  summaryIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor:
      colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
    flexShrink: 0,
  },

  summaryInfo: {
    flex: 1,
    minWidth: 0,
  },

  summaryLabel: {
    color:
      colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
  },

  summaryValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 3,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 14,
  },

  spaces: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },

  spacesMobile: {
    flexDirection: 'column',
  },

  spaceCard: {
    width: '48.5%',
    minHeight: 125,
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius: 15,
    padding: 17,
    marginRight: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  spaceCardMobile: {
    width: '100%',
    marginRight: 0,
    minHeight: 115,
    padding: 15,
  },

  spaceCardActive: {
    borderColor:
      colors.primary,
    borderWidth: 2,
    backgroundColor:
      colors.primaryLight,
  },

  spaceIcon: {
    width: 47,
    height: 47,
    borderRadius: 13,
    backgroundColor:
      colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
    flexShrink: 0,
  },

  spaceInfo: {
    flex: 1,
    minWidth: 0,
  },

  spaceTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },

  spaceDescription: {
    color:
      colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
  },

  spaceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },

  spaceDetailText: {
    flex: 1,
    color:
      colors.textSecondary,
    fontSize: 8,
    lineHeight: 13,
    marginLeft: 5,
  },

  emptyBox: {
    minHeight: 160,
    borderRadius: 14,
    borderWidth: 1,
    borderColor:
      colors.border,
    backgroundColor:
      colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    padding: 20,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 10,
    textAlign: 'center',
  },

  calendarSectionTitle: {
    marginTop: 8,
  },

  bookingArea: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    marginBottom: 32,
  },

  /*
   * CORREÇÃO MOBILE
   *
   * No celular o calendário e o
   * formulário ficam um embaixo
   * do outro.
   */
  bookingAreaMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    width: '100%',
    minWidth: 0,
  },

  calendarCard: {
    flex: 1.65,
    minWidth: 0,
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius: 16,
    padding: 18,
    marginRight: 14,
  },

  /*
   * Não usamos flex: 0 aqui.
   * Isso evita o calendário
   * colapsar no React Native Web.
   */
  calendarCardMobile: {
    width: '100%',
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    alignSelf: 'stretch',
    marginRight: 0,
    marginBottom: 20,
    padding: 12,
    overflow: 'visible',
  },

  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 18,
  },

  monthButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor:
      colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      colors.background,
  },

  monthTitleArea: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },

  monthTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },

  yearTitle: {
    color:
      colors.textSecondary,
    fontSize: 9,
    marginTop: 2,
  },

  weekHeader: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 6,
  },

  weekCell: {
    width: '14.2857%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
  },

  weekText: {
    color:
      colors.textSecondary,
    fontSize: 8,
    fontWeight: '800',
  },

  calendarGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  /*
   * Altura fixa evita que o
   * calendário perca sua altura
   * no navegador mobile.
   */
  dayCell: {
    width: '14.2857%',
    height: 48,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dayButton: {
    width: '100%',
    height: '100%',
    borderRadius: 9,
    borderWidth: 1,
    borderColor:
      '#86EFAC',
    backgroundColor:
      '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dayText: {
    color: '#166534',
    fontSize: 10,
    fontWeight: '800',
  },

  dayPast: {
    backgroundColor:
      colors.background,
    borderColor:
      colors.border,
  },

  dayPastText: {
    color:
      colors.textLight,
  },

  dayPending: {
    backgroundColor:
      '#FEF3C7',
    borderColor:
      '#FCD34D',
  },

  dayPendingText: {
    color: '#92400E',
  },

  dayApproved: {
    backgroundColor:
      '#FEE2E2',
    borderColor:
      '#FCA5A5',
  },

  dayApprovedText: {
    color: '#B91C1C',
  },

  daySelected: {
    backgroundColor:
      colors.primary,
    borderColor:
      colors.primary,
  },

  daySelectedText: {
    color: '#FFFFFF',
  },

  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 7,
  },

  legendColor: {
    width: 13,
    height: 13,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: 6,
  },

  legendText: {
    color:
      colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
  },

  detailsCard: {
    flex: 0.85,
    minWidth: 0,
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius: 16,
    padding: 20,
  },

  /*
   * Também não usamos flex: 0
   * no formulário mobile.
   */
  detailsCardMobile: {
    width: '100%',
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    alignSelf: 'stretch',
    padding: 16,
    marginTop: 0,
  },

  detailsIcon: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor:
      colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  detailsTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },

  detailsSubtitle: {
    color:
      colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },

  divider: {
    height: 1,
    backgroundColor:
      colors.border,
    marginVertical: 17,
  },

  smallLabel: {
    color:
      colors.textSecondary,
    fontSize: 8,
    fontWeight: '800',
    marginBottom: 8,
  },

  timeBox: {
    minHeight: 62,
    borderRadius: 12,
    backgroundColor:
      colors.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    marginBottom: 17,
  },

  timeInfo: {
    marginLeft: 10,
    flex: 1,
    minWidth: 0,
  },

  timeValue: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },

  timeHint: {
    color:
      colors.textSecondary,
    fontSize: 8,
    marginTop: 3,
  },

  observationInput: {
    minHeight: 90,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius: 11,
    backgroundColor:
      colors.background,
    padding: 11,
    color: colors.text,
    fontSize: 10,
    marginBottom: 14,
    outlineStyle: 'none',
  } as any,

  reserveButton: {
    minHeight: 45,
    borderRadius: 11,
    backgroundColor:
      colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  reserveButtonDisabled: {
    opacity: 0.45,
  },

  reserveButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 7,
  },

  approvalHint: {
    color:
      colors.textSecondary,
    fontSize: 8,
    lineHeight: 13,
    textAlign: 'center',
    marginTop: 9,
  },

  myReservationsTitle: {
    marginTop: 4,
  },

  reservasContainer: {
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius: 14,
    overflow: 'hidden',
  },

  tableHeader: {
    minHeight: 43,
    backgroundColor:
      colors.background,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
  },

  tableHeaderText: {
    color:
      colors.textSecondary,
    fontSize: 8,
    fontWeight: '800',
  },

  tableRow: {
    minHeight: 68,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
  },

  tableText: {
    color: colors.text,
    fontSize: 9,
    fontWeight: '600',
    paddingRight: 8,
  },

  colEspaco: {
    flex: 1.4,
    minWidth: 0,
  },

  colData: {
    flex: 0.8,
    minWidth: 0,
  },

  colHorario: {
    flex: 1,
    minWidth: 0,
  },

  colStatus: {
    flex: 0.8,
    minWidth: 0,
    alignItems: 'flex-start',
  },

  emptyReservas: {
    minHeight: 150,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius: 14,
    backgroundColor:
      colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  emptyReservationsText: {
    color:
      colors.textSecondary,
    fontSize: 9,
    textAlign: 'center',
    marginTop: 10,
  },

  mobileReservations: {
    width: '100%',
  },

  mobileReservationCard: {
    width: '100%',
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },

  mobileReservationTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  mobileReservationIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor:
      colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },

  mobileReservationTitleArea: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },

  mobileReservationTitle: {
    color: colors.text,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
  },

  mobileReservationDate: {
    color:
      colors.textSecondary,
    fontSize: 9,
    marginTop: 3,
  },

  mobileReservationDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
  },

  mobileReservationDetailText: {
    color:
      colors.textSecondary,
    fontSize: 9,
    marginLeft: 6,
  },

  mobileObservation: {
    color:
      colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
    marginTop: 9,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor:
      colors.background,
  },

  statusText: {
    color:
      colors.textSecondary,
    fontSize: 8,
    fontWeight: '800',
  },

  statusApproved: {
    backgroundColor:
      '#DCFCE7',
  },

  statusApprovedText: {
    color: '#15803D',
  },

  statusPending: {
    backgroundColor:
      '#FEF3C7',
  },

  statusPendingText: {
    color: '#92400E',
  },

  statusRejected: {
    backgroundColor:
      '#FEE2E2',
  },

  statusRejectedText: {
    color: '#B91C1C',
  },

  statusCanceled: {
    backgroundColor:
      '#F3F4F6',
  },

  statusCanceledText: {
    color: '#6B7280',
  },
});