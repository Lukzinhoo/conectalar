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
  useWindowDimensions,
  View,
} from 'react-native';

import {
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  X,
} from 'lucide-react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthStackParamList } from '../../../navigation/AuthNavigator';
import { supabase } from '../../../services/supabase';

import WebSidebar from '../../../components/WebSidebar';
import WebLayout from '../../../components/WebLayout';

import { colors } from '../../../theme/theme';

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
  const { width } = useWindowDimensions();

  const isMobile = width < 768;
  const isTablet =
    width >= 768 && width < 1100;

  const [moradores, setMoradores] =
    useState<Morador[]>([]);

  const [pesquisa, setPesquisa] =
    useState('');

  const [carregando, setCarregando] =
    useState(true);

  const [atualizando, setAtualizando] =
    useState(false);

  const [erro, setErro] =
    useState('');

  const [excluindo, setExcluindo] =
    useState<string | null>(null);

  const [editando, setEditando] =
    useState<Morador | null>(null);

  const [nomeEdit, setNomeEdit] =
    useState('');

  const [emailEdit, setEmailEdit] =
    useState('');

  const [
    telefoneEdit,
    setTelefoneEdit,
  ] = useState('');

  const [casaEdit, setCasaEdit] =
    useState('');

  const [quadraEdit, setQuadraEdit] =
    useState('');

  const [
    apartamentoEdit,
    setApartamentoEdit,
  ] = useState('');

  const [blocoEdit, setBlocoEdit] =
    useState('');

  const [salvando, setSalvando] =
    useState(false);

  // =====================================================
  // CARREGAR MORADORES
  // =====================================================

  const carregarMoradores =
    useCallback(
      async (
        mostrarAtualizacao = false
      ) => {
        try {
          if (mostrarAtualizacao) {
            setAtualizando(true);
          } else {
            setCarregando(true);
          }

          setErro('');

          const { data, error } =
            await supabase
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
              .eq(
                'tipo',
                'morador'
              )
              .order('nome', {
                ascending: true,
              });

          if (error) {
            throw error;
          }

          setMoradores(
            (data ?? []) as Morador[]
          );
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
          setAtualizando(false);
        }
      },
      []
    );

  useEffect(() => {
    carregarMoradores();
  }, [carregarMoradores]);

  // =====================================================
  // PESQUISA
  // =====================================================

  const moradoresFiltrados =
    useMemo(() => {
      const termo =
        pesquisa
          .trim()
          .toLowerCase();

      if (!termo) {
        return moradores;
      }

      const numeros =
        termo.replace(/\D/g, '');

      return moradores.filter(
        morador => {
          const nome =
            morador.nome
              ?.toLowerCase() ?? '';

          const email =
            morador.email
              ?.toLowerCase() ?? '';

          const cpf =
            morador.cpf
              ?.toLowerCase() ?? '';

          const cpfNumeros =
            morador.cpf
              ?.replace(/\D/g, '') ??
            '';

          const telefone =
            morador.telefone
              ?.toLowerCase() ?? '';

          const casa =
            morador.casa
              ?.toLowerCase() ?? '';

          const quadra =
            morador.quadra
              ?.toLowerCase() ?? '';

          const apartamento =
            morador.apartamento
              ?.toLowerCase() ?? '';

          const bloco =
            morador.bloco
              ?.toLowerCase() ?? '';

          return (
            nome.includes(termo) ||
            email.includes(termo) ||
            cpf.includes(termo) ||
            telefone.includes(termo) ||
            casa.includes(termo) ||
            quadra.includes(termo) ||
            apartamento.includes(
              termo
            ) ||
            bloco.includes(termo) ||
            (!!numeros &&
              cpfNumeros.includes(
                numeros
              ))
          );
        }
      );
    }, [moradores, pesquisa]);

  // =====================================================
  // RESUMO
  // =====================================================

  const totalAtivos =
    moradores.filter(
      morador => morador.ativo
    ).length;

  const totalInativos =
    moradores.length -
    totalAtivos;

  // =====================================================
  // CPF
  // =====================================================

  function formatarCPF(
    cpf: string | null
  ) {
    if (!cpf) {
      return '-';
    }

    const numeros =
      cpf.replace(/\D/g, '');

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

  function unidadeMorador(
    morador: Morador
  ) {
    if (
      morador.tipo_residencia ===
      'apartamento_bloco'
    ) {
      return `Apto ${
        morador.apartamento || '-'
      } • Bloco ${
        morador.bloco || '-'
      }`;
    }

    if (
      morador.tipo_residencia ===
      'casa_quadra'
    ) {
      return `Casa ${
        morador.casa || '-'
      } • Quadra ${
        morador.quadra || '-'
      }`;
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
  // EDITAR
  // =====================================================

  function abrirEdicao(
    morador: Morador
  ) {
    setEditando(morador);

    setNomeEdit(
      morador.nome ?? ''
    );

    setEmailEdit(
      morador.email ?? ''
    );

    setTelefoneEdit(
      morador.telefone ?? ''
    );

    setCasaEdit(
      morador.casa ?? ''
    );

    setQuadraEdit(
      morador.quadra ?? ''
    );

    setApartamentoEdit(
      morador.apartamento ?? ''
    );

    setBlocoEdit(
      morador.bloco ?? ''
    );
  }

  function limparEdicao() {
    setEditando(null);

    setNomeEdit('');
    setEmailEdit('');
    setTelefoneEdit('');
    setCasaEdit('');
    setQuadraEdit('');
    setApartamentoEdit('');
    setBlocoEdit('');
  }

  function cancelarEdicao() {
    if (salvando) {
      return;
    }

    limparEdicao();
  }

  async function salvarEdicao() {
    if (!editando || salvando) {
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
      emailEdit
        .trim()
        .toLowerCase();

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

      const atualizacao: Record<
        string,
        any
      > = {
        nome: nomeEdit.trim(),

        email:
          emailLimpo || null,

        telefone:
          telefoneEdit.trim() ||
          null,
      };

      if (
        editando.tipo_residencia ===
        'apartamento_bloco'
      ) {
        atualizacao.apartamento =
          apartamentoEdit.trim() ||
          null;

        atualizacao.bloco =
          blocoEdit.trim() ||
          null;
      }

      if (
        editando.tipo_residencia ===
        'casa'
      ) {
        atualizacao.casa =
          casaEdit.trim() ||
          null;
      }

      if (
        editando.tipo_residencia ===
        'casa_quadra'
      ) {
        atualizacao.casa =
          casaEdit.trim() ||
          null;

        atualizacao.quadra =
          quadraEdit.trim() ||
          null;
      }

      const { error } =
        await supabase
          .from('perfis')
          .update(atualizacao)
          .eq(
            'id',
            editando.id
          )
          .eq(
            'tipo',
            'morador'
          );

      if (error) {
        throw error;
      }

      // Fecha corretamente depois de salvar.
      limparEdicao();

      await carregarMoradores(
        true
      );

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
      const novoStatus =
        !morador.ativo;

      const { error } =
        await supabase
          .from('perfis')
          .update({
            ativo: novoStatus,
          })
          .eq(
            'id',
            morador.id
          )
          .eq(
            'tipo',
            'morador'
          );

      if (error) {
        throw error;
      }

      setMoradores(lista =>
        lista.map(item =>
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
  // EXCLUIR
  // =====================================================

  async function excluirMorador(
    morador: Morador
  ) {
    try {
      setExcluindo(
        morador.id
      );

      const { data, error } =
        await supabase
          .from('perfis')
          .delete()
          .eq(
            'id',
            morador.id
          )
          .eq(
            'tipo',
            'morador'
          )
          .select('id');

      if (error) {
        if (
          error.code === '23503'
        ) {
          if (
            typeof window !==
            'undefined'
          ) {
            window.alert(
              'Este morador possui registros vinculados no sistema e ainda não pode ser excluído.'
            );
          }

          return;
        }

        throw error;
      }

      if (
        !data ||
        data.length === 0
      ) {
        if (
          typeof window !==
          'undefined'
        ) {
          window.alert(
            'O Supabase não permitiu excluir este morador.'
          );
        }

        return;
      }

      setMoradores(lista =>
        lista.filter(
          item =>
            item.id !==
            morador.id
        )
      );

      if (
        typeof window !==
        'undefined'
      ) {
        window.alert(
          `${morador.nome} foi excluído com sucesso.`
        );
      }

      await carregarMoradores(
        true
      );
    } catch (error: any) {
      console.error(
        'Erro ao excluir morador:',
        error
      );

      if (
        typeof window !==
        'undefined'
      ) {
        window.alert(
          error?.message ||
            'Não foi possível excluir o morador.'
        );
      }
    } finally {
      setExcluindo(null);
    }
  }

  function confirmarExclusao(
    morador: Morador
  ) {
    const confirmou =
      typeof window !==
      'undefined'
        ? window.confirm(
            `Deseja realmente excluir ${morador.nome}?\n\nEssa ação não poderá ser desfeita.`
          )
        : false;

    if (!confirmou) {
      return;
    }

    excluirMorador(morador);
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <>
      <WebLayout
        sidebar={
          <WebSidebar
            active="moradores"
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
                styles.pageTitle,
                isMobile &&
                  styles.pageTitleMobile,
              ]}
            >
              Moradores
            </Text>

            <Text
              style={
                styles.pageSubtitle
              }
            >
              Gerencie os moradores
              cadastrados no condomínio.
            </Text>
          </View>

          <Pressable
            style={[
              styles.newButton,
              isMobile &&
                styles.newButtonMobile,
            ]}
            onPress={() =>
              navigation.navigate(
                'WebNovoMorador'
              )
            }
          >
            <Plus
              size={17}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.newButtonText
              }
            >
              Cadastrar novo morador
            </Text>
          </Pressable>
        </View>

        {/* BUSCA */}

        <View
          style={[
            styles.topRow,
            isMobile &&
              styles.topRowMobile,
          ]}
        >
          <View
            style={[
              styles.searchBox,
              isMobile &&
                styles.searchBoxMobile,
            ]}
          >
            <Search
              size={17}
              color="#64748B"
            />

            <TextInput
              value={pesquisa}
              onChangeText={
                setPesquisa
              }
              placeholder={
                isMobile
                  ? 'Pesquisar morador...'
                  : 'Pesquisar por nome, CPF, e-mail, telefone ou unidade...'
              }
              placeholderTextColor="#94A3B8"
              style={
                styles.searchInput
              }
            />
          </View>

          <Pressable
            style={[
              styles.refreshButton,
              isMobile &&
                styles.refreshButtonMobile,
            ]}
            onPress={() =>
              carregarMoradores(
                true
              )
            }
            disabled={
              atualizando
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
                styles.refreshButtonText
              }
            >
              Atualizar
            </Text>
          </Pressable>
        </View>

        {/* RESUMO */}

        <View
          style={[
            styles.summary,
            (isMobile ||
              isTablet) &&
              styles.summaryResponsive,
          ]}
        >
          <ResumoCard
            numero={
              moradores.length
            }
            titulo="Moradores cadastrados"
            responsive={
              isMobile ||
              isTablet
            }
          />

          <ResumoCard
            numero={totalAtivos}
            titulo="Ativos"
            responsive={
              isMobile ||
              isTablet
            }
          />

          <ResumoCard
            numero={
              totalInativos
            }
            titulo="Inativos"
            responsive={
              isMobile ||
              isTablet
            }
            ultimo
          />
        </View>

        {/* ERRO */}

        {!!erro && (
          <View
            style={[
              styles.errorBox,
              isMobile &&
                styles.errorBoxMobile,
            ]}
          >
            <Text
              style={
                styles.errorText
              }
            >
              {erro}
            </Text>

            <Pressable
              onPress={() =>
                carregarMoradores(
                  true
                )
              }
            >
              <Text
                style={
                  styles.retryText
                }
              >
                Tentar novamente
              </Text>
            </Pressable>
          </View>
        )}

        {/* CONTEÚDO */}

        {carregando ? (
          <View
            style={
              styles.loadingContainer
            }
          >
            <ActivityIndicator
              size="large"
              color={
                colors.primary
              }
            />

            <Text
              style={
                styles.loadingText
              }
            >
              Carregando moradores...
            </Text>
          </View>
        ) : moradoresFiltrados.length ===
          0 ? (
          <View
            style={
              styles.emptyContainer
            }
          >
            <UserRound
              size={42}
              color="#94A3B8"
            />

            <Text
              style={
                styles.emptyTitle
              }
            >
              Nenhum morador encontrado
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              {pesquisa
                ? 'Nenhum morador corresponde à pesquisa.'
                : 'Cadastre o primeiro morador do condomínio.'}
            </Text>

            {!pesquisa && (
              <Pressable
                style={
                  styles.emptyButton
                }
                onPress={() =>
                  navigation.navigate(
                    'WebNovoMorador'
                  )
                }
              >
                <Plus
                  size={16}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.emptyButtonText
                  }
                >
                  Cadastrar morador
                </Text>
              </Pressable>
            )}
          </View>
        ) : isMobile ? (
          // =================================================
          // CELULAR
          // =================================================

          <View
            style={
              styles.mobileList
            }
          >
            {moradoresFiltrados.map(
              morador => (
                <View
                  key={morador.id}
                  style={
                    styles.mobileCard
                  }
                >
                  <View
                    style={
                      styles.mobileCardHeader
                    }
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
                      style={
                        styles.mobileNameArea
                      }
                    >
                      <Text
                        style={
                          styles.nameTextMobile
                        }
                        numberOfLines={
                          2
                        }
                      >
                        {morador.nome}
                      </Text>

                      <Text
                        style={
                          styles.contactText
                        }
                        numberOfLines={
                          1
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

                    <Pressable
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
                    </Pressable>
                  </View>

                  <View
                    style={
                      styles.mobileDivider
                    }
                  />

                  <View
                    style={
                      styles.mobileData
                    }
                  >
                    <InfoMobile
                      titulo="CPF"
                      valor={formatarCPF(
                        morador.cpf
                      )}
                    />

                    <InfoMobile
                      titulo="Unidade"
                      valor={unidadeMorador(
                        morador
                      )}
                    />
                  </View>

                  <View
                    style={
                      styles.mobileActions
                    }
                  >
                    <Pressable
                      style={
                        styles.editButtonMobile
                      }
                      onPress={() =>
                        abrirEdicao(
                          morador
                        )
                      }
                    >
                      <Edit3
                        size={14}
                        color="#2563EB"
                      />

                      <Text
                        style={
                          styles.editText
                        }
                      >
                        Editar
                      </Text>
                    </Pressable>

                    <Pressable
                      style={
                        styles.deleteButtonMobile
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
                        <Trash2
                          size={14}
                          color="#DC2626"
                        />
                      )}

                      <Text
                        style={
                          styles.deleteText
                        }
                      >
                        Excluir
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )
            )}
          </View>
        ) : (
          // =================================================
          // DESKTOP / TABLET
          // =================================================

          <View
            style={
              styles.tableCard
            }
          >
            <View
              style={
                styles.tableHeader
              }
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
              morador => (
                <View
                  key={morador.id}
                  style={
                    styles.tableRow
                  }
                >
                  <View
                    style={[
                      styles.colMorador,
                      styles.nameRow,
                    ]}
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
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <Text
                        style={
                          styles.nameText
                        }
                        numberOfLines={
                          1
                        }
                      >
                        {morador.nome}
                      </Text>

                      <Text
                        style={
                          styles.contactText
                        }
                        numberOfLines={
                          1
                        }
                      >
                        {morador.email ||
                          'Sem e-mail'}
                      </Text>

                      <Text
                        style={
                          styles.contactText
                        }
                        numberOfLines={
                          1
                        }
                      >
                        {morador.telefone ||
                          'Sem telefone'}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={
                      styles.colCpf
                    }
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
                    <Pressable
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
                    </Pressable>
                  </View>

                  <View
                    style={
                      styles.colActions
                    }
                  >
                    <Pressable
                      style={
                        styles.editButton
                      }
                      onPress={() =>
                        abrirEdicao(
                          morador
                        )
                      }
                    >
                      <Edit3
                        size={13}
                        color="#2563EB"
                      />

                      <Text
                        style={
                          styles.editText
                        }
                      >
                        Editar
                      </Text>
                    </Pressable>

                    <Pressable
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
                        <Trash2
                          size={13}
                          color="#DC2626"
                        />
                      )}

                      <Text
                        style={
                          styles.deleteText
                        }
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
      </WebLayout>

      {/* ===================================================
          MODAL DE EDIÇÃO
      =================================================== */}

      <Modal
        visible={!!editando}
        transparent
        animationType="fade"
        onRequestClose={
          cancelarEdicao
        }
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
              styles.modal,
              isMobile &&
                styles.modalMobile,
            ]}
          >
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
                  Editar morador
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  Atualize os dados do
                  morador.
                </Text>
              </View>

              <Pressable
                style={
                  styles.closeButton
                }
                onPress={
                  cancelarEdicao
                }
                disabled={salvando}
              >
                <X
                  size={18}
                  color="#475569"
                />
              </Pressable>
            </View>

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
                style={
                  styles.label
                }
              >
                Nome
              </Text>

              <TextInput
                value={nomeEdit}
                onChangeText={
                  setNomeEdit
                }
                style={
                  styles.input
                }
                placeholder="Nome completo"
                placeholderTextColor="#94A3B8"
                editable={!salvando}
              />

              <Text
                style={
                  styles.label
                }
              >
                CPF
              </Text>

              <View
                style={
                  styles.readOnlyInput
                }
              >
                <Text
                  style={
                    styles.readOnlyText
                  }
                >
                  {formatarCPF(
                    editando?.cpf ??
                      null
                  )}
                </Text>
              </View>

              <Text
                style={
                  styles.helperText
                }
              >
                O CPF não pode ser
                alterado porque é
                utilizado no login do
                morador.
              </Text>

              <Text
                style={
                  styles.label
                }
              >
                E-mail
              </Text>

              <TextInput
                value={emailEdit}
                onChangeText={
                  setEmailEdit
                }
                style={
                  styles.input
                }
                placeholder="E-mail do morador"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!salvando}
              />

              <Text
                style={
                  styles.label
                }
              >
                Telefone
              </Text>

              <TextInput
                value={
                  telefoneEdit
                }
                onChangeText={
                  setTelefoneEdit
                }
                style={
                  styles.input
                }
                placeholder="Telefone"
                placeholderTextColor="#94A3B8"
                editable={!salvando}
              />

              {editando?.tipo_residencia ===
                'apartamento_bloco' && (
                <>
                  <Text
                    style={
                      styles.label
                    }
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
                    style={
                      styles.input
                    }
                    placeholder="Apartamento"
                    placeholderTextColor="#94A3B8"
                    editable={
                      !salvando
                    }
                  />

                  <Text
                    style={
                      styles.label
                    }
                  >
                    Bloco
                  </Text>

                  <TextInput
                    value={
                      blocoEdit
                    }
                    onChangeText={
                      setBlocoEdit
                    }
                    style={
                      styles.input
                    }
                    placeholder="Bloco"
                    placeholderTextColor="#94A3B8"
                    editable={
                      !salvando
                    }
                  />
                </>
              )}

              {(editando?.tipo_residencia ===
                'casa' ||
                editando?.tipo_residencia ===
                  'casa_quadra') && (
                <>
                  <Text
                    style={
                      styles.label
                    }
                  >
                    Casa
                  </Text>

                  <TextInput
                    value={
                      casaEdit
                    }
                    onChangeText={
                      setCasaEdit
                    }
                    style={
                      styles.input
                    }
                    placeholder="Casa"
                    placeholderTextColor="#94A3B8"
                    editable={
                      !salvando
                    }
                  />
                </>
              )}

              {editando?.tipo_residencia ===
                'casa_quadra' && (
                <>
                  <Text
                    style={
                      styles.label
                    }
                  >
                    Quadra
                  </Text>

                  <TextInput
                    value={
                      quadraEdit
                    }
                    onChangeText={
                      setQuadraEdit
                    }
                    style={
                      styles.input
                    }
                    placeholder="Quadra"
                    placeholderTextColor="#94A3B8"
                    editable={
                      !salvando
                    }
                  />
                </>
              )}
            </ScrollView>

            <View
              style={
                styles.modalActions
              }
            >
              <Pressable
                style={
                  styles.cancelButton
                }
                disabled={salvando}
                onPress={
                  cancelarEdicao
                }
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
                    styles.disabledButton,
                ]}
                disabled={salvando}
                onPress={
                  salvarEdicao
                }
              >
                {salvando && (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                )}

                <Text
                  style={
                    styles.saveText
                  }
                >
                  {salvando
                    ? 'Salvando...'
                    : 'Salvar alterações'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// =====================================================
// RESUMO
// =====================================================

function ResumoCard({
  numero,
  titulo,
  responsive,
  ultimo = false,
}: {
  numero: number;
  titulo: string;
  responsive: boolean;
  ultimo?: boolean;
}) {
  return (
    <View
      style={[
        styles.summaryCard,

        responsive &&
          styles.summaryCardResponsive,

        !responsive &&
          ultimo &&
          styles.summaryCardLast,

        responsive &&
          ultimo &&
          styles.summaryCardResponsiveLast,
      ]}
    >
      <Text
        style={[
          styles.summaryNumber,
          responsive &&
            styles.summaryNumberResponsive,
        ]}
      >
        {numero}
      </Text>

      <Text
        style={[
          styles.summaryLabel,
          responsive &&
            styles.summaryLabelResponsive,
        ]}
        numberOfLines={2}
      >
        {titulo}
      </Text>
    </View>
  );
}

// =====================================================
// INFORMAÇÃO MOBILE
// =====================================================

function InfoMobile({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <View
      style={
        styles.mobileInfoItem
      }
    >
      <Text
        style={
          styles.mobileInfoLabel
        }
      >
        {titulo}
      </Text>

      <Text
        style={
          styles.mobileInfoValue
        }
      >
        {valor}
      </Text>
    </View>
  );
}

// =====================================================
// ESTILOS
// =====================================================

const styles = StyleSheet.create({
  // ===================================================
  // CABEÇALHO
  // ===================================================

  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 22,
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

  pageTitle: {
    color: '#0F172A',
    fontSize: 25,
    fontWeight: '800',
  },

  pageTitleMobile: {
    fontSize: 23,
  },

  pageSubtitle: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  newButton: {
    minHeight: 44,
    paddingHorizontal: 17,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 20,
  },

  newButtonMobile: {
    width: '100%',
    marginLeft: 0,
    marginTop: 15,
  },

  newButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 7,
  },

  // ===================================================
  // BUSCA
  // ===================================================

  topRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  topRowMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },

  searchBox: {
    flex: 1,
    maxWidth: 650,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    marginRight: 10,
  },

  searchBoxMobile: {
    width: '100%',
    maxWidth: '100%',
    marginRight: 0,
    marginBottom: 9,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    height: 42,
    paddingHorizontal: 9,
    color: '#0F172A',
    fontSize: 12,
    outlineStyle: 'none',
  } as any,

  refreshButton: {
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  refreshButtonMobile: {
    width: '100%',
  },

  refreshButtonText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },

  // ===================================================
  // RESUMO - CORRIGIDO PARA CELULAR
  // ===================================================

  summary: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 22,
  },

  summaryResponsive: {
    width: '100%',
    flexDirection: 'column',
  },

  summaryCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 78,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,

    paddingHorizontal: 17,
    paddingVertical: 14,

    marginRight: 12,

    justifyContent: 'center',
  },

  summaryCardLast: {
    marginRight: 0,
  },

  summaryCardResponsive: {
    width: '100%',
    flex: 0,

    minHeight: 64,

    marginRight: 0,
    marginBottom: 9,

    paddingHorizontal: 16,
    paddingVertical: 10,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  summaryCardResponsiveLast: {
    marginBottom: 0,
  },

  summaryNumber: {
    color: '#0F172A',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '800',
  },

  summaryNumberResponsive: {
    width: 44,
    flexShrink: 0,
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'left',
  },

  summaryLabel: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  summaryLabelResponsive: {
    flex: 1,
    minWidth: 0,
    marginTop: 0,
    marginLeft: 8,
    fontSize: 11,
    lineHeight: 17,
  },

  // ===================================================
  // ERRO
  // ===================================================

  errorBox: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  errorBoxMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },

  errorText: {
    color: '#B91C1C',
    fontSize: 11,
    flex: 1,
    lineHeight: 17,
  },

  retryText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 5,
  },

  // ===================================================
  // TABELA
  // ===================================================

  tableCard: {
    width: '100%',
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
    minWidth: 0,
  },

  colCpf: {
    flex: 1.25,
    minWidth: 0,
  },

  colUnidade: {
    flex: 1.5,
    minWidth: 0,
  },

  colStatus: {
    flex: 0.9,
    minWidth: 0,
  },

  colActions: {
    flex: 1.5,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  // ===================================================
  // MORADOR
  // ===================================================

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    flexShrink: 0,
  },

  avatarText: {
    color: '#2563EB',
    fontSize: 14,
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
    lineHeight: 15,
  },

  // ===================================================
  // STATUS
  // ===================================================

  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
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

  // ===================================================
  // BOTÕES DESKTOP
  // ===================================================

  editButton: {
    height: 34,
    paddingHorizontal: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },

  editText: {
    color: '#2563EB',
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 5,
  },

  deleteButton: {
    height: 34,
    paddingHorizontal: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteText: {
    color: '#DC2626',
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 5,
  },

  // ===================================================
  // MOBILE
  // ===================================================

  mobileList: {
    width: '100%',
  },

  mobileCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 11,
  },

  mobileCardHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  mobileNameArea: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },

  nameTextMobile: {
    color: '#0F172A',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },

  mobileDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 13,
  },

  mobileData: {
    width: '100%',
  },

  mobileInfoItem: {
    width: '100%',
    marginBottom: 10,
  },

  mobileInfoLabel: {
    color: '#94A3B8',
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  mobileInfoValue: {
    color: '#334155',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    marginTop: 3,
  },

  mobileActions: {
    width: '100%',
    flexDirection: 'row',
    marginTop: 4,
  },

  editButtonMobile: {
    flex: 1,
    height: 40,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },

  deleteButtonMobile: {
    flex: 1,
    height: 40,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ===================================================
  // LOADING
  // ===================================================

  loadingContainer: {
    width: '100%',
    minHeight: 300,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 12,
  },

  // ===================================================
  // VAZIO
  // ===================================================

  emptyContainer: {
    width: '100%',
    minHeight: 300,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },

  emptyTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 11,
  },

  emptyText: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
    textAlign: 'center',
  },

  emptyButton: {
    marginTop: 18,
    minHeight: 42,
    paddingHorizontal: 17,
    backgroundColor: '#2563EB',
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 6,
  },

  // ===================================================
  // MODAL
  // ===================================================

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },

  modalOverlayMobile: {
    padding: 10,
  },

  modal: {
    width: '100%',
    maxWidth: 620,
    height: '90%',
    maxHeight: 720,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
    alignItems: 'flex-start',
    justifyContent:
      'space-between',
    marginBottom: 8,
    flexShrink: 0,
  },

  modalHeaderText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },

  modalTitle: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '800',
  },

  modalSubtitle: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  closeButton: {
    width: 37,
    height: 37,
    borderRadius: 9,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    lineHeight: 14,
    marginTop: 5,
  },

  // ===================================================
  // BOTÕES FIXOS DO MODAL
  // ===================================================

  modalActions: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    paddingTop: 12,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },

  cancelButton: {
    flex: 1,
    minWidth: 0,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    paddingHorizontal: 8,
  },

  cancelText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
  },

  saveButton: {
    flex: 1.35,
    minWidth: 0,
    height: 44,
    paddingHorizontal: 8,
    backgroundColor: '#2563EB',
    borderRadius: 9,
    flexDirection: 'row',
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
    marginLeft: 5,
    textAlign: 'center',
  },
});