import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  Bell,
  BookOpen,
  CalendarDays,
  Clock3,
  Home,
  MessageCircle,
  MessagesSquare,
  ShieldAlert,
  User,
} from 'lucide-react-native';

import type { AuthStackParamList } from '../../../navigation/AuthNavigator';

import { colors } from '../../../theme/theme';

import { supabase } from '../../../services/supabase';

import WebMoradorSidebar from '../../../components/WebMoradorSidebar';
import WebLayout from '../../../components/WebLayout';

type NavigationProp =
  NativeStackNavigationProp<AuthStackParamList>;

type PerfilMorador = {
  id: string;
  nome: string;
  email?: string | null;
  casa: string | null;
  quadra: string | null;
  tipo: string;
};

type CardMenuProps = {
  titulo: string;
  descricao: string;
  icon: React.ReactNode;
  onPress: () => void;
  isMobile: boolean;
};

function CardMenu({
  titulo,
  descricao,
  icon,
  onPress,
  isMobile,
}: CardMenuProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuCard,
        isMobile && styles.menuCardMobile,
        pressed && styles.menuCardPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.menuIcon}>
        {icon}
      </View>

      <View style={styles.menuTextArea}>
        <Text style={styles.menuTitle}>
          {titulo}
        </Text>

        <Text style={styles.menuDescription}>
          {descricao}
        </Text>
      </View>

      <Text style={styles.arrow}>
        ›
      </Text>
    </Pressable>
  );
}

export default function WebMoradorHomeScreen() {
  const { width } = useWindowDimensions();

  const isMobile = width < 768;

  const navigation =
    useNavigation<NavigationProp>();

  const [perfil, setPerfil] =
    useState<PerfilMorador | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  useEffect(() => {
    carregarPerfil();
  }, []);

  async function carregarPerfil() {
    try {
      setCarregando(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        navigation.replace('WebLogin');
        return;
      }

      const { data, error } =
        await supabase
          .from('perfis')
          .select(`
            id,
            nome,
            casa,
            quadra,
            tipo
          `)
          .eq('id', user.id)
          .single();

      if (error) {
        throw error;
      }

      if (
        !data ||
        data.tipo !== 'morador'
      ) {
        await supabase.auth.signOut();

        navigation.replace(
          'WebLogin'
        );

        return;
      }

      setPerfil({
        ...data,
        email: user.email ?? null,
      });
    } catch (error) {
      console.error(
        'Erro ao carregar perfil do morador:',
        error
      );
    } finally {
      setCarregando(false);
    }
  }

  function navegar(
    rota:
      | 'WebMoradorReservas'
      | 'WebMoradorComunicados'
      | 'WebMoradorOcorrencias'
      | 'WebMoradorChat'
      | 'WebMoradorChatGeral'
      | 'WebMoradorRegras'
      | 'WebMoradorHorarios'
      | 'WebMoradorNotificacoes'
      | 'WebMoradorPerfil'
  ) {
    navigation.navigate(rota);
  }

  if (carregando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text style={styles.loadingText}>
          Carregando sua área...
        </Text>
      </View>
    );
  }

  return (
    <WebLayout
      sidebar={
        <WebMoradorSidebar active="inicio" />
      }
    >
      {/* CABEÇALHO */}

      <View
        style={[
          styles.header,
          isMobile && styles.headerMobile,
        ]}
      >
        <View
          style={[
            styles.headerTextArea,
            isMobile && styles.headerTextAreaMobile,
          ]}
        >
          <Text
            style={[
              styles.welcome,
              isMobile && styles.welcomeMobile,
            ]}
          >
            Olá,{' '}
            {perfil?.nome?.split(' ')[0] ||
              'morador'}
            !
          </Text>

          <Text style={styles.headerDescription}>
            Bem-vindo à sua área do condomínio.
          </Text>
        </View>

        <View
          style={[
            styles.residenceCard,
            isMobile && styles.residenceCardMobile,
          ]}
        >
          <Home
            size={18}
            color={colors.primary}
          />

          <View style={styles.residenceInfo}>
            <Text style={styles.residenceLabel}>
              Sua residência
            </Text>

            <Text style={styles.residenceValue}>
              {perfil?.casa
                ? `Casa ${perfil.casa}`
                : 'Residência'}

              {perfil?.quadra
                ? ` • ${perfil.quadra}`
                : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* DESTAQUE */}

      <View
        style={[
          styles.hero,
          isMobile && styles.heroMobile,
        ]}
      >
        <View
          style={[
            styles.heroTextArea,
            isMobile && styles.heroTextAreaMobile,
          ]}
        >
          <Text
            style={[
              styles.heroTitle,
              isMobile && styles.heroTitleMobile,
            ]}
          >
            Tudo do condomínio em um só lugar
          </Text>

          <Text style={styles.heroText}>
            Faça reservas, acompanhe comunicados,
            registre ocorrências e converse com a
            administração.
          </Text>
        </View>

        <View
          style={[
            styles.heroIcon,
            isMobile && styles.heroIconMobile,
          ]}
        >
          <Home
            size={isMobile ? 34 : 42}
            color="#FFFFFF"
          />
        </View>
      </View>

      {/* ACESSO RÁPIDO */}

      <Text style={styles.sectionTitle}>
        Acesso rápido
      </Text>

      <View
        style={[
          styles.grid,
          isMobile && styles.gridMobile,
        ]}
      >
        <CardMenu
          titulo="Reservas"
          descricao="Reserve churrasqueira e salão de festas."
          icon={
            <CalendarDays
              size={22}
              color={colors.primary}
            />
          }
          onPress={() =>
            navegar(
              'WebMoradorReservas'
            )
          }
          isMobile={isMobile}
        />

        <CardMenu
          titulo="Comunicados"
          descricao="Acompanhe os avisos da administração."
          icon={
            <Bell
              size={22}
              color={colors.primary}
            />
          }
          onPress={() =>
            navegar(
              'WebMoradorComunicados'
            )
          }
          isMobile={isMobile}
        />

        <CardMenu
          titulo="Ocorrências"
          descricao="Registre e acompanhe suas solicitações."
          icon={
            <ShieldAlert
              size={22}
              color={colors.primary}
            />
          }
          onPress={() =>
            navegar(
              'WebMoradorOcorrencias'
            )
          }
          isMobile={isMobile}
        />

        <CardMenu
          titulo="Chat com administração"
          descricao="Converse com síndico e subsíndico."
          icon={
            <MessageCircle
              size={22}
              color={colors.primary}
            />
          }
          onPress={() =>
            navegar(
              'WebMoradorChat'
            )
          }
          isMobile={isMobile}
        />

        <CardMenu
          titulo="Chat Geral"
          descricao="Converse com outros moradores."
          icon={
            <MessagesSquare
              size={22}
              color={colors.primary}
            />
          }
          onPress={() =>
            navegar(
              'WebMoradorChatGeral'
            )
          }
          isMobile={isMobile}
        />

        <CardMenu
          titulo="Regras"
          descricao="Consulte as regras do condomínio."
          icon={
            <BookOpen
              size={22}
              color={colors.primary}
            />
          }
          onPress={() =>
            navegar(
              'WebMoradorRegras'
            )
          }
          isMobile={isMobile}
        />

        <CardMenu
          titulo="Horários"
          descricao="Consulte horários e serviços."
          icon={
            <Clock3
              size={22}
              color={colors.primary}
            />
          }
          onPress={() =>
            navegar(
              'WebMoradorHorarios'
            )
          }
          isMobile={isMobile}
        />

        <CardMenu
          titulo="Notificações"
          descricao="Veja suas notificações recentes."
          icon={
            <Bell
              size={22}
              color={colors.primary}
            />
          }
          onPress={() =>
            navegar(
              'WebMoradorNotificacoes'
            )
          }
          isMobile={isMobile}
        />

        <CardMenu
          titulo="Meu perfil"
          descricao="Veja seus dados e informações da residência."
          icon={
            <User
              size={22}
              color={colors.primary}
            />
          }
          onPress={() =>
            navegar(
              'WebMoradorPerfil'
            )
          }
          isMobile={isMobile}
        />
      </View>
    </WebLayout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 12,
  },

  // =========================
  // CABEÇALHO
  // =========================

  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  headerMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginBottom: 20,
  },

  headerTextArea: {
    flex: 1,
    paddingRight: 20,
  },

  headerTextAreaMobile: {
    paddingRight: 0,
    marginBottom: 14,
  },

  welcome: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },

  welcomeMobile: {
    fontSize: 24,
  },

  headerDescription: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 5,
  },

  residenceCard: {
    minWidth: 190,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },

  residenceCardMobile: {
    width: '100%',
    minWidth: 0,
  },

  residenceInfo: {
    marginLeft: 10,
    flexShrink: 1,
  },

  residenceLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
  },

  residenceValue: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },

  // =========================
  // HERO
  // =========================

  hero: {
    width: '100%',
    minHeight: 180,
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },

  heroMobile: {
    minHeight: 0,
    padding: 22,
    borderRadius: 18,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },

  heroTextArea: {
    flex: 1,
    maxWidth: 600,
  },

  heroTextAreaMobile: {
    width: '100%',
    maxWidth: '100%',
    flex: 0,
  },

  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },

  heroTitleMobile: {
    fontSize: 21,
    lineHeight: 29,
  },

  heroText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 19,
    marginTop: 9,
    opacity: 0.9,
  },

  heroIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor:
      'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 25,
  },

  heroIconMobile: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginLeft: 0,
    marginTop: 20,
    alignSelf: 'flex-end',
  },

  // =========================
  // ACESSO RÁPIDO
  // =========================

  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 15,
  },

  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  gridMobile: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
  },

  menuCard: {
    width: '32%',
    minHeight: 130,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 17,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuCardMobile: {
    width: '100%',
    minHeight: 92,
    padding: 15,
  },

  menuCardPressed: {
    opacity: 0.7,
  },

  menuIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
    flexShrink: 0,
  },

  menuTextArea: {
    flex: 1,
    minWidth: 0,
  },

  menuTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },

  menuDescription: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 5,
  },

  arrow: {
    color: colors.textLight,
    fontSize: 22,
    marginLeft: 8,
    flexShrink: 0,
  },
});