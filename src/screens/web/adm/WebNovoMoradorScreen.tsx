import React, { useState } from 'react';

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  ArrowLeft,
  Building2,
  Check,
  Eye,
  EyeOff,
  Home,
  KeyRound,
  Mail,
  MapPin,
  Save,
  UserRound,
} from 'lucide-react-native';

import { AuthStackParamList } from '../../../navigation/AuthNavigator';
import { supabase } from '../../../services/supabase';

import WebLayout from '../../../components/WebLayout';
import WebSidebar from '../../../components/WebSidebar';

import { colors } from '../../../theme/theme';

type Props = NativeStackScreenProps<
  AuthStackParamList,
  'WebNovoMorador'
>;

type TipoResidencia =
  | 'apartamento_bloco'
  | 'casa'
  | 'casa_quadra';

export default function WebNovoMoradorScreen({
  navigation,
}: Props) {
  const { width } = useWindowDimensions();

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1100;

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');

  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');

  const [tipoResidencia, setTipoResidencia] =
    useState<TipoResidencia>('apartamento_bloco');

  const [apartamento, setApartamento] = useState('');
  const [bloco, setBloco] = useState('');
  const [casa, setCasa] = useState('');
  const [quadra, setQuadra] = useState('');

  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [cadastrando, setCadastrando] = useState(false);

  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  function formatarCPF(valor: string) {
    const numeros = valor
      .replace(/\D/g, '')
      .slice(0, 11);

    return numeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  function formatarTelefone(valor: string) {
    const numeros = valor
      .replace(/\D/g, '')
      .slice(0, 11);

    if (numeros.length <= 10) {
      return numeros
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }

    return numeros
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }

  function validarEmail(valor: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  }

  function selecionarTipo(tipo: TipoResidencia) {
    setTipoResidencia(tipo);

    if (tipo === 'apartamento_bloco') {
      setCasa('');
      setQuadra('');
    }

    if (tipo === 'casa') {
      setApartamento('');
      setBloco('');
      setQuadra('');
    }

    if (tipo === 'casa_quadra') {
      setApartamento('');
      setBloco('');
    }
  }

  async function cadastrar() {
    if (cadastrando) {
      return;
    }

    setErro('');
    setSucesso('');

    const nomeLimpo = nome.trim();

    const cpfNumeros = cpf.replace(/\D/g, '');

    const emailLimpo = email
      .trim()
      .toLowerCase();

    const telefoneLimpo = telefone.trim();

    if (!nomeLimpo) {
      setErro('Informe o nome completo do morador.');
      return;
    }

    if (cpfNumeros.length !== 11) {
      setErro('Informe um CPF com 11 números.');
      return;
    }

    if (!emailLimpo) {
      setErro('Informe o e-mail do morador.');
      return;
    }

    if (!validarEmail(emailLimpo)) {
      setErro('Informe um e-mail válido.');
      return;
    }

    if (
      tipoResidencia === 'apartamento_bloco' &&
      (!apartamento.trim() || !bloco.trim())
    ) {
      setErro('Informe o apartamento e o bloco.');
      return;
    }

    if (
      (tipoResidencia === 'casa' ||
        tipoResidencia === 'casa_quadra') &&
      !casa.trim()
    ) {
      setErro('Informe a casa do morador.');
      return;
    }

    if (
      tipoResidencia === 'casa_quadra' &&
      !quadra.trim()
    ) {
      setErro('Informe a quadra do morador.');
      return;
    }

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('A senha e a confirmação são diferentes.');
      return;
    }

    try {
      setCadastrando(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(
          'Não foi possível verificar a sessão administrativa.'
        );
      }

      if (!session) {
        setErro(
          'Sua sessão expirou. Entre novamente na área administrativa.'
        );
        return;
      }

      const { data, error } =
        await supabase.functions.invoke(
          'cadastrar-morador',
          {
            body: {
              nome: nomeLimpo,

              cpf: cpfNumeros,

              email: emailLimpo,

              telefone:
                telefoneLimpo || null,

              tipoResidencia,

              apartamento:
                tipoResidencia === 'apartamento_bloco'
                  ? apartamento.trim()
                  : null,

              bloco:
                tipoResidencia === 'apartamento_bloco'
                  ? bloco.trim()
                  : null,

              casa:
                tipoResidencia === 'casa' ||
                tipoResidencia === 'casa_quadra'
                  ? casa.trim()
                  : null,

              quadra:
                tipoResidencia === 'casa_quadra'
                  ? quadra.trim()
                  : null,

              senha,
            },

            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

      if (error) {
        let mensagem =
          error.message ||
          'Não foi possível cadastrar o morador.';

        const contexto = (
          error as {
            context?: Response;
          }
        ).context;

        if (contexto) {
          try {
            const resposta = await contexto
              .clone()
              .json();

            if (resposta?.mensagem) {
              mensagem = resposta.mensagem;
            } else if (resposta?.message) {
              mensagem = resposta.message;
            } else if (resposta?.error) {
              mensagem = resposta.error;
            }
          } catch {
            // Mantém a mensagem original.
          }
        }

        setErro(mensagem);
        return;
      }

      if (!data?.sucesso) {
        setErro(
          data?.mensagem ||
            'O servidor não confirmou o cadastro.'
        );
        return;
      }

      setSucesso(
        data?.mensagem ||
          'Morador cadastrado com sucesso.'
      );

      setTimeout(() => {
        navigation.replace('WebMoradores');
      }, 1000);
    } catch (error) {
      console.error(
        'Erro ao cadastrar morador:',
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro inesperado.'
      );
    } finally {
      setCadastrando(false);
    }
  }

  return (
    <WebLayout
      sidebar={
        <WebSidebar active="moradores" />
      }
    >
      <View
        style={[
          styles.header,
          isMobile && styles.headerMobile,
        ]}
      >
        <View style={styles.headerText}>
          <Text
            style={[
              styles.pageTitle,
              isMobile && styles.pageTitleMobile,
            ]}
          >
            Novo morador
          </Text>

          <Text style={styles.pageSubtitle}>
            Cadastre um novo morador no condomínio.
          </Text>
        </View>

        <View
          style={[
            styles.headerBadge,
            isMobile && styles.headerBadgeMobile,
          ]}
        >
          <View style={styles.headerBadgeIcon}>
            <UserRound
              size={18}
              color={colors.primary}
            />
          </View>

          <View style={styles.headerBadgeTextArea}>
            <Text style={styles.headerBadgeTitle}>
              Cadastro
            </Text>

            <Text style={styles.headerBadgeSubtitle}>
              Novo morador
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={() =>
          navigation.navigate('WebMoradores')
        }
      >
        <ArrowLeft
          size={16}
          color={colors.primary}
        />

        <Text style={styles.backText}>
          Voltar para moradores
        </Text>
      </Pressable>

      <View style={styles.formContainer}>
        <View style={styles.formHeader}>
          <Text
            style={[
              styles.formTitle,
              isMobile && styles.formTitleMobile,
            ]}
          >
            Cadastrar morador
          </Text>

          <Text style={styles.formDescription}>
            Preencha os dados pessoais, a unidade residencial
            e a senha inicial.
          </Text>
        </View>

        {!!erro && (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>
              Não foi possível continuar
            </Text>

            <Text style={styles.errorText}>
              {erro}
            </Text>
          </View>
        )}

        {!!sucesso && (
          <View style={styles.successBox}>
            <View style={styles.successHeader}>
              <View style={styles.successIcon}>
                <Check
                  size={15}
                  color="#166534"
                />
              </View>

              <Text style={styles.successTitle}>
                Cadastro concluído
              </Text>
            </View>

            <Text style={styles.successText}>
              {sucesso}
            </Text>
          </View>
        )}

        {/* DADOS PESSOAIS */}

        <View
          style={[
            styles.card,
            isMobile && styles.cardMobile,
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <UserRound
                size={18}
                color={colors.primary}
              />
            </View>

            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>
                Dados pessoais
              </Text>

              <Text style={styles.cardDescription}>
                Informações de identificação e contato do morador.
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.twoColumns,
              (isMobile || isTablet) &&
                styles.columnsResponsive,
            ]}
          >
            <View
              style={[
                styles.fieldLarge,
                (isMobile || isTablet) &&
                  styles.fieldResponsive,
              ]}
            >
              <Text style={styles.label}>
                Nome completo
              </Text>

              <TextInput
                value={nome}
                onChangeText={setNome}
                placeholder="Nome completo do morador"
                placeholderTextColor={colors.textLight}
                style={styles.input}
              />
            </View>

            <View
              style={[
                styles.field,
                (isMobile || isTablet) &&
                  styles.fieldResponsive,
              ]}
            >
              <Text style={styles.label}>
                CPF
              </Text>

              <TextInput
                value={cpf}
                onChangeText={(valor) =>
                  setCpf(formatarCPF(valor))
                }
                placeholder="000.000.000-00"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
                maxLength={14}
                style={styles.input}
              />
            </View>
          </View>

          <View
            style={[
              styles.twoColumns,
              (isMobile || isTablet) &&
                styles.columnsResponsive,
            ]}
          >
            <View
              style={[
                styles.field,
                (isMobile || isTablet) &&
                  styles.fieldResponsive,
              ]}
            >
              <Text style={styles.label}>
                E-mail
              </Text>

              <View style={styles.inputWithIcon}>
                <Mail
                  size={16}
                  color={colors.textLight}
                />

                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="morador@email.com"
                  placeholderTextColor={colors.textLight}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.inputInside}
                />
              </View>
            </View>

            <View
              style={[
                styles.field,
                (isMobile || isTablet) &&
                  styles.fieldResponsive,
              ]}
            >
              <Text style={styles.label}>
                Telefone
              </Text>

              <TextInput
                value={telefone}
                onChangeText={(valor) =>
                  setTelefone(
                    formatarTelefone(valor)
                  )
                }
                placeholder="(00) 00000-0000"
                placeholderTextColor={colors.textLight}
                keyboardType="phone-pad"
                maxLength={15}
                style={styles.input}
              />
            </View>
          </View>
        </View>

        {/* RESIDÊNCIA */}

        <View
          style={[
            styles.card,
            isMobile && styles.cardMobile,
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Home
                size={18}
                color={colors.primary}
              />
            </View>

            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>
                Unidade residencial
              </Text>

              <Text style={styles.cardDescription}>
                Selecione o tipo de residência do morador.
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.residenceRow,
              (isMobile || isTablet) &&
                styles.residenceRowResponsive,
            ]}
          >
            <ResidenceButton
              title="Apartamento e Bloco"
              subtitle="Morador de apartamento"
              icon={
                <Building2
                  size={20}
                  color={
                    tipoResidencia ===
                    'apartamento_bloco'
                      ? colors.primary
                      : colors.textSecondary
                  }
                />
              }
              selected={
                tipoResidencia ===
                'apartamento_bloco'
              }
              responsive={isMobile || isTablet}
              onPress={() =>
                selecionarTipo(
                  'apartamento_bloco'
                )
              }
            />

            <ResidenceButton
              title="Casa"
              subtitle="Morador de casa"
              icon={
                <Home
                  size={20}
                  color={
                    tipoResidencia === 'casa'
                      ? colors.primary
                      : colors.textSecondary
                  }
                />
              }
              selected={
                tipoResidencia === 'casa'
              }
              responsive={isMobile || isTablet}
              onPress={() =>
                selecionarTipo('casa')
              }
            />

            <ResidenceButton
              title="Casa e Quadra"
              subtitle="Casa identificada por quadra"
              icon={
                <MapPin
                  size={20}
                  color={
                    tipoResidencia ===
                    'casa_quadra'
                      ? colors.primary
                      : colors.textSecondary
                  }
                />
              }
              selected={
                tipoResidencia ===
                'casa_quadra'
              }
              responsive={isMobile || isTablet}
              onPress={() =>
                selecionarTipo(
                  'casa_quadra'
                )
              }
            />
          </View>

          {tipoResidencia ===
            'apartamento_bloco' && (
            <View
              style={[
                styles.twoColumns,
                (isMobile || isTablet) &&
                  styles.columnsResponsive,
              ]}
            >
              <View
                style={[
                  styles.field,
                  (isMobile || isTablet) &&
                    styles.fieldResponsive,
                ]}
              >
                <Text style={styles.label}>
                  Apartamento
                </Text>

                <TextInput
                  value={apartamento}
                  onChangeText={setApartamento}
                  placeholder="Ex: 302"
                  placeholderTextColor={colors.textLight}
                  style={styles.input}
                />
              </View>

              <View
                style={[
                  styles.field,
                  (isMobile || isTablet) &&
                    styles.fieldResponsive,
                ]}
              >
                <Text style={styles.label}>
                  Bloco
                </Text>

                <TextInput
                  value={bloco}
                  onChangeText={setBloco}
                  placeholder="Ex: B"
                  placeholderTextColor={colors.textLight}
                  style={styles.input}
                />
              </View>
            </View>
          )}

          {tipoResidencia === 'casa' && (
            <View style={styles.fieldTop}>
              <Text style={styles.label}>
                Casa
              </Text>

              <TextInput
                value={casa}
                onChangeText={setCasa}
                placeholder="Ex: 12"
                placeholderTextColor={colors.textLight}
                style={styles.input}
              />
            </View>
          )}

          {tipoResidencia ===
            'casa_quadra' && (
            <View
              style={[
                styles.twoColumns,
                (isMobile || isTablet) &&
                  styles.columnsResponsive,
              ]}
            >
              <View
                style={[
                  styles.field,
                  (isMobile || isTablet) &&
                    styles.fieldResponsive,
                ]}
              >
                <Text style={styles.label}>
                  Casa
                </Text>

                <TextInput
                  value={casa}
                  onChangeText={setCasa}
                  placeholder="Ex: 12"
                  placeholderTextColor={colors.textLight}
                  style={styles.input}
                />
              </View>

              <View
                style={[
                  styles.field,
                  (isMobile || isTablet) &&
                    styles.fieldResponsive,
                ]}
              >
                <Text style={styles.label}>
                  Quadra
                </Text>

                <TextInput
                  value={quadra}
                  onChangeText={setQuadra}
                  placeholder="Ex: A"
                  placeholderTextColor={colors.textLight}
                  style={styles.input}
                />
              </View>
            </View>
          )}
        </View>

        {/* ACESSO */}

        <View
          style={[
            styles.card,
            isMobile && styles.cardMobile,
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <KeyRound
                size={18}
                color={colors.primary}
              />
            </View>

            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>
                Acesso do morador
              </Text>

              <Text style={styles.cardDescription}>
                Defina a senha inicial do morador. O acesso
                continua sendo feito com CPF e senha.
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.twoColumns,
              (isMobile || isTablet) &&
                styles.columnsResponsive,
            ]}
          >
            <View
              style={[
                styles.field,
                (isMobile || isTablet) &&
                  styles.fieldResponsive,
              ]}
            >
              <Text style={styles.label}>
                Senha inicial
              </Text>

              <View style={styles.passwordBox}>
                <TextInput
                  value={senha}
                  onChangeText={setSenha}
                  placeholder="Mínimo de 6 caracteres"
                  placeholderTextColor={colors.textLight}
                  secureTextEntry={!mostrarSenha}
                  style={styles.passwordInput}
                />

                <Pressable
                  style={styles.eyeButton}
                  onPress={() =>
                    setMostrarSenha(
                      (valor) => !valor
                    )
                  }
                >
                  {mostrarSenha ? (
                    <EyeOff
                      size={17}
                      color={colors.primary}
                    />
                  ) : (
                    <Eye
                      size={17}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              </View>
            </View>

            <View
              style={[
                styles.field,
                (isMobile || isTablet) &&
                  styles.fieldResponsive,
              ]}
            >
              <Text style={styles.label}>
                Confirmar senha
              </Text>

              <TextInput
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                placeholder="Digite a senha novamente"
                placeholderTextColor={colors.textLight}
                secureTextEntry={!mostrarSenha}
                style={styles.input}
              />
            </View>
          </View>
        </View>

        {/* AÇÕES */}

        <View
          style={[
            styles.actions,
            isMobile && styles.actionsMobile,
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              isMobile && styles.actionButtonMobile,
              pressed && styles.buttonPressed,
            ]}
            disabled={cadastrando}
            onPress={() =>
              navigation.navigate('WebMoradores')
            }
          >
            <Text style={styles.cancelText}>
              Cancelar
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              isMobile && styles.actionButtonMobile,
              cadastrando &&
                styles.saveButtonDisabled,
              pressed &&
                !cadastrando &&
                styles.buttonPressed,
            ]}
            disabled={cadastrando}
            onPress={cadastrar}
          >
            {cadastrando ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <Save
                size={16}
                color="#FFFFFF"
              />
            )}

            <Text style={styles.saveText}>
              {cadastrando
                ? 'Cadastrando...'
                : 'Cadastrar morador'}
            </Text>
          </Pressable>
        </View>
      </View>
    </WebLayout>
  );
}

type ResidenceButtonProps = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  selected: boolean;
  responsive?: boolean;
  onPress: () => void;
};

function ResidenceButton({
  title,
  subtitle,
  icon,
  selected,
  responsive,
  onPress,
}: ResidenceButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.residenceButton,

        responsive &&
          styles.residenceButtonResponsive,

        selected &&
          styles.residenceButtonSelected,

        pressed &&
          styles.buttonPressed,
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.residenceIconBox,

          selected &&
            styles.residenceIconBoxSelected,
        ]}
      >
        {icon}
      </View>

      <View style={styles.residenceTextArea}>
        <Text
          style={[
            styles.residenceTitle,

            selected &&
              styles.residenceTitleSelected,
          ]}
        >
          {title}
        </Text>

        <Text style={styles.residenceSubtitle}>
          {subtitle}
        </Text>
      </View>

      <View
        style={[
          styles.radio,

          selected &&
            styles.radioSelected,
        ]}
      >
        {selected && (
          <View style={styles.radioInside} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  headerMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  pageTitle: {
    color: colors.text,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
  },

  pageTitleMobile: {
    fontSize: 23,
    lineHeight: 29,
  },

  pageSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 9,
    marginLeft: 16,
  },

  headerBadgeMobile: {
    marginLeft: 0,
    marginTop: 13,
    alignSelf: 'flex-start',
  },

  headerBadgeIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  headerBadgeTextArea: {
    minWidth: 0,
  },

  headerBadgeTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },

  headerBadgeSubtitle: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 2,
  },

  backButton: {
    minHeight: 38,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 3,
    marginBottom: 16,
  },

  backText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },

  formContainer: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
  },

  formHeader: {
    marginBottom: 18,
  },

  formTitle: {
    color: colors.text,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '800',
  },

  formTitleMobile: {
    fontSize: 19,
  },

  formDescription: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  errorBox: {
    width: '100%',
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 11,
    padding: 14,
    marginBottom: 15,
  },

  errorTitle: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '800',
  },

  errorText: {
    color: colors.danger,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  successBox: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 11,
    padding: 14,
    marginBottom: 15,
  },

  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  successIcon: {
    width: 25,
    height: 25,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  successTitle: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '800',
  },

  successText: {
    color: '#15803D',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 7,
  },

  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 22,
    marginBottom: 16,
  },

  cardMobile: {
    padding: 15,
    borderRadius: 12,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },

  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    flexShrink: 0,
  },

  cardHeaderText: {
    flex: 1,
    minWidth: 0,
  },

  cardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },

  cardDescription: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 3,
  },

  twoColumns: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 14,
  },

  columnsResponsive: {
    flexDirection: 'column',
  },

  field: {
    flex: 1,
    minWidth: 0,
    marginRight: 14,
  },

  fieldLarge: {
    flex: 1.5,
    minWidth: 0,
    marginRight: 14,
  },

  fieldResponsive: {
    width: '100%',
    flex: 0,
    marginRight: 0,
    marginBottom: 13,
  },

  fieldTop: {
    width: '100%',
    marginTop: 15,
  },

  label: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 7,
  },

  input: {
    width: '100%',
    height: 46,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    paddingHorizontal: 13,
    color: colors.text,
    fontSize: 12,
    outlineStyle: 'none',
  } as any,

  inputWithIcon: {
    width: '100%',
    height: 46,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  inputInside: {
    flex: 1,
    height: '100%',
    minWidth: 0,
    marginLeft: 8,
    color: colors.text,
    fontSize: 12,
    outlineStyle: 'none',
  } as any,

  residenceRow: {
    width: '100%',
    flexDirection: 'row',
    marginTop: 15,
  },

  residenceRowResponsive: {
    flexDirection: 'column',
  },

  residenceButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 82,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    backgroundColor: colors.background,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 11,
  },

  residenceButtonResponsive: {
    width: '100%',
    flex: 0,
    marginRight: 0,
    marginBottom: 10,
  },

  residenceButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  residenceIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },

  residenceIconBoxSelected: {
    borderColor: colors.primary,
  },

  residenceTextArea: {
    flex: 1,
    minWidth: 0,
  },

  residenceTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },

  residenceTitleSelected: {
    color: colors.primary,
  },

  residenceSubtitle: {
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 13,
    marginTop: 3,
  },

  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    flexShrink: 0,
  },

  radioSelected: {
    borderColor: colors.primary,
  },

  radioInside: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  passwordBox: {
    width: '100%',
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    paddingLeft: 13,
    paddingRight: 7,
  },

  passwordInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    color: colors.text,
    fontSize: 12,
    outlineStyle: 'none',
  } as any,

  eyeButton: {
    width: 36,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 15,
  },

  actionsMobile: {
    flexDirection: 'column-reverse',
    alignItems: 'stretch',
  },

  cancelButton: {
    height: 46,
    minWidth: 120,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  cancelText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },

  saveButton: {
    minWidth: 190,
    height: 46,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 7,
  },

  actionButtonMobile: {
    width: '100%',
    minWidth: 0,
    marginRight: 0,
    marginBottom: 9,
  },

  buttonPressed: {
    opacity: 0.78,
  },
});