import React, {
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
  BookOpen,
  CheckCircle2,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react-native';

import WebSidebar from '../../../components/WebSidebar';
import { colors } from '../../../theme/theme';
import { supabase } from '../../../services/supabase';

// =====================================================
// TIPOS
// =====================================================

type CategoriaRegra =
  | 'geral'
  | 'silencio'
  | 'areas_comuns'
  | 'animais'
  | 'estacionamento'
  | 'seguranca'
  | 'outro';

type Regra = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: CategoriaRegra;
  ativa: boolean;
  created_at: string;
  updated_at: string;
};

// =====================================================
// CATEGORIAS
// =====================================================

const categorias: CategoriaRegra[] = [
  'geral',
  'silencio',
  'areas_comuns',
  'animais',
  'estacionamento',
  'seguranca',
  'outro',
];

// =====================================================
// LABEL CATEGORIA
// =====================================================

function categoriaLabel(
  categoria: CategoriaRegra
) {
  switch (categoria) {
    case 'geral':
      return 'Geral';

    case 'silencio':
      return 'Silêncio';

    case 'areas_comuns':
      return 'Áreas comuns';

    case 'animais':
      return 'Animais';

    case 'estacionamento':
      return 'Estacionamento';

    case 'seguranca':
      return 'Segurança';

    default:
      return 'Outro';
  }
}

// =====================================================
// TELA
// =====================================================

export default function WebRegrasScreen() {
  const [regras, setRegras] =
    useState<Regra[]>([]);

  const [busca, setBusca] =
    useState('');

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [processandoId, setProcessandoId] =
    useState<string | null>(null);

  const [mensagem, setMensagem] =
    useState('');

  const [erroPagina, setErroPagina] =
    useState('');

  const [modalAberto, setModalAberto] =
    useState(false);

  const [regraEditando, setRegraEditando] =
    useState<Regra | null>(null);

  const [titulo, setTitulo] =
    useState('');

  const [descricao, setDescricao] =
    useState('');

  const [categoria, setCategoria] =
    useState<CategoriaRegra>('geral');

  const [erro, setErro] =
    useState('');

  // ===================================================
  // CARREGAR
  // ===================================================

  useEffect(() => {
    carregarRegras();
  }, []);

  async function carregarRegras() {
    try {
      setCarregando(true);
      setErroPagina('');

      const { data, error } = await supabase
        .from('regras')
        .select(`
          id,
          titulo,
          descricao,
          categoria,
          ativa,
          created_at,
          updated_at
        `)
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        console.error(
          'Erro ao carregar regras:',
          error
        );

        setErroPagina(
          `Não foi possível carregar as regras: ${error.message}`
        );

        return;
      }

      setRegras(
        (data ?? []) as Regra[]
      );
    } catch (error) {
      console.error(
        'Erro inesperado ao carregar regras:',
        error
      );

      setErroPagina(
        'Não foi possível carregar as regras.'
      );
    } finally {
      setCarregando(false);
    }
  }

  // ===================================================
  // RESUMO
  // ===================================================

  const total = regras.length;

  const ativas =
    regras.filter(
      (regra) => regra.ativa
    ).length;

  const inativas =
    total - ativas;

  // ===================================================
  // FILTRO
  // ===================================================

  const regrasFiltradas =
    useMemo(() => {
      const termo =
        busca
          .trim()
          .toLowerCase();

      if (!termo) {
        return regras;
      }

      return regras.filter(
        (regra) =>
          regra.titulo
            .toLowerCase()
            .includes(termo) ||
          regra.descricao
            .toLowerCase()
            .includes(termo) ||
          categoriaLabel(
            regra.categoria
          )
            .toLowerCase()
            .includes(termo)
      );
    }, [busca, regras]);

  // ===================================================
  // NOVA REGRA
  // ===================================================

  function abrirNovaRegra() {
    setRegraEditando(null);
    setTitulo('');
    setDescricao('');
    setCategoria('geral');
    setErro('');
    setMensagem('');
    setModalAberto(true);
  }

  // ===================================================
  // EDITAR
  // ===================================================

  function editarRegra(
    regra: Regra
  ) {
    setRegraEditando(regra);
    setTitulo(regra.titulo);
    setDescricao(regra.descricao);
    setCategoria(regra.categoria);
    setErro('');
    setMensagem('');
    setModalAberto(true);
  }

  // ===================================================
  // FECHAR MODAL
  // ===================================================

  function fecharModal() {
    if (salvando) {
      return;
    }

    setModalAberto(false);
    setRegraEditando(null);
    setTitulo('');
    setDescricao('');
    setCategoria('geral');
    setErro('');
  }

  // ===================================================
  // SALVAR
  // ===================================================

  async function salvarRegra() {
    if (salvando) {
      return;
    }

    const tituloLimpo =
      titulo.trim();

    const descricaoLimpa =
      descricao.trim();

    if (!tituloLimpo) {
      setErro(
        'Informe o título da regra.'
      );
      return;
    }

    if (!descricaoLimpa) {
      setErro(
        'Informe a descrição da regra.'
      );
      return;
    }

    try {
      setSalvando(true);
      setErro('');

      const agora =
        new Date().toISOString();

      // ===============================================
      // EDITAR
      // ===============================================

      if (regraEditando) {
        const {
          data,
          error,
        } = await supabase
          .from('regras')
          .update({
            titulo: tituloLimpo,
            descricao: descricaoLimpa,
            categoria,
            updated_at: agora,
          })
          .eq(
            'id',
            regraEditando.id
          )
          .select(`
            id,
            titulo,
            descricao,
            categoria,
            ativa,
            created_at,
            updated_at
          `)
          .single();

        if (error) {
          console.error(
            'Erro ao editar regra:',
            error
          );

          setErro(
            `Não foi possível editar a regra: ${error.message}`
          );

          return;
        }

        setRegras((atual) =>
          atual.map((regra) =>
            regra.id === data.id
              ? (data as Regra)
              : regra
          )
        );

        setMensagem(
          'Regra atualizada com sucesso.'
        );
      } else {
        // =============================================
        // CRIAR
        // =============================================

        const {
          data,
          error,
        } = await supabase
          .from('regras')
          .insert({
            titulo: tituloLimpo,
            descricao: descricaoLimpa,
            categoria,
            ativa: true,
          })
          .select(`
            id,
            titulo,
            descricao,
            categoria,
            ativa,
            created_at,
            updated_at
          `)
          .single();

        if (error) {
          console.error(
            'Erro ao criar regra:',
            error
          );

          setErro(
            `Não foi possível criar a regra: ${error.message}`
          );

          return;
        }

        setRegras((atual) => [
          data as Regra,
          ...atual,
        ]);

        setMensagem(
          'Regra criada com sucesso.'
        );
      }

      setModalAberto(false);
      setRegraEditando(null);
      setTitulo('');
      setDescricao('');
      setCategoria('geral');
      setErro('');
    } catch (error) {
      console.error(
        'Erro inesperado ao salvar regra:',
        error
      );

      setErro(
        'Não foi possível salvar a regra.'
      );
    } finally {
      setSalvando(false);
    }
  }

  // ===================================================
  // ATIVAR / DESATIVAR
  // ===================================================

  async function alterarStatus(
    regra: Regra
  ) {
    if (processandoId) {
      return;
    }

    try {
      setProcessandoId(regra.id);
      setMensagem('');
      setErroPagina('');

      const novoStatus =
        !regra.ativa;

      const {
        data,
        error,
      } = await supabase
        .from('regras')
        .update({
          ativa: novoStatus,
          updated_at:
            new Date().toISOString(),
        })
        .eq('id', regra.id)
        .select(`
          id,
          titulo,
          descricao,
          categoria,
          ativa,
          created_at,
          updated_at
        `)
        .single();

      if (error) {
        console.error(
          'Erro ao alterar status:',
          error
        );

        setErroPagina(
          `Não foi possível alterar o status: ${error.message}`
        );

        return;
      }

      setRegras((atual) =>
        atual.map((item) =>
          item.id === regra.id
            ? (data as Regra)
            : item
        )
      );

      setMensagem(
        novoStatus
          ? 'Regra ativada com sucesso.'
          : 'Regra desativada com sucesso.'
      );
    } catch (error) {
      console.error(
        'Erro inesperado ao alterar status:',
        error
      );

      setErroPagina(
        'Não foi possível alterar o status da regra.'
      );
    } finally {
      setProcessandoId(null);
    }
  }

  // ===================================================
  // EXCLUIR
  // ===================================================

  async function excluirRegra(
    regra: Regra
  ) {
    if (processandoId) {
      return;
    }

    const confirmar =
      typeof window !== 'undefined'
        ? window.confirm(
            `Deseja realmente excluir a regra "${regra.titulo}"?`
          )
        : true;

    if (!confirmar) {
      return;
    }

    try {
      setProcessandoId(regra.id);
      setMensagem('');
      setErroPagina('');

      const { error } =
        await supabase
          .from('regras')
          .delete()
          .eq('id', regra.id);

      if (error) {
        console.error(
          'Erro ao excluir regra:',
          error
        );

        setErroPagina(
          `Não foi possível excluir a regra: ${error.message}`
        );

        return;
      }

      setRegras((atual) =>
        atual.filter(
          (item) =>
            item.id !== regra.id
        )
      );

      setMensagem(
        'Regra excluída com sucesso.'
      );
    } catch (error) {
      console.error(
        'Erro inesperado ao excluir regra:',
        error
      );

      setErroPagina(
        'Não foi possível excluir a regra.'
      );
    } finally {
      setProcessandoId(null);
    }
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <View style={styles.container}>
      <WebSidebar active="regras" />

      <View style={styles.content}>
        {/* ============================================
            CABEÇALHO
        ============================================ */}

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Regras
            </Text>

            <Text style={styles.subtitle}>
              Gerencie as regras e orientações do condomínio.
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              style={styles.refreshButton}
              onPress={carregarRegras}
              disabled={carregando}
            >
              <RefreshCw
                size={17}
                color={colors.primary}
              />

              <Text
                style={styles.refreshText}
              >
                Atualizar
              </Text>
            </Pressable>

            <Pressable
              style={styles.novaButton}
              onPress={abrirNovaRegra}
            >
              <Plus
                size={18}
                color="#FFFFFF"
              />

              <Text
                style={styles.novaButtonText}
              >
                Nova regra
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ============================================
            MENSAGENS
        ============================================ */}

        {!!mensagem && (
          <View style={styles.successBox}>
            <CheckCircle2
              size={17}
              color="#15803D"
            />

            <Text
              style={styles.successText}
            >
              {mensagem}
            </Text>
          </View>
        )}

        {!!erroPagina && (
          <View style={styles.errorBox}>
            <XCircle
              size={17}
              color={colors.danger}
            />

            <Text style={styles.errorText}>
              {erroPagina}
            </Text>
          </View>
        )}

        {/* ============================================
            RESUMO
        ============================================ */}

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <View
              style={styles.summaryIcon}
            >
              <BookOpen
                size={20}
                color={colors.primary}
              />
            </View>

            <View>
              <Text
                style={styles.summaryLabel}
              >
                Total de regras
              </Text>

              <Text
                style={styles.summaryValue}
              >
                {total}
              </Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View
              style={[
                styles.summaryIcon,
                styles.summaryIconGreen,
              ]}
            >
              <CheckCircle2
                size={20}
                color="#15803D"
              />
            </View>

            <View>
              <Text
                style={styles.summaryLabel}
              >
                Ativas
              </Text>

              <Text
                style={styles.summaryValue}
              >
                {ativas}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.summaryCard,
              styles.summaryCardLast,
            ]}
          >
            <View
              style={[
                styles.summaryIcon,
                styles.summaryIconRed,
              ]}
            >
              <XCircle
                size={20}
                color={colors.danger}
              />
            </View>

            <View>
              <Text
                style={styles.summaryLabel}
              >
                Inativas
              </Text>

              <Text
                style={styles.summaryValue}
              >
                {inativas}
              </Text>
            </View>
          </View>
        </View>

        {/* ============================================
            BUSCA
        ============================================ */}

        <View style={styles.searchArea}>
          <Search
            size={18}
            color={colors.textSecondary}
          />

          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar regra..."
            placeholderTextColor={
              colors.textLight
            }
            style={styles.searchInput}
          />
        </View>

        {/* ============================================
            LISTA
        ============================================ */}

        <ScrollView
          style={styles.list}
          contentContainerStyle={
            styles.listContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          {carregando ? (
            <View style={styles.loadingArea}>
              <ActivityIndicator
                size="large"
                color={colors.primary}
              />

              <Text
                style={styles.loadingText}
              >
                Carregando regras...
              </Text>
            </View>
          ) : regrasFiltradas.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <BookOpen
                  size={26}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.emptyTitle}>
                {busca
                  ? 'Nenhuma regra encontrada'
                  : 'Nenhuma regra cadastrada'}
              </Text>

              <Text style={styles.emptyText}>
                {busca
                  ? 'Tente pesquisar por outro termo.'
                  : 'Clique em "Nova regra" para cadastrar a primeira regra do condomínio.'}
              </Text>
            </View>
          ) : (
            regrasFiltradas.map(
              (regra) => (
                <View
                  key={regra.id}
                  style={styles.ruleCard}
                >
                  <View
                    style={styles.ruleTop}
                  >
                    <View
                      style={
                        styles.ruleIcon
                      }
                    >
                      <BookOpen
                        size={19}
                        color={
                          colors.primary
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.ruleContent
                      }
                    >
                      <View
                        style={
                          styles.ruleTitleRow
                        }
                      >
                        <Text
                          style={
                            styles.ruleTitle
                          }
                        >
                          {regra.titulo}
                        </Text>

                        <View
                          style={[
                            styles.statusBadge,
                            regra.ativa
                              ? styles.statusActive
                              : styles.statusInactive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              regra.ativa
                                ? styles.statusTextActive
                                : styles.statusTextInactive,
                            ]}
                          >
                            {regra.ativa
                              ? 'Ativa'
                              : 'Inativa'}
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={
                          styles.categoryText
                        }
                      >
                        {categoriaLabel(
                          regra.categoria
                        )}
                      </Text>

                      <Text
                        style={
                          styles.ruleDescription
                        }
                      >
                        {regra.descricao}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={
                      styles.ruleActions
                    }
                  >
                    <Pressable
                      style={[
                        styles.actionButton,
                        regra.ativa
                          ? styles.disableButton
                          : styles.enableButton,
                      ]}
                      disabled={
                        processandoId ===
                        regra.id
                      }
                      onPress={() =>
                        alterarStatus(regra)
                      }
                    >
                      {processandoId ===
                      regra.id ? (
                        <ActivityIndicator
                          size="small"
                          color={
                            colors.primary
                          }
                        />
                      ) : regra.ativa ? (
                        <XCircle
                          size={15}
                          color="#B45309"
                        />
                      ) : (
                        <CheckCircle2
                          size={15}
                          color="#15803D"
                        />
                      )}

                      <Text
                        style={[
                          styles.actionText,
                          {
                            color: regra.ativa
                              ? '#B45309'
                              : '#15803D',
                          },
                        ]}
                      >
                        {regra.ativa
                          ? 'Desativar'
                          : 'Ativar'}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={
                        styles.actionButton
                      }
                      onPress={() =>
                        editarRegra(regra)
                      }
                      disabled={
                        processandoId ===
                        regra.id
                      }
                    >
                      <Edit3
                        size={15}
                        color={
                          colors.primary
                        }
                      />

                      <Text
                        style={[
                          styles.actionText,
                          {
                            color:
                              colors.primary,
                          },
                        ]}
                      >
                        Editar
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.actionButton,
                        styles.deleteButton,
                      ]}
                      onPress={() =>
                        excluirRegra(regra)
                      }
                      disabled={
                        processandoId ===
                        regra.id
                      }
                    >
                      <Trash2
                        size={15}
                        color={
                          colors.danger
                        }
                      />

                      <Text
                        style={[
                          styles.actionText,
                          {
                            color:
                              colors.danger,
                          },
                        ]}
                      >
                        Excluir
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )
            )
          )}
        </ScrollView>
      </View>

      {/* ==============================================
          MODAL
      ============================================== */}

      <Modal
        visible={modalAberto}
        transparent
        animationType="fade"
        onRequestClose={fecharModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
              keyboardShouldPersistTaps="handled"
            >
              {/* CABEÇALHO */}

              <View
                style={styles.modalHeader}
              >
                <View>
                  <Text
                    style={styles.modalTitle}
                  >
                    {regraEditando
                      ? 'Editar regra'
                      : 'Nova regra'}
                  </Text>

                  <Text
                    style={
                      styles.modalSubtitle
                    }
                  >
                    Preencha as informações abaixo.
                  </Text>
                </View>

                <Pressable
                  style={styles.closeButton}
                  onPress={fecharModal}
                  disabled={salvando}
                >
                  <X
                    size={20}
                    color={
                      colors.textSecondary
                    }
                  />
                </Pressable>
              </View>

              {/* TÍTULO */}

              <Text style={styles.label}>
                Título
              </Text>

              <TextInput
                value={titulo}
                onChangeText={(valor) => {
                  setTitulo(valor);

                  if (erro) {
                    setErro('');
                  }
                }}
                placeholder="Ex.: Horário de silêncio"
                placeholderTextColor={
                  colors.textLight
                }
                style={styles.input}
                maxLength={120}
                editable={!salvando}
              />

              {/* CATEGORIA */}

              <Text style={styles.label}>
                Categoria
              </Text>

              <View
                style={styles.categorias}
              >
                {categorias.map(
                  (item) => (
                    <Pressable
                      key={item}
                      style={[
                        styles.categoriaButton,
                        categoria === item &&
                          styles.categoriaButtonAtiva,
                      ]}
                      onPress={() =>
                        setCategoria(item)
                      }
                      disabled={salvando}
                    >
                      <Text
                        style={[
                          styles.categoriaButtonText,
                          categoria ===
                            item &&
                            styles.categoriaButtonTextAtiva,
                        ]}
                      >
                        {categoriaLabel(
                          item
                        )}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>

              {/* DESCRIÇÃO */}

              <Text style={styles.label}>
                Descrição
              </Text>

              <TextInput
                value={descricao}
                onChangeText={(valor) => {
                  setDescricao(valor);

                  if (erro) {
                    setErro('');
                  }
                }}
                placeholder="Digite a regra ou orientação..."
                placeholderTextColor={
                  colors.textLight
                }
                style={[
                  styles.input,
                  styles.descriptionInput,
                ]}
                multiline
                textAlignVertical="top"
                maxLength={1500}
                editable={!salvando}
              />

              <Text
                style={
                  styles.characterCount
                }
              >
                {descricao.length}/1500
              </Text>

              {!!erro && (
                <View
                  style={
                    styles.modalErrorBox
                  }
                >
                  <XCircle
                    size={16}
                    color={colors.danger}
                  />

                  <Text
                    style={
                      styles.modalErrorText
                    }
                  >
                    {erro}
                  </Text>
                </View>
              )}

              {/* BOTÕES */}

              <View
                style={
                  styles.modalActions
                }
              >
                <Pressable
                  style={
                    styles.cancelButton
                  }
                  onPress={fecharModal}
                  disabled={salvando}
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
                      styles.buttonDisabled,
                  ]}
                  onPress={salvarRegra}
                  disabled={salvando}
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
                        {regraEditando
                          ? 'Salvar alterações'
                          : 'Criar regra'}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    backgroundColor: colors.background,
  },

  content: {
    flex: 1,
    minWidth: 0,
    paddingTop: 28,
    paddingHorizontal: 30,
  },

  // ===================================================
  // CABEÇALHO
  // ===================================================

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 5,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  refreshButton: {
    minHeight: 42,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
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

  novaButton: {
    minHeight: 42,
    paddingHorizontal: 17,
    borderRadius: 10,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  novaButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 7,
  },

  // ===================================================
  // MENSAGENS
  // ===================================================

  successBox: {
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  successText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 8,
  },

  errorBox: {
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 8,
  },

  // ===================================================
  // RESUMO
  // ===================================================

  summaryRow: {
    flexDirection: 'row',
    marginBottom: 18,
  },

  summaryCard: {
    flex: 1,
    minHeight: 86,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },

  summaryCardLast: {
    marginRight: 0,
  },

  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  summaryIconGreen: {
    backgroundColor: '#DCFCE7',
  },

  summaryIconRed: {
    backgroundColor: colors.dangerLight,
  },

  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
  },

  summaryValue: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '800',
    marginTop: 3,
  },

  // ===================================================
  // BUSCA
  // ===================================================

  searchArea: {
    minHeight: 46,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 18,
  },

  searchInput: {
    flex: 1,
    height: 44,
    color: colors.text,
    fontSize: 11,
    marginLeft: 9,

    outlineStyle: 'none',
  } as any,

  // ===================================================
  // LISTA
  // ===================================================

  list: {
    flex: 1,
  },

  listContent: {
    paddingBottom: 50,
  },

  loadingArea: {
    minHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 10,
  },

  emptyCard: {
    minHeight: 260,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  emptyIcon: {
    width: 55,
    height: 55,
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },

  emptyText: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
    textAlign: 'center',
    maxWidth: 360,
    marginTop: 6,
  },

  ruleCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    marginBottom: 11,
    overflow: 'hidden',
  },

  ruleTop: {
    padding: 17,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  ruleIcon: {
    width: 44,
    height: 44,
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  ruleContent: {
    flex: 1,
  },

  ruleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  ruleTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    marginRight: 9,
  },

  categoryText: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: '800',
    marginTop: 5,
  },

  ruleDescription: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 16,
    marginTop: 8,
  },

  statusBadge: {
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  statusActive: {
    backgroundColor: '#DCFCE7',
  },

  statusInactive: {
    backgroundColor: '#F1F5F9',
  },

  statusText: {
    fontSize: 7,
    fontWeight: '800',
  },

  statusTextActive: {
    color: '#15803D',
  },

  statusTextInactive: {
    color: '#64748B',
  },

  // ===================================================
  // AÇÕES
  // ===================================================

  ruleActions: {
    minHeight: 50,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 13,
  },

  actionButton: {
    minHeight: 34,
    borderRadius: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
  },

  disableButton: {
    backgroundColor: '#FFFBEB',
  },

  enableButton: {
    backgroundColor: '#F0FDF4',
  },

  deleteButton: {
    backgroundColor: colors.dangerLight,
  },

  actionText: {
    fontSize: 8,
    fontWeight: '800',
    marginLeft: 5,
  },

  // ===================================================
  // MODAL
  // ===================================================

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },

  modalCard: {
    width: '100%',
    maxWidth: 610,
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 22,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },

  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 4,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  label: {
    color: colors.text,
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 7,
    marginTop: 4,
  },

  input: {
    width: '100%',
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 13,
    color: colors.text,
    fontSize: 10,
    marginBottom: 16,

    outlineStyle: 'none',
  } as any,

  descriptionInput: {
    minHeight: 125,
    paddingTop: 12,
    paddingBottom: 12,
  },

  characterCount: {
    color: colors.textLight,
    fontSize: 8,
    textAlign: 'right',
    marginTop: -10,
    marginBottom: 16,
  },

  // ===================================================
  // CATEGORIAS
  // ===================================================

  categorias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },

  categoriaButton: {
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
    marginBottom: 7,
  },

  categoriaButtonAtiva: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  categoriaButtonText: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
  },

  categoriaButtonTextAtiva: {
    color: colors.primary,
    fontWeight: '800',
  },

  // ===================================================
  // ERRO MODAL
  // ===================================================

  modalErrorBox: {
    minHeight: 40,
    borderRadius: 9,
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  modalErrorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 9,
    fontWeight: '700',
    marginLeft: 7,
  },

  // ===================================================
  // BOTÕES MODAL
  // ===================================================

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 5,
  },

  cancelButton: {
    minHeight: 42,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '800',
  },

  saveButton: {
    minHeight: 42,
    borderRadius: 9,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 7,
  },

  buttonDisabled: {
    opacity: 0.6,
  },
});