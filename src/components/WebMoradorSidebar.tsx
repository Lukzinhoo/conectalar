import React from 'react';

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';

import type {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import {
  Bell,
  BookOpen,
  CalendarDays,
  Clock3,
  DollarSign,
  Home,
  LogOut,
  MessageCircle,
  MessagesSquare,
  ShieldAlert,
  User,
} from 'lucide-react-native';

import type {
  AuthStackParamList,
} from '../navigation/AuthNavigator';

import { supabase } from '../services/supabase';

type NavigationProp =
  NativeStackNavigationProp<AuthStackParamList>;

export type WebMoradorSidebarActive =
  | 'inicio'
  | 'reservas'
  | 'comunicados'
  | 'ocorrencias'
  | 'chat'
  | 'chatGeral'
  | 'regras'
  | 'horarios'
  | 'notificacoes'
  | 'financeiro'
  | 'perfil';

type Props = {
  active: WebMoradorSidebarActive;
};

type MenuItemProps = {
  titulo: string;
  active: boolean;
  icon: React.ReactNode;
  onPress: () => void;
};

const COR_FUNDO = '#0F1D36';
const COR_ATIVA = '#2949C7';
const COR_TEXTO = '#AEBBD0';
const COR_ICONE = '#9FB0C9';
const COR_DIVISOR = '#263752';

/* =====================================================
   ITEM DO MENU
===================================================== */

function MenuItem({
  titulo,
  active,
  icon,
  onPress,
}: MenuItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        active && styles.menuItemActive,
        pressed && styles.menuItemPressed,
      ]}
      onPress={onPress}
    >
      {icon}

      <Text
        style={[
          styles.menuText,
          active && styles.menuTextActive,
        ]}
      >
        {titulo}
      </Text>
    </Pressable>
  );
}

/* =====================================================
   SIDEBAR
===================================================== */

export default function WebMoradorSidebar({
  active,
}: Props) {
  const navigation =
    useNavigation<NavigationProp>();

  /* ===================================================
     SAIR
  =================================================== */

  async function sair() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error(
        'Erro ao sair da conta:',
        error
      );
    } finally {
      navigation.replace('WebLogin');
    }
  }

  /* ===================================================
     COR DO ÍCONE
  =================================================== */

  function corIcone(
    item: WebMoradorSidebarActive
  ) {
    return active === item
      ? '#FFFFFF'
      : COR_ICONE;
  }

  /* ===================================================
     TELA
  =================================================== */

  return (
    <View style={styles.sidebar}>
      {/* LOGO */}

      <View style={styles.logoArea}>
        <View style={styles.logoIcon}>
          <Home
            size={23}
            color="#FFFFFF"
          />
        </View>

        <View style={styles.logoTexts}>
          <Text style={styles.logoTitle}>
            ConectaLar
          </Text>

          <Text style={styles.logoSubtitle}>
            Área do morador
          </Text>
        </View>
      </View>

      {/* MENU COM ROLAGEM */}

      <ScrollView
        style={styles.menuScroll}
        contentContainerStyle={
          styles.menuArea
        }
        showsVerticalScrollIndicator={
          false
        }
        horizontal={false}
      >
        {/* INÍCIO */}

        <MenuItem
          titulo="Início"
          active={active === 'inicio'}
          icon={
            <Home
              size={18}
              color={corIcone('inicio')}
            />
          }
          onPress={() =>
            navigation.navigate(
              'WebMoradorHome'
            )
          }
        />

        {/* RESERVAS */}

        <MenuItem
          titulo="Reservas"
          active={active === 'reservas'}
          icon={
            <CalendarDays
              size={18}
              color={corIcone(
                'reservas'
              )}
            />
          }
          onPress={() =>
            navigation.navigate(
              'WebMoradorReservas'
            )
          }
        />

        {/* COMUNICADOS */}

        <MenuItem
          titulo="Comunicados"
          active={
            active === 'comunicados'
          }
          icon={
            <Bell
              size={18}
              color={corIcone(
                'comunicados'
              )}
            />
          }
          onPress={() =>
            navigation.navigate(
              'WebMoradorComunicados'
            )
          }
        />

        {/* OCORRÊNCIAS */}

        <MenuItem
          titulo="Ocorrências"
          active={
            active === 'ocorrencias'
          }
          icon={
            <ShieldAlert
              size={18}
              color={corIcone(
                'ocorrencias'
              )}
            />
          }
          onPress={() =>
            navigation.navigate(
              'WebMoradorOcorrencias'
            )
          }
        />

        {/* CHAT */}

        <MenuItem
          titulo="Chat"
          active={active === 'chat'}
          icon={
            <MessageCircle
              size={18}
              color={corIcone('chat')}
            />
          }
          onPress={() =>
            navigation.navigate(
              'WebMoradorChat'
            )
          }
        />

        {/* CHAT GERAL */}

        <MenuItem
          titulo="Chat Geral"
          active={
            active === 'chatGeral'
          }
          icon={
            <MessagesSquare
              size={18}
              color={corIcone(
                'chatGeral'
              )}
            />
          }
          onPress={() =>
            navigation.navigate(
              'WebMoradorChatGeral'
            )
          }
        />

        {/* REGRAS */}

        <MenuItem
          titulo="Regras"
          active={active === 'regras'}
          icon={
            <BookOpen
              size={18}
              color={corIcone(
                'regras'
              )}
            />
          }
          onPress={() =>
            navigation.navigate(
              'WebMoradorRegras'
            )
          }
        />

        {/* HORÁRIOS */}

        <MenuItem
          titulo="Horários"
          active={active === 'horarios'}
          icon={
            <Clock3
              size={18}
              color={corIcone(
                'horarios'
              )}
            />
          }
          onPress={() =>
            navigation.navigate(
              'WebMoradorHorarios'
            )
          }
        />

        {/* NOTIFICAÇÕES */}

        <MenuItem
          titulo="Notificações"
          active={
            active === 'notificacoes'
          }
          icon={
            <Bell
              size={18}
              color={corIcone(
                'notificacoes'
              )}
            />
          }
          onPress={() =>
            navigation.navigate(
              'WebMoradorNotificacoes'
            )
          }
        />

        {/* FINANCEIRO */}

        <MenuItem
          titulo="Financeiro"
          active={
            active === 'financeiro'
          }
          icon={
            <DollarSign
              size={18}
              color={corIcone(
                'financeiro'
              )}
            />
          }
          onPress={() =>
            navigation.navigate(
              'WebMoradorFinanceiro'
            )
          }
        />

        {/* MEU PERFIL */}

        <MenuItem
          titulo="Meu perfil"
          active={active === 'perfil'}
          icon={
            <User
              size={18}
              color={corIcone(
                'perfil'
              )}
            />
          }
          onPress={() =>
            navigation.navigate(
              'WebMoradorPerfil'
            )
          }
        />
      </ScrollView>

      {/* PARTE INFERIOR FIXA */}

      <View style={styles.bottomArea}>
        <View style={styles.divider} />

        <View style={styles.profileArea}>
          <View style={styles.profileIcon}>
            <Home
              size={16}
              color={COR_ICONE}
            />
          </View>

          <View style={styles.profileTexts}>
            <Text
              style={styles.profileTitle}
            >
              ConectaLar
            </Text>

            <Text
              style={
                styles.profileSubtitle
              }
            >
              Painel do morador
            </Text>
          </View>
        </View>

        {/* SAIR */}

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,

            pressed &&
              styles.logoutButtonPressed,
          ]}
          onPress={sair}
        >
          <LogOut
            size={17}
            color={COR_ICONE}
          />

          <Text style={styles.logoutText}>
            Sair da conta
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/* =====================================================
   ESTILOS
===================================================== */

const styles = StyleSheet.create({
  sidebar: {
    width: 235,
    minWidth: 235,
    maxWidth: 235,

    flex: 1,

    height: '100%',

    minHeight: 0,

    backgroundColor: COR_FUNDO,

    paddingHorizontal: 14,

    paddingTop: 18,

    paddingBottom: 12,

    overflow: 'hidden',
  },

  logoArea: {
    width: '100%',

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 7,

    marginBottom: 14,

    flexShrink: 0,
  },

  logoIcon: {
    width: 44,

    height: 44,

    borderRadius: 12,

    backgroundColor: COR_ATIVA,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 12,
  },

  logoTexts: {
    flex: 1,

    minWidth: 0,
  },

  logoTitle: {
    color: '#FFFFFF',

    fontSize: 17,

    fontWeight: '900',
  },

  logoSubtitle: {
    color: '#7F91AD',

    fontSize: 9,

    marginTop: 3,
  },

  menuScroll: {
    flex: 1,

    width: '100%',

    minHeight: 0,
  },

  menuArea: {
    width: '100%',

    paddingTop: 4,

    paddingBottom: 10,
  },

  menuItem: {
    width: '100%',

    minHeight: 44,

    borderRadius: 11,

    paddingHorizontal: 13,

    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 4,
  },

  menuItemActive: {
    backgroundColor: COR_ATIVA,
  },

  menuItemPressed: {
    opacity: 0.8,
  },

  menuText: {
    color: COR_TEXTO,

    fontSize: 12,

    fontWeight: '700',

    marginLeft: 12,
  },

  menuTextActive: {
    color: '#FFFFFF',

    fontWeight: '900',
  },

  bottomArea: {
    width: '100%',

    flexShrink: 0,

    paddingTop: 4,

    backgroundColor: COR_FUNDO,
  },

  divider: {
    height: 1,

    backgroundColor: COR_DIVISOR,

    marginBottom: 10,
  },

  profileArea: {
    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 8,

    marginBottom: 6,
  },

  profileIcon: {
    width: 32,

    height: 32,

    borderRadius: 9,

    backgroundColor: '#192B49',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 10,
  },

  profileTexts: {
    flex: 1,

    minWidth: 0,
  },

  profileTitle: {
    color: '#FFFFFF',

    fontSize: 10,

    fontWeight: '800',
  },

  profileSubtitle: {
    color: '#7185A4',

    fontSize: 8,

    marginTop: 2,
  },

  logoutButton: {
    width: '100%',

    minHeight: 38,

    borderRadius: 10,

    paddingHorizontal: 11,

    flexDirection: 'row',

    alignItems: 'center',
  },

  logoutButtonPressed: {
    backgroundColor: '#192B49',
  },

  logoutText: {
    color: COR_TEXTO,

    fontSize: 10,

    fontWeight: '700',

    marginLeft: 10,
  },
});