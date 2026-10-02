import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Home,
  LogOut,
  Megaphone,
  MessageCircle,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react-native';

import { colors } from '../../theme/theme';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

import {
  obterPerfilAtual,
  PerfilUsuario,
  sair,
} from '../../services/authService';

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'AdminHome'
>;

type MenuCardProps = {
  titulo: string;
  descricao: string;
  icone: React.ReactNode;
  onPress?: () => void;
};

function MenuCard({
  titulo,
  descricao,
  icone,
  onPress,
}: MenuCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuCard,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.menuTop}>
        <View style={styles.menuIcon}>
          {icone}
        </View>

        <View style={styles.arrowCircle}>
          <ChevronRight
            size={17}
            color={colors.textSecondary}
          />
        </View>
      </View>

      <Text style={styles.menuTitle}>
        {titulo}
      </Text>

      <Text
        style={styles.menuDescription}
        numberOfLines={2}
      >
        {descricao}
      </Text>
    </Pressable>
  );
}

export default function AdminHomeScreen() {
  const insets = useSafeAreaInsets();

  const navigation =
    useNavigation<NavigationProp>();

  const [perfil, setPerfil] =
    useState<PerfilUsuario | null>(null);

  const [carregandoPerfil, setCarregandoPerfil] =
    useState(true);

  const [saindo, setSaindo] =
    useState(false);

  useEffect(() => {
    carregarPerfil();
  }, []);

  async function carregarPerfil() {
    try {
      setCarregandoPerfil(true);

      const perfilAtual =
        await obterPerfilAtual();

      if (!perfilAtual) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        });

        return;
      }

      setPerfil(perfilAtual);
    } catch (error) {
      console.error(
        'Erro ao carregar perfil:',
        error
      );
    } finally {
      setCarregandoPerfil(false);
    }
  }

  function obterCargo() {
    switch (perfil?.tipo) {
      case 'admin':
        return 'Administrador';

      case 'sindico':
        return 'Síndico';

      case 'subsindico':
        return 'Subsíndico';

      default:
        return '';
    }
  }

  function confirmarSaida() {
    Alert.alert(
      'Sair da conta',
      'Deseja realmente encerrar sua sessão administrativa?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: executarSaida,
        },
      ]
    );
  }

  async function executarSaida() {
    try {
      setSaindo(true);

      const sucesso = await sair();

      if (!sucesso) {
        Alert.alert(
          'Erro',
          'Não foi possível sair da conta.'
        );

        return;
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch (error) {
      console.error(
        'Erro durante logout:',
        error
      );

      Alert.alert(
        'Erro',
        'Não foi possível sair da conta.'
      );
    } finally {
      setSaindo(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              Math.max(insets.bottom, 20) + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
      >
        {/* CABEÇALHO */}
        <View
          style={[
            styles.header,
            {
              paddingTop:
                Math.max(insets.top, 24) + 10,
            },
          ]}
        >
          <View style={styles.headerTop}>
            <View style={styles.brandRow}>
              <View style={styles.brandIcon}>
                <Home
                  size={20}
                  color="#FFFFFF"
                  strokeWidth={2.5}
                />
              </View>

              <Text style={styles.brand}>
                ConectaLar
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.notificationButton,
                pressed && styles.headerPressed,
              ]}
            >
              <Bell
                size={20}
                color="#FFFFFF"
              />

              <View
                style={styles.notificationDot}
              />
            </Pressable>
          </View>

          <View style={styles.profileHeader}>
            <View style={styles.profileText}>
              <Text style={styles.welcomeLabel}>
                BEM-VINDO,
              </Text>

              <Text
                style={styles.userName}
                numberOfLines={1}
              >
                {carregandoPerfil
                  ? 'Carregando...'
                  : perfil?.nome ||
                    'Administrador'}
              </Text>

              <Text
                style={styles.headerDescription}
              >
                Gerencie seu condomínio de forma
                simples, segura e organizada.
              </Text>
            </View>

            <View style={styles.profileBadge}>
              {carregandoPerfil ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <ShieldCheck
                  size={29}
                  color="#FFFFFF"
                />
              )}
            </View>
          </View>

          {!carregandoPerfil && perfil ? (
            <View style={styles.roleBadge}>
              <ShieldCheck
                size={13}
                color="#BFDBFE"
              />

              <Text style={styles.roleText}>
                {obterCargo()}
              </Text>
            </View>
          ) : null}
        </View>

        {/* CONTEÚDO PRINCIPAL */}
        <View style={styles.body}>
          <View style={styles.accessCard}>
            <View style={styles.accessIcon}>
              <ShieldCheck
                size={24}
                color={colors.primary}
              />
            </View>

            <View style={styles.accessContent}>
              <Text style={styles.accessLabel}>
                ACESSO AUTORIZADO
              </Text>

              <Text style={styles.accessTitle}>
                Área administrativa
              </Text>

              <Text
                style={styles.accessDescription}
              >
                Ambiente protegido e seguro.
              </Text>
            </View>

            <View style={styles.accessArrow}>
              <ChevronRight
                size={18}
                color={colors.primary}
              />
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Gestão do Condomínio
            </Text>

            <Text style={styles.sectionSubtitle}>
              Acesse as principais funcionalidades.
            </Text>
          </View>

          <View style={styles.grid}>
            {/* MORADORES */}
            <MenuCard
              titulo="Moradores"
              descricao="Cadastros e unidades"
              onPress={() =>
                navigation.navigate(
                  'MoradoresAdmin'
                )
              }
              icone={
                <Users
                  size={23}
                  color={colors.primary}
                />
              }
            />

            {/* CASAS */}
            <MenuCard
              titulo="Casas"
              descricao="Casas e quadras"
              onPress={() =>
                navigation.navigate(
                  'CasasAdmin'
                )
              }
              icone={
                <Home
                  size={23}
                  color={colors.primary}
                />
              }
            />

            {/* RESERVAS */}
            <MenuCard
              titulo="Reservas"
              descricao="Áreas e horários"
              onPress={() =>
                navigation.navigate(
                  'ReservasAdmin'
                )
              }
              icone={
                <CalendarDays
                  size={23}
                  color={colors.primary}
                />
              }
            />

            {/* COMUNICADOS */}
            <MenuCard
              titulo="Comunicados"
              descricao="Avisos aos moradores"
              onPress={() =>
                navigation.navigate(
                  'ComunicadosAdmin'
                )
              }
              icone={
                <Megaphone
                  size={23}
                  color={colors.primary}
                />
              }
            />

            {/* OCORRÊNCIAS */}
            <MenuCard
              titulo="Ocorrências"
              descricao="Solicitações"
              onPress={() =>
                navigation.navigate(
                  'OcorrenciasAdmin'
                )
              }
              icone={
                <Bell
                  size={23}
                  color={colors.primary}
                />
              }
            />

            {/* ADMINISTRAÇÃO */}
            <MenuCard
              titulo="Administração"
              descricao="Gestão e permissões"
              onPress={() =>
                navigation.navigate(
                  'AdministracaoAdmin'
                )
              }
              icone={
                <Settings
                  size={23}
                  color={colors.primary}
                />
              }
            />

            {/* CHAT */}
            <MenuCard
              titulo="Chat"
              descricao="Conversas com moradores"
              onPress={() =>
                navigation.navigate(
                  'ChatAdmin'
                )
              }
              icone={
                <MessageCircle
                  size={23}
                  color={colors.primary}
                />
              }
            />

            {/* CHAT GERAL */}
            <MenuCard
              titulo="Chat Geral"
              descricao="Conversa com todos os moradores"
              onPress={() =>
                navigation.navigate(
                  'ChatGeralAdmin'
                )
              }
              icone={
                <Users
                  size={23}
                  color={colors.primary}
                />
              }
            />

            {/* REGRAS */}
            <MenuCard
              titulo="Regras"
              descricao="Regras do condomínio"
              onPress={() =>
                navigation.navigate(
                  'RegrasAdmin'
                )
              }
              icone={
                <BookOpen
                  size={23}
                  color={colors.primary}
                />
              }
            />
          </View>

          <View style={styles.divider} />

          <Text style={styles.quickActions}>
            AÇÕES RÁPIDAS
          </Text>

          {/* LOGOUT */}
          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              pressed &&
                !saindo &&
                styles.logoutPressed,
              saindo &&
                styles.logoutDisabled,
            ]}
            onPress={confirmarSaida}
            disabled={saindo}
          >
            <View style={styles.logoutIcon}>
              {saindo ? (
                <ActivityIndicator
                  size="small"
                  color="#DC2626"
                />
              ) : (
                <LogOut
                  size={20}
                  color="#DC2626"
                />
              )}
            </View>

            <View style={styles.logoutContent}>
              <Text style={styles.logoutTitle}>
                {saindo
                  ? 'Saindo...'
                  : 'Sair da conta'}
              </Text>

              <Text
                style={styles.logoutDescription}
              >
                Encerrar sessão administrativa
              </Text>
            </View>

            <ChevronRight
              size={18}
              color="#DC2626"
            />
          </Pressable>

          <Text style={styles.footer}>
            ConectaLar • Administração
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

  scrollContent: {
    flexGrow: 1,
  },

  header: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 18,
    paddingBottom: 28,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  brand: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 10,
  },

  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor:
      'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
  },

  headerPressed: {
    opacity: 0.72,
  },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
  },

  profileText: {
    flex: 1,
    paddingRight: 16,
  },

  welcomeLabel: {
    color: '#93C5FD',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
  },

  userName: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
    marginTop: 3,
  },

  headerDescription: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
    maxWidth: 280,
  },

  profileBadge: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor:
      'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  roleBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      'rgba(59,130,246,0.18)',
    borderWidth: 1,
    borderColor:
      'rgba(147,197,253,0.20)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 14,
  },

  roleText: {
    color: '#DBEAFE',
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 5,
  },

  body: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },

  accessCard: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  accessIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  accessContent: {
    flex: 1,
    marginLeft: 12,
  },

  accessLabel: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },

  accessTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },

  accessDescription: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 2,
  },

  accessArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionHeader: {
    marginTop: 24,
    marginBottom: 14,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 3,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  menuCard: {
    width: '48.5%',
    minHeight: 138,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 11,
  },

  cardPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },

  menuTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 14,
  },

  menuDescription: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 14,
    marginBottom: 18,
  },

  quickActions: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  logoutButton: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 17,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },

  logoutPressed: {
    opacity: 0.7,
  },

  logoutDisabled: {
    opacity: 0.6,
  },

  logoutIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutContent: {
    flex: 1,
    marginLeft: 11,
  },

  logoutTitle: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '800',
  },

  logoutDescription: {
    color: '#991B1B',
    fontSize: 9,
    marginTop: 2,
    opacity: 0.72,
  },

  footer: {
    color: colors.textSecondary,
    fontSize: 8,
    textAlign: 'center',
    marginTop: 22,
    marginBottom: 4,
  },
});