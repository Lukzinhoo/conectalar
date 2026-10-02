import React, { useCallback, useEffect, useMemo, useState } from 'react';

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
  Check,
  ChevronDown,
  Edit3,
  Eye,
  EyeOff,
  Megaphone,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react-native';

import { colors } from '../../../theme/theme';
import { supabase } from '../../../services/supabase';
import WebSidebar from '../../../components/WebSidebar';

type Categoria =
  | 'geral'
  | 'manutencao'
  | 'reuniao'
  | 'evento'
  | 'seguranca'
  | 'outro';

type Prioridade = 'normal' | 'importante' | 'urgente';

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

const categorias: { value: Categoria; label: string }[] = [
  { value: 'geral', label: 'Geral' },
  { value: 'manutencao', label: 'ManutenÃ§Ã£o' },
  { value: 'reuniao', label: 'ReuniÃ£o' },
  { value: 'evento', label: 'Evento' },
  { value: 'seguranca', label: 'SeguranÃ§a' },
  { value: 'outro', label: 'Outro' },
];

const prioridades: { value: Prioridade; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'importante', label: 'Importante' },
  { value: 'urgente', label: 'Urgente' },
];

function confirmar(mensagem: string) {
  if (
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as any).confirm === 'function'
  ) {
    return (globalThis as any).confirm(mensagem);
  }
  return true;
}

function avisar(mensagem: string) {
  if (
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as any).alert === 'function'
  ) {
    (globalThis as any).alert(mensagem);
  }
}

export default function WebComunicadosScreen() {
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [comunicadoEditando, setComunicadoEditando] =
    useState<Comunicado | null>(null);

  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [categoria, setCategoria] = useState<Categoria>('geral');
  const [prioridade, setPrioridade] = useState<Prioridade>('normal');
  const [publicado, setPublicado] = useState(true);

  const [categoriasAbertas, setCategoriasAbertas] = useState(false);
  const [prioridadesAbertas, setPrioridadesAbertas] = useState(false);

  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const carregarComunicados = useCallback(async (silencioso = false) => {
    try {
      setErro('');

      if (silencioso) {
        setAtualizando(true);
      } else {
        setCarregando(true);
      }

      const { data, error } = await supabase
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
        .order('criado_em', { ascending: false });

      if (error) throw error;

      setComunicados((data ?? []) as Comunicado[]);
    } catch (error: any) {
      console.error('Erro ao carregar comunicados:', error);
      setErro(
        error?.message || 'NÃ£o foi possÃ­vel carregar os comunicados.'
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    carregarComunicados();
  }, [carregarComunicados]);

  const resumo = useMemo(
    () => ({
      total: comunicados.length,
      publicados: comunicados.filter((item) => item.publicado).length,
      urgentes: comunicados.filter(
        (item) => item.prioridade === 'urgente'
      ).length,
    }),
    [comunicados]
  );

  function limparFormulario() {
    setTitulo('');
    setMensagem('');
    setCategoria('geral');
    setPrioridade('normal');
    setPublicado(true);
    setComunicadoEditando(null);
    setCategoriasAbertas(false);
    setPrioridadesAbertas(false);
  }

  function abrirNovoComunicado() {
    setErro('');
    setSucesso('');
    limparFormulario();
    setModalAberto(true);
  }

  function abrirEditarComunicado(comunicado: Comunicado) {
    setErro('');
    setSucesso('');
    setComunicadoEditando(comunicado);
    setTitulo(comunicado.titulo);
    setMensagem(comunicado.mensagem);
    setCategoria(comunicado.categoria);
    setPrioridade(comunicado.prioridade);
    setPublicado(comunicado.publicado);
    setCategoriasAbertas(false);
    setPrioridadesAbertas(false);
    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) return;
    setModalAberto(false);
    limparFormulario();
  }

  async function salvarComunicado() {
    const tituloLimpo = titulo.trim();
    const mensagemLimpa = mensagem.trim();

    setErro('');
    setSucesso('');

    if (!tituloLimpo) {
      setErro('Informe o tÃ­tulo do comunicado.');
      return;
    }

    if (!mensagemLimpa) {
      setErro('Informe a mensagem do comunicado.');
      return;
    }

    try {
      setSalvando(true);

      const dados = {
        titulo: tituloLimpo,
        mensagem: mensagemLimpa,
        categoria,
        prioridade,
        publicado,
        atualizado_em: new Date().toISOString(),
      };

      if (comunicadoEditando) {
        const { error } = await supabase
          .from('comunicados')
          .update(dados)
          .eq('id', comunicadoEditando.id);

        if (error) throw error;
        setSucesso('Comunicado atualizado com sucesso.');
      } else {
        const { error } = await supabase.from('comunicados').insert({
          ...dados,
          criado_em: new Date().toISOString(),
        });

        if (error) throw error;
        setSucesso('Comunicado criado com sucesso.');
      }

      setModalAberto(false);
      limparFormulario();
      await carregarComunicados(true);
    } catch (error: any) {
      console.error('Erro ao salvar comunicado:', error);
      setErro(error?.message || 'NÃ£o foi possÃ­vel salvar o comunicado.');
    } finally {
      setSalvando(false);
    }
  }

  async function excluirComunicado(comunicado: Comunicado) {
    const ok = confirmar(
      `Deseja realmente excluir o comunicado "${comunicado.titulo}"?`
    );
    if (!ok) return;

    try {
      setErro('');
      setSucesso('');
      setExcluindo(comunicado.id);

      const { error } = await supabase
        .from('comunicados')
        .delete()
        .eq('id', comunicado.id);

      if (error) throw error;

      setComunicados((lista) =>
        lista.filter((item) => item.id !== comunicado.id)
      );
      setSucesso('Comunicado excluÃ­do com sucesso.');
    } catch (error: any) {
      console.error('Erro ao excluir comunicado:', error);
      setErro(error?.message || 'NÃ£o foi possÃ­vel excluir o comunicado.');
    } finally {
      setExcluindo(null);
    }
  }

  async function alterarPublicacao(comunicado: Comunicado) {
    const novoStatus = !comunicado.publicado;

    try {
      setErro('');
      setSucesso('');

      const { error } = await supabase
        .from('comunicados')
        .update({
          publicado: novoStatus,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', comunicado.id);

      if (error) throw error;

      setComunicados((lista) =>
        lista.map((item) =>
          item.id === comunicado.id
            ? { ...item, publicado: novoStatus }
            : item
        )
      );

      setSucesso(
        novoStatus
          ? 'Comunicado publicado.'
          : 'Comunicado ocultado.'
      );
    } catch (error: any) {
      console.error('Erro ao alterar publicaÃ§Ã£o:', error);
      setErro(
        error?.message || 'NÃ£o foi possÃ­vel alterar a publicaÃ§Ã£o.'
      );
    }
  }

  function nomeCategoria(valor: Categoria) {
    return (
      categorias.find((item) => item.value === valor)?.label ?? 'Geral'
    );
  }

  function nomePrioridade(valor: Prioridade) {
    return (
      prioridades.find((item) => item.value === valor)?.label ?? 'Normal'
    );
  }

  function formatarData(data: string) {
    if (!data) return '-';

    const date = new Date(data);
    if (Number.isNaN(date.getTime())) return data;

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  return (
    <View style={styles.container}>
      <WebSidebar active="comunicados" />

      <ScrollView
        style={styles.main}
        contentContainerStyle={styles.mainContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>Comunicados</Text>
            <Text style={styles.pageSubtitle}>
              Crie e gerencie avisos para os moradores do condomÃ­nio.
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              style={styles.refreshButton}
              onPress={() => carregarComunicados(true)}
              disabled={atualizando}
            >
              {atualizando ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <RefreshCw size={17} color={colors.primary} />
              )}
              <Text style={styles.refreshText}>Atualizar</Text>
            </Pressable>

            <Pressable
              style={styles.newButton}
              onPress={abrirNovoComunicado}
            >
              <Plus size={18} color="#FFFFFF" />
              <Text style={styles.newButtonText}>Novo comunicado</Text>
            </Pressable>
          </View>
        </View>

        {erro ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{erro}</Text>
          </View>
        ) : null}

        {sucesso ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{sucesso}</Text>
          </View>
        ) : null}

        <View style={styles.summaryRow}>
          <SummaryCard
            titulo="Total"
            valor={resumo.total}
            icon={<Megaphone size={21} color={colors.primary} />}
          />

          <SummaryCard
            titulo="Publicados"
            valor={resumo.publicados}
            icon={<Eye size={21} color="#166534" />}
            fundoIcone="#DCFCE7"
          />

          <SummaryCard
            titulo="Urgentes"
            valor={resumo.urgentes}
            icon={<Bell size={21} color="#B91C1C" />}
            fundoIcone="#FEE2E2"
          />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.sectionTitle}>Avisos cadastrados</Text>
              <Text style={styles.sectionSubtitle}>
                Gerencie a publicaÃ§Ã£o, ediÃ§Ã£o e exclusÃ£o dos comunicados.
              </Text>
            </View>

            <Text style={styles.counter}>
              {comunicados.length} comunicado(s)
            </Text>
          </View>

          {carregando ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>
                Carregando comunicados...
              </Text>
            </View>
          ) : comunicados.length === 0 ? (
            <View style={styles.empty}>
              <Megaphone size={30} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>
                Nenhum comunicado cadastrado
              </Text>
              <Text style={styles.emptyText}>
                Clique em Novo comunicado para criar o primeiro aviso.
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {comunicados.map((comunicado) => (
                <View key={comunicado.id} style={styles.comunicadoCard}>
                  <View style={styles.comunicadoTop}>
                    <View
                      style={[
                        styles.priorityDot,
                        comunicado.prioridade === 'importante' &&
                          styles.priorityImportant,
                        comunicado.prioridade === 'urgente' &&
                          styles.priorityUrgent,
                      ]}
                    />

                    <View style={styles.comunicadoTitleArea}>
                      <Text
                        style={styles.comunicadoTitle}
                        numberOfLines={2}
                      >
                        {comunicado.titulo}
                      </Text>
                      <Text style={styles.comunicadoDate}>
                        {formatarData(comunicado.criado_em)}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        !comunicado.publicado &&
                          styles.statusBadgeHidden,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          !comunicado.publicado &&
                            styles.statusTextHidden,
                        ]}
                      >
                        {comunicado.publicado ? 'Publicado' : 'Oculto'}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={styles.comunicadoMessage}
                    numberOfLines={4}
                  >
                    {comunicado.mensagem}
                  </Text>

                  <View style={styles.tagsRow}>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>
                        {nomeCategoria(comunicado.categoria)}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.tag,
                        comunicado.prioridade === 'importante' &&
                          styles.tagImportant,
                        comunicado.prioridade === 'urgente' &&
                          styles.tagUrgent,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          comunicado.prioridade === 'importante' &&
                            styles.tagImportantText,
                          comunicado.prioridade === 'urgente' &&
                            styles.tagUrgentText,
                        ]}
                      >
                        {nomePrioridade(comunicado.prioridade)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actions}>
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => alterarPublicacao(comunicado)}
                    >
                      {comunicado.publicado ? (
                        <EyeOff size={14} color={colors.textSecondary} />
                      ) : (
                        <Eye size={14} color={colors.primary} />
                      )}
                      <Text style={styles.actionText}>
                        {comunicado.publicado ? 'Ocultar' : 'Publicar'}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.actionButton}
                      onPress={() => abrirEditarComunicado(comunicado)}
                    >
                      <Edit3 size={14} color={colors.primary} />
                      <Text
                        style={[
                          styles.actionText,
                          { color: colors.primary },
                        ]}
                      >
                        Editar
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[styles.actionButton, styles.deleteButton]}
                      disabled={excluindo === comunicado.id}
                      onPress={() => excluirComunicado(comunicado)}
                    >
                      {excluindo === comunicado.id ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.danger}
                        />
                      ) : (
                        <Trash2 size={14} color={colors.danger} />
                      )}
                      <Text
                        style={[
                          styles.actionText,
                          { color: colors.danger },
                        ]}
                      >
                        Excluir
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={modalAberto}
        transparent
        animationType="fade"
        onRequestClose={fecharModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalLabel}>COMUNICADOS</Text>
                  <Text style={styles.modalTitle}>
                    {comunicadoEditando
                      ? 'Editar comunicado'
                      : 'Novo comunicado'}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    Preencha as informaÃ§Ãµes abaixo.
                  </Text>
                </View>

                <Pressable
                  style={styles.closeButton}
                  onPress={fecharModal}
                  disabled={salvando}
                >
                  <X size={20} color={colors.text} />
                </Pressable>
              </View>

              {erro ? (
                <View style={styles.modalError}>
                  <Text style={styles.errorText}>{erro}</Text>
                </View>
              ) : null}

              <Text style={styles.inputLabel}>TÃTULO *</Text>
              <TextInput
                style={styles.input}
                value={titulo}
                onChangeText={setTitulo}
                placeholder="Ex.: ManutenÃ§Ã£o da piscina"
                placeholderTextColor="#94A3B8"
                maxLength={120}
                editable={!salvando}
              />

              <Text style={styles.inputLabel}>MENSAGEM *</Text>
              <TextInput
                style={[styles.input, styles.messageInput]}
                value={mensagem}
                onChangeText={setMensagem}
                placeholder="Digite o comunicado..."
                placeholderTextColor="#94A3B8"
                multiline
                textAlignVertical="top"
                maxLength={1500}
                editable={!salvando}
              />

              <Text style={styles.inputLabel}>CATEGORIA</Text>
              <Pressable
                style={styles.selectButton}
                disabled={salvando}
                onPress={() => {
                  setCategoriasAbertas((valor) => !valor);
                  setPrioridadesAbertas(false);
                }}
              >
                <Text style={styles.selectText}>
                  {nomeCategoria(categoria)}
                </Text>
                <ChevronDown
                  size={17}
                  color={colors.textSecondary}
                />
              </Pressable>

              {categoriasAbertas ? (
                <View style={styles.optionsBox}>
                  {categorias.map((item) => (
                    <Pressable
                      key={item.value}
                      style={styles.optionButton}
                      onPress={() => {
                        setCategoria(item.value);
                        setCategoriasAbertas(false);
                      }}
                    >
                      <Text style={styles.optionText}>{item.label}</Text>
                      {categoria === item.value ? (
                        <Check size={16} color={colors.primary} />
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <Text style={styles.inputLabel}>PRIORIDADE</Text>
              <Pressable
                style={styles.selectButton}
                disabled={salvando}
                onPress={() => {
                  setPrioridadesAbertas((valor) => !valor);
                  setCategoriasAbertas(false);
                }}
              >
                <Text style={styles.selectText}>
                  {nomePrioridade(prioridade)}
                </Text>
                <ChevronDown
                  size={17}
                  color={colors.textSecondary}
                />
              </Pressable>

              {prioridadesAbertas ? (
                <View style={styles.optionsBox}>
                  {prioridades.map((item) => (
                    <Pressable
                      key={item.value}
                      style={styles.optionButton}
                      onPress={() => {
                        setPrioridade(item.value);
                        setPrioridadesAbertas(false);
                      }}
                    >
                      <Text style={styles.optionText}>{item.label}</Text>
                      {prioridade === item.value ? (
                        <Check size={16} color={colors.primary} />
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <Text style={styles.inputLabel}>VISIBILIDADE</Text>
              <Pressable
                style={[
                  styles.publishBox,
                  publicado && styles.publishBoxActive,
                ]}
                disabled={salvando}
                onPress={() => setPublicado((valor) => !valor)}
              >
                <View style={styles.publishContent}>
                  {publicado ? (
                    <Eye size={18} color={colors.primary} />
                  ) : (
                    <EyeOff size={18} color={colors.textSecondary} />
                  )}

                  <View style={styles.publishTextBox}>
                    <Text style={styles.publishTitle}>
                      {publicado ? 'Publicado' : 'Oculto'}
                    </Text>
                    <Text style={styles.publishDescription}>
                      {publicado
                        ? 'Os moradores poderÃ£o visualizar este comunicado.'
                        : 'Este comunicado nÃ£o ficarÃ¡ visÃ­vel aos moradores.'}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.checkbox,
                    publicado && styles.checkboxActive,
                  ]}
                >
                  {publicado ? (
                    <Check size={13} color="#FFFFFF" />
                  ) : null}
                </View>
              </Pressable>

              <View style={styles.modalActions}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={fecharModal}
                  disabled={salvando}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.saveButton,
                    salvando && styles.disabledButton,
                  ]}
                  onPress={salvarComunicado}
                  disabled={salvando}
                >
                  {salvando ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Check size={16} color="#FFFFFF" />
                  )}

                  <Text style={styles.saveButtonText}>
                    {salvando
                      ? 'Salvando...'
                      : comunicadoEditando
                      ? 'Salvar alteraÃ§Ãµes'
                      : 'Criar comunicado'}
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

function SummaryCard({
  titulo,
  valor,
  icon,
  fundoIcone = colors.primaryLight,
}: {
  titulo: string;
  valor: number;
  icon: React.ReactNode;
  fundoIcone?: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: fundoIcone }]}>
        {icon}
      </View>
      <View>
        <Text style={styles.summaryNumber}>{valor}</Text>
        <Text style={styles.summaryLabel}>{titulo}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  main: {
    flex: 1,
  },
  mainContent: {
    padding: 30,
    paddingBottom: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  pageTitle: {
    color: colors.text,
    fontSize: 27,
    fontWeight: '800',
  },
  pageSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    height: 42,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  refreshText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 7,
  },
  newButton: {
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  newButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 7,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 10,
    fontWeight: '600',
  },
  successBox: {
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  successText: {
    color: '#166534',
    fontSize: 10,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 22,
  },
  summaryCard: {
    flex: 1,
    minHeight: 105,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 15,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  summaryNumber: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '800',
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 3,
  },
  counter: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
  },
  loading: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 9,
  },
  empty: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 10,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  comunicadoCard: {
    width: 360,
    minHeight: 230,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 15,
    marginRight: 12,
    marginBottom: 12,
  },
  comunicadoTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginTop: 5,
    marginRight: 8,
  },
  priorityImportant: {
    backgroundColor: '#F59E0B',
  },
  priorityUrgent: {
    backgroundColor: '#EF4444',
  },
  comunicadoTitleArea: {
    flex: 1,
    paddingRight: 8,
  },
  comunicadoTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  comunicadoDate: {
    color: colors.textLight,
    fontSize: 9,
    marginTop: 3,
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeHidden: {
    backgroundColor: '#F1F5F9',
  },
  statusText: {
    color: '#15803D',
    fontSize: 8,
    fontWeight: '800',
  },
  statusTextHidden: {
    color: colors.textSecondary,
  },
  comunicadoMessage: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 12,
    minHeight: 64,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  tag: {
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: '700',
  },
  tagImportant: {
    backgroundColor: '#FEF3C7',
  },
  tagImportantText: {
    color: '#B45309',
  },
  tagUrgent: {
    backgroundColor: '#FEE2E2',
  },
  tagUrgentText: {
    color: '#B91C1C',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 11,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: 9,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
  deleteButton: {
    marginRight: 0,
  },
  actionText: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.60)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '92%',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 22,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalLabel: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 3,
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 3,
  },
  closeButton: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalError: {
    backgroundColor: '#FEE2E2',
    borderRadius: 9,
    padding: 10,
    marginBottom: 5,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    minHeight: 44,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    paddingHorizontal: 12,
    color: colors.text,
    fontSize: 11,
  },
  messageInput: {
    minHeight: 105,
    paddingTop: 11,
    paddingBottom: 11,
  },
  selectButton: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  optionsBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    backgroundColor: colors.surface,
    marginTop: 5,
    overflow: 'hidden',
  },
  optionButton: {
    minHeight: 40,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '600',
  },
  publishBox: {
    minHeight: 65,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    backgroundColor: colors.background,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  publishBoxActive: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  publishContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  publishTextBox: {
    flex: 1,
    marginLeft: 9,
    paddingRight: 8,
  },
  publishTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  publishDescription: {
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 20,
  },
  cancelButton: {
    width: 120,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
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
    flex: 1,
    height: 44,
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
  disabledButton: {
    opacity: 0.55,
  },
});

