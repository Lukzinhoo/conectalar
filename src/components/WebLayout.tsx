import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { colors } from '../theme/theme';

type WebLayoutProps = {
  sidebar: React.ReactNode;
  children: React.ReactNode;

  scroll?: boolean;

  contentStyle?: ViewStyle;
};

export default function WebLayout({
  sidebar,
  children,
  scroll = true,
  contentStyle,
}: WebLayoutProps) {
  return (
    <View style={styles.container}>
      {/* SIDEBAR */}
      <View style={styles.sidebar}>
        {sidebar}
      </View>

      {/* ÁREA PRINCIPAL */}
      <View style={styles.main}>
        {scroll ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.content,
              contentStyle,
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contentInner}>
              {children}
            </View>
          </ScrollView>
        ) : (
          <View
            style={[
              styles.content,
              contentStyle,
            ]}
          >
            <View style={styles.contentInner}>
              {children}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Tela inteira
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
    minHeight: '100%',
  },

  // Mesmo espaço para sidebar
  // de administrador e morador
  sidebar: {
    width: 235,
    minWidth: 235,
    maxWidth: 235,
  },

  // Área principal
  main: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.background,
  },

  scroll: {
    flex: 1,
  },

  // Espaçamento padrão de TODAS as telas
  content: {
    flexGrow: 1,
    width: '100%',
    paddingHorizontal: 30,
    paddingTop: 30,
    paddingBottom: 50,
  },

  // Limita telas muito grandes
  // e mantém Admin/Morador iguais
  contentInner: {
    width: '100%',
    maxWidth: 1400,
    alignSelf: 'center',
  },
});