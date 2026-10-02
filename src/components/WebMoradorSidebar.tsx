import React from 'react';

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  Bell,
  BookOpen,
  CalendarDays,
  Clock3,
  Home,
  LogOut,
  MessageCircle,
  MessagesSquare,
  ShieldAlert,
  User,
} from 'lucide-react-native';

import type { AuthStackParamList } from '../navigation/AuthNavigator';
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

export default function WebMoradorSidebar({
  active,
}: Props) {
  const navigation =
    useNavigation<NavigationProp>();

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

  function corIcone(
    item: WebMoradorSidebarActive
  ) {
    return active === item
      ? '#FFFFFF'
      : COR_ICONE;
  }

  return (
    <View style={styles.sidebar}>
      <View style={styles.topArea}>
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

        {/* MENU */}

        <View style={styles.menuArea}>
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

          <MenuItem
            titulo="Reservas"
            active={active === 'reservas'}
            icon={
              <CalendarDays
                size={18}
                color={corIcone('reservas')}
              />
            }
            onPress={() =>
              navigation.navigate(
                'WebMoradorReservas'
              )
            }
          />

          <MenuItem
            titulo="Comunicados"
            active={active === 'comunicados'}
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

          <MenuItem
            titulo="Ocorrências"
            active={active === 'ocorrencias'}
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

          <MenuItem
            titulo="Chat Geral"
            active={active === 'chatGeral'}
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

          <MenuItem
            titulo="Regras"
            active={active === 'regras'}
            icon={
              <BookOpen
                size={18}
                color={corIcone('regras')}
              />
            }
            onPress={() =>
              navigation.navigate(
                'WebMoradorRegras'
              )
            }
          />

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

          <MenuItem
            titulo="Notificações"
            active={active === 'notificacoes'}
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

          <MenuItem
            titulo="Meu perfil"
            active={active === 'perfil'}
            icon={
              <User
                size={18}
                color={corIcone('perfil')}
              />
            }
            onPress={() =>
              navigation.navigate(
                'WebMoradorPerfil'
              )
            }
          />
        </View>
      </View>

      {/* PARTE INFERIOR */}

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
            <Text style={styles.profileTitle}>
              ConectaLar
            </Text>

            <Text
              style={styles.profileSubtitle}
            >
              Painel do morador
            </Text>
          </View>
        </View>

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

const styles = StyleSheet.create({
  sidebar: {
    width: 235,
    minWidth: 235,
    maxWidth: 235,
    minHeight: '100%',
    backgroundColor: COR_FUNDO,
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },

  topArea: {
    width: '100%',
  },

  logoArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    marginBottom: 28,
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

  menuArea: {
    width: '100%',
  },

  menuItem: {
    width: '100%',
    minHeight: 46,
    borderRadius: 11,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
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
  },

  divider: {
    height: 1,
    backgroundColor: COR_DIVISOR,
    marginBottom: 15,
  },

  profileArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 13,
  },

  profileIcon: {
    width: 35,
    height: 35,
    borderRadius: 9,
    backgroundColor: '#192B49',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  profileTexts: {
    flex: 1,
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
    minHeight: 42,
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