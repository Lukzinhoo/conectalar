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
import WebLayout from '../../../components/WebLayout';

import { colors } from '../../../theme/theme';
import { supabase } from '../../../services/supabase';

/* =====================================================
   TIPOS
===================================================== */

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

/* =====================================================
   TELA
===================================================== */

export default function WebHorariosScreen() {
  const { width } = useWindowDimensions();

  const isMobile = width < 768;

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
  ] = useState<Horario | null>(null);

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

  /* ===================================================
     CARREGAR
  =================================================== */

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

      const { data, error } =
        await supabase
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
        (data ?? []) as HorarioBanco[];

      const lista: Horario[] =
        registros.map(item => ({
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
            item.observacao ?? '',

          ativo:
            item.ativo,
        }));

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

  /* ===================================================
     RESUMO
  =================================================== */

  const total =
    horarios.length;

  const ativos =
    horarios.filter(
      item => item.ativo
    ).length;

  const inativos =
    total - ativos;

  /* ===================================================
     FILTRO
  =================================================== */

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
        item =>
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

  /* ===================================================
     LIMPAR FORMULÁRIO
  =================================================== */

  function limparFormulario() {
    setTitulo('');
    setDias('');
    setHorarioInicio('');
    setHorarioFim('');
    setObservacao('');
    setErro('');
  }

  /* ===================================================
     NOVO
  =================================================== */

  function abrirNovoHorario() {
    setHorarioEditando(null);

    limparFormulario();

    setModalAberto(true);
  }

  /* ===================================================
     EDITAR
  =================================================== */

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

  /* ===================================================
     FECHAR
  =================================================== */

  function fecharModal() {
    if (salvando) {
      return;
    }

    setModalAberto(false);

    setHorarioEditando(null);

    limparFormulario();
  }

  /* ===================================================
     VALIDAR HORÁRIO
  =================================================== */

  function horarioValido(
    valor: string
  ) {
    const regex =
      /^([01]\d|2[0-3]):[0-5]\d$/;

    return regex.test(valor);
  }

  /* ===================================================
     SALVAR
  =================================================== */

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
          atual =>
            atual.map(
              item =>
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
          atual => [
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

  /* ===================================================
     ATIVAR / DESATIVAR
  =================================================== */

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

      const { error } =
        await supabase
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
        atual =>
          atual.map(
            item =>
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

  /* ===================================================
     EXCLUIR
  =================================================== */

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

      const { error } =
        await supabase
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
        atual =>
          atual.filter(
            item =>
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

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <>
      <WebLayout
        sidebar={
          <WebSidebar
            active="horarios"
          />
        }
      >
        {/* CABEÇALHO */}

        <View
          style={[
            styles.header,

            isMobile &&
              styles.headerMobile,
          ]}
        >
          <View
            style={
              styles.headerTextArea
            }
          >
            <Text
              style={[
                styles.title,

                isMobile &&
                  styles.titleMobile,
              ]}
            >
              Horários
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Gerencie os horários
              de serviços e
              funcionamento do
              condomínio.
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
              style={[
                styles.refreshButton,

                isMobile &&
                  styles.headerButtonMobile,
              ]}
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
              style={[
                styles.novoButton,

                isMobile &&
                  styles.headerButtonMobile,
              ]}
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

        <View
          style={[
            styles.cards,

            isMobile &&
              styles.cardsMobile,
          ]}
        >
          <ResumoCard
            titulo="Total"
            valor={total}
            tipo="total"
            isMobile={
              isMobile
            }
          />

          <ResumoCard
            titulo="Ativos"
            valor={ativos}
            tipo="ativo"
            isMobile={
              isMobile
            }
          />

          <ResumoCard
            titulo="Inativos"
            valor={inativos}
            tipo="inativo"
            isMobile={
              isMobile
            }
          />
        </View>

        {/* BUSCA */}

        <View
          style={[
            styles.searchBox,

            isMobile &&
              styles.searchBoxMobile,
          ]}
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
              Nenhum horário
              encontrado
            </Text>

            <Text
              style={
                styles.vazioText
              }
            >
              Cadastre um novo
              horário para começar.
            </Text>
          </View>
        ) : (
          <View
            style={
              styles.lista
            }
          >
            {horariosFiltrados.map(
              horario => (
                <View
                  key={horario.id}
                  style={[
                    styles.horarioCard,

                    isMobile &&
                      styles.horarioCardMobile,
                  ]}
                >
                  <View
                    style={[
                      styles.horarioIcon,

                      isMobile &&
                        styles.horarioIconMobile,
                    ]}
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
                      style={[
                        styles.cardTopo,

                        isMobile &&
                          styles.cardTopoMobile,
                      ]}
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
                        style={[
                          styles.acoes,

                          isMobile &&
                            styles.acoesMobile,
                        ]}
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
                      style={[
                        styles.dadosLinha,

                        isMobile &&
                          styles.dadosLinhaMobile,
                      ]}
                    >
                      <View
                        style={[
                          styles.dadoBox,

                          isMobile &&
                            styles.dadoBoxMobile,
                        ]}
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
                        style={[
                          styles.dadoBox,

                          isMobile &&
                            styles.dadoBoxMobile,
                        ]}
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
            )}
          </View>
        )}
      </WebLayout>

      {/* MODAL */}

      <Modal
        visible={modalAberto}
        transparent
        animationType="fade"
        onRequestClose={
          fecharModal
        }
        statusBarTranslucent
      >
        <View
          style={[
            styles.overlay,

            isMobile &&
              styles.overlayMobile,
          ]}
        >
          <View
            style={[
              styles.modal,

              isMobile &&
                styles.modalMobile,
            ]}
          >
            {/* CABEÇALHO FIXO */}

            <View
              style={
                styles.modalHeader
              }
            >
              <View
                style={
                  styles.modalHeaderText
                }
              >
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
                  Cadastre o horário
                  de funcionamento.
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

            {/* CAMPOS COM ROLAGEM */}

            <ScrollView
              style={
                styles.modalScroll
              }
              contentContainerStyle={
                styles.modalScrollContent
              }
              showsVerticalScrollIndicator={
                false
              }
              keyboardShouldPersistTaps="handled"
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
                style={[
                  styles.horariosLinha,

                  isMobile &&
                    styles.horariosLinhaMobile,
                ]}
              >
                <View
                  style={[
                    styles.campoHorario,

                    isMobile &&
                      styles.campoHorarioMobile,
                  ]}
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
                  style={[
                    styles.campoHorario,

                    isMobile &&
                      styles.campoHorarioMobile,
                  ]}
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
            </ScrollView>

            {/* BOTÕES FIXOS */}

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
          </View>
        </View>
      </Modal>
    </>
  );
}

/* =====================================================
   RESUMO
===================================================== */

function ResumoCard({
  titulo,
  valor,
  tipo,
  isMobile,
}: {
  titulo: string;
  valor: number;
  tipo:
    | 'total'
    | 'ativo'
    | 'inativo';
  isMobile: boolean;
}) {
  return (
    <View
      style={[
        styles.resumoCard,

        isMobile &&
          styles.resumoCardMobile,
      ]}
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

/* =====================================================
   ESTILOS
===================================================== */

const styles = StyleSheet.create({
  /* ===================================================
     CABEÇALHO
  =================================================== */

  header: {
    width: '100%',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent:
      'space-between',

    marginBottom: 20,
  },

  headerMobile: {
    flexDirection: 'column',

    alignItems: 'stretch',

    marginBottom: 18,
  },

  headerTextArea: {
    flex: 1,

    minWidth: 0,
  },

  title: {
    fontSize: 28,

    fontWeight: '800',

    color: colors.text,
  },

  titleMobile: {
    fontSize: 23,
  },

  subtitle: {
    fontSize: 13,

    lineHeight: 19,

    color:
      colors.textSecondary,

    marginTop: 5,
  },

  headerActions: {
    flexDirection: 'row',

    alignItems: 'center',

    marginLeft: 20,
  },

  headerActionsMobile: {
    width: '100%',

    marginLeft: 0,

    marginTop: 15,
  },

  headerButtonMobile: {
    flex: 1,

    minWidth: 0,
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

    justifyContent:
      'center',

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

    justifyContent:
      'center',
  },

  novoButtonText: {
    color: '#FFFFFF',

    fontSize: 11,

    fontWeight: '800',

    marginLeft: 7,
  },

  /* ===================================================
     ERRO
  =================================================== */

  erroPagina: {
    width: '100%',

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

  /* ===================================================
     RESUMO
  =================================================== */

  cards: {
    width: '100%',

    flexDirection: 'row',

    flexWrap: 'wrap',

    marginBottom: 18,
  },

  cardsMobile: {
    flexDirection: 'column',
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

    marginRight: 12,

    marginBottom: 10,
  },

  resumoCardMobile: {
    width: '100%',

    minWidth: 0,

    marginRight: 0,

    marginBottom: 9,
  },

  resumoIcon: {
    width: 40,

    height: 40,

    borderRadius: 11,

    backgroundColor:
      colors.primaryLight,

    alignItems: 'center',

    justifyContent:
      'center',

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

  /* ===================================================
     BUSCA
  =================================================== */

  searchBox: {
    width: '100%',

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

  searchBoxMobile: {
    maxWidth: '100%',
  },

  searchInput: {
    flex: 1,

    minWidth: 0,

    height: 42,

    marginLeft: 8,

    fontSize: 12,

    color: colors.text,

    outlineStyle: 'none',
  } as any,

  /* ===================================================
     LISTA
  =================================================== */

  lista: {
    width: '100%',
  },

  horarioCard: {
    width: '100%',

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

  horarioCardMobile: {
    flexDirection: 'column',

    padding: 14,
  },

  horarioIcon: {
    width: 44,

    height: 44,

    borderRadius: 12,

    backgroundColor:
      colors.primaryLight,

    alignItems: 'center',

    justifyContent:
      'center',

    marginRight: 14,
  },

  horarioIconMobile: {
    marginRight: 0,

    marginBottom: 12,
  },

  horarioInfo: {
    flex: 1,

    minWidth: 0,
  },

  cardTopo: {
    flexDirection: 'row',

    justifyContent:
      'space-between',

    alignItems:
      'flex-start',
  },

  cardTopoMobile: {
    flexDirection: 'column',

    width: '100%',
  },

  tituloArea: {
    flex: 1,

    minWidth: 0,

    flexDirection: 'row',

    alignItems: 'center',

    flexWrap: 'wrap',
  },

  horarioTitulo: {
    fontSize: 14,

    fontWeight: '800',

    color: colors.text,

    marginRight: 8,

    marginBottom: 4,
  },

  statusBadge: {
    paddingHorizontal: 8,

    paddingVertical: 4,

    borderRadius: 7,

    marginBottom: 4,
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

  acoesMobile: {
    width: '100%',

    marginLeft: 0,

    marginTop: 10,

    justifyContent:
      'flex-start',
  },

  iconButton: {
    width: 38,

    height: 38,

    borderRadius: 9,

    backgroundColor:
      colors.background,

    borderWidth: 1,

    borderColor:
      colors.border,

    alignItems: 'center',

    justifyContent:
      'center',

    marginRight: 6,
  },

  dadosLinha: {
    flexDirection: 'row',

    flexWrap: 'wrap',

    marginTop: 10,
  },

  dadosLinhaMobile: {
    flexDirection: 'column',

    width: '100%',

    marginTop: 13,
  },

  dadoBox: {
    minWidth: 180,

    marginRight: 30,

    marginBottom: 5,
  },

  dadoBoxMobile: {
    width: '100%',

    minWidth: 0,

    marginRight: 0,

    marginBottom: 11,
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

  /* ===================================================
     VAZIO
  =================================================== */

  vazio: {
    width: '100%',

    minHeight: 300,

    alignItems: 'center',

    justifyContent:
      'center',

    backgroundColor:
      colors.surface,

    borderRadius: 14,

    borderWidth: 1,

    borderColor:
      colors.border,

    padding: 20,
  },

  vazioTitle: {
    marginTop: 10,

    fontSize: 14,

    fontWeight: '800',

    color: colors.text,

    textAlign: 'center',
  },

  vazioText: {
    marginTop: 5,

    fontSize: 10,

    color:
      colors.textSecondary,

    textAlign: 'center',
  },

  carregandoText: {
    marginTop: 10,

    fontSize: 10,

    color:
      colors.textSecondary,
  },

  /* ===================================================
     MODAL
  =================================================== */

  overlay: {
    flex: 1,

    backgroundColor:
      'rgba(15, 23, 42, 0.45)',

    alignItems: 'center',

    justifyContent:
      'center',

    padding: 20,
  },

  overlayMobile: {
    padding: 10,
  },

  modal: {
    width: '100%',

    maxWidth: 580,

    height: '90%',

    maxHeight: 700,

    backgroundColor:
      colors.surface,

    borderRadius: 18,

    borderWidth: 1,

    borderColor:
      colors.border,

    padding: 22,

    overflow: 'hidden',
  },

  modalMobile: {
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

    alignItems:
      'flex-start',

    justifyContent:
      'space-between',

    marginBottom: 10,

    flexShrink: 0,
  },

  modalHeaderText: {
    flex: 1,

    minWidth: 0,

    paddingRight: 10,
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

    borderWidth: 1,

    borderColor:
      colors.border,

    alignItems: 'center',

    justifyContent:
      'center',

    flexShrink: 0,
  },

  modalScroll: {
    flex: 1,

    minHeight: 0,

    width: '100%',
  },

  modalScrollContent: {
    flexGrow: 1,

    paddingBottom: 10,
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
    width: '100%',

    flexDirection: 'row',

    marginTop: 2,
  },

  horariosLinhaMobile: {
    flexDirection: 'column',
  },

  campoHorario: {
    flex: 1,

    minWidth: 0,

    marginRight: 10,
  },

  campoHorarioMobile: {
    width: '100%',

    flex: 0,

    marginRight: 0,
  },

  textarea: {
    minHeight: 100,

    paddingTop: 12,

    paddingBottom: 12,
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

  /* ===================================================
     BOTÕES FIXOS MODAL
  =================================================== */

  modalButtons: {
    width: '100%',

    flexDirection: 'row',

    alignItems: 'center',

    paddingTop: 12,

    marginTop: 6,

    borderTopWidth: 1,

    borderTopColor:
      colors.border,

    flexShrink: 0,
  },

  cancelButton: {
    flex: 1,

    minWidth: 0,

    height: 44,

    borderRadius: 10,

    borderWidth: 1,

    borderColor:
      colors.border,

    backgroundColor:
      colors.background,

    alignItems: 'center',

    justifyContent:
      'center',

    marginRight: 8,

    paddingHorizontal: 8,
  },

  cancelText: {
    color:
      colors.textSecondary,

    fontSize: 11,

    fontWeight: '700',
  },

  saveButton: {
    flex: 1.35,

    minWidth: 0,

    height: 44,

    paddingHorizontal: 10,

    borderRadius: 10,

    backgroundColor:
      colors.primary,

    alignItems: 'center',

    justifyContent:
      'center',
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveText: {
    color: '#FFFFFF',

    fontSize: 11,

    fontWeight: '800',

    textAlign: 'center',
  },
});