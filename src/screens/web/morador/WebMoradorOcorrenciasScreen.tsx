import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

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
  AlertTriangle,
  CheckCircle2,
  Clock3,
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
import { supabase } from '../../../services/supabase';

// ======================================================
// TIPOS
// ======================================================

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

type FiltroStatus =
  | 'todas'
  | 'pendente'
  | 'em_andamento'
  | 'resolvida';

// ======================================================
// TEXTOS
// ======================================================

function categoriaTexto(
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

function statusTexto(
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

function formatarData(
  valor: string
) {
  if (!valor) {
    return '-';
  }

  try {
    const data = new Date(valor);

    if (
      Number.isNaN(
        data.getTime()
      )
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
// COMPONENTE
// ======================================================

export default function WebMoradorOcorrenciasScreen() {
  const [
    modalNova,
    setModalNova,
  ] = useState(false);

  const [
    ocorrenciaSelecionada,
    setOcorrenciaSelecionada,
  ] =
    useState<Ocorrencia | null>(
      null
    );

  const [filtro, setFiltro] =
    useState<FiltroStatus>(
      'todas'
    );

  const [
    ocorrencias,
    setOcorrencias,
  ] = useState<Ocorrencia[]>(
    []
  );

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    enviando,
    setEnviando,
  ] = useState(false);

  const [erro, setErro] =
    useState('');

  const [
    mensagemSucesso,
    setMensagemSucesso,
  ] = useState('');

  // ====================================================
  // FORMULÁRIO
  // ====================================================

  const [titulo, setTitulo] =
    useState('');

  const [
    descricao,
    setDescricao,
  ] = useState('');

  const [local, setLocal] =
    useState('');

  const [
    categoria,
    setCategoria,
  ] =
    useState<Categoria>(
      'manutencao'
    );

  const [
    prioridade,
    setPrioridade,
  ] =
    useState<Prioridade>(
      'normal'
    );

  // ====================================================
  // CARREGAR OCORRÊNCIAS DO MORADOR
  // ====================================================

  const carregarOcorrencias =
    useCallback(async () => {
      try {
        setCarregando(true);
        setErro('');

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

        const usuario =
          userData.user;

        // Confirma se a conta é realmente de morador
        const {
          data: perfil,
          error: perfilError,
        } = await supabase
          .from('perfis')
          .select(
            'id, tipo, ativo'
          )
          .eq(
            'id',
            usuario.id
          )
          .maybeSingle();

        if (perfilError) {
          console.error(
            'ERRO AO BUSCAR PERFIL:',
            perfilError
          );

          setErro(
            'Não foi possível verificar o perfil do morador.'
          );

          return;
        }

        if (!perfil) {
          setErro(
            'Perfil do morador não encontrado.'
          );

          return;
        }

        if (
          perfil.tipo !==
          'morador'
        ) {
          setErro(
            'Esta conta não possui acesso à área do morador.'
          );

          return;
        }

        if (!perfil.ativo) {
          setErro(
            'Este usuário está desativado.'
          );

          return;
        }

        const {
          data,
          error,
        } = await supabase
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
          .eq(
            'morador_id',
            usuario.id
          )
          .order(
            'criado_em',
            {
              ascending: false,
            }
          );

        if (error) {
          console.error(
            'ERRO AO CARREGAR OCORRÊNCIAS:',
            error
          );

          setErro(
            `Não foi possível carregar suas ocorrências: ${error.message}`
          );

          return;
        }

        setOcorrencias(
          (data ??
            []) as Ocorrencia[]
        );
      } catch (error) {
        console.error(
          'ERRO INESPERADO AO CARREGAR OCORRÊNCIAS:',
          error
        );

        setErro(
          'Ocorreu um erro ao carregar suas ocorrências.'
        );
      } finally {
        setCarregando(false);
      }
    }, []);

  useEffect(() => {
    carregarOcorrencias();
  }, [carregarOcorrencias]);

  // ====================================================
  // FILTROS
  // ====================================================

  const ocorrenciasFiltradas =
    useMemo(() => {
      if (
        filtro === 'todas'
      ) {
        return ocorrencias;
      }

      return ocorrencias.filter(
        (item) =>
          item.status === filtro
      );
    }, [
      ocorrencias,
      filtro,
    ]);

  // ====================================================
  // CONTADORES
  // ====================================================

  const pendentes = useMemo(
    () =>
      ocorrencias.filter(
        (item) =>
          item.status ===
          'pendente'
      ).length,
    [ocorrencias]
  );

  const andamento = useMemo(
    () =>
      ocorrencias.filter(
        (item) =>
          item.status ===
          'em_andamento'
      ).length,
    [ocorrencias]
  );

  const resolvidas = useMemo(
    () =>
      ocorrencias.filter(
        (item) =>
          item.status ===
          'resolvida'
      ).length,
    [ocorrencias]
  );

  // ====================================================
  // FECHAR NOVA OCORRÊNCIA
  // ====================================================

  function fecharNovaOcorrencia() {
    if (enviando) {
      return;
    }

    setModalNova(false);

    setTitulo('');
    setDescricao('');
    setLocal('');
    setCategoria(
      'manutencao'
    );
    setPrioridade(
      'normal'
    );
  }

  // ====================================================
  // ENVIAR OCORRÊNCIA
  // ====================================================

  async function enviarOcorrencia() {
    try {
      setErro('');
      setMensagemSucesso('');

      const tituloLimpo =
        titulo.trim();

      const descricaoLimpa =
        descricao.trim();

      const localLimpo =
        local.trim();

      if (!tituloLimpo) {
        Alert.alert(
          'Atenção',
          'Informe o título da ocorrência.'
        );

        return;
      }

      if (!descricaoLimpa) {
        Alert.alert(
          'Atenção',
          'Descreva o problema da ocorrência.'
        );

        return;
      }

      setEnviando(true);

      // ----------------------------------------------
      // USUÁRIO LOGADO
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
          'Sua sessão expirou. Entre novamente na conta.'
        );

        return;
      }

      const usuario =
        userData.user;

      // ----------------------------------------------
      // CONFIRMAR PERFIL
      // ----------------------------------------------

      const {
        data: perfil,
        error: perfilError,
      } = await supabase
        .from('perfis')
        .select(
          'id, tipo, ativo'
        )
        .eq(
          'id',
          usuario.id
        )
        .maybeSingle();

      if (perfilError) {
        console.error(
          'ERRO AO VERIFICAR PERFIL:',
          perfilError
        );

        setErro(
          'Não foi possível verificar seu perfil.'
        );

        return;
      }

      if (
        !perfil ||
        perfil.tipo !==
          'morador'
      ) {
        setErro(
          'Não foi possível identificar o perfil do morador.'
        );

        return;
      }

      if (!perfil.ativo) {
        setErro(
          'Este usuário está desativado.'
        );

        return;
      }

      // ----------------------------------------------
      // SALVAR NO SUPABASE
      // ----------------------------------------------

      const agora =
        new Date().toISOString();

      const {
        data,
        error,
      } = await supabase
        .from('ocorrencias')
        .insert({
          morador_id:
            usuario.id,

          titulo:
            tituloLimpo,

          descricao:
            descricaoLimpa,

          categoria,

          local_ocorrencia:
            localLimpo ||
            null,

          prioridade,

          status:
            'pendente',

          resposta_admin:
            null,

          atualizado_em:
            agora,

          resolvido_em:
            null,
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
        console.error(
          'ERRO AO CRIAR OCORRÊNCIA:',
          error
        );

        setErro(
          `Não foi possível enviar a ocorrência: ${error.message}`
        );

        return;
      }

      const novaOcorrencia =
        data as Ocorrencia;

      setOcorrencias(
        (anteriores) => [
          novaOcorrencia,
          ...anteriores,
        ]
      );

      setModalNova(false);

      setTitulo('');
      setDescricao('');
      setLocal('');
      setCategoria(
        'manutencao'
      );
      setPrioridade(
        'normal'
      );

      setMensagemSucesso(
        'Ocorrência enviada com sucesso. A administração já poderá visualizá-la.'
      );
    } catch (error) {
      console.error(
        'ERRO INESPERADO AO ENVIAR OCORRÊNCIA:',
        error
      );

      setErro(
        'Ocorreu um erro ao enviar a ocorrência.'
      );
    } finally {
      setEnviando(false);
    }
  }

  // ====================================================
  // TELA
  // ====================================================

  return (
    <View style={styles.container}>
      <WebMoradorSidebar
        active="ocorrencias"
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
              Ocorrências
            </Text>

            <Text
              style={styles.subtitle}
            >
              Registre problemas e acompanhe o atendimento da administração.
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
                carregarOcorrencias
              }
            >
              <RefreshCw
                size={17}
                color={
                  colors.textSecondary
                }
              />
            </Pressable>

            <Pressable
              style={styles.newButton}
              onPress={() => {
                setErro('');
                setMensagemSucesso(
                  ''
                );
                setModalNova(true);
              }}
            >
              <Plus
                size={18}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.newButtonText
                }
              >
                Nova ocorrência
              </Text>
            </Pressable>
          </View>
        </View>

        {/* SUCESSO */}

        {!!mensagemSucesso && (
          <View
            style={
              styles.successBox
            }
          >
            <CheckCircle2
              size={17}
              color="#15803D"
            />

            <Text
              style={
                styles.successText
              }
            >
              {mensagemSucesso}
            </Text>
          </View>
        )}

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
              style={
                styles.loadingText
              }
            >
              Carregando suas ocorrências...
            </Text>
          </View>
        ) : (
          <>
            {/* RESUMO */}

            <View
              style={styles.summary}
            >
              <SummaryCard
                titulo="Total"
                valor={
                  ocorrencias.length
                }
                icon={
                  <ShieldAlert
                    size={21}
                    color={
                      colors.primary
                    }
                  />
                }
              />

              <SummaryCard
                titulo="Pendentes"
                valor={pendentes}
                icon={
                  <AlertTriangle
                    size={21}
                    color="#B45309"
                  />
                }
              />

              <SummaryCard
                titulo="Em andamento"
                valor={andamento}
                icon={
                  <Clock3
                    size={21}
                    color={
                      colors.primary
                    }
                  />
                }
              />

              <SummaryCard
                titulo="Resolvidas"
                valor={resolvidas}
                ultimo
                icon={
                  <CheckCircle2
                    size={21}
                    color="#15803D"
                  />
                }
              />
            </View>

            {/* FILTROS */}

            <View
              style={
                styles.filtersContainer
              }
            >
              <Text
                style={
                  styles.filterTitle
                }
              >
                Filtrar ocorrências
              </Text>

              <View
                style={
                  styles.filterButtons
                }
              >
                <FilterButton
                  titulo="Todas"
                  active={
                    filtro ===
                    'todas'
                  }
                  onPress={() =>
                    setFiltro(
                      'todas'
                    )
                  }
                />

                <FilterButton
                  titulo="Pendentes"
                  active={
                    filtro ===
                    'pendente'
                  }
                  onPress={() =>
                    setFiltro(
                      'pendente'
                    )
                  }
                />

                <FilterButton
                  titulo="Em andamento"
                  active={
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
                  titulo="Resolvidas"
                  active={
                    filtro ===
                    'resolvida'
                  }
                  onPress={() =>
                    setFiltro(
                      'resolvida'
                    )
                  }
                />
              </View>
            </View>

            {/* LISTA */}

            <Text
              style={
                styles.sectionTitle
              }
            >
              Minhas ocorrências
            </Text>

            <View
              style={
                styles.listContainer
              }
            >
              {ocorrenciasFiltradas.length ===
              0 ? (
                <View
                  style={styles.empty}
                >
                  <ShieldAlert
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
                    Nenhuma ocorrência
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    Você não possui ocorrências neste filtro.
                  </Text>
                </View>
              ) : (
                ocorrenciasFiltradas.map(
                  (
                    ocorrencia
                  ) => (
                    <View
                      key={
                        ocorrencia.id
                      }
                      style={
                        styles.occurrenceCard
                      }
                    >
                      <View
                        style={
                          styles.occurrenceIcon
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
                          styles.occurrenceContent
                        }
                      >
                        <View
                          style={
                            styles.occurrenceTop
                          }
                        >
                          <Text
                            style={
                              styles.occurrenceTitle
                            }
                          >
                            {
                              ocorrencia.titulo
                            }
                          </Text>

                          <StatusBadge
                            status={
                              ocorrencia.status
                            }
                          />
                        </View>

                        <Text
                          numberOfLines={
                            2
                          }
                          style={
                            styles.occurrenceDescription
                          }
                        >
                          {
                            ocorrencia.descricao
                          }
                        </Text>

                        <View
                          style={
                            styles.detailsRow
                          }
                        >
                          <View
                            style={
                              styles.detailItem
                            }
                          >
                            <MapPin
                              size={13}
                              color={
                                colors.textSecondary
                              }
                            />

                            <Text
                              style={
                                styles.detailText
                              }
                            >
                              {ocorrencia.local_ocorrencia ||
                                'Local não informado'}
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
                                ocorrencia.categoria
                              )}
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

                          <Text
                            style={
                              styles.dateText
                            }
                          >
                            {formatarData(
                              ocorrencia.criado_em
                            )}
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        style={
                          styles.viewButton
                        }
                        onPress={() =>
                          setOcorrenciaSelecionada(
                            ocorrencia
                          )
                        }
                      >
                        <Eye
                          size={16}
                          color={
                            colors.primary
                          }
                        />

                        <Text
                          style={
                            styles.viewButtonText
                          }
                        >
                          Ver detalhes
                        </Text>
                      </Pressable>
                    </View>
                  )
                )
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* ==================================================
          MODAL NOVA OCORRÊNCIA
      ================================================== */}

      <Modal
        visible={modalNova}
        transparent
        animationType="fade"
        onRequestClose={
          fecharNovaOcorrencia
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
                  Nova ocorrência
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  Descreva o problema para a administração.
                </Text>
              </View>

              <Pressable
                style={
                  styles.closeButton
                }
                onPress={
                  fecharNovaOcorrencia
                }
                disabled={enviando}
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
                Título
              </Text>

              <TextInput
                style={styles.input}
                value={titulo}
                onChangeText={
                  setTitulo
                }
                placeholder="Ex.: Lâmpada queimada"
                placeholderTextColor={
                  colors.textLight
                }
                editable={!enviando}
              />

              <Text
                style={styles.label}
              >
                Categoria
              </Text>

              <View
                style={
                  styles.optionsWrap
                }
              >
                <OptionButton
                  titulo="Manutenção"
                  active={
                    categoria ===
                    'manutencao'
                  }
                  onPress={() =>
                    setCategoria(
                      'manutencao'
                    )
                  }
                />

                <OptionButton
                  titulo="Barulho"
                  active={
                    categoria ===
                    'barulho'
                  }
                  onPress={() =>
                    setCategoria(
                      'barulho'
                    )
                  }
                />

                <OptionButton
                  titulo="Limpeza"
                  active={
                    categoria ===
                    'limpeza'
                  }
                  onPress={() =>
                    setCategoria(
                      'limpeza'
                    )
                  }
                />

                <OptionButton
                  titulo="Segurança"
                  active={
                    categoria ===
                    'seguranca'
                  }
                  onPress={() =>
                    setCategoria(
                      'seguranca'
                    )
                  }
                />

                <OptionButton
                  titulo="Área comum"
                  active={
                    categoria ===
                    'area_comum'
                  }
                  onPress={() =>
                    setCategoria(
                      'area_comum'
                    )
                  }
                />

                <OptionButton
                  titulo="Outro"
                  active={
                    categoria ===
                    'outro'
                  }
                  onPress={() =>
                    setCategoria(
                      'outro'
                    )
                  }
                />
              </View>

              <Text
                style={styles.label}
              >
                Local da ocorrência
              </Text>

              <TextInput
                style={styles.input}
                value={local}
                onChangeText={
                  setLocal
                }
                placeholder="Ex.: Entrada principal"
                placeholderTextColor={
                  colors.textLight
                }
                editable={!enviando}
              />

              <Text
                style={styles.label}
              >
                Prioridade
              </Text>

              <View
                style={
                  styles.priorityOptions
                }
              >
                <OptionButton
                  titulo="Normal"
                  active={
                    prioridade ===
                    'normal'
                  }
                  onPress={() =>
                    setPrioridade(
                      'normal'
                    )
                  }
                />

                <OptionButton
                  titulo="Importante"
                  active={
                    prioridade ===
                    'importante'
                  }
                  onPress={() =>
                    setPrioridade(
                      'importante'
                    )
                  }
                />

                <OptionButton
                  titulo="Urgente"
                  active={
                    prioridade ===
                    'urgente'
                  }
                  onPress={() =>
                    setPrioridade(
                      'urgente'
                    )
                  }
                />
              </View>

              <Text
                style={styles.label}
              >
                Descrição
              </Text>

              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                ]}
                value={descricao}
                onChangeText={
                  setDescricao
                }
                multiline
                textAlignVertical="top"
                placeholder="Explique o que aconteceu..."
                placeholderTextColor={
                  colors.textLight
                }
                editable={!enviando}
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
                    fecharNovaOcorrencia
                  }
                  disabled={enviando}
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
                    styles.sendButton,
                    enviando &&
                      styles.buttonDisabled,
                  ]}
                  onPress={
                    enviarOcorrencia
                  }
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
                        size={16}
                        color="#FFFFFF"
                      />

                      <Text
                        style={
                          styles.sendButtonText
                        }
                      >
                        Enviar ocorrência
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================================================
          MODAL DETALHES
      ================================================== */}

      <Modal
        visible={
          ocorrenciaSelecionada !==
          null
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setOcorrenciaSelecionada(
            null
          )
        }
      >
        <View
          style={styles.modalOverlay}
        >
          <View
            style={
              styles.detailsModal
            }
          >
            {ocorrenciaSelecionada ? (
              <>
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
                      Detalhes da ocorrência
                    </Text>

                    <Text
                      style={
                        styles.modalSubtitle
                      }
                    >
                      Criada em{' '}
                      {formatarData(
                        ocorrenciaSelecionada.criado_em
                      )}
                    </Text>
                  </View>

                  <Pressable
                    style={
                      styles.closeButton
                    }
                    onPress={() =>
                      setOcorrenciaSelecionada(
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
                      styles.detailsStatus
                    }
                  >
                    <StatusBadge
                      status={
                        ocorrenciaSelecionada.status
                      }
                    />

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

                  <Text
                    style={
                      styles.detailsTitle
                    }
                  >
                    {
                      ocorrenciaSelecionada.titulo
                    }
                  </Text>

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
                    >
                      {ocorrenciaSelecionada.local_ocorrencia ||
                        'Local não informado'}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.divider
                    }
                  />

                  <Text
                    style={
                      styles.detailsLabel
                    }
                  >
                    Descrição
                  </Text>

                  <Text
                    style={
                      styles.detailsDescription
                    }
                  >
                    {
                      ocorrenciaSelecionada.descricao
                    }
                  </Text>

                  <View
                    style={
                      styles.responseBox
                    }
                  >
                    <View
                      style={
                        styles.responseHeader
                      }
                    >
                      <MessageSquare
                        size={17}
                        color={
                          colors.primary
                        }
                      />

                      <Text
                        style={
                          styles.responseTitle
                        }
                      >
                        Resposta da administração
                      </Text>
                    </View>

                    {ocorrenciaSelecionada.resposta_admin ? (
                      <Text
                        style={
                          styles.responseText
                        }
                      >
                        {
                          ocorrenciaSelecionada.resposta_admin
                        }
                      </Text>
                    ) : (
                      <Text
                        style={
                          styles.noResponseText
                        }
                      >
                        A administração ainda não respondeu esta ocorrência.
                      </Text>
                    )}
                  </View>

                  {ocorrenciaSelecionada.status ===
                    'resolvida' &&
                    ocorrenciaSelecionada.resolvido_em && (
                      <View
                        style={
                          styles.resolvedBox
                        }
                      >
                        <CheckCircle2
                          size={17}
                          color="#15803D"
                        />

                        <Text
                          style={
                            styles.resolvedText
                          }
                        >
                          Resolvida em{' '}
                          {formatarData(
                            ocorrenciaSelecionada.resolvido_em
                          )}
                        </Text>
                      </View>
                    )}

                  <Pressable
                    style={
                      styles.closeDetailsButton
                    }
                    onPress={() =>
                      setOcorrenciaSelecionada(
                        null
                      )
                    }
                  >
                    <Text
                      style={
                        styles.closeDetailsText
                      }
                    >
                      Fechar
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
// COMPONENTES AUXILIARES
// ======================================================

type SummaryCardProps = {
  titulo: string;
  valor: number;
  icon: React.ReactNode;
  ultimo?: boolean;
};

function SummaryCard({
  titulo,
  valor,
  icon,
  ultimo = false,
}: SummaryCardProps) {
  return (
    <View
      style={[
        styles.summaryCard,
        ultimo &&
          styles.summaryCardLast,
      ]}
    >
      <View
        style={
          styles.summaryIcon
        }
      >
        {icon}
      </View>

      <View>
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

type FilterButtonProps = {
  titulo: string;
  active: boolean;
  onPress: () => void;
};

function FilterButton({
  titulo,
  active,
  onPress,
}: FilterButtonProps) {
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
          styles.filterButtonText,
          active &&
            styles.filterButtonTextActive,
        ]}
      >
        {titulo}
      </Text>
    </Pressable>
  );
}

type OptionButtonProps = {
  titulo: string;
  active: boolean;
  onPress: () => void;
};

function OptionButton({
  titulo,
  active,
  onPress,
}: OptionButtonProps) {
  return (
    <Pressable
      style={[
        styles.optionButton,
        active &&
          styles.optionButtonActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.optionButtonText,
          active &&
            styles.optionButtonTextActive,
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

        status === 'pendente' &&
          styles.statusPending,

        status ===
          'em_andamento' &&
          styles.statusProgress,

        status ===
          'resolvida' &&
          styles.statusResolved,
      ]}
    >
      <Text
        style={[
          styles.statusText,

          status ===
            'pendente' &&
            styles.statusPendingText,

          status ===
            'em_andamento' &&
            styles.statusProgressText,

          status ===
            'resolvida' &&
            styles.statusResolvedText,
        ]}
      >
        {statusTexto(status)}
      </Text>
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
      width: 43,
      height: 43,
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

    newButton: {
      height: 43,
      borderRadius: 11,
      backgroundColor:
        colors.primary,
      paddingHorizontal: 17,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
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
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor:
        '#DCFCE7',
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 18,
    },

    successText: {
      flex: 1,
      color: '#15803D',
      fontSize: 10,
      fontWeight: '700',
      marginLeft: 8,
    },

    errorBox: {
      minHeight: 46,
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
      minHeight: 100,
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 14,
      padding: 16,
      marginRight: 11,
      flexDirection: 'row',
      alignItems: 'center',
    },

    summaryCardLast: {
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
      marginRight: 12,
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
      borderColor:
        colors.border,
      backgroundColor:
        colors.background,
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 8,
      marginBottom: 5,
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

    occurrenceCard: {
      minHeight: 125,
      borderBottomWidth: 1,
      borderBottomColor:
        colors.border,
      padding: 17,
      flexDirection: 'row',
      alignItems: 'center',
    },

    occurrenceIcon: {
      width: 45,
      height: 45,
      borderRadius: 12,
      backgroundColor:
        colors.primaryLight,
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 14,
    },

    occurrenceContent: {
      flex: 1,
    },

    occurrenceTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    occurrenceTitle: {
      flex: 1,
      color: colors.text,
      fontSize: 11,
      fontWeight: '800',
      marginRight: 10,
    },

    occurrenceDescription: {
      color:
        colors.textSecondary,
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
    },

    detailText: {
      color:
        colors.textSecondary,
      fontSize: 8,
      marginLeft: 4,
    },

    categoryBadge: {
      backgroundColor:
        colors.background,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 7,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginRight: 7,
    },

    categoryText: {
      color:
        colors.textSecondary,
      fontSize: 8,
      fontWeight: '700',
    },

    priorityBadge: {
      backgroundColor:
        colors.primaryLight,
      borderRadius: 7,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginRight: 8,
    },

    priorityImportant: {
      backgroundColor:
        '#FEF3C7',
    },

    priorityUrgent: {
      backgroundColor:
        '#FEE2E2',
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
    },

    viewButton: {
      minHeight: 36,
      borderRadius: 9,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.background,
      paddingHorizontal: 11,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      marginLeft: 14,
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
    },

    statusText: {
      fontSize: 8,
      fontWeight: '800',
    },

    statusPending: {
      backgroundColor:
        '#FEF3C7',
    },

    statusPendingText: {
      color: '#B45309',
    },

    statusProgress: {
      backgroundColor:
        colors.primaryLight,
    },

    statusProgressText: {
      color: colors.primary,
    },

    statusResolved: {
      backgroundColor:
        '#DCFCE7',
    },

    statusResolvedText: {
      color: '#15803D',
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
      maxWidth: 650,
      maxHeight: '92%',
      backgroundColor:
        colors.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        colors.border,
      padding: 22,
    },

    detailsModal: {
      width: '100%',
      maxWidth: 620,
      maxHeight: '88%',
      backgroundColor:
        colors.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        colors.border,
      padding: 22,
    },

    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginBottom: 14,
    },

    modalTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
    },

    modalSubtitle: {
      color:
        colors.textSecondary,
      fontSize: 9,
      marginTop: 4,
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

    label: {
      color: colors.text,
      fontSize: 10,
      fontWeight: '800',
      marginTop: 13,
      marginBottom: 7,
    },

    input: {
      minHeight: 44,
      backgroundColor:
        colors.background,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 11,
      paddingHorizontal: 12,
      color: colors.text,
      fontSize: 10,
    },

    textArea: {
      minHeight: 105,
      paddingTop: 11,
      paddingBottom: 11,
    },

    optionsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },

    priorityOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },

    optionButton: {
      minHeight: 38,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 9,
      backgroundColor:
        colors.background,
      paddingHorizontal: 13,
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 7,
      marginBottom: 7,
    },

    optionButtonActive: {
      borderColor:
        colors.primary,
      backgroundColor:
        colors.primaryLight,
    },

    optionButtonText: {
      color:
        colors.textSecondary,
      fontSize: 9,
      fontWeight: '700',
    },

    optionButtonTextActive: {
      color: colors.primary,
      fontWeight: '800',
    },

    modalActions: {
      flexDirection: 'row',
      marginTop: 20,
    },

    cancelButton: {
      height: 45,
      borderRadius: 11,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.background,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 9,
    },

    cancelButtonText: {
      color: colors.text,
      fontSize: 10,
      fontWeight: '800',
    },

    sendButton: {
      flex: 1,
      height: 45,
      borderRadius: 11,
      backgroundColor:
        colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    buttonDisabled: {
      opacity: 0.65,
    },

    sendButtonText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
      marginLeft: 7,
    },

    detailsStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginBottom: 14,
    },

    detailsTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
    },

    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 9,
    },

    locationText: {
      color:
        colors.textSecondary,
      fontSize: 9,
      marginLeft: 5,
    },

    divider: {
      height: 1,
      backgroundColor:
        colors.border,
      marginVertical: 18,
    },

    detailsLabel: {
      color: colors.text,
      fontSize: 10,
      fontWeight: '800',
      marginBottom: 7,
    },

    detailsDescription: {
      color:
        colors.textSecondary,
      fontSize: 10,
      lineHeight: 18,
    },

    responseBox: {
      backgroundColor:
        colors.primaryLight,
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
      color:
        colors.textSecondary,
      fontSize: 9,
      lineHeight: 16,
    },

    resolvedBox: {
      minHeight: 44,
      backgroundColor:
        '#DCFCE7',
      borderRadius: 10,
      paddingHorizontal: 13,
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },

    resolvedText: {
      color: '#15803D',
      fontSize: 9,
      fontWeight: '700',
      marginLeft: 7,
    },

    closeDetailsButton: {
      height: 44,
      borderRadius: 10,
      backgroundColor:
        colors.primary,
      alignItems: 'center',
      justifyContent:
        'center',
      marginTop: 22,
    },

    closeDetailsText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
    },
  });