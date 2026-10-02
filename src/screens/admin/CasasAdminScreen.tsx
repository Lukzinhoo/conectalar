import React, { useCallback, useEffect, useState } from 'react';
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

import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ArrowLeft,
  Building2,
  Car,
  Check,
  ChevronDown,
  Edit3,
  Home,
  MapPin,
  PawPrint,
  Phone,
  Plus,
  Trash2,
  User,
  Wrench,
  X,
} from 'lucide-react-native';

import { colors } from '../../theme/theme';
import { supabase } from '../../services/supabase';

type SituacaoCasa =
  | 'ocupada'
  | 'vazia'
  | 'alugada'
  | 'manutencao';

type TipoLocalizacao = 'nenhuma' | 'quadra' | 'bloco';

type Casa = {
  id: string;
  numero: string;
  tipo_localizacao: TipoLocalizacao;
  quadra: string | null;
  bloco: string | null;
  responsavel: string | null;
  telefone: string | null;
  quantidade_veiculos: number;
  possui_animais: boolean;
  situacao: SituacaoCasa;
  observacao: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
};

const situacoes: {
  valor: SituacaoCasa;
  texto: string;
}[] = [
  {
    valor: 'ocupada',
    texto: 'Ocupada',
  },
  {
    valor: 'vazia',
    texto: 'Vazia',
  },
  {
    valor: 'alugada',
    texto: 'Alugada',
  },
  {
    valor: 'manutencao',
    texto: 'Manutenção',
  },
];

function nomeSituacao(
  situacao: SituacaoCasa
) {
  switch (situacao) {
    case 'ocupada':
      return 'Ocupada';

    case 'vazia':
      return 'Vazia';

    case 'alugada':
      return 'Alugada';

    case 'manutencao':
      return 'Manutenção';

    default:
      return 'Ocupada';
  }
}

export default function CasasAdminScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [casas, setCasas] =
    useState<Casa[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [atualizando, setAtualizando] =
    useState(false);

  const [salvando, setSalvando] =
    useState(false);

  const [excluindoId, setExcluindoId] =
    useState<string | null>(null);

  const [modalAberto, setModalAberto] =
    useState(false);

  const [
    modalSituacaoAberto,
    setModalSituacaoAberto,
  ] = useState(false);

  const [casaEditando, setCasaEditando] =
    useState<Casa | null>(null);

  const [numero, setNumero] =
    useState('');

  const [tipoLocalizacao, setTipoLocalizacao] =
    useState<TipoLocalizacao>('nenhuma');

  const [modalLocalizacaoAberto, setModalLocalizacaoAberto] =
    useState(false);

  const [quadra, setQuadra] =
    useState('');

  const [bloco, setBloco] =
    useState('');

  const [responsavel, setResponsavel] =
    useState('');

  const [telefone, setTelefone] =
    useState('');

  const [
    quantidadeVeiculos,
    setQuantidadeVeiculos,
  ] = useState('0');

  const [
    possuiAnimais,
    setPossuiAnimais,
  ] = useState(false);

  const [situacao, setSituacao] =
    useState<SituacaoCasa>('ocupada');

  const [observacao, setObservacao] =
    useState('');

  const carregarCasas = useCallback(
    async (silencioso = false) => {
      try {
        if (!silencioso) {
          setCarregando(true);
        }

        const { data, error } =
          await supabase
            .from('casas')
            .select(
              `
              id,
              numero,
              tipo_localizacao,
              quadra,
              bloco,
              responsavel,
              telefone,
              quantidade_veiculos,
              possui_animais,
              situacao,
              observacao,
              ativo,
              criado_em,
              atualizado_em
              `
            )
            .order('quadra', {
              ascending: true,
            })
            .order('numero', {
              ascending: true,
            });

        if (error) {
          throw error;
        }

        setCasas(
          (data ?? []) as Casa[]
        );
      } catch (error: any) {
        console.error(
          'Erro ao carregar casas:',
          error
        );

        Alert.alert(
          'Erro ao carregar',
          error?.message ||
            'Não foi possível carregar as unidades.'
        );
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    []
  );

  useEffect(() => {
    carregarCasas();
  }, [carregarCasas]);

  useFocusEffect(
    useCallback(() => {
      carregarCasas(true);
    }, [carregarCasas])
  );

  async function atualizarTela() {
    setAtualizando(true);
    await carregarCasas(true);
  }

  function limparFormulario() {
    setNumero('');
    setTipoLocalizacao('nenhuma');
    setModalLocalizacaoAberto(false);
    setQuadra('');
    setBloco('');
    setResponsavel('');
    setTelefone('');
    setQuantidadeVeiculos('0');
    setPossuiAnimais(false);
    setSituacao('ocupada');
    setObservacao('');
    setCasaEditando(null);
    setModalSituacaoAberto(false);
  }

  function abrirNovaCasa() {
    limparFormulario();
    setModalAberto(true);
  }

  function abrirEditarCasa(casa: Casa) {
    setCasaEditando(casa);

    setNumero(casa.numero);
    setTipoLocalizacao(casa.tipo_localizacao ?? 'nenhuma');
    setQuadra(casa.quadra ?? '');
    setBloco(casa.bloco ?? '');

    setResponsavel(
      casa.responsavel ?? ''
    );

    setTelefone(
      casa.telefone ?? ''
    );

    setQuantidadeVeiculos(
      String(
        casa.quantidade_veiculos ?? 0
      )
    );

    setPossuiAnimais(
      casa.possui_animais ?? false
    );

    setSituacao(
      casa.situacao ?? 'ocupada'
    );

    setObservacao(
      casa.observacao ?? ''
    );

    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) {
      return;
    }

    setModalSituacaoAberto(false);
    setModalAberto(false);
    limparFormulario();
  }

  async function salvarCasa() {
    const numeroLimpo =
      numero.trim();

    const quadraLimpa =
      quadra.trim();

    const blocoLimpo =
      bloco.trim();

    const responsavelLimpo =
      responsavel.trim();

    const telefoneLimpo =
      telefone.trim();

    const observacaoLimpa =
      observacao.trim();

    if (!numeroLimpo) {
      Alert.alert(
        'Campo obrigatório',
        'Informe o número da casa.'
      );

      return;
    }

    if (tipoLocalizacao === 'quadra' && !quadraLimpa) {
      Alert.alert('Campo obrigatório', 'Informe a quadra.');
      return;
    }

    if (tipoLocalizacao === 'bloco' && !blocoLimpo) {
      Alert.alert('Campo obrigatório', 'Informe o bloco.');
      return;
    }

    if (
      quantidadeVeiculos &&
      !/^\d+$/.test(
        quantidadeVeiculos
      )
    ) {
      Alert.alert(
        'Quantidade inválida',
        'Informe apenas números na quantidade de veículos.'
      );

      return;
    }

    try {
      setSalvando(true);

      const dadosCasa = {
        numero: numeroLimpo,
        tipo_localizacao: tipoLocalizacao,
        quadra:
          tipoLocalizacao === 'quadra'
            ? quadraLimpa.toUpperCase()
            : null,
        bloco:
          tipoLocalizacao === 'bloco'
            ? blocoLimpo.toUpperCase()
            : null,

        responsavel:
          responsavelLimpo || null,

        telefone:
          telefoneLimpo || null,

        quantidade_veiculos:
          Number(
            quantidadeVeiculos || 0
          ),

        possui_animais:
          possuiAnimais,

        situacao,

        observacao:
          observacaoLimpa || null,

        ativo: true,

        atualizado_em:
          new Date().toISOString(),
      };

      if (casaEditando) {
        const { error } =
          await supabase
            .from('casas')
            .update(dadosCasa)
            .eq(
              'id',
              casaEditando.id
            );

        if (error) {
          throw error;
        }

        setModalAberto(false);
        limparFormulario();

        await carregarCasas(true);

        Alert.alert(
          'Sucesso',
          'Unidade atualizada com sucesso.'
        );
      } else {
        const { error } =
          await supabase
            .from('casas')
            .insert({
              ...dadosCasa,
            });

        if (error) {
          throw error;
        }

        setModalAberto(false);
        limparFormulario();

        await carregarCasas(true);

        Alert.alert(
          'Sucesso',
          'Unidade cadastrada com sucesso.'
        );
      }
    } catch (error: any) {
      console.error(
        'Erro ao salvar unidade:',
        error
      );

      if (error?.code === '23505') {
        Alert.alert(
          'Unidade já cadastrada',
          'Já existe uma unidade com esse número e localização.'
        );
      } else {
        Alert.alert(
          'Erro',
          error?.message ||
            'Não foi possível salvar a unidade.'
        );
      }
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExcluir(
    casa: Casa
  ) {
    Alert.alert(
      'Excluir unidade',
      `Deseja realmente excluir a Unidade ${casa.numero}${casa.tipo_localizacao === 'quadra' && casa.quadra ? ` - Quadra ${casa.quadra}` : casa.tipo_localizacao === 'bloco' && casa.bloco ? ` - Bloco ${casa.bloco}` : ''}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () =>
            excluirCasa(casa.id),
        },
      ]
    );
  }

  async function excluirCasa(
    id: string
  ) {
    try {
      setExcluindoId(id);

      const { error } =
        await supabase
          .from('casas')
          .delete()
          .eq('id', id);

      if (error) {
        throw error;
      }

      await carregarCasas(true);

      Alert.alert(
        'Sucesso',
        'Unidade excluída com sucesso.'
      );
    } catch (error: any) {
      console.error(
        'Erro ao excluir unidade:',
        error
      );

      Alert.alert(
        'Não foi possível excluir',
        error?.code === '23503'
          ? 'Esta unidade possui informações vinculadas e não pode ser excluída.'
          : error?.message ||
              'Não foi possível excluir a unidade.'
      );
    } finally {
      setExcluindoId(null);
    }
  }

  const ocupadas =
    casas.filter(
      (casa) =>
        casa.situacao === 'ocupada'
    ).length;

  const vazias =
    casas.filter(
      (casa) =>
        casa.situacao === 'vazia'
    ).length;

  const manutencao =
    casas.filter(
      (casa) =>
        casa.situacao ===
        'manutencao'
    ).length;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              Math.max(
                insets.bottom,
                20
              ) + 30,
          },
        ]}
        showsVerticalScrollIndicator={
          false
        }
        contentInsetAdjustmentBehavior="never"
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={atualizarTela}
          />
        }
      >
        {/* CABEÇALHO */}
        <View
          style={[
            styles.header,
            {
              paddingTop:
                Math.max(
                  insets.top,
                  24
                ) + 10,
            },
          ]}
        >
          <View style={styles.headerTop}>
            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                pressed &&
                  styles.pressed,
              ]}
              onPress={() =>
                navigation.goBack()
              }
            >
              <ArrowLeft
                size={20}
                color="#FFFFFF"
              />
            </Pressable>

            <View style={styles.brand}>
              <View
                style={styles.brandIcon}
              >
                <Home
                  size={19}
                  color="#FFFFFF"
                />
              </View>

              <Text
                style={styles.brandText}
              >
                Unidades
              </Text>
            </View>

            <View
              style={styles.headerSpacer}
            />
          </View>

          <Text style={styles.headerTitle}>
            Gestão de unidades
          </Text>

          <Text
            style={
              styles.headerDescription
            }
          >
            Controle as casas e a situação
            das unidades do condomínio.
          </Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.sectionTitle}>
            Visão geral
          </Text>

          <Text
            style={styles.sectionSubtitle}
          >
            Situação atual das unidades.
          </Text>

          {/* RESUMO */}
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <View
                style={styles.summaryIcon}
              >
                <Building2
                  size={18}
                  color={colors.primary}
                />
              </View>

              <Text
                style={styles.summaryNumber}
              >
                {carregando
                  ? '-'
                  : casas.length}
              </Text>

              <Text
                style={styles.summaryLabel}
              >
                Total
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <View
                style={styles.summaryIcon}
              >
                <Home
                  size={18}
                  color={colors.primary}
                />
              </View>

              <Text
                style={styles.summaryNumber}
              >
                {carregando
                  ? '-'
                  : ocupadas}
              </Text>

              <Text
                style={styles.summaryLabel}
              >
                Ocupadas
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <View
                style={styles.summaryIcon}
              >
                <Home
                  size={18}
                  color={colors.primary}
                />
              </View>

              <Text
                style={styles.summaryNumber}
              >
                {carregando
                  ? '-'
                  : vazias}
              </Text>

              <Text
                style={styles.summaryLabel}
              >
                Vazias
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <View
                style={styles.summaryIcon}
              >
                <Wrench
                  size={18}
                  color={colors.primary}
                />
              </View>

              <Text
                style={styles.summaryNumber}
              >
                {carregando
                  ? '-'
                  : manutencao}
              </Text>

              <Text
                style={styles.summaryLabel}
              >
                Manutenção
              </Text>
            </View>
          </View>

          {/* LISTA */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionText}>
              <Text
                style={styles.sectionTitle}
              >
                Unidades cadastradas
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Casas e quadras do condomínio.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                pressed &&
                  styles.pressed,
              ]}
              onPress={abrirNovaCasa}
            >
              <Plus
                size={17}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.addButtonText
                }
              >
                Nova
              </Text>
            </Pressable>
          </View>

          {carregando ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator
                size="small"
                color={colors.primary}
              />

              <Text
                style={styles.loadingText}
              >
                Carregando unidades...
              </Text>
            </View>
          ) : casas.length === 0 ? (
            <View style={styles.emptyCard}>
              <Home
                size={25}
                color={
                  colors.textSecondary
                }
              />

              <Text
                style={styles.emptyTitle}
              >
                Nenhuma unidade cadastrada
              </Text>

              <Text
                style={
                  styles.emptyDescription
                }
              >
                Toque em Nova para cadastrar
                a primeira unidade.
              </Text>
            </View>
          ) : (
            casas.map((casa) => (
              <View
                key={casa.id}
                style={styles.houseCard}
              >
                <View
                  style={styles.houseTop}
                >
                  <View
                    style={styles.houseIcon}
                  >
                    <Home
                      size={21}
                      color={
                        colors.primary
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.houseContent
                    }
                  >
                    <Text
                      style={
                        styles.houseTitle
                      }
                    >
                      Unidade {casa.numero}
                    </Text>

                    {casa.tipo_localizacao !== 'nenhuma' ? (
                      <View style={styles.locationRow}>
                        <MapPin size={12} color={colors.textSecondary} />
                        <Text style={styles.houseSubtitle}>
                          {casa.tipo_localizacao === 'quadra'
                            ? `Quadra ${casa.quadra ?? ''}`
                            : `Bloco ${casa.bloco ?? ''}`}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      casa.situacao ===
                        'ocupada' &&
                        styles.statusOccupied,

                      casa.situacao ===
                        'vazia' &&
                        styles.statusEmpty,

                      casa.situacao ===
                        'alugada' &&
                        styles.statusRented,

                      casa.situacao ===
                        'manutencao' &&
                        styles.statusMaintenance,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,

                        casa.situacao ===
                          'ocupada' &&
                          styles.statusOccupiedText,

                        casa.situacao ===
                          'vazia' &&
                          styles.statusEmptyText,

                        casa.situacao ===
                          'alugada' &&
                          styles.statusRentedText,

                        casa.situacao ===
                          'manutencao' &&
                          styles.statusMaintenanceText,
                      ]}
                    >
                      {nomeSituacao(
                        casa.situacao
                      )}
                    </Text>
                  </View>
                </View>

                {casa.responsavel ? (
                  <View
                    style={styles.infoRow}
                  >
                    <User
                      size={14}
                      color={
                        colors.textSecondary
                      }
                    />

                    <Text
                      style={styles.infoText}
                    >
                      {casa.responsavel}
                    </Text>
                  </View>
                ) : null}

                {casa.telefone ? (
                  <View
                    style={styles.infoRowSmall}
                  >
                    <Phone
                      size={14}
                      color={
                        colors.textSecondary
                      }
                    />

                    <Text
                      style={styles.infoText}
                    >
                      {casa.telefone}
                    </Text>
                  </View>
                ) : null}

                <View
                  style={styles.detailsRow}
                >
                  <View
                    style={styles.detailItem}
                  >
                    <Car
                      size={14}
                      color={
                        colors.textSecondary
                      }
                    />

                    <Text
                      style={styles.detailText}
                    >
                      {
                        casa.quantidade_veiculos
                      }{' '}
                      veículo
                      {casa.quantidade_veiculos ===
                      1
                        ? ''
                        : 's'}
                    </Text>
                  </View>

                  <View
                    style={styles.detailItem}
                  >
                    <PawPrint
                      size={14}
                      color={
                        colors.textSecondary
                      }
                    />

                    <Text
                      style={styles.detailText}
                    >
                      {casa.possui_animais
                        ? 'Possui animais'
                        : 'Sem animais'}
                    </Text>
                  </View>
                </View>

                {casa.observacao ? (
                  <Text
                    style={
                      styles.observation
                    }
                  >
                    {casa.observacao}
                  </Text>
                ) : null}

                <View
                  style={styles.actions}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.editButton,
                      pressed &&
                        styles.pressed,
                    ]}
                    onPress={() =>
                      abrirEditarCasa(casa)
                    }
                  >
                    <Edit3
                      size={16}
                      color={
                        colors.primary
                      }
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
                    style={({ pressed }) => [
                      styles.deleteButton,
                      pressed &&
                        styles.pressed,
                    ]}
                    disabled={
                      excluindoId ===
                      casa.id
                    }
                    onPress={() =>
                      confirmarExcluir(casa)
                    }
                  >
                    {excluindoId ===
                    casa.id ? (
                      <ActivityIndicator
                        size="small"
                        color={colors.danger}
                      />
                    ) : (
                      <Trash2
                        size={16}
                        color={colors.danger}
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
            ))
          )}

          <View style={styles.footer}>
            <Text
              style={styles.footerBrand}
            >
              ConectaLar
            </Text>

            <Text
              style={styles.footerText}
            >
              Gestão inteligente do seu condomínio.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* CADASTRO / EDIÇÃO */}
      <Modal
        visible={modalAberto}
        transparent
        animationType="fade"
        onRequestClose={fecharModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
            >
              <View
                style={styles.modalHeader}
              >
                <View
                  style={
                    styles.modalTitleBox
                  }
                >
                  <Text
                    style={
                      styles.modalTitle
                    }
                  >
                    {casaEditando
                      ? 'Editar unidade'
                      : 'Nova unidade'}
                  </Text>

                  <Text
                    style={
                      styles.modalSubtitle
                    }
                  >
                    Informe os dados da casa.
                  </Text>
                </View>

                <Pressable
                  style={
                    styles.closeButton
                  }
                  disabled={salvando}
                  onPress={fecharModal}
                >
                  <X
                    size={19}
                    color={
                      colors.textSecondary
                    }
                  />
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>
                Número da unidade *
              </Text>

              <TextInput
                style={styles.input}
                value={numero}
                onChangeText={setNumero}
                placeholder="Ex.: 15 ou 203"
                placeholderTextColor={colors.textLight}
                editable={!salvando}
              />

              <Text style={styles.inputLabel}>
                Tipo de localização *
              </Text>

              <Pressable
                style={styles.selectButton}
                onPress={() =>
                  setModalLocalizacaoAberto(!modalLocalizacaoAberto)
                }
              >
                <Text style={styles.selectText}>
                  {tipoLocalizacao === 'nenhuma'
                    ? 'Nenhuma'
                    : tipoLocalizacao === 'quadra'
                    ? 'Quadra'
                    : 'Bloco'}
                </Text>
                <ChevronDown size={18} color={colors.textSecondary} />
              </Pressable>

              {modalLocalizacaoAberto ? (
                <View style={styles.optionsBox}>
                  {([
                    { valor: 'nenhuma', texto: 'Nenhuma' },
                    { valor: 'quadra', texto: 'Quadra' },
                    { valor: 'bloco', texto: 'Bloco' },
                  ] as { valor: TipoLocalizacao; texto: string }[]).map((opcao) => (
                    <Pressable
                      key={opcao.valor}
                      style={styles.optionButton}
                      onPress={() => {
                        setTipoLocalizacao(opcao.valor);
                        setModalLocalizacaoAberto(false);
                        if (opcao.valor !== 'quadra') setQuadra('');
                        if (opcao.valor !== 'bloco') setBloco('');
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          tipoLocalizacao === opcao.valor && styles.optionSelected,
                        ]}
                      >
                        {opcao.texto}
                      </Text>
                      {tipoLocalizacao === opcao.valor ? (
                        <Check size={16} color={colors.primary} />
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {tipoLocalizacao === 'quadra' ? (
                <>
                  <Text style={styles.inputLabel}>Quadra *</Text>
                  <TextInput
                    style={styles.input}
                    value={quadra}
                    onChangeText={setQuadra}
                    placeholder="Ex.: B"
                    placeholderTextColor={colors.textLight}
                    editable={!salvando}
                    autoCapitalize="characters"
                  />
                </>
              ) : null}

              {tipoLocalizacao === 'bloco' ? (
                <>
                  <Text style={styles.inputLabel}>Bloco *</Text>
                  <TextInput
                    style={styles.input}
                    value={bloco}
                    onChangeText={setBloco}
                    placeholder="Ex.: A"
                    placeholderTextColor={colors.textLight}
                    editable={!salvando}
                    autoCapitalize="characters"
                  />
                </>
              ) : null}

              <Text
                style={styles.inputLabel}
              >
                Situação *
              </Text>

              <Pressable
                style={styles.selectButton}
                onPress={() =>
                  setModalSituacaoAberto(
                    !modalSituacaoAberto
                  )
                }
              >
                <Text
                  style={
                    styles.selectText
                  }
                >
                  {nomeSituacao(situacao)}
                </Text>

                <ChevronDown
                  size={18}
                  color={
                    colors.textSecondary
                  }
                />
              </Pressable>

              {modalSituacaoAberto ? (
                <View
                  style={
                    styles.optionsBox
                  }
                >
                  {situacoes.map(
                    (opcao) => (
                      <Pressable
                        key={opcao.valor}
                        style={
                          styles.optionButton
                        }
                        onPress={() => {
                          setSituacao(
                            opcao.valor
                          );

                          setModalSituacaoAberto(
                            false
                          );
                        }}
                      >
                        <Text
                          style={[
                            styles.optionText,

                            situacao ===
                              opcao.valor &&
                              styles.optionSelected,
                          ]}
                        >
                          {opcao.texto}
                        </Text>

                        {situacao ===
                        opcao.valor ? (
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

              <Text
                style={styles.inputLabel}
              >
                Responsável
              </Text>

              <TextInput
                style={styles.input}
                value={responsavel}
                onChangeText={
                  setResponsavel
                }
                placeholder="Nome do responsável"
                placeholderTextColor={
                  colors.textLight
                }
                editable={!salvando}
              />

              <Text
                style={styles.inputLabel}
              >
                Telefone
              </Text>

              <TextInput
                style={styles.input}
                value={telefone}
                onChangeText={setTelefone}
                placeholder="(81) 99999-9999"
                placeholderTextColor={
                  colors.textLight
                }
                keyboardType="phone-pad"
                editable={!salvando}
              />

              <Text
                style={styles.inputLabel}
              >
                Quantidade de veículos
              </Text>

              <TextInput
                style={styles.input}
                value={quantidadeVeiculos}
                onChangeText={
                  setQuantidadeVeiculos
                }
                placeholder="0"
                placeholderTextColor={
                  colors.textLight
                }
                keyboardType="number-pad"
                editable={!salvando}
              />

              <Text
                style={styles.inputLabel}
              >
                Possui animais?
              </Text>

              <View
                style={
                  styles.animalOptions
                }
              >
                <Pressable
                  style={[
                    styles.animalButton,

                    possuiAnimais &&
                      styles.animalSelected,
                  ]}
                  onPress={() =>
                    setPossuiAnimais(true)
                  }
                >
                  <Text
                    style={[
                      styles.animalText,

                      possuiAnimais &&
                        styles.animalSelectedText,
                    ]}
                  >
                    Sim
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.animalButton,

                    !possuiAnimais &&
                      styles.animalSelected,
                  ]}
                  onPress={() =>
                    setPossuiAnimais(false)
                  }
                >
                  <Text
                    style={[
                      styles.animalText,

                      !possuiAnimais &&
                        styles.animalSelectedText,
                    ]}
                  >
                    Não
                  </Text>
                </Pressable>
              </View>

              <Text
                style={styles.inputLabel}
              >
                Observação
              </Text>

              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                ]}
                value={observacao}
                onChangeText={
                  setObservacao
                }
                placeholder="Informações adicionais"
                placeholderTextColor={
                  colors.textLight
                }
                multiline
                editable={!salvando}
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
                  disabled={salvando}
                  onPress={fecharModal}
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
                      styles.disabled,
                  ]}
                  disabled={salvando}
                  onPress={salvarCasa}
                >
                  {salvando ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  ) : casaEditando ? (
                    <Check
                      size={17}
                      color="#FFFFFF"
                    />
                  ) : (
                    <Plus
                      size={17}
                      color="#FFFFFF"
                    />
                  )}

                  <Text
                    style={
                      styles.saveButtonText
                    }
                  >
                    {salvando
                      ? 'Salvando...'
                      : casaEditando
                      ? 'Salvar'
                      : 'Cadastrar'}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    flexGrow: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.10)',
  },

  brand: {
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

  brandText: {
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
    marginTop: 6,
    maxWidth: 330,
  },

  body: {
    paddingHorizontal: 18,
    paddingTop: 20,
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

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 14,
  },

  summaryCard: {
    width: '48.5%',
    minHeight: 90,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    padding: 11,
    marginBottom: 9,
  },

  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor:
      colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryNumber: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
    marginTop: 6,
  },

  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 1,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 13,
  },

  sectionText: {
    flex: 1,
    paddingRight: 10,
  },

  addButton: {
    height: 37,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  loadingBox: {
    minHeight: 90,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 10,
  },

  emptyCard: {
    minHeight: 110,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
  },

  emptyDescription: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 4,
  },

  houseCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 13,
    marginBottom: 11,
  },

  houseTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  houseIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor:
      colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  houseContent: {
    flex: 1,
    marginLeft: 11,
  },

  houseTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  houseSubtitle: {
    color: colors.textSecondary,
    fontSize: 9,
    marginLeft: 3,
  },

  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  statusText: {
    fontSize: 8,
    fontWeight: '800',
  },

  statusOccupied: {
    backgroundColor: '#DCFCE7',
  },

  statusOccupiedText: {
    color: '#166534',
  },

  statusEmpty: {
    backgroundColor: '#F1F5F9',
  },

  statusEmptyText: {
    color: '#475569',
  },

  statusRented: {
    backgroundColor: '#DBEAFE',
  },

  statusRentedText: {
    color: '#1D4ED8',
  },

  statusMaintenance: {
    backgroundColor: '#FEF3C7',
  },

  statusMaintenanceText: {
    color: '#92400E',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  infoRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },

  infoText: {
    color: colors.textSecondary,
    fontSize: 10,
    marginLeft: 6,
  },

  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 10,
  },

  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  detailText: {
    color: colors.textSecondary,
    fontSize: 9,
    marginLeft: 5,
  },

  observation: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 10,
  },

  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },

  editButton: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    backgroundColor:
      colors.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  editText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },

  deleteButton: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    backgroundColor:
      colors.dangerLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  deleteText: {
    color: colors.danger,
    fontSize: 10,
    fontWeight: '800',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 30,
  },

  modalCard: {
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  modalTitleBox: {
    flex: 1,
    paddingRight: 10,
  },

  modalTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
  },

  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 3,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor:
      colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  formRow: {
    flexDirection: 'row',
    gap: 10,
  },

  formField: {
    flex: 1,
  },

  inputLabel: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 8,
  },

  input: {
    minHeight: 45,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor:
      colors.background,
    paddingHorizontal: 12,
    color: colors.text,
    fontSize: 12,
  },

  selectButton: {
    minHeight: 45,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor:
      colors.background,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectText: {
    color: colors.text,
    fontSize: 12,
  },

  optionsBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginTop: 5,
    overflow: 'hidden',
  },

  optionButton: {
    minHeight: 42,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  optionText: {
    color: colors.textSecondary,
    fontSize: 11,
  },

  optionSelected: {
    color: colors.primary,
    fontWeight: '800',
  },

  animalOptions: {
    flexDirection: 'row',
    gap: 9,
  },

  animalButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor:
      colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  animalSelected: {
    backgroundColor:
      colors.primaryLight,
    borderColor: colors.primary,
  },

  animalText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },

  animalSelectedText: {
    color: colors.primary,
  },

  textArea: {
    minHeight: 72,
    paddingTop: 12,
    textAlignVertical: 'top',
  },

  modalActions: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 20,
  },

  cancelButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },

  saveButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  footer: {
    alignItems: 'center',
    paddingTop: 17,
    paddingBottom: 5,
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

  disabled: {
    opacity: 0.55,
  },

  pressed: {
    opacity: 0.72,
  },
});