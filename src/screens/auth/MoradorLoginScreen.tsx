import React, { useRef, useState } from 'react';
import {
  Alert,
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
  Home,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';

import { colors } from '../../theme/theme';
import { supabase } from '../../services/supabase';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type NavigationProp =
  NativeStackNavigationProp<AuthStackParamList>;

export default function MoradorLoginScreen() {
  const navigation =
    useNavigation<NavigationProp>();

  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] =
    useState(false);

  const [entrando, setEntrando] =
    useState(false);

  function formatarCPF(valor: string) {
    const numeros = valor
      .replace(/\D/g, '')
      .slice(0, 11);

    return numeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(
        /(\d{3})(\d{1,2})$/,
        '$1-$2'
      );
  }

  function focarSenha() {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: 230,
        animated: true,
      });
    }, 250);
  }

  async function entrar() {
    if (entrando) {
      return;
    }

    const cpfNumeros =
      cpf.replace(/\D/g, '');

    // ==============================
    // VALIDAR CPF
    // ==============================

    if (cpfNumeros.length !== 11) {
      Alert.alert(
        'CPF inválido',
        'Informe um CPF com 11 números.'
      );

      return;
    }

    // ==============================
    // VALIDAR SENHA
    // ==============================

    if (!senha.trim()) {
      Alert.alert(
        'Senha obrigatória',
        'Informe sua senha.'
      );

      return;
    }

    try {
      setEntrando(true);

      // ==============================
      // EMAIL INTERNO DO MORADOR
      // ==============================

      const emailInterno =
        `${cpfNumeros}@morador.conectalar.local`;

      console.log(
        'Tentando login do morador:',
        emailInterno
      );

      // ==============================
      // LOGIN NO SUPABASE AUTH
      // ==============================

      const {
        data: loginData,
        error: loginError,
      } =
        await supabase.auth.signInWithPassword({
          email: emailInterno,
          password: senha,
        });

      if (
        loginError ||
        !loginData.user
      ) {
        console.error(
          'Erro no login do morador:',
          loginError
        );

        Alert.alert(
          'Não foi possível entrar',
          'CPF ou senha incorretos.'
        );

        return;
      }

      const usuario =
        loginData.user;

      console.log(
        'Morador autenticado:',
        usuario.id
      );

      // ==============================
      // BUSCAR PERFIL
      // ==============================

      const {
        data: perfil,
        error: perfilError,
      } = await supabase
        .from('perfis')
        .select(
          'id, nome, cpf, tipo, ativo'
        )
        .eq('id', usuario.id)
        .maybeSingle();

      if (perfilError) {
        console.error(
          'Erro ao buscar perfil:',
          perfilError
        );

        await supabase.auth.signOut();

        Alert.alert(
          'Erro no acesso',
          `Não foi possível consultar seu perfil: ${perfilError.message}`
        );

        return;
      }

      // ==============================
      // PERFIL NÃO EXISTE
      // ==============================

      if (!perfil) {
        await supabase.auth.signOut();

        Alert.alert(
          'Perfil não encontrado',
          'Não encontramos o perfil desta conta.'
        );

        return;
      }

      // ==============================
      // VERIFICAR TIPO
      // ==============================

      if (perfil.tipo !== 'morador') {
        await supabase.auth.signOut();

        Alert.alert(
          'Acesso não permitido',
          'Esta conta não possui acesso à área do morador.'
        );

        return;
      }

      // ==============================
      // VERIFICAR SE ESTÁ ATIVO
      // ==============================

      if (!perfil.ativo) {
        await supabase.auth.signOut();

        Alert.alert(
          'Conta desativada',
          'Seu acesso está desativado. Entre em contato com a administração do condomínio.'
        );

        return;
      }

      // ==============================
      // LOGIN CONCLUÍDO
      // ==============================

      console.log(
        'Login realizado com sucesso:',
        {
          id: perfil.id,
          nome: perfil.nome,
          cpf: perfil.cpf,
          tipo: perfil.tipo,
        }
      );

      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'MoradorHome',
          },
        ],
      });
    } catch (error) {
      console.error(
        'Erro inesperado no login:',
        error
      );

      Alert.alert(
        'Erro',
        'Ocorreu um erro inesperado ao entrar. Tente novamente.'
      );
    } finally {
      setEntrando(false);
    }
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: Math.max(
                insets.top,
                12
              ),
              paddingBottom:
                Math.max(
                  insets.bottom,
                  16
                ) + 15,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={
            false
          }
          contentInsetAdjustmentBehavior="never"
        >
          {/* VOLTAR */}

          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              navigation.goBack()
            }
          >
            <ArrowLeft
              size={20}
              color={colors.text}
            />
          </Pressable>

          {/* LOGO */}

          <View style={styles.brand}>
            <View style={styles.logo}>
              <Home
                size={31}
                color="#FFFFFF"
                strokeWidth={2.4}
              />
            </View>

            <Text style={styles.brandName}>
              ConectaLar
            </Text>
          </View>

          {/* TÍTULO */}

          <View style={styles.heading}>
            <Text style={styles.title}>
              Olá, morador!
            </Text>

            <Text style={styles.subtitle}>
              Acesse sua conta para
              acompanhar tudo sobre o seu
              condomínio.
            </Text>
          </View>

          {/* IDENTIFICAÇÃO */}

          <View style={styles.accessBadge}>
            <View
              style={
                styles.accessBadgeIcon
              }
            >
              <ShieldCheck
                size={14}
                color={colors.primary}
              />
            </View>

            <Text
              style={
                styles.accessBadgeText
              }
            >
              Acesso exclusivo para
              moradores
            </Text>
          </View>

          {/* FORMULÁRIO */}

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              Acesse sua conta
            </Text>

            <Text
              style={
                styles.formDescription
              }
            >
              Informe seu CPF e sua senha
              para continuar.
            </Text>

            {/* CPF */}

            <Text style={styles.label}>
              CPF
            </Text>

            <View
              style={
                styles.inputContainer
              }
            >
              <View
                style={styles.inputIcon}
              >
                <UserRound
                  size={18}
                  color={
                    colors.textSecondary
                  }
                />
              </View>

              <TextInput
                style={styles.input}
                value={cpf}
                onChangeText={(valor) =>
                  setCpf(
                    formatarCPF(valor)
                  )
                }
                placeholder="000.000.000-00"
                placeholderTextColor={
                  colors.textLight
                }
                keyboardType="numeric"
                maxLength={14}
                returnKeyType="next"
                editable={!entrando}
              />
            </View>

            {/* SENHA */}

            <Text
              style={[
                styles.label,
                styles.passwordLabel,
              ]}
            >
              Senha
            </Text>

            <View
              style={
                styles.inputContainer
              }
            >
              <View
                style={styles.inputIcon}
              >
                <LockKeyhole
                  size={18}
                  color={
                    colors.textSecondary
                  }
                />
              </View>

              <TextInput
                style={styles.input}
                value={senha}
                onChangeText={setSenha}
                onFocus={focarSenha}
                placeholder="Digite sua senha"
                placeholderTextColor={
                  colors.textLight
                }
                secureTextEntry={
                  !mostrarSenha
                }
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={entrar}
                editable={!entrando}
              />

              <Pressable
                style={styles.eyeButton}
                onPress={() =>
                  setMostrarSenha(
                    (atual) => !atual
                  )
                }
                hitSlop={10}
                disabled={entrando}
              >
                {mostrarSenha ? (
                  <EyeOff
                    size={19}
                    color={
                      colors.textSecondary
                    }
                  />
                ) : (
                  <Eye
                    size={19}
                    color={
                      colors.textSecondary
                    }
                  />
                )}
              </Pressable>
            </View>

            {/* BOTÃO */}

            <Pressable
              style={({ pressed }) => [
                styles.loginButton,

                entrando &&
                  styles.loginDisabled,

                pressed &&
                  !entrando &&
                  styles.loginPressed,
              ]}
              onPress={entrar}
              disabled={entrando}
            >
              <Text
                style={
                  styles.loginButtonText
                }
              >
                {entrando
                  ? 'Entrando...'
                  : 'Entrar'}
              </Text>

              <ShieldCheck
                size={18}
                color="#FFFFFF"
              />
            </Pressable>
          </View>

          {/* INFORMAÇÃO */}

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <ShieldCheck
                size={19}
                color={colors.primary}
              />
            </View>

            <View
              style={styles.infoContent}
            >
              <Text
                style={styles.infoTitle}
              >
                Cadastro seguro
              </Text>

              <Text
                style={styles.infoText}
              >
                Seu cadastro e acesso são
                gerenciados pela
                administração do
                condomínio.
              </Text>
            </View>
          </View>

          {/* RODAPÉ */}

          <View style={styles.footer}>
            <Text
              style={styles.footerBrand}
            >
              ConectaLar
            </Text>

            <Text
              style={styles.footerText}
            >
              Seu condomínio mais
              conectado.
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

    backgroundColor: colors.primary,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor: '#1D4ED8',
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

  accessBadge: {
    alignSelf: 'center',

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor:
      colors.primaryLight,

    borderRadius: 999,

    paddingHorizontal: 10,
    paddingVertical: 5,

    marginTop: 10,
  },

  accessBadgeIcon: {
    width: 22,
    height: 22,

    borderRadius: 7,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',
    justifyContent: 'center',
  },

  accessBadgeText: {
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

    backgroundColor:
      colors.background,

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

  loginButton: {
    height: 47,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: colors.primary,

    borderRadius: 14,

    marginTop: 14,

    gap: 7,
  },

  loginButtonText: {
    color: '#FFFFFF',

    fontSize: 12,
    fontWeight: '800',
  },

  loginPressed: {
    opacity: 0.82,

    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  loginDisabled: {
    opacity: 0.6,
  },

  pressed: {
    opacity: 0.75,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#EFF6FF',

    borderWidth: 1,
    borderColor: '#DBEAFE',

    borderRadius: 15,

    padding: 11,

    marginTop: 11,
  },

  infoIcon: {
    width: 35,
    height: 35,

    borderRadius: 11,

    backgroundColor: '#DBEAFE',

    alignItems: 'center',
    justifyContent: 'center',
  },

  infoContent: {
    flex: 1,
    marginLeft: 9,
  },

  infoTitle: {
    color: colors.text,

    fontSize: 10,
    fontWeight: '800',
  },

  infoText: {
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