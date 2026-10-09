import React, { useEffect, useState } from 'react';

import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { useNavigationState } from '@react-navigation/native';

import { colors } from '../theme/theme';

type WebLayoutProps = {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
};

const MOBILE_BREAKPOINT = 768;
const SIDEBAR_WIDTH = 235;

export default function WebLayout({
  sidebar,
  children,
  scroll = true,
  contentStyle,
}: WebLayoutProps) {
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get('window').width
  );

  const [menuAberto, setMenuAberto] = useState(false);

  const isMobile = screenWidth < MOBILE_BREAKPOINT;

  const routeIndex = useNavigationState(
    state => state?.index ?? 0
  );

  const routeName = useNavigationState(
    state => {
      if (!state?.routes?.length) {
        return '';
      }

      return state.routes[state.index]?.name ?? '';
    }
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener(
      'change',
      ({ window }) => {
        setScreenWidth(window.width);

        if (window.width >= MOBILE_BREAKPOINT) {
          setMenuAberto(false);
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    setMenuAberto(false);
  }, [routeIndex, routeName]);

  function abrirMenu() {
    setMenuAberto(true);
  }

  function fecharMenu() {
    setMenuAberto(false);
  }

  const conteudo = (
    <View
      style={[
        styles.contentInner,
        isMobile && styles.contentInnerMobile,
      ]}
    >
      {children}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* SIDEBAR DESKTOP */}

      {!isMobile && (
        <View style={styles.sidebarDesktop}>
          {sidebar}
        </View>
      )}

      {/* ÁREA PRINCIPAL */}

      <View style={styles.main}>
        {/* CABEÇALHO MOBILE */}

        {isMobile && (
          <View style={styles.mobileHeader}>
            <Pressable
              style={({ pressed }) => [
                styles.menuButton,
                pressed && styles.menuButtonPressed,
              ]}
              onPress={abrirMenu}
            >
              <Text style={styles.menuIcon}>
                ☰
              </Text>

              <Text style={styles.menuText}>
                Menu
              </Text>
            </Pressable>

            <Text
              style={styles.mobileTitle}
              numberOfLines={1}
            >
              ConectaLar
            </Text>

            <View style={styles.headerSpacer} />
          </View>
        )}

        {/* CONTEÚDO */}

        {scroll ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.content,

              isMobile
                ? styles.contentMobile
                : styles.contentDesktop,

              contentStyle,
            ]}
            showsVerticalScrollIndicator={false}
            horizontal={false}
          >
            {conteudo}
          </ScrollView>
        ) : (
          <View
            style={[
              styles.content,

              isMobile
                ? styles.contentMobile
                : styles.contentDesktop,

              contentStyle,
            ]}
          >
            {conteudo}
          </View>
        )}
      </View>

      {/* MENU MOBILE */}

      {isMobile && (
        <Modal
          visible={menuAberto}
          transparent
          animationType="fade"
          onRequestClose={fecharMenu}
          statusBarTranslucent
        >
          <View style={styles.modalContainer}>
            {/* FUNDO ESCURO */}

            <Pressable
              style={styles.overlay}
              onPress={fecharMenu}
            />

            {/* MENU LATERAL */}

            <View style={styles.sidebarMobile}>
              {/* CABEÇALHO DO MENU */}

              <View style={styles.mobileMenuTop}>
                <Text style={styles.mobileMenuTitle}>
                  Menu
                </Text>

                <Pressable
                  style={({ pressed }) => [
                    styles.closeButton,
                    pressed &&
                      styles.closeButtonPressed,
                  ]}
                  onPress={fecharMenu}
                >
                  <Text style={styles.closeButtonText}>
                    ×
                  </Text>
                </Pressable>
              </View>

              {/* SIDEBAR */}

              <View style={styles.sidebarMobileContent}>
                {sidebar}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    flexDirection: 'row',

    width: '100%',

    minHeight: '100%',

    backgroundColor: colors.background,

    overflow: 'hidden',
  },

  /* ============================= */
  /* DESKTOP */
  /* ============================= */

  sidebarDesktop: {
    width: SIDEBAR_WIDTH,

    minWidth: SIDEBAR_WIDTH,

    maxWidth: SIDEBAR_WIDTH,

    flexShrink: 0,

    height: '100%',
  },

  main: {
    flex: 1,

    minWidth: 0,

    width: '100%',

    backgroundColor: colors.background,

    overflow: 'hidden',
  },

  scroll: {
    flex: 1,

    width: '100%',
  },

  content: {
    flexGrow: 1,

    width: '100%',

    minWidth: 0,
  },

  contentDesktop: {
    paddingHorizontal: 30,

    paddingTop: 30,

    paddingBottom: 50,
  },

  contentMobile: {
    paddingHorizontal: 16,

    paddingTop: 20,

    paddingBottom: 40,
  },

  contentInner: {
    width: '100%',

    maxWidth: 1400,

    alignSelf: 'center',

    minWidth: 0,
  },

  contentInnerMobile: {
    width: '100%',

    maxWidth: '100%',

    minWidth: 0,
  },

  /* ============================= */
  /* CABEÇALHO MOBILE */
  /* ============================= */

  mobileHeader: {
    width: '100%',

    minHeight: 64,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    paddingHorizontal: 14,

    paddingVertical: 10,

    backgroundColor: colors.surface,

    borderBottomWidth: 1,

    borderBottomColor: colors.border,

    flexShrink: 0,
  },

  menuButton: {
    minHeight: 42,

    minWidth: 82,

    paddingHorizontal: 14,

    borderRadius: 10,

    backgroundColor: colors.primary,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 8,
  },

  menuButtonPressed: {
    opacity: 0.8,
  },

  menuIcon: {
    color: '#FFFFFF',

    fontSize: 20,

    fontWeight: '700',
  },

  menuText: {
    color: '#FFFFFF',

    fontSize: 14,

    fontWeight: '700',
  },

  mobileTitle: {
    flex: 1,

    textAlign: 'center',

    color: colors.text,

    fontSize: 18,

    fontWeight: '800',

    marginHorizontal: 10,
  },

  headerSpacer: {
    width: 82,
  },

  /* ============================= */
  /* MODAL MOBILE */
  /* ============================= */

  modalContainer: {
    flex: 1,

    flexDirection: 'row',
  },

  overlay: {
    position: 'absolute',

    top: 0,

    right: 0,

    bottom: 0,

    left: 0,

    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },

  /* ============================= */
  /* MENU MOBILE */
  /* ============================= */

  sidebarMobile: {
    width: '73%',

    maxWidth: 285,

    height: '100%',

    backgroundColor: '#0F1D36',

    zIndex: 10,

    shadowColor: '#000',

    shadowOffset: {
      width: 4,
      height: 0,
    },

    shadowOpacity: 0.25,

    shadowRadius: 12,

    elevation: 12,

    overflow: 'hidden',
  },

  mobileMenuTop: {
    height: 58,

    paddingHorizontal: 16,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    backgroundColor: '#0F1D36',

    borderBottomWidth: 1,

    borderBottomColor:
      'rgba(255,255,255,0.10)',
  },

  mobileMenuTitle: {
    color: '#FFFFFF',

    fontSize: 16,

    fontWeight: '700',
  },

  closeButton: {
    width: 38,

    height: 38,

    borderRadius: 10,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor:
      'rgba(255,255,255,0.10)',
  },

  closeButtonPressed: {
    opacity: 0.7,
  },

  closeButtonText: {
    color: '#FFFFFF',

    fontSize: 28,

    lineHeight: 30,

    fontWeight: '400',
  },

  sidebarMobileContent: {
    flex: 1,

    width: '100%',

    minWidth: 0,

    backgroundColor: '#0F1D36',

    overflow: 'hidden',
  },
});