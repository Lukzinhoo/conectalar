import React from 'react';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthStackParamList } from '../../../navigation/AuthNavigator';

import WebLayout from '../../../components/WebLayout';
import WebSidebar from '../../../components/WebSidebar';

import { colors } from '../../../theme/theme';
import { typography } from '../../../theme/typography';

type Props = NativeStackScreenProps<
  AuthStackParamList,
  'WebDashboard'
>;

export default function WebDashboardScreen({
  navigation,
}: Props) {
  return (
    <WebLayout
      sidebar={
        <WebSidebar active="dashboard" />
      }
    >
      {/* =================================================
          CABEÇALHO
      ================================================= */}

      <View style={styles.header}>
        <View style={styles.headerTextArea}>
          <Text style={styles.pageTitle}>
            Dashboard
          </Text>

          <Text style={styles.pageSubtitle}>
            Visão geral do condomínio
          </Text>
        </View>

        <View style={styles.adminArea}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              A
            </Text>
          </View>

          <View>
            <Text style={styles.adminName}>
              Administrador
            </Text>

            <Text style={styles.adminRole}>
              Administração
            </Text>
          </View>
        </View>
      </View>

      {/* =================================================
          BOAS-VINDAS
      ================================================= */}

      <View style={styles.welcome}>
        <Text style={styles.welcomeTitle}>
          Bem-vindo ao ConectaLar 👋
        </Text>

        <Text style={styles.welcomeText}>
          Acompanhe as principais informações do condomínio.
        </Text>
      </View>

      {/* =================================================
          CARDS
      ================================================= */}

      <View style={styles.cards}>
        <DashboardCard
          icon="👥"
          number="0"
          title="Moradores"
          description="Moradores cadastrados"
          onPress={() =>
            navigation.navigate(
              'WebMoradores'
            )
          }
        />

        <DashboardCard
          icon="📅"
          number="0"
          title="Reservas"
          description="Reservas cadastradas"
          onPress={() =>
            navigation.navigate(
              'WebReservas'
            )
          }
        />

        <DashboardCard
          icon="🚨"
          number="0"
          title="Ocorrências"
          description="Ocorrências registradas"
          onPress={() =>
            navigation.navigate(
              'WebOcorrencias'
            )
          }
        />

        <DashboardCard
          icon="📢"
          number="0"
          title="Comunicados"
          description="Comunicados publicados"
          onPress={() =>
            navigation.navigate(
              'WebComunicados'
            )
          }
        />
      </View>

      {/* =================================================
          PARTE INFERIOR
      ================================================= */}

      <View style={styles.bottomGrid}>
        {/* RESERVAS RECENTES */}

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelTitle}>
                Reservas recentes
              </Text>

              <Text
                style={styles.panelSubtitle}
              >
                Últimas reservas realizadas
              </Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate(
                  'WebReservas'
                )
              }
            >
              <Text style={styles.seeAll}>
                Ver todas
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>
              📅
            </Text>

            <Text style={styles.emptyTitle}>
              Nenhuma reserva
            </Text>

            <Text style={styles.emptyText}>
              As reservas recentes aparecerão aqui.
            </Text>
          </View>
        </View>

        {/* OCORRÊNCIAS */}

        <View style={styles.panelSmall}>
          <Text style={styles.panelTitle}>
            Ocorrências
          </Text>

          <Text style={styles.panelSubtitle}>
            Situação atual
          </Text>

          {/* PENDENTES */}

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    '#F59E0B',
                },
              ]}
            />

            <View
              style={styles.statusContent}
            >
              <Text
                style={styles.statusTitle}
              >
                Pendentes
              </Text>

              <Text
                style={styles.statusNumber}
              >
                0
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* RESOLVIDAS */}

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    '#22C55E',
                },
              ]}
            />

            <View
              style={styles.statusContent}
            >
              <Text
                style={styles.statusTitle}
              >
                Resolvidas
              </Text>

              <Text
                style={styles.statusNumber}
              >
                0
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={
              styles.occurrenceButton
            }
            onPress={() =>
              navigation.navigate(
                'WebOcorrencias'
              )
            }
          >
            <Text
              style={
                styles.occurrenceButtonText
              }
            >
              Ver ocorrências
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </WebLayout>
  );
}

/* =====================================================
   CARD DO DASHBOARD
===================================================== */

type DashboardCardProps = {
  icon: string;
  number: string;
  title: string;
  description: string;
  onPress?: () => void;
};

function DashboardCard({
  icon,
  number,
  title,
  description,
  onPress,
}: DashboardCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          <Text
            style={styles.cardIconText}
          >
            {icon}
          </Text>
        </View>

        <Text style={styles.cardArrow}>
          ›
        </Text>
      </View>

      <Text style={styles.cardNumber}>
        {number}
      </Text>

      <Text style={styles.cardTitle}>
        {title}
      </Text>

      <Text
        style={styles.cardDescription}
      >
        {description}
      </Text>
    </TouchableOpacity>
  );
}

/* =====================================================
   ESTILOS
===================================================== */

const styles = StyleSheet.create({
  /* ===================================================
     CABEÇALHO
  =================================================== */

  header: {
    minHeight: 80,

    backgroundColor:
      colors.surface,

    borderWidth: 1,
    borderColor:
      colors.border,

    borderRadius: 15,

    paddingHorizontal: 20,
    paddingVertical: 15,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',

    marginBottom: 25,
  },

  headerTextArea: {
    flex: 1,
    paddingRight: 20,
  },

  pageTitle: {
    ...typography.pageTitle,

    color: colors.text,
  },

  pageSubtitle: {
    ...typography.pageSubtitle,

    color:
      colors.textSecondary,

    marginTop: 3,
  },

  adminArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 42,
    height: 42,

    borderRadius: 21,

    backgroundColor:
      colors.primaryLight,

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 11,
  },

  avatarText: {
    ...typography.cardTitle,

    color: colors.primary,

    fontWeight: '800',
  },

  adminName: {
    ...typography.cardTitle,

    color: colors.text,
  },

  adminRole: {
    ...typography.caption,

    color:
      colors.textSecondary,

    marginTop: 2,
  },

  /* ===================================================
     BOAS-VINDAS
  =================================================== */

  welcome: {
    marginBottom: 25,
  },

  welcomeTitle: {
    ...typography.pageTitle,

    color: colors.text,
  },

  welcomeText: {
    ...typography.body,

    color:
      colors.textSecondary,

    marginTop: 5,
  },

  /* ===================================================
     CARDS
  =================================================== */

  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    marginHorizontal: -7,
    marginBottom: 18,
  },

  card: {
    flexGrow: 1,

    flexBasis: 220,

    minWidth: 210,

    backgroundColor:
      colors.surface,

    borderRadius: 15,

    padding: 20,

    borderWidth: 1,
    borderColor:
      colors.border,

    margin: 7,
  },

  cardTop: {
    flexDirection: 'row',

    justifyContent:
      'space-between',

    alignItems: 'center',

    marginBottom: 15,
  },

  cardIcon: {
    width: 45,
    height: 45,

    borderRadius: 12,

    backgroundColor:
      colors.primaryLight,

    justifyContent: 'center',
    alignItems: 'center',
  },

  cardIconText: {
    fontSize: 20,
  },

  cardArrow: {
    color:
      colors.textLight,

    fontSize: 28,
  },

  cardNumber: {
    ...typography.statNumber,

    color: colors.text,
  },

  cardTitle: {
    ...typography.cardTitle,

    color: colors.text,

    marginTop: 5,
  },

  cardDescription: {
    ...typography.bodySmall,

    color:
      colors.textSecondary,

    marginTop: 4,
  },

  /* ===================================================
     PARTE INFERIOR
  =================================================== */

  bottomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    marginHorizontal: -7,
  },

  panel: {
    flex: 2,

    minWidth: 450,

    backgroundColor:
      colors.surface,

    borderRadius: 15,

    borderWidth: 1,
    borderColor:
      colors.border,

    padding: 22,

    margin: 7,
  },

  panelSmall: {
    flex: 1,

    minWidth: 280,

    backgroundColor:
      colors.surface,

    borderRadius: 15,

    borderWidth: 1,
    borderColor:
      colors.border,

    padding: 22,

    margin: 7,
  },

  panelHeader: {
    flexDirection: 'row',

    justifyContent:
      'space-between',

    alignItems:
      'flex-start',
  },

  panelTitle: {
    ...typography.sectionTitle,

    color: colors.text,
  },

  panelSubtitle: {
    ...typography.bodySmall,

    color:
      colors.textSecondary,

    marginTop: 4,
  },

  seeAll: {
    ...typography.button,

    color: colors.primary,
  },

  /* ===================================================
     VAZIO
  =================================================== */

  empty: {
    minHeight: 210,

    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 30,

    marginBottom: 10,
  },

  emptyTitle: {
    ...typography.cardTitle,

    color: colors.text,
  },

  emptyText: {
    ...typography.bodySmall,

    color:
      colors.textSecondary,

    marginTop: 5,

    textAlign: 'center',
  },

  /* ===================================================
     STATUS
  =================================================== */

  statusRow: {
    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 22,
  },

  statusDot: {
    width: 10,
    height: 10,

    borderRadius: 5,

    marginRight: 12,
  },

  statusContent: {
    flex: 1,

    flexDirection: 'row',

    justifyContent:
      'space-between',

    alignItems: 'center',
  },

  statusTitle: {
    ...typography.body,

    color:
      colors.textSecondary,
  },

  statusNumber: {
    ...typography.cardTitle,

    color: colors.text,
  },

  divider: {
    height: 1,

    backgroundColor:
      colors.border,

    marginTop: 18,
  },

  /* ===================================================
     BOTÃO OCORRÊNCIAS
  =================================================== */

  occurrenceButton: {
    minHeight: 42,

    backgroundColor:
      colors.primaryLight,

    borderRadius: 9,

    justifyContent: 'center',
    alignItems: 'center',

    marginTop: 25,

    paddingHorizontal: 15,
  },

  occurrenceButtonText: {
    ...typography.button,

    color: colors.primary,
  },
});