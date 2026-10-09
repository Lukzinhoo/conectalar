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
  useWindowDimensions,
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

import WebLayout from '../../../components/WebLayout';
import WebSidebar from '../../../components/WebSidebar';

import { colors } from '../../../theme/theme';
import { supabase } from '../../../services/supabase';

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

const categorias: CategoriaRegra[] = [
  'geral',
  'silencio',
  'areas_comuns',
  'animais',
  'estacionamento',
  'seguranca',
  'outro',
];

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

export default function WebRegrasScreen() {
  const { width } = useWindowDimensions();

  const isMobile = width < 768;
  const isTablet =
    width >= 768 && width < 1100;

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

  useEffect(() => {
    carregarRegras();
  }, []);

  async function carregarRegras() {
    try {
      setCarregando(true);
      setErroPagina('');

      const { data, error } =
        await supabase
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

  const total = regras.length;

  const ativas = regras.filter(
    (regra) => regra.ativa
  ).length;

  const inativas =
    total - ativas;

  const regrasFiltradas =
    useMemo(() => {
      const termo = busca
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

  function abrirNovaRegra() {
    setRegraEditando(null);
    setTitulo('');
    setDescricao('');
    setCategoria('geral');
    setErro('');
    setMensagem('');
    setModalAberto(true);
  }

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

      if (regraEditando) {
        const { data, error } =
          await supabase
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
        const { data, error } =
          await supabase
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

      const { data, error } =
        await supabase
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

  return (
    <WebLayout
      sidebar={
        <WebSidebar active="regras" />
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
            styles.headerTextArea,
            isMobile &&
              styles.headerTextAreaMobile,
          ]}
        >
          <Text
            style={[
              styles.title,
              isMobile &&
                styles.titleMobile,
            ]}
          >
            Regras
          </Text>

          <Text style={styles.subtitle}>
            Gerencie as regras e orientações
            do condomínio.
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
                styles.headerButtonMobile,

              pressed &&
                styles.buttonPressed,
            ]}
            onPress={carregarRegras}
            disabled={carregando}
          >
            {carregando ? (
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
              styles.novaButton,

              isMobile &&
                styles.headerButtonMobile,

              pressed &&
                styles.buttonPressed,
            ]}
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

      {!!mensagem && (
        <View style={styles.successBox}>
          <CheckCircle2
            size={17}
            color="#15803D"
          />

          <Text style={styles.successText}>
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

      <View
        style={[
          styles.summaryRow,

          (isMobile || isTablet) &&
            styles.summaryRowResponsive,
        ]}
      >
        <SummaryCard
          label="Total de regras"
          value={total}
          icon={
            <BookOpen
              size={20}
              color={colors.primary}
            />
          }
          iconStyle={
            styles.summaryIcon
          }
          responsive={
            isMobile || isTablet
          }
        />

        <SummaryCard
          label="Ativas"
          value={ativas}
          icon={
            <CheckCircle2
              size={20}
              color="#15803D"
            />
          }
          iconStyle={[
            styles.summaryIcon,
            styles.summaryIconGreen,
          ]}
          responsive={
            isMobile || isTablet
          }
        />

        <SummaryCard
          label="Inativas"
          value={inativas}
          icon={
            <XCircle
              size={20}
              color={colors.danger}
            />
          }
          iconStyle={[
            styles.summaryIcon,
            styles.summaryIconRed,
          ]}
          responsive={
            isMobile || isTablet
          }
          last
        />
      </View>

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
        <View style={styles.rulesList}>
          {regrasFiltradas.map(
            (regra) => (
              <View
                key={regra.id}
                style={styles.ruleCard}
              >
                <View
                  style={[
                    styles.ruleTop,

                    isMobile &&
                      styles.ruleTopMobile,
                  ]}
                >
                  <View
                    style={styles.ruleIcon}
                  >
                    <BookOpen
                      size={19}
                      color={colors.primary}
                    />
                  </View>

                  <View
                    style={[
                      styles.ruleContent,

                      isMobile &&
                        styles.ruleContentMobile,
                    ]}
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
                  style={[
                    styles.ruleActions,

                    isMobile &&
                      styles.ruleActionsMobile,
                  ]}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionButton,

                      regra.ativa
                        ? styles.disableButton
                        : styles.enableButton,

                      isMobile &&
                        styles.actionButtonMobile,

                      pressed &&
                        styles.buttonPressed,
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
                    style={({ pressed }) => [
                      styles.actionButton,

                      isMobile &&
                        styles.actionButtonMobile,

                      pressed &&
                        styles.buttonPressed,
                    ]}
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
                      color={colors.primary}
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
                    style={({ pressed }) => [
                      styles.actionButton,
                      styles.deleteButton,

                      isMobile &&
                        styles.actionButtonMobile,

                      pressed &&
                        styles.buttonPressed,
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
                      color={colors.danger}
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
          )}
        </View>
      )}

      <Modal
        visible={modalAberto}
        transparent
        animationType="fade"
        onRequestClose={fecharModal}
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
              style={styles.modalHeader}
            >
              <View
                style={
                  styles.modalHeaderText
                }
              >
                <Text
                  style={[
                    styles.modalTitle,

                    isMobile &&
                      styles.modalTitleMobile,
                  ]}
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
                  Preencha as informações
                  abaixo.
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.closeButton,

                  pressed &&
                    styles.buttonPressed,
                ]}
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

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={
                styles.modalScrollContent
              }
              showsVerticalScrollIndicator={
                false
              }
              keyboardShouldPersistTaps="handled"
            >
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
                      style={({
                        pressed,
                      }) => [
                        styles.categoriaButton,

                        categoria ===
                          item &&
                          styles.categoriaButtonAtiva,

                        pressed &&
                          styles.buttonPressed,
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
                    styles.buttonPressed,
                ]}
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
                style={({ pressed }) => [
                  styles.saveButton,

                  isMobile &&
                    styles.modalButtonMobile,

                  salvando &&
                    styles.buttonDisabled,

                  pressed &&
                    styles.buttonPressed,
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
          </View>
        </View>
      </Modal>
    </WebLayout>
  );
}

type SummaryCardProps = {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconStyle: any;
  responsive?: boolean;
  last?: boolean;
};

function SummaryCard({
  label,
  value,
  icon,
  iconStyle,
  responsive,
  last,
}: SummaryCardProps) {
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
      <View style={iconStyle}>
        {icon}
      </View>

      <View style={styles.summaryTextArea}>
        <Text
          style={styles.summaryLabel}
        >
          {label}
        </Text>

        <Text
          style={styles.summaryValue}
        >
          {value}
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
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  headerMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },

  headerTextArea: {
    flex: 1,
    minWidth: 0,
    paddingRight: 20,
  },

  headerTextAreaMobile: {
    paddingRight: 0,
    marginBottom: 14,
  },

  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },

  titleMobile: {
    fontSize: 23,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
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
    fontSize: 11,
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
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 7,
  },

  headerButtonMobile: {
    flex: 1,
    minWidth: 0,
  },

  successBox: {
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  successText: {
    flex: 1,
    color: '#15803D',
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '700',
    marginLeft: 8,
  },

  errorBox: {
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '700',
    marginLeft: 8,
  },

  summaryRow: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 18,
  },

  summaryRowResponsive: {
    flexDirection: 'column',
  },

  summaryCard: {
    flex: 1,
    minWidth: 0,
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

  summaryCardResponsive: {
    width: '100%',
    flex: 0,
    marginRight: 0,
    marginBottom: 10,
    paddingVertical: 12,
  },

  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },

  summaryIconGreen: {
    backgroundColor: '#DCFCE7',
  },

  summaryIconRed: {
    backgroundColor: colors.dangerLight,
  },

  summaryTextArea: {
    flex: 1,
    minWidth: 0,
  },

  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },

  summaryValue: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '800',
    marginTop: 3,
  },

  searchArea: {
    width: '100%',
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
    fontSize: 12,
    marginLeft: 9,
    outlineStyle: 'none',
  } as any,

  loadingArea: {
    minHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 11,
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
    textAlign: 'center',
  },

  emptyText: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    maxWidth: 360,
    marginTop: 6,
  },

  rulesList: {
    width: '100%',
    paddingBottom: 30,
  },

  ruleCard: {
    width: '100%',
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

  ruleTopMobile: {
    padding: 14,
  },

  ruleIcon: {
    width: 44,
    height: 44,
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
    flexShrink: 0,
  },

  ruleContent: {
    flex: 1,
    minWidth: 0,
  },

  ruleContentMobile: {
    minWidth: 0,
  },

  ruleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  ruleTitle: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '800',
    marginRight: 9,
  },

  categoryText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 5,
  },

  ruleDescription: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 17,
    marginTop: 8,
  },

  statusBadge: {
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 2,
  },

  statusActive: {
    backgroundColor: '#DCFCE7',
  },

  statusInactive: {
    backgroundColor: '#F1F5F9',
  },

  statusText: {
    fontSize: 8,
    fontWeight: '800',
  },

  statusTextActive: {
    color: '#15803D',
  },

  statusTextInactive: {
    color: '#64748B',
  },

  ruleActions: {
    minHeight: 50,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 13,
    paddingVertical: 8,
  },

  ruleActionsMobile: {
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
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

  actionButtonMobile: {
    flex: 1,
    minWidth: 0,
    marginLeft: 4,
    marginRight: 4,
    paddingHorizontal: 5,
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
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 5,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },

  modalOverlayMobile: {
    padding: 10,
  },

  modalCard: {
    width: '100%',
    maxWidth: 610,
    height: '90%',
    maxHeight: 700,
    backgroundColor: colors.surface,
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
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexShrink: 0,
    marginBottom: 14,
  },

  modalHeaderText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },

  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },

  modalTitleMobile: {
    fontSize: 18,
  },

  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: colors.background,
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

  label: {
    color: colors.text,
    fontSize: 10,
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
    paddingVertical: 10,
    color: colors.text,
    fontSize: 11,
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
    fontSize: 9,
    textAlign: 'right',
    marginTop: -10,
    marginBottom: 16,
  },

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
    fontSize: 9,
    fontWeight: '700',
  },

  categoriaButtonTextAtiva: {
    color: colors.primary,
    fontWeight: '800',
  },

  modalErrorBox: {
    minHeight: 40,
    borderRadius: 9,
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  modalErrorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '700',
    marginLeft: 7,
  },

  modalActions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexShrink: 0,
    paddingTop: 12,
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  modalActionsMobile: {
    flexDirection: 'column-reverse',
    alignItems: 'stretch',
  },

  cancelButton: {
    minHeight: 44,
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
    fontSize: 10,
    fontWeight: '800',
  },

  saveButton: {
    minHeight: 44,
    borderRadius: 9,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
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
    marginRight: 0,
    marginBottom: 8,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonPressed: {
    opacity: 0.78,
  },
});