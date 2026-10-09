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
  useWindowDimensions,
} from 'react-native';

import {
  CheckCircle2,
  Eye,
  MapPin,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  ShieldAlert,
  X,
  XCircle,
} from 'lucide-react-native';

import { colors } from '../../../theme/theme';
import WebMoradorSidebar from '../../../components/WebMoradorSidebar';
import WebLayout from '../../../components/WebLayout';
import { supabase } from '../../../services/supabase';

type Categoria =
  | 'manutencao'
  | 'barulho'
  | 'limpeza'
  | 'seguranca'
  | 'area_comum'
  | 'outro';

type Prioridade = 'normal' | 'importante' | 'urgente';

type Status = 'pendente' | 'em_andamento' | 'resolvida';

type FiltroStatus = 'todas' | Status;

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

function categoriaTexto(categoria: Categoria) {
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

function prioridadeTexto(prioridade: Prioridade) {
  switch (prioridade) {
    case 'urgente':
      return 'Urgente';
    case 'importante':
      return 'Importante';
    default:
      return 'Normal';
  }
}

function statusTexto(status: Status) {
  switch (status) {
    case 'em_andamento':
      return 'Em andamento';
    case 'resolvida':
      return 'Resolvida';
    default:
      return 'Pendente';
  }
}

function formatarData(valor: string | null) {
  if (!valor) return '-';

  try {
    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) return valor;

    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return valor;
  }
}

export default function WebMoradorOcorrenciasScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [modalNova, setModalNova] = useState(false);
  const [ocorrenciaSelecionada, setOcorrenciaSelecionada] =
    useState<Ocorrencia | null>(null);

  const [filtro, setFiltro] = useState<FiltroStatus>('todas');
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const [erro, setErro] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [local, setLocal] = useState('');

  const [categoria, setCategoria] =
    useState<Categoria>('manutencao');

  const [prioridade, setPrioridade] =
    useState<Prioridade>('normal');

  const carregarOcorrencias = useCallback(async () => {
    try {
      setCarregando(true);
      setErro('');

      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        setErro(
          'Sua sessão não foi encontrada. Entre novamente na sua conta.'
        );
        return;
      }

      const usuario = userData.user;

      const { data: perfil, error: perfilError } = await supabase
        .from('perfis')
        .select('id, tipo, ativo')
        .eq('id', usuario.id)
        .maybeSingle();

      if (perfilError) {
        console.error(perfilError);
        setErro('Não foi possível verificar o perfil do morador.');
        return;
      }

      if (!perfil) {
        setErro('Perfil do morador não encontrado.');
        return;
      }

      if (perfil.tipo !== 'morador') {
        setErro('Esta conta não possui acesso à área do morador.');
        return;
      }

      if (!perfil.ativo) {
        setErro('Este usuário está desativado.');
        return;
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
        .eq('morador_id', usuario.id)
        .order('criado_em', { ascending: false });

      if (error) {
        console.error(error);
        setErro(
          `Não foi possível carregar suas ocorrências: ${error.message}`
        );
        return;
      }

      setOcorrencias((data ?? []) as Ocorrencia[]);
    } catch (error) {
      console.error(error);
      setErro('Ocorreu um erro ao carregar suas ocorrências.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarOcorrencias();
  }, [carregarOcorrencias]);

  const ocorrenciasFiltradas = useMemo(() => {
    if (filtro === 'todas') return ocorrencias;

    return ocorrencias.filter((item) => item.status === filtro);
  }, [ocorrencias, filtro]);

  const pendentes = useMemo(
    () => ocorrencias.filter((item) => item.status === 'pendente').length,
    [ocorrencias]
  );

  const andamento = useMemo(
    () =>
      ocorrencias.filter((item) => item.status === 'em_andamento')
        .length,
    [ocorrencias]
  );

  const resolvidas = useMemo(
    () => ocorrencias.filter((item) => item.status === 'resolvida').length,
    [ocorrencias]
  );

  function limparFormulario() {
    setTitulo('');
    setDescricao('');
    setLocal('');
    setCategoria('manutencao');
    setPrioridade('normal');
  }

  function abrirNovaOcorrencia() {
    setErro('');
    setMensagemSucesso('');
    limparFormulario();
    setModalNova(true);
  }

  function fecharNovaOcorrencia() {
    if (enviando) return;

    setModalNova(false);
    limparFormulario();
  }

  async function enviarOcorrencia() {
    try {
      setErro('');
      setMensagemSucesso('');

      const tituloLimpo = titulo.trim();
      const descricaoLimpa = descricao.trim();
      const localLimpo = local.trim();

      if (!tituloLimpo) {
        Alert.alert('Atenção', 'Informe o título da ocorrência.');
        return;
      }

      if (!descricaoLimpa) {
        Alert.alert('Atenção', 'Descreva o problema da ocorrência.');
        return;
      }

      setEnviando(true);

      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        setErro('Sua sessão expirou. Entre novamente na conta.');
        return;
      }

      const usuario = userData.user;

      const { data: perfil, error: perfilError } = await supabase
        .from('perfis')
        .select('id, tipo, ativo')
        .eq('id', usuario.id)
        .maybeSingle();

      if (perfilError) {
        console.error(perfilError);
        setErro('Não foi possível verificar seu perfil.');
        return;
      }

      if (!perfil || perfil.tipo !== 'morador') {
        setErro('Não foi possível identificar o perfil do morador.');
        return;
      }

      if (!perfil.ativo) {
        setErro('Este usuário está desativado.');
        return;
      }

      const { data, error } = await supabase
        .from('ocorrencias')
        .insert({
          morador_id: usuario.id,
          titulo: tituloLimpo,
          descricao: descricaoLimpa,
          categoria,
          local_ocorrencia: localLimpo || null,
          prioridade,
          status: 'pendente',
          resposta_admin: null,
          atualizado_em: new Date().toISOString(),
          resolvido_em: null,
        })
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
        .single();

      if (error) {
        console.error(error);
        setErro(
          `Não foi possível enviar a ocorrência: ${error.message}`
        );
        return;
      }

      setOcorrencias((anteriores) => [
        data as Ocorrencia,
        ...anteriores,
      ]);

      setModalNova(false);
      limparFormulario();

      setMensagemSucesso(
        'Ocorrência enviada com sucesso. A administração já poderá visualizá-la.'
      );
    } catch (error) {
      console.error(error);
      setErro('Ocorreu um erro ao enviar a ocorrência.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <WebLayout
      sidebar={<WebMoradorSidebar active="ocorrencias" />}
    >
      <View style={styles.page}>
        <View
          style={[
            styles.header,
            isMobile && styles.headerMobile,
          ]}
        >
          <View style={styles.headerText}>
            <Text style={styles.title}>Ocorrências</Text>

            <Text style={styles.subtitle}>
              Registre problemas e acompanhe o atendimento da
              administração.
            </Text>
          </View>

          <View
            style={[
              styles.headerActions,
              isMobile && styles.headerActionsMobile,
            ]}
          >
            <Pressable
              style={styles.refreshButton}
              onPress={carregarOcorrencias}
            >
              <RefreshCw
                size={17}
                color={colors.textSecondary}
              />
            </Pressable>

            <Pressable
              style={[
                styles.newButton,
                isMobile && styles.newButtonMobile,
              ]}
              onPress={abrirNovaOcorrencia}
            >
              <Plus size={18} color="#FFFFFF" />

              <Text style={styles.newButtonText}>
                Nova ocorrência
              </Text>
            </Pressable>
          </View>
        </View>

        {mensagemSucesso !== '' && (
          <View style={styles.successBox}>
            <CheckCircle2 size={17} color="#15803D" />

            <Text style={styles.successText}>
              {mensagemSucesso}
            </Text>
          </View>
        )}

        {erro !== '' && (
          <View style={styles.errorBox}>
            <XCircle size={17} color={colors.danger} />

            <Text style={styles.errorText}>
              {erro}
            </Text>
          </View>
        )}

        {carregando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />

            <Text style={styles.loadingText}>
              Carregando suas ocorrências...
            </Text>
          </View>
        ) : (
          <>
            <View
              style={[
                styles.summary,
                isMobile && styles.summaryMobile,
              ]}
            >
              <SummaryCard
                titulo="Total"
                valor={ocorrencias.length}
                mobile={isMobile}
              />

              <SummaryCard
                titulo="Pendentes"
                valor={pendentes}
                mobile={isMobile}
              />

              <SummaryCard
                titulo="Em andamento"
                valor={andamento}
                mobile={isMobile}
              />

              <SummaryCard
                titulo="Resolvidas"
                valor={resolvidas}
                mobile={isMobile}
                ultimo
              />
            </View>

            <View style={styles.filtersContainer}>
              <Text style={styles.filterTitle}>
                Filtrar por status
              </Text>

              <View style={styles.filterButtons}>
                <FilterButton
                  titulo="Todas"
                  active={filtro === 'todas'}
                  onPress={() => setFiltro('todas')}
                />

                <FilterButton
                  titulo="Pendentes"
                  active={filtro === 'pendente'}
                  onPress={() => setFiltro('pendente')}
                />

                <FilterButton
                  titulo="Em andamento"
                  active={filtro === 'em_andamento'}
                  onPress={() => setFiltro('em_andamento')}
                />

                <FilterButton
                  titulo="Resolvidas"
                  active={filtro === 'resolvida'}
                  onPress={() => setFiltro('resolvida')}
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>
              Suas ocorrências
            </Text>

            <View style={styles.listContainer}>
              {ocorrenciasFiltradas.length === 0 ? (
                <View style={styles.empty}>
                  <ShieldAlert
                    size={35}
                    color={colors.textLight}
                  />

                  <Text style={styles.emptyTitle}>
                    Nenhuma ocorrência
                  </Text>

                  <Text style={styles.emptyText}>
                    Você não possui ocorrências neste filtro.
                  </Text>
                </View>
              ) : (
                ocorrenciasFiltradas.map((ocorrencia) => (
                  <View
                    key={ocorrencia.id}
                    style={[
                      styles.card,
                      isMobile && styles.cardMobile,
                    ]}
                  >
                    <View style={styles.iconBox}>
                      <ShieldAlert
                        size={21}
                        color={colors.primary}
                      />
                    </View>

                    <View style={styles.cardContent}>
                      <View
                        style={[
                          styles.cardTop,
                          isMobile && styles.cardTopMobile,
                        ]}
                      >
                        <Text
                          style={styles.cardTitle}
                          numberOfLines={2}
                        >
                          {ocorrencia.titulo}
                        </Text>

                        <StatusBadge status={ocorrencia.status} />
                      </View>

                      <Text
                        style={styles.description}
                        numberOfLines={2}
                      >
                        {ocorrencia.descricao}
                      </Text>

                      <View style={styles.detailsRow}>
                        <View style={styles.smallBadge}>
                          <Text style={styles.smallBadgeText}>
                            {categoriaTexto(ocorrencia.categoria)}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.priorityBadge,
                            ocorrencia.prioridade ===
                              'importante' &&
                              styles.priorityImportant,
                            ocorrencia.prioridade ===
                              'urgente' &&
                              styles.priorityUrgent,
                          ]}
                        >
                          <Text
                            style={[
                              styles.priorityText,
                              ocorrencia.prioridade ===
                                'importante' &&
                                styles.priorityImportantText,
                              ocorrencia.prioridade ===
                                'urgente' &&
                                styles.priorityUrgentText,
                            ]}
                          >
                            {prioridadeTexto(
                              ocorrencia.prioridade
                            )}
                          </Text>
                        </View>

                        {ocorrencia.local_ocorrencia && (
                          <View style={styles.detailItem}>
                            <MapPin
                              size={12}
                              color={colors.textSecondary}
                            />

                            <Text style={styles.detailText}>
                              {ocorrencia.local_ocorrencia}
                            </Text>
                          </View>
                        )}

                        <Text style={styles.dateText}>
                          {formatarData(ocorrencia.criado_em)}
                        </Text>
                      </View>

                      {isMobile && (
                        <Pressable
                          style={styles.viewButtonMobile}
                          onPress={() =>
                            setOcorrenciaSelecionada(ocorrencia)
                          }
                        >
                          <Eye
                            size={14}
                            color={colors.primary}
                          />

                          <Text style={styles.viewButtonText}>
                            Ver detalhes
                          </Text>
                        </Pressable>
                      )}
                    </View>

                    {!isMobile && (
                      <Pressable
                        style={styles.viewButton}
                        onPress={() =>
                          setOcorrenciaSelecionada(ocorrencia)
                        }
                      >
                        <Eye
                          size={14}
                          color={colors.primary}
                        />

                        <Text style={styles.viewButtonText}>
                          Ver detalhes
                        </Text>
                      </Pressable>
                    )}
                  </View>
                ))
              )}
            </View>
          </>
        )}

        {/* NOVA OCORRÊNCIA */}

        <Modal
          visible={modalNova}
          transparent
          animationType="fade"
          onRequestClose={fecharNovaOcorrencia}
          statusBarTranslucent
        >
          <View
            style={[
              styles.modalOverlay,
              isMobile && styles.modalOverlayMobile,
            ]}
          >
            <View
              style={[
                styles.modalBox,
                isMobile && styles.modalBoxMobile,
              ]}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderText}>
                  <Text style={styles.modalTitle}>
                    Nova ocorrência
                  </Text>

                  <Text style={styles.modalSubtitle}>
                    Informe os dados do problema para a
                    administração.
                  </Text>
                </View>

                <Pressable
                  style={styles.closeButton}
                  onPress={fecharNovaOcorrencia}
                  disabled={enviando}
                >
                  <X
                    size={18}
                    color={colors.textSecondary}
                  />
                </Pressable>
              </View>

              {/* SOMENTE O FORMULÁRIO ROLA */}

              <ScrollView
                style={styles.formScroll}
                contentContainerStyle={styles.formScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.label}>
                  Título *
                </Text>

                <TextInput
                  style={styles.input}
                  value={titulo}
                  onChangeText={setTitulo}
                  placeholder="Ex.: Vazamento no corredor"
                  placeholderTextColor={colors.textLight}
                  maxLength={120}
                />

                <Text style={styles.label}>
                  Descrição *
                </Text>

                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={descricao}
                  onChangeText={setDescricao}
                  placeholder="Descreva o problema com detalhes..."
                  placeholderTextColor={colors.textLight}
                  multiline
                  textAlignVertical="top"
                  maxLength={1500}
                />

                <Text style={styles.label}>
                  Local da ocorrência
                </Text>

                <TextInput
                  style={styles.input}
                  value={local}
                  onChangeText={setLocal}
                  placeholder="Ex.: Portaria, salão, bloco A..."
                  placeholderTextColor={colors.textLight}
                  maxLength={120}
                />

                <Text style={styles.label}>
                  Categoria
                </Text>

                <View style={styles.optionsWrap}>
                  <OptionButton
                    titulo="Manutenção"
                    active={categoria === 'manutencao'}
                    onPress={() => setCategoria('manutencao')}
                  />

                  <OptionButton
                    titulo="Barulho"
                    active={categoria === 'barulho'}
                    onPress={() => setCategoria('barulho')}
                  />

                  <OptionButton
                    titulo="Limpeza"
                    active={categoria === 'limpeza'}
                    onPress={() => setCategoria('limpeza')}
                  />

                  <OptionButton
                    titulo="Segurança"
                    active={categoria === 'seguranca'}
                    onPress={() => setCategoria('seguranca')}
                  />

                  <OptionButton
                    titulo="Área comum"
                    active={categoria === 'area_comum'}
                    onPress={() => setCategoria('area_comum')}
                  />

                  <OptionButton
                    titulo="Outro"
                    active={categoria === 'outro'}
                    onPress={() => setCategoria('outro')}
                  />
                </View>

                <Text style={styles.label}>
                  Prioridade
                </Text>

                <View style={styles.optionsWrap}>
                  <OptionButton
                    titulo="Normal"
                    active={prioridade === 'normal'}
                    onPress={() => setPrioridade('normal')}
                  />

                  <OptionButton
                    titulo="Importante"
                    active={prioridade === 'importante'}
                    onPress={() => setPrioridade('importante')}
                  />

                  <OptionButton
                    titulo="Urgente"
                    active={prioridade === 'urgente'}
                    onPress={() => setPrioridade('urgente')}
                  />
                </View>
              </ScrollView>

              {/*
                IMPORTANTE:
                ESTES BOTÕES ESTÃO FORA DO SCROLLVIEW.

                Por isso eles ficam sempre visíveis no celular.
              */}

              <View style={styles.modalFooter}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={fecharNovaOcorrencia}
                  disabled={enviando}
                >
                  <Text style={styles.cancelButtonText}>
                    Cancelar
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.sendButton,
                    enviando && styles.disabled,
                  ]}
                  onPress={enviarOcorrencia}
                  disabled={enviando}
                >
                  {enviando ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  ) : (
                    <>
                      <Send
                        size={15}
                        color="#FFFFFF"
                      />

                      <Text style={styles.sendButtonText}>
                        Enviar ocorrência
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* DETALHES */}

        <Modal
          visible={!!ocorrenciaSelecionada}
          transparent
          animationType="fade"
          onRequestClose={() =>
            setOcorrenciaSelecionada(null)
          }
          statusBarTranslucent
        >
          <View
            style={[
              styles.modalOverlay,
              isMobile && styles.modalOverlayMobile,
            ]}
          >
            <View
              style={[
                styles.modalBox,
                styles.detailsModal,
                isMobile && styles.modalBoxMobile,
              ]}
            >
              {ocorrenciaSelecionada && (
                <>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderText}>
                      <Text style={styles.modalTitle}>
                        Detalhes da ocorrência
                      </Text>

                      <Text style={styles.modalSubtitle}>
                        Acompanhe o andamento do atendimento.
                      </Text>
                    </View>

                    <Pressable
                      style={styles.closeButton}
                      onPress={() =>
                        setOcorrenciaSelecionada(null)
                      }
                    >
                      <X
                        size={18}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  </View>

                  <ScrollView
                    style={styles.detailsScroll}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.detailsBadges}>
                      <StatusBadge
                        status={ocorrenciaSelecionada.status}
                      />

                      <View style={styles.smallBadge}>
                        <Text style={styles.smallBadgeText}>
                          {categoriaTexto(
                            ocorrenciaSelecionada.categoria
                          )}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.priorityBadge,
                          ocorrenciaSelecionada.prioridade ===
                            'importante' &&
                            styles.priorityImportant,
                          ocorrenciaSelecionada.prioridade ===
                            'urgente' &&
                            styles.priorityUrgent,
                        ]}
                      >
                        <Text
                          style={[
                            styles.priorityText,
                            ocorrenciaSelecionada.prioridade ===
                              'importante' &&
                              styles.priorityImportantText,
                            ocorrenciaSelecionada.prioridade ===
                              'urgente' &&
                              styles.priorityUrgentText,
                          ]}
                        >
                          {prioridadeTexto(
                            ocorrenciaSelecionada.prioridade
                          )}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.detailsTitle}>
                      {ocorrenciaSelecionada.titulo}
                    </Text>

                    <Text style={styles.createdDate}>
                      Registrada em{' '}
                      {formatarData(
                        ocorrenciaSelecionada.criado_em
                      )}
                    </Text>

                    {ocorrenciaSelecionada.local_ocorrencia && (
                      <View style={styles.locationRow}>
                        <MapPin
                          size={15}
                          color={colors.textSecondary}
                        />

                        <Text style={styles.locationText}>
                          {
                            ocorrenciaSelecionada.local_ocorrencia
                          }
                        </Text>
                      </View>
                    )}

                    <View style={styles.divider} />

                    <Text style={styles.detailsLabel}>
                      Descrição
                    </Text>

                    <Text style={styles.detailsDescription}>
                      {ocorrenciaSelecionada.descricao}
                    </Text>

                    <View style={styles.responseBox}>
                      <View style={styles.responseHeader}>
                        <MessageSquare
                          size={17}
                          color={colors.primary}
                        />

                        <Text style={styles.responseTitle}>
                          Resposta da administração
                        </Text>
                      </View>

                      <Text
                        style={
                          ocorrenciaSelecionada.resposta_admin
                            ? styles.responseText
                            : styles.noResponseText
                        }
                      >
                        {ocorrenciaSelecionada.resposta_admin ||
                          'A administração ainda não respondeu esta ocorrência.'}
                      </Text>
                    </View>

                    {ocorrenciaSelecionada.status ===
                      'resolvida' &&
                      ocorrenciaSelecionada.resolvido_em && (
                        <View style={styles.resolvedBox}>
                          <CheckCircle2
                            size={17}
                            color="#15803D"
                          />

                          <Text style={styles.resolvedText}>
                            Resolvida em{' '}
                            {formatarData(
                              ocorrenciaSelecionada.resolvido_em
                            )}
                          </Text>
                        </View>
                      )}

                    <Pressable
                      style={styles.closeDetailsButton}
                      onPress={() =>
                        setOcorrenciaSelecionada(null)
                      }
                    >
                      <Text style={styles.closeDetailsText}>
                        Fechar
                      </Text>
                    </Pressable>
                  </ScrollView>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </WebLayout>
  );
}

function SummaryCard({
  titulo,
  valor,
  ultimo = false,
  mobile = false,
}: {
  titulo: string;
  valor: number;
  ultimo?: boolean;
  mobile?: boolean;
}) {
  return (
    <View
      style={[
        styles.summaryCard,
        ultimo && styles.summaryCardLast,
        mobile && styles.summaryCardMobile,
      ]}
    >
      <View style={styles.summaryIcon}>
        <ShieldAlert
          size={21}
          color={colors.primary}
        />
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
        active && styles.filterButtonActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterButtonText,
          active && styles.filterButtonTextActive,
        ]}
      >
        {titulo}
      </Text>
    </Pressable>
  );
}

function OptionButton({
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
        styles.optionButton,
        active && styles.optionButtonActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.optionButtonText,
          active && styles.optionButtonTextActive,
        ]}
      >
        {titulo}
      </Text>
    </Pressable>
  );
}

function StatusBadge({
  status,
}: {
  status: Status;
}) {
  return (
    <View
      style={[
        styles.statusBadge,
        status === 'pendente' && styles.statusPending,
        status === 'em_andamento' && styles.statusProgress,
        status === 'resolvida' && styles.statusResolved,
      ]}
    >
      <Text
        style={[
          styles.statusText,
          status === 'pendente' && styles.statusPendingText,
          status === 'em_andamento' &&
            styles.statusProgressText,
          status === 'resolvida' &&
            styles.statusResolvedText,
        ]}
      >
        {statusTexto(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: '100%',
    minWidth: 0,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  headerMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerActionsMobile: {
    width: '100%',
    marginTop: 15,
  },

  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  refreshButton: {
    width: 43,
    height: 43,
    borderRadius: 11,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  newButton: {
    height: 43,
    borderRadius: 11,
    backgroundColor: colors.primary,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  newButtonMobile: {
    flex: 1,
  },

  newButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 7,
  },

  successBox: {
    minHeight: 46,
    borderRadius: 11,
    padding: 12,
    backgroundColor: '#DCFCE7',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  successText: {
    flex: 1,
    color: '#15803D',
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '700',
    marginLeft: 8,
  },

  errorBox: {
    minHeight: 46,
    borderRadius: 11,
    padding: 12,
    backgroundColor: colors.dangerLight,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '700',
    marginLeft: 8,
  },

  loadingContainer: {
    minHeight: 350,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 12,
  },

  summary: {
    flexDirection: 'row',
    marginBottom: 22,
  },

  summaryMobile: {
    flexDirection: 'column',
  },

  summaryCard: {
    flex: 1,
    minHeight: 100,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginRight: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },

  summaryCardMobile: {
    width: '100%',
    flex: 0,
    minHeight: 82,
    marginRight: 0,
    marginBottom: 10,
  },

  summaryCardLast: {
    marginRight: 0,
  },

  summaryIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  summaryLabel: {
    color: colors.textSecondary,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },

  filterTitle: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 12,
  },

  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  filterButton: {
    minHeight: 35,
    paddingHorizontal: 14,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 8,
  },

  filterButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  filterButtonText: {
    color: colors.textSecondary,
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
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    overflow: 'hidden',
  },

  card: {
    minHeight: 125,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
  },

  cardMobile: {
    padding: 14,
    alignItems: 'flex-start',
  },

  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    flexShrink: 0,
  },

  cardContent: {
    flex: 1,
    minWidth: 0,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  cardTopMobile: {
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },

  cardTitle: {
    flex: 1,
    minWidth: 120,
    color: colors.text,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '800',
    marginRight: 10,
  },

  description: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 6,
    maxWidth: 650,
  },

  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 9,
  },

  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 6,
    maxWidth: '100%',
  },

  detailText: {
    flexShrink: 1,
    color: colors.textSecondary,
    fontSize: 8,
    marginLeft: 4,
  },

  smallBadge: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 7,
    marginBottom: 6,
  },

  smallBadgeText: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
  },

  priorityBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 6,
  },

  priorityImportant: {
    backgroundColor: '#FEF3C7',
  },

  priorityUrgent: {
    backgroundColor: '#FEE2E2',
  },

  priorityText: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: '800',
  },

  priorityImportantText: {
    color: '#B45309',
  },

  priorityUrgentText: {
    color: '#DC2626',
  },

  dateText: {
    color: colors.textLight,
    fontSize: 8,
    marginBottom: 6,
  },

  viewButton: {
    minHeight: 36,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
  },

  viewButtonMobile: {
    width: '100%',
    minHeight: 38,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  viewButtonText: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: '800',
    marginLeft: 5,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    flexShrink: 0,
  },

  statusText: {
    fontSize: 8,
    fontWeight: '800',
  },

  statusPending: {
    backgroundColor: '#FEF3C7',
  },

  statusPendingText: {
    color: '#B45309',
  },

  statusProgress: {
    backgroundColor: colors.primaryLight,
  },

  statusProgressText: {
    color: colors.primary,
  },

  statusResolved: {
    backgroundColor: '#DCFCE7',
  },

  statusResolvedText: {
    color: '#15803D',
  },

  empty: {
    minHeight: 250,
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
    fontSize: 9,
    marginTop: 5,
    textAlign: 'center',
  },

  /* MODAL */

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },

  modalOverlayMobile: {
    paddingHorizontal: 10,
    paddingVertical: 12,
  },

  modalBox: {
    width: '100%',
    maxWidth: 650,
    height: '90%',
    maxHeight: 720,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
    overflow: 'hidden',
  },

  modalBoxMobile: {
    width: '100%',
    maxWidth: '100%',
    height: '94%',
    maxHeight: '94%',
    padding: 14,
    borderRadius: 14,
    overflow: 'hidden',
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    flexShrink: 0,
  },

  modalHeaderText: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },

  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },

  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
    marginTop: 4,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  /*
    ESTA É A CORREÇÃO PRINCIPAL:
    somente os campos rolam.
  */

  formScroll: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },

  formScrollContent: {
    flexGrow: 1,
    paddingBottom: 10,
  },

  label: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 11,
    marginBottom: 6,
  },

  input: {
    width: '100%',
    minHeight: 42,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: colors.text,
    fontSize: 10,
  },

  textArea: {
    minHeight: 90,
    paddingTop: 11,
    paddingBottom: 11,
  },

  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  optionButton: {
    minHeight: 36,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
    marginBottom: 7,
  },

  optionButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  optionButtonText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
  },

  optionButtonTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },

  /*
    RODAPÉ FIXO.
    CANCELAR + ENVIAR FICAM NA MESMA LINHA.
  */

  modalFooter: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    paddingTop: 12,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  cancelButton: {
    flex: 1,
    minWidth: 0,
    height: 45,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    paddingHorizontal: 8,
  },

  cancelButtonText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
  },

  sendButton: {
    flex: 1.35,
    minWidth: 0,
    height: 45,
    borderRadius: 11,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  sendButtonText: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 6,
    textAlign: 'center',
  },

  disabled: {
    opacity: 0.65,
  },

  /* DETALHES */

  detailsModal: {
    maxHeight: '90%',
  },

  detailsScroll: {
    flex: 1,
    minHeight: 0,
  },

  detailsBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 14,
  },

  detailsTitle: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '800',
  },

  createdDate: {
    color: colors.textLight,
    fontSize: 9,
    marginTop: 7,
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

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 18,
  },

  detailsLabel: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 7,
  },

  detailsDescription: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 18,
  },

  responseBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
  },

  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  responseTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 7,
  },

  responseText: {
    color: colors.text,
    fontSize: 10,
    lineHeight: 17,
  },

  noResponseText: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 16,
  },

  resolvedBox: {
    minHeight: 44,
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  resolvedText: {
    flex: 1,
    color: '#15803D',
    fontSize: 9,
    lineHeight: 15,
    fontWeight: '700',
    marginLeft: 7,
  },

  closeDetailsButton: {
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    marginBottom: 10,
  },

  closeDetailsText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});