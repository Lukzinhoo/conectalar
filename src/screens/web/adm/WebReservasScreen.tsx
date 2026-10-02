import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';

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

function avisar(mensagem: string) {
  if (
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as any).alert === 'function'
  ) {
    (globalThis as any).alert(mensagem);
  }
}

export default function WebReservasScreen() {
  const navigation = useNavigation<any>();

  const [espacos, setEspacos] = useState<Espaco[]>([]);
  const [reservas, setReservas] = useState<ReservaTela[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const [alterandoReserva, setAlterandoReserva] =
    useState<string | null>(null);

  const [excluindoItem, setExcluindoItem] =
    useState<string | null>(null);

  const [modalNovoEspaco, setModalNovoEspaco] =
    useState(false);

  const [salvandoEspaco, setSalvandoEspaco] =
    useState(false);

  const [nomeEspaco, setNomeEspaco] = useState('');
  const [descricaoEspaco, setDescricaoEspaco] = useState('');
  const [capacidadeEspaco, setCapacidadeEspaco] = useState('');
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('22:00');

  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

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
          .order('nome', { ascending: true });

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
          .order('criado_em', { ascending: false });

        if (reservasError) {
          throw reservasError;
        }

        const listaEspacos =
          (espacosData ?? []) as Espaco[];

        const listaReservas =
          (reservasData ?? []) as ReservaBanco[];

        const moradorIds = [
          ...new Set(
            listaReservas.map(
              (item) => item.morador_id
            )
          ),
        ];

        let nomesMoradores: Record<string, string> = {};

        if (moradorIds.length > 0) {
          const {
            data: perfisData,
            error: perfisError,
          } = await supabase
            .from('perfis')
            .select('id, nome')
            .in('id', moradorIds);

          if (!perfisError) {
            nomesMoradores = Object.fromEntries(
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

        const nomesEspacos = Object.fromEntries(
          listaEspacos.map((espaco) => [
            espaco.id,
            espaco.nome,
          ])
        );

        const reservasFormatadas: ReservaTela[] =
          listaReservas.map((reserva) => ({
            ...reserva,
            morador:
              nomesMoradores[reserva.morador_id] ??
              'Morador',
            espaco:
              nomesEspacos[reserva.espaco_id] ??
              'EspaÃ§o',
          }));

        setEspacos(listaEspacos);
        setReservas(reservasFormatadas);
      } catch (error: any) {
        console.error(
          'Erro ao carregar reservas:',
          error
        );

        setErro(
          error?.message ||
            'NÃ£o foi possÃ­vel carregar as reservas.'
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
        (item) => item.status === 'pendente'
      ).length,

      aprovadas: reservas.filter(
        (item) => item.status === 'aprovada'
      ).length,

      recusadas: reservas.filter(
        (item) =>
          item.status === 'recusada' ||
          item.status === 'cancelada'
      ).length,
    };
  }, [reservas]);

  function validarHorario(valor: string) {
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

  async function cadastrarEspaco() {
    const nome = nomeEspaco.trim();
    const descricao = descricaoEspaco.trim();
    const capacidade = capacidadeEspaco.trim();

    setErro('');
    setSucesso('');

    if (!nome) {
      setErro('Digite o nome do espaÃ§o.');
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
        'O horÃ¡rio final precisa ser maior que o horÃ¡rio inicial.'
      );
      return;
    }

    if (
      capacidade &&
      (!/^\d+$/.test(capacidade) ||
        Number(capacidade) <= 0)
    ) {
      setErro(
        'A capacidade precisa ser um nÃºmero maior que zero.'
      );
      return;
    }

    try {
      setSalvandoEspaco(true);

      const { error } = await supabase
        .from('espacos_reserva')
        .insert({
          nome,
          descricao: descricao || null,
          capacidade: capacidade
            ? Number(capacidade)
            : null,
          horario_inicio: horaInicio,
          horario_fim: horaFim,
          ativo: true,
        });

      if (error) {
        throw error;
      }

      setModalNovoEspaco(false);
      limparFormulario();

      setSucesso(
        'EspaÃ§o cadastrado com sucesso.'
      );

      await carregarDados(true);
    } catch (error: any) {
      console.error(
        'Erro ao cadastrar espaÃ§o:',
        error
      );

      setErro(
        error?.message ||
          'NÃ£o foi possÃ­vel cadastrar o espaÃ§o.'
      );
    } finally {
      setSalvandoEspaco(false);
    }
  }

  async function excluirEspaco(
    espaco: Espaco
  ) {
    const confirmado = confirmar(
      `Deseja realmente excluir o espaÃ§o "${espaco.nome}"?`
    );

    if (!confirmado) return;

    try {
      setErro('');
      setSucesso('');
      setExcluindoItem(
        `espaco-${espaco.id}`
      );

      const { error } = await supabase
        .from('espacos_reserva')
        .delete()
        .eq('id', espaco.id);

      if (error) {
        throw error;
      }

      setSucesso(
        'EspaÃ§o excluÃ­do com sucesso.'
      );

      await carregarDados(true);
    } catch (error: any) {
      console.error(
        'Erro ao excluir espaÃ§o:',
        error
      );

      if (error?.code === '23503') {
        setErro(
          'Este espaÃ§o possui reservas vinculadas. Exclua essas reservas primeiro.'
        );
      } else {
        setErro(
          error?.message ||
            'NÃ£o foi possÃ­vel excluir o espaÃ§o.'
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

    if (!confirmado) return;

    try {
      setErro('');
      setSucesso('');

      setExcluindoItem(
        `reserva-${reserva.id}`
      );

      const { error } = await supabase
        .from('reservas')
        .delete()
        .eq('id', reserva.id);

      if (error) {
        throw error;
      }

      setSucesso(
        'Reserva excluÃ­da com sucesso.'
      );

      await carregarDados(true);
    } catch (error: any) {
      console.error(
        'Erro ao excluir reserva:',
        error
      );

      setErro(
        error?.message ||
          'NÃ£o foi possÃ­vel excluir a reserva.'
      );
    } finally {
      setExcluindoItem(null);
    }
  }

  async function alterarStatus(
    reserva: ReservaTela,
    novoStatus: 'aprovada' | 'recusada'
  ) {
    const textoAcao =
      novoStatus === 'aprovada'
        ? 'aprovar'
        : 'recusar';

    const confirmado = confirmar(
      `Deseja ${textoAcao} a reserva de ${reserva.morador}?`
    );

    if (!confirmado) return;

    try {
      setErro('');
      setSucesso('');
      setAlterandoReserva(reserva.id);

      const { error } = await supabase
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
          'NÃ£o foi possÃ­vel atualizar a reserva.'
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

  return (
    <View style={styles.container}>
      {/* SIDEBAR PADRÃƒO */}
      <WebSidebar active="reservas" />

      {/* CONTEÃšDO */}
      <ScrollView
        style={styles.main}
        contentContainerStyle={
          styles.mainContent
        }
      >
        {/* CABEÃ‡ALHO */}
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>
              Reservas
            </Text>

            <Text
              style={styles.pageSubtitle}
            >
              Gerencie os espaÃ§os e as
              solicitaÃ§Ãµes de reserva dos
              moradores.
            </Text>
          </View>

          <View
            style={styles.headerActions}
          >
            <Pressable
              style={styles.refreshButton}
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
              style={styles.newButton}
              onPress={abrirNovoEspaco}
            >
              <Plus
                size={18}
                color="#FFFFFF"
              />

              <Text
                style={styles.newButtonText}
              >
                Novo espaÃ§o
              </Text>
            </Pressable>
          </View>
        </View>

        {erro ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
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

        {/* RESUMO */}
        <View style={styles.summaryRow}>
          <SummaryCard
            titulo="Total"
            valor={resumo.total}
            icon={
              <CalendarDays
                size={21}
                color={colors.primary}
              />
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
          />
        </View>

        {/* ESPAÃ‡OS */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text
                style={styles.sectionTitle}
              >
                EspaÃ§os disponÃ­veis
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Ãreas cadastradas para
                reserva.
              </Text>
            </View>

            <Text style={styles.counter}>
              {espacos.length} espaÃ§o(s)
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
                color={colors.textSecondary}
              />

              <Text
                style={styles.emptyTitle}
              >
                Nenhum espaÃ§o cadastrado
              </Text>

              <Text
                style={styles.emptyText}
              >
                Clique em Novo espaÃ§o para
                cadastrar uma Ã¡rea.
              </Text>
            </View>
          ) : (
            <View style={styles.spaceGrid}>
              {espacos.map((espaco) => (
                <View
                  key={espaco.id}
                  style={styles.spaceCard}
                >
                  <View
                    style={
                      styles.spaceCardTop
                    }
                  >
                    <View
                      style={styles.spaceIcon}
                    >
                      <Home
                        size={22}
                        color={colors.primary}
                      />
                    </View>

                    <Pressable
                      style={
                        styles.deleteIcon
                      }
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
                    style={styles.spaceTitle}
                  >
                    {espaco.nome}
                  </Text>

                  <Text
                    style={
                      styles.spaceDescription
                    }
                    numberOfLines={2}
                  >
                    {espaco.descricao ||
                      'Sem descriÃ§Ã£o'}
                  </Text>

                  <View
                    style={styles.spaceInfo}
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
                      Ã s{' '}
                      {formatarHora(
                        espaco.horario_fim
                      )}
                    </Text>
                  </View>

                  {espaco.capacidade ? (
                    <View
                      style={styles.spaceInfo}
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
                        {espaco.capacidade}{' '}
                        pessoas
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* RESERVAS */}
        <View
          style={[
            styles.card,
            styles.reservasCard,
          ]}
        >
          <View style={styles.cardHeader}>
            <View>
              <Text
                style={styles.sectionTitle}
              >
                SolicitaÃ§Ãµes de reserva
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
                color={colors.textSecondary}
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
                uma reserva, ela aparecerÃ¡
                aqui.
              </Text>
            </View>
          ) : (
            <ScrollView horizontal>
              <View style={styles.table}>
                <View
                  style={styles.tableHeader}
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
                    ESPAÃ‡O
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
                    HORÃRIO
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
                    AÃ‡Ã•ES
                  </Text>
                </View>

                {reservas.map(
                  (reserva) => {
                    const processando =
                      alterandoReserva ===
                      reserva.id;

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
                            numberOfLines={1}
                          >
                            {reserva.morador}
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

                              reserva.status ===
                                'aprovada' &&
                                styles.statusApproved,

                              (reserva.status ===
                                'recusada' ||
                                reserva.status ===
                                  'cancelada') &&
                                styles.statusRejected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusText,

                                reserva.status ===
                                  'aprovada' &&
                                  styles.statusApprovedText,

                                (reserva.status ===
                                  'recusada' ||
                                  reserva.status ===
                                    'cancelada') &&
                                  styles.statusRejectedText,
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
                                style={
                                  styles.approveButton
                                }
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
                                style={
                                  styles.rejectButton
                                }
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
                            style={
                              styles.deleteButton
                            }
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
      </ScrollView>

      {/* MODAL NOVO ESPAÃ‡O */}
      <Modal
        visible={modalNovoEspaco}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!salvandoEspaco) {
            setModalNovoEspaco(false);
          }
        }}
      >
        <View
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View
              style={styles.modalHeader}
            >
              <View>
                <Text
                  style={styles.modalLabel}
                >
                  RESERVAS
                </Text>

                <Text
                  style={styles.modalTitle}
                >
                  Novo espaÃ§o
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  Cadastre uma Ã¡rea
                  disponÃ­vel para reserva.
                </Text>
              </View>

              <Pressable
                style={styles.closeButton}
                disabled={salvandoEspaco}
                onPress={() =>
                  setModalNovoEspaco(false)
                }
              >
                <X
                  size={20}
                  color={colors.text}
                />
              </Pressable>
            </View>

            {erro ? (
              <View
                style={styles.modalError}
              >
                <Text
                  style={styles.errorText}
                >
                  {erro}
                </Text>
              </View>
            ) : null}

            <Text
              style={styles.inputLabel}
            >
              NOME *
            </Text>

            <TextInput
              style={styles.input}
              value={nomeEspaco}
              onChangeText={setNomeEspaco}
              placeholder="Ex.: Churrasqueira"
              placeholderTextColor="#94A3B8"
              editable={!salvandoEspaco}
            />

            <Text
              style={styles.inputLabel}
            >
              DESCRIÃ‡ÃƒO
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.textArea,
              ]}
              value={descricaoEspaco}
              onChangeText={
                setDescricaoEspaco
              }
              placeholder="Ex.: Ãrea gourmet prÃ³xima Ã  piscina"
              placeholderTextColor="#94A3B8"
              multiline
              editable={!salvandoEspaco}
            />

            <Text
              style={styles.inputLabel}
            >
              CAPACIDADE
            </Text>

            <TextInput
              style={styles.input}
              value={capacidadeEspaco}
              onChangeText={
                setCapacidadeEspaco
              }
              placeholder="Ex.: 30"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              editable={!salvandoEspaco}
            />

            <View style={styles.formRow}>
              <View
                style={styles.formHalf}
              >
                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  HORÃRIO INICIAL *
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
                style={styles.formHalf}
              >
                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  HORÃRIO FINAL *
                </Text>

                <TextInput
                  style={styles.input}
                  value={horaFim}
                  onChangeText={setHoraFim}
                  placeholder="22:00"
                  placeholderTextColor="#94A3B8"
                  maxLength={5}
                  editable={
                    !salvandoEspaco
                  }
                />
              </View>
            </View>

            <View
              style={styles.modalActions}
            >
              <Pressable
                style={styles.cancelButton}
                disabled={salvandoEspaco}
                onPress={() =>
                  setModalNovoEspaco(false)
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
                style={[
                  styles.saveButton,
                  salvandoEspaco &&
                    styles.disabled,
                ]}
                disabled={salvandoEspaco}
                onPress={cadastrarEspaco}
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
                    : 'Cadastrar espaÃ§o'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MenuItem({
  label,
  ativo = false,
  onPress,
}: {
  label: string;
  ativo?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.menuItem,
        ativo && styles.menuItemActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.menuText,
          ativo && styles.menuTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SummaryCard({
  titulo,
  valor,
  icon,
  fundoIcone = colors.primaryLight,
}: {
  titulo: string;
  valor: number;
  icon: React.ReactNode;
  fundoIcone?: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <View
        style={[
          styles.summaryIcon,
          {
            backgroundColor: fundoIcone,
          },
        ]}
      >
        {icon}
      </View>

      <View>
        <Text
          style={styles.summaryNumber}
        >
          {valor}
        </Text>

        <Text
          style={styles.summaryLabel}
        >
          {titulo}
        </Text>
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

  sidebar: {
    width: 235,
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 22,
    justifyContent: 'space-between',
  },

  brandArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoBox: {
    width: 39,
    height: 39,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  logo: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },

  logoSubtitle: {
    color: '#94A3B8',
    fontSize: 9,
    marginTop: 2,
  },

  menu: {
    marginTop: 36,
  },

  menuItem: {
    minHeight: 44,
    borderRadius: 11,
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginBottom: 6,
  },

  menuItemActive: {
    backgroundColor: colors.primary,
  },

  menuText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },

  menuTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  sidebarBottom: {
    borderTopWidth: 1,
    borderTopColor:
      'rgba(255,255,255,0.10)',
    paddingTop: 15,
  },

  sidebarBottomTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  sidebarBottomText: {
    color: '#94A3B8',
    fontSize: 8,
    marginTop: 3,
  },

  main: {
    flex: 1,
  },

  mainContent: {
    padding: 30,
    paddingBottom: 50,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  pageTitle: {
    color: colors.text,
    fontSize: 27,
    fontWeight: '800',
  },

  pageSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 5,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  refreshButton: {
    height: 42,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    marginBottom: 22,
  },

  summaryCard: {
    flex: 1,
    minHeight: 105,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 15,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    padding: 20,
  },

  reservasCard: {
    marginTop: 20,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 3,
  },

  counter: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
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
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 9,
  },

  emptyText: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 4,
  },

  spaceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    backgroundColor: colors.background,
  },

  spaceCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  spaceIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteIcon: {
    width: 33,
    height: 33,
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
    minHeight: 28,
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
    backgroundColor: colors.background,
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
    borderBottomColor: colors.border,
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

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(15,23,42,0.60)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  modalCard: {
    width: '100%',
    maxWidth: 580,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 22,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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

  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 3,
  },

  closeButton: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
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
    minHeight: 44,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    paddingHorizontal: 12,
    color: colors.text,
    fontSize: 11,
  },

  textArea: {
    minHeight: 75,
    paddingTop: 11,
    textAlignVertical: 'top',
  },

  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  formHalf: {
    width: '48.5%',
  },

  modalActions: {
    flexDirection: 'row',
    marginTop: 20,
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
    backgroundColor: colors.primary,
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

  disabled: {
    opacity: 0.55,
  },
});
