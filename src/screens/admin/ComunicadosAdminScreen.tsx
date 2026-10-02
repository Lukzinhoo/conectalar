import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Edit3,
  Eye,
  EyeOff,
  Home,
  Megaphone,
  Plus,
  Trash2,
  X,
} from 'lucide-react-native';

import { colors } from '../../theme/theme';
import { supabase } from '../../services/supabase';

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

const categorias: {
  value: Categoria;
  label: string;
}[] = [
  {
    value: 'geral',
    label: 'Geral',
  },
  {
    value: 'manutencao',
    label: 'Manutenção',
  },
  {
    value: 'reuniao',
    label: 'Reunião',
  },
  {
    value: 'evento',
    label: 'Evento',
  },
  {
    value: 'seguranca',
    label: 'Segurança',
  },
  {
    value: 'outro',
    label: 'Outro',
  },
];

const prioridades: {
  value: Prioridade;
  label: string;
}[] = [
  {
    value: 'normal',
    label: 'Normal',
  },
  {
    value: 'importante',
    label: 'Importante',
  },
  {
    value: 'urgente',
    label: 'Urgente',
  },
];

export default function ComunicadosAdminScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [comunicados, setComunicados] =
    useState<Comunicado[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [atualizando, setAtualizando] =
    useState(false);

  const [salvando, setSalvando] =
    useState(false);

  const [modalAberto, setModalAberto] =
    useState(false);

  const [comunicadoEditando, setComunicadoEditando] =
    useState<Comunicado | null>(null);

  const [titulo, setTitulo] =
    useState('');

  const [mensagem, setMensagem] =
    useState('');

  const [categoria, setCategoria] =
    useState<Categoria>('geral');

  const [prioridade, setPrioridade] =
    useState<Prioridade>('normal');

  const [publicado, setPublicado] =
    useState(true);

  const [
    categoriasAbertas,
    setCategoriasAbertas,
  ] = useState(false);

  const [
    prioridadesAbertas,
    setPrioridadesAbertas,
  ] = useState(false);

  const carregarComunicados =
    useCallback(async () => {
      try {
        const { data, error } =
          await supabase
            .from('comunicados')
            .select(
              `
                id,
                titulo,
                mensagem,
                categoria,
                prioridade,
                publicado,
                criado_em,
                atualizado_em
              `
            )
            .order(
              'criado_em',
              {
                ascending: false,
              }
            );

        if (error) {
          console.error(
            'Erro ao carregar comunicados:',
            error
          );

          Alert.alert(
            'Erro',
            'Não foi possível carregar os comunicados.'
          );

          return;
        }

        setComunicados(
          (data || []) as Comunicado[]
        );
      } catch (error) {
        console.error(
          'Erro inesperado:',
          error
        );

        Alert.alert(
          'Erro',
          'Ocorreu um erro ao carregar os comunicados.'
        );
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    }, []);

  useEffect(() => {
    carregarComunicados();
  }, [carregarComunicados]);

  function atualizarLista() {
    setAtualizando(true);
    carregarComunicados();
  }

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
    limparFormulario();
    setModalAberto(true);
  }

  function abrirEditarComunicado(
    comunicado: Comunicado
  ) {
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
    if (salvando) {
      return;
    }

    setModalAberto(false);
    limparFormulario();
  }

  async function salvarComunicado() {
    const tituloLimpo =
      titulo.trim();

    const mensagemLimpa =
      mensagem.trim();

    if (!tituloLimpo) {
      Alert.alert(
        'Atenção',
        'Informe o título do comunicado.'
      );

      return;
    }

    if (!mensagemLimpa) {
      Alert.alert(
        'Atenção',
        'Informe a mensagem do comunicado.'
      );

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
        atualizado_em:
          new Date().toISOString(),
      };

      if (comunicadoEditando) {
        const { error } =
          await supabase
            .from('comunicados')
            .update(dados)
            .eq(
              'id',
              comunicadoEditando.id
            );

        if (error) {
          console.error(
            'Erro ao editar comunicado:',
            error
          );

          Alert.alert(
            'Erro',
            'Não foi possível editar o comunicado.'
          );

          return;
        }
      } else {
        const { error } =
          await supabase
            .from('comunicados')
            .insert({
              ...dados,
              criado_em:
                new Date().toISOString(),
            });

        if (error) {
          console.error(
            'Erro ao criar comunicado:',
            error
          );

          Alert.alert(
            'Erro',
            'Não foi possível criar o comunicado.'
          );

          return;
        }
      }

      setModalAberto(false);
      limparFormulario();

      await carregarComunicados();
    } catch (error) {
      console.error(
        'Erro ao salvar comunicado:',
        error
      );

      Alert.alert(
        'Erro',
        'Não foi possível salvar o comunicado.'
      );
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusao(
    comunicado: Comunicado
  ) {
    Alert.alert(
      'Excluir comunicado',
      `Deseja excluir "${comunicado.titulo}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () =>
            excluirComunicado(
              comunicado.id
            ),
        },
      ]
    );
  }

  async function excluirComunicado(
    id: string
  ) {
    try {
      const { error } =
        await supabase
          .from('comunicados')
          .delete()
          .eq('id', id);

      if (error) {
        console.error(
          'Erro ao excluir comunicado:',
          error
        );

        Alert.alert(
          'Erro',
          'Não foi possível excluir o comunicado.'
        );

        return;
      }

      setComunicados(
        lista =>
          lista.filter(
            item => item.id !== id
          )
      );
    } catch (error) {
      console.error(
        'Erro ao excluir comunicado:',
        error
      );

      Alert.alert(
        'Erro',
        'Não foi possível excluir o comunicado.'
      );
    }
  }

  async function alterarPublicacao(
    comunicado: Comunicado
  ) {
    const novoStatus =
      !comunicado.publicado;

    try {
      const { error } =
        await supabase
          .from('comunicados')
          .update({
            publicado: novoStatus,
            atualizado_em:
              new Date().toISOString(),
          })
          .eq(
            'id',
            comunicado.id
          );

      if (error) {
        console.error(
          'Erro ao alterar publicação:',
          error
        );

        Alert.alert(
          'Erro',
          'Não foi possível alterar a publicação.'
        );

        return;
      }

      setComunicados(
        lista =>
          lista.map(item =>
            item.id === comunicado.id
              ? {
                  ...item,
                  publicado: novoStatus,
                }
              : item
          )
      );
    } catch (error) {
      console.error(
        'Erro ao alterar publicação:',
        error
      );

      Alert.alert(
        'Erro',
        'Não foi possível alterar a publicação.'
      );
    }
  }

  function nomeCategoria(
    valor: Categoria
  ) {
    return (
      categorias.find(
        item => item.value === valor
      )?.label || 'Geral'
    );
  }

  function nomePrioridade(
    valor: Prioridade
  ) {
    return (
      prioridades.find(
        item => item.value === valor
      )?.label || 'Normal'
    );
  }

  function formatarData(
    data: string
  ) {
    if (!data) {
      return '';
    }

    const date = new Date(data);

    return date.toLocaleDateString(
      'pt-BR',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }
    );
  }

  const total =
    comunicados.length;

  const publicados =
    comunicados.filter(
      item => item.publicado
    ).length;

  const urgentes =
    comunicados.filter(
      item =>
        item.prioridade === 'urgente'
    ).length;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom:
            Math.max(
              insets.bottom,
              20
            ) + 25,
        }}
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={atualizarLista}
          />
        }
      >
        {/* HEADER */}
        <View
          style={[
            styles.header,
            {
              paddingTop:
                Math.max(
                  insets.top,
                  20
                ) + 8,
            },
          ]}
        >
          <View style={styles.headerTop}>
            <Pressable
              style={styles.backButton}
              onPress={() =>
                navigation.goBack()
              }
            >
              <ArrowLeft
                size={19}
                color="#FFFFFF"
              />
            </Pressable>

            <View style={styles.brandRow}>
              <View style={styles.brandIcon}>
                <Home
                  size={17}
                  color="#FFFFFF"
                />
              </View>

              <Text style={styles.brand}>
                ConectaLar
              </Text>
            </View>

            <View
              style={styles.headerSpacer}
            />
          </View>

          <Text style={styles.headerTitle}>
            Comunicados
          </Text>

          <Text
            style={styles.headerDescription}
          >
            Crie e gerencie avisos para os
            moradores do condomínio.
          </Text>
        </View>

        {/* CONTEÚDO */}
        <View style={styles.body}>
          <View style={styles.sectionTop}>
            <View style={styles.sectionText}>
              <Text
                style={styles.sectionTitle}
              >
                Comunicados
              </Text>

              <Text
                style={styles.sectionSubtitle}
              >
                Gerencie os avisos publicados.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                pressed &&
                  styles.buttonPressed,
              ]}
              onPress={
                abrirNovoComunicado
              }
            >
              <Plus
                size={15}
                color="#FFFFFF"
              />

              <Text
                style={styles.addButtonText}
              >
                Novo
              </Text>
            </Pressable>
          </View>

          {/* RESUMO */}
          <View style={styles.summaryRow}>
            <View
              style={styles.summaryCard}
            >
              <View
                style={
                  styles.summaryIcon
                }
              >
                <Megaphone
                  size={19}
                  color={colors.primary}
                />
              </View>

              <Text
                style={styles.summaryNumber}
              >
                {total}
              </Text>

              <Text
                style={styles.summaryLabel}
              >
                Total
              </Text>
            </View>

            <View
              style={styles.summaryCard}
            >
              <View
                style={
                  styles.summaryIcon
                }
              >
                <Eye
                  size={19}
                  color={colors.primary}
                />
              </View>

              <Text
                style={styles.summaryNumber}
              >
                {publicados}
              </Text>

              <Text
                style={styles.summaryLabel}
              >
                Publicados
              </Text>
            </View>

            <View
              style={styles.summaryCard}
            >
              <View
                style={
                  styles.summaryIcon
                }
              >
                <Bell
                  size={19}
                  color="#DC2626"
                />
              </View>

              <Text
                style={styles.summaryNumber}
              >
                {urgentes}
              </Text>

              <Text
                style={styles.summaryLabel}
              >
                Urgentes
              </Text>
            </View>
          </View>

          {/* LISTA */}
          <View style={styles.listHeader}>
            <Text
              style={styles.listTitle}
            >
              Avisos cadastrados
            </Text>

            <Text
              style={styles.listCount}
            >
              {total}
            </Text>
          </View>

          {carregando ? (
            <View
              style={styles.loadingBox}
            >
              <ActivityIndicator
                size="small"
                color={colors.primary}
              />

              <Text
                style={styles.loadingText}
              >
                Carregando comunicados...
              </Text>
            </View>
          ) : comunicados.length === 0 ? (
            <View style={styles.emptyCard}>
              <View
                style={styles.emptyIcon}
              >
                <Megaphone
                  size={25}
                  color={colors.primary}
                />
              </View>

              <Text
                style={styles.emptyTitle}
              >
                Nenhum comunicado
              </Text>

              <Text
                style={styles.emptyText}
              >
                Toque em "Novo" para criar
                o primeiro aviso.
              </Text>
            </View>
          ) : (
            comunicados.map(
              comunicado => (
                <View
                  key={comunicado.id}
                  style={
                    styles.comunicadoCard
                  }
                >
                  <View
                    style={
                      styles.cardHeader
                    }
                  >
                    <View
                      style={
                        styles.cardTitleArea
                      }
                    >
                      <View
                        style={[
                          styles.priorityDot,
                          comunicado.prioridade ===
                            'urgente' &&
                            styles.priorityUrgent,
                          comunicado.prioridade ===
                            'importante' &&
                            styles.priorityImportant,
                        ]}
                      />

                      <View
                        style={
                          styles.cardTitleText
                        }
                      >
                        <Text
                          style={
                            styles.comunicadoTitle
                          }
                          numberOfLines={2}
                        >
                          {
                            comunicado.titulo
                          }
                        </Text>

                        <Text
                          style={
                            styles.comunicadoDate
                          }
                        >
                          {formatarData(
                            comunicado.criado_em
                          )}
                        </Text>
                      </View>
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
                        {comunicado.publicado
                          ? 'Publicado'
                          : 'Oculto'}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={
                      styles.comunicadoMessage
                    }
                    numberOfLines={4}
                  >
                    {comunicado.mensagem}
                  </Text>

                  <View
                    style={styles.tagsRow}
                  >
                    <View
                      style={styles.tag}
                    >
                      <Text
                        style={
                          styles.tagText
                        }
                      >
                        {nomeCategoria(
                          comunicado.categoria
                        )}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.tag,
                        comunicado.prioridade ===
                          'importante' &&
                          styles.tagImportant,
                        comunicado.prioridade ===
                          'urgente' &&
                          styles.tagUrgent,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          comunicado.prioridade ===
                            'importante' &&
                            styles.tagImportantText,
                          comunicado.prioridade ===
                            'urgente' &&
                            styles.tagUrgentText,
                        ]}
                      >
                        {nomePrioridade(
                          comunicado.prioridade
                        )}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={styles.actions}
                  >
                    <Pressable
                      style={
                        styles.actionButton
                      }
                      onPress={() =>
                        alterarPublicacao(
                          comunicado
                        )
                      }
                    >
                      {comunicado.publicado ? (
                        <EyeOff
                          size={14}
                          color={
                            colors.textSecondary
                          }
                        />
                      ) : (
                        <Eye
                          size={14}
                          color={
                            colors.primary
                          }
                        />
                      )}

                      <Text
                        style={
                          styles.actionText
                        }
                      >
                        {comunicado.publicado
                          ? 'Ocultar'
                          : 'Publicar'}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={
                        styles.actionButton
                      }
                      onPress={() =>
                        abrirEditarComunicado(
                          comunicado
                        )
                      }
                    >
                      <Edit3
                        size={14}
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
                      style={[
                        styles.actionButton,
                        styles.deleteButton,
                      ]}
                      onPress={() =>
                        confirmarExclusao(
                          comunicado
                        )
                      }
                    >
                      <Trash2
                        size={14}
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
            )
          )}

          {/* RODAPÉ */}
          <View style={styles.footer}>
            <Text
              style={styles.footerBrand}
            >
              ConectaLar
            </Text>

            <Text
              style={styles.footerText}
            >
              Seu condomínio mais conectado.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* MODAL */}
      <Modal
        visible={modalAberto}
        transparent
        animationType="fade"
        onRequestClose={fecharModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                paddingBottom:
                  Math.max(
                    insets.bottom,
                    16
                  ),
              },
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
              keyboardShouldPersistTaps="handled"
            >
              <View
                style={styles.modalHeader}
              >
                <View>
                  <Text
                    style={styles.modalTitle}
                  >
                    {comunicadoEditando
                      ? 'Editar comunicado'
                      : 'Novo comunicado'}
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
                  style={styles.closeButton}
                  onPress={fecharModal}
                >
                  <X
                    size={18}
                    color={
                      colors.textSecondary
                    }
                  />
                </Pressable>
              </View>

              {/* TÍTULO */}
              <Text
                style={styles.inputLabel}
              >
                Título *
              </Text>

              <TextInput
                style={styles.input}
                value={titulo}
                onChangeText={setTitulo}
                placeholder="Ex.: Manutenção da piscina"
                placeholderTextColor={
                  colors.textLight
                }
                maxLength={120}
              />

              {/* MENSAGEM */}
              <Text
                style={styles.inputLabel}
              >
                Mensagem *
              </Text>

              <TextInput
                style={[
                  styles.input,
                  styles.messageInput,
                ]}
                value={mensagem}
                onChangeText={setMensagem}
                placeholder="Digite o comunicado..."
                placeholderTextColor={
                  colors.textLight
                }
                multiline
                textAlignVertical="top"
                maxLength={1500}
              />

              {/* CATEGORIA */}
              <Text
                style={styles.inputLabel}
              >
                Categoria
              </Text>

              <Pressable
                style={styles.selectButton}
                onPress={() => {
                  setCategoriasAbertas(
                    valor => !valor
                  );

                  setPrioridadesAbertas(
                    false
                  );
                }}
              >
                <Text
                  style={styles.selectText}
                >
                  {nomeCategoria(
                    categoria
                  )}
                </Text>

                <ChevronDown
                  size={17}
                  color={
                    colors.textSecondary
                  }
                />
              </Pressable>

              {categoriasAbertas ? (
                <View
                  style={styles.optionsBox}
                >
                  {categorias.map(
                    item => (
                      <Pressable
                        key={item.value}
                        style={
                          styles.optionButton
                        }
                        onPress={() => {
                          setCategoria(
                            item.value
                          );

                          setCategoriasAbertas(
                            false
                          );
                        }}
                      >
                        <Text
                          style={
                            styles.optionText
                          }
                        >
                          {item.label}
                        </Text>

                        {categoria ===
                        item.value ? (
                          <Check
                            size={16}
                            color={
                              colors.primary
                            }
                          />
                        ) : null}
                      </Pressable>
                    )
                  )}
                </View>
              ) : null}

              {/* PRIORIDADE */}
              <Text
                style={styles.inputLabel}
              >
                Prioridade
              </Text>

              <Pressable
                style={styles.selectButton}
                onPress={() => {
                  setPrioridadesAbertas(
                    valor => !valor
                  );

                  setCategoriasAbertas(
                    false
                  );
                }}
              >
                <Text
                  style={styles.selectText}
                >
                  {nomePrioridade(
                    prioridade
                  )}
                </Text>

                <ChevronDown
                  size={17}
                  color={
                    colors.textSecondary
                  }
                />
              </Pressable>

              {prioridadesAbertas ? (
                <View
                  style={styles.optionsBox}
                >
                  {prioridades.map(
                    item => (
                      <Pressable
                        key={item.value}
                        style={
                          styles.optionButton
                        }
                        onPress={() => {
                          setPrioridade(
                            item.value
                          );

                          setPrioridadesAbertas(
                            false
                          );
                        }}
                      >
                        <Text
                          style={
                            styles.optionText
                          }
                        >
                          {item.label}
                        </Text>

                        {prioridade ===
                        item.value ? (
                          <Check
                            size={16}
                            color={
                              colors.primary
                            }
                          />
                        ) : null}
                      </Pressable>
                    )
                  )}
                </View>
              ) : null}

              {/* PUBLICAÇÃO */}
              <Text
                style={styles.inputLabel}
              >
                Visibilidade
              </Text>

              <Pressable
                style={[
                  styles.publishBox,
                  publicado &&
                    styles.publishBoxActive,
                ]}
                onPress={() =>
                  setPublicado(
                    valor => !valor
                  )
                }
              >
                <View
                  style={
                    styles.publishContent
                  }
                >
                  {publicado ? (
                    <Eye
                      size={18}
                      color={colors.primary}
                    />
                  ) : (
                    <EyeOff
                      size={18}
                      color={
                        colors.textSecondary
                      }
                    />
                  )}

                  <View
                    style={
                      styles.publishTextBox
                    }
                  >
                    <Text
                      style={
                        styles.publishTitle
                      }
                    >
                      {publicado
                        ? 'Publicado'
                        : 'Oculto'}
                    </Text>

                    <Text
                      style={
                        styles.publishDescription
                      }
                    >
                      {publicado
                        ? 'Os moradores poderão visualizar este comunicado.'
                        : 'Este comunicado não ficará visível aos moradores.'}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.checkbox,
                    publicado &&
                      styles.checkboxActive,
                  ]}
                >
                  {publicado ? (
                    <Check
                      size={13}
                      color="#FFFFFF"
                    />
                  ) : null}
                </View>
              </Pressable>

              {/* BOTÕES */}
              <View
                style={styles.modalActions}
              >
                <Pressable
                  style={styles.cancelButton}
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
                      styles.disabledButton,
                  ]}
                  onPress={salvarComunicado}
                  disabled={salvando}
                >
                  {salvando ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  ) : (
                    <>
                      <Check
                        size={16}
                        color="#FFFFFF"
                      />

                      <Text
                        style={
                          styles.saveButtonText
                        }
                      >
                        {comunicadoEditando
                          ? 'Salvar'
                          : 'Criar'}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor:
      'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  brandIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  brand: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },

  headerSpacer: {
    width: 40,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
    marginTop: 23,
  },

  headerDescription: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
    maxWidth: 310,
  },

  body: {
    paddingHorizontal: 18,
    paddingTop: 20,
  },

  sectionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionText: {
    flex: 1,
    paddingRight: 12,
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
    height: 37,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 5,
  },

  buttonPressed: {
    opacity: 0.75,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 17,
  },

  summaryCard: {
    width: '31.5%',
    minHeight: 105,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 11,
  },

  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryNumber: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
    marginTop: 8,
  },

  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 1,
  },

  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 23,
    marginBottom: 10,
  },

  listTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },

  listCount: {
    minWidth: 25,
    height: 25,
    paddingHorizontal: 7,
    borderRadius: 9,
    backgroundColor: colors.primaryLight,
    color: colors.primary,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 25,
  },

  loadingBox: {
    paddingVertical: 35,
    alignItems: 'center',
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 8,
  },

  emptyCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    backgroundColor: colors.surface,
    alignItems: 'center',
    padding: 25,
  },

  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 11,
  },

  emptyText: {
    color: colors.textSecondary,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },

  comunicadoCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    padding: 13,
    marginBottom: 10,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  cardTitleArea: {
    flex: 1,
    flexDirection: 'row',
    paddingRight: 8,
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

  cardTitleText: {
    flex: 1,
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
    marginTop: 2,
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
    marginTop: 10,
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
    minHeight: 32,
    borderRadius: 9,
    backgroundColor: colors.background,
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

  footer: {
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 4,
  },

  footerBrand: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },

  footerText: {
    color: colors.textLight,
    fontSize: 9,
    marginTop: 2,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(15,23,42,0.55)',
    justifyContent: 'flex-end',
  },

  modalCard: {
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 18,
    paddingTop: 18,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 17,
  },

  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },

  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 3,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  inputLabel: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 11,
  },

  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: 11,
    paddingHorizontal: 12,
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
    borderRadius: 12,
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
    borderRadius: 12,
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
    flex: 1,
    height: 43,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },

  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
  },

  saveButton: {
    flex: 1,
    height: 43,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 5,
  },

  disabledButton: {
    opacity: 0.6,
  },
});