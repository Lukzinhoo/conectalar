import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthStackParamList } from '../../../navigation/AuthNavigator';

import WebLayout from '../../../components/WebLayout';
import WebSidebar from '../../../components/WebSidebar';

import { colors } from '../../../theme/theme';
import { typography } from '../../../theme/typography';
import { supabase } from '../../../services/supabase';

/* =====================================================
   TIPOS
===================================================== */

type Props = NativeStackScreenProps<
  AuthStackParamList,
  'WebDashboard'
>;

type DashboardCardProps = {
  icon: string;
  number: string | number;
  title: string;
  description: string;
  onPress?: () => void;
  mobile?: boolean;
  tablet?: boolean;
};

type ReservaBanco = {
  id: string;
  morador_id: string;
  espaco_id: string;
  data: string;
  horario_inicio: string | null;
  horario_fim: string | null;
  status: string;
  criado_em: string;
};

type ReservaDashboard = ReservaBanco & {
  morador: string;
  espaco: string;
};

type OcorrenciaDashboard = {
  id: string;
  status: string;
};

/* =====================================================
   FUNÇÕES AUXILIARES
===================================================== */

function formatarData(data: string) {
  if (!data) {
    return '';
  }

  try {
    const partes = data.split('-');

    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    return data;
  } catch {
    return data;
  }
}

function formatarStatus(status: string) {
  switch (status) {
    case 'pendente':
      return 'Pendente';

    case 'aprovada':
      return 'Aprovada';

    case 'cancelada':
      return 'Cancelada';

    case 'recusada':
      return 'Recusada';

    default:
      return status;
  }
}

/* =====================================================
   DASHBOARD
===================================================== */

export default function WebDashboardScreen({
  navigation,
}: Props) {
  const { width } = useWindowDimensions();

  const isMobile = width < 768;
  const isTablet =
    width >= 768 && width < 1100;

  /* ===================================================
     ESTADOS
  =================================================== */

  const [totalMoradores, setTotalMoradores] =
    useState(0);

  const [totalReservas, setTotalReservas] =
    useState(0);

  const [totalOcorrencias, setTotalOcorrencias] =
    useState(0);

  const [totalComunicados, setTotalComunicados] =
    useState(0);

  const [ocorrenciasPendentes, setOcorrenciasPendentes] =
    useState(0);

  const [ocorrenciasResolvidas, setOcorrenciasResolvidas] =
    useState(0);

  const [reservasRecentes, setReservasRecentes] =
    useState<ReservaDashboard[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState('');

  /* ===================================================
     CARREGAR DASHBOARD
  =================================================== */

  const carregarDashboard = useCallback(
    async () => {
      try {
        setCarregando(true);
        setErro('');

        /*
         * ===============================================
         * MORADORES
         * ===============================================
         */

        const {
          count: moradoresCount,
          error: moradoresError,
        } = await supabase
          .from('perfis')
          .select('id', {
            count: 'exact',
            head: true,
          })
          .eq('tipo', 'morador');

        if (moradoresError) {
          throw moradoresError;
        }

        /*
         * ===============================================
         * RESERVAS
         * ===============================================
         */

        const {
          data: reservasData,
          error: reservasError,
        } = await supabase
          .from('reservas')
          .select(`
            id,
            morador_id,
            espaco_id,
            data,
            horario_inicio,
            horario_fim,
            status,
            criado_em
          `)
          .order('criado_em', {
            ascending: false,
          });

        if (reservasError) {
          throw reservasError;
        }

        const listaReservas =
          (reservasData ?? []) as ReservaBanco[];

        /*
         * ===============================================
         * OCORRÊNCIAS
         * ===============================================
         */

        const {
          data: ocorrenciasData,
          error: ocorrenciasError,
        } = await supabase
          .from('ocorrencias')
          .select('id, status');

        if (ocorrenciasError) {
          throw ocorrenciasError;
        }

        const listaOcorrencias =
          (ocorrenciasData ??
            []) as OcorrenciaDashboard[];

        /*
         * ===============================================
         * COMUNICADOS
         * ===============================================
         */

        const {
          count: comunicadosCount,
          error: comunicadosError,
        } = await supabase
          .from('comunicados')
          .select('id', {
            count: 'exact',
            head: true,
          });

        if (comunicadosError) {
          throw comunicadosError;
        }

        /*
         * ===============================================
         * RESERVAS RECENTES
         * ===============================================
         */

        const reservasParaDashboard =
          listaReservas.slice(0, 3);

        const moradorIds = [
          ...new Set(
            reservasParaDashboard
              .map(
                (item) =>
                  item.morador_id
              )
              .filter(Boolean)
          ),
        ];

        const espacoIds = [
          ...new Set(
            reservasParaDashboard
              .map(
                (item) =>
                  item.espaco_id
              )
              .filter(Boolean)
          ),
        ];

        let nomesMoradores: Record<
          string,
          string
        > = {};

        let nomesEspacos: Record<
          string,
          string
        > = {};

        /*
         * NOMES DOS MORADORES
         */

        if (moradorIds.length > 0) {
          const {
            data: perfisData,
            error: perfisError,
          } = await supabase
            .from('perfis')
            .select('id, nome')
            .in(
              'id',
              moradorIds
            );

          if (!perfisError) {
            nomesMoradores =
              Object.fromEntries(
                (
                  perfisData ?? []
                ).map(
                  (
                    perfil: any
                  ) => [
                    perfil.id,
                    perfil.nome,
                  ]
                )
              );
          }
        }

        /*
         * NOMES DOS ESPAÇOS
         */

        if (espacoIds.length > 0) {
          const {
            data: espacosData,
            error: espacosError,
          } = await supabase
            .from('espacos_reserva')
            .select('id, nome')
            .in(
              'id',
              espacoIds
            );

          if (!espacosError) {
            nomesEspacos =
              Object.fromEntries(
                (
                  espacosData ?? []
                ).map(
                  (
                    espaco: any
                  ) => [
                    espaco.id,
                    espaco.nome,
                  ]
                )
              );
          }
        }

        const reservasFormatadas:
          ReservaDashboard[] =
          reservasParaDashboard.map(
            (reserva) => ({
              ...reserva,

              morador:
                nomesMoradores[
                  reserva.morador_id
                ] ?? 'Morador',

              espaco:
                nomesEspacos[
                  reserva.espaco_id
                ] ?? 'Espaço',
            })
          );

        /*
         * ===============================================
         * CONTADORES
         * ===============================================
         */

        const pendentes =
          listaOcorrencias.filter(
            (item) =>
              item.status ===
              'pendente'
          ).length;

        const resolvidas =
          listaOcorrencias.filter(
            (item) =>
              item.status ===
              'resolvida'
          ).length;

        /*
         * ===============================================
         * ATUALIZAR TELA
         * ===============================================
         */

        setTotalMoradores(
          moradoresCount ?? 0
        );

        setTotalReservas(
          listaReservas.length
        );

        setTotalOcorrencias(
          listaOcorrencias.length
        );

        setTotalComunicados(
          comunicadosCount ?? 0
        );

        setOcorrenciasPendentes(
          pendentes
        );

        setOcorrenciasResolvidas(
          resolvidas
        );

        setReservasRecentes(
          reservasFormatadas
        );
      } catch (error: any) {
        console.error(
          'Erro ao carregar Dashboard:',
          error
        );

        setErro(
          error?.message ||
            'Não foi possível carregar as informações do Dashboard.'
        );
      } finally {
        setCarregando(false);
      }
    },
    []
  );

  /* ===================================================
     CARREGAMENTO INICIAL
  =================================================== */

  useEffect(() => {
    carregarDashboard();
  }, [carregarDashboard]);

  /* ===================================================
     RESERVAS RECENTES
  =================================================== */

  const blocoReservas = (
    <View
      style={
        isMobile
          ? styles.mobileSection
          : [
              styles.desktopPanel,
              styles.reservasDesktop,
            ]
      }
    >
      <View
        style={
          isMobile
            ? styles.mobileSectionHeader
            : styles.desktopPanelHeader
        }
      >
        <View style={styles.headerText}>
          <Text style={styles.panelTitle}>
            Reservas recentes
          </Text>

          <Text style={styles.panelSubtitle}>
            Últimas reservas realizadas
          </Text>
        </View>

        <TouchableOpacity
          style={
            isMobile
              ? styles.mobileLinkButton
              : styles.desktopLinkButton
          }
          onPress={() =>
            navigation.navigate(
              'WebReservas'
            )
          }
          activeOpacity={0.75}
        >
          <Text style={styles.seeAll}>
            Ver todas
          </Text>
        </TouchableOpacity>
      </View>

      {carregando ? (
        <View style={styles.loadingArea}>
          <ActivityIndicator
            size="small"
            color={colors.primary}
          />

          <Text style={styles.loadingText}>
            Carregando reservas...
          </Text>
        </View>
      ) : reservasRecentes.length === 0 ? (
        <View
          style={
            isMobile
              ? styles.mobileEmpty
              : styles.desktopEmpty
          }
        >
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
      ) : (
        <View style={styles.reservasLista}>
          {reservasRecentes.map(
            (reserva) => (
              <View
                key={reserva.id}
                style={styles.reservaItem}
              >
                <View
                  style={styles.reservaIcon}
                >
                  <Text
                    style={
                      styles.reservaIconText
                    }
                  >
                    📅
                  </Text>
                </View>

                <View
                  style={
                    styles.reservaInfo
                  }
                >
                  <Text
                    style={
                      styles.reservaEspaco
                    }
                    numberOfLines={1}
                  >
                    {reserva.espaco}
                  </Text>

                  <Text
                    style={
                      styles.reservaMorador
                    }
                    numberOfLines={1}
                  >
                    {reserva.morador}
                  </Text>

                  <Text
                    style={
                      styles.reservaData
                    }
                  >
                    {formatarData(
                      reserva.data
                    )}
                  </Text>
                </View>

                <View
                  style={
                    styles.reservaStatus
                  }
                >
                  <Text
                    style={
                      styles.reservaStatusText
                    }
                  >
                    {formatarStatus(
                      reserva.status
                    )}
                  </Text>
                </View>
              </View>
            )
          )}
        </View>
      )}
    </View>
  );

  /* ===================================================
     OCORRÊNCIAS
  =================================================== */

  const blocoOcorrencias = (
    <View
      style={
        isMobile
          ? styles.mobileSection
          : [
              styles.desktopPanel,
              styles.ocorrenciasDesktop,
            ]
      }
    >
      <View style={styles.occurrenceHeader}>
        <Text style={styles.panelTitle}>
          Ocorrências
        </Text>

        <Text style={styles.panelSubtitle}>
          Situação atual
        </Text>
      </View>

      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusDot,
            styles.pendingDot,
          ]}
        />

        <View style={styles.statusContent}>
          <Text style={styles.statusTitle}>
            Pendentes
          </Text>

          <Text style={styles.statusNumber}>
            {carregando
              ? '...'
              : ocorrenciasPendentes}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusDot,
            styles.resolvedDot,
          ]}
        />

        <View style={styles.statusContent}>
          <Text style={styles.statusTitle}>
            Resolvidas
          </Text>

          <Text style={styles.statusNumber}>
            {carregando
              ? '...'
              : ocorrenciasResolvidas}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.occurrenceButton}
        onPress={() =>
          navigation.navigate(
            'WebOcorrencias'
          )
        }
        activeOpacity={0.8}
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
  );

  /* ===================================================
     TELA
  =================================================== */

  return (
    <WebLayout
      sidebar={
        <WebSidebar active="dashboard" />
      }
      scroll
    >
      <View
        style={[
          styles.page,
          isMobile &&
            styles.pageMobile,
        ]}
      >
        {/* CABEÇALHO */}

        <View
          style={[
            styles.topHeader,
            isMobile &&
              styles.topHeaderMobile,
          ]}
        >
          <View
            style={[
              styles.topHeaderText,
              isMobile &&
                styles.topHeaderTextMobile,
            ]}
          >
            <Text
              style={[
                styles.pageTitle,
                isMobile &&
                  styles.pageTitleMobile,
              ]}
            >
              Dashboard
            </Text>

            <Text
              style={
                styles.pageSubtitle
              }
            >
              Visão geral do condomínio
            </Text>
          </View>

          <View
            style={[
              styles.adminArea,
              isMobile &&
                styles.adminAreaMobile,
            ]}
          >
            <View style={styles.avatar}>
              <Text
                style={
                  styles.avatarText
                }
              >
                A
              </Text>
            </View>

            <View style={styles.adminText}>
              <Text
                style={styles.adminName}
                numberOfLines={1}
              >
                Administrador
              </Text>

              <Text
                style={styles.adminRole}
                numberOfLines={1}
              >
                Administração
              </Text>
            </View>
          </View>
        </View>

        {/* BOAS-VINDAS */}

        <View
          style={[
            styles.welcome,
            isMobile &&
              styles.welcomeMobile,
          ]}
        >
          <Text
            style={[
              styles.welcomeTitle,
              isMobile &&
                styles.welcomeTitleMobile,
            ]}
          >
            Bem-vindo ao ConectaLar 👋
          </Text>

          <Text
            style={styles.welcomeText}
          >
            Acompanhe as principais informações do condomínio.
          </Text>
        </View>

        {/* ERRO */}

        {!!erro && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              {erro}
            </Text>

            <TouchableOpacity
              onPress={
                carregarDashboard
              }
              style={
                styles.retryButton
              }
            >
              <Text
                style={
                  styles.retryText
                }
              >
                Tentar novamente
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* CARDS */}

        <View
          style={[
            styles.cards,
            isMobile &&
              styles.cardsMobile,
          ]}
        >
          <DashboardCard
            icon="👥"
            number={
              carregando
                ? '...'
                : totalMoradores
            }
            title="Moradores"
            description="Moradores cadastrados"
            mobile={isMobile}
            tablet={isTablet}
            onPress={() =>
              navigation.navigate(
                'WebMoradores'
              )
            }
          />

          <DashboardCard
            icon="📅"
            number={
              carregando
                ? '...'
                : totalReservas
            }
            title="Reservas"
            description="Reservas cadastradas"
            mobile={isMobile}
            tablet={isTablet}
            onPress={() =>
              navigation.navigate(
                'WebReservas'
              )
            }
          />

          <DashboardCard
            icon="🚨"
            number={
              carregando
                ? '...'
                : totalOcorrencias
            }
            title="Ocorrências"
            description="Ocorrências registradas"
            mobile={isMobile}
            tablet={isTablet}
            onPress={() =>
              navigation.navigate(
                'WebOcorrencias'
              )
            }
          />

          <DashboardCard
            icon="📢"
            number={
              carregando
                ? '...'
                : totalComunicados
            }
            title="Comunicados"
            description="Comunicados publicados"
            mobile={isMobile}
            tablet={isTablet}
            onPress={() =>
              navigation.navigate(
                'WebComunicados'
              )
            }
          />
        </View>

        {/* PARTE INFERIOR */}

        {isMobile ? (
          <View
            style={
              styles.mobileBottom
            }
          >
            {blocoReservas}

            {blocoOcorrencias}
          </View>
        ) : (
          <View
            style={[
              styles.desktopBottom,
              isTablet &&
                styles.desktopBottomTablet,
            ]}
          >
            {blocoReservas}

            {blocoOcorrencias}
          </View>
        )}
      </View>
    </WebLayout>
  );
}

/* =====================================================
   CARD
===================================================== */

function DashboardCard({
  icon,
  number,
  title,
  description,
  onPress,
  mobile = false,
  tablet = false,
}: DashboardCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        mobile &&
          styles.cardMobile,
        tablet &&
          styles.cardTablet,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          <Text
            style={
              styles.cardIconText
            }
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
        style={
          styles.cardDescription
        }
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
  page: {
    width: '100%',
    minWidth: 0,
    paddingBottom: 35,
  },

  pageMobile: {
    width: '100%',
    minWidth: 0,
    paddingBottom: 45,
  },

  /* HEADER */

  topHeader: {
    width: '100%',
    minHeight: 80,

    backgroundColor:
      colors.surface,

    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,

    paddingHorizontal: 20,
    paddingVertical: 15,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',

    marginBottom: 25,
  },

  topHeaderMobile: {
    paddingHorizontal: 15,
    paddingVertical: 15,

    flexDirection: 'column',
    alignItems: 'flex-start',

    marginBottom: 18,
  },

  topHeaderText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 20,
  },

  topHeaderTextMobile: {
    width: '100%',
    flex: 0,
    paddingRight: 0,
  },

  pageTitle: {
    ...typography.pageTitle,
    color: colors.text,
  },

  pageTitleMobile: {
    fontSize: 22,
    lineHeight: 28,
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

  adminAreaMobile: {
    width: '100%',

    marginTop: 14,
    paddingTop: 14,

    borderTopWidth: 1,
    borderTopColor:
      colors.border,
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

  adminText: {
    flex: 1,
    minWidth: 0,
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

  /* WELCOME */

  welcome: {
    width: '100%',
    marginBottom: 25,
  },

  welcomeMobile: {
    marginBottom: 18,
  },

  welcomeTitle: {
    ...typography.pageTitle,
    color: colors.text,
  },

  welcomeTitleMobile: {
    fontSize: 21,
    lineHeight: 28,
  },

  welcomeText: {
    ...typography.body,
    color:
      colors.textSecondary,
    marginTop: 5,
  },

  /* ERRO */

  errorBox: {
    width: '100%',

    backgroundColor:
      colors.dangerLight,

    borderRadius: 10,

    padding: 14,

    marginBottom: 18,

    borderWidth: 1,
    borderColor:
      colors.danger,
  },

  errorText: {
    ...typography.bodySmall,
    color: colors.danger,
  },

  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },

  retryText: {
    ...typography.button,
    color: colors.danger,
  },

  /* CARDS */

  cards: {
    width: '100%',

    flexDirection: 'row',
    flexWrap: 'wrap',

    marginHorizontal: -7,
    marginBottom: 18,
  },

  cardsMobile: {
    flexDirection: 'column',
    flexWrap: 'nowrap',

    marginHorizontal: 0,
    marginBottom: 14,
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
    borderColor: colors.border,

    margin: 7,
  },

  cardTablet: {
    flexBasis: '45%',
  },

  cardMobile: {
    width: '100%',
    minWidth: 0,

    flex: 0,
    flexGrow: 0,
    flexShrink: 0,

    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 10,

    padding: 17,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',

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
    color: colors.textLight,
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

  /* MOBILE BOTTOM */

  mobileBottom: {
    width: '100%',
  },

  mobileSection: {
    width: '100%',

    backgroundColor:
      colors.surface,

    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,

    paddingHorizontal: 18,
    paddingVertical: 18,

    marginBottom: 16,
  },

  mobileSectionHeader: {
    width: '100%',
  },

  headerText: {
    width: '100%',
  },

  mobileLinkButton: {
    alignSelf: 'flex-start',

    marginTop: 9,

    paddingVertical: 4,
  },

  mobileEmpty: {
    width: '100%',

    paddingTop: 22,
    paddingBottom: 14,

    alignItems: 'center',
    justifyContent: 'center',
  },

  /* DESKTOP */

  desktopBottom: {
    width: '100%',

    flexDirection: 'row',
    alignItems: 'stretch',

    marginHorizontal: -7,
  },

  desktopBottomTablet: {
    flexDirection: 'column',
    marginHorizontal: 0,
  },

  desktopPanel: {
    backgroundColor:
      colors.surface,

    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,

    padding: 22,

    margin: 7,
  },

  reservasDesktop: {
    flex: 2,
    minWidth: 420,
  },

  ocorrenciasDesktop: {
    flex: 1,
    minWidth: 280,
  },

  desktopPanelHeader: {
    width: '100%',

    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent:
      'space-between',
  },

  desktopLinkButton: {
    marginLeft: 15,
    paddingVertical: 4,
  },

  desktopEmpty: {
    minHeight: 190,

    justifyContent: 'center',
    alignItems: 'center',

    paddingHorizontal: 15,
  },

  /* TÍTULOS */

  panelTitle: {
    ...typography.sectionTitle,
    color: colors.text,
  },

  panelSubtitle: {
    ...typography.bodySmall,
    color:
      colors.textSecondary,
    marginTop: 5,
  },

  seeAll: {
    ...typography.button,
    color: colors.primary,
  },

  /* LOADING */

  loadingArea: {
    width: '100%',

    minHeight: 150,

    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    ...typography.bodySmall,

    color:
      colors.textSecondary,

    marginTop: 10,
  },

  /* EMPTY */

  emptyIcon: {
    fontSize: 30,
    marginBottom: 9,
  },

  emptyTitle: {
    ...typography.cardTitle,
    color: colors.text,
    textAlign: 'center',
  },

  emptyText: {
    ...typography.bodySmall,

    color:
      colors.textSecondary,

    marginTop: 5,

    textAlign: 'center',
  },

  /* RESERVAS */

  reservasLista: {
    width: '100%',
    marginTop: 16,
  },

  reservaItem: {
    width: '100%',

    flexDirection: 'row',
    alignItems: 'center',

    paddingVertical: 12,

    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },

  reservaIcon: {
    width: 40,
    height: 40,

    borderRadius: 10,

    backgroundColor:
      colors.primaryLight,

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 11,

    flexShrink: 0,
  },

  reservaIconText: {
    fontSize: 17,
  },

  reservaInfo: {
    flex: 1,
    minWidth: 0,
  },

  reservaEspaco: {
    ...typography.cardTitle,

    color: colors.text,
  },

  reservaMorador: {
    ...typography.bodySmall,

    color:
      colors.textSecondary,

    marginTop: 2,
  },

  reservaData: {
    ...typography.caption,

    color:
      colors.textLight,

    marginTop: 3,
  },

  reservaStatus: {
    marginLeft: 10,

    paddingHorizontal: 9,
    paddingVertical: 5,

    borderRadius: 8,

    backgroundColor:
      colors.primaryLight,

    flexShrink: 0,
  },

  reservaStatusText: {
    ...typography.caption,

    color: colors.primary,

    fontWeight: '700',
  },

  /* OCORRÊNCIAS */

  occurrenceHeader: {
    width: '100%',
    marginBottom: 7,
  },

  statusRow: {
    width: '100%',

    minHeight: 45,

    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 14,
  },

  statusDot: {
    width: 10,
    height: 10,

    borderRadius: 5,

    marginRight: 12,
  },

  pendingDot: {
    backgroundColor: '#F59E0B',
  },

  resolvedDot: {
    backgroundColor: '#22C55E',
  },

  statusContent: {
    flex: 1,
    minWidth: 0,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
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
    width: '100%',
    height: 1,

    backgroundColor:
      colors.border,

    marginTop: 10,
  },

  occurrenceButton: {
    width: '100%',

    minHeight: 44,

    backgroundColor:
      colors.primaryLight,

    borderRadius: 9,

    justifyContent: 'center',
    alignItems: 'center',

    marginTop: 18,

    paddingHorizontal: 15,
    paddingVertical: 10,
  },

  occurrenceButtonText: {
    ...typography.button,
    color: colors.primary,
  },
});