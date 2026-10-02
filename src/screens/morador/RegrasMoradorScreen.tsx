import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileText,
} from 'lucide-react-native';

import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../theme/theme';
import { supabase } from '../../services/supabase';

type Regra = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  ativa: boolean;
  created_at: string;
  updated_at: string;
};

export default function RegrasMoradorScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [regras, setRegras] =
    useState<Regra[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [atualizando, setAtualizando] =
    useState(false);

  const carregarRegras =
    useCallback(async () => {
      try {
        const { data, error } = await supabase
          .from('regras')
          .select('*')
          .eq('ativa', true)
          .order('categoria', {
            ascending: true,
          })
          .order('created_at', {
            ascending: false,
          });

        if (error) {
          console.error(
            'Erro ao carregar regras:',
            error
          );

          return;
        }

        setRegras(data || []);
      } catch (error) {
        console.error(
          'Erro ao carregar regras:',
          error
        );
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    }, []);

  useFocusEffect(
    useCallback(() => {
      carregarRegras();
    }, [carregarRegras])
  );

  function atualizar() {
    setAtualizando(true);
    carregarRegras();
  }

  return (
    <View style={styles.container}>
      {/* CABEÇALHO */}

      <View
        style={[
          styles.header,
          {
            paddingTop:
              Math.max(insets.top, 20) + 8,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft
            size={22}
            color="#FFFFFF"
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>
            Regras
          </Text>

          <Text style={styles.headerSubtitle}>
            Regras do condomínio
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <BookOpen
            size={22}
            color="#FFFFFF"
          />
        </View>
      </View>

      {/* CONTEÚDO */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom:
              Math.max(insets.bottom, 20) +
              20,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={atualizar}
          />
        }
      >
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <FileText
              size={24}
              color={colors.primary}
            />
          </View>

          <View style={styles.introContent}>
            <Text style={styles.introLabel}>
              CONVIVÊNCIA
            </Text>

            <Text style={styles.introTitle}>
              Regras do condomínio
            </Text>

            <Text
              style={styles.introDescription}
            >
              Consulte as normas e orientações
              para uma boa convivência no
              condomínio.
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Regras e orientações
          </Text>

          <Text
            style={styles.sectionDescription}
          >
            Confira abaixo as regras atualmente
            em vigor.
          </Text>
        </View>

        {carregando ? (
          <View style={styles.loading}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />

            <Text style={styles.loadingText}>
              Carregando regras...
            </Text>
          </View>
        ) : regras.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <BookOpen
                size={30}
                color={colors.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              Nenhuma regra disponível
            </Text>

            <Text
              style={styles.emptyDescription}
            >
              No momento não existem regras
              ativas cadastradas pela
              administração.
            </Text>
          </View>
        ) : (
          regras.map((regra) => (
            <View
              key={regra.id}
              style={styles.regraCard}
            >
              <View style={styles.regraTop}>
                <View
                  style={styles.regraIcon}
                >
                  <FileText
                    size={20}
                    color={colors.primary}
                  />
                </View>

                <View
                  style={styles.regraHeader}
                >
                  <Text
                    style={
                      styles.regraCategoria
                    }
                  >
                    {regra.categoria}
                  </Text>

                  <Text
                    style={styles.regraTitulo}
                  >
                    {regra.titulo}
                  </Text>
                </View>

                <View
                  style={styles.activeBadge}
                >
                  <CheckCircle2
                    size={15}
                    color="#16A34A"
                  />
                </View>
              </View>

              <View
                style={styles.divider}
              />

              <Text
                style={styles.regraDescricao}
              >
                {regra.descricao}
              </Text>
            </View>
          ))
        )}

        {!carregando &&
        regras.length > 0 ? (
          <View style={styles.infoCard}>
            <BookOpen
              size={18}
              color={colors.primary}
            />

            <Text style={styles.infoText}>
              Estas regras são definidas pela
              administração do condomínio.
              Alterações serão atualizadas nesta
              página.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  header: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 18,
    paddingBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor:
      'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pressed: {
    opacity: 0.7,
  },

  headerText: {
    flex: 1,
    marginLeft: 13,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },

  headerSubtitle: {
    color: '#CBD5E1',
    fontSize: 10,
    marginTop: 2,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor:
      'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 20,
  },

  introCard: {
    minHeight: 100,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 20,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  introIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  introContent: {
    flex: 1,
    marginLeft: 13,
  },

  introLabel: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  introTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },

  introDescription: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  sectionHeader: {
    marginTop: 24,
    marginBottom: 14,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },

  sectionDescription: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 12,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 25,
    paddingVertical: 42,
    alignItems: 'center',
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 16,
  },

  emptyDescription: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 270,
  },

  regraCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 19,
    padding: 15,
    marginBottom: 11,
  },

  regraTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  regraIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  regraHeader: {
    flex: 1,
    marginLeft: 11,
  },

  regraCategoria: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  regraTitulo: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },

  activeBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },

  regraDescricao: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 18,
  },

  infoCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 16,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 5,
  },

  infoText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
    marginLeft: 9,
  },
});