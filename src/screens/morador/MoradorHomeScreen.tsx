
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
  CalendarDays,
  ChevronRight,
  Clock,
  FileText,
  Home,
  LogOut,
  Megaphone,
  MessageCircle,
  Settings,
  TriangleAlert,
  UserRound,
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
  'MoradorHome'
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

export default function MoradorHomeScreen() {
  const insets = useSafeAreaInsets();

  const navigation = useNavigation<NavigationProp>();

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

      const perfilAtual = await obterPerfilAtual();

      if (!perfilAtual) {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'Welcome',
            },
          ],
        });

        return;
      }

      setPerfil(perfilAtual);
    } catch (error) {
      console.error(
        'Erro ao carregar perfil do morador:',
        error
      );
    } finally {
      setCarregandoPerfil(false);
    }
  }

  function confirmarSaida() {
    Alert.alert(
      'Sair da conta',
      'Deseja realmente sair da sua conta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: realizarLogout,
        },
      ]
    );
  }

  async function realizarLogout() {
    if (saindo) {
      return;
    }

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
        routes: [
          {
            name: 'Welcome',
          },
        ],
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

  function recursoEmBreve(recurso: string) {
    Alert.alert(
      recurso,
      'Essa funcionalidade será adicionada na próxima etapa.'
    );
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
              onPress={() =>
                recursoEmBreve('Notificações')
              }
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
                OLÁ,
              </Text>

              <Text
                style={styles.userName}
                numberOfLines={1}
              >
                {carregandoPerfil
                  ? 'Carregando...'
                  : perfil?.nome || 'Morador'}
              </Text>

              <Text
                style={styles.headerDescription}
              >
                Acompanhe tudo sobre o seu
                condomínio em um só lugar.
              </Text>
            </View>

            <View style={styles.profileBadge}>
              {carregandoPerfil ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <UserRound
                  size={29}
                  color="#FFFFFF"
                />
              )}
            </View>
          </View>

          {!carregandoPerfil && perfil ? (
            <View style={styles.roleBadge}>
              <UserRound
                size={13}
                color="#BFDBFE"
              />

              <Text style={styles.roleText}>
                Morador
              </Text>
            </View>
          ) : null}
        </View>

        {/* CONTEÚDO */}

        <View style={styles.body}>
          <View style={styles.accessCard}>
            <View style={styles.accessIcon}>
              <Home
                size={24}
                color={colors.primary}
              />
            </View>

            <View style={styles.accessContent}>
              <Text style={styles.accessLabel}>
                ÁREA DO MORADOR
              </Text>

              <Text style={styles.accessTitle}>
                Bem-vindo ao ConectaLar
              </Text>

              <Text style={styles.accessDescription}>
                Serviços e informações do seu condomínio.
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
              Meu Condomínio
            </Text>

            <Text style={styles.sectionSubtitle}>
              Acesse as principais funcionalidades.
            </Text>
          </View>

          <View style={styles.grid}>
            <MenuCard
              titulo="Reservas"
              descricao="Churrasqueira e salão"
              onPress={() =>
                recursoEmBreve('Reservas')
              }
              icone={
                <CalendarDays
                  size={23}
                  color={colors.primary}
                />
              }
            />

            <MenuCard
              titulo="Comunicados"
              descricao="Avisos do condomínio"
              onPress={() =>
                recursoEmBreve('Comunicados')
              }
              icone={
                <Megaphone
                  size={23}
                  color={colors.primary}
                />
              }
            />

            <MenuCard
              titulo="Ocorrências"
              descricao="Reclamações e solicitações"
              onPress={() =>
                recursoEmBreve('Ocorrências')
              }
              icone={
                <TriangleAlert
                  size={23}
                  color={colors.primary}
                />
              }
            />

            {/* CHAT - ROTA MOBILE AINDA NÃO CADASTRADA */}

            <MenuCard
              titulo="Chat"
              descricao="Fale com a administração"
              onPress={() =>
                recursoEmBreve('Chat')
              }
              icone={
                <MessageCircle
                  size={23}
                  color={colors.primary}
                />
              }
            />

            {/* CHAT GERAL - ROTA MOBILE AINDA NÃO CADASTRADA */}

            <MenuCard
              titulo="Chat Geral"
              descricao="Converse com todos do condomínio"
              onPress={() =>
                recursoEmBreve('Chat Geral')
              }
              icone={
                <MessageCircle
                  size={23}
                  color={colors.primary}
                />
              }
            />

            {/* REGRAS - ROTA MOBILE AINDA NÃO CADASTRADA */}

            <MenuCard
              titulo="Regras"
              descricao="Regras do condomínio"
              onPress={() =>
                recursoEmBreve('Regras')
              }
              icone={
                <FileText
                  size={23}
                  color={colors.primary}
                />
              }
            />

            <MenuCard
              titulo="Horários"
              descricao="Serviços e funcionamento"
              onPress={() =>
                recursoEmBreve('Horários')
              }
              icone={
                <Clock
                  size={23}
                  color={colors.primary}
                />
              }
            />

            <MenuCard
              titulo="Notificações"
              descricao="Avisos e novidades"
              onPress={() =>
                recursoEmBreve('Notificações')
              }
              icone={
                <Bell
                  size={23}
                  color={colors.primary}
                />
              }
            />

            <MenuCard
              titulo="Meu perfil"
              descricao="Dados da sua conta"
              onPress={() =>
                recursoEmBreve('Meu perfil')
              }
              icone={
                <Settings
                  size={23}
                  color={colors.primary}
                />
              }
            />
          </View>

          <View style={styles.divider} />

          <Text style={styles.quickActions}>
            CONTA
          </Text>

          {/* SAIR */}

          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && !saindo && styles.logoutPressed,
              saindo && styles.logoutDisabled,
            ]}
            onPress={confirmarSaida}
            disabled={saindo}
          >
            <View style={styles.logoutIcon}>
              {saindo ? (
                <ActivityIndicator
                  size="small"
                  color={colors.danger}
                />
              ) : (
                <LogOut
                  size={22}
                  color={colors.danger}
                />
              )}
            </View>

            <View style={styles.logoutContent}>
              <Text style={styles.logoutTitle}>
                {saindo
                  ? 'Saindo...'
                  : 'Sair da conta'}
              </Text>

              <Text style={styles.logoutDescription}>
                Encerrar sua sessão
              </Text>
            </View>

            {!saindo ? (
              <ChevronRight
                size={20}
                color={colors.danger}
              />
            ) : null}
          </Pressable>

          {/* RODAPÉ */}

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>
              ConectaLar
            </Text>

            <Text style={styles.footerText}>
              Seu condomínio mais conectado.
            </Text>
          </View>
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
    backgroundColor: colors.background,
  },

  scrollContent: {
    flexGrow: 1,
  },

  header: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 20,
    paddingBottom: 26,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
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
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    right: 8,
    top: 8,
  },

  headerPressed: {
    opacity: 0.75,
  },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
  },

  profileText: {
    flex: 1,
    paddingRight: 15,
  },

  welcomeLabel: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },

  userName: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
    marginTop: 4,
  },

  headerDescription: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
    maxWidth: 270,
  },

  profileBadge: {
    width: 58,
    height: 58,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  roleBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59,130,246,0.20)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 13,
  },

  roleText: {
    color: '#DBEAFE',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 5,
  },

  body: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },

  accessCard: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 19,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  accessIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  accessContent: {
    flex: 1,
    marginLeft: 12,
  },

  accessLabel: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  accessTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },

  accessDescription: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },

  accessArrow: {
    width: 31,
    height: 31,
    borderRadius: 11,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionHeader: {
    marginTop: 24,
    marginBottom: 13,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  menuCard: {
    width: '48.5%',
    minHeight: 116,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 13,
    marginBottom: 11,
  },

  menuTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  menuIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrowCircle: {
    width: 27,
    height: 27,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 10,
  },

  menuDescription: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },

  cardPressed: {
    opacity: 0.7,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 8,
    marginBottom: 15,
  },

  quickActions: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 9,
  },

  logoutButton: {
    minHeight: 65,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 17,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },

  logoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutContent: {
    flex: 1,
    marginLeft: 11,
  },

  logoutTitle: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800',
  },

  logoutDescription: {
    color: '#B91C1C',
    fontSize: 9,
    marginTop: 2,
  },

  logoutPressed: {
    opacity: 0.75,
  },

  logoutDisabled: {
    opacity: 0.6,
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
});
