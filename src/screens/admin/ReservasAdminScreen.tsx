import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Home,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react-native';

import { colors } from '../../theme/theme';
import { supabase } from '../../services/supabase';

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
  return `${dia}/${mes}/${ano}`;
}

function formatarHora(hora: string | null) {
  if (!hora) return '--:--';
  return hora.slice(0, 5);
}

export default function ReservasAdminScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [espacos, setEspacos] = useState<Espaco[]>([]);
  const [reservas, setReservas] = useState<ReservaTela[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [alterandoReserva, setAlterandoReserva] = useState<string | null>(null);
  const [excluindoItem, setExcluindoItem] = useState<string | null>(null);

  const [modalNovoEspaco, setModalNovoEspaco] = useState(false);
  const [salvandoEspaco, setSalvandoEspaco] = useState(false);
  const [nomeEspaco, setNomeEspaco] = useState('');
  const [descricaoEspaco, setDescricaoEspaco] = useState('');
  const [capacidadeEspaco, setCapacidadeEspaco] = useState('');
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('22:00');

  const carregarDados = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setCarregando(true);

      const { data: espacosData, error: espacosError } = await supabase
        .from('espacos_reserva')
        .select(
          'id, nome, descricao, capacidade, horario_inicio, horario_fim, ativo'
        )
        .order('nome', { ascending: true });

      if (espacosError) throw espacosError;

      const { data: reservasData, error: reservasError } = await supabase
        .from('reservas')
        .select(
          'id, morador_id, espaco_id, data, horario_inicio, horario_fim, observacao, status, criado_em'
        )
        .order('criado_em', { ascending: false });

      if (reservasError) throw reservasError;

      const listaEspacos = (espacosData ?? []) as Espaco[];
      const listaReservas = (reservasData ?? []) as ReservaBanco[];

      const moradorIds = [
        ...new Set(listaReservas.map((item) => item.morador_id)),
      ];

      let nomesMoradores: Record<string, string> = {};

      if (moradorIds.length > 0) {
        const { data: perfisData, error: perfisError } = await supabase
          .from('perfis')
          .select('id, nome')
          .in('id', moradorIds);

        if (perfisError) {
          console.warn(
            'Não foi possível carregar os nomes dos moradores:',
            perfisError
          );
        } else {
          nomesMoradores = Object.fromEntries(
            (perfisData ?? []).map((perfil: { id: string; nome: string }) => [
              perfil.id,
              perfil.nome,
            ])
          );
        }
      }

      const nomesEspacos = Object.fromEntries(
        listaEspacos.map((espaco) => [espaco.id, espaco.nome])
      );

      const reservasFormatadas: ReservaTela[] = listaReservas.map(
        (reserva) => ({
          ...reserva,
          morador: nomesMoradores[reserva.morador_id] ?? 'Morador',
          espaco: nomesEspacos[reserva.espaco_id] ?? 'Espaço',
        })
      );

      setEspacos(listaEspacos);
      setReservas(reservasFormatadas);
    } catch (error: any) {
      console.error('Erro ao carregar reservas:', error);

      Alert.alert(
        'Erro ao carregar',
        error?.message ||
          'Não foi possível carregar os dados das reservas.'
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  useFocusEffect(
    useCallback(() => {
      carregarDados(true);
    }, [carregarDados])
  );

  async function atualizarTela() {
    setAtualizando(true);
    await carregarDados(true);
  }

  function validarHorario(valor: string) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(valor);
  }

  function limparFormulario() {
    setNomeEspaco('');
    setDescricaoEspaco('');
    setCapacidadeEspaco('');
    setHoraInicio('08:00');
    setHoraFim('22:00');
  }

  async function cadastrarEspaco() {
    const nome = nomeEspaco.trim();
    const descricao = descricaoEspaco.trim();
    const capacidade = capacidadeEspaco.trim();

    if (!nome) {
      Alert.alert('Campo obrigatório', 'Digite o nome do espaço.');
      return;
    }

    if (!validarHorario(horaInicio) || !validarHorario(horaFim)) {
      Alert.alert(
        'Horário inválido',
        'Use o formato HH:MM. Exemplo: 08:00 ou 22:00.'
      );
      return;
    }

    if (horaInicio >= horaFim) {
      Alert.alert(
        'Horário inválido',
        'O horário final precisa ser maior que o horário inicial.'
      );
      return;
    }

    if (capacidade && (!/^\d+$/.test(capacidade) || Number(capacidade) <= 0)) {
      Alert.alert(
        'Capacidade inválida',
        'Informe apenas um número maior que zero.'
      );
      return;
    }

    try {
      setSalvandoEspaco(true);

      const { error } = await supabase.from('espacos_reserva').insert({
        nome,
        descricao: descricao || null,
        capacidade: capacidade ? Number(capacidade) : null,
        horario_inicio: horaInicio,
        horario_fim: horaFim,
        ativo: true,
      });

      if (error) throw error;

      setModalNovoEspaco(false);
      limparFormulario();
      await carregarDados(true);

      Alert.alert('Sucesso', 'Espaço cadastrado com sucesso.');
    } catch (error: any) {
      console.error('Erro ao cadastrar espaço:', error);

      Alert.alert(
        'Erro no cadastro',
        error?.message || 'Não foi possível cadastrar o espaço.'
      );
    } finally {
      setSalvandoEspaco(false);
    }
  }

  function confirmarExcluirEspaco(espaco: Espaco) {
    Alert.alert(
      'Excluir espaço',
      `Deseja realmente excluir "${espaco.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => excluirEspaco(espaco.id),
        },
      ]
    );
  }

  async function excluirEspaco(espacoId: string) {
    try {
      setExcluindoItem(`espaco-${espacoId}`);
      const { error } = await supabase
        .from('espacos_reserva')
        .delete()
        .eq('id', espacoId);
      if (error) throw error;
      await carregarDados(true);
      Alert.alert('Sucesso', 'Espaço excluído com sucesso.');
    } catch (error: any) {
      console.error('Erro ao excluir espaço:', error);
      Alert.alert(
        'Não foi possível excluir',
        error?.code === '23503'
          ? 'Este espaço possui reservas vinculadas. Exclua essas reservas primeiro.'
          : error?.message || 'Não foi possível excluir o espaço.'
      );
    } finally {
      setExcluindoItem(null);
    }
  }

  function confirmarExcluirReserva(reserva: ReservaTela) {
    Alert.alert(
      'Excluir reserva',
      `Deseja realmente excluir a reserva de ${reserva.morador} para ${reserva.espaco}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => excluirReserva(reserva.id),
        },
      ]
    );
  }

  async function excluirReserva(reservaId: string) {
    try {
      setExcluindoItem(`reserva-${reservaId}`);
      const { error } = await supabase.from('reservas').delete().eq('id', reservaId);
      if (error) throw error;
      await carregarDados(true);
      Alert.alert('Sucesso', 'Reserva excluída com sucesso.');
    } catch (error: any) {
      console.error('Erro ao excluir reserva:', error);
      Alert.alert('Erro', error?.message || 'Não foi possível excluir a reserva.');
    } finally {
      setExcluindoItem(null);
    }
  }

  function confirmarStatus(
    reserva: ReservaTela,
    status: 'aprovada' | 'recusada'
  ) {
    const acao = status === 'aprovada' ? 'Aprovar' : 'Recusar';

    Alert.alert(
      `${acao} reserva`,
      `${acao} a reserva de ${reserva.morador} para ${reserva.espaco}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: acao,
          style: status === 'recusada' ? 'destructive' : 'default',
          onPress: () => alterarStatus(reserva.id, status),
        },
      ]
    );
  }

  async function alterarStatus(
    reservaId: string,
    status: 'aprovada' | 'recusada'
  ) {
    try {
      setAlterandoReserva(reservaId);

      const { error } = await supabase
        .from('reservas')
        .update({
          status,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', reservaId);

      if (error) throw error;

      await carregarDados(true);

      Alert.alert(
        'Reserva atualizada',
        status === 'aprovada'
          ? 'A reserva foi aprovada.'
          : 'A reserva foi recusada.'
      );
    } catch (error: any) {
      console.error('Erro ao atualizar reserva:', error);

      Alert.alert(
        'Erro',
        error?.message || 'Não foi possível atualizar a reserva.'
      );
    } finally {
      setAlterandoReserva(null);
    }
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

  const pendentes = reservas.filter(
    (reserva) => reserva.status === 'pendente'
  ).length;

  const aprovadas = reservas.filter(
    (reserva) => reserva.status === 'aprovada'
  ).length;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom, 20) + 30,
          },
        ]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={atualizarTela}
          />
        }
      >
        <View
          style={[
            styles.header,
            {
              paddingTop: Math.max(insets.top, 24) + 10,
            },
          ]}
        >
          <View style={styles.headerTop}>
            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={20} color="#FFFFFF" />
            </Pressable>

            <View style={styles.brand}>
              <View style={styles.brandIcon}>
                <CalendarDays size={19} color="#FFFFFF" />
              </View>

              <Text style={styles.brandText}>Reservas</Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          <Text style={styles.headerTitle}>Gestão de reservas</Text>

          <Text style={styles.headerDescription}>
            Gerencie espaços, horários e solicitações realizadas pelos
            moradores.
          </Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.sectionTitle}>Visão geral</Text>

          <Text style={styles.sectionSubtitle}>
            Acompanhe as reservas do condomínio.
          </Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Clock size={20} color={colors.primary} />
              </View>

              <Text style={styles.summaryNumber}>
                {carregando ? '-' : pendentes}
              </Text>

              <Text style={styles.summaryLabel}>Pendentes</Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Check size={20} color={colors.primary} />
              </View>

              <Text style={styles.summaryNumber}>
                {carregando ? '-' : aprovadas}
              </Text>

              <Text style={styles.summaryLabel}>Aprovadas</Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <CalendarDays size={20} color={colors.primary} />
              </View>

              <Text style={styles.summaryNumber}>
                {carregando ? '-' : reservas.length}
              </Text>

              <Text style={styles.summaryLabel}>Total</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Espaços</Text>

              <Text style={styles.sectionSubtitle}>
                Áreas disponíveis para reserva.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.pressed,
              ]}
              onPress={() => setModalNovoEspaco(true)}
            >
              <Plus size={17} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Novo</Text>
            </Pressable>
          </View>

          {carregando ? (
            <View style={extraStyles.loadingBox}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={extraStyles.loadingText}>
                Carregando dados...
              </Text>
            </View>
          ) : espacos.length === 0 ? (
            <View style={extraStyles.emptyCard}>
              <Home size={25} color={colors.textSecondary} />
              <Text style={extraStyles.emptyTitle}>
                Nenhum espaço cadastrado
              </Text>
              <Text style={extraStyles.emptyDescription}>
                Toque em Novo para cadastrar a primeira área de reserva.
              </Text>
            </View>
          ) : (
            espacos.map((espaco) => (
              <Pressable
                key={espaco.id}
                style={({ pressed }) => [
                  styles.spaceCard,
                  pressed && styles.cardPressed,
                ]}
                onPress={() =>
                  Alert.alert(
                    espaco.nome,
                    `${espaco.descricao || 'Sem descrição'}\n\nHorário: ${formatarHora(
                      espaco.horario_inicio
                    )} às ${formatarHora(espaco.horario_fim)}${
                      espaco.capacidade
                        ? `\nCapacidade: ${espaco.capacidade} pessoas`
                        : ''
                    }`
                  )
                }
              >
                <View style={styles.spaceIcon}>
                  <Home size={23} color={colors.primary} />
                </View>

                <View style={styles.spaceContent}>
                  <Text style={styles.spaceTitle}>{espaco.nome}</Text>

                  <Text
                    style={styles.spaceDescription}
                    numberOfLines={2}
                  >
                    {espaco.descricao ||
                      `${formatarHora(
                        espaco.horario_inicio
                      )} às ${formatarHora(espaco.horario_fim)}`}
                  </Text>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    extraStyles.deleteIconButton,
                    pressed && styles.pressed,
                  ]}
                  disabled={excluindoItem === `espaco-${espaco.id}`}
                  onPress={(event) => {
                    event.stopPropagation();
                    confirmarExcluirEspaco(espaco);
                  }}
                >
                  {excluindoItem === `espaco-${espaco.id}` ? (
                    <ActivityIndicator size="small" color={colors.danger} />
                  ) : (
                    <Trash2 size={18} color={colors.danger} />
                  )}
                </Pressable>
              </Pressable>
            ))
          )}

          <View style={styles.reservationsHeader}>
            <Text style={styles.sectionTitle}>Reservas recentes</Text>

            <Text style={styles.sectionSubtitle}>
              Solicitações realizadas pelos moradores.
            </Text>
          </View>

          {!carregando && reservas.length === 0 ? (
            <View style={extraStyles.emptyCard}>
              <CalendarDays size={25} color={colors.textSecondary} />
              <Text style={extraStyles.emptyTitle}>
                Nenhuma reserva encontrada
              </Text>
              <Text style={extraStyles.emptyDescription}>
                Quando um morador solicitar uma reserva, ela aparecerá aqui.
              </Text>
            </View>
          ) : (
            reservas.map((reserva) => {
              const processando = alterandoReserva === reserva.id;

              return (
                <View key={reserva.id} style={styles.reservationCard}>
                  <View style={styles.reservationTop}>
                    <View style={styles.residentIcon}>
                      <Users size={19} color={colors.primary} />
                    </View>

                    <View style={styles.reservationInfo}>
                      <Text style={styles.residentName}>
                        {reserva.morador}
                      </Text>

                      <Text style={styles.spaceName}>
                        {reserva.espaco}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        reserva.status === 'aprovada' &&
                          styles.statusApproved,
                        (reserva.status === 'recusada' ||
                          reserva.status === 'cancelada') &&
                          styles.statusRejected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          reserva.status === 'aprovada' &&
                            styles.statusApprovedText,
                          (reserva.status === 'recusada' ||
                            reserva.status === 'cancelada') &&
                            styles.statusRejectedText,
                        ]}
                      >
                        {statusTexto(reserva.status)}
                      </Text>
                    </View>

                    <Pressable
                      style={({ pressed }) => [
                        extraStyles.deleteIconButton,
                        pressed && styles.pressed,
                      ]}
                      disabled={excluindoItem === `reserva-${reserva.id}`}
                      onPress={() => confirmarExcluirReserva(reserva)}
                    >
                      {excluindoItem === `reserva-${reserva.id}` ? (
                        <ActivityIndicator size="small" color={colors.danger} />
                      ) : (
                        <Trash2 size={17} color={colors.danger} />
                      )}
                    </Pressable>
                  </View>

                  <View style={styles.dateRow}>
                    <CalendarDays
                      size={15}
                      color={colors.textSecondary}
                    />

                    <Text style={styles.dateText}>
                      {formatarData(reserva.data)}
                    </Text>

                    <View style={styles.dateSeparator} />

                    <Clock size={15} color={colors.textSecondary} />

                    <Text style={styles.dateText}>
                      {formatarHora(reserva.horario_inicio)} -{' '}
                      {formatarHora(reserva.horario_fim)}
                    </Text>
                  </View>

                  {reserva.observacao ? (
                    <Text style={extraStyles.observation}>
                      {reserva.observacao}
                    </Text>
                  ) : null}

                  {reserva.status === 'pendente' ? (
                    <View style={styles.actions}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.rejectButton,
                          pressed && styles.pressed,
                          processando && extraStyles.disabled,
                        ]}
                        disabled={processando}
                        onPress={() =>
                          confirmarStatus(reserva, 'recusada')
                        }
                      >
                        {processando ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.danger}
                          />
                        ) : (
                          <X size={17} color={colors.danger} />
                        )}

                        <Text style={styles.rejectText}>Recusar</Text>
                      </Pressable>

                      <Pressable
                        style={({ pressed }) => [
                          styles.approveButton,
                          pressed && styles.pressed,
                          processando && extraStyles.disabled,
                        ]}
                        disabled={processando}
                        onPress={() =>
                          confirmarStatus(reserva, 'aprovada')
                        }
                      >
                        {processando ? (
                          <ActivityIndicator
                            size="small"
                            color="#FFFFFF"
                          />
                        ) : (
                          <Check size={17} color="#FFFFFF" />
                        )}

                        <Text style={styles.approveText}>Aprovar</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>ConectaLar</Text>

            <Text style={styles.footerText}>
              Gestão inteligente do seu condomínio.
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={modalNovoEspaco}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!salvandoEspaco) setModalNovoEspaco(false);
        }}
      >
        <View style={extraStyles.modalOverlay}>
          <View style={extraStyles.modalCard}>
            <View style={extraStyles.modalHeader}>
              <View>
                <Text style={extraStyles.modalTitle}>Novo espaço</Text>
                <Text style={extraStyles.modalSubtitle}>
                  Cadastre uma área disponível para reserva.
                </Text>
              </View>

              <Pressable
                style={extraStyles.closeButton}
                disabled={salvandoEspaco}
                onPress={() => setModalNovoEspaco(false)}
              >
                <X size={19} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={extraStyles.inputLabel}>Nome *</Text>
            <TextInput
              style={extraStyles.input}
              value={nomeEspaco}
              onChangeText={setNomeEspaco}
              placeholder="Ex.: Churrasqueira"
              placeholderTextColor={colors.textLight}
              editable={!salvandoEspaco}
            />

            <Text style={extraStyles.inputLabel}>Descrição</Text>
            <TextInput
              style={[extraStyles.input, extraStyles.textArea]}
              value={descricaoEspaco}
              onChangeText={setDescricaoEspaco}
              placeholder="Ex.: Área gourmet próxima à piscina"
              placeholderTextColor={colors.textLight}
              multiline
              editable={!salvandoEspaco}
            />

            <Text style={extraStyles.inputLabel}>Capacidade</Text>
            <TextInput
              style={extraStyles.input}
              value={capacidadeEspaco}
              onChangeText={setCapacidadeEspaco}
              placeholder="Ex.: 30"
              placeholderTextColor={colors.textLight}
              keyboardType="number-pad"
              editable={!salvandoEspaco}
            />

            <View style={extraStyles.timeRow}>
              <View style={extraStyles.timeField}>
                <Text style={extraStyles.inputLabel}>Início *</Text>
                <TextInput
                  style={extraStyles.input}
                  value={horaInicio}
                  onChangeText={setHoraInicio}
                  placeholder="08:00"
                  placeholderTextColor={colors.textLight}
                  maxLength={5}
                  editable={!salvandoEspaco}
                />
              </View>

              <View style={extraStyles.timeField}>
                <Text style={extraStyles.inputLabel}>Fim *</Text>
                <TextInput
                  style={extraStyles.input}
                  value={horaFim}
                  onChangeText={setHoraFim}
                  placeholder="22:00"
                  placeholderTextColor={colors.textLight}
                  maxLength={5}
                  editable={!salvandoEspaco}
                />
              </View>
            </View>

            <View style={extraStyles.modalActions}>
              <Pressable
                style={extraStyles.cancelButton}
                disabled={salvandoEspaco}
                onPress={() => setModalNovoEspaco(false)}
              >
                <Text style={extraStyles.cancelButtonText}>Cancelar</Text>
              </Pressable>

              <Pressable
                style={[
                  extraStyles.saveButton,
                  salvandoEspaco && extraStyles.disabled,
                ]}
                disabled={salvandoEspaco}
                onPress={cadastrarEspaco}
              >
                {salvandoEspaco ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Plus size={17} color="#FFFFFF" />
                )}

                <Text style={extraStyles.saveButtonText}>
                  {salvandoEspaco ? 'Salvando...' : 'Cadastrar'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    flexGrow: 1,
  },

  header: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 20,
    paddingBottom: 25,

    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 13,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      'rgba(255,255,255,0.10)',
  },

  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  brandIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,

    backgroundColor: colors.primary,

    alignItems: 'center',
    justifyContent: 'center',
  },

  brandText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },

  headerSpacer: {
    width: 40,
  },

  headerTitle: {
    color: '#FFFFFF',

    fontSize: 25,
    fontWeight: '800',

    marginTop: 23,
  },

  headerDescription: {
    color: '#CBD5E1',

    fontSize: 11,
    lineHeight: 17,

    marginTop: 6,
    maxWidth: 330,
  },

  body: {
    paddingHorizontal: 18,
    paddingTop: 20,
  },

  sectionTitle: {
    color: colors.text,

    fontSize: 18,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: colors.textSecondary,

    fontSize: 10,

    marginTop: 3,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 9,

    marginTop: 14,
  },

  summaryCard: {
    flex: 1,

    minHeight: 105,

    backgroundColor: colors.surface,

    borderWidth: 1,
    borderColor: colors.border,

    borderRadius: 17,

    padding: 11,
  },

  summaryIcon: {
    width: 34,
    height: 34,

    borderRadius: 11,

    backgroundColor:
      colors.primaryLight,

    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryNumber: {
    color: colors.text,

    fontSize: 20,
    fontWeight: '800',

    marginTop: 8,
  },

  summaryLabel: {
    color: colors.textSecondary,

    fontSize: 9,

    marginTop: 1,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    marginTop: 27,
    marginBottom: 13,
  },

  addButton: {
    height: 37,

    paddingHorizontal: 12,

    borderRadius: 12,

    backgroundColor: colors.primary,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 5,
  },

  addButtonText: {
    color: '#FFFFFF',

    fontSize: 10,
    fontWeight: '800',
  },

  spaceCard: {
    minHeight: 70,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: colors.surface,

    borderWidth: 1,
    borderColor: colors.border,

    borderRadius: 17,

    padding: 12,

    marginBottom: 9,
  },

  spaceIcon: {
    width: 43,
    height: 43,

    borderRadius: 13,

    backgroundColor:
      colors.primaryLight,

    alignItems: 'center',
    justifyContent: 'center',
  },

  spaceContent: {
    flex: 1,
    marginLeft: 11,
  },

  spaceTitle: {
    color: colors.text,

    fontSize: 13,
    fontWeight: '800',
  },

  spaceDescription: {
    color: colors.textSecondary,

    fontSize: 9,

    marginTop: 3,
  },

  reservationsHeader: {
    marginTop: 25,
    marginBottom: 13,
  },

  reservationCard: {
    backgroundColor: colors.surface,

    borderWidth: 1,
    borderColor: colors.border,

    borderRadius: 18,

    padding: 13,

    marginBottom: 11,
  },

  reservationTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  residentIcon: {
    width: 39,
    height: 39,

    borderRadius: 12,

    backgroundColor:
      colors.primaryLight,

    alignItems: 'center',
    justifyContent: 'center',
  },

  reservationInfo: {
    flex: 1,
    marginLeft: 10,
  },

  residentName: {
    color: colors.text,

    fontSize: 12,
    fontWeight: '800',
  },

  spaceName: {
    color: colors.textSecondary,

    fontSize: 9,

    marginTop: 2,
  },

  statusBadge: {
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

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 13,

    paddingTop: 11,

    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  dateText: {
    color: colors.textSecondary,

    fontSize: 10,

    marginLeft: 5,
  },

  dateSeparator: {
    width: 1,
    height: 13,

    backgroundColor: colors.border,

    marginHorizontal: 10,
  },

  actions: {
    flexDirection: 'row',

    gap: 8,

    marginTop: 12,
  },

  rejectButton: {
    flex: 1,
    height: 39,

    borderRadius: 12,

    backgroundColor:
      colors.dangerLight,

    borderWidth: 1,
    borderColor: '#FECACA',

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 5,
  },

  rejectText: {
    color: colors.danger,

    fontSize: 10,
    fontWeight: '800',
  },

  approveButton: {
    flex: 1,
    height: 39,

    borderRadius: 12,

    backgroundColor: colors.primary,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 5,
  },

  approveText: {
    color: '#FFFFFF',

    fontSize: 10,
    fontWeight: '800',
  },

  cardPressed: {
    opacity: 0.72,

    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  pressed: {
    opacity: 0.72,
  },

  footer: {
    alignItems: 'center',

    paddingTop: 17,
    paddingBottom: 5,
  },

  footerBrand: {
    color: colors.primaryDark,

    fontSize: 12,
    fontWeight: '800',
  },

  footerText: {
    color: colors.textLight,

    fontSize: 9,

    marginTop: 2,
  },
});

const extraStyles = StyleSheet.create({
  deleteIconButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  loadingBox: {
    minHeight: 90,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 10,
  },

  emptyCard: {
    minHeight: 110,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    marginBottom: 10,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
  },

  emptyDescription: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 4,
  },

  observation: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 10,
  },

  disabled: {
    opacity: 0.55,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },

  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  modalTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
  },

  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 3,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  inputLabel: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 8,
  },

  input: {
    minHeight: 45,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    color: colors.text,
    fontSize: 12,
  },

  textArea: {
    minHeight: 72,
    paddingTop: 12,
    textAlignVertical: 'top',
  },

  timeRow: {
    flexDirection: 'row',
    gap: 10,
  },

  timeField: {
    flex: 1,
  },

  modalActions: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 20,
  },

  cancelButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },

  saveButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
