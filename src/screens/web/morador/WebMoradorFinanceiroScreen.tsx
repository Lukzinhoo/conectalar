import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  RefreshCw,
  Wallet,
} from 'lucide-react-native';

import { colors } from '../../../theme/theme';
import { supabase } from '../../../services/supabase';

import WebLayout from '../../../components/WebLayout';
import WebMoradorSidebar from '../../../components/WebMoradorSidebar';

/* =====================================================
   TIPOS
===================================================== */

type TipoFinanceiro =
  | 'receita'
  | 'despesa';

type StatusFinanceiro =
  | 'pendente'
  | 'pago'
  | 'recebido'
  | 'atrasado'
  | 'cancelado';

type Financeiro = {
  id: string;

  tipo: TipoFinanceiro;

  categoria: string;

  descricao: string;

  fornecedor: string | null;

  valor: number;

  data_lancamento: string;

  data_vencimento: string | null;

  data_pagamento: string | null;

  status: StatusFinanceiro;

  observacao: string | null;

  visivel_moradores: boolean;

  criado_em: string;
};

/* =====================================================
   COMPONENTE
===================================================== */

export default function WebMoradorFinanceiroScreen() {
  const { width } = useWindowDimensions();

  const isMobile = width < 768;

  const [registros, setRegistros] =
    useState<Financeiro[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [atualizando, setAtualizando] =
    useState(false);

  const [erro, setErro] =
    useState('');

  /* ===================================================
     CARREGAR FINANCEIRO
  =================================================== */

  const carregarFinanceiro =
    useCallback(
      async (
        atualizar = false
      ) => {
        try {
          setErro('');

          if (atualizar) {
            setAtualizando(true);
          } else {
            setCarregando(true);
          }

          const {
            data,
            error,
          } = await supabase
            .from(
              'financeiro_lancamentos'
            )
            .select(`
              id,
              tipo,
              categoria,
              descricao,
              fornecedor,
              valor,
              data_lancamento,
              data_vencimento,
              data_pagamento,
              status,
              observacao,
              visivel_moradores,
              criado_em
            `)
            .eq(
              'visivel_moradores',
              true
            )
            .order(
              'data_lancamento',
              {
                ascending: false,
              }
            )
            .order(
              'criado_em',
              {
                ascending: false,
              }
            );

          if (error) {
            throw error;
          }

          setRegistros(
            (data ??
              []) as Financeiro[]
          );
        } catch (error: any) {
          console.error(
            'Erro ao carregar financeiro do morador:',
            error
          );

          setErro(
            error?.message ||
              'Não foi possível carregar as informações financeiras.'
          );
        } finally {
          setCarregando(false);
          setAtualizando(false);
        }
      },
      []
    );

  useEffect(() => {
    carregarFinanceiro();
  }, [carregarFinanceiro]);

  /* ===================================================
     RESUMO
  =================================================== */

  const resumo = useMemo(() => {
    const receitas =
      registros
        .filter(
          (item) =>
            item.tipo ===
              'receita' &&
            item.status ===
              'recebido'
        )
        .reduce(
          (total, item) =>
            total +
            Number(
              item.valor || 0
            ),
          0
        );

    const despesas =
      registros
        .filter(
          (item) =>
            item.tipo ===
              'despesa' &&
            item.status ===
              'pago'
        )
        .reduce(
          (total, item) =>
            total +
            Number(
              item.valor || 0
            ),
          0
        );

    const pendentes =
      registros
        .filter(
          (item) =>
            item.status ===
              'pendente' ||
            item.status ===
              'atrasado'
        )
        .reduce(
          (total, item) =>
            total +
            Number(
              item.valor || 0
            ),
          0
        );

    return {
      receitas,
      despesas,

      saldo:
        receitas -
        despesas,

      pendentes,
    };
  }, [registros]);

  /* ===================================================
     FORMATAÇÃO
  =================================================== */

  function formatarMoeda(
    valor: number
  ) {
    return Number(
      valor || 0
    ).toLocaleString(
      'pt-BR',
      {
        style: 'currency',
        currency: 'BRL',
      }
    );
  }

  function formatarData(
    data: string | null
  ) {
    if (!data) {
      return '-';
    }

    const partes =
      data.split('-');

    if (
      partes.length !== 3
    ) {
      return data;
    }

    return (
      partes[2] +
      '/' +
      partes[1] +
      '/' +
      partes[0]
    );
  }

  function nomeStatus(
    status: StatusFinanceiro
  ) {
    switch (status) {
      case 'pago':
        return 'Pago';

      case 'recebido':
        return 'Recebido';

      case 'atrasado':
        return 'Atrasado';

      case 'cancelado':
        return 'Cancelado';

      default:
        return 'Pendente';
    }
  }

  function corStatus(
    status: StatusFinanceiro
  ) {
    switch (status) {
      case 'pago':
      case 'recebido':
        return '#16A34A';

      case 'atrasado':
        return '#DC2626';

      case 'cancelado':
        return colors.textSecondary;

      default:
        return '#D97706';
    }
  }

  /* ===================================================
     TELA
  =================================================== */

  return (
    <WebLayout
      sidebar={
        <WebMoradorSidebar
          active="financeiro"
        />
      }
      scroll
    >
      <View
        style={[
          styles.page,

          isMobile &&
            styles.pageMobile,
        ]}
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
              styles.headerText
            }
          >
            <Text
              style={
                styles.pageTitle
              }
            >
              Financeiro
            </Text>

            <Text
              style={
                styles.pageSubtitle
              }
            >
              Acompanhe as receitas,
              despesas e movimentações
              financeiras do condomínio.
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.refreshButton,

              isMobile &&
                styles.refreshButtonMobile,
            ]}
            onPress={() =>
              carregarFinanceiro(
                true
              )
            }
            disabled={
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
                  colors.primary
                }
              />
            )}

            <Text
              style={
                styles.refreshText
              }
            >
              {atualizando
                ? 'Atualizando...'
                : 'Atualizar'}
            </Text>
          </TouchableOpacity>
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

        {/* RESUMO */}

        <View
          style={[
            styles.summaryGrid,

            isMobile &&
              styles.summaryGridMobile,
          ]}
        >
          <ResumoCard
            titulo="Receitas"
            valor={formatarMoeda(
              resumo.receitas
            )}
            icon={
              <ArrowUpCircle
                size={24}
                color="#16A34A"
              />
            }
          />

          <ResumoCard
            titulo="Despesas"
            valor={formatarMoeda(
              resumo.despesas
            )}
            icon={
              <ArrowDownCircle
                size={24}
                color="#DC2626"
              />
            }
          />

          <ResumoCard
            titulo="Saldo"
            valor={formatarMoeda(
              resumo.saldo
            )}
            icon={
              <Wallet
                size={24}
                color={
                  colors.primary
                }
              />
            }
          />

          <ResumoCard
            titulo="Pendentes"
            valor={formatarMoeda(
              resumo.pendentes
            )}
            icon={
              <DollarSign
                size={24}
                color="#D97706"
              />
            }
          />
        </View>

        {/* INFORMAÇÃO */}

        <View
          style={
            styles.infoBox
          }
        >
          <Text
            style={
              styles.infoTitle
            }
          >
            Transparência financeira
          </Text>

          <Text
            style={
              styles.infoText
            }
          >
            Aqui são exibidos os
            lançamentos financeiros
            disponibilizados pela
            administração do
            condomínio.
          </Text>
        </View>

        {/* LANÇAMENTOS */}

        <View
          style={
            styles.card
          }
        >
          <View
            style={
              styles.cardHeader
            }
          >
            <View>
              <Text
                style={
                  styles.cardTitle
                }
              >
                Movimentações
              </Text>

              <Text
                style={
                  styles.cardSubtitle
                }
              >
                Receitas e despesas
                disponibilizadas pela
                administração.
              </Text>
            </View>
          </View>

          {carregando ? (
            <View
              style={
                styles.loadingArea
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
                  styles.loadingText
                }
              >
                Carregando
                informações...
              </Text>
            </View>
          ) : registros.length ===
            0 ? (
            <View
              style={
                styles.emptyArea
              }
            >
              <DollarSign
                size={40}
                color={
                  colors.textLight
                }
              />

              <Text
                style={
                  styles.emptyTitle
                }
              >
                Nenhuma movimentação
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Ainda não existem
                informações financeiras
                disponíveis para os
                moradores.
              </Text>
            </View>
          ) : (
            <View
              style={
                styles.list
              }
            >
              {registros.map(
                (item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.listItem,

                      isMobile &&
                        styles.listItemMobile,
                    ]}
                  >
                    <View
                      style={
                        styles.iconBox
                      }
                    >
                      {item.tipo ===
                      'receita' ? (
                        <ArrowUpCircle
                          size={23}
                          color="#16A34A"
                        />
                      ) : (
                        <ArrowDownCircle
                          size={23}
                          color="#DC2626"
                        />
                      )}
                    </View>

                    <View
                      style={
                        styles.itemContent
                      }
                    >
                      <Text
                        style={
                          styles.itemTitle
                        }
                      >
                        {
                          item.descricao
                        }
                      </Text>

                      <Text
                        style={
                          styles.itemCategory
                        }
                      >
                        {
                          item.categoria
                        }
                      </Text>

                      {!!item.fornecedor && (
                        <Text
                          style={
                            styles.itemDetail
                          }
                        >
                          Fornecedor:{' '}
                          {
                            item.fornecedor
                          }
                        </Text>
                      )}

                      <Text
                        style={
                          styles.itemDetail
                        }
                      >
                        Lançamento:{' '}
                        {formatarData(
                          item.data_lancamento
                        )}
                      </Text>

                      {!!item.data_vencimento && (
                        <Text
                          style={
                            styles.itemDetail
                          }
                        >
                          Vencimento:{' '}
                          {formatarData(
                            item.data_vencimento
                          )}
                        </Text>
                      )}

                      {!!item.observacao && (
                        <Text
                          style={
                            styles.observacao
                          }
                        >
                          {
                            item.observacao
                          }
                        </Text>
                      )}
                    </View>

                    <View
                      style={[
                        styles.itemRight,

                        isMobile &&
                          styles.itemRightMobile,
                      ]}
                    >
                      <Text
                        style={[
                          styles.itemValue,

                          item.tipo ===
                          'receita'
                            ? styles.receitaText
                            : styles.despesaText,
                        ]}
                      >
                        {item.tipo ===
                        'receita'
                          ? '+ '
                          : '- '}

                        {formatarMoeda(
                          Number(
                            item.valor
                          )
                        )}
                      </Text>

                      <View
                        style={
                          styles.statusArea
                        }
                      >
                        <View
                          style={[
                            styles.statusDot,

                            {
                              backgroundColor:
                                corStatus(
                                  item.status
                                ),
                            },
                          ]}
                        />

                        <Text
                          style={[
                            styles.statusText,

                            {
                              color:
                                corStatus(
                                  item.status
                                ),
                            },
                          ]}
                        >
                          {nomeStatus(
                            item.status
                          )}
                        </Text>
                      </View>
                    </View>
                  </View>
                )
              )}
            </View>
          )}
        </View>
      </View>
    </WebLayout>
  );
}

/* =====================================================
   CARD RESUMO
===================================================== */

function ResumoCard({
  titulo,
  valor,
  icon,
}: {
  titulo: string;
  valor: string;
  icon: React.ReactNode;
}) {
  return (
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
        {icon}
      </View>

      <View
        style={
          styles.summaryContent
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

/* =====================================================
   ESTILOS
===================================================== */

const styles =
  StyleSheet.create({
    page: {
      width: '100%',
      paddingBottom: 40,
    },

    pageMobile: {
      paddingBottom: 50,
    },

    header: {
      width: '100%',

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      marginBottom: 22,
    },

    headerMobile: {
      flexDirection: 'column',

      alignItems: 'stretch',
    },

    headerText: {
      flex: 1,

      minWidth: 0,
    },

    pageTitle: {
      fontSize: 28,

      lineHeight: 34,

      fontWeight: '800',

      color: colors.text,
    },

    pageSubtitle: {
      marginTop: 5,

      fontSize: 14,

      lineHeight: 21,

      color:
        colors.textSecondary,
    },

    refreshButton: {
      minHeight: 43,

      marginLeft: 18,

      paddingHorizontal: 15,

      borderRadius: 9,

      borderWidth: 1,

      borderColor:
        colors.border,

      backgroundColor:
        colors.surface,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 7,
    },

    refreshButtonMobile: {
      width: '100%',

      marginLeft: 0,

      marginTop: 15,
    },

    refreshText: {
      fontSize: 13,

      fontWeight: '700',

      color:
        colors.primary,
    },

    errorBox: {
      width: '100%',

      padding: 13,

      marginBottom: 16,

      borderRadius: 9,

      borderWidth: 1,

      borderColor:
        colors.danger,

      backgroundColor:
        colors.dangerLight,
    },

    errorText: {
      fontSize: 13,

      color:
        colors.danger,
    },

    summaryGrid: {
      width: '100%',

      flexDirection: 'row',

      flexWrap: 'wrap',

      gap: 12,

      marginBottom: 18,
    },

    summaryGridMobile: {
      flexDirection: 'column',
    },

    summaryCard: {
      flexGrow: 1,

      flexBasis: 210,

      minWidth: 190,

      padding: 18,

      borderRadius: 14,

      borderWidth: 1,

      borderColor:
        colors.border,

      backgroundColor:
        colors.surface,

      flexDirection: 'row',

      alignItems: 'center',

      gap: 13,
    },

    summaryIcon: {
      width: 46,

      height: 46,

      borderRadius: 12,

      backgroundColor:
        colors.primaryLight,

      alignItems: 'center',

      justifyContent:
        'center',

      flexShrink: 0,
    },

    summaryContent: {
      flex: 1,

      minWidth: 0,
    },

    summaryLabel: {
      fontSize: 13,

      color:
        colors.textSecondary,
    },

    summaryValue: {
      marginTop: 3,

      fontSize: 20,

      fontWeight: '800',

      color:
        colors.text,
    },

    infoBox: {
      width: '100%',

      padding: 17,

      marginBottom: 18,

      borderRadius: 13,

      borderWidth: 1,

      borderColor:
        colors.border,

      backgroundColor:
        colors.primaryLight,
    },

    infoTitle: {
      fontSize: 15,

      fontWeight: '800',

      color:
        colors.primaryDark,
    },

    infoText: {
      marginTop: 4,

      fontSize: 13,

      lineHeight: 19,

      color:
        colors.textSecondary,
    },

    card: {
      width: '100%',

      borderRadius: 14,

      borderWidth: 1,

      borderColor:
        colors.border,

      backgroundColor:
        colors.surface,

      padding: 18,
    },

    cardHeader: {
      width: '100%',

      marginBottom: 5,
    },

    cardTitle: {
      fontSize: 18,

      fontWeight: '800',

      color:
        colors.text,
    },

    cardSubtitle: {
      marginTop: 4,

      fontSize: 13,

      lineHeight: 19,

      color:
        colors.textSecondary,
    },

    loadingArea: {
      minHeight: 230,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    loadingText: {
      marginTop: 10,

      fontSize: 13,

      color:
        colors.textSecondary,
    },

    emptyArea: {
      minHeight: 230,

      padding: 20,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    emptyTitle: {
      marginTop: 10,

      fontSize: 16,

      fontWeight: '800',

      color:
        colors.text,
    },

    emptyText: {
      maxWidth: 400,

      marginTop: 5,

      fontSize: 13,

      lineHeight: 19,

      textAlign: 'center',

      color:
        colors.textSecondary,
    },

    list: {
      width: '100%',

      marginTop: 10,
    },

    listItem: {
      width: '100%',

      minHeight: 85,

      paddingVertical: 15,

      borderBottomWidth: 1,

      borderBottomColor:
        colors.border,

      flexDirection: 'row',

      alignItems: 'center',

      gap: 12,
    },

    listItemMobile: {
      alignItems: 'flex-start',

      flexWrap: 'wrap',
    },

    iconBox: {
      width: 43,

      height: 43,

      borderRadius: 11,

      backgroundColor:
        colors.background,

      alignItems: 'center',

      justifyContent:
        'center',

      flexShrink: 0,
    },

    itemContent: {
      flex: 1,

      minWidth: 180,
    },

    itemTitle: {
      fontSize: 14,

      fontWeight: '800',

      color:
        colors.text,
    },

    itemCategory: {
      marginTop: 3,

      fontSize: 12,

      fontWeight: '600',

      color:
        colors.primary,
    },

    itemDetail: {
      marginTop: 3,

      fontSize: 12,

      color:
        colors.textSecondary,
    },

    observacao: {
      marginTop: 7,

      fontSize: 12,

      lineHeight: 18,

      color:
        colors.textSecondary,
    },

    itemRight: {
      alignItems: 'flex-end',

      flexShrink: 0,
    },

    itemRightMobile: {
      width: '100%',

      alignItems: 'flex-start',

      paddingLeft: 55,
    },

    itemValue: {
      fontSize: 15,

      fontWeight: '800',
    },

    receitaText: {
      color: '#16A34A',
    },

    despesaText: {
      color: '#DC2626',
    },

    statusArea: {
      marginTop: 6,

      flexDirection: 'row',

      alignItems: 'center',

      gap: 5,
    },

    statusDot: {
      width: 7,

      height: 7,

      borderRadius: 999,
    },

    statusText: {
      fontSize: 11,

      fontWeight: '700',
    },
  });