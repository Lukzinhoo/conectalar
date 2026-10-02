import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react-native';

import { colors } from '../../theme/theme';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { loginAdministrativo } from '../../services/authService';

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'AdminLogin'
>;

export default function AdminLoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function entrar() {
    if (carregando) return;

    setErro('');

    if (!email.trim()) {
      setErro('Informe o seu e-mail.');
      return;
    }

    if (!senha) {
      setErro('Informe a sua senha.');
      return;
    }

    try {
      setCarregando(true);

      const resultado = await loginAdministrativo(
        email.trim(),
        senha
      );

      if (!resultado.sucesso) {
        setErro(resultado.mensagem);
        return;
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'AdminHome' }],
      });
    } catch (error) {
      console.error('Erro ao entrar:', error);

      setErro(
        'Não foi possível realizar o login. Tente novamente.'
      );
    } finally {
      setCarregando(false);
    }
  }

  function focarSenha() {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: 250,
        animated: true,
      });
    }, 250);
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: Math.max(insets.top, 12),
              paddingBottom: Math.max(insets.bottom, 16) + 15,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="never"
        >
          {/* VOLTAR */}
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
            onPress={() => navigation.goBack()}
            disabled={carregando}
          >
            <ArrowLeft size={20} color={colors.text} />
          </Pressable>

          {/* LOGO */}
          <View style={styles.brand}>
            <View style={styles.logo}>
              <ShieldCheck
                size={31}
                color="#FFFFFF"
                strokeWidth={2.4}
              />
            </View>

            <Text style={styles.brandName}>ConectaLar</Text>
          </View>

          {/* TÍTULO */}
          <View style={styles.heading}>
            <Text style={styles.title}>
              Área Administrativa
            </Text>

            <Text style={styles.subtitle}>
              Acesse o painel de gestão do seu condomínio com
              segurança.
            </Text>
          </View>

          {/* PROTEÇÃO */}
          <View style={styles.restricted}>
            <View style={styles.restrictedIcon}>
              <LockKeyhole
                size={14}
                color={colors.primary}
              />
            </View>

            <Text style={styles.restrictedText}>
              Ambiente administrativo protegido
            </Text>
          </View>

          {/* FORMULÁRIO */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              Acesse sua conta
            </Text>

            <Text style={styles.formDescription}>
              Informe suas credenciais administrativas.
            </Text>

            {/* EMAIL */}
            <Text style={styles.label}>E-mail</Text>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Mail
                  size={18}
                  color={colors.textSecondary}
                />
              </View>

              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(valor) => {
                  setEmail(valor);
                  setErro('');
                }}
                placeholder="administracao@condominio.com"
                placeholderTextColor={colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                returnKeyType="next"
                editable={!carregando}
              />
            </View>

            {/* SENHA */}
            <Text style={[styles.label, styles.passwordLabel]}>
              Senha
            </Text>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <LockKeyhole
                  size={18}
                  color={colors.textSecondary}
                />
              </View>

              <TextInput
                style={styles.input}
                value={senha}
                onChangeText={(valor) => {
                  setSenha(valor);
                  setErro('');
                }}
                onFocus={focarSenha}
                placeholder="Digite sua senha"
                placeholderTextColor={colors.textLight}
                secureTextEntry={!mostrarSenha}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                editable={!carregando}
                onSubmitEditing={entrar}
              />

              <Pressable
                style={styles.eyeButton}
                onPress={() =>
                  setMostrarSenha((atual) => !atual)
                }
                disabled={carregando}
                hitSlop={10}
              >
                {mostrarSenha ? (
                  <EyeOff
                    size={19}
                    color={colors.textSecondary}
                  />
                ) : (
                  <Eye
                    size={19}
                    color={colors.textSecondary}
                  />
                )}
              </Pressable>
            </View>

            {/* ERRO */}
            {erro ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {erro}
                </Text>
              </View>
            ) : null}

            {/* ENTRAR */}
            <Pressable
              style={({ pressed }) => [
                styles.loginButton,
                pressed &&
                  !carregando &&
                  styles.loginPressed,
                carregando && styles.disabledButton,
              ]}
              onPress={entrar}
              disabled={carregando}
            >
              {carregando ? (
                <View style={styles.loadingContent}>
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />

                  <Text style={styles.loginButtonText}>
                    Entrando...
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.loginButtonText}>
                    Entrar na administração
                  </Text>

                  <ShieldCheck
                    size={18}
                    color="#FFFFFF"
                  />
                </>
              )}
            </Pressable>
          </View>

          {/* SEGURANÇA */}
          <View style={styles.securityCard}>
            <View style={styles.securityIcon}>
              <ShieldCheck
                size={19}
                color={colors.primary}
              />
            </View>

            <View style={styles.securityContent}>
              <Text style={styles.securityTitle}>
                Acesso seguro
              </Text>

              <Text style={styles.securityText}>
                Somente usuários autorizados pela administração
                podem acessar esta área.
              </Text>
            </View>
          </View>

          {/* RODAPÉ */}
          <View style={styles.footer}>
            <Text style={styles.footerBrand}>
              ConectaLar
            </Text>

            <Text style={styles.footerText}>
              Gestão segura para o seu condomínio.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  keyboardView: {
    flex: 1,
  },

  scroll: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  brand: {
    alignItems: 'center',
    marginTop: 2,
  },

  logo: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },

  brandName: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },

  heading: {
    alignItems: 'center',
    marginTop: 12,
  },

  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
    maxWidth: 340,
  },

  restricted: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 10,
  },

  restrictedIcon: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  restrictedText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '700',
    marginLeft: 6,
  },

  formCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
  },

  formTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },

  formDescription: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 2,
    marginBottom: 13,
  },

  label: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 5,
  },

  passwordLabel: {
    marginTop: 11,
  },

  inputContainer: {
    height: 47,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 10,
  },

  inputIcon: {
    width: 29,
    height: 29,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  input: {
    flex: 1,
    height: '100%',
    color: colors.text,
    fontSize: 12,
    marginLeft: 8,
  },

  eyeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorBox: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 8,
    marginTop: 9,
  },

  errorText: {
    color: colors.danger,
    fontSize: 9,
    fontWeight: '600',
    lineHeight: 13,
  },

  loginButton: {
    height: 47,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryDark,
    borderRadius: 14,
    marginTop: 14,
    gap: 7,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  loginPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },

  pressed: {
    opacity: 0.75,
  },

  disabledButton: {
    opacity: 0.65,
  },

  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 15,
    padding: 11,
    marginTop: 11,
  },

  securityIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  securityContent: {
    flex: 1,
    marginLeft: 9,
  },

  securityTitle: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
  },

  securityText: {
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 12,
    marginTop: 1,
  },

  footer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 2,
  },

  footerBrand: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: '800',
  },

  footerText: {
    color: colors.textLight,
    fontSize: 7,
    marginTop: 1,
  },
});