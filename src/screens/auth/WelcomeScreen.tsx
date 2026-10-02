import React from 'react';
import {
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
  ArrowRight,
  Building2,
  Home,
  MessageCircle,
  ShieldCheck,
  Users,
} from 'lucide-react-native';

import { colors } from '../../theme/theme';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Welcome'
>;

export default function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom, 20) + 20,
          },
        ]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
      >
        {/* ÁREA AZUL */}
        <View
          style={[
            styles.hero,
            {
              paddingTop: Math.max(insets.top, 24) + 18,
            },
          ]}
        >
          {/* MARCA */}
          <View style={styles.brandRow}>
            <View style={styles.logo}>
              <Home
                size={28}
                color="#FFFFFF"
                strokeWidth={2.5}
              />
            </View>

            <View style={styles.brandContent}>
              <Text style={styles.brandName}>
                Conecta
                <Text style={styles.brandHighlight}>Lar</Text>
              </Text>

              <Text style={styles.brandSubtitle}>
                CONDOMÍNIO MAIS CONECTADO
              </Text>
            </View>
          </View>

          {/* APRESENTAÇÃO */}
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              Conectando pessoas,
            </Text>

            <Text style={styles.heroTitleHighlight}>
              valorizando o seu lar.
            </Text>

            <Text style={styles.heroDescription}>
              Comunicação, segurança e praticidade para facilitar
              a vida de todos no condomínio.
            </Text>
          </View>

          {/* BENEFÍCIOS */}
          <View style={styles.features}>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Users
                  size={20}
                  color="#FFFFFF"
                />
              </View>

              <Text style={styles.featureTitle}>
                Moradores
              </Text>

              <Text style={styles.featureDescription}>
                Mais integração
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <MessageCircle
                  size={20}
                  color="#FFFFFF"
                />
              </View>

              <Text style={styles.featureTitle}>
                Comunicação
              </Text>

              <Text style={styles.featureDescription}>
                Informação rápida
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <ShieldCheck
                  size={20}
                  color="#FFFFFF"
                />
              </View>

              <Text style={styles.featureTitle}>
                Segurança
              </Text>

              <Text style={styles.featureDescription}>
                Ambiente protegido
              </Text>
            </View>
          </View>
        </View>

        {/* ÁREA BRANCA */}
        <View style={styles.accessArea}>
          <Text style={styles.sectionLabel}>
            ESCOLHA SEU ACESSO
          </Text>

          <Text style={styles.sectionTitle}>
            Como deseja acessar?
          </Text>

          <Text style={styles.sectionDescription}>
            Selecione seu tipo de acesso para continuar.
          </Text>

          {/* MORADOR */}
          <Pressable
            style={({ pressed }) => [
              styles.residentCard,
              pressed && styles.pressed,
            ]}
            onPress={() => navigation.navigate('MoradorLogin')}
          >
            <View style={styles.residentIcon}>
              <Home
                size={28}
                color="#FFFFFF"
                strokeWidth={2.4}
              />
            </View>

            <View style={styles.cardContent}>
              <View style={styles.residentBadge}>
                <Text style={styles.residentBadgeText}>
                  ACESSO DO MORADOR
                </Text>
              </View>

              <Text style={styles.residentTitle}>
                Sou Morador
              </Text>

              <Text style={styles.residentDescription}>
                Acesse reservas, comunicados, ocorrências e
                serviços do condomínio.
              </Text>
            </View>

            <View style={styles.residentArrow}>
              <ArrowRight
                size={21}
                color="#FFFFFF"
              />
            </View>
          </Pressable>

          {/* ADMINISTRATIVO */}
          <Pressable
            style={({ pressed }) => [
              styles.adminCard,
              pressed && styles.pressed,
            ]}
            onPress={() => navigation.navigate('AdminLogin')}
          >
            <View style={styles.adminIcon}>
              <Building2
                size={27}
                color={colors.primary}
              />
            </View>

            <View style={styles.cardContent}>
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>
                  ÁREA RESTRITA
                </Text>
              </View>

              <Text style={styles.adminTitle}>
                Área Administrativa
              </Text>

              <Text style={styles.adminDescription}>
                Acesso para síndico, subsíndico e administração.
              </Text>
            </View>

            <View style={styles.adminArrow}>
              <ArrowRight
                size={20}
                color={colors.primary}
              />
            </View>
          </Pressable>

          {/* SEGURANÇA */}
          <View style={styles.securityCard}>
            <View style={styles.securityIcon}>
              <ShieldCheck
                size={23}
                color={colors.success}
              />
            </View>

            <View style={styles.securityContent}>
              <Text style={styles.securityTitle}>
                Ambiente seguro
              </Text>

              <Text style={styles.securityDescription}>
                Seus dados e informações do condomínio são
                protegidos e utilizados apenas para seu acesso.
              </Text>
            </View>
          </View>

          {/* RODAPÉ */}
          <View style={styles.footer}>
            <View style={styles.footerLine} />

            <Text style={styles.footerBrand}>
              Conecta
              <Text style={styles.footerHighlight}>Lar</Text>
            </Text>

            <Text style={styles.footerDescription}>
              Tecnologia a serviço do seu condomínio.
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
  },

  scrollContent: {
    flexGrow: 1,
  },

  // =========================
  // HERO
  // =========================

  hero: {
    backgroundColor: colors.primaryDark,

    paddingHorizontal: 20,
    paddingBottom: 28,

    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logo: {
    width: 52,
    height: 52,

    borderRadius: 16,

    backgroundColor: colors.primary,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },

  brandContent: {
    marginLeft: 13,
  },

  brandName: {
    color: '#FFFFFF',

    fontSize: 24,
    fontWeight: '800',

    letterSpacing: -0.5,
  },

  brandHighlight: {
    color: '#3B82F6',
  },

  brandSubtitle: {
    color: '#BFDBFE',

    fontSize: 8,
    fontWeight: '700',

    letterSpacing: 1.5,

    marginTop: 2,
  },

  heroContent: {
    marginTop: 28,
  },

  heroTitle: {
    color: '#FFFFFF',

    fontSize: 27,
    fontWeight: '800',

    lineHeight: 32,
  },

  heroTitleHighlight: {
    color: '#60A5FA',

    fontSize: 27,
    fontWeight: '800',

    lineHeight: 32,
  },

  heroDescription: {
    color: '#CBD5E1',

    fontSize: 12,
    lineHeight: 19,

    marginTop: 12,

    maxWidth: 330,
  },

  // =========================
  // BENEFÍCIOS
  // =========================

  features: {
    flexDirection: 'row',
    justifyContent: 'space-between',

    marginTop: 24,
  },

  featureCard: {
    width: '31.5%',

    minHeight: 105,

    backgroundColor: 'rgba(255,255,255,0.07)',

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',

    borderRadius: 17,

    paddingHorizontal: 10,
    paddingVertical: 11,
  },

  featureIcon: {
    width: 35,
    height: 35,

    borderRadius: 11,

    backgroundColor: colors.primary,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 10,
  },

  featureTitle: {
    color: '#FFFFFF',

    fontSize: 11,
    fontWeight: '800',
  },

  featureDescription: {
    color: '#BFDBFE',

    fontSize: 8,
    lineHeight: 12,

    marginTop: 3,
  },

  // =========================
  // ÁREA DE ACESSO
  // =========================

  accessArea: {
    paddingHorizontal: 20,
    paddingTop: 27,
  },

  sectionLabel: {
    color: colors.primary,

    fontSize: 9,
    fontWeight: '800',

    letterSpacing: 1.6,
  },

  sectionTitle: {
    color: colors.text,

    fontSize: 25,
    fontWeight: '800',

    letterSpacing: -0.5,

    marginTop: 6,
  },

  sectionDescription: {
    color: colors.textSecondary,

    fontSize: 12,

    marginTop: 4,
    marginBottom: 18,
  },

  // =========================
  // MORADOR
  // =========================

  residentCard: {
    minHeight: 122,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#1D4ED8',

    borderRadius: 20,

    paddingHorizontal: 15,
    paddingVertical: 15,
  },

  residentIcon: {
    width: 55,
    height: 55,

    borderRadius: 17,

    backgroundColor: 'rgba(255,255,255,0.14)',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 13,
  },

  cardContent: {
    flex: 1,

    paddingRight: 8,
  },

  residentBadge: {
    alignSelf: 'flex-start',

    backgroundColor: 'rgba(255,255,255,0.17)',

    borderRadius: 999,

    paddingHorizontal: 8,
    paddingVertical: 4,

    marginBottom: 5,
  },

  residentBadgeText: {
    color: '#FFFFFF',

    fontSize: 7,
    fontWeight: '800',
  },

  residentTitle: {
    color: '#FFFFFF',

    fontSize: 16,
    fontWeight: '800',
  },

  residentDescription: {
    color: '#DBEAFE',

    fontSize: 10,
    lineHeight: 15,

    marginTop: 4,
  },

  residentArrow: {
    width: 36,
    height: 36,

    borderRadius: 18,

    backgroundColor: 'rgba(255,255,255,0.14)',

    alignItems: 'center',
    justifyContent: 'center',
  },

  // =========================
  // ADMIN
  // =========================

  adminCard: {
    minHeight: 112,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: colors.surface,

    borderWidth: 1,
    borderColor: colors.border,

    borderRadius: 20,

    paddingHorizontal: 15,
    paddingVertical: 15,

    marginTop: 12,
  },

  adminIcon: {
    width: 55,
    height: 55,

    borderRadius: 17,

    backgroundColor: colors.primaryLight,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 13,
  },

  adminBadge: {
    alignSelf: 'flex-start',

    backgroundColor: colors.primaryLight,

    borderRadius: 999,

    paddingHorizontal: 8,
    paddingVertical: 4,

    marginBottom: 5,
  },

  adminBadgeText: {
    color: colors.primary,

    fontSize: 7,
    fontWeight: '800',
  },

  adminTitle: {
    color: colors.text,

    fontSize: 15,
    fontWeight: '800',
  },

  adminDescription: {
    color: colors.textSecondary,

    fontSize: 10,
    lineHeight: 15,

    marginTop: 4,
  },

  adminArrow: {
    width: 36,
    height: 36,

    borderRadius: 18,

    backgroundColor: colors.primaryLight,

    alignItems: 'center',
    justifyContent: 'center',
  },

  // =========================
  // SEGURANÇA
  // =========================

  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#F0FDF4',

    borderWidth: 1,
    borderColor: '#DCFCE7',

    borderRadius: 18,

    padding: 14,

    marginTop: 17,
  },

  securityIcon: {
    width: 45,
    height: 45,

    borderRadius: 14,

    backgroundColor: '#DCFCE7',

    alignItems: 'center',
    justifyContent: 'center',
  },

  securityContent: {
    flex: 1,

    marginLeft: 12,
  },

  securityTitle: {
    color: colors.text,

    fontSize: 12,
    fontWeight: '800',
  },

  securityDescription: {
    color: colors.textSecondary,

    fontSize: 9,
    lineHeight: 14,

    marginTop: 3,
  },

  // =========================
  // RODAPÉ
  // =========================

  footer: {
    alignItems: 'center',

    paddingTop: 22,
  },

  footerLine: {
    width: '100%',
    height: 1,

    backgroundColor: colors.border,

    marginBottom: 15,
  },

  footerBrand: {
    color: colors.primaryDark,

    fontSize: 13,
    fontWeight: '800',
  },

  footerHighlight: {
    color: colors.primary,
  },

  footerDescription: {
    color: colors.textLight,

    fontSize: 9,

    marginTop: 3,
  },

  pressed: {
    opacity: 0.82,

    transform: [
      {
        scale: 0.99,
      },
    ],
  },
});