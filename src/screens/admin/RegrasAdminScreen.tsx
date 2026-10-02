import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Edit3,
  Plus,
  Trash2,
  X,
} from 'lucide-react-native';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../theme/theme';
import { supabase } from '../../services/supabase';

type Regra = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  ativa: boolean;
  created_at: string;
  updated_at: string;
};

const CATEGORIAS = [
  'Geral',
  'Convivência',
  'Piscina',
  'Churrasqueira',
  'Salão de festas',
  'Estacionamento',
  'Animais',
  'Segurança',
  'Silêncio',
];

export default function RegrasAdminScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [regras, setRegras] = useState<Regra[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [modalCategoria, setModalCategoria] = useState(false);

  const [regraEditando, setRegraEditando] =
    useState<Regra | null>(null);

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('Geral');
  const [ativa, setAtiva] = useState(true);

  const carregarRegras = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('regras')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar regras:', error);

        Alert.alert(
          'Erro',
          'Não foi possível carregar as regras.'
        );

        return;
      }

      setRegras((data ?? []) as Regra[]);
    } catch (error) {
      console.error('Erro ao carregar regras:', error);

      Alert.alert(
        'Erro',
        'Ocorreu um erro ao carregar as regras.'
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setCarregando(true);
      carregarRegras();
    }, [carregarRegras])
  );

  function atualizarLista() {
    setAtualizando(true);
    carregarRegras();
  }

  function limparFormulario() {
    setRegraEditando(null);
    setTitulo('');
    setDescricao('');
    setCategoria('Geral');
    setAtiva(true);
  }

  function abrirNovaRegra() {
    limparFormulario();
    setModalAberto(true);
  }

  function abrirEdicao(regra: Regra) {
    setRegraEditando(regra);
    setTitulo(regra.titulo);
    setDescricao(regra.descricao);
    setCategoria(regra.categoria);
    setAtiva(regra.ativa);
    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) {
      return;
    }

    setModalAberto(false);
    setModalCategoria(false);
    limparFormulario();
  }

  async function salvarRegra() {
    const tituloLimpo = titulo.trim();
    const descricaoLimpa = descricao.trim();

    if (!tituloLimpo) {
      Alert.alert(
        'Título obrigatório',
        'Digite um título para a regra.'
      );
      return;
    }

    if (!descricaoLimpa) {
      Alert.alert(
        'Descrição obrigatória',
        'Digite a descrição da regra.'
      );
      return;
    }

    try {
      setSalvando(true);

      if (regraEditando) {
        const { error } = await supabase
          .from('regras')
          .update({
            titulo: tituloLimpo,
            descricao: descricaoLimpa,
            categoria,
            ativa,
            updated_at: new Date().toISOString(),
          })
          .eq('id', regraEditando.id);

        if (error) {
          console.error('Erro ao editar regra:', error);

          Alert.alert(
            'Erro',
            'Não foi possível atualizar a regra.'
          );

          return;
        }

        Alert.alert(
          'Regra atualizada',
          'As alterações foram salvas com sucesso.'
        );
      } else {
        const { error } = await supabase
          .from('regras')
          .insert({
            titulo: tituloLimpo,
            descricao: descricaoLimpa,
            categoria,
            ativa,
          });

        if (error) {
          console.error('Erro ao criar regra:', error);

          Alert.alert(
            'Erro',
            'Não foi possível criar a regra.'
          );

          return;
        }

        Alert.alert(
          'Regra criada',
          'A nova regra foi adicionada com sucesso.'
        );
      }

      setModalAberto(false);
      limparFormulario();
      await carregarRegras();
    } catch (error) {
      console.error('Erro ao salvar regra:', error);

      Alert.alert(
        'Erro',
        'Ocorreu um erro ao salvar a regra.'
      );
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusao(regra: Regra) {
    Alert.alert(
      'Excluir regra',
      `Deseja realmente excluir "${regra.titulo}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => excluirRegra(regra.id),
        },
      ]
    );
  }

  async function excluirRegra(id: string) {
    try {
      const { error } = await supabase
        .from('regras')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir regra:', error);

        Alert.alert(
          'Erro',
          'Não foi possível excluir a regra.'
        );

        return;
      }

      setRegras((listaAtual) =>
        listaAtual.filter((regra) => regra.id !== id)
      );
    } catch (error) {
      console.error('Erro ao excluir regra:', error);

      Alert.alert(
        'Erro',
        'Ocorreu um erro ao excluir a regra.'
      );
    }
  }

  async function alterarStatus(regra: Regra) {
    const novoStatus = !regra.ativa;

    setRegras((listaAtual) =>
      listaAtual.map((item) =>
        item.id === regra.id
          ? { ...item, ativa: novoStatus }
          : item
      )
    );

    const { error } = await supabase
      .from('regras')
      .update({
        ativa: novoStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', regra.id);

    if (error) {
      console.error('Erro ao alterar status:', error);

      setRegras((listaAtual) =>
        listaAtual.map((item) =>
          item.id === regra.id
            ? { ...item, ativa: regra.ativa }
            : item
        )
      );

      Alert.alert(
        'Erro',
        'Não foi possível alterar o status da regra.'
      );
    }
  }

  return (
    <View style={styles.container}>
      {/* CABEÇALHO */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 20) + 8,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft
              size={21}
              color="#FFFFFF"
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.headerLabel}>
              ADMINISTRAÇÃO
            </Text>

            <Text style={styles.headerTitle}>
              Regras do Condomínio
            </Text>

            <Text style={styles.headerDescription}>
              Cadastre e gerencie as regras para os moradores.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <BookOpen
              size={25}
              color="#FFFFFF"
            />
          </View>
        </View>
      </View>

      {/* CONTEÚDO */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              Math.max(insets.bottom, 20) + 30,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={atualizarLista}
          />
        }
      >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.sectionTitle}>
              Regras cadastradas
            </Text>

            <Text style={styles.sectionSubtitle}>
              {regras.length}{' '}
              {regras.length === 1
                ? 'regra cadastrada'
                : 'regras cadastradas'}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
            ]}
            onPress={abrirNovaRegra}
          >
            <Plus
              size={18}
              color="#FFFFFF"
            />

            <Text style={styles.addButtonText}>
              Nova regra
            </Text>
          </Pressable>
        </View>

        {carregando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />

            <Text style={styles.loadingText}>
              Carregando regras...
            </Text>
          </View>
        ) : regras.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <BookOpen
                size={30}
                color={colors.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              Nenhuma regra cadastrada
            </Text>

            <Text style={styles.emptyDescription}>
              Cadastre a primeira regra do condomínio para
              disponibilizá-la aos moradores.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.emptyButton,
                pressed && styles.pressed,
              ]}
              onPress={abrirNovaRegra}
            >
              <Plus
                size={18}
                color="#FFFFFF"
              />

              <Text style={styles.emptyButtonText}>
                Cadastrar regra
              </Text>
            </Pressable>
          </View>
        ) : (
          regras.map((regra) => (
            <View
              key={regra.id}
              style={styles.ruleCard}
            >
              <View style={styles.ruleHeader}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>
                    {regra.categoria}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    regra.ativa
                      ? styles.statusActive
                      : styles.statusInactive,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      regra.ativa
                        ? styles.statusDotActive
                        : styles.statusDotInactive,
                    ]}
                  />

                  <Text
                    style={[
                      styles.statusText,
                      regra.ativa
                        ? styles.statusTextActive
                        : styles.statusTextInactive,
                    ]}
                  >
                    {regra.ativa ? 'Ativa' : 'Inativa'}
                  </Text>
                </View>
              </View>

              <Text style={styles.ruleTitle}>
                {regra.titulo}
              </Text>

              <Text style={styles.ruleDescription}>
                {regra.descricao}
              </Text>

              <View style={styles.ruleDivider} />

              <View style={styles.ruleActions}>
                <View style={styles.switchArea}>
                  <Switch
                    value={regra.ativa}
                    onValueChange={() =>
                      alterarStatus(regra)
                    }
                    trackColor={{
                      false: '#CBD5E1',
                      true: '#93C5FD',
                    }}
                    thumbColor={
                      regra.ativa
                        ? colors.primary
                        : '#F8FAFC'
                    }
                  />

                  <Text style={styles.switchText}>
                    {regra.ativa
                      ? 'Regra visível'
                      : 'Regra oculta'}
                  </Text>
                </View>

                <View style={styles.actionButtons}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.editButton,
                      pressed && styles.pressed,
                    ]}
                    onPress={() =>
                      abrirEdicao(regra)
                    }
                  >
                    <Edit3
                      size={17}
                      color={colors.primary}
                    />
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.deleteButton,
                      pressed && styles.pressed,
                    ]}
                    onPress={() =>
                      confirmarExclusao(regra)
                    }
                  >
                    <Trash2
                      size={17}
                      color="#DC2626"
                    />
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* MODAL CRIAR / EDITAR */}
      <Modal
        visible={modalAberto}
        transparent
        animationType="slide"
        onRequestClose={fecharModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              {
                paddingBottom:
                  Math.max(insets.bottom, 18),
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalLabel}>
                  {regraEditando
                    ? 'EDITAR REGRA'
                    : 'NOVA REGRA'}
                </Text>

                <Text style={styles.modalTitle}>
                  {regraEditando
                    ? 'Editar regra'
                    : 'Cadastrar regra'}
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.pressed,
                ]}
                onPress={fecharModal}
              >
                <X
                  size={21}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.inputLabel}>
                Título
              </Text>

              <TextInput
                style={styles.input}
                value={titulo}
                onChangeText={setTitulo}
                placeholder="Ex: Horário de silêncio"
                placeholderTextColor="#94A3B8"
                maxLength={100}
              />

              <Text style={styles.inputLabel}>
                Categoria
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.selectInput,
                  pressed && styles.pressed,
                ]}
                onPress={() =>
                  setModalCategoria(true)
                }
              >
                <Text style={styles.selectText}>
                  {categoria}
                </Text>

                <ChevronRight
                  size={19}
                  color={colors.textSecondary}
                />
              </Pressable>

              <Text style={styles.inputLabel}>
                Descrição
              </Text>

              <TextInput
                style={[
                  styles.input,
                  styles.descriptionInput,
                ]}
                value={descricao}
                onChangeText={setDescricao}
                placeholder="Digite a regra do condomínio..."
                placeholderTextColor="#94A3B8"
                multiline
                textAlignVertical="top"
                maxLength={1000}
              />

              <View style={styles.activeContainer}>
                <View style={styles.activeText}>
                  <Text style={styles.activeTitle}>
                    Regra ativa
                  </Text>

                  <Text style={styles.activeDescription}>
                    Quando ativa, a regra ficará disponível
                    para os moradores.
                  </Text>
                </View>

                <Switch
                  value={ativa}
                  onValueChange={setAtiva}
                  trackColor={{
                    false: '#CBD5E1',
                    true: '#93C5FD',
                  }}
                  thumbColor={
                    ativa
                      ? colors.primary
                      : '#F8FAFC'
                  }
                />
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed &&
                    !salvando &&
                    styles.pressed,
                  salvando &&
                    styles.disabledButton,
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
                  <Check
                    size={19}
                    color="#FFFFFF"
                  />
                )}

                <Text style={styles.saveButtonText}>
                  {salvando
                    ? 'Salvando...'
                    : regraEditando
                    ? 'Salvar alterações'
                    : 'Cadastrar regra'}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL CATEGORIA */}
      <Modal
        visible={modalCategoria}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setModalCategoria(false)
        }
      >
        <Pressable
          style={styles.categoryOverlay}
          onPress={() =>
            setModalCategoria(false)
          }
        >
          <Pressable
            style={styles.categoryModal}
            onPress={() => {}}
          >
            <Text style={styles.categoryModalTitle}>
              Selecione a categoria
            </Text>

            {CATEGORIAS.map((item) => (
              <Pressable
                key={item}
                style={({ pressed }) => [
                  styles.categoryOption,
                  pressed && styles.pressed,
                ]}
                onPress={() => {
                  setCategoria(item);
                  setModalCategoria(false);
                }}
              >
                <Text
                  style={[
                    styles.categoryOptionText,
                    categoria === item &&
                      styles.categoryOptionSelected,
                  ]}
                >
                  {item}
                </Text>

                {categoria === item ? (
                  <Check
                    size={18}
                    color={colors.primary}
                  />
                ) : null}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 18,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerText: {
    flex: 1,
    marginLeft: 13,
  },

  headerLabel: {
    color: '#93C5FD',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },

  headerDescription: {
    color: '#CBD5E1',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
    maxWidth: 230,
  },

  headerIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 22,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
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

  addButton: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 13,
    borderRadius: 13,
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 6,
  },

  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 12,
  },

  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 15,
  },

  emptyDescription: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 7,
    maxWidth: 280,
  },

  emptyButton: {
    height: 43,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    borderRadius: 13,
    marginTop: 18,
  },

  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 6,
  },

  ruleCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 19,
    padding: 15,
    marginBottom: 12,
  },

  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  categoryBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },

  categoryText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },

  statusActive: {
    backgroundColor: '#ECFDF5',
  },

  statusInactive: {
    backgroundColor: '#F1F5F9',
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  statusDotActive: {
    backgroundColor: '#16A34A',
  },

  statusDotInactive: {
    backgroundColor: '#64748B',
  },

  statusText: {
    fontSize: 9,
    fontWeight: '800',
  },

  statusTextActive: {
    color: '#15803D',
  },

  statusTextInactive: {
    color: '#64748B',
  },

  ruleTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 13,
  },

  ruleDescription: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },

  ruleDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 13,
  },

  ruleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  switchArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  switchText: {
    color: colors.textSecondary,
    fontSize: 9,
    marginLeft: 5,
  },

  actionButtons: {
    flexDirection: 'row',
  },

  editButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },

  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'flex-end',
  },

  modalContainer: {
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 19,
    paddingTop: 19,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  modalLabel: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },

  closeButton: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  inputLabel: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 7,
    marginTop: 4,
  },

  input: {
    minHeight: 48,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 13,
    color: colors.text,
    fontSize: 12,
    marginBottom: 15,
  },

  selectInput: {
    height: 48,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  selectText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },

  descriptionInput: {
    height: 125,
    paddingTop: 13,
  },

  activeContainer: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 15,
    paddingHorizontal: 13,
    marginBottom: 17,
  },

  activeText: {
    flex: 1,
    paddingRight: 10,
  },

  activeTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },

  activeDescription: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 2,
  },

  saveButton: {
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 7,
  },

  disabledButton: {
    opacity: 0.6,
  },

  categoryOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },

  categoryModal: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 17,
  },

  categoryModalTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },

  categoryOption: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  categoryOptionText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },

  categoryOptionSelected: {
    color: colors.primary,
    fontWeight: '800',
  },

  pressed: {
    opacity: 0.7,
  },
}); 