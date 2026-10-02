import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ChevronRight,
  Home,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react-native';

import { colors } from '../../theme/theme';
import { supabase } from '../../services/supabase';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'MoradoresAdmin'
>;

type Morador = {
  id: string;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  casa: string | null;
  quadra: string | null;
  tipo: 'morador';
  ativo: boolean;
  criado_em: string;
};

export default function MoradoresAdminScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  const [pesquisa, setPesquisa] = useState('');
  const [moradores, setMoradores] = useState<Morador[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState('');
  const [excluindoMorador, setExcluindoMorador] = useState<string | null>(null);

  const carregarMoradores = useCallback(
    async (mostrarCarregamento = true) => {
      try {
        setErro('');

        if (mostrarCarregamento) {
          setCarregando(true);
        }

        const { data, error } = await supabase
          .from('perfis')
          .select(`
            id,
            nome,
            cpf,
            telefone,
            casa,
            quadra,
            tipo,
            ativo,
            criado_em
          `)
          .eq('tipo', 'morador')
          .order('nome', { ascending: true });

        if (error) {
          console.error('Erro ao carregar moradores:', error);
          setErro('Não foi possível carregar os moradores.');
          return;
        }

        setMoradores((data ?? []) as Morador[]);
      } catch (error) {
        console.error('Erro ao carregar moradores:', error);
        setErro('Não foi possível carregar os moradores.');
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

  async function atualizarLista() {
    setAtualizando(true);
    await carregarMoradores(false);
  }

  function confirmarExcluirMorador(morador: Morador) {
    Alert.alert(
      'Excluir morador',
      `Deseja realmente excluir ${morador.nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => excluirMorador(morador.id),
        },
      ]
    );
  }

  async function excluirMorador(moradorId: string) {
    try {
      setExcluindoMorador(moradorId);
      const { error } = await supabase
        .from('perfis')
        .delete()
        .eq('id', moradorId)
        .eq('tipo', 'morador');
      if (error) throw error;
      setMoradores((lista) => lista.filter((item) => item.id !== moradorId));
      Alert.alert('Sucesso', 'Morador excluído com sucesso.');
    } catch (error: any) {
      console.error('Erro ao excluir morador:', error);
      Alert.alert(
        'Não foi possível excluir',
        error?.code === '23503'
          ? 'Este morador possui dados vinculados, como reservas. Exclua os registros vinculados primeiro.'
          : error?.message || 'Não foi possível excluir o morador.'
      );
    } finally {
      setExcluindoMorador(null);
    }
  }

  const moradoresFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    if (!termo) {
      return moradores;
    }

    const somenteNumeros = termo.replace(/\D/g, '');

    return moradores.filter((morador) => {
      const nome = morador.nome?.toLowerCase() ?? '';
      const cpf = morador.cpf?.toLowerCase() ?? '';
      const cpfNumeros = morador.cpf?.replace(/\D/g, '') ?? '';
      const telefone = morador.telefone?.toLowerCase() ?? '';
      const casa = morador.casa?.toLowerCase() ?? '';
      const quadra = morador.quadra?.toLowerCase() ?? '';

      return (
        nome.includes(termo) ||
        cpf.includes(termo) ||
        telefone.includes(termo) ||
        casa.includes(termo) ||
        quadra.includes(termo) ||
        (somenteNumeros.length > 0 &&
          cpfNumeros.includes(somenteNumeros))
      );
    });
  }, [moradores, pesquisa]);

  const moradoresAtivos = moradores.filter(
    (morador) => morador.ativo
  ).length;

  function formatarCPF(cpf: string | null) {
    if (!cpf) {
      return 'CPF não informado';
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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 14),
            paddingBottom: Math.max(insets.bottom, 18) + 20,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={atualizarLista}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={21} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerLabel}>
              ADMINISTRAÇÃO
            </Text>

            <Text style={styles.headerTitle}>
              Moradores
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Users size={22} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.intro}>
          <Text style={styles.title}>
            Gestão de moradores
          </Text>

          <Text style={styles.subtitle}>
            Gerencie os moradores cadastrados e suas unidades
            residenciais.
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <ShieldCheck
              size={22}
              color={colors.primary}
            />
          </View>

          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>
              MORADORES CADASTRADOS
            </Text>

            <Text style={styles.summaryNumber}>
              {carregando ? '—' : moradores.length}
            </Text>

            <Text style={styles.summaryDescription}>
              {carregando
                ? 'Carregando moradores...'
                : `${moradoresAtivos} ${
                    moradoresAtivos === 1
                      ? 'morador ativo'
                      : 'moradores ativos'
                  }`}
            </Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Search
            size={19}
            color={colors.textSecondary}
          />

          <TextInput
            style={styles.searchInput}
            value={pesquisa}
            onChangeText={setPesquisa}
            placeholder="Pesquisar nome, CPF, casa ou quadra..."
            placeholderTextColor={colors.textLight}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
          ]}
          onPress={() => navigation.navigate('NovoMorador')}
        >
          <View style={styles.addIcon}>
            <Plus
              size={20}
              color={colors.primary}
              strokeWidth={2.5}
            />
          </View>

          <View style={styles.addContent}>
            <Text style={styles.addTitle}>
              Novo morador
            </Text>

            <Text style={styles.addDescription}>
              Cadastrar um novo morador
            </Text>
          </View>

          <ChevronRight
            size={20}
            color="#FFFFFF"
          />
        </Pressable>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Moradores
            </Text>

            <Text style={styles.sectionSubtitle}>
              Lista de moradores cadastrados
            </Text>
          </View>

          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {carregando ? '—' : moradoresFiltrados.length}
            </Text>
          </View>
        </View>

        {carregando ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />

            <Text style={styles.loadingTitle}>
              Carregando moradores
            </Text>

            <Text style={styles.loadingDescription}>
              Aguarde enquanto buscamos os dados do condomínio.
            </Text>
          </View>
        ) : erro ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>
              Não foi possível carregar
            </Text>

            <Text style={styles.errorDescription}>
              {erro}
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.pressed,
              ]}
              onPress={() => carregarMoradores()}
            >
              <Text style={styles.retryButtonText}>
                Tentar novamente
              </Text>
            </Pressable>
          </View>
        ) : moradoresFiltrados.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <UserRound
                size={28}
                color={colors.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              {pesquisa
                ? 'Nenhum resultado encontrado'
                : 'Nenhum morador cadastrado'}
            </Text>

            <Text style={styles.emptyDescription}>
              {pesquisa
                ? 'Tente pesquisar usando outro nome, CPF, casa ou quadra.'
                : 'Quando um morador for cadastrado, ele aparecerá nesta lista.'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {moradoresFiltrados.map((morador) => (
              <View
                key={morador.id}
                style={styles.residentCard}
              >
                <View style={styles.residentTop}>
                  <View style={styles.avatar}>
                    <UserRound
                      size={21}
                      color={colors.primary}
                    />
                  </View>

                  <View style={styles.residentMain}>
                    <Text
                      style={styles.residentName}
                      numberOfLines={1}
                    >
                      {morador.nome}
                    </Text>

                    <Text style={styles.residentCpf}>
                      {formatarCPF(morador.cpf)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      morador.ativo
                        ? styles.statusActive
                        : styles.statusInactive,
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        morador.ativo
                          ? styles.statusDotActive
                          : styles.statusDotInactive,
                      ]}
                    />

                    <Text
                      style={[
                        styles.statusText,
                        morador.ativo
                          ? styles.statusTextActive
                          : styles.statusTextInactive,
                      ]}
                    >
                      {morador.ativo ? 'Ativo' : 'Inativo'}
                    </Text>
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.deleteButton,
                      pressed && styles.pressed,
                    ]}
                    disabled={excluindoMorador === morador.id}
                    onPress={() => confirmarExcluirMorador(morador)}
                  >
                    {excluindoMorador === morador.id ? (
                      <ActivityIndicator size="small" color={colors.danger} />
                    ) : (
                      <Trash2 size={17} color={colors.danger} />
                    )}
                  </Pressable>
                </View>

                <View style={styles.residentDivider} />

                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Home
                      size={15}
                      color={colors.textSecondary}
                    />

                    <View style={styles.detailText}>
                      <Text style={styles.detailLabel}>
                        CASA
                      </Text>

                      <Text style={styles.detailValue}>
                        {morador.casa || 'Não informada'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <Home
                      size={15}
                      color={colors.textSecondary}
                    />

                    <View style={styles.detailText}>
                      <Text style={styles.detailLabel}>
                        QUADRA
                      </Text>

                      <Text style={styles.detailValue}>
                        {morador.quadra || 'Não informada'}
                      </Text>
                    </View>
                  </View>
                </View>

                {morador.telefone ? (
                  <View style={styles.phoneRow}>
                    <Phone
                      size={14}
                      color={colors.textSecondary}
                    />

                    <Text style={styles.phoneText}>
                      {morador.telefone}
                    </Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Home
              size={19}
              color={colors.primary}
            />
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              Casas e quadras
            </Text>

            <Text style={styles.infoDescription}>
              Cada morador pode ser associado à sua casa e
              quadra dentro do condomínio.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>
            ConectaLar
          </Text>

          <Text style={styles.footerText}>
            Gestão segura do condomínio
          </Text>
        </View>
      </ScrollView>
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
  },

  content: {
    flexGrow: 1,
  },

  header: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    marginHorizontal: 16,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerCenter: {
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
    fontSize: 21,
    fontWeight: '800',
    marginTop: 2,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  intro: {
    paddingHorizontal: 20,
    marginTop: 24,
  },

  title: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.4,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
    maxWidth: 350,
  },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 18,
    marginHorizontal: 20,
    marginTop: 18,
    padding: 15,
  },

  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryContent: {
    flex: 1,
    marginLeft: 13,
  },

  summaryLabel: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  summaryNumber: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 1,
  },

  summaryDescription: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },

  searchContainer: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 14,
  },

  searchInput: {
    flex: 1,
    height: '100%',
    color: colors.text,
    fontSize: 12,
    marginLeft: 10,
  },

  addButton: {
    minHeight: 67,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 17,
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },

  addButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },

  addIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addContent: {
    flex: 1,
    marginLeft: 12,
  },

  addTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  addDescription: {
    color: '#DBEAFE',
    fontSize: 10,
    marginTop: 2,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 26,
    marginBottom: 12,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },

  counter: {
    minWidth: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  counterText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },

  loadingCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    marginHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },

  loadingTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 12,
  },

  loadingDescription: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 3,
  },

  errorCard: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 18,
    marginHorizontal: 20,
    padding: 20,
    alignItems: 'center',
  },

  errorTitle: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800',
  },

  errorDescription: {
    color: '#B91C1C',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },

  retryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 13,
  },

  retryButtonText: {
    color: colors.danger,
    fontSize: 10,
    fontWeight: '800',
  },

  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    marginHorizontal: 20,
    paddingHorizontal: 22,
    paddingVertical: 24,
    alignItems: 'center',
  },

  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 13,
    textAlign: 'center',
  },

  emptyDescription: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 270,
  },

  list: {
    marginHorizontal: 20,
  },

  residentCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    padding: 14,
    marginBottom: 10,
  },

  residentTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  residentMain: {
    flex: 1,
    marginLeft: 11,
    paddingRight: 6,
  },

  residentName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },

  residentCpf: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 3,
  },

  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  statusActive: {
    backgroundColor: colors.successLight,
  },

  statusInactive: {
    backgroundColor: colors.dangerLight,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  statusDotActive: {
    backgroundColor: colors.success,
  },

  statusDotInactive: {
    backgroundColor: colors.danger,
  },

  statusText: {
    fontSize: 8,
    fontWeight: '800',
  },

  statusTextActive: {
    color: colors.success,
  },

  statusTextInactive: {
    color: colors.danger,
  },

  residentDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 11,
  },

  detailsRow: {
    flexDirection: 'row',
  },

  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  detailText: {
    marginLeft: 7,
  },

  detailLabel: {
    color: colors.textLight,
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  detailValue: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },

  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 11,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  phoneText: {
    color: colors.textSecondary,
    fontSize: 9,
    marginLeft: 7,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 14,
    padding: 13,
  },

  infoIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoContent: {
    flex: 1,
    marginLeft: 11,
  },

  infoTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },

  infoDescription: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 2,
  },

  footer: {
    alignItems: 'center',
    paddingTop: 22,
  },

  footerBrand: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
  },

  footerText: {
    color: colors.textLight,
    fontSize: 8,
    marginTop: 2,
  },

  pressed: {
    opacity: 0.75,
  },
});