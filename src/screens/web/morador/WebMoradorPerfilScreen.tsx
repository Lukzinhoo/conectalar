import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  AtSign,
  CheckCircle2,
  Home,
  IdCard,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react-native';

import { colors } from '../../../theme/theme';
import WebMoradorSidebar from '../../../components/WebMoradorSidebar';
import WebLayout from '../../../components/WebLayout';
import { supabase } from '../../../services/supabase';

/* =========================================================
   TIPOS
========================================================= */

type PerfilMorador = {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  casa: string;
  quadra: string;
  bloco: string;
  apartamento: string;
  tipo_residencia: string;
  tipo: string;
  ativo: boolean;
};

/* =========================================================
   TELA
========================================================= */

export default function WebMoradorPerfilScreen() {
  const { width } = useWindowDimensions();

  const isMobile = width < 768;

  const [carregando, setCarregando] = useState(true);

  const [perfil, setPerfil] =
    useState<PerfilMorador | null>(null);

  /* =======================================================
     CARREGAR PERFIL
  ======================================================= */

  useEffect(() => {
    carregarPerfil();
  }, []);

  async function carregarPerfil() {
    try {
      setCarregando(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error('Usuário não autenticado.');
      }

      /*
       * Primeiro tenta localizar o perfil pelo ID
       * do usuário autenticado.
       */
      let { data, error } = await supabase
        .from('perfis')
        .select(`
          id,
          nome,
          email,
          cpf,
          telefone,
          casa,
          quadra,
          bloco,
          apartamento,
          tipo_residencia,
          tipo,
          ativo
        `)
        .eq('id', user.id)
        .maybeSingle();

      /*
       * Compatibilidade com cadastros antigos.
       *
       * Caso o perfil não seja encontrado pelo ID,
       * tenta localizar pelo e-mail.
       */
      if (!data && !error && user.email) {
        const resultado = await supabase
          .from('perfis')
          .select(`
            id,
            nome,
            email,
            cpf,
            telefone,
            casa,
            quadra,
            bloco,
            apartamento,
            tipo_residencia,
            tipo,
            ativo
          `)
          .eq('email', user.email)
          .maybeSingle();

        data = resultado.data;
        error = resultado.error;
      }

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(
          'Não foi possível localizar o perfil deste morador.'
        );
      }

      const perfilFormatado: PerfilMorador = {
        id: data.id ?? '',
        nome: data.nome ?? '',
        email: data.email ?? '',
        cpf: data.cpf ?? '',
        telefone: data.telefone ?? '',
        casa: data.casa ?? '',
        quadra: data.quadra ?? '',
        bloco: data.bloco ?? '',
        apartamento: data.apartamento ?? '',
        tipo_residencia: data.tipo_residencia ?? '',
        tipo: data.tipo ?? 'morador',
        ativo: data.ativo ?? true,
      };

      setPerfil(perfilFormatado);
    } catch (error: any) {
      console.error(
        'Erro ao carregar perfil:',
        error
      );

      Alert.alert(
        'Erro',
        error?.message ||
          'Não foi possível carregar os dados do perfil.'
      );
    } finally {
      setCarregando(false);
    }
  }

  /* =======================================================
     RESIDÊNCIA
  ======================================================= */

  function obterUnidade() {
    if (!perfil) {
      return '-';
    }

    if (
      perfil.tipo_residencia ===
      'apartamento_bloco'
    ) {
      return (
        perfil.apartamento ||
        perfil.casa ||
        '-'
      );
    }

    return (
      perfil.casa ||
      perfil.apartamento ||
      '-'
    );
  }

  function obterQuadraBloco() {
    if (!perfil) {
      return '-';
    }

    if (
      perfil.tipo_residencia ===
      'apartamento_bloco'
    ) {
      return (
        perfil.bloco ||
        perfil.quadra ||
        '-'
      );
    }

    if (
      perfil.tipo_residencia ===
      'casa_quadra'
    ) {
      return perfil.quadra || '-';
    }

    return (
      perfil.quadra ||
      perfil.bloco ||
      '-'
    );
  }

  /* =======================================================
     CARREGANDO
  ======================================================= */

  if (carregando) {
    return (
      <WebLayout
        sidebar={
          <WebMoradorSidebar active="perfil" />
        }
      >
        <View style={styles.loadingPage}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text style={styles.loadingText}>
            Carregando seu perfil...
          </Text>
        </View>
      </WebLayout>
    );
  }

  /* =======================================================
     PERFIL NÃO ENCONTRADO
  ======================================================= */

  if (!perfil) {
    return (
      <WebLayout
        sidebar={
          <WebMoradorSidebar active="perfil" />
        }
      >
        <View style={styles.loadingPage}>
          <User
            size={42}
            color={colors.textSecondary}
          />

          <Text style={styles.errorTitle}>
            Perfil não encontrado
          </Text>

          <Text style={styles.errorText}>
            Não foi possível localizar os dados
            da sua conta.
          </Text>
        </View>
      </WebLayout>
    );
  }

  /* =======================================================
     DADOS PESSOAIS
  ======================================================= */

  const dadosPessoais = (
    <View
      style={
        isMobile
          ? styles.panelMobile
          : styles.panelDesktop
      }
    >
      <PanelHeader
        icon={
          <IdCard
            size={20}
            color={colors.primary}
          />
        }
        title="Dados pessoais"
        subtitle="Informações cadastradas na sua conta."
      />

      <View style={styles.form}>
        <Field
          label="Nome completo"
          icon={
            <User
              size={16}
              color={colors.textSecondary}
            />
          }
          value={
            perfil.nome ||
            'Não informado'
          }
        />

        <Field
          label="E-mail"
          icon={
            <Mail
              size={16}
              color={colors.textSecondary}
            />
          }
          value={
            perfil.email ||
            'Não informado'
          }
        />

        <Field
          label="CPF"
          icon={
            <IdCard
              size={16}
              color={colors.textSecondary}
            />
          }
          value={
            perfil.cpf ||
            'Não informado'
          }
        />

        <Field
          label="Telefone"
          icon={
            <Phone
              size={16}
              color={colors.textSecondary}
            />
          }
          value={
            perfil.telefone ||
            'Não informado'
          }
          ultimo
        />
      </View>
    </View>
  );

  /* =======================================================
     RESIDÊNCIA
  ======================================================= */

  const residencia = (
    <View
      style={
        isMobile
          ? styles.panelMobile
          : styles.panelDesktop
      }
    >
      <PanelHeader
        icon={
          <Home
            size={20}
            color={colors.primary}
          />
        }
        title="Residência"
        subtitle="Informações da sua unidade."
      />

      <View style={styles.form}>
        <Field
          label="Casa / Unidade"
          icon={
            <Home
              size={16}
              color={colors.textSecondary}
            />
          }
          value={obterUnidade()}
        />

        <Field
          label="Quadra / Bloco"
          icon={
            <MapPin
              size={16}
              color={colors.textSecondary}
            />
          }
          value={obterQuadraBloco()}
          ultimo
        />
      </View>

      <View style={styles.residenceNotice}>
        <ShieldCheck
          size={18}
          color={colors.primary}
        />

        <Text
          style={styles.residenceNoticeText}
        >
          Os dados da residência são administrados
          pelo condomínio. Para solicitar qualquer
          alteração, entre em contato com a
          administração.
        </Text>
      </View>
    </View>
  );

  /* =======================================================
     CONTEÚDO
  ======================================================= */

  return (
    <WebLayout
      sidebar={
        <WebMoradorSidebar active="perfil" />
      }
    >
      <View
        style={[
          styles.page,
          isMobile && styles.pageMobile,
        ]}
      >

        {/* ===============================================
            CABEÇALHO
        =============================================== */}

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text
              style={[
                styles.title,
                isMobile &&
                  styles.titleMobile,
              ]}
            >
              Meu Perfil
            </Text>

            <Text style={styles.subtitle}>
              Consulte seus dados pessoais e
              informações da residência.
            </Text>
          </View>
        </View>

        {/* ===============================================
            CARTÃO PRINCIPAL
        =============================================== */}

        <View
          style={[
            styles.profileCard,
            isMobile &&
              styles.profileCardMobile,
          ]}
        >
          <View
            style={[
              styles.profileAvatar,
              isMobile &&
                styles.profileAvatarMobile,
            ]}
          >
            <User
              size={36}
              color={colors.primary}
            />
          </View>

          <View
            style={[
              styles.profileInfo,
              isMobile &&
                styles.profileInfoMobile,
            ]}
          >
            <Text
              style={[
                styles.profileName,
                isMobile &&
                  styles.profileNameMobile,
              ]}
            >
              {perfil.nome || 'Morador'}
            </Text>

            <Text style={styles.profileEmail}>
              {perfil.email ||
                'E-mail não informado'}
            </Text>

            <View
              style={[
                styles.statusRow,
                isMobile &&
                  styles.statusRowMobile,
              ]}
            >
              <View
                style={
                  perfil.ativo
                    ? styles.activeBadge
                    : styles.inactiveBadge
                }
              >
                <CheckCircle2
                  size={13}
                  color={
                    perfil.ativo
                      ? '#15803D'
                      : colors.danger
                  }
                />

                <Text
                  style={
                    perfil.ativo
                      ? styles.activeText
                      : styles.inactiveText
                  }
                >
                  {perfil.ativo
                    ? 'Conta ativa'
                    : 'Conta inativa'}
                </Text>
              </View>

              <View style={styles.residentBadge}>
                <Home
                  size={13}
                  color={colors.primary}
                />

                <Text style={styles.residentText}>
                  Morador
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ===============================================
            DADOS + RESIDÊNCIA

            Mobile:
            um card embaixo do outro.

            Desktop:
            dois cards lado a lado.
        =============================================== */}

        {isMobile ? (
          <View style={styles.mobilePanels}>
            {dadosPessoais}
            {residencia}
          </View>
        ) : (
          <View style={styles.desktopColumns}>
            {dadosPessoais}
            {residencia}
          </View>
        )}

        {/* ===============================================
            AVISO DE ALTERAÇÃO
        =============================================== */}

        <View style={styles.adminNotice}>
          <View style={styles.adminNoticeIcon}>
            <ShieldCheck
              size={22}
              color={colors.primary}
            />
          </View>

          <View style={styles.adminNoticeContent}>
            <Text style={styles.adminNoticeTitle}>
              Alteração de dados
            </Text>

            <Text style={styles.adminNoticeText}>
              Os dados deste perfil são gerenciados
              pela administração do condomínio.
              Caso alguma informação esteja incorreta
              ou precise ser atualizada, entre em
              contato com a administração.
            </Text>
          </View>
        </View>

        {/* ===============================================
            CONTA E SEGURANÇA
        =============================================== */}

        <View style={styles.accountPanel}>
          <PanelHeader
            icon={
              <ShieldCheck
                size={20}
                color={colors.primary}
              />
            }
            title="Conta e segurança"
            subtitle="Informações de acesso à plataforma."
          />

          <View
            style={[
              styles.accountGrid,
              isMobile &&
                styles.accountGridMobile,
            ]}
          >
            <AccountItem
              icon={
                <AtSign
                  size={18}
                  color={colors.primary}
                />
              }
              label="E-mail"
              value={
                perfil.email ||
                'Não informado'
              }
              mobile={isMobile}
            />

            <AccountItem
              icon={
                <Lock
                  size={18}
                  color={colors.primary}
                />
              }
              label="Senha"
              value="Protegida"
              mobile={isMobile}
            />

            <AccountItem
              icon={
                <CheckCircle2
                  size={18}
                  color={
                    perfil.ativo
                      ? '#15803D'
                      : colors.danger
                  }
                />
              }
              label="Status da conta"
              value={
                perfil.ativo
                  ? 'Ativa'
                  : 'Inativa'
              }
              mobile={isMobile}
              ultimo
              ativo={perfil.ativo}
            />
          </View>
        </View>

        {/* ===============================================
            AVISO FINAL
        =============================================== */}

        <View style={styles.footerNotice}>
          <ShieldCheck
            size={20}
            color={colors.primary}
          />

          <View
            style={styles.footerNoticeContent}
          >
            <Text
              style={styles.footerNoticeTitle}
            >
              Seus dados
            </Text>

            <Text
              style={styles.footerNoticeText}
            >
              Esta página é apenas para consulta.
              Alterações de nome, e-mail, telefone,
              CPF ou residência deverão ser
              solicitadas à administração do
              condomínio.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </View>
    </WebLayout>
  );
}

/* =========================================================
   CABEÇALHO DOS PAINÉIS
========================================================= */

type PanelHeaderProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
};

function PanelHeader({
  icon,
  title,
  subtitle,
}: PanelHeaderProps) {
  return (
    <View style={styles.panelHeader}>
      <View style={styles.panelIcon}>
        {icon}
      </View>

      <View style={styles.panelHeaderText}>
        <Text style={styles.panelTitle}>
          {title}
        </Text>

        <Text style={styles.panelSubtitle}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

/* =========================================================
   CAMPO SOMENTE LEITURA
========================================================= */

type FieldProps = {
  label: string;
  icon: React.ReactNode;
  value: string;
  ultimo?: boolean;
};

function Field({
  label,
  icon,
  value,
  ultimo = false,
}: FieldProps) {
  return (
    <View
      style={[
        styles.field,
        ultimo && styles.fieldLast,
      ]}
    >
      <Text style={styles.fieldLabel}>
        {label}
      </Text>

      <View style={styles.readOnlyContainer}>
        <View style={styles.inputIcon}>
          {icon}
        </View>

        <Text
          style={styles.readOnlyValue}
          numberOfLines={2}
        >
          {value || 'Não informado'}
        </Text>

        <View style={styles.lockArea}>
          <Lock
            size={12}
            color={colors.textLight}
          />
        </View>
      </View>
    </View>
  );
}

/* =========================================================
   ITEM DA CONTA
========================================================= */

type AccountItemProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  mobile: boolean;
  ultimo?: boolean;
  ativo?: boolean;
};

function AccountItem({
  icon,
  label,
  value,
  mobile,
  ultimo = false,
  ativo = false,
}: AccountItemProps) {
  return (
    <View
      style={[
        styles.accountItem,
        ultimo &&
          styles.accountItemLast,
        mobile &&
          styles.accountItemMobile,
      ]}
    >
      <View style={styles.accountItemIcon}>
        {icon}
      </View>

      <View style={styles.accountItemText}>
        <Text style={styles.accountLabel}>
          {label}
        </Text>

        <Text
          numberOfLines={2}
          style={[
            styles.accountValue,
            ativo &&
              styles.accountValueActive,
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

/* =========================================================
   ESTILOS
========================================================= */

const styles = StyleSheet.create({
  /* =====================================================
     PÁGINA
  ===================================================== */

  page: {
    width: '100%',
    minWidth: 0,
  },

  pageMobile: {
    width: '100%',
    minWidth: 0,
    paddingBottom: 20,
  },

  /* =====================================================
     CARREGAMENTO
  ===================================================== */

  loadingPage: {
    width: '100%',
    minHeight: 500,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 14,
  },

  errorTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 15,
  },

  errorText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 7,
  },

  /* =====================================================
     CABEÇALHO
  ===================================================== */

  header: {
    width: '100%',
    marginBottom: 22,
  },

  headerText: {
    width: '100%',
    minWidth: 0,
  },

  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },

  titleMobile: {
    fontSize: 23,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  /* =====================================================
     CARTÃO DO PERFIL
  ===================================================== */

  profileCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  profileCardMobile: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 24,
  },

  profileAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
    flexShrink: 0,
  },

  profileAvatarMobile: {
    marginRight: 0,
  },

  profileInfo: {
    flex: 1,
    minWidth: 0,
  },

  profileInfoMobile: {
    width: '100%',
    flex: 0,
    alignItems: 'center',
    marginTop: 15,
  },

  profileName: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
  },

  profileNameMobile: {
    textAlign: 'center',
  },

  profileEmail: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 5,
    textAlign: 'center',
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 11,
  },

  statusRowMobile: {
    flexWrap: 'wrap',
    justifyContent: 'center',
  },

  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginRight: 7,
    marginBottom: 4,
  },

  activeText: {
    color: '#15803D',
    fontSize: 8,
    fontWeight: '800',
    marginLeft: 4,
  },

  inactiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginRight: 7,
    marginBottom: 4,
  },

  inactiveText: {
    color: colors.danger,
    fontSize: 8,
    fontWeight: '800',
    marginLeft: 4,
  },

  residentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginBottom: 4,
  },

  residentText: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: '800',
    marginLeft: 4,
  },

  /* =====================================================
     PAINÉIS DESKTOP
  ===================================================== */

  desktopColumns: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: -6,
    marginBottom: 2,
  },

  panelDesktop: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 18,
    marginHorizontal: 6,
    marginBottom: 14,
  },

  /* =====================================================
     PAINÉIS MOBILE
  ===================================================== */

  mobilePanels: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'stretch',
  },

  panelMobile: {
    width: '100%',
    minWidth: 0,

    backgroundColor: colors.surface,

    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,

    paddingHorizontal: 16,
    paddingVertical: 18,

    marginBottom: 16,

    alignSelf: 'stretch',
  },

  /* =====================================================
     CABEÇALHO DOS PAINÉIS
  ===================================================== */

  panelHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  panelHeaderText: {
    flex: 1,
    minWidth: 0,
  },

  panelIcon: {
    width: 44,
    height: 44,
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },

  panelTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },

  panelSubtitle: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  /* =====================================================
     CAMPOS SOMENTE LEITURA
  ===================================================== */

  form: {
    width: '100%',
  },

  field: {
    width: '100%',
    marginBottom: 16,
  },

  fieldLast: {
    marginBottom: 0,
  },

  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 7,
  },

  readOnlyContainer: {
    width: '100%',
    minHeight: 48,

    flexDirection: 'row',
    alignItems: 'center',

    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,

    backgroundColor: colors.background,

    paddingVertical: 5,
  },

  inputIcon: {
    width: 44,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  readOnlyValue: {
    flex: 1,
    minWidth: 0,

    color: colors.text,

    fontSize: 10,
    lineHeight: 15,
    fontWeight: '600',

    paddingRight: 8,
  },

  lockArea: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  /* =====================================================
     RESIDÊNCIA
  ===================================================== */

  residenceNotice: {
    width: '100%',

    backgroundColor: colors.primaryLight,

    borderRadius: 10,

    paddingHorizontal: 12,
    paddingVertical: 13,

    flexDirection: 'row',
    alignItems: 'flex-start',

    marginTop: 18,
  },

  residenceNoticeText: {
    flex: 1,
    minWidth: 0,

    color: colors.textSecondary,

    fontSize: 9,
    lineHeight: 16,

    marginLeft: 8,
  },

  /* =====================================================
     AVISO ADMINISTRAÇÃO
  ===================================================== */

  adminNotice: {
    width: '100%',

    backgroundColor: colors.surface,

    borderWidth: 1,
    borderColor: colors.border,

    borderRadius: 15,

    padding: 16,

    flexDirection: 'row',
    alignItems: 'flex-start',

    marginBottom: 18,
  },

  adminNoticeIcon: {
    width: 42,
    height: 42,

    borderRadius: 11,

    backgroundColor: colors.primaryLight,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 12,

    flexShrink: 0,
  },

  adminNoticeContent: {
    flex: 1,
    minWidth: 0,
  },

  adminNoticeTitle: {
    color: colors.text,

    fontSize: 11,
    fontWeight: '800',
  },

  adminNoticeText: {
    color: colors.textSecondary,

    fontSize: 9,
    lineHeight: 16,

    marginTop: 4,
  },

  /* =====================================================
     CONTA
  ===================================================== */

  accountPanel: {
    width: '100%',

    backgroundColor: colors.surface,

    borderWidth: 1,
    borderColor: colors.border,

    borderRadius: 15,

    padding: 18,

    marginBottom: 18,
  },

  accountGrid: {
    width: '100%',
    flexDirection: 'row',
  },

  accountGridMobile: {
    flexDirection: 'column',
  },

  accountItem: {
    flex: 1,
    minWidth: 0,

    minHeight: 76,

    backgroundColor: colors.background,

    borderRadius: 11,

    padding: 12,

    flexDirection: 'row',
    alignItems: 'center',

    marginRight: 9,
  },

  accountItemMobile: {
    width: '100%',

    flex: 0,
    flexGrow: 0,
    flexShrink: 0,

    marginRight: 0,
    marginBottom: 9,
  },

  accountItemLast: {
    marginRight: 0,
  },

  accountItemIcon: {
    width: 38,
    height: 38,

    borderRadius: 10,

    backgroundColor: colors.surface,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 10,

    flexShrink: 0,
  },

  accountItemText: {
    flex: 1,
    minWidth: 0,
  },

  accountLabel: {
    color: colors.textSecondary,

    fontSize: 8,
    fontWeight: '700',
  },

  accountValue: {
    color: colors.text,

    fontSize: 9,
    lineHeight: 14,

    fontWeight: '800',

    marginTop: 4,
  },

  accountValueActive: {
    color: '#15803D',
  },

  /* =====================================================
     AVISO FINAL
  ===================================================== */

  footerNotice: {
    width: '100%',

    backgroundColor: colors.primaryLight,

    borderRadius: 14,

    padding: 16,

    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  footerNoticeContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },

  footerNoticeTitle: {
    color: colors.text,

    fontSize: 10,
    fontWeight: '800',
  },

  footerNoticeText: {
    color: colors.textSecondary,

    fontSize: 9,
    lineHeight: 16,

    marginTop: 4,
  },

  bottomSpace: {
    width: '100%',
    height: 35,
  },
});