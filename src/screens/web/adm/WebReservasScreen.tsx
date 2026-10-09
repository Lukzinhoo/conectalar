import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
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
  CalendarDays,
  Check,
  Clock,
  Home,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  X,
} from 'lucide-react-native';

import { colors } from '../../../theme/theme';
import { supabase } from '../../../services/supabase';
import WebSidebar from '../../../components/WebSidebar';
import WebLayout from '../../../components/WebLayout';

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
  morador: string;
  espaco: string;
};

function formatarData(data: string) {
  if (!data) return '-';

  const [ano, mes, dia] = data.split('-');

  if (!ano || !mes || !dia) {
    return data;
  }

  return `${dia}/${mes}/${ano}`;
}

function formatarHora(hora: string | null) {
  if (!hora) return '--:--';

  return hora.slice(0, 5);
}

function confirmar(mensagem: string) {
  if (
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as any).confirm === 'function'
  ) {
    return (globalThis as any).confirm(mensagem);
  }

  return true;
}

export default function WebReservasScreen() {
  const { width } = useWindowDimensions();

  const isMobile = width < 768;
  const isTablet =
    width >= 768 && width < 1100;

  const usarCardsReservas = width < 1150;

  const [espacos, setEspacos] =
    useState<Espaco[]>([]);

  const [reservas, setReservas] =
    useState<ReservaTela[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [atualizando, setAtualizando] =
    useState(false);

  const [
    alterandoReserva,
    setAlterandoReserva,
  ] = useState<string | null>(null);

  const [
    excluindoItem,
    setExcluindoItem,
  ] = useState<string | null>(null);

  const [
    modalNovoEspaco,
    setModalNovoEspaco,
  ] = useState(false);

  const [
    salvandoEspaco,
    setSalvandoEspaco,
  ] = useState(false);

  const [nomeEspaco, setNomeEspaco] =
    useState('');

  const [
    descricaoEspaco,
    setDescricaoEspaco,
  ] = useState('');

  const [
    capacidadeEspaco,
    setCapacidadeEspaco,
  ] = useState('');

  const [horaInicio, setHoraInicio] =
    useState('08:00');

  const [horaFim, setHoraFim] =
    useState('22:00');

  const [erro, setErro] =
    useState('');

  const [sucesso, setSucesso] =
    useState('');

  const carregarDados = useCallback(
    async (silencioso = false) => {
      try {
        setErro('');

        if (silencioso) {
          setAtualizando(true);
        } else {
          setCarregando(true);
        }

        const {
          data: espacosData,
          error: espacosError,
        } = await supabase
          .from('espacos_reserva')
          .select(
            'id, nome, descricao, capacidade, horario_inicio, horario_fim, ativo'
          )
          .order('nome', {
            ascending: true,
          });

        if (espacosError) {
          throw espacosError;
        }

        const {
          data: reservasData,
          error: reservasError,
        } = await supabase
          .from('reservas')
          .select(
            'id, morador_id, espaco_id, data, horario_inicio, horario_fim, observacao, status, criado_em'
          )
          .order('criado_em', {
            ascending: false,
          });

        if (reservasError) {
          throw reservasError;
        }

        const listaEspacos =
          (espacosData ?? []) as Espaco[];

        const listaReservas =
          (reservasData ??
            []) as ReservaBanco[];

        const moradorIds = [
          ...new Set(
            listaReservas.map(
              (item) => item.morador_id
            )
          ),
        ];

        let nomesMoradores: Record<
          string,
          string
        > = {};

        if (moradorIds.length > 0) {
          const {
            data: perfisData,
            error: perfisError,
          } = await supabase
            .from('perfis')
            .select('id, nome')
            .in('id', moradorIds);

          if (!perfisError) {
            nomesMoradores =
              Object.fromEntries(
                (perfisData ?? []).map(
                  (perfil: {
                    id: string;
                    nome: string;
                  }) => [
                    perfil.id,
                    perfil.nome,
                  ]
                )
              );
          }
        }

        const nomesEspacos =
          Object.fromEntries(
            listaEspacos.map(
              (espaco) => [
                espaco.id,
                espaco.nome,
              ]
            )
          );

        const reservasFormatadas:
          ReservaTela[] =
          listaReservas.map(
            (reserva) => ({
              ...reserva,

              morador:
                nomesMoradores[
                  reserva.morador_id
                ] ?? 'Morador',

              espaco:
                nomesEspacos[
                  reserva.espaco_id
                ] ?? 'Espaço',
            })
          );

        setEspacos(listaEspacos);
        setReservas(
          reservasFormatadas
        );
      } catch (error: any) {
        console.error(
          'Erro ao carregar reservas:',
          error
        );

        setErro(
          error?.message ||
            'Não foi possível carregar as reservas.'
        );
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    []
  );

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const resumo = useMemo(() => {
    return {
      total: reservas.length,

      pendentes: reservas.filter(
        (item) =>
          item.status === 'pendente'
      ).length,

      aprovadas: reservas.filter(
        (item) =>
          item.status === 'aprovada'
      ).length,

      recusadas: reservas.filter(
        (item) =>
          item.status === 'recusada' ||
          item.status === 'cancelada'
      ).length,
    };
  }, [reservas]);

  function validarHorario(
    valor: string
  ) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(
      valor
    );
  }

  function limparFormulario() {
    setNomeEspaco('');
    setDescricaoEspaco('');
    setCapacidadeEspaco('');
    setHoraInicio('08:00');
    setHoraFim('22:00');
  }

  function abrirNovoEspaco() {
    setErro('');
    setSucesso('');
    limparFormulario();
    setModalNovoEspaco(true);
  }

  function fecharNovoEspaco() {
    if (salvandoEspaco) {
      return;
    }

    setModalNovoEspaco(false);
    setErro('');
    limparFormulario();
  }

  async function cadastrarEspaco() {
    const nome =
      nomeEspaco.trim();

    const descricao =
      descricaoEspaco.trim();

    const capacidade =
      capacidadeEspaco.trim();

    setErro('');
    setSucesso('');

    if (!nome) {
      setErro(
        'Digite o nome do espaço.'
      );

      return;
    }

    if (
      !validarHorario(horaInicio) ||
      !validarHorario(horaFim)
    ) {
      setErro(
        'Use o formato HH:MM. Exemplo: 08:00 ou 22:00.'
      );

      return;
    }

    if (horaInicio >= horaFim) {
      setErro(
        'O horário final precisa ser maior que o horário inicial.'
      );

      return;
    }

    if (
      capacidade &&
      (!/^\d+$/.test(capacidade) ||
        Number(capacidade) <= 0)
    ) {
      setErro(
        'A capacidade precisa ser um número maior que zero.'
      );

      return;
    }

    try {
      setSalvandoEspaco(true);

      const { error } =
        await supabase
          .from('espacos_reserva')
          .insert({
            nome,

            descricao:
              descricao || null,

            capacidade: capacidade
              ? Number(capacidade)
              : null,

            horario_inicio:
              horaInicio,

            horario_fim: horaFim,

            ativo: true,
          });

      if (error) {
        throw error;
      }

      setModalNovoEspaco(false);
      limparFormulario();

      setSucesso(
        'Espaço cadastrado com sucesso.'
      );

      await carregarDados(true);
    } catch (error: any) {
      console.error(
        'Erro ao cadastrar espaço:',
        error
      );

      setErro(
        error?.message ||
          'Não foi possível cadastrar o espaço.'
      );
    } finally {
      setSalvandoEspaco(false);
    }
  }

  async function excluirEspaco(
    espaco: Espaco
  ) {
    const confirmado = confirmar(
      `Deseja realmente excluir o espaço "${espaco.nome}"?`
    );

    if (!confirmado) {
      return;
    }

    try {
      setErro('');
      setSucesso('');

      setExcluindoItem(
        `espaco-${espaco.id}`
      );

      const { error } =
        await supabase
          .from('espacos_reserva')
          .delete()
          .eq('id', espaco.id);

      if (error) {
        throw error;
      }

      setSucesso(
        'Espaço excluído com sucesso.'
      );

      await carregarDados(true);
    } catch (error: any) {
      console.error(
        'Erro ao excluir espaço:',
        error
      );

      if (error?.code === '23503') {
        setErro(
          'Este espaço possui reservas vinculadas. Exclua essas reservas primeiro.'
        );
      } else {
        setErro(
          error?.message ||
            'Não foi possível excluir o espaço.'
        );
      }
    } finally {
      setExcluindoItem(null);
    }
  }

  async function excluirReserva(
    reserva: ReservaTela
  ) {
    const confirmado = confirmar(
      `Deseja excluir a reserva de ${reserva.morador} para ${reserva.espaco}?`
    );

    if (!confirmado) {
      return;
    }

    try {
      setErro('');
      setSucesso('');

      setExcluindoItem(
        `reserva-${reserva.id}`
      );

      const { error } =
        await supabase
          .from('reservas')
          .delete()
          .eq('id', reserva.id);

      if (error) {
        throw error;
      }

      setSucesso(
        'Reserva excluída com sucesso.'
      );

      await carregarDados(true);
    } catch (error: any) {
      console.error(
        'Erro ao excluir reserva:',
        error
      );

      setErro(
        error?.message ||
          'Não foi possível excluir a reserva.'
      );
    } finally {
      setExcluindoItem(null);
    }
  }

  async function alterarStatus(
    reserva: ReservaTela,
    novoStatus:
      | 'aprovada'
      | 'recusada'
  ) {
    const textoAcao =
      novoStatus === 'aprovada'
        ? 'aprovar'
        : 'recusar';

    const confirmado = confirmar(
      `Deseja ${textoAcao} a reserva de ${reserva.morador}?`
    );

    if (!confirmado) {
      return;
    }

    try {
      setErro('');
      setSucesso('');

      setAlterandoReserva(
        reserva.id
      );

      const { error } =
        await supabase
          .from('reservas')
          .update({
            status: novoStatus,

            atualizado_em:
              new Date().toISOString(),
          })
          .eq('id', reserva.id);

      if (error) {
        throw error;
      }

      setSucesso(
        novoStatus === 'aprovada'
          ? 'Reserva aprovada com sucesso.'
          : 'Reserva recusada.'
      );

      await carregarDados(true);
    } catch (error: any) {
      console.error(
        'Erro ao alterar reserva:',
        error
      );

      setErro(
        error?.message ||
          'Não foi possível atualizar a reserva.'
      );
    } finally {
      setAlterandoReserva(null);
    }
  }

  function statusTexto(
    status: StatusReserva
  ) {
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

  function statusStyle(
    status: StatusReserva
  ) {
    if (status === 'aprovada') {
      return {
        badge:
          styles.statusApproved,
        text:
          styles.statusApprovedText,
      };
    }

    if (
      status === 'recusada' ||
      status === 'cancelada'
    ) {
      return {
        badge:
          styles.statusRejected,
        text:
          styles.statusRejectedText,
      };
    }

    return {
      badge: undefined,
      text: undefined,
    };
  }

  return (
    <WebLayout
      sidebar={
        <WebSidebar active="reservas" />
      }
    >
      <View
        style={[
          styles.header,

          isMobile &&
            styles.headerMobile,
        ]}
      >
        <View
          style={[
            styles.headerText,

            isMobile &&
              styles.headerTextMobile,
          ]}
        >
          <Text
            style={[
              styles.pageTitle,

              isMobile &&
                styles.pageTitleMobile,
            ]}
          >
            Reservas
          </Text>

          <Text
            style={styles.pageSubtitle}
          >
            Gerencie os espaços e as
            solicitações de reserva dos
            moradores.
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
            style={({ pressed }) => [
              styles.refreshButton,

              isMobile &&
                styles.headerActionMobile,

              pressed &&
                styles.pressed,
            ]}
            onPress={() =>
              carregarDados(true)
            }
            disabled={atualizando}
          >
            {atualizando ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
              />
            ) : (
              <RefreshCw
                size={17}
                color={colors.primary}
              />
            )}

            <Text
              style={styles.refreshText}
            >
              Atualizar
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.newButton,

              isMobile &&
                styles.headerActionMobile,

              pressed &&
                styles.pressed,
            ]}
            onPress={abrirNovoEspaco}
          >
            <Plus
              size={18}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.newButtonText
              }
            >
              Novo espaço
            </Text>
          </Pressable>
        </View>
      </View>

      {erro ? (
        <View style={styles.errorBox}>
          <Text
            style={styles.errorText}
          >
            {erro}
          </Text>
        </View>
      ) : null}

      {sucesso ? (
        <View
          style={styles.successBox}
        >
          <Text
            style={styles.successText}
          >
            {sucesso}
          </Text>
        </View>
      ) : null}

      <View
        style={[
          styles.summaryRow,

          (isMobile ||
            isTablet) &&
            styles.summaryRowResponsive,
        ]}
      >
        <SummaryCard
          titulo="Total"
          valor={resumo.total}
          icon={
            <CalendarDays
              size={21}
              color={colors.primary}
            />
          }
          responsive={
            isMobile || isTablet
          }
        />

        <SummaryCard
          titulo="Pendentes"
          valor={resumo.pendentes}
          icon={
            <Clock
              size={21}
              color="#92400E"
            />
          }
          fundoIcone="#FEF3C7"
          responsive={
            isMobile || isTablet
          }
        />

        <SummaryCard
          titulo="Aprovadas"
          valor={resumo.aprovadas}
          icon={
            <Check
              size={21}
              color="#166534"
            />
          }
          fundoIcone="#DCFCE7"
          responsive={
            isMobile || isTablet
          }
        />

        <SummaryCard
          titulo="Recusadas"
          valor={resumo.recusadas}
          icon={
            <X
              size={21}
              color="#B91C1C"
            />
          }
          fundoIcone="#FEE2E2"
          responsive={
            isMobile || isTablet
          }
          last
        />
      </View>

      <View
        style={[
          styles.card,

          isMobile &&
            styles.cardMobile,
        ]}
      >
        <View
          style={[
            styles.cardHeader,

            isMobile &&
              styles.cardHeaderMobile,
          ]}
        >
          <View style={styles.cardHeaderText}>
            <Text
              style={styles.sectionTitle}
            >
              Espaços disponíveis
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Áreas cadastradas para
              reserva.
            </Text>
          </View>

          <Text style={styles.counter}>
            {espacos.length} espaço(s)
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
              Carregando...
            </Text>
          </View>
        ) : espacos.length === 0 ? (
          <View style={styles.empty}>
            <Home
              size={28}
              color={
                colors.textSecondary
              }
            />

            <Text
              style={styles.emptyTitle}
            >
              Nenhum espaço cadastrado
            </Text>

            <Text
              style={styles.emptyText}
            >
              Clique em Novo espaço para
              cadastrar uma área.
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.spaceGrid,

              isMobile &&
                styles.spaceGridMobile,
            ]}
          >
            {espacos.map(
              (espaco) => (
                <View
                  key={espaco.id}
                  style={[
                    styles.spaceCard,

                    isMobile &&
                      styles.spaceCardMobile,

                    isTablet &&
                      styles.spaceCardTablet,
                  ]}
                >
                  <View
                    style={
                      styles.spaceCardTop
                    }
                  >
                    <View
                      style={
                        styles.spaceIcon
                      }
                    >
                      <Home
                        size={22}
                        color={
                          colors.primary
                        }
                      />
                    </View>

                    <Pressable
                      style={({
                        pressed,
                      }) => [
                        styles.deleteIcon,

                        pressed &&
                          styles.pressed,
                      ]}
                      disabled={
                        excluindoItem ===
                        `espaco-${espaco.id}`
                      }
                      onPress={() =>
                        excluirEspaco(
                          espaco
                        )
                      }
                    >
                      {excluindoItem ===
                      `espaco-${espaco.id}` ? (
                        <ActivityIndicator
                          size="small"
                          color="#DC2626"
                        />
                      ) : (
                        <Trash2
                          size={16}
                          color="#DC2626"
                        />
                      )}
                    </Pressable>
                  </View>

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
                      'Sem descrição'}
                  </Text>

                  <View
                    style={
                      styles.spaceInfo
                    }
                  >
                    <Clock
                      size={14}
                      color={
                        colors.textSecondary
                      }
                    />

                    <Text
                      style={
                        styles.spaceInfoText
                      }
                    >
                      {formatarHora(
                        espaco.horario_inicio
                      )}{' '}
                      às{' '}
                      {formatarHora(
                        espaco.horario_fim
                      )}
                    </Text>
                  </View>

                  {espaco.capacidade ? (
                    <View
                      style={
                        styles.spaceInfo
                      }
                    >
                      <Users
                        size={14}
                        color={
                          colors.textSecondary
                        }
                      />

                      <Text
                        style={
                          styles.spaceInfoText
                        }
                      >
                        {
                          espaco.capacidade
                        }{' '}
                        pessoas
                      </Text>
                    </View>
                  ) : null}
                </View>
              )
            )}
          </View>
        )}
      </View>

      <View
        style={[
          styles.card,
          styles.reservasCard,

          isMobile &&
            styles.cardMobile,
        ]}
      >
        <View
          style={[
            styles.cardHeader,

            isMobile &&
              styles.cardHeaderMobile,
          ]}
        >
          <View style={styles.cardHeaderText}>
            <Text
              style={styles.sectionTitle}
            >
              Solicitações de reserva
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Aprove, recuse ou exclua as
              reservas dos moradores.
            </Text>
          </View>

          <Text style={styles.counter}>
            {reservas.length} reserva(s)
          </Text>
        </View>

        {!carregando &&
        reservas.length === 0 ? (
          <View style={styles.empty}>
            <CalendarDays
              size={28}
              color={
                colors.textSecondary
              }
            />

            <Text
              style={styles.emptyTitle}
            >
              Nenhuma reserva encontrada
            </Text>

            <Text
              style={styles.emptyText}
            >
              Quando um morador solicitar
              uma reserva, ela aparecerá
              aqui.
            </Text>
          </View>
        ) : usarCardsReservas ? (
          <View
            style={
              styles.reservationCards
            }
          >
            {reservas.map(
              (reserva) => {
                const processando =
                  alterandoReserva ===
                  reserva.id;

                const status =
                  statusStyle(
                    reserva.status
                  );

                return (
                  <View
                    key={reserva.id}
                    style={
                      styles.reservationCard
                    }
                  >
                    <View
                      style={
                        styles.reservationCardTop
                      }
                    >
                      <View
                        style={
                          styles.reservationAvatar
                        }
                      >
                        <Users
                          size={19}
                          color={
                            colors.primary
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.reservationTitleArea
                        }
                      >
                        <Text
                          style={
                            styles.reservationResident
                          }
                        >
                          {
                            reserva.morador
                          }
                        </Text>

                        <Text
                          style={
                            styles.reservationSpace
                          }
                        >
                          {reserva.espaco}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          status.badge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            status.text,
                          ]}
                        >
                          {statusTexto(
                            reserva.status
                          )}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={
                        styles.reservationInfoGrid
                      }
                    >
                      <View
                        style={
                          styles.reservationInfo
                        }
                      >
                        <Text
                          style={
                            styles.infoLabel
                          }
                        >
                          DATA
                        </Text>

                        <Text
                          style={
                            styles.infoValue
                          }
                        >
                          {formatarData(
                            reserva.data
                          )}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.reservationInfo
                        }
                      >
                        <Text
                          style={
                            styles.infoLabel
                          }
                        >
                          HORÁRIO
                        </Text>

                        <Text
                          style={
                            styles.infoValue
                          }
                        >
                          {formatarHora(
                            reserva.horario_inicio
                          )}{' '}
                          -{' '}
                          {formatarHora(
                            reserva.horario_fim
                          )}
                        </Text>
                      </View>
                    </View>

                    {reserva.observacao ? (
                      <View
                        style={
                          styles.observationBox
                        }
                      >
                        <Text
                          style={
                            styles.infoLabel
                          }
                        >
                          OBSERVAÇÃO
                        </Text>

                        <Text
                          style={
                            styles.observationText
                          }
                        >
                          {
                            reserva.observacao
                          }
                        </Text>
                      </View>
                    ) : null}

                    <View
                      style={
                        styles.mobileActions
                      }
                    >
                      {reserva.status ===
                      'pendente' ? (
                        <>
                          <Pressable
                            style={({
                              pressed,
                            }) => [
                              styles.mobileApproveButton,

                              pressed &&
                                styles.pressed,
                            ]}
                            disabled={
                              processando
                            }
                            onPress={() =>
                              alterarStatus(
                                reserva,
                                'aprovada'
                              )
                            }
                          >
                            {processando ? (
                              <ActivityIndicator
                                size="small"
                                color="#FFFFFF"
                              />
                            ) : (
                              <Check
                                size={16}
                                color="#FFFFFF"
                              />
                            )}

                            <Text
                              style={
                                styles.mobileApproveText
                              }
                            >
                              Aprovar
                            </Text>
                          </Pressable>

                          <Pressable
                            style={({
                              pressed,
                            }) => [
                              styles.mobileRejectButton,

                              pressed &&
                                styles.pressed,
                            ]}
                            disabled={
                              processando
                            }
                            onPress={() =>
                              alterarStatus(
                                reserva,
                                'recusada'
                              )
                            }
                          >
                            <X
                              size={16}
                              color="#B91C1C"
                            />

                            <Text
                              style={
                                styles.mobileRejectText
                              }
                            >
                              Recusar
                            </Text>
                          </Pressable>
                        </>
                      ) : null}

                      <Pressable
                        style={({
                          pressed,
                        }) => [
                          styles.mobileDeleteButton,

                          reserva.status !==
                            'pendente' &&
                            styles.mobileDeleteButtonFull,

                          pressed &&
                            styles.pressed,
                        ]}
                        disabled={
                          excluindoItem ===
                          `reserva-${reserva.id}`
                        }
                        onPress={() =>
                          excluirReserva(
                            reserva
                          )
                        }
                      >
                        {excluindoItem ===
                        `reserva-${reserva.id}` ? (
                          <ActivityIndicator
                            size="small"
                            color="#DC2626"
                          />
                        ) : (
                          <Trash2
                            size={16}
                            color="#DC2626"
                          />
                        )}

                        <Text
                          style={
                            styles.mobileDeleteText
                          }
                        >
                          Excluir
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              }
            )}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
          >
            <View style={styles.table}>
              <View
                style={
                  styles.tableHeader
                }
              >
                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.colMorador,
                  ]}
                >
                  MORADOR
                </Text>

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

                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.colAcoes,
                  ]}
                >
                  AÇÕES
                </Text>
              </View>

              {reservas.map(
                (reserva) => {
                  const processando =
                    alterandoReserva ===
                    reserva.id;

                  const status =
                    statusStyle(
                      reserva.status
                    );

                  return (
                    <View
                      key={reserva.id}
                      style={
                        styles.tableRow
                      }
                    >
                      <View
                        style={
                          styles.colMorador
                        }
                      >
                        <Text
                          style={
                            styles.primaryText
                          }
                          numberOfLines={
                            1
                          }
                        >
                          {
                            reserva.morador
                          }
                        </Text>

                        {reserva.observacao ? (
                          <Text
                            style={
                              styles.secondaryText
                            }
                            numberOfLines={
                              1
                            }
                          >
                            {
                              reserva.observacao
                            }
                          </Text>
                        ) : null}
                      </View>

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
                        {formatarHora(
                          reserva.horario_inicio
                        )}{' '}
                        -{' '}
                        {formatarHora(
                          reserva.horario_fim
                        )}
                      </Text>

                      <View
                        style={
                          styles.colStatus
                        }
                      >
                        <View
                          style={[
                            styles.statusBadge,
                            status.badge,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              status.text,
                            ]}
                          >
                            {statusTexto(
                              reserva.status
                            )}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={
                          styles.colAcoes
                        }
                      >
                        {reserva.status ===
                        'pendente' ? (
                          <>
                            <Pressable
                              style={({
                                pressed,
                              }) => [
                                styles.approveButton,

                                pressed &&
                                  styles.pressed,
                              ]}
                              disabled={
                                processando
                              }
                              onPress={() =>
                                alterarStatus(
                                  reserva,
                                  'aprovada'
                                )
                              }
                            >
                              {processando ? (
                                <ActivityIndicator
                                  size="small"
                                  color="#FFFFFF"
                                />
                              ) : (
                                <Check
                                  size={15}
                                  color="#FFFFFF"
                                />
                              )}
                            </Pressable>

                            <Pressable
                              style={({
                                pressed,
                              }) => [
                                styles.rejectButton,

                                pressed &&
                                  styles.pressed,
                              ]}
                              disabled={
                                processando
                              }
                              onPress={() =>
                                alterarStatus(
                                  reserva,
                                  'recusada'
                                )
                              }
                            >
                              <X
                                size={15}
                                color="#B91C1C"
                              />
                            </Pressable>
                          </>
                        ) : null}

                        <Pressable
                          style={({
                            pressed,
                          }) => [
                            styles.deleteButton,

                            pressed &&
                              styles.pressed,
                          ]}
                          disabled={
                            excluindoItem ===
                            `reserva-${reserva.id}`
                          }
                          onPress={() =>
                            excluirReserva(
                              reserva
                            )
                          }
                        >
                          {excluindoItem ===
                          `reserva-${reserva.id}` ? (
                            <ActivityIndicator
                              size="small"
                              color="#DC2626"
                            />
                          ) : (
                            <Trash2
                              size={15}
                              color="#DC2626"
                            />
                          )}
                        </Pressable>
                      </View>
                    </View>
                  );
                }
              )}
            </View>
          </ScrollView>
        )}
      </View>

      <Modal
        visible={modalNovoEspaco}
        transparent
        animationType="fade"
        onRequestClose={
          fecharNovoEspaco
        }
        statusBarTranslucent
      >
        <View
          style={[
            styles.modalOverlay,

            isMobile &&
              styles.modalOverlayMobile,
          ]}
        >
          <View
            style={[
              styles.modalCard,

              isMobile &&
                styles.modalCardMobile,
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
                  style={
                    styles.modalLabel
                  }
                >
                  RESERVAS
                </Text>

                <Text
                  style={[
                    styles.modalTitle,

                    isMobile &&
                      styles.modalTitleMobile,
                  ]}
                >
                  Novo espaço
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  Cadastre uma área
                  disponível para reserva.
                </Text>
              </View>

              <Pressable
                style={({
                  pressed,
                }) => [
                  styles.closeButton,

                  pressed &&
                    styles.pressed,
                ]}
                disabled={
                  salvandoEspaco
                }
                onPress={
                  fecharNovoEspaco
                }
              >
                <X
                  size={20}
                  color={colors.text}
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
              {erro ? (
                <View
                  style={
                    styles.modalError
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
              ) : null}

              <Text
                style={
                  styles.inputLabel
                }
              >
                NOME *
              </Text>

              <TextInput
                style={styles.input}
                value={nomeEspaco}
                onChangeText={
                  setNomeEspaco
                }
                placeholder="Ex.: Churrasqueira"
                placeholderTextColor="#94A3B8"
                editable={
                  !salvandoEspaco
                }
              />

              <Text
                style={
                  styles.inputLabel
                }
              >
                DESCRIÇÃO
              </Text>

              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                ]}
                value={
                  descricaoEspaco
                }
                onChangeText={
                  setDescricaoEspaco
                }
                placeholder="Ex.: Área gourmet próxima à piscina"
                placeholderTextColor="#94A3B8"
                multiline
                textAlignVertical="top"
                editable={
                  !salvandoEspaco
                }
              />

              <Text
                style={
                  styles.inputLabel
                }
              >
                CAPACIDADE
              </Text>

              <TextInput
                style={styles.input}
                value={
                  capacidadeEspaco
                }
                onChangeText={
                  setCapacidadeEspaco
                }
                placeholder="Ex.: 30"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                editable={
                  !salvandoEspaco
                }
              />

              <View
                style={[
                  styles.formRow,

                  isMobile &&
                    styles.formRowMobile,
                ]}
              >
                <View
                  style={[
                    styles.formHalf,

                    isMobile &&
                      styles.formHalfMobile,
                  ]}
                >
                  <Text
                    style={
                      styles.inputLabel
                    }
                  >
                    HORÁRIO INICIAL *
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={horaInicio}
                    onChangeText={
                      setHoraInicio
                    }
                    placeholder="08:00"
                    placeholderTextColor="#94A3B8"
                    maxLength={5}
                    editable={
                      !salvandoEspaco
                    }
                  />
                </View>

                <View
                  style={[
                    styles.formHalf,

                    isMobile &&
                      styles.formHalfMobile,
                  ]}
                >
                  <Text
                    style={
                      styles.inputLabel
                    }
                  >
                    HORÁRIO FINAL *
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={horaFim}
                    onChangeText={
                      setHoraFim
                    }
                    placeholder="22:00"
                    placeholderTextColor="#94A3B8"
                    maxLength={5}
                    editable={
                      !salvandoEspaco
                    }
                  />
                </View>
              </View>
            </ScrollView>

            <View
              style={[
                styles.modalActions,

                isMobile &&
                  styles.modalActionsMobile,
              ]}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.cancelButton,

                  isMobile &&
                    styles.modalButtonMobile,

                  pressed &&
                    styles.pressed,
                ]}
                disabled={
                  salvandoEspaco
                }
                onPress={
                  fecharNovoEspaco
                }
              >
                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,

                  isMobile &&
                    styles.modalButtonMobile,

                  salvandoEspaco &&
                    styles.disabled,

                  pressed &&
                    styles.pressed,
                ]}
                disabled={
                  salvandoEspaco
                }
                onPress={
                  cadastrarEspaco
                }
              >
                {salvandoEspaco ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Plus
                    size={17}
                    color="#FFFFFF"
                  />
                )}

                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  {salvandoEspaco
                    ? 'Salvando...'
                    : 'Cadastrar espaço'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </WebLayout>
  );
}

function SummaryCard({
  titulo,
  valor,
  icon,
  fundoIcone = colors.primaryLight,
  responsive = false,
  last = false,
}: {
  titulo: string;
  valor: number;
  icon: React.ReactNode;
  fundoIcone?: string;
  responsive?: boolean;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.summaryCard,

        last &&
          styles.summaryCardLast,

        responsive &&
          styles.summaryCardResponsive,
      ]}
    >
      <View
        style={[
          styles.summaryIcon,
          {
            backgroundColor:
              fundoIcone,
          },
        ]}
      >
        {icon}
      </View>

      <View>
        <Text
          style={
            styles.summaryNumber
          }
        >
          {valor}
        </Text>

        <Text
          style={
            styles.summaryLabel
          }
        >
          {titulo}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
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
    paddingRight: 20,
  },

  headerTextMobile: {
    paddingRight: 0,
    marginBottom: 15,
  },

  pageTitle: {
    color: colors.text,
    fontSize: 27,
    fontWeight: '800',
  },

  pageTitleMobile: {
    fontSize: 23,
  },

  pageSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 18,
    marginTop: 5,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },

  headerActionsMobile: {
    width: '100%',
    alignItems: 'stretch',
  },

  headerActionMobile: {
    flex: 1,
    minWidth: 0,
  },

  refreshButton: {
    height: 42,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    backgroundColor:
      colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  refreshText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 7,
  },

  newButton: {
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor:
      colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  newButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 7,
  },

  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },

  errorText: {
    color: '#B91C1C',
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 16,
  },

  successBox: {
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },

  successText: {
    color: '#166534',
    fontSize: 10,
    fontWeight: '600',
  },

  summaryRow: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 22,
  },

  summaryRowResponsive: {
    flexDirection: 'column',
  },

  summaryCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 105,
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 15,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  summaryCardLast: {
    marginRight: 0,
  },

  summaryCardResponsive: {
    width: '100%',
    flex: 0,
    minHeight: 86,
    marginRight: 0,
    marginBottom: 10,
  },

  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  summaryNumber: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '800',
  },

  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 2,
  },

  card: {
    width: '100%',
    minWidth: 0,
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    padding: 20,
  },

  cardMobile: {
    padding: 14,
    borderRadius: 14,
  },

  reservasCard: {
    marginTop: 20,
    marginBottom: 30,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 18,
  },

  cardHeaderMobile: {
    alignItems: 'flex-start',
  },

  cardHeaderText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
    marginTop: 3,
  },

  counter: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    flexShrink: 0,
  },

  loading: {
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 9,
  },

  empty: {
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 9,
    textAlign: 'center',
  },

  emptyText: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
    marginTop: 4,
    textAlign: 'center',
  },

  spaceGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  spaceGridMobile: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
  },

  spaceCard: {
    width: 250,
    minHeight: 175,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 15,
    marginRight: 12,
    marginBottom: 12,
    backgroundColor:
      colors.background,
  },

  spaceCardTablet: {
    width: '100%',
    marginRight: 0,
  },

  spaceCardMobile: {
    width: '100%',
    minHeight: 0,
    marginRight: 0,
    padding: 14,
  },

  spaceCardTop: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
  },

  spaceIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor:
      colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteIcon: {
    width: 35,
    height: 35,
    borderRadius: 9,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  spaceTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 13,
  },

  spaceDescription: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
  },

  spaceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  spaceInfoText: {
    color: colors.textSecondary,
    fontSize: 9,
    marginLeft: 6,
  },

  table: {
    minWidth: 1030,
  },

  tableHeader: {
    height: 43,
    backgroundColor:
      colors.background,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  tableHeaderText: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '800',
  },

  tableRow: {
    minHeight: 66,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  primaryText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
  },

  secondaryText: {
    color: colors.textSecondary,
    fontSize: 8,
    marginTop: 3,
  },

  tableText: {
    color: colors.textSecondary,
    fontSize: 10,
  },

  colMorador: {
    width: 210,
  },

  colEspaco: {
    width: 170,
  },

  colData: {
    width: 125,
  },

  colHorario: {
    width: 155,
  },

  colStatus: {
    width: 130,
  },

  colAcoes: {
    width: 200,
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  statusText: {
    color: '#92400E',
    fontSize: 8,
    fontWeight: '800',
  },

  statusApproved: {
    backgroundColor: '#DCFCE7',
  },

  statusApprovedText: {
    color: '#166534',
  },

  statusRejected: {
    backgroundColor: '#FEE2E2',
  },

  statusRejectedText: {
    color: '#B91C1C',
  },

  approveButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },

  rejectButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },

  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  reservationCards: {
    width: '100%',
  },

  reservationCard: {
    width: '100%',
    minWidth: 0,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor:
      colors.background,
    padding: 14,
    marginBottom: 11,
  },

  reservationCardTop: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },

  reservationAvatar: {
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

  reservationTitleArea: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },

  reservationResident: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },

  reservationSpace: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 3,
  },

  reservationInfoGrid: {
    width: '100%',
    flexDirection: 'row',
    marginTop: 14,
  },

  reservationInfo: {
    flex: 1,
    minWidth: 0,
    backgroundColor:
      colors.surface,
    borderRadius: 9,
    padding: 10,
    marginRight: 7,
  },

  infoLabel: {
    color: colors.textLight,
    fontSize: 7,
    fontWeight: '800',
  },

  infoValue: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },

  observationBox: {
    width: '100%',
    borderRadius: 9,
    backgroundColor:
      colors.surface,
    padding: 10,
    marginTop: 9,
  },

  observationText: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
    marginTop: 4,
  },

  mobileActions: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },

  mobileApproveButton: {
    flex: 1,
    minWidth: 0,
    height: 38,
    borderRadius: 9,
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },

  mobileApproveText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 5,
  },

  mobileRejectButton: {
    flex: 1,
    minWidth: 0,
    height: 38,
    borderRadius: 9,
    backgroundColor: '#FEE2E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },

  mobileRejectText: {
    color: '#B91C1C',
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 5,
  },

  mobileDeleteButton: {
    flex: 1,
    minWidth: 0,
    height: 38,
    borderRadius: 9,
    backgroundColor: '#FEE2E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  mobileDeleteButtonFull: {
    flex: 1,
  },

  mobileDeleteText: {
    color: '#DC2626',
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 5,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(15,23,42,0.60)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  modalOverlayMobile: {
    padding: 10,
  },

  modalCard: {
    width: '100%',
    maxWidth: 580,
    height: '90%',
    maxHeight: 650,
    backgroundColor:
      colors.surface,
    borderRadius: 18,
    padding: 22,
    overflow: 'hidden',
  },

  modalCardMobile: {
    width: '100%',
    maxWidth: '100%',
    height: '94%',
    maxHeight: '94%',
    borderRadius: 14,
    padding: 14,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    flexShrink: 0,
  },

  modalHeaderText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },

  modalLabel: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },

  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 3,
  },

  modalTitleMobile: {
    fontSize: 18,
  },

  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
    marginTop: 3,
  },

  closeButton: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor:
      colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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

  modalError: {
    backgroundColor: '#FEE2E2',
    borderRadius: 9,
    padding: 10,
    marginBottom: 5,
  },

  inputLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 6,
  },

  input: {
    width: '100%',
    minHeight: 44,
    backgroundColor:
      colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: colors.text,
    fontSize: 11,
    outlineStyle: 'none',
  } as any,

  textArea: {
    minHeight: 82,
    paddingTop: 11,
    textAlignVertical: 'top',
  },

  formRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent:
      'space-between',
  },

  formRowMobile: {
    flexDirection: 'column',
  },

  formHalf: {
    width: '48.5%',
  },

  formHalfMobile: {
    width: '100%',
  },

  modalActions: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    paddingTop: 12,
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
  },

  modalActionsMobile: {
    flexDirection:
      'column-reverse',
    alignItems: 'stretch',
  },

  cancelButton: {
    width: 120,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
  },

  saveButton: {
    flex: 1,
    height: 44,
    borderRadius: 11,
    backgroundColor:
      colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 7,
  },

  modalButtonMobile: {
    width: '100%',
    flex: 0,
    marginRight: 0,
    marginBottom: 8,
  },

  disabled: {
    opacity: 0.55,
  },

  pressed: {
    opacity: 0.78,
  },
});