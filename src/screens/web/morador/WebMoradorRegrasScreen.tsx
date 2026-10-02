import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  BookOpen,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Home,
  Info,
  PawPrint,
  RefreshCw,
  ShieldCheck,
  Users,
  Volume2,
} from 'lucide-react-native';

import { colors } from '../../../theme/theme';
import WebMoradorSidebar from '../../../components/WebMoradorSidebar';
import { supabase } from '../../../services/supabase';

// =====================================================
// TIPOS
// =====================================================

type Categoria =
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
  categoria: Categoria;
  ativa: boolean;
  created_at: string;
  updated_at: string;
};

type Filtro =
  | 'todas'
  | Categoria;

// =====================================================
// CATEGORIA
// =====================================================

function categoriaTexto(
  categoria: Categoria
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
// ÍCONE DA CATEGORIA
// =====================================================

function CategoriaIcon({
  categoria,
  size = 19,
}: {
  categoria: Categoria;
  size?: number;
}) {
  switch (categoria) {
    case 'geral':
      return (
        <Users
          size={size}
          color={colors.primary}
        />
      );

    case 'silencio':
      return (
        <Volume2
          size={size}
          color={colors.primary}
        />
      );

    case 'areas_comuns':
      return (
        <Home
          size={size}
          color={colors.primary}
        />
      );

    case 'animais':
      return (
        <PawPrint
          size={size}
          color={colors.primary}
        />
      );

    case 'estacionamento':
      return (
        <Car
          size={size}
          color={colors.primary}
        />
      );

    case 'seguranca':
      return (
        <ShieldCheck
          size={size}
          color={colors.primary}
        />
      );

    default:
      return (
        <BookOpen
          size={size}
          color={colors.primary}
        />
      );
  }
}

// =====================================================
// TELA
// =====================================================

export default function WebMoradorRegrasScreen() {
  const [regras, setRegras] =
    useState<Regra[]>([]);

  const [filtro, setFiltro] =
    useState<Filtro>('todas');

  const [abertas, setAbertas] =
    useState<string[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState('');

  // ===================================================
  // CARREGAR REGRAS DO SUPABASE
  // ===================================================

  useEffect(() => {
    carregarRegras();
  }, []);

  async function carregarRegras() {
    try {
      setCarregando(true);
      setErro('');

      const {
        data,
        error,
      } = await supabase
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
        .eq('ativa', true)
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        console.error(
          'Erro ao carregar regras:',
          error
        );

        setErro(
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

      setErro(
        'Não foi possível carregar as regras.'
      );
    } finally {
      setCarregando(false);
    }
  }

  // ===================================================
  // FILTRAR
  // ===================================================

  const regrasFiltradas =
    useMemo(() => {
      if (filtro === 'todas') {
        return regras;
      }

      return regras.filter(
        (regra) =>
          regra.categoria === filtro
      );
    }, [filtro, regras]);

  // ===================================================
  // CONTADORES
  // ===================================================

  const categorias =
    useMemo(() => {
      return {
        geral: regras.filter(
          (item) =>
            item.categoria === 'geral'
        ).length,

        silencio: regras.filter(
          (item) =>
            item.categoria === 'silencio'
        ).length,

        areas_comuns: regras.filter(
          (item) =>
            item.categoria ===
            'areas_comuns'
        ).length,

        animais: regras.filter(
          (item) =>
            item.categoria === 'animais'
        ).length,

        estacionamento: regras.filter(
          (item) =>
            item.categoria ===
            'estacionamento'
        ).length,

        seguranca: regras.filter(
          (item) =>
            item.categoria ===
            'seguranca'
        ).length,

        outro: regras.filter(
          (item) =>
            item.categoria === 'outro'
        ).length,
      };
    }, [regras]);

  // ===================================================
  // ABRIR / FECHAR
  // ===================================================

  function alternarRegra(
    id: string
  ) {
    setAbertas((atual) => {
      if (atual.includes(id)) {
        return atual.filter(
          (item) => item !== id
        );
      }

      return [...atual, id];
    });
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <View style={styles.container}>
      <WebMoradorSidebar active="regras" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={
          styles.contentContainer
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* ============================================
            CABEÇALHO
        ============================================ */}

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Regras do Condomínio
            </Text>

            <Text style={styles.subtitle}>
              Consulte as normas de convivência e utilização dos espaços.
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

            <View style={styles.headerIcon}>
              <BookOpen
                size={24}
                color={colors.primary}
              />
            </View>
          </View>
        </View>

        {/* ============================================
            AVISO
        ============================================ */}

        <View style={styles.notice}>
          <View style={styles.noticeIcon}>
            <Info
              size={20}
              color={colors.primary}
            />
          </View>

          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>
              Importante
            </Text>

            <Text style={styles.noticeText}>
              As regras ajudam a manter uma convivência organizada e segura para todos.
              Consulte esta área sempre que tiver dúvidas.
            </Text>
          </View>
        </View>

        {/* ============================================
            ERRO
        ============================================ */}

        {!!erro && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              {erro}
            </Text>
          </View>
        )}

        {/* ============================================
            RESUMO
        ============================================ */}

        <View style={styles.summary}>
          <SummaryCard
            icon={
              <BookOpen
                size={20}
                color={colors.primary}
              />
            }
            titulo="Total de regras"
            valor={regras.length}
          />

          <SummaryCard
            icon={
              <Home
                size={20}
                color={colors.primary}
              />
            }
            titulo="Áreas comuns"
            valor={categorias.areas_comuns}
          />

          <SummaryCard
            icon={
              <ShieldCheck
                size={20}
                color={colors.primary}
              />
            }
            titulo="Segurança"
            valor={categorias.seguranca}
          />

          <SummaryCard
            icon={
              <Volume2
                size={20}
                color={colors.primary}
              />
            }
            titulo="Silêncio"
            valor={categorias.silencio}
          />
        </View>

        {/* ============================================
            FILTROS
        ============================================ */}

        <View style={styles.filtersBox}>
          <Text style={styles.filtersTitle}>
            Categorias
          </Text>

          <View style={styles.filters}>
            <FilterButton
              titulo="Todas"
              active={filtro === 'todas'}
              onPress={() =>
                setFiltro('todas')
              }
            />

            <FilterButton
              titulo="Geral"
              active={filtro === 'geral'}
              onPress={() =>
                setFiltro('geral')
              }
            />

            <FilterButton
              titulo="Silêncio"
              active={filtro === 'silencio'}
              onPress={() =>
                setFiltro('silencio')
              }
            />

            <FilterButton
              titulo="Áreas comuns"
              active={
                filtro === 'areas_comuns'
              }
              onPress={() =>
                setFiltro('areas_comuns')
              }
            />

            <FilterButton
              titulo="Animais"
              active={filtro === 'animais'}
              onPress={() =>
                setFiltro('animais')
              }
            />

            <FilterButton
              titulo="Estacionamento"
              active={
                filtro ===
                'estacionamento'
              }
              onPress={() =>
                setFiltro(
                  'estacionamento'
                )
              }
            />

            <FilterButton
              titulo="Segurança"
              active={
                filtro === 'seguranca'
              }
              onPress={() =>
                setFiltro('seguranca')
              }
            />

            <FilterButton
              titulo="Outro"
              active={filtro === 'outro'}
              onPress={() =>
                setFiltro('outro')
              }
            />
          </View>
        </View>

        {/* ============================================
            TÍTULO DA LISTA
        ============================================ */}

        <View style={styles.sectionHeader}>
          <View>
            <Text
              style={styles.sectionTitle}
            >
              Normas e orientações
            </Text>

            <Text
              style={styles.sectionSubtitle}
            >
              Clique em uma regra para visualizar todos os detalhes.
            </Text>
          </View>

          <Text style={styles.resultCount}>
            {regrasFiltradas.length}{' '}
            {regrasFiltradas.length === 1
              ? 'regra'
              : 'regras'}
          </Text>
        </View>

        {/* ============================================
            CARREGANDO
        ============================================ */}

        {carregando ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />

            <Text style={styles.loadingText}>
              Carregando regras...
            </Text>
          </View>
        ) : regrasFiltradas.length === 0 ? (
          /* ==========================================
              VAZIO
          ========================================== */

          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <BookOpen
                size={27}
                color={colors.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              {filtro === 'todas'
                ? 'Nenhuma regra publicada'
                : 'Nenhuma regra nesta categoria'}
            </Text>

            <Text style={styles.emptyText}>
              {filtro === 'todas'
                ? 'A administração ainda não publicou nenhuma regra para os moradores.'
                : 'Não existem regras ativas nesta categoria no momento.'}
            </Text>
          </View>
        ) : (
          /* ==========================================
              REGRAS
          ========================================== */

          <View style={styles.rulesList}>
            {regrasFiltradas.map(
              (regra) => {
                const aberta =
                  abertas.includes(
                    regra.id
                  );

                return (
                  <Pressable
                    key={regra.id}
                    style={[
                      styles.ruleCard,
                      aberta &&
                        styles.ruleCardOpen,
                    ]}
                    onPress={() =>
                      alternarRegra(
                        regra.id
                      )
                    }
                  >
                    <View
                      style={styles.ruleTop}
                    >
                      <View
                        style={
                          styles.ruleIcon
                        }
                      >
                        <CategoriaIcon
                          categoria={
                            regra.categoria
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.ruleContent
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
                          style={
                            styles.categoryRow
                          }
                        >
                          <Text
                            style={
                              styles.categoryText
                            }
                          >
                            {categoriaTexto(
                              regra.categoria
                            )}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={
                          styles.chevron
                        }
                      >
                        {aberta ? (
                          <ChevronUp
                            size={18}
                            color={
                              colors.textSecondary
                            }
                          />
                        ) : (
                          <ChevronDown
                            size={18}
                            color={
                              colors.textSecondary
                            }
                          />
                        )}
                      </View>
                    </View>

                    {aberta && (
                      <View
                        style={
                          styles.ruleDescriptionBox
                        }
                      >
                        <View
                          style={
                            styles.descriptionIcon
                          }
                        >
                          <CheckCircle2
                            size={16}
                            color="#15803D"
                          />
                        </View>

                        <Text
                          style={
                            styles.ruleDescription
                          }
                        >
                          {regra.descricao}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              }
            )}
          </View>
        )}

        {/* ============================================
            RODAPÉ
        ============================================ */}

        <View style={styles.footerInfo}>
          <Volume2
            size={18}
            color={colors.primary}
          />

          <View style={styles.footerContent}>
            <Text style={styles.footerTitle}>
              Ficou com alguma dúvida?
            </Text>

            <Text style={styles.footerText}>
              Utilize o Chat com a Administração para solicitar esclarecimentos sobre as regras do condomínio.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// =====================================================
// RESUMO
// =====================================================

function SummaryCard({
  icon,
  titulo,
  valor,
}: {
  icon: React.ReactNode;
  titulo: string;
  valor: number;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryIcon}>
        {icon}
      </View>

      <View>
        <Text style={styles.summaryLabel}>
          {titulo}
        </Text>

        <Text style={styles.summaryValue}>
          {valor}
        </Text>
      </View>
    </View>
  );
}

// =====================================================
// FILTRO
// =====================================================

function FilterButton({
  titulo,
  active,
  onPress,
}: {
  titulo: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.filterButton,
        active &&
          styles.filterButtonActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterText,
          active &&
            styles.filterTextActive,
        ]}
      >
        {titulo}
      </Text>
    </Pressable>
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
  },

  contentContainer: {
    padding: 30,
    paddingBottom: 60,
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
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
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 5,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  refreshButton: {
    height: 42,
    paddingHorizontal: 13,
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
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 6,
  },

  // ===================================================
  // AVISO
  // ===================================================

  notice: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  noticeIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  noticeContent: {
    flex: 1,
  },

  noticeTitle: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
  },

  noticeText: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
    marginTop: 4,
  },

  // ===================================================
  // ERRO
  // ===================================================

  errorBox: {
    backgroundColor: colors.dangerLight,
    borderRadius: 11,
    padding: 13,
    marginBottom: 18,
  },

  errorText: {
    color: colors.danger,
    fontSize: 9,
    fontWeight: '700',
  },

  // ===================================================
  // RESUMO
  // ===================================================

  summary: {
    flexDirection: 'row',
    marginBottom: 20,
  },

  summaryCard: {
    flex: 1,
    minHeight: 92,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 15,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
  },

  summaryValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 3,
  },

  // ===================================================
  // FILTROS
  // ===================================================

  filtersBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 15,
    marginBottom: 24,
  },

  filtersTitle: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 11,
  },

  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  filterButton: {
    minHeight: 35,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
    marginBottom: 6,
  },

  filterButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  filterText: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
  },

  filterTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },

  // ===================================================
  // SEÇÃO
  // ===================================================

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 4,
  },

  resultCount: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
  },

  // ===================================================
  // CARREGANDO / VAZIO
  // ===================================================

  loadingArea: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 10,
  },

  emptyCard: {
    minHeight: 250,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
    marginBottom: 20,
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
    fontSize: 13,
    fontWeight: '800',
  },

  emptyText: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
    textAlign: 'center',
    maxWidth: 380,
    marginTop: 6,
  },

  // ===================================================
  // REGRAS
  // ===================================================

  rulesList: {
    marginBottom: 20,
  },

  ruleCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },

  ruleCardOpen: {
    borderColor: colors.primary,
  },

  ruleTop: {
    minHeight: 80,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  ruleIcon: {
    width: 43,
    height: 43,
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  ruleContent: {
    flex: 1,
  },

  ruleTitle: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
  },

  categoryRow: {
    marginTop: 6,
  },

  categoryText: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
  },

  chevron: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },

  ruleDescriptionBox: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    padding: 15,
    flexDirection: 'row',
  },

  descriptionIcon: {
    width: 25,
    alignItems: 'flex-start',
    paddingTop: 1,
  },

  ruleDescription: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 16,
  },

  // ===================================================
  // RODAPÉ
  // ===================================================

  footerInfo: {
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  footerContent: {
    flex: 1,
    marginLeft: 11,
  },

  footerTitle: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
  },

  footerText: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
    marginTop: 4,
  },
});