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
  CheckCircle2,
  Clock3,
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

type HorarioBanco = {
  id: string;
  titulo: string;
  dias: string;
  horario_inicio: string;
  horario_fim: string;
  observacao: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
};

type Horario = {
  id: string;
  titulo: string;
  dias: string;
  horarioInicio: string;
  horarioFim: string;
  observacao: string;
  ativo: boolean;
};

// =====================================================
// TELA
// =====================================================

export default function WebHorariosScreen() {
  const [horarios, setHorarios] =
    useState<Horario[]>([]);

  const [busca, setBusca] =
    useState('');

  const [
    modalAberto,
    setModalAberto,
  ] = useState(false);

  const [
    horarioEditando,
    setHorarioEditando,
  ] = useState<Horario | null>(
    null
  );

  const [titulo, setTitulo] =
    useState('');

  const [dias, setDias] =
    useState('');

  const [
    horarioInicio,
    setHorarioInicio,
  ] = useState('');

  const [
    horarioFim,
    setHorarioFim,
  ] = useState('');

  const [
    observacao,
    setObservacao,
  ] = useState('');

  const [erro, setErro] =
    useState('');

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    atualizando,
    setAtualizando,
  ] = useState(false);

  const [
    processandoId,
    setProcessandoId,
  ] = useState<string | null>(
    null
  );

  // =====================================================
  // CARREGAR
  // =====================================================

  useEffect(() => {
    carregarHorarios(false);
  }, []);

  async function carregarHorarios(
    mostrarAtualizacao = true
  ) {
    try {
      if (mostrarAtualizacao) {
        setAtualizando(true);
      } else {
        setCarregando(true);
      }

      setErro('');

      const {
        data,
        error,
      } = await supabase
        .from('horarios')
        .select(`
          id,
          titulo,
          dias,
          horario_inicio,
          horario_fim,
          observacao,
          ativo,
          criado_em,
          atualizado_em
        `)
        .order('criado_em', {
          ascending: false,
        });

      if (error) {
        console.error(
          'ERRO AO CARREGAR HORÁRIOS:',
          error
        );

        setErro(
          `Não foi possível carregar os horários: ${error.message}`
        );

        return;
      }

      const registros =
        (data ??
          []) as HorarioBanco[];

      const lista: Horario[] =
        registros.map(
          (item) => ({
            id: item.id,

            titulo:
              item.titulo,

            dias:
              item.dias,

            horarioInicio:
              item.horario_inicio,

            horarioFim:
              item.horario_fim,

            observacao:
              item.observacao ??
              '',

            ativo:
              item.ativo,
          })
        );

      setHorarios(lista);
    } catch (error) {
      console.error(
        'ERRO INESPERADO AO CARREGAR HORÁRIOS:',
        error
      );

      setErro(
        'Não foi possível carregar os horários.'
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  // =====================================================
  // RESUMO
  // =====================================================

  const total =
    horarios.length;

  const ativos =
    horarios.filter(
      (item) => item.ativo
    ).length;

  const inativos =
    total - ativos;

  // =====================================================
  // FILTRO
  // =====================================================

  const horariosFiltrados =
    useMemo(() => {
      const termo =
        busca
          .trim()
          .toLowerCase();

      if (!termo) {
        return horarios;
      }

      return horarios.filter(
        (item) =>
          item.titulo
            .toLowerCase()
            .includes(termo) ||
          item.dias
            .toLowerCase()
            .includes(termo) ||
          item.observacao
            .toLowerCase()
            .includes(termo)
      );
    }, [busca, horarios]);

  // =====================================================
  // LIMPAR FORMULÁRIO
  // =====================================================

  function limparFormulario() {
    setTitulo('');
    setDias('');
    setHorarioInicio('');
    setHorarioFim('');
    setObservacao('');
    setErro('');
  }

  // =====================================================
  // NOVO
  // =====================================================

  function abrirNovoHorario() {
    setHorarioEditando(null);

    limparFormulario();

    setModalAberto(true);
  }

  // =====================================================
  // EDITAR
  // =====================================================

  function editarHorario(
    horario: Horario
  ) {
    setHorarioEditando(
      horario
    );

    setTitulo(
      horario.titulo
    );

    setDias(
      horario.dias
    );

    setHorarioInicio(
      horario.horarioInicio
    );

    setHorarioFim(
      horario.horarioFim
    );

    setObservacao(
      horario.observacao
    );

    setErro('');

    setModalAberto(true);
  }

  // =====================================================
  // FECHAR
  // =====================================================

  function fecharModal() {
    if (salvando) {
      return;
    }

    setModalAberto(false);

    setHorarioEditando(null);

    limparFormulario();
  }

  // =====================================================
  // VALIDAR HORÁRIO
  // =====================================================

  function horarioValido(
    valor: string
  ) {
    const regex =
      /^([01]\d|2[0-3]):[0-5]\d$/;

    return regex.test(valor);
  }

  // =====================================================
  // SALVAR
  // =====================================================

  async function salvarHorario() {
    if (salvando) {
      return;
    }

    const tituloLimpo =
      titulo.trim();

    const diasLimpo =
      dias.trim();

    const inicioLimpo =
      horarioInicio.trim();

    const fimLimpo =
      horarioFim.trim();

    const observacaoLimpa =
      observacao.trim();

    if (!tituloLimpo) {
      setErro(
        'Informe o nome do serviço.'
      );

      return;
    }

    if (!diasLimpo) {
      setErro(
        'Informe os dias de funcionamento.'
      );

      return;
    }

    if (
      !inicioLimpo ||
      !fimLimpo
    ) {
      setErro(
        'Informe o horário de início e fim.'
      );

      return;
    }

    if (
      !horarioValido(
        inicioLimpo
      ) ||
      !horarioValido(
        fimLimpo
      )
    ) {
      setErro(
        'Informe os horários no formato HH:MM. Exemplo: 08:00.'
      );

      return;
    }

    try {
      setSalvando(true);
      setErro('');

      if (horarioEditando) {
        const {
          data,
          error,
        } = await supabase
          .from('horarios')
          .update({
            titulo:
              tituloLimpo,

            dias:
              diasLimpo,

            horario_inicio:
              inicioLimpo,

            horario_fim:
              fimLimpo,

            observacao:
              observacaoLimpa ||
              null,

            atualizado_em:
              new Date().toISOString(),
          })
          .eq(
            'id',
            horarioEditando.id
          )
          .select(`
            id,
            titulo,
            dias,
            horario_inicio,
            horario_fim,
            observacao,
            ativo,
            criado_em,
            atualizado_em
          `)
          .single();

        if (error) {
          console.error(
            'ERRO AO EDITAR HORÁRIO:',
            error
          );

          setErro(
            `Não foi possível salvar as alterações: ${error.message}`
          );

          return;
        }

        const atualizado =
          data as HorarioBanco;

        setHorarios(
          (atual) =>
            atual.map(
              (item) =>
                item.id ===
                atualizado.id
                  ? {
                      id:
                        atualizado.id,

                      titulo:
                        atualizado.titulo,

                      dias:
                        atualizado.dias,

                      horarioInicio:
                        atualizado.horario_inicio,

                      horarioFim:
                        atualizado.horario_fim,

                      observacao:
                        atualizado.observacao ??
                        '',

                      ativo:
                        atualizado.ativo,
                    }
                  : item
            )
        );
      } else {
        const {
          data,
          error,
        } = await supabase
          .from('horarios')
          .insert({
            titulo:
              tituloLimpo,

            dias:
              diasLimpo,

            horario_inicio:
              inicioLimpo,

            horario_fim:
              fimLimpo,

            observacao:
              observacaoLimpa ||
              null,

            ativo: true,
          })
          .select(`
            id,
            titulo,
            dias,
            horario_inicio,
            horario_fim,
            observacao,
            ativo,
            criado_em,
            atualizado_em
          `)
          .single();

        if (error) {
          console.error(
            'ERRO AO CRIAR HORÁRIO:',
            error
          );

          setErro(
            `Não foi possível criar o horário: ${error.message}`
          );

          return;
        }

        const novo =
          data as HorarioBanco;

        setHorarios(
          (atual) => [
            {
              id: novo.id,

              titulo:
                novo.titulo,

              dias:
                novo.dias,

              horarioInicio:
                novo.horario_inicio,

              horarioFim:
                novo.horario_fim,

              observacao:
                novo.observacao ??
                '',

              ativo:
                novo.ativo,
            },

            ...atual,
          ]
        );
      }

      setModalAberto(false);

      setHorarioEditando(null);

      limparFormulario();
    } catch (error) {
      console.error(
        'ERRO INESPERADO AO SALVAR HORÁRIO:',
        error
      );

      setErro(
        'Não foi possível salvar o horário.'
      );
    } finally {
      setSalvando(false);
    }
  }

  // =====================================================
  // ATIVAR / DESATIVAR
  // =====================================================

  async function alterarStatus(
    horario: Horario
  ) {
    if (processandoId) {
      return;
    }

    try {
      setProcessandoId(
        horario.id
      );

      setErro('');

      const novoStatus =
        !horario.ativo;

      const {
        error,
      } = await supabase
        .from('horarios')
        .update({
          ativo:
            novoStatus,

          atualizado_em:
            new Date().toISOString(),
        })
        .eq(
          'id',
          horario.id
        );

      if (error) {
        console.error(
          'ERRO AO ALTERAR STATUS:',
          error
        );

        setErro(
          `Não foi possível alterar o status: ${error.message}`
        );

        return;
      }

      setHorarios(
        (atual) =>
          atual.map(
            (item) =>
              item.id ===
              horario.id
                ? {
                    ...item,
                    ativo:
                      novoStatus,
                  }
                : item
          )
      );
    } catch (error) {
      console.error(
        'ERRO INESPERADO AO ALTERAR STATUS:',
        error
      );

      setErro(
        'Não foi possível alterar o status.'
      );
    } finally {
      setProcessandoId(null);
    }
  }

  // =====================================================
  // EXCLUIR
  // =====================================================

  async function excluirHorario(
    horario: Horario
  ) {
    if (processandoId) {
      return;
    }

    const confirmar =
      typeof window !==
      'undefined'
        ? window.confirm(
            `Deseja excluir o horário "${horario.titulo}"?`
          )
        : true;

    if (!confirmar) {
      return;
    }

    try {
      setProcessandoId(
        horario.id
      );

      setErro('');

      const {
        error,
      } = await supabase
        .from('horarios')
        .delete()
        .eq(
          'id',
          horario.id
        );

      if (error) {
        console.error(
          'ERRO AO EXCLUIR HORÁRIO:',
          error
        );

        setErro(
          `Não foi possível excluir o horário: ${error.message}`
        );

        return;
      }

      setHorarios(
        (atual) =>
          atual.filter(
            (item) =>
              item.id !==
              horario.id
          )
      );
    } catch (error) {
      console.error(
        'ERRO INESPERADO AO EXCLUIR HORÁRIO:',
        error
      );

      setErro(
        'Não foi possível excluir o horário.'
      );
    } finally {
      setProcessandoId(null);
    }
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <View style={styles.container}>
      <WebSidebar
        active="horarios"
      />

      <View style={styles.content}>
        {/* CABEÇALHO */}

        <View style={styles.header}>
          <View>
            <Text
              style={styles.title}
            >
              Horários
            </Text>

            <Text
              style={styles.subtitle}
            >
              Gerencie os horários de serviços e funcionamento do condomínio.
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
              onPress={() =>
                carregarHorarios()
              }
              disabled={
                atualizando ||
                carregando
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
                  size={16}
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
                Atualizar
              </Text>
            </Pressable>

            <Pressable
              style={
                styles.novoButton
              }
              onPress={
                abrirNovoHorario
              }
            >
              <Plus
                size={18}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.novoButtonText
                }
              >
                Novo horário
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ERRO */}

        {!!erro &&
          !modalAberto && (
            <View
              style={
                styles.erroPagina
              }
            >
              <Text
                style={
                  styles.erroPaginaText
                }
              >
                {erro}
              </Text>
            </View>
          )}

        {/* RESUMO */}

        <View style={styles.cards}>
          <ResumoCard
            titulo="Total"
            valor={total}
            tipo="total"
          />

          <ResumoCard
            titulo="Ativos"
            valor={ativos}
            tipo="ativo"
          />

          <ResumoCard
            titulo="Inativos"
            valor={inativos}
            tipo="inativo"
          />
        </View>

        {/* BUSCA */}

        <View
          style={styles.searchBox}
        >
          <Search
            size={18}
            color={
              colors.textSecondary
            }
          />

          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar serviço ou horário..."
            placeholderTextColor={
              colors.textLight
            }
            style={
              styles.searchInput
            }
          />
        </View>

        {/* LISTA */}

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={
            false
          }
        >
          {carregando ? (
            <View
              style={styles.vazio}
            >
              <ActivityIndicator
                size="large"
                color={
                  colors.primary
                }
              />

              <Text
                style={
                  styles.carregandoText
                }
              >
                Carregando horários...
              </Text>
            </View>
          ) : horariosFiltrados.length ===
            0 ? (
            <View
              style={styles.vazio}
            >
              <Clock3
                size={42}
                color={
                  colors.textLight
                }
              />

              <Text
                style={
                  styles.vazioTitle
                }
              >
                Nenhum horário encontrado
              </Text>

              <Text
                style={
                  styles.vazioText
                }
              >
                Cadastre um novo horário para começar.
              </Text>
            </View>
          ) : (
            horariosFiltrados.map(
              (horario) => (
                <View
                  key={horario.id}
                  style={
                    styles.horarioCard
                  }
                >
                  <View
                    style={
                      styles.horarioIcon
                    }
                  >
                    <Clock3
                      size={22}
                      color={
                        colors.primary
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.horarioInfo
                    }
                  >
                    <View
                      style={
                        styles.cardTopo
                      }
                    >
                      <View
                        style={
                          styles.tituloArea
                        }
                      >
                        <Text
                          style={
                            styles.horarioTitulo
                          }
                        >
                          {
                            horario.titulo
                          }
                        </Text>

                        <View
                          style={[
                            styles.statusBadge,

                            horario.ativo
                              ? styles.statusAtivo
                              : styles.statusInativo,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,

                              horario.ativo
                                ? styles.statusTextAtivo
                                : styles.statusTextInativo,
                            ]}
                          >
                            {horario.ativo
                              ? 'Ativo'
                              : 'Inativo'}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={
                          styles.acoes
                        }
                      >
                        <Pressable
                          style={
                            styles.iconButton
                          }
                          onPress={() =>
                            editarHorario(
                              horario
                            )
                          }
                          disabled={
                            processandoId ===
                            horario.id
                          }
                        >
                          <Edit3
                            size={16}
                            color={
                              colors.primary
                            }
                          />
                        </Pressable>

                        <Pressable
                          style={
                            styles.iconButton
                          }
                          onPress={() =>
                            alterarStatus(
                              horario
                            )
                          }
                          disabled={
                            processandoId ===
                            horario.id
                          }
                        >
                          {processandoId ===
                          horario.id ? (
                            <ActivityIndicator
                              size="small"
                              color={
                                colors.primary
                              }
                            />
                          ) : horario.ativo ? (
                            <XCircle
                              size={16}
                              color={
                                colors.textSecondary
                              }
                            />
                          ) : (
                            <CheckCircle2
                              size={16}
                              color={
                                colors.primary
                              }
                            />
                          )}
                        </Pressable>

                        <Pressable
                          style={
                            styles.iconButton
                          }
                          onPress={() =>
                            excluirHorario(
                              horario
                            )
                          }
                          disabled={
                            processandoId ===
                            horario.id
                          }
                        >
                          <Trash2
                            size={16}
                            color={
                              colors.danger
                            }
                          />
                        </Pressable>
                      </View>
                    </View>

                    <View
                      style={
                        styles.dadosLinha
                      }
                    >
                      <View
                        style={
                          styles.dadoBox
                        }
                      >
                        <Text
                          style={
                            styles.dadoLabel
                          }
                        >
                          Dias
                        </Text>

                        <Text
                          style={
                            styles.dadoValor
                          }
                        >
                          {horario.dias}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.dadoBox
                        }
                      >
                        <Text
                          style={
                            styles.dadoLabel
                          }
                        >
                          Horário
                        </Text>

                        <Text
                          style={
                            styles.dadoValor
                          }
                        >
                          {
                            horario.horarioInicio
                          }{' '}
                          às{' '}
                          {
                            horario.horarioFim
                          }
                        </Text>
                      </View>
                    </View>

                    {!!horario.observacao && (
                      <Text
                        style={
                          styles.observacao
                        }
                      >
                        {
                          horario.observacao
                        }
                      </Text>
                    )}
                  </View>
                </View>
              )
            )
          )}
        </ScrollView>
      </View>

      {/* MODAL */}

      <Modal
        visible={modalAberto}
        transparent
        animationType="fade"
        onRequestClose={
          fecharModal
        }
      >
        <View
          style={styles.overlay}
        >
          <View style={styles.modal}>
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
                  {horarioEditando
                    ? 'Editar horário'
                    : 'Novo horário'}
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  Cadastre o horário de funcionamento.
                </Text>
              </View>

              <Pressable
                style={
                  styles.closeButton
                }
                onPress={
                  fecharModal
                }
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
              showsVerticalScrollIndicator={
                false
              }
            >
              <Text
                style={styles.label}
              >
                Serviço
              </Text>

              <TextInput
                value={titulo}
                onChangeText={
                  setTitulo
                }
                placeholder="Ex.: Administração"
                placeholderTextColor={
                  colors.textLight
                }
                style={styles.input}
                editable={!salvando}
              />

              <Text
                style={styles.label}
              >
                Dias de funcionamento
              </Text>

              <TextInput
                value={dias}
                onChangeText={
                  setDias
                }
                placeholder="Ex.: Segunda a sexta"
                placeholderTextColor={
                  colors.textLight
                }
                style={styles.input}
                editable={!salvando}
              />

              <View
                style={
                  styles.horariosLinha
                }
              >
                <View
                  style={
                    styles.campoHorario
                  }
                >
                  <Text
                    style={
                      styles.label
                    }
                  >
                    Início
                  </Text>

                  <TextInput
                    value={
                      horarioInicio
                    }
                    onChangeText={
                      setHorarioInicio
                    }
                    placeholder="08:00"
                    placeholderTextColor={
                      colors.textLight
                    }
                    style={
                      styles.input
                    }
                    maxLength={5}
                    editable={
                      !salvando
                    }
                  />
                </View>

                <View
                  style={
                    styles.campoHorario
                  }
                >
                  <Text
                    style={
                      styles.label
                    }
                  >
                    Fim
                  </Text>

                  <TextInput
                    value={
                      horarioFim
                    }
                    onChangeText={
                      setHorarioFim
                    }
                    placeholder="17:00"
                    placeholderTextColor={
                      colors.textLight
                    }
                    style={
                      styles.input
                    }
                    maxLength={5}
                    editable={
                      !salvando
                    }
                  />
                </View>
              </View>

              <Text
                style={styles.label}
              >
                Observação
              </Text>

              <TextInput
                value={observacao}
                onChangeText={
                  setObservacao
                }
                placeholder="Informações adicionais..."
                placeholderTextColor={
                  colors.textLight
                }
                multiline
                textAlignVertical="top"
                maxLength={1000}
                style={[
                  styles.input,
                  styles.textarea,
                ]}
                editable={!salvando}
              />

              {!!erro && (
                <View
                  style={
                    styles.erroBox
                  }
                >
                  <Text
                    style={
                      styles.erroText
                    }
                  >
                    {erro}
                  </Text>
                </View>
              )}

              <View
                style={
                  styles.modalButtons
                }
              >
                <Pressable
                  style={
                    styles.cancelButton
                  }
                  onPress={
                    fecharModal
                  }
                  disabled={salvando}
                >
                  <Text
                    style={
                      styles.cancelText
                    }
                  >
                    Cancelar
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.saveButton,

                    salvando &&
                      styles.saveButtonDisabled,
                  ]}
                  onPress={
                    salvarHorario
                  }
                  disabled={salvando}
                >
                  {salvando ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  ) : (
                    <Text
                      style={
                        styles.saveText
                      }
                    >
                      {horarioEditando
                        ? 'Salvar alterações'
                        : 'Criar horário'}
                    </Text>
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
// RESUMO
// =====================================================

function ResumoCard({
  titulo,
  valor,
  tipo,
}: {
  titulo: string;
  valor: number;
  tipo:
    | 'total'
    | 'ativo'
    | 'inativo';
}) {
  return (
    <View
      style={styles.resumoCard}
    >
      <View
        style={styles.resumoIcon}
      >
        {tipo === 'inativo' ? (
          <XCircle
            size={20}
            color={
              colors.textSecondary
            }
          />
        ) : tipo === 'ativo' ? (
          <CheckCircle2
            size={20}
            color={
              colors.primary
            }
          />
        ) : (
          <Clock3
            size={20}
            color={
              colors.primary
            }
          />
        )}
      </View>

      <View>
        <Text
          style={
            styles.resumoValor
          }
        >
          {valor}
        </Text>

        <Text
          style={
            styles.resumoTitulo
          }
        >
          {titulo}
        </Text>
      </View>
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
    backgroundColor:
      colors.background,
  },

  content: {
    flex: 1,
    padding: 28,
    minWidth: 0,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 20,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },

  subtitle: {
    fontSize: 13,
    color:
      colors.textSecondary,
    marginTop: 5,
  },

  refreshButton: {
    height: 44,
    borderRadius: 11,
    borderWidth: 1,
    borderColor:
      colors.border,
    backgroundColor:
      colors.surface,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  refreshText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 6,
  },

  novoButton: {
    height: 44,
    borderRadius: 11,
    backgroundColor:
      colors.primary,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  novoButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 7,
  },

  erroPagina: {
    backgroundColor:
      colors.dangerLight,
    borderRadius: 10,
    padding: 11,
    marginBottom: 15,
  },

  erroPaginaText: {
    color: colors.danger,
    fontSize: 10,
    fontWeight: '700',
  },

  cards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },

  resumoCard: {
    minWidth: 160,
    backgroundColor:
      colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor:
      colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  resumoIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor:
      colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  resumoValor: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },

  resumoTitulo: {
    marginTop: 1,
    fontSize: 9,
    color:
      colors.textSecondary,
  },

  searchBox: {
    height: 44,
    maxWidth: 440,
    borderRadius: 11,
    borderWidth: 1,
    borderColor:
      colors.border,
    backgroundColor:
      colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    marginBottom: 16,
  },

  searchInput: {
    flex: 1,
    height: 42,
    marginLeft: 8,
    fontSize: 12,
    color: colors.text,
    outlineStyle: 'none',
  } as any,

  scroll: {
    flex: 1,
  },

  horarioCard: {
    backgroundColor:
      colors.surface,
    borderRadius: 15,
    borderWidth: 1,
    borderColor:
      colors.border,
    padding: 17,
    flexDirection: 'row',
    marginBottom: 11,
  },

  horarioIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor:
      colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  horarioInfo: {
    flex: 1,
    minWidth: 0,
  },

  cardTopo: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'flex-start',
  },

  tituloArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  horarioTitulo: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginRight: 8,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },

  statusAtivo: {
    backgroundColor:
      colors.primaryLight,
  },

  statusInativo: {
    backgroundColor:
      colors.background,
  },

  statusText: {
    fontSize: 8,
    fontWeight: '800',
  },

  statusTextAtivo: {
    color: colors.primary,
  },

  statusTextInativo: {
    color:
      colors.textSecondary,
  },

  acoes: {
    flexDirection: 'row',
    marginLeft: 12,
  },

  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor:
      colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },

  dadosLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },

  dadoBox: {
    minWidth: 180,
    marginRight: 30,
    marginBottom: 5,
  },

  dadoLabel: {
    fontSize: 8,
    fontWeight: '700',
    color:
      colors.textSecondary,
  },

  dadoValor: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },

  observacao: {
    marginTop: 7,
    fontSize: 10,
    lineHeight: 16,
    color:
      colors.textSecondary,
  },

  vazio: {
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },

  vazioTitle: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },

  vazioText: {
    marginTop: 5,
    fontSize: 10,
    color:
      colors.textSecondary,
  },

  carregandoText: {
    marginTop: 10,
    fontSize: 10,
    color:
      colors.textSecondary,
  },

  overlay: {
    flex: 1,
    backgroundColor:
      'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  modal: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    backgroundColor:
      colors.surface,
    borderRadius: 18,
    padding: 22,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent:
      'space-between',
    marginBottom: 12,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },

  modalSubtitle: {
    fontSize: 10,
    color:
      colors.textSecondary,
    marginTop: 3,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor:
      colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    width: '100%',
    minHeight: 45,
    borderRadius: 10,
    borderWidth: 1,
    borderColor:
      colors.border,
    backgroundColor:
      colors.background,
    paddingHorizontal: 13,
    fontSize: 12,
    color: colors.text,
    outlineStyle: 'none',
  } as any,

  horariosLinha: {
    flexDirection: 'row',
    gap: 10,
  },

  campoHorario: {
    flex: 1,
  },

  textarea: {
    minHeight: 100,
    paddingTop: 12,
  },

  erroBox: {
    backgroundColor:
      colors.dangerLight,
    borderRadius: 9,
    padding: 10,
    marginTop: 12,
  },

  erroText: {
    color: colors.danger,
    fontSize: 10,
    fontWeight: '700',
  },

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },

  cancelButton: {
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor:
      colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  cancelText: {
    color:
      colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },

  saveButton: {
    minWidth: 125,
    height: 42,
    paddingHorizontal: 17,
    borderRadius: 10,
    backgroundColor:
      colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});