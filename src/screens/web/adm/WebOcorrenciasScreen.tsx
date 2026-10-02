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
  View,
} from 'react-native';

import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock3,
  MapPin,
  MessageSquareText,
  RefreshCw,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react-native';

import { colors } from '../../../theme/theme';
import { typography } from '../../../theme/typography';
import { supabase } from '../../../services/supabase';
import WebSidebar from '../../../components/WebSidebar';

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

export default function WebOcorrenciasScreen() {
  const [ocorrencias, setOcorrencias] =
    useState<Ocorrencia[]>([]);

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

  const [
    ocorrenciaSelecionada,
    setOcorrenciaSelecionada,
  ] = useState<Ocorrencia | null>(null);

  const [modalVisivel, setModalVisivel] =
    useState(false);

  const [
    statusSelecionado,
    setStatusSelecionado,
  ] = useState<Status>('pendente');

  const [respostaAdmin, setRespostaAdmin] =
    useState('');

  const [statusAberto, setStatusAberto] =
    useState(false);

  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // =====================================================
  // CARREGAR OCORRÊNCIAS
  // =====================================================

  const carregarOcorrencias = useCallback(
    async (modoAtualizacao = false) => {
      try {
        setErro('');

        if (modoAtualizacao) {
          setAtualizando(true);
        } else {
          setCarregando(true);
        }

        const { data, error } = await supabase
          .from('ocorrencias')
          .select(`
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
          `)
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

        setErro(
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

  // =====================================================
  // CONTADORES
  // =====================================================

  const total = ocorrencias.length;

  const pendentes = ocorrencias.filter(
    (item) => item.status === 'pendente'
  ).length;

  const emAndamento = ocorrencias.filter(
    (item) => item.status === 'em_andamento'
  ).length;

  const resolvidas = ocorrencias.filter(
    (item) => item.status === 'resolvida'
  ).length;

  // =====================================================
  // FILTROS
  // =====================================================

  const ocorrenciasFiltradas = useMemo(() => {
    if (filtro === 'todas') {
      return ocorrencias;
    }

    return ocorrencias.filter(
      (item) => item.status === filtro
    );
  }, [ocorrencias, filtro]);

  // =====================================================
  // ABRIR OCORRÊNCIA
  // =====================================================

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
    setErro('');
    setSucesso('');
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

  // =====================================================
  // SALVAR ALTERAÇÕES
  // =====================================================

  async function salvarAlteracoes() {
    if (!ocorrenciaSelecionada) {
      return;
    }

    try {
      setSalvando(true);
      setErro('');
      setSucesso('');

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

      setModalVisivel(false);
      setOcorrenciaSelecionada(null);
      setRespostaAdmin('');

      setSucesso(
        'Ocorrência atualizada com sucesso.'
      );

      await carregarOcorrencias(true);
    } catch (error: any) {
      console.error(
        'Erro ao atualizar ocorrência:',
        error
      );

      setErro(
        error?.message ||
          'Não foi possível atualizar a ocorrência.'
      );
    } finally {
      setSalvando(false);
    }
  }

  // =====================================================
  // EXCLUIR
  // =====================================================

  async function excluirOcorrencia() {
    if (!ocorrenciaSelecionada) {
      return;
    }

    const confirmar =
      (globalThis as any).confirm;

    const confirmado =
      typeof confirmar === 'function'
        ? confirmar(
            'Deseja realmente excluir esta ocorrência? Essa ação não poderá ser desfeita.'
          )
        : true;

    if (!confirmado) {
      return;
    }

    try {
      setExcluindo(true);
      setErro('');
      setSucesso('');

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
      setRespostaAdmin('');

      setSucesso(
        'Ocorrência excluída com sucesso.'
      );

      await carregarOcorrencias(true);
    } catch (error: any) {
      console.error(
        'Erro ao excluir ocorrência:',
        error
      );

      setErro(
        error?.message ||
          'Não foi possível excluir a ocorrência.'
      );
    } finally {
      setExcluindo(false);
    }
  }

  // =====================================================
  // FORMATAR DATA
  // =====================================================

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

    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // =====================================================
  // LABELS
  // =====================================================

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

  // =====================================================
  // TELA
  // =====================================================

  return (
    <View style={styles.container}>
      <WebSidebar active="ocorrencias" />

      <ScrollView
        style={styles.main}
        contentContainerStyle={
          styles.mainContent
        }
        showsVerticalScrollIndicator={false}
      >
        {/* CABEÇALHO */}

        <View style={styles.topHeader}>
          <View style={styles.headerTextArea}>
            <Text style={styles.pageTitle}>
              Ocorrências
            </Text>

            <Text
              style={styles.pageSubtitle}
            >
              Acompanhe solicitações dos moradores,
              responda e atualize o andamento.
            </Text>
          </View>

          <Pressable
            style={styles.refreshButton}
            onPress={() =>
              carregarOcorrencias(true)
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
        </View>

        {/* ERRO */}

        {erro ? (
          <View style={styles.errorBox}>
            <Text
              style={styles.errorText}
            >
              {erro}
            </Text>
          </View>
        ) : null}

        {/* SUCESSO */}

        {sucesso ? (
          <View style={styles.successBox}>
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
            valor={total}
            icon={
              <Bell
                size={21}
                color={colors.primary}
              />
            }
            iconBackground={
              colors.primaryLight
            }
          />

          <SummaryCard
            titulo="Pendentes"
            valor={pendentes}
            icon={
              <Clock3
                size={21}
                color="#92400E"
              />
            }
            iconBackground="#FEF3C7"
          />

          <SummaryCard
            titulo="Em andamento"
            valor={emAndamento}
            icon={
              <MessageSquareText
                size={21}
                color="#1D4ED8"
              />
            }
            iconBackground="#DBEAFE"
          />

          <SummaryCard
            titulo="Resolvidas"
            valor={resolvidas}
            icon={
              <CheckCircle2
                size={21}
                color="#166534"
              />
            }
            iconBackground="#DCFCE7"
          />
        </View>

        {/* LISTA */}

        <View style={styles.contentCard}>
          <View style={styles.listHeader}>
            <View>
              <Text
                style={styles.sectionTitle}
              >
                Solicitações
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                {ocorrenciasFiltradas.length}{' '}
                ocorrência(s)
              </Text>
            </View>
          </View>

          {/* FILTROS */}

          <View style={styles.filters}>
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
          </View>

          {/* CARREGANDO */}

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
                style={styles.loadingText}
              >
                Carregando ocorrências...
              </Text>
            </View>
          ) : ocorrenciasFiltradas.length ===
            0 ? (
            <View style={styles.emptyCard}>
              <View
                style={styles.emptyIcon}
              >
                <Bell
                  size={28}
                  color={colors.primary}
                />
              </View>

              <Text
                style={styles.emptyTitle}
              >
                Nenhuma ocorrência
              </Text>

              <Text
                style={
                  styles.emptyDescription
                }
              >
                Não existem ocorrências neste
                filtro.
              </Text>
            </View>
          ) : (
            <View
              style={
                styles.ocorrenciasGrid
              }
            >
              {ocorrenciasFiltradas.map(
                (ocorrencia) => {
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
                      style={
                        styles.ocorrenciaCard
                      }
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
                            size={21}
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
                            numberOfLines={2}
                          >
                            {ocorrencia.titulo}
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
                        numberOfLines={4}
                      >
                        {ocorrencia.descricao}
                      </Text>

                      {ocorrencia.local_ocorrencia ? (
                        <View
                          style={
                            styles.locationRow
                          }
                        >
                          <MapPin
                            size={14}
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
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ================================================= */}
      {/* MODAL */}
      {/* ================================================= */}

      <Modal
        visible={modalVisivel}
        transparent
        animationType="fade"
        onRequestClose={fecharModal}
      >
        <View
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View
              style={styles.modalHeader}
            >
              <View
                style={
                  styles.modalTitleArea
                }
              >
                <Text
                  style={styles.modalLabel}
                >
                  OCORRÊNCIA
                </Text>

                <Text
                  style={styles.modalTitle}
                  numberOfLines={2}
                >
                  {
                    ocorrenciaSelecionada?.titulo
                  }
                </Text>
              </View>

              <Pressable
                style={
                  styles.closeButton
                }
                onPress={fecharModal}
              >
                <X
                  size={20}
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

                  <Text
                    style={styles.inputLabel}
                  >
                    STATUS
                  </Text>

                  <Pressable
                    style={
                      styles.selectButton
                    }
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
                        (opcao) => (
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

                  <Text
                    style={styles.inputLabel}
                  >
                    RESPOSTA DA ADMINISTRAÇÃO
                  </Text>

                  <TextInput
                    style={
                      styles.responseInput
                    }
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
                    style={
                      styles.characterCount
                    }
                  >
                    {respostaAdmin.length}/1500
                  </Text>
                </>
              ) : null}
            </ScrollView>

            <View
              style={styles.modalActions}
            >
              <Pressable
                style={
                  styles.deleteButton
                }
                onPress={
                  excluirOcorrencia
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
                  <>
                    <Trash2
                      size={17}
                      color="#DC2626"
                    />

                    <Text
                      style={
                        styles.deleteButtonText
                      }
                    >
                      Excluir
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                style={[
                  styles.saveButton,
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

// =====================================================
// BOTÃO DE FILTRO
// =====================================================

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
        ativo &&
          styles.filterButtonActive,
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

// =====================================================
// ITEM DE INFORMAÇÃO
// =====================================================

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

// =====================================================
// CARD DO RESUMO
// =====================================================

type SummaryCardProps = {
  titulo: string;
  valor: number;
  icon: React.ReactNode;
  iconBackground: string;
};

function SummaryCard({
  titulo,
  valor,
  icon,
  iconBackground,
}: SummaryCardProps) {
  return (
    <View style={styles.summaryCard}>
      <View
        style={[
          styles.summaryIcon,
          {
            backgroundColor:
              iconBackground,
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

// =====================================================
// ESTILOS
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor:
      colors.background,
  },

  main: {
    flex: 1,
  },

  mainContent: {
    padding: 30,
    paddingBottom: 50,
  },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 24,
  },

  headerTextArea: {
    flex: 1,
    paddingRight: 20,
  },

  // Usa o padrão global de título
  pageTitle: {
    ...typography.pageTitle,
    color: colors.text,
  },

  // Usa o padrão global de subtítulo
  pageSubtitle: {
    ...typography.pageSubtitle,
    color: colors.textSecondary,
    marginTop: 5,
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
  },

  refreshText: {
    ...typography.button,
    color: colors.primary,
    marginLeft: 7,
  },

  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },

  errorText: {
    ...typography.bodySmall,
    color: '#B91C1C',
    fontWeight: '600',
  },

  successBox: {
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },

  successText: {
    ...typography.bodySmall,
    color: '#15803D',
    fontWeight: '600',
  },

  summaryRow: {
    flexDirection: 'row',
    marginBottom: 22,
  },

  summaryCard: {
    flex: 1,
    minHeight: 105,
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 16,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  summaryIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  summaryNumber: {
    ...typography.statNumber,
    color: colors.text,
  },

  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  contentCard: {
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    padding: 20,
  },

  listHeader: {
    marginBottom: 13,
  },

  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text,
  },

  sectionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 3,
  },

  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 17,
  },

  filterButton: {
    minHeight: 38,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 6,
  },

  filterButtonActive: {
    backgroundColor:
      colors.primary,
    borderColor:
      colors.primary,
  },

  filterButtonText: {
    ...typography.label,
    color: colors.textSecondary,
  },

  filterButtonTextActive: {
    color: '#FFFFFF',
  },

  loadingContainer: {
    minHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 10,
  },

  emptyCard: {
    minHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 17,
    backgroundColor:
      colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    ...typography.cardTitle,
    color: colors.text,
    marginTop: 13,
  },

  emptyDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 5,
  },

  ocorrenciasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },

  ocorrenciaCard: {
    width: '48%',
    minWidth: 340,
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 16,
    margin: 6,
  },

  ocorrenciaTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  ocorrenciaIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor:
      colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  ocorrenciaTitleArea: {
    flex: 1,
    marginLeft: 11,
  },

  ocorrenciaTitle: {
    ...typography.cardTitle,
    color: colors.text,
  },

  ocorrenciaDate: {
    ...typography.caption,
    color: colors.textLight,
    marginTop: 3,
  },

  ocorrenciaDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 13,
    minHeight: 50,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  locationText: {
    ...typography.caption,
    flex: 1,
    color: colors.textSecondary,
    marginLeft: 5,
  },

  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },

  categoryTag: {
    backgroundColor:
      colors.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    marginRight: 6,
    marginBottom: 5,
  },

  categoryTagText: {
    ...typography.caption,
    color: colors.primary,
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
    ...typography.caption,
    fontWeight: '800',
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
    paddingTop: 11,
    marginTop: 8,
  },

  openText: {
    ...typography.button,
    color: colors.primary,
  },

  // ===================================================
  // MODAL
  // ===================================================

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
    maxWidth: 650,
    maxHeight: '92%',
    backgroundColor:
      colors.surface,
    borderRadius: 18,
    padding: 22,
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
    ...typography.label,
    color: colors.primary,
    letterSpacing: 1,
  },

  modalTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    marginTop: 3,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor:
      colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalScroll: {
    marginTop: 15,
  },

  modalDescription: {
    ...typography.body,
    color: colors.textSecondary,
  },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent:
      'space-between',
    marginTop: 16,
  },

  infoItem: {
    width: '48.5%',
    backgroundColor:
      colors.background,
    borderRadius: 11,
    padding: 11,
    marginBottom: 8,
  },

  infoLabel: {
    ...typography.caption,
    color: colors.textLight,
    fontWeight: '700',
  },

  infoValue: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
    marginTop: 3,
  },

  inputLabel: {
    ...typography.label,
    color: colors.textSecondary,
    letterSpacing: 0.6,
    marginTop: 14,
    marginBottom: 6,
  },

  selectButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    backgroundColor:
      colors.background,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius: 11,
    paddingHorizontal: 12,
  },

  selectButtonText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
  },

  selectOptions: {
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius: 11,
    marginTop: 5,
    overflow: 'hidden',
  },

  selectOption: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },

  selectOptionActive: {
    backgroundColor:
      colors.primaryLight,
  },

  selectOptionText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },

  selectOptionTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },

  responseInput: {
    minHeight: 115,
    backgroundColor:
      colors.background,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: colors.text,
    ...typography.bodySmall,
  },

  characterCount: {
    ...typography.caption,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: 4,
  },

  modalActions: {
    flexDirection: 'row',
    marginTop: 17,
  },

  deleteButton: {
    minWidth: 105,
    height: 46,
    borderRadius: 11,
    backgroundColor: '#FEE2E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
    paddingHorizontal: 13,
  },

  deleteButtonText: {
    ...typography.button,
    color: '#DC2626',
    marginLeft: 6,
  },

  saveButton: {
    flex: 1,
    height: 46,
    borderRadius: 11,
    backgroundColor:
      colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonText: {
    ...typography.button,
    color: '#FFFFFF',
    marginLeft: 7,
  },

  buttonDisabled: {
    opacity: 0.6,
  },
});