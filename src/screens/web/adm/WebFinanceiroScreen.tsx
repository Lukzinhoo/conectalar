import React, { useCallback, useEffect, useMemo, useState } from 'react';

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
  CheckCircle2,
  ChevronDown,
  DollarSign,
  Edit3,
  Plus,
  RefreshCw,
  Trash2,
  Wallet,
  X,
} from 'lucide-react-native';

import { colors } from '../../../theme/theme';
import { supabase } from '../../../services/supabase';
import WebSidebar from '../../../components/WebSidebar';

type TipoFinanceiro = 'receita' | 'despesa';
type StatusFinanceiro = 'pendente' | 'pago';

type Financeiro = {
  id: string;
  tipo: TipoFinanceiro;
  titulo: string;
  categoria: string;
  valor: number;
  vencimento: string | null;
  data_pagamento: string | null;
  status: StatusFinanceiro;
  observacao: string | null;
  criado_em: string;
  atualizado_em: string;
};

type FiltroTipo = 'todos' | TipoFinanceiro;
type FiltroStatus = 'todos' | StatusFinanceiro;

const categorias = [
  'Água',
  'Energia',
  'Manutenção',
  'Limpeza',
  'Funcionários',
  'Segurança',
  'Taxa condominial',
  'Reserva',
  'Outros',
];

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor || 0);
}

function formatarData(data: string | null) {
  if (!data) {
    return '-';
  }

  const partes = data.split('-');

  if (partes.length !== 3) {
    return data;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function converterValor(valor: string) {
  const limpo = valor
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');

  const numero = Number(limpo);

  return Number.isFinite(numero) ? numero : 0;
}

export default function WebFinanceiroScreen() {
  const [registros, setRegistros] = useState<Financeiro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [registroEditando, setRegistroEditando] =
    useState<Financeiro | null>(null);

  const [tipo, setTipo] =
    useState<TipoFinanceiro>('despesa');

  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('Outros');
  const [valor, setValor] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [status, setStatus] =
    useState<StatusFinanceiro>('pendente');

  const [observacao, setObservacao] = useState('');

  const [mostrarCategorias, setMostrarCategorias] =
    useState(false);

  const [filtroTipo, setFiltroTipo] =
    useState<FiltroTipo>('todos');

  const [filtroStatus, setFiltroStatus] =
    useState<FiltroStatus>('todos');

  const carregarFinanceiro = useCallback(async () => {
    try {
      setCarregando(true);

      const { data, error } = await supabase
        .from('financeiro')
        .select(`
          id,
          tipo,
          titulo,
          categoria,
          valor,
          vencimento,
          data_pagamento,
          status,
          observacao,
          criado_em,
          atualizado_em
        `)
        .order('criado_em', {
          ascending: false,
        });

      if (error) {
        console.error(
          'Erro ao carregar financeiro:',
          error
        );

        Alert.alert(
          'Erro',
          error.message ||
            'Não foi possível carregar os dados financeiros.'
        );

        return;
      }

      setRegistros(
        (data ?? []).map((item: any) => ({
          ...item,
          valor: Number(item.valor ?? 0),
        }))
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        'Erro',
        'Não foi possível carregar os dados financeiros.'
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarFinanceiro();
  }, [carregarFinanceiro]);

  const registrosFiltrados = useMemo(() => {
    return registros.filter((item) => {
      const tipoOk =
        filtroTipo === 'todos' ||
        item.tipo === filtroTipo;

      const statusOk =
        filtroStatus === 'todos' ||
        item.status === filtroStatus;

      return tipoOk && statusOk;
    });
  }, [
    registros,
    filtroTipo,
    filtroStatus,
  ]);

  const resumo = useMemo(() => {
    const receitas = registros
      .filter(
        (item) =>
          item.tipo === 'receita' &&
          item.status === 'pago'
      )
      .reduce(
        (total, item) =>
          total + Number(item.valor || 0),
        0
      );

    const despesas = registros
      .filter(
        (item) =>
          item.tipo === 'despesa' &&
          item.status === 'pago'
      )
      .reduce(
        (total, item) =>
          total + Number(item.valor || 0),
        0
      );

    const pendentes = registros
      .filter(
        (item) =>
          item.status === 'pendente'
      )
      .reduce(
        (total, item) =>
          total + Number(item.valor || 0),
        0
      );

    return {
      receitas,
      despesas,
      saldo: receitas - despesas,
      pendentes,
    };
  }, [registros]);

  function limparFormulario() {
    setRegistroEditando(null);

    setTipo('despesa');
    setTitulo('');
    setCategoria('Outros');
    setValor('');
    setVencimento('');
    setStatus('pendente');
    setObservacao('');

    setMostrarCategorias(false);
  }

  function abrirNovo() {
    limparFormulario();
    setModalAberto(true);
  }

  function abrirEditar(item: Financeiro) {
    setRegistroEditando(item);

    setTipo(item.tipo);
    setTitulo(item.titulo);
    setCategoria(item.categoria || 'Outros');

    setValor(
      Number(item.valor || 0)
        .toFixed(2)
        .replace('.', ',')
    );

    setVencimento(
      item.vencimento || ''
    );

    setStatus(item.status);
    setObservacao(
      item.observacao || ''
    );

    setMostrarCategorias(false);
    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) {
      return;
    }

    setModalAberto(false);
    limparFormulario();
  }

  async function salvar() {
    const tituloLimpo = titulo.trim();
    const valorNumero =
      converterValor(valor);

    if (!tituloLimpo) {
      Alert.alert(
        'Atenção',
        'Informe o título.'
      );
      return;
    }

    if (valorNumero <= 0) {
      Alert.alert(
        'Atenção',
        'Informe um valor maior que zero.'
      );
      return;
    }

    try {
      setSalvando(true);

      const agora =
        new Date().toISOString();

      const dados = {
        tipo,
        titulo: tituloLimpo,
        categoria:
          categoria || 'Outros',

        valor: valorNumero,

        vencimento:
          vencimento.trim() || null,

        data_pagamento:
          status === 'pago'
            ? registroEditando?.data_pagamento ??
              new Date()
                .toISOString()
                .slice(0, 10)
            : null,

        status,

        observacao:
          observacao.trim() || null,

        atualizado_em: agora,
      };

      if (registroEditando) {
        const { error } =
          await supabase
            .from('financeiro')
            .update(dados)
            .eq(
              'id',
              registroEditando.id
            );

        if (error) {
          throw error;
        }
      } else {
        const { error } =
          await supabase
            .from('financeiro')
            .insert({
              ...dados,
              criado_em: agora,
            });

        if (error) {
          throw error;
        }
      }

      setModalAberto(false);
      limparFormulario();

      await carregarFinanceiro();
    } catch (error: any) {
      console.error(
        'Erro ao salvar financeiro:',
        error
      );

      Alert.alert(
        'Erro',
        error?.message ||
          'Não foi possível salvar.'
      );
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(
    item: Financeiro
  ) {
    const confirmar =
      typeof window !== 'undefined'
        ? window.confirm(
            `Deseja excluir "${item.titulo}"?`
          )
        : true;

    if (!confirmar) {
      return;
    }

    try {
      const { error } =
        await supabase
          .from('financeiro')
          .delete()
          .eq('id', item.id);

      if (error) {
        throw error;
      }

      await carregarFinanceiro();
    } catch (error: any) {
      console.error(
        'Erro ao excluir:',
        error
      );

      Alert.alert(
        'Erro',
        error?.message ||
          'Não foi possível excluir.'
      );
    }
  }

  async function alterarStatus(
    item: Financeiro
  ) {
    const novoStatus:
      StatusFinanceiro =
      item.status === 'pago'
        ? 'pendente'
        : 'pago';

    try {
      const agora =
        new Date().toISOString();

      const { error } =
        await supabase
          .from('financeiro')
          .update({
            status: novoStatus,

            data_pagamento:
              novoStatus === 'pago'
                ? new Date()
                    .toISOString()
                    .slice(0, 10)
                : null,

            atualizado_em: agora,
          })
          .eq('id', item.id);

      if (error) {
        throw error;
      }

      await carregarFinanceiro();
    } catch (error: any) {
      console.error(error);

      Alert.alert(
        'Erro',
        error?.message ||
          'Não foi possível alterar o status.'
      );
    }
  }

  return (
    <View style={styles.container}>
      <WebSidebar active="financeiro" />

      <View style={styles.content}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                Financeiro
              </Text>

              <Text style={styles.subtitle}>
                Controle de receitas,
                despesas e pagamentos
                do condomínio.
              </Text>
            </View>

            <View style={styles.headerActions}>
              <Pressable
                style={
                  styles.refreshButton
                }
                onPress={
                  carregarFinanceiro
                }
              >
                <RefreshCw
                  size={17}
                  color={colors.text}
                />

                <Text
                  style={
                    styles.refreshButtonText
                  }
                >
                  Atualizar
                </Text>
              </Pressable>

              <Pressable
                style={styles.newButton}
                onPress={abrirNovo}
              >
                <Plus
                  size={17}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.newButtonText
                  }
                >
                  Novo lançamento
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.cards}>
            <View style={styles.card}>
              <View
                style={
                  styles.cardIcon
                }
              >
                <DollarSign
                  size={20}
                  color={colors.primary}
                />
              </View>

              <Text
                style={
                  styles.cardLabel
                }
              >
                Receitas pagas
              </Text>

              <Text
                style={
                  styles.cardValue
                }
              >
                {formatarMoeda(
                  resumo.receitas
                )}
              </Text>
            </View>

            <View style={styles.card}>
              <View
                style={
                  styles.cardIcon
                }
              >
                <Wallet
                  size={20}
                  color={colors.primary}
                />
              </View>

              <Text
                style={
                  styles.cardLabel
                }
              >
                Despesas pagas
              </Text>

              <Text
                style={
                  styles.cardValue
                }
              >
                {formatarMoeda(
                  resumo.despesas
                )}
              </Text>
            </View>

            <View style={styles.card}>
              <View
                style={
                  styles.cardIcon
                }
              >
                <CheckCircle2
                  size={20}
                  color={colors.primary}
                />
              </View>

              <Text
                style={
                  styles.cardLabel
                }
              >
                Saldo
              </Text>

              <Text
                style={[
                  styles.cardValue,
                  resumo.saldo < 0 &&
                    styles.negative,
                ]}
              >
                {formatarMoeda(
                  resumo.saldo
                )}
              </Text>
            </View>

            <View style={styles.card}>
              <View
                style={
                  styles.cardIcon
                }
              >
                <Wallet
                  size={20}
                  color={colors.primary}
                />
              </View>

              <Text
                style={
                  styles.cardLabel
                }
              >
                Pendentes
              </Text>

              <Text
                style={
                  styles.cardValue
                }
              >
                {formatarMoeda(
                  resumo.pendentes
                )}
              </Text>
            </View>
          </View>

          <View style={styles.filters}>
            <Text
              style={
                styles.filterTitle
              }
            >
              Tipo
            </Text>

            <View
              style={
                styles.filterGroup
              }
            >
              {(
                [
                  'todos',
                  'receita',
                  'despesa',
                ] as FiltroTipo[]
              ).map((item) => (
                <Pressable
                  key={item}
                  style={[
                    styles.filterButton,
                    filtroTipo ===
                      item &&
                      styles.filterButtonActive,
                  ]}
                  onPress={() =>
                    setFiltroTipo(item)
                  }
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filtroTipo ===
                        item &&
                        styles.filterButtonTextActive,
                    ]}
                  >
                    {item === 'todos'
                      ? 'Todos'
                      : item ===
                          'receita'
                        ? 'Receitas'
                        : 'Despesas'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text
              style={[
                styles.filterTitle,
                styles.filterTitleStatus,
              ]}
            >
              Status
            </Text>

            <View
              style={
                styles.filterGroup
              }
            >
              {(
                [
                  'todos',
                  'pendente',
                  'pago',
                ] as FiltroStatus[]
              ).map((item) => (
                <Pressable
                  key={item}
                  style={[
                    styles.filterButton,
                    filtroStatus ===
                      item &&
                      styles.filterButtonActive,
                  ]}
                  onPress={() =>
                    setFiltroStatus(
                      item
                    )
                  }
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filtroStatus ===
                        item &&
                        styles.filterButtonTextActive,
                    ]}
                  >
                    {item === 'todos'
                      ? 'Todos'
                      : item ===
                          'pendente'
                        ? 'Pendentes'
                        : 'Pagos'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View
            style={
              styles.tableContainer
            }
          >
            <View
              style={styles.tableHeader}
            >
              <Text
                style={[
                  styles.tableHeaderText,
                  styles.colTitulo,
                ]}
              >
                LANÇAMENTO
              </Text>

              <Text
                style={[
                  styles.tableHeaderText,
                  styles.colTipo,
                ]}
              >
                TIPO
              </Text>

              <Text
                style={[
                  styles.tableHeaderText,
                  styles.colCategoria,
                ]}
              >
                CATEGORIA
              </Text>

              <Text
                style={[
                  styles.tableHeaderText,
                  styles.colData,
                ]}
              >
                VENCIMENTO
              </Text>

              <Text
                style={[
                  styles.tableHeaderText,
                  styles.colValor,
                ]}
              >
                VALOR
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

            {carregando ? (
              <View
                style={
                  styles.loading
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
                  Carregando...
                </Text>
              </View>
            ) : registrosFiltrados
                .length === 0 ? (
              <View
                style={styles.empty}
              >
                <Wallet
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
                  Nenhum lançamento
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  Não existem registros
                  para os filtros
                  selecionados.
                </Text>
              </View>
            ) : (
              registrosFiltrados.map(
                (item) => (
                  <View
                    key={item.id}
                    style={
                      styles.tableRow
                    }
                  >
                    <View
                      style={
                        styles.colTitulo
                      }
                    >
                      <Text
                        style={
                          styles.rowTitle
                        }
                      >
                        {item.titulo}
                      </Text>

                      {item.observacao ? (
                        <Text
                          numberOfLines={1}
                          style={
                            styles.rowSubtitle
                          }
                        >
                          {
                            item.observacao
                          }
                        </Text>
                      ) : null}
                    </View>

                    <View
                      style={
                        styles.colTipo
                      }
                    >
                      <View
                        style={[
                          styles.badge,
                          item.tipo ===
                          'receita'
                            ? styles.badgeReceita
                            : styles.badgeDespesa,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            item.tipo ===
                            'receita'
                              ? styles.badgeReceitaText
                              : styles.badgeDespesaText,
                          ]}
                        >
                          {item.tipo ===
                          'receita'
                            ? 'Receita'
                            : 'Despesa'}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.rowText,
                        styles.colCategoria,
                      ]}
                    >
                      {item.categoria}
                    </Text>

                    <Text
                      style={[
                        styles.rowText,
                        styles.colData,
                      ]}
                    >
                      {formatarData(
                        item.vencimento
                      )}
                    </Text>

                    <Text
                      style={[
                        styles.rowValue,
                        styles.colValor,
                      ]}
                    >
                      {formatarMoeda(
                        Number(
                          item.valor
                        )
                      )}
                    </Text>

                    <View
                      style={
                        styles.colStatus
                      }
                    >
                      <Pressable
                        style={[
                          styles.statusButton,
                          item.status ===
                          'pago'
                            ? styles.statusPago
                            : styles.statusPendente,
                        ]}
                        onPress={() =>
                          alterarStatus(
                            item
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.statusText,
                            item.status ===
                            'pago'
                              ? styles.statusPagoText
                              : styles.statusPendenteText,
                          ]}
                        >
                          {item.status ===
                          'pago'
                            ? 'Pago'
                            : 'Pendente'}
                        </Text>
                      </Pressable>
                    </View>

                    <View
                      style={[
                        styles.colAcoes,
                        styles.actions,
                      ]}
                    >
                      <Pressable
                        style={
                          styles.iconButton
                        }
                        onPress={() =>
                          abrirEditar(
                            item
                          )
                        }
                      >
                        <Edit3
                          size={15}
                          color={
                            colors.primary
                          }
                        />
                      </Pressable>

                      <Pressable
                        style={
                          styles.iconButtonDelete
                        }
                        onPress={() =>
                          excluir(item)
                        }
                      >
                        <Trash2
                          size={15}
                          color="#DC2626"
                        />
                      </Pressable>
                    </View>
                  </View>
                )
              )
            )}
          </View>
        </ScrollView>
      </View>

      <Modal
        visible={modalAberto}
        transparent
        animationType="fade"
        onRequestClose={
          fecharModal
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.modalContainer
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
                  {registroEditando
                    ? 'Editar lançamento'
                    : 'Novo lançamento'}
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  Preencha as informações
                  financeiras.
                </Text>
              </View>

              <Pressable
                style={
                  styles.closeButton
                }
                onPress={
                  fecharModal
                }
              >
                <X
                  size={18}
                  color={colors.text}
                />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
            >
              <Text
                style={styles.label}
              >
                Tipo
              </Text>

              <View
                style={
                  styles.typeButtons
                }
              >
                <Pressable
                  style={[
                    styles.typeButton,
                    tipo ===
                      'receita' &&
                      styles.typeButtonActive,
                  ]}
                  onPress={() =>
                    setTipo(
                      'receita'
                    )
                  }
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      tipo ===
                        'receita' &&
                        styles.typeButtonTextActive,
                    ]}
                  >
                    Receita
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.typeButton,
                    tipo ===
                      'despesa' &&
                      styles.typeButtonActive,
                  ]}
                  onPress={() =>
                    setTipo(
                      'despesa'
                    )
                  }
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      tipo ===
                        'despesa' &&
                        styles.typeButtonTextActive,
                    ]}
                  >
                    Despesa
                  </Text>
                </Pressable>
              </View>

              <Text
                style={styles.label}
              >
                Título
              </Text>

              <TextInput
                style={styles.input}
                value={titulo}
                onChangeText={
                  setTitulo
                }
                placeholder="Ex.: Conta de energia"
                placeholderTextColor={
                  colors.textLight
                }
              />

              <Text
                style={styles.label}
              >
                Categoria
              </Text>

              <Pressable
                style={
                  styles.selectButton
                }
                onPress={() =>
                  setMostrarCategorias(
                    (anterior) =>
                      !anterior
                  )
                }
              >
                <Text
                  style={
                    styles.selectButtonText
                  }
                >
                  {categoria}
                </Text>

                <ChevronDown
                  size={16}
                  color={
                    colors.textSecondary
                  }
                />
              </Pressable>

              {mostrarCategorias ? (
                <View
                  style={
                    styles.selectOptions
                  }
                >
                  {categorias.map(
                    (item) => (
                      <Pressable
                        key={item}
                        style={[
                          styles.selectOption,
                          categoria ===
                            item &&
                            styles.selectOptionActive,
                        ]}
                        onPress={() => {
                          setCategoria(
                            item
                          );

                          setMostrarCategorias(
                            false
                          );
                        }}
                      >
                        <Text
                          style={[
                            styles.selectOptionText,
                            categoria ===
                              item &&
                              styles.selectOptionTextActive,
                          ]}
                        >
                          {item}
                        </Text>
                      </Pressable>
                    )
                  )}
                </View>
              ) : null}

              <View
                style={styles.formRow}
              >
                <View
                  style={
                    styles.formHalf
                  }
                >
                  <Text
                    style={
                      styles.label
                    }
                  >
                    Valor
                  </Text>

                  <TextInput
                    style={
                      styles.input
                    }
                    value={valor}
                    onChangeText={
                      setValor
                    }
                    placeholder="0,00"
                    placeholderTextColor={
                      colors.textLight
                    }
                    keyboardType="decimal-pad"
                  />
                </View>

                <View
                  style={
                    styles.formHalf
                  }
                >
                  <Text
                    style={
                      styles.label
                    }
                  >
                    Vencimento
                  </Text>

                  <TextInput
                    style={
                      styles.input
                    }
                    value={
                      vencimento
                    }
                    onChangeText={
                      setVencimento
                    }
                    placeholder="AAAA-MM-DD"
                    placeholderTextColor={
                      colors.textLight
                    }
                  />
                </View>
              </View>

              <Text
                style={styles.label}
              >
                Status
              </Text>

              <View
                style={
                  styles.typeButtons
                }
              >
                <Pressable
                  style={[
                    styles.typeButton,
                    status ===
                      'pendente' &&
                      styles.typeButtonActive,
                  ]}
                  onPress={() =>
                    setStatus(
                      'pendente'
                    )
                  }
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      status ===
                        'pendente' &&
                        styles.typeButtonTextActive,
                    ]}
                  >
                    Pendente
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.typeButton,
                    status ===
                      'pago' &&
                      styles.typeButtonActive,
                  ]}
                  onPress={() =>
                    setStatus('pago')
                  }
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      status ===
                        'pago' &&
                        styles.typeButtonTextActive,
                    ]}
                  >
                    Pago
                  </Text>
                </Pressable>
              </View>

              <Text
                style={styles.label}
              >
                Observação
              </Text>

              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                ]}
                value={observacao}
                onChangeText={
                  setObservacao
                }
                placeholder="Observações sobre o lançamento..."
                placeholderTextColor={
                  colors.textLight
                }
                multiline
                textAlignVertical="top"
              />

              <View
                style={
                  styles.modalActions
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
                      styles.cancelButtonText
                    }
                  >
                    Cancelar
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.saveButton,
                    salvando &&
                      styles.disabled,
                  ]}
                  onPress={salvar}
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
                    <CheckCircle2
                      size={17}
                      color="#FFFFFF"
                    />
                  )}

                  <Text
                    style={
                      styles.saveButtonText
                    }
                  >
                    {salvando
                      ? 'Salvando...'
                      : 'Salvar'}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },

  content: {
    flex: 1,
    minWidth: 0,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    padding: 28,
    paddingBottom: 60,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  title: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '800',
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 5,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  refreshButton: {
    height: 42,
    paddingHorizontal: 15,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  refreshButtonText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 7,
  },

  newButton: {
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  newButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 7,
  },

  cards: {
    flexDirection: 'row',
    marginBottom: 22,
  },

  card: {
    flex: 1,
    minHeight: 130,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 18,
    marginRight: 12,
  },

  cardIcon: {
    width: 37,
    height: 37,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  cardLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },

  cardValue: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
    marginTop: 5,
  },

  negative: {
    color: '#DC2626',
  },

  filters: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
  },

  filterTitle: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 8,
  },

  filterTitleStatus: {
    marginTop: 14,
  },

  filterGroup: {
    flexDirection: 'row',
  },

  filterButton: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  filterButtonActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },

  filterButtonText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },

  filterButtonTextActive: {
    color: colors.primary,
  },

  tableContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    overflow: 'hidden',
  },

  tableHeader: {
    minHeight: 44,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  tableHeaderText: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '800',
  },

  tableRow: {
    minHeight: 67,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  colTitulo: {
    flex: 2,
  },

  colTipo: {
    flex: 1,
  },

  colCategoria: {
    flex: 1.3,
  },

  colData: {
    flex: 1,
  },

  colValor: {
    flex: 1,
  },

  colStatus: {
    flex: 1,
  },

  colAcoes: {
    width: 85,
  },

  rowTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },

  rowSubtitle: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 4,
    maxWidth: 230,
  },

  rowText: {
    color: colors.textSecondary,
    fontSize: 10,
  },

  rowValue: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
  },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },

  badgeReceita: {
    backgroundColor: '#DCFCE7',
  },

  badgeDespesa: {
    backgroundColor: '#FEE2E2',
  },

  badgeText: {
    fontSize: 8,
    fontWeight: '800',
  },

  badgeReceitaText: {
    color: '#15803D',
  },

  badgeDespesaText: {
    color: '#DC2626',
  },

  statusButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },

  statusPago: {
    backgroundColor: '#DCFCE7',
  },

  statusPendente: {
    backgroundColor: '#FEF3C7',
  },

  statusText: {
    fontSize: 8,
    fontWeight: '800',
  },

  statusPagoText: {
    color: '#15803D',
  },

  statusPendenteText: {
    color: '#B45309',
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },

  iconButtonDelete: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loading: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 10,
  },

  empty: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 10,
  },

  emptyText: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 5,
    textAlign: 'center',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },

  modalContainer: {
    width: '100%',
    maxWidth: 590,
    maxHeight: '92%',
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },

  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  label: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 13,
    marginBottom: 7,
  },

  input: {
    height: 44,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    paddingHorizontal: 12,
    color: colors.text,
    fontSize: 11,
  },

  typeButtons: {
    flexDirection: 'row',
  },

  typeButton: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  typeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  typeButtonText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },

  typeButtonTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },

  selectButton: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
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
    borderRadius: 11,
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

  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  formHalf: {
    width: '48.5%',
  },

  textArea: {
    minHeight: 90,
    paddingTop: 11,
    paddingBottom: 11,
  },

  modalActions: {
    flexDirection: 'row',
    marginTop: 20,
  },

  cancelButton: {
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  cancelButtonText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
  },

  saveButton: {
    flex: 1,
    height: 46,
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
    opacity: 0.6,
  },
});