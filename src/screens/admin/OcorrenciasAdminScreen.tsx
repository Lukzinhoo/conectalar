import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

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

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Home,
  MapPin,
  MessageSquareText,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react-native';

import { colors } from '../../theme/theme';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { supabase } from '../../services/supabase';

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'OcorrenciasAdmin'
>;

type Categoria =
  | 'manutencao'
  | 'barulho'
  | 'limpeza'
  | 'seguranca'
  | 'area_comum'
  | 'outro';

type Prioridade =
  | 'normal'
  | 'importante'
  | 'urgente';

type Status =
  | 'pendente'
  | 'em_andamento'
  | 'resolvida';

type FiltroStatus =
  | 'todas'
  | 'pendente'
  | 'em_andamento'
  | 'resolvida';

type Ocorrencia = {
  id: string;
  morador_id: string | null;
  titulo: string;
  descricao: string;
  categoria: Categoria;
  local_ocorrencia: string | null;
  prioridade: Prioridade;
  status: Status;
  resposta_admin: string | null;
  criado_em: string;
  atualizado_em: string;
  resolvido_em: string | null;
};

const STATUS_OPCOES: {
  valor: Status;
  label: string;
}[] = [
  {
    valor: 'pendente',
    label: 'Pendente',
  },
  {
    valor: 'em_andamento',
    label: 'Em andamento',
  },
  {
    valor: 'resolvida',
    label: 'Resolvida',
  },
];

export default function OcorrenciasAdminScreen() {
  const navigation =
    useNavigation<NavigationProp>();

  const insets = useSafeAreaInsets();

  const [ocorrencias, setOcorrencias] = useState<
    Ocorrencia[]
  >([]);

  const [carregando, setCarregando] =
    useState(true);

  const [atualizando, setAtualizando] =
    useState(false);

  const [salvando, setSalvando] =
    useState(false);

  const [excluindo, setExcluindo] =
    useState(false);

  const [filtro, setFiltro] =
    useState<FiltroStatus>('todas');

  const [ocorrenciaSelecionada, setOcorrenciaSelecionada] =
    useState<Ocorrencia | null>(null);

  const [modalVisivel, setModalVisivel] =
    useState(false);

  const [statusSelecionado, setStatusSelecionado] =
    useState<Status>('pendente');

  const [respostaAdmin, setRespostaAdmin] =
    useState('');

  const [statusAberto, setStatusAberto] =
    useState(false);

  const carregarOcorrencias = useCallback(
    async (modoAtualizacao = false) => {
      try {
        if (modoAtualizacao) {
          setAtualizando(true);
        } else {
          setCarregando(true);
        }

        const { data, error } = await supabase
          .from('ocorrencias')
          .select(
            `
              id,
              morador_id,
              titulo,
              descricao,
              categoria,
              local_ocorrencia,
              prioridade,
              status,
              resposta_admin,
              criado_em,
              atualizado_em,
              resolvido_em
            `
          )
          .order('criado_em', {
            ascending: false,
          });

        if (error) {
          throw error;
        }

        setOcorrencias(
          (data ?? []) as Ocorrencia[]
        );
      } catch (error: any) {
        console.error(
          'Erro ao carregar ocorrências:',
          error
        );

        Alert.alert(
          'Erro',
          error?.message ||
            'Não foi possível carregar as ocorrências.'
        );
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    []
  );

  useEffect(() => {
    carregarOcorrencias();
  }, [carregarOcorrencias]);

  const total = ocorrencias.length;

  const pendentes = ocorrencias.filter(
    item => item.status === 'pendente'
  ).length;

  const emAndamento = ocorrencias.filter(
    item => item.status === 'em_andamento'
  ).length;

  const resolvidas = ocorrencias.filter(
    item => item.status === 'resolvida'
  ).length;

  const ocorrenciasFiltradas = useMemo(() => {
    if (filtro === 'todas') {
      return ocorrencias;
    }

    return ocorrencias.filter(
      item => item.status === filtro
    );
  }, [ocorrencias, filtro]);

  function abrirOcorrencia(
    ocorrencia: Ocorrencia
  ) {
    setOcorrenciaSelecionada(ocorrencia);

    setStatusSelecionado(
      ocorrencia.status
    );

    setRespostaAdmin(
      ocorrencia.resposta_admin ?? ''
    );

    setStatusAberto(false);
    setModalVisivel(true);
  }

  function fecharModal() {
    if (salvando || excluindo) {
      return;
    }

    setModalVisivel(false);
    setStatusAberto(false);
    setOcorrenciaSelecionada(null);
    setRespostaAdmin('');
  }

  async function salvarAlteracoes() {
    if (!ocorrenciaSelecionada) {
      return;
    }

    try {
      setSalvando(true);

      const agora =
        new Date().toISOString();

      const resolvidoEm =
        statusSelecionado === 'resolvida'
          ? ocorrenciaSelecionada.resolvido_em ??
            agora
          : null;

      const { error } = await supabase
        .from('ocorrencias')
        .update({
          status: statusSelecionado,
          resposta_admin:
            respostaAdmin.trim() || null,
          atualizado_em: agora,
          resolvido_em: resolvidoEm,
        })
        .eq(
          'id',
          ocorrenciaSelecionada.id
        );

      if (error) {
        throw error;
      }

      Alert.alert(
        'Sucesso',
        'Ocorrência atualizada com sucesso.'
      );

      fecharModal();
      await carregarOcorrencias(true);
    } catch (error: any) {
      console.error(
        'Erro ao atualizar ocorrência:',
        error
      );

      Alert.alert(
        'Erro',
        error?.message ||
          'Não foi possível atualizar a ocorrência.'
      );
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusao() {
    if (!ocorrenciaSelecionada) {
      return;
    }

    Alert.alert(
      'Excluir ocorrência',
      'Deseja realmente excluir esta ocorrência? Essa ação não poderá ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: excluirOcorrencia,
        },
      ]
    );
  }

  async function excluirOcorrencia() {
    if (!ocorrenciaSelecionada) {
      return;
    }

    try {
      setExcluindo(true);

      const { error } = await supabase
        .from('ocorrencias')
        .delete()
        .eq(
          'id',
          ocorrenciaSelecionada.id
        );

      if (error) {
        throw error;
      }

      setModalVisivel(false);
      setOcorrenciaSelecionada(null);

      Alert.alert(
        'Excluída',
        'Ocorrência excluída com sucesso.'
      );

      await carregarOcorrencias(true);
    } catch (error: any) {
      console.error(
        'Erro ao excluir ocorrência:',
        error
      );

      Alert.alert(
        'Erro',
        error?.message ||
          'Não foi possível excluir a ocorrência.'
      );
    } finally {
      setExcluindo(false);
    }
  }

  function formatarData(
    valor: string | null
  ) {
    if (!valor) {
      return '-';
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return '-';
    }

    return data.toLocaleString(
      'pt-BR',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  }

  function categoriaLabel(
    categoria: Categoria
  ) {
    switch (categoria) {
      case 'manutencao':
        return 'Manutenção';

      case 'barulho':
        return 'Barulho';

      case 'limpeza':
        return 'Limpeza';

      case 'seguranca':
        return 'Segurança';

      case 'area_comum':
        return 'Área comum';

      default:
        return 'Outro';
    }
  }

  function prioridadeLabel(
    prioridade: Prioridade
  ) {
    switch (prioridade) {
      case 'importante':
        return 'Importante';

      case 'urgente':
        return 'Urgente';

      default:
        return 'Normal';
    }
  }

  function statusLabel(
    status: Status
  ) {
    switch (status) {
      case 'em_andamento':
        return 'Em andamento';

      case 'resolvida':
        return 'Resolvida';

      default:
        return 'Pendente';
    }
  }

  function statusStyle(
    status: Status
  ) {
    switch (status) {
      case 'resolvida':
        return {
          backgroundColor: '#DCFCE7',
          color: '#166534',
        };

      case 'em_andamento':
        return {
          backgroundColor: '#DBEAFE',
          color: '#1D4ED8',
        };

      default:
        return {
          backgroundColor: '#FEF3C7',
          color: '#92400E',
        };
    }
  }

  function prioridadeStyle(
    prioridade: Prioridade
  ) {
    switch (prioridade) {
      case 'urgente':
        return {
          backgroundColor: '#FEE2E2',
          color: '#B91C1C',
        };

      case 'importante':
        return {
          backgroundColor: '#FFEDD5',
          color: '#C2410C',
        };

      default:
        return {
          backgroundColor: '#F1F5F9',
          color: '#475569',
        };
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              Math.max(
                insets.bottom,
                20
              ) + 25,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() =>
              carregarOcorrencias(true)
            }
          />
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
          <View style={styles.headerTop}>
            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                pressed &&
                  styles.headerPressed,
              ]}
              onPress={() =>
                navigation.goBack()
              }
            >
              <ArrowLeft
                size={20}
                color="#FFFFFF"
              />
            </Pressable>

            <View style={styles.brandRow}>
              <View
                style={styles.brandIcon}
              >
                <Home
                  size={18}
                  color="#FFFFFF"
                  strokeWidth={2.5}
                />
              </View>

              <Text style={styles.brand}>
                ConectaLar
              </Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          <Text style={styles.headerTitle}>
            Ocorrências
          </Text>

          <Text
            style={styles.headerDescription}
          >
            Acompanhe solicitações dos
            moradores, responda e atualize
            o andamento.
          </Text>
        </View>

        {/* CONTEÚDO */}
        <View style={styles.body}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Visão geral
              </Text>

              <Text
                style={styles.sectionSubtitle}
              >
                Acompanhe as solicitações
                recebidas.
              </Text>
            </View>
          </View>

          {/* CONTADORES */}
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <View
                style={styles.summaryIcon}
              >
                <Bell
                  size={19}
                  color={colors.primary}
                />
              </View>

              <Text
                style={styles.summaryNumber}
              >
                {total}
              </Text>

              <Text
                style={styles.summaryLabel}
              >
                Total
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <View
                style={[
                  styles.summaryIcon,
                  {
                    backgroundColor:
                      '#FEF3C7',
                  },
                ]}
              >
                <Clock3
                  size={19}
                  color="#92400E"
                />
              </View>

              <Text
                style={styles.summaryNumber}
              >
                {pendentes}
              </Text>

              <Text
                style={styles.summaryLabel}
              >
                Pendentes
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <View
                style={[
                  styles.summaryIcon,
                  {
                    backgroundColor:
                      '#DBEAFE',
                  },
                ]}
              >
                <MessageSquareText
                  size={19}
                  color="#1D4ED8"
                />
              </View>

              <Text
                style={styles.summaryNumber}
              >
                {emAndamento}
              </Text>

              <Text
                style={styles.summaryLabel}
              >
                Em andamento
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <View
                style={[
                  styles.summaryIcon,
                  {
                    backgroundColor:
                      '#DCFCE7',
                  },
                ]}
              >
                <CheckCircle2
                  size={19}
                  color="#166534"
                />
              </View>

              <Text
                style={styles.summaryNumber}
              >
                {resolvidas}
              </Text>

              <Text
                style={styles.summaryLabel}
              >
                Resolvidas
              </Text>
            </View>
          </View>

          {/* FILTROS */}
          <View style={styles.listHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Solicitações
              </Text>

              <Text
                style={styles.sectionSubtitle}
              >
                {ocorrenciasFiltradas.length}{' '}
                ocorrência(s)
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.filtersContent
            }
          >
            <FilterButton
              label="Todas"
              ativo={filtro === 'todas'}
              onPress={() =>
                setFiltro('todas')
              }
            />

            <FilterButton
              label="Pendentes"
              ativo={
                filtro === 'pendente'
              }
              onPress={() =>
                setFiltro('pendente')
              }
            />

            <FilterButton
              label="Em andamento"
              ativo={
                filtro ===
                'em_andamento'
              }
              onPress={() =>
                setFiltro(
                  'em_andamento'
                )
              }
            />

            <FilterButton
              label="Resolvidas"
              ativo={
                filtro === 'resolvida'
              }
              onPress={() =>
                setFiltro('resolvida')
              }
            />
          </ScrollView>

          {/* LISTA */}
          {carregando ? (
            <View
              style={styles.loadingContainer}
            >
              <ActivityIndicator
                size="small"
                color={colors.primary}
              />

              <Text style={styles.loadingText}>
                Carregando ocorrências...
              </Text>
            </View>
          ) : ocorrenciasFiltradas.length ===
            0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Bell
                  size={25}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.emptyTitle}>
                Nenhuma ocorrência
              </Text>

              <Text
                style={styles.emptyDescription}
              >
                Não existem ocorrências
                neste filtro.
              </Text>
            </View>
          ) : (
            ocorrenciasFiltradas.map(
              ocorrencia => {
                const estiloStatus =
                  statusStyle(
                    ocorrencia.status
                  );

                const estiloPrioridade =
                  prioridadeStyle(
                    ocorrencia.prioridade
                  );

                return (
                  <Pressable
                    key={ocorrencia.id}
                    style={({ pressed }) => [
                      styles.ocorrenciaCard,
                      pressed &&
                        styles.cardPressed,
                    ]}
                    onPress={() =>
                      abrirOcorrencia(
                        ocorrencia
                      )
                    }
                  >
                    <View
                      style={
                        styles.ocorrenciaTop
                      }
                    >
                      <View
                        style={
                          styles.ocorrenciaIcon
                        }
                      >
                        <ShieldAlert
                          size={20}
                          color={
                            colors.primary
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.ocorrenciaTitleArea
                        }
                      >
                        <Text
                          style={
                            styles.ocorrenciaTitle
                          }
                          numberOfLines={1}
                        >
                          {
                            ocorrencia.titulo
                          }
                        </Text>

                        <Text
                          style={
                            styles.ocorrenciaDate
                          }
                        >
                          {formatarData(
                            ocorrencia.criado_em
                          )}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={
                        styles.ocorrenciaDescription
                      }
                      numberOfLines={3}
                    >
                      {
                        ocorrencia.descricao
                      }
                    </Text>

                    {ocorrencia.local_ocorrencia ? (
                      <View
                        style={
                          styles.locationRow
                        }
                      >
                        <MapPin
                          size={13}
                          color={
                            colors.textSecondary
                          }
                        />

                        <Text
                          style={
                            styles.locationText
                          }
                          numberOfLines={1}
                        >
                          {
                            ocorrencia.local_ocorrencia
                          }
                        </Text>
                      </View>
                    ) : null}

                    <View
                      style={styles.tagsRow}
                    >
                      <View
                        style={
                          styles.categoryTag
                        }
                      >
                        <Text
                          style={
                            styles.categoryTagText
                          }
                        >
                          {categoriaLabel(
                            ocorrencia.categoria
                          )}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.tag,
                          {
                            backgroundColor:
                              estiloPrioridade.backgroundColor,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.tagText,
                            {
                              color:
                                estiloPrioridade.color,
                            },
                          ]}
                        >
                          {prioridadeLabel(
                            ocorrencia.prioridade
                          )}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.tag,
                          {
                            backgroundColor:
                              estiloStatus.backgroundColor,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.tagText,
                            {
                              color:
                                estiloStatus.color,
                            },
                          ]}
                        >
                          {statusLabel(
                            ocorrencia.status
                          )}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={
                        styles.cardFooter
                      }
                    >
                      <Text
                        style={
                          styles.openText
                        }
                      >
                        Ver detalhes
                      </Text>

                      <MessageSquareText
                        size={16}
                        color={
                          colors.primary
                        }
                      />
                    </View>
                  </Pressable>
                );
              }
            )
          )}

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>
              ConectaLar
            </Text>

            <Text style={styles.footerText}>
              Seu condomínio mais conectado.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* MODAL */}
      <Modal
        visible={modalVisivel}
        transparent
        animationType="fade"
        onRequestClose={fecharModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleArea}>
                <Text style={styles.modalLabel}>
                  OCORRÊNCIA
                </Text>

                <Text
                  style={styles.modalTitle}
                  numberOfLines={2}
                >
                  {ocorrenciaSelecionada?.titulo}
                </Text>
              </View>

              <Pressable
                style={styles.closeButton}
                onPress={fecharModal}
              >
                <X
                  size={19}
                  color={colors.text}
                />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={
                false
              }
            >
              {ocorrenciaSelecionada ? (
                <>
                  <Text
                    style={
                      styles.modalDescription
                    }
                  >
                    {
                      ocorrenciaSelecionada.descricao
                    }
                  </Text>

                  <View
                    style={styles.infoGrid}
                  >
                    <InfoItem
                      label="Categoria"
                      value={categoriaLabel(
                        ocorrenciaSelecionada.categoria
                      )}
                    />

                    <InfoItem
                      label="Prioridade"
                      value={prioridadeLabel(
                        ocorrenciaSelecionada.prioridade
                      )}
                    />

                    <InfoItem
                      label="Local"
                      value={
                        ocorrenciaSelecionada.local_ocorrencia ||
                        'Não informado'
                      }
                    />

                    <InfoItem
                      label="Criada em"
                      value={formatarData(
                        ocorrenciaSelecionada.criado_em
                      )}
                    />
                  </View>

                  <Text style={styles.inputLabel}>
                    STATUS
                  </Text>

                  <Pressable
                    style={styles.selectButton}
                    onPress={() =>
                      setStatusAberto(
                        !statusAberto
                      )
                    }
                  >
                    <Text
                      style={
                        styles.selectButtonText
                      }
                    >
                      {statusLabel(
                        statusSelecionado
                      )}
                    </Text>

                    <ChevronDown
                      size={18}
                      color={
                        colors.textSecondary
                      }
                    />
                  </Pressable>

                  {statusAberto ? (
                    <View
                      style={
                        styles.selectOptions
                      }
                    >
                      {STATUS_OPCOES.map(
                        opcao => (
                          <Pressable
                            key={opcao.valor}
                            style={[
                              styles.selectOption,
                              statusSelecionado ===
                                opcao.valor &&
                                styles.selectOptionActive,
                            ]}
                            onPress={() => {
                              setStatusSelecionado(
                                opcao.valor
                              );
                              setStatusAberto(
                                false
                              );
                            }}
                          >
                            <Text
                              style={[
                                styles.selectOptionText,
                                statusSelecionado ===
                                  opcao.valor &&
                                  styles.selectOptionTextActive,
                              ]}
                            >
                              {opcao.label}
                            </Text>
                          </Pressable>
                        )
                      )}
                    </View>
                  ) : null}

                  <Text style={styles.inputLabel}>
                    RESPOSTA DA ADMINISTRAÇÃO
                  </Text>

                  <TextInput
                    style={styles.responseInput}
                    value={respostaAdmin}
                    onChangeText={
                      setRespostaAdmin
                    }
                    placeholder="Digite uma resposta para o morador..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    textAlignVertical="top"
                    maxLength={1500}
                  />

                  <Text
                    style={styles.characterCount}
                  >
                    {respostaAdmin.length}/1500
                  </Text>
                </>
              ) : null}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed &&
                    styles.buttonPressed,
                ]}
                onPress={
                  confirmarExclusao
                }
                disabled={
                  salvando || excluindo
                }
              >
                {excluindo ? (
                  <ActivityIndicator
                    size="small"
                    color="#DC2626"
                  />
                ) : (
                  <Trash2
                    size={17}
                    color="#DC2626"
                  />
                )}
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed &&
                    styles.buttonPressed,
                  (salvando ||
                    excluindo) &&
                    styles.buttonDisabled,
                ]}
                onPress={
                  salvarAlteracoes
                }
                disabled={
                  salvando || excluindo
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
                        styles.saveButtonText
                      }
                    >
                      Salvar alterações
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

type FilterButtonProps = {
  label: string;
  ativo: boolean;
  onPress: () => void;
};

function FilterButton({
  label,
  ativo,
  onPress,
}: FilterButtonProps) {
  return (
    <Pressable
      style={[
        styles.filterButton,
        ativo && styles.filterButtonActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterButtonText,
          ativo &&
            styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type InfoItemProps = {
  label: string;
  value: string;
};

function InfoItem({
  label,
  value,
}: InfoItemProps) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value}
      </Text>
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
    backgroundColor:
      'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerPressed: {
    opacity: 0.7,
  },

  brandRow: {
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

  brand: {
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

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 14,
  },

  summaryCard: {
    width: '48.5%',
    minHeight: 105,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    padding: 13,
    marginBottom: 10,
  },

  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryNumber: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 8,
  },

  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },

  listHeader: {
    marginTop: 14,
  },

  filtersContent: {
    paddingTop: 12,
    paddingBottom: 13,
  },

  filterButton: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 11,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  filterButtonText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },

  filterButtonTextActive: {
    color: '#FFFFFF',
  },

  loadingContainer: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 9,
  },

  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 25,
    alignItems: 'center',
  },

  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 11,
  },

  emptyDescription: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },

  ocorrenciaCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 11,
  },

  cardPressed: {
    opacity: 0.75,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  ocorrenciaTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  ocorrenciaIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  ocorrenciaTitleArea: {
    flex: 1,
    marginLeft: 11,
  },

  ocorrenciaTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },

  ocorrenciaDate: {
    color: colors.textLight,
    fontSize: 9,
    marginTop: 3,
  },

  ocorrenciaDescription: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 11,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
  },

  locationText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 9,
    marginLeft: 5,
  },

  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 11,
  },

  categoryTag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    marginRight: 6,
    marginBottom: 5,
  },

  categoryTagText: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: '800',
  },

  tag: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    marginRight: 6,
    marginBottom: 5,
  },

  tagText: {
    fontSize: 8,
    fontWeight: '800',
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    marginTop: 6,
  },

  openText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },

  footer: {
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 4,
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

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    padding: 18,
  },

  modalCard: {
    maxHeight: '88%',
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 17,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  modalTitleArea: {
    flex: 1,
    paddingRight: 12,
  },

  modalLabel: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  modalTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
    marginTop: 3,
  },

  closeButton: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalScroll: {
    marginTop: 13,
  },

  modalDescription: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
  },

  infoItem: {
    width: '48.5%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },

  infoLabel: {
    color: colors.textLight,
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  infoValue: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },

  inputLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 13,
    marginBottom: 6,
  },

  selectButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },

  selectButtonText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },

  selectOptions: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginTop: 5,
    overflow: 'hidden',
  },

  selectOption: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  selectOptionActive: {
    backgroundColor: colors.primaryLight,
  },

  selectOptionText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '600',
  },

  selectOptionTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },

  responseInput: {
    minHeight: 105,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: colors.text,
    fontSize: 11,
    lineHeight: 17,
  },

  characterCount: {
    color: colors.textLight,
    fontSize: 8,
    textAlign: 'right',
    marginTop: 4,
  },

  modalActions: {
    flexDirection: 'row',
    marginTop: 15,
  },

  deleteButton: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  saveButton: {
    flex: 1,
    height: 46,
    borderRadius: 13,
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

  buttonPressed: {
    opacity: 0.75,
  },

  buttonDisabled: {
    opacity: 0.6,
  },
});