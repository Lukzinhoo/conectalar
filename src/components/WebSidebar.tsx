import React from 'react';

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useNavigation,
} from '@react-navigation/native';

import {
  Bell,
  BellRing,
  BookOpen,
  CalendarDays,
  Clock3,
  Home,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  Users,
  Wallet,
} from 'lucide-react-native';

import {
  colors,
} from '../theme/theme';

import {
  sair,
} from '../services/authService';

// =====================================================
// PÁGINAS DO MENU ADMINISTRATIVO
// =====================================================

export type PaginaAtiva =
  | 'dashboard'
  | 'moradores'
  | 'reservas'
  | 'comunicados'
  | 'ocorrencias'
  | 'chat'
  | 'chatGeral'
  | 'regras'
  | 'horarios'
  | 'notificacoes'
  | 'financeiro';

type Props = {
  active: PaginaAtiva;
};

// =====================================================
// SIDEBAR
// =====================================================

export default function WebSidebar({
  active,
}: Props) {
  const navigation =
    useNavigation<any>();

  // ===================================================
  // LOGOUT
  // ===================================================

  const logout = async () => {
    try {
      await sair();
    } finally {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'WebLogin',
          },
        ],
      });
    }
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <View style={styles.sidebar}>
      {/* PARTE SUPERIOR */}

      <View style={styles.top}>
        {/* LOGO */}

        <View style={styles.brand}>
          <View style={styles.logoBox}>
            <Text
              style={styles.logoLetter}
            >
              C
            </Text>
          </View>

          <View style={styles.brandText}>
            <Text
              style={styles.logoTitle}
            >
              ConectaLar
            </Text>

            <Text
              style={styles.logoSubtitle}
            >
              Administração
            </Text>
          </View>
        </View>

        {/* MENU COM ROLAGEM */}

        <ScrollView
          style={styles.menuScroll}
          contentContainerStyle={
            styles.menu
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          {/* DASHBOARD */}

          <MenuItem
            label="Dashboard"
            active={
              active === 'dashboard'
            }
            icon={
              <LayoutDashboard
                size={18}
                color={corIcone(
                  active ===
                    'dashboard'
                )}
              />
            }
            onPress={() =>
              navigation.navigate(
                'WebDashboard'
              )
            }
          />

          {/* MORADORES */}

          <MenuItem
            label="Moradores"
            active={
              active === 'moradores'
            }
            icon={
              <Users
                size={18}
                color={corIcone(
                  active ===
                    'moradores'
                )}
              />
            }
            onPress={() =>
              navigation.navigate(
                'WebMoradores'
              )
            }
          />

          {/* RESERVAS */}

          <MenuItem
            label="Reservas"
            active={
              active === 'reservas'
            }
            icon={
              <CalendarDays
                size={18}
                color={corIcone(
                  active ===
                    'reservas'
                )}
              />
            }
            onPress={() =>
              navigation.navigate(
                'WebReservas'
              )
            }
          />

          {/* COMUNICADOS */}

          <MenuItem
            label="Comunicados"
            active={
              active ===
              'comunicados'
            }
            icon={
              <Megaphone
                size={18}
                color={corIcone(
                  active ===
                    'comunicados'
                )}
              />
            }
            onPress={() =>
              navigation.navigate(
                'WebComunicados'
              )
            }
          />

          {/* OCORRÊNCIAS */}

          <MenuItem
            label="Ocorrências"
            active={
              active ===
              'ocorrencias'
            }
            icon={
              <BellRing
                size={18}
                color={corIcone(
                  active ===
                    'ocorrencias'
                )}
              />
            }
            onPress={() =>
              navigation.navigate(
                'WebOcorrencias'
              )
            }
          />

          {/* CHAT ADMINISTRAÇÃO */}

          <MenuItem
            label="Chat"
            active={
              active === 'chat'
            }
            icon={
              <MessageCircle
                size={18}
                color={corIcone(
                  active === 'chat'
                )}
              />
            }
            onPress={() =>
              navigation.navigate(
                'WebChat'
              )
            }
          />

          {/* CHAT GERAL */}

          <MenuItem
            label="Chat Geral"
            active={
              active ===
              'chatGeral'
            }
            icon={
              <MessagesSquare
                size={18}
                color={corIcone(
                  active ===
                    'chatGeral'
                )}
              />
            }
            onPress={() =>
              navigation.navigate(
                'WebChatGeral'
              )
            }
          />

          {/* REGRAS */}

          <MenuItem
            label="Regras"
            active={
              active === 'regras'
            }
            icon={
              <BookOpen
                size={18}
                color={corIcone(
                  active === 'regras'
                )}
              />
            }
            onPress={() =>
              navigation.navigate(
                'WebRegras'
              )
            }
          />

          {/* HORÁRIOS */}

          <MenuItem
            label="Horários"
            active={
              active === 'horarios'
            }
            icon={
              <Clock3
                size={18}
                color={corIcone(
                  active ===
                    'horarios'
                )}
              />
            }
            onPress={() =>
              navigation.navigate(
                'WebHorarios'
              )
            }
          />

          {/* NOTIFICAÇÕES */}

          <MenuItem
            label="Notificações"
            active={
              active ===
              'notificacoes'
            }
            icon={
              <Bell
                size={18}
                color={corIcone(
                  active ===
                    'notificacoes'
                )}
              />
            }
            onPress={() =>
              navigation.navigate(
                'WebNotificacoes'
              )
            }
          />

          {/* FINANCEIRO */}

          <MenuItem
            label="Financeiro"
            active={
              active ===
              'financeiro'
            }
            icon={
              <Wallet
                size={18}
                color={corIcone(
                  active ===
                    'financeiro'
                )}
              />
            }
            onPress={() =>
              navigation.navigate(
                'WebFinanceiro'
              )
            }
          />
        </ScrollView>
      </View>

      {/* PARTE INFERIOR */}

      <View style={styles.bottom}>
        <View
          style={styles.condominio}
        >
          <View
            style={
              styles.condominioIcon
            }
          >
            <Home
              size={16}
              color="#94A3B8"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={
                styles.condominioTitle
              }
            >
              ConectaLar
            </Text>

            <Text
              style={
                styles.condominioText
              }
            >
              Painel administrativo
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.logoutButton}
          onPress={logout}
        >
          <LogOut
            size={17}
            color="#94A3B8"
          />

          <Text
            style={styles.logoutText}
          >
            Sair da conta
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// =====================================================
// COR DO ÍCONE
// =====================================================

function corIcone(
  ativo: boolean
) {
  return ativo
    ? '#FFFFFF'
    : '#94A3B8';
}

// =====================================================
// ITEM DO MENU
// =====================================================

function MenuItem({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }: any) => [
        styles.menuItem,

        active &&
          styles.menuItemActive,

        hovered &&
          !active &&
          styles.menuItemHover,
      ]}
    >
      <View style={styles.iconArea}>
        {icon}
      </View>

      <Text
        style={[
          styles.menuText,

          active &&
            styles.menuTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// =====================================================
// ESTILOS
// =====================================================

const styles =
  StyleSheet.create({
    sidebar: {
      width: 265,
      minWidth: 265,
      height: '100%',
      backgroundColor:
        '#0F1B33',
      paddingHorizontal: 18,
      paddingTop: 22,
      paddingBottom: 20,

      shadowColor: '#000000',
      shadowOffset: {
        width: 2,
        height: 0,
      },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },

    top: {
      flex: 1,
      minHeight: 0,
    },

    brand: {
      height: 64,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
    },

    brandText: {
      flex: 1,
    },

    logoBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor:
        colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },

    logoLetter: {
      color: '#FFFFFF',
      fontSize: 24,
      fontWeight: '900',
    },

    logoTitle: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '800',
    },

    logoSubtitle: {
      color: '#718096',
      fontSize: 9,
      marginTop: 2,
    },

    menuScroll: {
      flex: 1,
      marginTop: 24,
    },

    menu: {
      paddingBottom: 20,
    },

    menuItem: {
      width: '100%',
      minHeight: 46,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      marginBottom: 5,
    },

    menuItemActive: {
      backgroundColor:
        colors.primary,
    },

    menuItemHover: {
      backgroundColor:
        'rgba(255,255,255,0.05)',
    },

    iconArea: {
      width: 29,
      alignItems: 'flex-start',
    },

    menuText: {
      color: '#B8C5D9',
      fontSize: 13,
      fontWeight: '600',
    },

    menuTextActive: {
      color: '#FFFFFF',
      fontWeight: '800',
    },

    bottom: {
      flexShrink: 0,
      borderTopWidth: 1,
      borderTopColor:
        'rgba(255,255,255,0.08)',
      paddingTop: 15,
      backgroundColor:
        '#0F1B33',
    },

    condominio: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 9,
      marginBottom: 12,
    },

    condominioIcon: {
      width: 34,
      height: 34,
      borderRadius: 9,
      backgroundColor:
        'rgba(255,255,255,0.05)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 9,
    },

    condominioTitle: {
      color: '#E2E8F0',
      fontSize: 10,
      fontWeight: '700',
    },

    condominioText: {
      color: '#64748B',
      fontSize: 8,
      marginTop: 2,
    },

    logoutButton: {
      height: 42,
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 11,
    },

    logoutText: {
      color: '#94A3B8',
      fontSize: 10,
      fontWeight: '600',
      marginLeft: 10,
    },
  });