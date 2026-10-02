import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthStackParamList } from '../../../navigation/AuthNavigator';
import { supabase } from '../../../services/supabase';
import WebSidebar from '../../../components/WebSidebar';

type Props = NativeStackScreenProps<
  AuthStackParamList,
  'WebMoradores'
>;

type Morador = {
  id: string;
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;

  tipo_residencia: string | null;
  apartamento: string | null;
  bloco: string | null;
  casa: string | null;
  quadra: string | null;

  tipo: 'morador';
  ativo: boolean;
  criado_em: string;
};

export default function WebMoradoresScreen({
  navigation,
}: Props) {
  const [moradores, setMoradores] = useState<Morador[]>([]);
  const [pesquisa, setPesquisa] = useState('');

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [excluindo, setExcluindo] =
    useState<string | null>(null);

  const [editando, setEditando] =
    useState<Morador | null>(null);

  const [nomeEdit, setNomeEdit] = useState('');
  const [emailEdit, setEmailEdit] = useState('');
  const [telefoneEdit, setTelefoneEdit] = useState('');
  const [casaEdit, setCasaEdit] = useState('');
  const [quadraEdit, setQuadraEdit] = useState('');
  const [apartamentoEdit, setApartamentoEdit] =
    useState('');
  const [blocoEdit, setBlocoEdit] = useState('');

  const [salvando, setSalvando] = useState(false);

  // =====================================================
  // CARREGAR MORADORES
  // =====================================================

  const carregarMoradores = useCallback(async () => {
    try {
      setCarregando(true);
      setErro('');

      const { data, error } = await supabase
        .from('perfis')
        .select(`
          id,
          nome,
          cpf,
          email,
          telefone,
          tipo_residencia,
          apartamento,
          bloco,
          casa,
          quadra,
          tipo,
          ativo,
          criado_em
        `)
        .eq('tipo', 'morador')
        .order('nome', {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      setMoradores((data ?? []) as Morador[]);
    } catch (error) {
      console.error(
        'Erro ao carregar moradores:',
        error
      );

      setErro(
        'Não foi possível carregar os moradores.'
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarMoradores();
  }, [carregarMoradores]);

  // =====================================================
  // PESQUISA
  // =====================================================

  const moradoresFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    if (!termo) {
      return moradores;
    }

    const numeros = termo.replace(/\D/g, '');

    return moradores.filter((morador) => {
      const nome =
        morador.nome?.toLowerCase() ?? '';

      const email =
        morador.email?.toLowerCase() ?? '';

      const cpf =
        morador.cpf?.toLowerCase() ?? '';

      const cpfNumeros =
        morador.cpf?.replace(/\D/g, '') ?? '';

      const telefone =
        morador.telefone?.toLowerCase() ?? '';

      const casa =
        morador.casa?.toLowerCase() ?? '';

      const quadra =
        morador.quadra?.toLowerCase() ?? '';

      const apartamento =
        morador.apartamento?.toLowerCase() ?? '';

      const bloco =
        morador.bloco?.toLowerCase() ?? '';

      return (
        nome.includes(termo) ||
        email.includes(termo) ||
        cpf.includes(termo) ||
        telefone.includes(termo) ||
        casa.includes(termo) ||
        quadra.includes(termo) ||
        apartamento.includes(termo) ||
        bloco.includes(termo) ||
        (!!numeros &&
          cpfNumeros.includes(numeros))
      );
    });
  }, [moradores, pesquisa]);

  // =====================================================
  // FORMATAR CPF
  // =====================================================

  function formatarCPF(cpf: string | null) {
    if (!cpf) {
      return '-';
    }

    const numeros = cpf.replace(/\D/g, '');

    if (numeros.length !== 11) {
      return cpf;
    }

    return numeros.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      '$1.$2.$3-$4'
    );
  }

  // =====================================================
  // UNIDADE
  // =====================================================

  function unidadeMorador(morador: Morador) {
    if (
      morador.tipo_residencia ===
      'apartamento_bloco'
    ) {
      return `Apto ${
        morador.apartamento || '-'
      } • Bloco ${morador.bloco || '-'}`;
    }

    if (
      morador.tipo_residencia ===
      'casa_quadra'
    ) {
      return `Casa ${
        morador.casa || '-'
      } • Quadra ${morador.quadra || '-'}`;
    }

    if (morador.casa) {
      return `Casa ${morador.casa}`;
    }

    if (morador.apartamento) {
      return `Apto ${morador.apartamento}`;
    }

    return 'Não informado';
  }

  // =====================================================
  // ABRIR EDIÇÃO
  // =====================================================

  function abrirEdicao(morador: Morador) {
    setEditando(morador);

    setNomeEdit(morador.nome ?? '');
    setEmailEdit(morador.email ?? '');
    setTelefoneEdit(morador.telefone ?? '');

    setCasaEdit(morador.casa ?? '');
    setQuadraEdit(morador.quadra ?? '');

    setApartamentoEdit(
      morador.apartamento ?? ''
    );

    setBlocoEdit(morador.bloco ?? '');
  }

  // =====================================================
  // CANCELAR EDIÇÃO
  // =====================================================

  function cancelarEdicao() {
    setEditando(null);

    setNomeEdit('');
    setEmailEdit('');
    setTelefoneEdit('');

    setCasaEdit('');
    setQuadraEdit('');

    setApartamentoEdit('');
    setBlocoEdit('');
  }

  // =====================================================
  // SALVAR EDIÇÃO
  // =====================================================

  async function salvarEdicao() {
    if (!editando) {
      return;
    }

    if (!nomeEdit.trim()) {
      Alert.alert(
        'Atenção',
        'Informe o nome do morador.'
      );

      return;
    }

    const emailLimpo =
      emailEdit.trim().toLowerCase();

    if (
      emailLimpo &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        emailLimpo
      )
    ) {
      Alert.alert(
        'Atenção',
        'Informe um e-mail válido.'
      );

      return;
    }

    try {
      setSalvando(true);

      const atualizacao: Record<string, any> = {
        nome: nomeEdit.trim(),

        email:
          emailLimpo || null,

        telefone:
          telefoneEdit.trim() || null,
      };

      if (
        editando.tipo_residencia ===
        'apartamento_bloco'
      ) {
        atualizacao.apartamento =
          apartamentoEdit.trim() || null;

        atualizacao.bloco =
          blocoEdit.trim() || null;
      }

      if (
        editando.tipo_residencia === 'casa'
      ) {
        atualizacao.casa =
          casaEdit.trim() || null;
      }

      if (
        editando.tipo_residencia ===
        'casa_quadra'
      ) {
        atualizacao.casa =
          casaEdit.trim() || null;

        atualizacao.quadra =
          quadraEdit.trim() || null;
      }

      const { error } = await supabase
        .from('perfis')
        .update(atualizacao)
        .eq('id', editando.id)
        .eq('tipo', 'morador');

      if (error) {
        throw error;
      }

      cancelarEdicao();

      await carregarMoradores();

      Alert.alert(
        'Sucesso',
        'Dados do morador atualizados.'
      );
    } catch (error) {
      console.error(
        'Erro ao atualizar morador:',
        error
      );

      Alert.alert(
        'Erro',
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar o morador.'
      );
    } finally {
      setSalvando(false);
    }
  }

  // =====================================================
  // ATIVAR / DESATIVAR
  // =====================================================

  async function alterarStatus(
    morador: Morador
  ) {
    try {
      const novoStatus = !morador.ativo;

      const { error } = await supabase
        .from('perfis')
        .update({
          ativo: novoStatus,
        })
        .eq('id', morador.id)
        .eq('tipo', 'morador');

      if (error) {
        throw error;
      }

      setMoradores((lista) =>
        lista.map((item) =>
          item.id === morador.id
            ? {
                ...item,
                ativo: novoStatus,
              }
            : item
        )
      );
    } catch (error) {
      console.error(
        'Erro ao alterar status:',
        error
      );

      Alert.alert(
        'Erro',
        'Não foi possível alterar o status do morador.'
      );
    }
  }

  // =====================================================
  // EXCLUIR MORADOR - CORRIGIDO PARA WEB
  // =====================================================

  async function excluirMorador(
    morador: Morador
  ) {
    try {
      setExcluindo(morador.id);

      console.log(
        'Tentando excluir morador:',
        morador.id,
        morador.nome
      );

      const { data, error } = await supabase
        .from('perfis')
        .delete()
        .eq('id', morador.id)
        .eq('tipo', 'morador')
        .select('id');

      if (error) {
        console.error(
          'Erro retornado pelo Supabase:',
          error
        );

        if (error.code === '23503') {
          window.alert(
            'Este morador possui registros vinculados no sistema e ainda não pode ser excluído.'
          );

          return;
        }

        throw error;
      }

      console.log(
        'Resultado da exclusão:',
        data
      );

      if (!data || data.length === 0) {
        window.alert(
          'O Supabase não permitiu excluir este morador.'
        );

        return;
      }

      setMoradores((lista) =>
        lista.filter(
          (item) => item.id !== morador.id
        )
      );

      window.alert(
        `${morador.nome} foi excluído com sucesso.`
      );

      await carregarMoradores();
    } catch (error: any) {
      console.error(
        'Erro ao excluir morador:',
        error
      );

      window.alert(
        error?.message ||
          'Não foi possível excluir o morador.'
      );
    } finally {
      setExcluindo(null);
    }
  }

  function confirmarExclusao(
    morador: Morador
  ) {
    const confirmou = window.confirm(
      `Deseja realmente excluir ${morador.nome}?\n\nEssa ação não poderá ser desfeita.`
    );

    if (!confirmou) {
      return;
    }

    excluirMorador(morador);
  }

  // =====================================================
  // TELA
  // =====================================================

  return (
    <View style={styles.container}>
      <WebSidebar active="moradores" />

      <View style={styles.main}>
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>
              Moradores
            </Text>

            <Text style={styles.pageSubtitle}>
              Gerencie os moradores cadastrados
            </Text>
          </View>

          <TouchableOpacity
            style={styles.newButton}
            onPress={() =>
              navigation.navigate(
                'WebNovoMorador'
              )
            }
          >
            <Text style={styles.newButtonText}>
              + Cadastrar novo morador
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <View style={styles.searchBox}>
              <TextInput
                value={pesquisa}
                onChangeText={setPesquisa}
                placeholder="Pesquisar por nome, CPF, e-mail, telefone ou unidade..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
              />
            </View>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={carregarMoradores}
            >
              <Text
                style={
                  styles.refreshButtonText
                }
              >
                Atualizar
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.summary}>
            <View style={styles.summaryCard}>
              <Text
                style={styles.summaryNumber}
              >
                {moradores.length}
              </Text>

              <Text
                style={styles.summaryLabel}
              >
                Moradores cadastrados
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text
                style={styles.summaryNumber}
              >
                {
                  moradores.filter(
                    (morador) =>
                      morador.ativo
                  ).length
                }
              </Text>

              <Text
                style={styles.summaryLabel}
              >
                Ativos
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text
                style={styles.summaryNumber}
              >
                {
                  moradores.filter(
                    (morador) =>
                      !morador.ativo
                  ).length
                }
              </Text>

              <Text
                style={styles.summaryLabel}
              >
                Inativos
              </Text>
            </View>
          </View>

          {erro ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {erro}
              </Text>

              <TouchableOpacity
                onPress={carregarMoradores}
              >
                <Text
                  style={styles.retryText}
                >
                  Tentar novamente
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.tableCard}>
            {carregando ? (
              <View
                style={
                  styles.loadingContainer
                }
              >
                <ActivityIndicator
                  size="large"
                  color="#2563EB"
                />

                <Text
                  style={styles.loadingText}
                >
                  Carregando moradores...
                </Text>
              </View>
            ) : moradoresFiltrados.length ===
              0 ? (
              <View
                style={styles.emptyContainer}
              >
                <Text
                  style={styles.emptyTitle}
                >
                  Nenhum morador encontrado
                </Text>

                <Text
                  style={styles.emptyText}
                >
                  {pesquisa
                    ? 'Nenhum morador corresponde à pesquisa.'
                    : 'Cadastre o primeiro morador do condomínio.'}
                </Text>

                {!pesquisa ? (
                  <TouchableOpacity
                    style={
                      styles.emptyButton
                    }
                    onPress={() =>
                      navigation.navigate(
                        'WebNovoMorador'
                      )
                    }
                  >
                    <Text
                      style={
                        styles.emptyButtonText
                      }
                    >
                      Cadastrar morador
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              <>
                <View
                  style={styles.tableHeader}
                >
                  <Text
                    style={[
                      styles.headerText,
                      styles.colMorador,
                    ]}
                  >
                    MORADOR
                  </Text>

                  <Text
                    style={[
                      styles.headerText,
                      styles.colCpf,
                    ]}
                  >
                    CPF
                  </Text>

                  <Text
                    style={[
                      styles.headerText,
                      styles.colUnidade,
                    ]}
                  >
                    UNIDADE
                  </Text>

                  <Text
                    style={[
                      styles.headerText,
                      styles.colStatus,
                    ]}
                  >
                    STATUS
                  </Text>

                  <Text
                    style={[
                      styles.headerText,
                      styles.colActions,
                    ]}
                  >
                    AÇÕES
                  </Text>
                </View>

                {moradoresFiltrados.map(
                  (morador) => (
                    <View
                      key={morador.id}
                      style={styles.tableRow}
                    >
                      <View
                        style={
                          styles.colMorador
                        }
                      >
                        <View
                          style={styles.nameRow}
                        >
                          <View
                            style={
                              styles.avatar
                            }
                          >
                            <Text
                              style={
                                styles.avatarText
                              }
                            >
                              {morador.nome
                                ?.charAt(0)
                                .toUpperCase() ||
                                'M'}
                            </Text>
                          </View>

                          <View
                            style={{ flex: 1 }}
                          >
                            <Text
                              style={
                                styles.nameText
                              }
                            >
                              {morador.nome}
                            </Text>

                            <Text
                              style={
                                styles.contactText
                              }
                            >
                              {morador.email ||
                                'Sem e-mail'}
                            </Text>

                            <Text
                              style={
                                styles.contactText
                              }
                            >
                              {morador.telefone ||
                                'Sem telefone'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View
                        style={styles.colCpf}
                      >
                        <Text
                          style={
                            styles.normalText
                          }
                        >
                          {formatarCPF(
                            morador.cpf
                          )}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.colUnidade
                        }
                      >
                        <Text
                          style={
                            styles.normalText
                          }
                        >
                          {unidadeMorador(
                            morador
                          )}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.colStatus
                        }
                      >
                        <TouchableOpacity
                          onPress={() =>
                            alterarStatus(
                              morador
                            )
                          }
                          style={[
                            styles.statusBadge,
                            morador.ativo
                              ? styles.statusActive
                              : styles.statusInactive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              morador.ativo
                                ? styles.statusActiveText
                                : styles.statusInactiveText,
                            ]}
                          >
                            {morador.ativo
                              ? 'Ativo'
                              : 'Inativo'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View
                        style={
                          styles.colActions
                        }
                      >
                        <TouchableOpacity
                          style={
                            styles.editButton
                          }
                          onPress={() =>
                            abrirEdicao(
                              morador
                            )
                          }
                        >
                          <Text
                            style={
                              styles.editText
                            }
                          >
                            Editar
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={
                            styles.deleteButton
                          }
                          disabled={
                            excluindo ===
                            morador.id
                          }
                          onPress={() =>
                            confirmarExclusao(
                              morador
                            )
                          }
                        >
                          {excluindo ===
                          morador.id ? (
                            <ActivityIndicator
                              size="small"
                              color="#DC2626"
                            />
                          ) : (
                            <Text
                              style={
                                styles.deleteText
                              }
                            >
                              Excluir
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )
                )}
              </>
            )}
          </View>
        </ScrollView>
      </View>

      {editando ? (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <View>
                <Text
                  style={styles.modalTitle}
                >
                  Editar morador
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  Atualize os dados de{' '}
                  {editando.nome}
                </Text>
              </View>

              <TouchableOpacity
                onPress={cancelarEdicao}
              >
                <Text
                  style={styles.closeText}
                >
                  ×
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
            >
              <Text style={styles.label}>
                Nome completo
              </Text>

              <TextInput
                value={nomeEdit}
                onChangeText={setNomeEdit}
                style={styles.input}
                placeholder="Nome completo"
              />

              <Text style={styles.label}>
                CPF
              </Text>

              <View
                style={styles.readOnlyInput}
              >
                <Text
                  style={
                    styles.readOnlyText
                  }
                >
                  {formatarCPF(
                    editando.cpf
                  )}
                </Text>
              </View>

              <Text
                style={styles.helperText}
              >
                O CPF não pode ser alterado
                porque é utilizado no login do
                morador.
              </Text>

              <Text style={styles.label}>
                E-mail
              </Text>

              <TextInput
                value={emailEdit}
                onChangeText={setEmailEdit}
                style={styles.input}
                placeholder="E-mail do morador"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>
                Telefone
              </Text>

              <TextInput
                value={telefoneEdit}
                onChangeText={
                  setTelefoneEdit
                }
                style={styles.input}
                placeholder="Telefone"
              />

              {editando.tipo_residencia ===
              'apartamento_bloco' ? (
                <>
                  <Text
                    style={styles.label}
                  >
                    Apartamento
                  </Text>

                  <TextInput
                    value={
                      apartamentoEdit
                    }
                    onChangeText={
                      setApartamentoEdit
                    }
                    style={styles.input}
                    placeholder="Apartamento"
                  />

                  <Text
                    style={styles.label}
                  >
                    Bloco
                  </Text>

                  <TextInput
                    value={blocoEdit}
                    onChangeText={
                      setBlocoEdit
                    }
                    style={styles.input}
                    placeholder="Bloco"
                  />
                </>
              ) : null}

              {editando.tipo_residencia ===
                'casa' ||
              editando.tipo_residencia ===
                'casa_quadra' ? (
                <>
                  <Text
                    style={styles.label}
                  >
                    Casa
                  </Text>

                  <TextInput
                    value={casaEdit}
                    onChangeText={
                      setCasaEdit
                    }
                    style={styles.input}
                    placeholder="Casa"
                  />
                </>
              ) : null}

              {editando.tipo_residencia ===
              'casa_quadra' ? (
                <>
                  <Text
                    style={styles.label}
                  >
                    Quadra
                  </Text>

                  <TextInput
                    value={quadraEdit}
                    onChangeText={
                      setQuadraEdit
                    }
                    style={styles.input}
                    placeholder="Quadra"
                  />
                </>
              ) : null}

              <View
                style={styles.modalActions}
              >
                <TouchableOpacity
                  style={
                    styles.cancelButton
                  }
                  disabled={salvando}
                  onPress={cancelarEdicao}
                >
                  <Text
                    style={
                      styles.cancelText
                    }
                  >
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    salvando &&
                      styles.disabledButton,
                  ]}
                  disabled={salvando}
                  onPress={salvarEdicao}
                >
                  {salvando ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  ) : null}

                  <Text
                    style={styles.saveText}
                  >
                    {salvando
                      ? 'Salvando...'
                      : 'Salvar alterações'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      ) : null}
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
    backgroundColor: '#F8FAFC',
  },

  main: {
    flex: 1,
  },

  header: {
    height: 88,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  pageTitle: {
    color: '#0F172A',
    fontSize: 23,
    fontWeight: '800',
  },

  pageSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 3,
  },

  newButton: {
    height: 42,
    paddingHorizontal: 18,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  newButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: 35,
    paddingBottom: 60,
  },

  topRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },

  searchBox: {
    flex: 1,
    maxWidth: 650,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    justifyContent: 'center',
  },

  searchInput: {
    height: '100%',
    paddingHorizontal: 15,
    color: '#0F172A',
    fontSize: 12,
    outlineStyle: 'none',
  } as any,

  refreshButton: {
    height: 44,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  refreshButtonText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
  },

  summary: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 22,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 18,
  },

  summaryNumber: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '800',
  },

  summaryLabel: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 4,
  },

  tableCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
  },

  tableHeader: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  tableRow: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  headerText: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
  },

  colMorador: {
    flex: 2.4,
  },

  colCpf: {
    flex: 1.25,
  },

  colUnidade: {
    flex: 1.5,
  },

  colStatus: {
    flex: 0.9,
  },

  colActions: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 7,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  avatarText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '800',
  },

  nameText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },

  contactText: {
    color: '#94A3B8',
    fontSize: 9,
    marginTop: 2,
  },

  normalText: {
    color: '#475569',
    fontSize: 10,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusActive: {
    backgroundColor: '#DCFCE7',
  },

  statusInactive: {
    backgroundColor: '#FEE2E2',
  },

  statusText: {
    fontSize: 9,
    fontWeight: '800',
  },

  statusActiveText: {
    color: '#15803D',
  },

  statusInactiveText: {
    color: '#B91C1C',
  },

  editButton: {
    height: 32,
    paddingHorizontal: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  editText: {
    color: '#2563EB',
    fontSize: 9,
    fontWeight: '800',
  },

  deleteButton: {
    height: 32,
    paddingHorizontal: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteText: {
    color: '#DC2626',
    fontSize: 9,
    fontWeight: '800',
  },

  loadingContainer: {
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 12,
  },

  emptyContainer: {
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  emptyTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },

  emptyText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },

  emptyButton: {
    marginTop: 18,
    height: 40,
    paddingHorizontal: 18,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 9,
    padding: 15,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  errorText: {
    color: '#B91C1C',
    fontSize: 11,
  },

  retryText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '800',
  },

  // MODAL

  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },

  modal: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 25,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 25,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  modalTitle: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '800',
  },

  modalSubtitle: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 4,
  },

  closeText: {
    color: '#64748B',
    fontSize: 26,
    lineHeight: 28,
  },

  label: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 7,
    marginTop: 12,
  },

  input: {
    width: '100%',
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 13,
    color: '#0F172A',
    fontSize: 11,
    outlineStyle: 'none',
  } as any,

  readOnlyInput: {
    width: '100%',
    height: 44,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 13,
    justifyContent: 'center',
  },

  readOnlyText: {
    color: '#64748B',
    fontSize: 11,
  },

  helperText: {
    color: '#94A3B8',
    fontSize: 9,
    marginTop: 5,
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 25,
  },

  cancelButton: {
    height: 42,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
  },

  saveButton: {
    minWidth: 155,
    height: 42,
    paddingHorizontal: 18,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },

  disabledButton: {
    opacity: 0.65,
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});