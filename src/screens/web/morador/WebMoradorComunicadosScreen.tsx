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
  View,
} from 'react-native';

import {
  AlertTriangle,
  Bell,
  CalendarDays,
  ChevronRight,
  Info,
  Megaphone,
  RefreshCw,
  Search,
  X,
  XCircle,
} from 'lucide-react-native';

import { colors } from '../../../theme/theme';
import WebMoradorSidebar from '../../../components/WebMoradorSidebar';
import { supabase } from '../../../services/supabase';

// ======================================================
// TIPOS
// ======================================================

type Categoria =
  | 'geral'
  | 'manutencao'
  | 'reuniao'
  | 'evento'
  | 'seguranca'
  | 'outro';

type Prioridade =
  | 'normal'
  | 'importante'
  | 'urgente';

type Comunicado = {
  id: string;
  titulo: string;
  mensagem: string;
  categoria: Categoria;
  prioridade: Prioridade;
  publicado: boolean;
  criado_em: string;
  atualizado_em: string;
};

type Filtro =
  | 'todos'
  | 'importante'
  | 'urgente';

// ======================================================
// FUNÇÕES AUXILIARES
// ======================================================

function categoriaTexto(
  categoria: Categoria
) {
  switch (categoria) {
    case 'manutencao':
      return 'Manutenção';

    case 'reuniao':
      return 'Reunião';

    case 'evento':
      return 'Evento';

    case 'seguranca':
      return 'Segurança';

    case 'outro':
      return 'Outro';

    default:
      return 'Geral';
  }
}

function prioridadeTexto(
  prioridade: Prioridade
) {
  switch (prioridade) {
    case 'urgente':
      return 'Urgente';

    case 'importante':
      return 'Importante';

    default:
      return 'Normal';
  }
}

function formatarData(
  valor: string
) {
  if (!valor) {
    return '-';
  }

  try {
    const data = new Date(valor);

    if (
      Number.isNaN(data.getTime())
    ) {
      return valor;
    }

    return data.toLocaleDateString(
      'pt-BR',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }
    );
  } catch {
    return valor;
  }
}

// ======================================================
// TELA
// ======================================================

export default function WebMoradorComunicadosScreen() {
  const [
    comunicadoSelecionado,
    setComunicadoSelecionado,
  ] = useState<Comunicado | null>(
    null
  );

  const [filtro, setFiltro] =
    useState<Filtro>('todos');

  const [
    comunicados,
    setComunicados,
  ] = useState<Comunicado[]>([]);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [erro, setErro] =
    useState('');

  // ====================================================
  // CARREGAR COMUNICADOS
  // ====================================================

  const carregarComunicados =
    useCallback(async () => {
      try {
        setCarregando(true);
        setErro('');

        // ----------------------------------------------
        // CONFIRMAR USUÁRIO LOGADO
        // ----------------------------------------------

        const {
          data: userData,
          error: userError,
        } =
          await supabase.auth.getUser();

        if (
          userError ||
          !userData.user
        ) {
          console.error(
            'ERRO AO OBTER USUÁRIO:',
            userError
          );

          setErro(
            'Sua sessão não foi encontrada. Entre novamente na sua conta.'
          );

          return;
        }

        // ----------------------------------------------
        // BUSCAR COMUNICADOS PUBLICADOS
        // ----------------------------------------------

        const {
          data,
          error,
        } = await supabase
          .from('comunicados')
          .select(`
            id,
            titulo,
            mensagem,
            categoria,
            prioridade,
            publicado,
            criado_em,
            atualizado_em
          `)
          .eq('publicado', true)
          .order(
            'criado_em',
            {
              ascending: false,
            }
          );

        if (error) {
          console.error(
            'ERRO AO CARREGAR COMUNICADOS:',
            error
          );

          setErro(
            `Não foi possível carregar os comunicados: ${error.message}`
          );

          return;
        }

        setComunicados(
          (data ?? []) as Comunicado[]
        );
      } catch (error) {
        console.error(
          'ERRO INESPERADO AO CARREGAR COMUNICADOS:',
          error
        );

        setErro(
          'Ocorreu um erro ao carregar os comunicados.'
        );
      } finally {
        setCarregando(false);
      }
    }, []);

  useEffect(() => {
    carregarComunicados();
  }, [carregarComunicados]);

  // ====================================================
  // FILTROS
  // ====================================================

  const comunicadosFiltrados =
    useMemo(() => {
      if (filtro === 'todos') {
        return comunicados;
      }

      return comunicados.filter(
        (item) =>
          item.prioridade ===
          filtro
      );
    }, [
      comunicados,
      filtro,
    ]);

  // ====================================================
  // CONTADORES
  // ====================================================

  const quantidadeUrgentes =
    useMemo(
      () =>
        comunicados.filter(
          (item) =>
            item.prioridade ===
            'urgente'
        ).length,
      [comunicados]
    );

  const quantidadeImportantes =
    useMemo(
      () =>
        comunicados.filter(
          (item) =>
            item.prioridade ===
            'importante'
        ).length,
      [comunicados]
    );

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <View style={styles.container}>
      <WebMoradorSidebar
        active="comunicados"
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={
          styles.contentContainer
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* CABEÇALHO */}

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Comunicados
            </Text>

            <Text
              style={styles.subtitle}
            >
              Acompanhe os avisos e informações publicados pela administração.
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
              onPress={
                carregarComunicados
              }
            >
              <RefreshCw
                size={18}
                color={
                  colors.textSecondary
                }
              />
            </Pressable>

            <View
              style={
                styles.headerIcon
              }
            >
              <Megaphone
                size={24}
                color={colors.primary}
              />
            </View>
          </View>
        </View>

        {/* ERRO */}

        {!!erro && (
          <View
            style={styles.errorBox}
          >
            <XCircle
              size={17}
              color={colors.danger}
            />

            <Text
              style={styles.errorText}
            >
              {erro}
            </Text>
          </View>
        )}

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
              Carregando comunicados...
            </Text>
          </View>
        ) : (
          <>
            {/* RESUMO */}

            <View
              style={styles.summary}
            >
              <View
                style={
                  styles.summaryCard
                }
              >
                <View
                  style={
                    styles.summaryIcon
                  }
                >
                  <Bell
                    size={21}
                    color={
                      colors.primary
                    }
                  />
                </View>

                <View>
                  <Text
                    style={
                      styles.summaryLabel
                    }
                  >
                    Comunicados
                  </Text>

                  <Text
                    style={
                      styles.summaryValue
                    }
                  >
                    {
                      comunicados.length
                    }
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.summaryCard
                }
              >
                <View
                  style={
                    styles.summaryIcon
                  }
                >
                  <Info
                    size={21}
                    color={
                      colors.primary
                    }
                  />
                </View>

                <View>
                  <Text
                    style={
                      styles.summaryLabel
                    }
                  >
                    Importantes
                  </Text>

                  <Text
                    style={
                      styles.summaryValue
                    }
                  >
                    {
                      quantidadeImportantes
                    }
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.summaryCard,
                  styles.lastSummaryCard,
                ]}
              >
                <View
                  style={
                    styles.summaryIcon
                  }
                >
                  <AlertTriangle
                    size={21}
                    color={
                      colors.primary
                    }
                  />
                </View>

                <View>
                  <Text
                    style={
                      styles.summaryLabel
                    }
                  >
                    Urgentes
                  </Text>

                  <Text
                    style={
                      styles.summaryValue
                    }
                  >
                    {
                      quantidadeUrgentes
                    }
                  </Text>
                </View>
              </View>
            </View>

            {/* FILTROS */}

            <View
              style={
                styles.filtersContainer
              }
            >
              <View
                style={
                  styles.filtersHeader
                }
              >
                <View
                  style={
                    styles.filtersTitleArea
                  }
                >
                  <Search
                    size={16}
                    color={
                      colors.textSecondary
                    }
                  />

                  <Text
                    style={
                      styles.filtersTitle
                    }
                  >
                    Filtrar comunicados
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.filterButtons
                }
              >
                <Pressable
                  style={[
                    styles.filterButton,

                    filtro ===
                      'todos' &&
                      styles.filterButtonActive,
                  ]}
                  onPress={() =>
                    setFiltro(
                      'todos'
                    )
                  }
                >
                  <Text
                    style={[
                      styles.filterButtonText,

                      filtro ===
                        'todos' &&
                        styles.filterButtonTextActive,
                    ]}
                  >
                    Todos
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.filterButton,

                    filtro ===
                      'importante' &&
                      styles.filterButtonActive,
                  ]}
                  onPress={() =>
                    setFiltro(
                      'importante'
                    )
                  }
                >
                  <Text
                    style={[
                      styles.filterButtonText,

                      filtro ===
                        'importante' &&
                        styles.filterButtonTextActive,
                    ]}
                  >
                    Importantes
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.filterButton,

                    filtro ===
                      'urgente' &&
                      styles.filterButtonActive,
                  ]}
                  onPress={() =>
                    setFiltro(
                      'urgente'
                    )
                  }
                >
                  <Text
                    style={[
                      styles.filterButtonText,

                      filtro ===
                        'urgente' &&
                        styles.filterButtonTextActive,
                    ]}
                  >
                    Urgentes
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* LISTA */}

            <Text
              style={
                styles.sectionTitle
              }
            >
              Comunicados recentes
            </Text>

            <View
              style={
                styles.listContainer
              }
            >
              {comunicadosFiltrados.length ===
              0 ? (
                <View
                  style={styles.empty}
                >
                  <Bell
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
                    Nenhum comunicado
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    {filtro ===
                    'todos'
                      ? 'A administração ainda não publicou nenhum comunicado.'
                      : 'Não existem comunicados neste filtro.'}
                  </Text>
                </View>
              ) : (
                comunicadosFiltrados.map(
                  (
                    comunicado
                  ) => (
                    <Pressable
                      key={
                        comunicado.id
                      }
                      style={
                        styles.comunicadoCard
                      }
                      onPress={() =>
                        setComunicadoSelecionado(
                          comunicado
                        )
                      }
                    >
                      <View
                        style={[
                          styles.priorityBar,

                          comunicado.prioridade ===
                            'urgente' &&
                            styles.priorityUrgent,

                          comunicado.prioridade ===
                            'importante' &&
                            styles.priorityImportant,

                          comunicado.prioridade ===
                            'normal' &&
                            styles.priorityNormal,
                        ]}
                      />

                      <View
                        style={
                          styles.comunicadoIcon
                        }
                      >
                        {comunicado.prioridade ===
                        'urgente' ? (
                          <AlertTriangle
                            size={21}
                            color="#DC2626"
                          />
                        ) : (
                          <Megaphone
                            size={21}
                            color={
                              colors.primary
                            }
                          />
                        )}
                      </View>

                      <View
                        style={
                          styles.comunicadoContent
                        }
                      >
                        <View
                          style={
                            styles.comunicadoTop
                          }
                        >
                          <Text
                            style={
                              styles.comunicadoTitle
                            }
                          >
                            {
                              comunicado.titulo
                            }
                          </Text>

                          <View
                            style={[
                              styles.priorityBadge,

                              comunicado.prioridade ===
                                'urgente' &&
                                styles.badgeUrgent,

                              comunicado.prioridade ===
                                'importante' &&
                                styles.badgeImportant,

                              comunicado.prioridade ===
                                'normal' &&
                                styles.badgeNormal,
                            ]}
                          >
                            <Text
                              style={[
                                styles.priorityText,

                                comunicado.prioridade ===
                                  'urgente' &&
                                  styles.badgeUrgentText,

                                comunicado.prioridade ===
                                  'importante' &&
                                  styles.badgeImportantText,

                                comunicado.prioridade ===
                                  'normal' &&
                                  styles.badgeNormalText,
                              ]}
                            >
                              {prioridadeTexto(
                                comunicado.prioridade
                              )}
                            </Text>
                          </View>
                        </View>

                        <Text
                          numberOfLines={
                            2
                          }
                          style={
                            styles.comunicadoMessage
                          }
                        >
                          {
                            comunicado.mensagem
                          }
                        </Text>

                        <View
                          style={
                            styles.comunicadoFooter
                          }
                        >
                          <View
                            style={
                              styles.footerItem
                            }
                          >
                            <CalendarDays
                              size={13}
                              color={
                                colors.textSecondary
                              }
                            />

                            <Text
                              style={
                                styles.footerText
                              }
                            >
                              {formatarData(
                                comunicado.criado_em
                              )}
                            </Text>
                          </View>

                          <View
                            style={
                              styles.categoryBadge
                            }
                          >
                            <Text
                              style={
                                styles.categoryText
                              }
                            >
                              {categoriaTexto(
                                comunicado.categoria
                              )}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <ChevronRight
                        size={19}
                        color={
                          colors.textLight
                        }
                      />
                    </Pressable>
                  )
                )
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* ==================================================
          MODAL DO COMUNICADO
      ================================================== */}

      <Modal
        visible={
          comunicadoSelecionado !==
          null
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setComunicadoSelecionado(
            null
          )
        }
      >
        <View
          style={styles.modalOverlay}
        >
          <View
            style={
              styles.modalContainer
            }
          >
            {comunicadoSelecionado ? (
              <>
                <View
                  style={
                    styles.modalHeader
                  }
                >
                  <View
                    style={
                      styles.modalIcon
                    }
                  >
                    {comunicadoSelecionado.prioridade ===
                    'urgente' ? (
                      <AlertTriangle
                        size={22}
                        color="#DC2626"
                      />
                    ) : (
                      <Megaphone
                        size={22}
                        color={
                          colors.primary
                        }
                      />
                    )}
                  </View>

                  <Pressable
                    style={
                      styles.closeButton
                    }
                    onPress={() =>
                      setComunicadoSelecionado(
                        null
                      )
                    }
                  >
                    <X
                      size={18}
                      color={
                        colors.text
                      }
                    />
                  </Pressable>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={
                    false
                  }
                >
                  <View
                    style={
                      styles.modalBadges
                    }
                  >
                    <View
                      style={[
                        styles.priorityBadge,

                        comunicadoSelecionado.prioridade ===
                          'urgente' &&
                          styles.badgeUrgent,

                        comunicadoSelecionado.prioridade ===
                          'importante' &&
                          styles.badgeImportant,

                        comunicadoSelecionado.prioridade ===
                          'normal' &&
                          styles.badgeNormal,
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityText,

                          comunicadoSelecionado.prioridade ===
                            'urgente' &&
                            styles.badgeUrgentText,

                          comunicadoSelecionado.prioridade ===
                            'importante' &&
                            styles.badgeImportantText,

                          comunicadoSelecionado.prioridade ===
                            'normal' &&
                            styles.badgeNormalText,
                        ]}
                      >
                        {prioridadeTexto(
                          comunicadoSelecionado.prioridade
                        )}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.categoryBadge
                      }
                    >
                      <Text
                        style={
                          styles.categoryText
                        }
                      >
                        {categoriaTexto(
                          comunicadoSelecionado.categoria
                        )}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={
                      styles.modalTitle
                    }
                  >
                    {
                      comunicadoSelecionado.titulo
                    }
                  </Text>

                  <View
                    style={
                      styles.modalDate
                    }
                  >
                    <CalendarDays
                      size={14}
                      color={
                        colors.textSecondary
                      }
                    />

                    <Text
                      style={
                        styles.modalDateText
                      }
                    >
                      Publicado em{' '}
                      {formatarData(
                        comunicadoSelecionado.criado_em
                      )}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.modalDivider
                    }
                  />

                  <Text
                    style={
                      styles.modalMessage
                    }
                  >
                    {
                      comunicadoSelecionado.mensagem
                    }
                  </Text>

                  <Pressable
                    style={
                      styles.modalButton
                    }
                    onPress={() =>
                      setComunicadoSelecionado(
                        null
                      )
                    }
                  >
                    <Text
                      style={
                        styles.modalButtonText
                      }
                    >
                      Fechar comunicado
                    </Text>
                  </Pressable>
                </ScrollView>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ======================================================
// ESTILOS
// ======================================================

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor:
        colors.background,
    },

    content: {
      flex: 1,
      minWidth: 0,
    },

    contentContainer: {
      padding: 30,
      paddingBottom: 60,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginBottom: 24,
    },

    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
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
      marginTop: 5,
    },

    refreshButton: {
      width: 42,
      height: 42,
      borderRadius: 11,
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor:
        colors.border,
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 9,
    },

    headerIcon: {
      width: 48,
      height: 48,
      borderRadius: 13,
      backgroundColor:
        colors.primaryLight,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    errorBox: {
      minHeight: 45,
      borderRadius: 11,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor:
        colors.dangerLight,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 18,
    },

    errorText: {
      flex: 1,
      color: colors.danger,
      fontSize: 10,
      fontWeight: '700',
      marginLeft: 8,
    },

    loadingContainer: {
      minHeight: 350,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    loadingText: {
      color:
        colors.textSecondary,
      fontSize: 10,
      marginTop: 12,
    },

    summary: {
      flexDirection: 'row',
      marginBottom: 22,
    },

    summaryCard: {
      flex: 1,
      minHeight: 105,
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 14,
      padding: 17,
      marginRight: 12,
      flexDirection: 'row',
      alignItems: 'center',
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
      justifyContent:
        'center',
      marginRight: 13,
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

    filtersContainer: {
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 14,
      padding: 16,
      marginBottom: 24,
    },

    filtersHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    filtersTitleArea: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    filtersTitle: {
      color: colors.text,
      fontSize: 10,
      fontWeight: '800',
      marginLeft: 7,
    },

    filterButtons: {
      flexDirection: 'row',
      marginTop: 13,
    },

    filterButton: {
      minHeight: 35,
      paddingHorizontal: 14,
      borderRadius: 9,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.background,
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 8,
    },

    filterButtonActive: {
      borderColor:
        colors.primary,
      backgroundColor:
        colors.primaryLight,
    },

    filterButtonText: {
      color:
        colors.textSecondary,
      fontSize: 9,
      fontWeight: '700',
    },

    filterButtonTextActive: {
      color: colors.primary,
      fontWeight: '800',
    },

    sectionTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '800',
      marginBottom: 14,
    },

    listContainer: {
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 15,
      overflow: 'hidden',
    },

    comunicadoCard: {
      minHeight: 115,
      paddingVertical: 17,
      paddingHorizontal: 18,
      borderBottomWidth: 1,
      borderBottomColor:
        colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      position: 'relative',
    },

    priorityBar: {
      position: 'absolute',
      left: 0,
      top: 15,
      bottom: 15,
      width: 4,
      borderRadius: 3,
    },

    priorityNormal: {
      backgroundColor:
        colors.primary,
    },

    priorityImportant: {
      backgroundColor:
        '#F59E0B',
    },

    priorityUrgent: {
      backgroundColor:
        '#DC2626',
    },

    comunicadoIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor:
        colors.primaryLight,
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 14,
    },

    comunicadoContent: {
      flex: 1,
    },

    comunicadoTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },

    comunicadoTitle: {
      flex: 1,
      color: colors.text,
      fontSize: 11,
      fontWeight: '800',
      marginRight: 10,
    },

    comunicadoMessage: {
      color:
        colors.textSecondary,
      fontSize: 9,
      lineHeight: 15,
      maxWidth: 700,
    },

    comunicadoFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 9,
    },

    footerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 10,
    },

    footerText: {
      color:
        colors.textSecondary,
      fontSize: 8,
      marginLeft: 5,
    },

    priorityBadge: {
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 7,
    },

    priorityText: {
      fontSize: 8,
      fontWeight: '800',
    },

    badgeNormal: {
      backgroundColor:
        colors.primaryLight,
    },

    badgeNormalText: {
      color: colors.primary,
    },

    badgeImportant: {
      backgroundColor:
        '#FEF3C7',
    },

    badgeImportantText: {
      color: '#B45309',
    },

    badgeUrgent: {
      backgroundColor:
        '#FEE2E2',
    },

    badgeUrgentText: {
      color: '#DC2626',
    },

    categoryBadge: {
      alignSelf: 'flex-start',
      backgroundColor:
        colors.background,
      borderWidth: 1,
      borderColor:
        colors.border,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 7,
      marginRight: 8,
    },

    categoryText: {
      color:
        colors.textSecondary,
      fontSize: 8,
      fontWeight: '700',
    },

    empty: {
      minHeight: 250,
      alignItems: 'center',
      justifyContent:
        'center',
      padding: 30,
    },

    emptyTitle: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '800',
      marginTop: 10,
    },

    emptyText: {
      color:
        colors.textSecondary,
      fontSize: 9,
      marginTop: 5,
      textAlign: 'center',
    },

    modalOverlay: {
      flex: 1,
      backgroundColor:
        'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent:
        'center',
      padding: 25,
    },

    modalContainer: {
      width: '100%',
      maxWidth: 600,
      maxHeight: '88%',
      backgroundColor:
        colors.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        colors.border,
      padding: 23,
    },

    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginBottom: 15,
    },

    modalIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor:
        colors.primaryLight,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 9,
      backgroundColor:
        colors.background,
      borderWidth: 1,
      borderColor:
        colors.border,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    modalBadges: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },

    modalTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
      lineHeight: 27,
    },

    modalDate: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
    },

    modalDateText: {
      color:
        colors.textSecondary,
      fontSize: 9,
      marginLeft: 6,
    },

    modalDivider: {
      height: 1,
      backgroundColor:
        colors.border,
      marginVertical: 18,
    },

    modalMessage: {
      color: colors.text,
      fontSize: 11,
      lineHeight: 20,
    },

    modalButton: {
      height: 45,
      borderRadius: 11,
      backgroundColor:
        colors.primary,
      alignItems: 'center',
      justifyContent:
        'center',
      marginTop: 25,
    },

    modalButtonText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
    },
  });