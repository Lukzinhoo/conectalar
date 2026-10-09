import React, { useState } from 'react';

import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  Eye,
  EyeOff,
  Home,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Users,
} from 'lucide-react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthStackParamList } from '../../../navigation/AuthNavigator';

import {
  loginAdministrativo,
  loginMorador,
} from '../../../services/authService';

import { colors } from '../../../theme/theme';

type Props = NativeStackScreenProps<
  AuthStackParamList,
  'WebLogin'
>;

type TipoLogin =
  | 'morador'
  | 'administracao';

/* =====================================================
   FORMATAR CPF
===================================================== */

function formatarCpf(valor: string) {
  const numeros = valor
    .replace(/\D/g, '')
    .slice(0, 11);

  if (numeros.length <= 3) {
    return numeros;
  }

  if (numeros.length <= 6) {
    return numeros.replace(
      /(\d{3})(\d+)/,
      '$1.$2'
    );
  }

  if (numeros.length <= 9) {
    return numeros.replace(
      /(\d{3})(\d{3})(\d+)/,
      '$1.$2.$3'
    );
  }

  return numeros.replace(
    /(\d{3})(\d{3})(\d{3})(\d{1,2})/,
    '$1.$2.$3-$4'
  );
}

/* =====================================================
   TELA
===================================================== */

export default function WebLoginScreen({
  navigation,
}: Props) {
  const { width, height } =
    useWindowDimensions();

  const telaCompacta =
    width < 900;

  const celular =
    width < 600;

  const alturaPequena =
    height < 720;

  const [tipoLogin, setTipoLogin] =
    useState<TipoLogin>('morador');

  const [cpf, setCpf] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [senha, setSenha] =
    useState('');

  const [
    mostrarSenha,
    setMostrarSenha,
  ] = useState(false);

  const [
    carregando,
    setCarregando,
  ] = useState(false);

  const [erro, setErro] =
    useState('');

  /* ===================================================
     TROCAR TIPO
  =================================================== */

  function trocarTipo(
    tipo: TipoLogin
  ) {
    if (carregando) {
      return;
    }

    setTipoLogin(tipo);
    setErro('');
    setSenha('');
    setMostrarSenha(false);
  }

  /* ===================================================
     LOGIN
  =================================================== */

  async function entrar() {
    if (carregando) {
      return;
    }

    setErro('');

    /* =================================================
       MORADOR
    ================================================= */

    if (
      tipoLogin === 'morador'
    ) {
      const cpfNumeros =
        cpf.replace(/\D/g, '');

      if (!cpfNumeros) {
        setErro(
          'Informe o CPF.'
        );

        return;
      }

      if (
        cpfNumeros.length !== 11
      ) {
        setErro(
          'Informe um CPF válido com 11 números.'
        );

        return;
      }

      if (!senha) {
        setErro(
          'Informe a senha.'
        );

        return;
      }

      try {
        setCarregando(true);

        const resultado =
          await loginMorador(
            cpfNumeros,
            senha
          );

        if (
          !resultado.sucesso
        ) {
          setErro(
            resultado.mensagem
          );

          return;
        }

        navigation.reset({
          index: 0,
          routes: [
            {
              name:
                'WebMoradorHome',
            },
          ],
        });

        return;
      } catch (error) {
        console.error(
          'Erro no login do morador:',
          error
        );

        setErro(
          'Não foi possível realizar o login. Tente novamente.'
        );
      } finally {
        setCarregando(false);
      }

      return;
    }

    /* =================================================
       ADMINISTRAÇÃO
    ================================================= */

    const emailLimpo =
      email
        .trim()
        .toLowerCase();

    if (!emailLimpo) {
      setErro(
        'Informe o e-mail.'
      );

      return;
    }

    if (!senha) {
      setErro(
        'Informe a senha.'
      );

      return;
    }

    try {
      setCarregando(true);

      const resultado =
        await loginAdministrativo(
          emailLimpo,
          senha
        );

      if (!resultado.sucesso) {
        setErro(
          resultado.mensagem
        );

        return;
      }

      navigation.reset({
        index: 0,
        routes: [
          {
            name:
              'WebDashboard',
          },
        ],
      });
    } catch (error) {
      console.error(
        'Erro no login administrativo:',
        error
      );

      setErro(
        'Não foi possível realizar o login. Tente novamente.'
      );
    } finally {
      setCarregando(false);
    }
  }

  /* ===================================================
     ENTER
  =================================================== */

  function pressionarEnter() {
    if (!carregando) {
      entrar();
    }
  }

  /* ===================================================
     FORMULÁRIO
  =================================================== */

  const formulario = (
    <View
      style={[
        styles.formPanel,

        telaCompacta &&
          styles.formPanelCompacto,

        celular &&
          styles.formPanelCelular,
      ]}
    >
      <View
        style={[
          styles.formContent,

          celular &&
            styles.formContentCelular,
        ]}
      >
        {/* CABEÇALHO */}

        <View
          style={[
            styles.welcomeArea,

            celular &&
              styles.welcomeAreaCelular,
          ]}
        >
          <Text
            style={
              styles.welcomeSmall
            }
          >
            BEM-VINDO AO CONECTALAR
          </Text>

          <Text
            style={[
              styles.formTitle,

              celular &&
                styles.formTitleCelular,
            ]}
          >
            Acesse sua conta
          </Text>

          <Text
            style={
              styles.formDescription
            }
          >
            Escolha seu tipo de
            acesso e informe seus
            dados.
          </Text>
        </View>

        {/* TIPO DE LOGIN */}

        <View
          style={[
            styles.tipoContainer,

            celular &&
              styles.tipoContainerCelular,
          ]}
        >
          <Pressable
            style={[
              styles.tipoButton,

              tipoLogin ===
                'morador' &&
                styles.tipoButtonAtivo,
            ]}
            onPress={() =>
              trocarTipo(
                'morador'
              )
            }
            disabled={carregando}
          >
            <Home
              size={17}
              color={
                tipoLogin ===
                'morador'
                  ? '#FFFFFF'
                  : colors.textSecondary
              }
            />

            <Text
              style={[
                styles.tipoText,

                tipoLogin ===
                  'morador' &&
                  styles.tipoTextAtivo,
              ]}
            >
              Morador
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.tipoButton,

              tipoLogin ===
                'administracao' &&
                styles.tipoButtonAtivo,
            ]}
            onPress={() =>
              trocarTipo(
                'administracao'
              )
            }
            disabled={carregando}
          >
            <ShieldCheck
              size={17}
              color={
                tipoLogin ===
                'administracao'
                  ? '#FFFFFF'
                  : colors.textSecondary
              }
            />

            <Text
              style={[
                styles.tipoText,

                tipoLogin ===
                  'administracao' &&
                  styles.tipoTextAtivo,
              ]}
              numberOfLines={1}
            >
              Administração
            </Text>
          </Pressable>
        </View>

        {/* INFORMAÇÃO */}

        <View
          style={[
            styles.accessHeader,

            celular &&
              styles.accessHeaderCelular,
          ]}
        >
          <View
            style={
              styles.accessIcon
            }
          >
            {tipoLogin ===
            'morador' ? (
              <Users
                size={19}
                color={
                  colors.primary
                }
              />
            ) : (
              <ShieldCheck
                size={19}
                color={
                  colors.primary
                }
              />
            )}
          </View>

          <View
            style={
              styles.accessText
            }
          >
            <Text
              style={
                styles.accessTitle
              }
            >
              {tipoLogin ===
              'morador'
                ? 'Acesso do morador'
                : 'Acesso administrativo'}
            </Text>

            <Text
              style={
                styles.accessDescription
              }
            >
              {tipoLogin ===
              'morador'
                ? 'Entre utilizando o CPF cadastrado pela administração.'
                : 'Acesso para administradores, síndico e subsíndico.'}
            </Text>
          </View>
        </View>

        {/* CPF */}

        {tipoLogin ===
          'morador' && (
          <View
            style={
              styles.inputGroup
            }
          >
            <Text
              style={
                styles.label
              }
            >
              CPF
            </Text>

            <View
              style={
                styles.inputContainer
              }
            >
              <View
                style={
                  styles.inputIcon
                }
              >
                <Users
                  size={17}
                  color={
                    colors.textSecondary
                  }
                />
              </View>

              <TextInput
                value={cpf}
                onChangeText={valor => {
                  setCpf(
                    formatarCpf(
                      valor
                    )
                  );

                  if (erro) {
                    setErro('');
                  }
                }}
                placeholder="000.000.000-00"
                placeholderTextColor={
                  colors.textLight
                }
                style={
                  styles.input
                }
                keyboardType="numeric"
                maxLength={14}
                editable={
                  !carregando
                }
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>
          </View>
        )}

        {/* EMAIL */}

        {tipoLogin ===
          'administracao' && (
          <View
            style={
              styles.inputGroup
            }
          >
            <Text
              style={
                styles.label
              }
            >
              E-mail
            </Text>

            <View
              style={
                styles.inputContainer
              }
            >
              <View
                style={
                  styles.inputIcon
                }
              >
                <Mail
                  size={17}
                  color={
                    colors.textSecondary
                  }
                />
              </View>

              <TextInput
                value={email}
                onChangeText={valor => {
                  setEmail(valor);

                  if (erro) {
                    setErro('');
                  }
                }}
                placeholder="seu@email.com"
                placeholderTextColor={
                  colors.textLight
                }
                style={
                  styles.input
                }
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={
                  !carregando
                }
                returnKeyType="next"
              />
            </View>
          </View>
        )}

        {/* SENHA */}

        <View
          style={
            styles.inputGroup
          }
        >
          <Text
            style={styles.label}
          >
            Senha
          </Text>

          <View
            style={
              styles.inputContainer
            }
          >
            <View
              style={
                styles.inputIcon
              }
            >
              <LockKeyhole
                size={17}
                color={
                  colors.textSecondary
                }
              />
            </View>

            <TextInput
              value={senha}
              onChangeText={valor => {
                setSenha(valor);

                if (erro) {
                  setErro('');
                }
              }}
              placeholder="Digite sua senha"
              placeholderTextColor={
                colors.textLight
              }
              style={
                styles.input
              }
              secureTextEntry={
                !mostrarSenha
              }
              editable={
                !carregando
              }
              returnKeyType="done"
              onSubmitEditing={
                pressionarEnter
              }
            />

            <Pressable
              style={
                styles.eyeButton
              }
              onPress={() =>
                setMostrarSenha(
                  atual => !atual
                )
              }
              disabled={carregando}
            >
              {mostrarSenha ? (
                <EyeOff
                  size={18}
                  color={
                    colors.textSecondary
                  }
                />
              ) : (
                <Eye
                  size={18}
                  color={
                    colors.textSecondary
                  }
                />
              )}
            </Pressable>
          </View>
        </View>

        {/* ERRO */}

        {!!erro && (
          <View
            style={
              styles.erroBox
            }
          >
            <Text
              style={
                styles.erroText
              }
            >
              {erro}
            </Text>
          </View>
        )}

        {/* BOTÃO */}

        <Pressable
          style={({ pressed }) => [
            styles.button,

            pressed &&
              !carregando &&
              styles.buttonPressed,

            carregando &&
              styles.buttonDisabled,
          ]}
          onPress={entrar}
          disabled={carregando}
        >
          {carregando ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <>
              <Text
                style={
                  styles.buttonText
                }
              >
                {tipoLogin ===
                'morador'
                  ? 'Entrar como morador'
                  : 'Entrar na administração'}
              </Text>

              <Text
                style={
                  styles.buttonArrow
                }
              >
                →
              </Text>
            </>
          )}
        </Pressable>

        {/* SEGURANÇA */}

        <View
          style={
            styles.securityInfo
          }
        >
          <LockKeyhole
            size={12}
            color={
              colors.textLight
            }
          />

          <Text
            style={
              styles.securityText
            }
          >
            Seus dados de acesso
            são protegidos.
          </Text>
        </View>
      </View>
    </View>
  );

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      {/* FUNDO */}

      <Image
        source={require(
          '../../../../assets/images/login-background.png'
        )}
        style={
          styles.backgroundImage
        }
        resizeMode="cover"
      />

      <View
        style={styles.overlay}
      />

      <View
        style={[
          styles.glowOne,

          celular &&
            styles.glowOneCelular,
        ]}
      />

      <View
        style={[
          styles.glowTwo,

          celular &&
            styles.glowTwoCelular,
        ]}
      />

      {/* MOBILE / TABLET */}

      {telaCompacta ? (
        <ScrollView
          style={
            styles.mobileScroll
          }
          contentContainerStyle={[
            styles.mobileScrollContent,

            alturaPequena &&
              styles.mobileScrollContentPequeno,
          ]}
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.loginContainer,

              styles.loginContainerCompacto,

              celular &&
                styles.loginContainerCelular,
            ]}
          >
            {formulario}
          </View>
        </ScrollView>
      ) : (
        /* DESKTOP */

        <View
          style={
            styles.desktopArea
          }
        >
          <View
            style={
              styles.loginContainer
            }
          >
            <View
              style={
                styles.brandPanel
              }
            >
              <Image
                source={require(
                  '../../../../assets/images/login-condominio.png'
                )}
                style={
                  styles.brandImage
                }
                resizeMode="cover"
              />

              <View
                style={
                  styles.brandOverlay
                }
              />
            </View>

            {formulario}
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

/* =====================================================
   ESTILOS
===================================================== */

const styles = StyleSheet.create({
  /* ===================================================
     BASE
  =================================================== */

  container: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
    backgroundColor:
      '#F4F7FC',
    position: 'relative',
    overflow: 'hidden',
  },

  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    width: '100%',
    height: '100%',
  },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    backgroundColor:
      'rgba(244, 247, 252, 0.20)',
  },

  /* ===================================================
     DECORAÇÃO
  =================================================== */

  glowOne: {
    position: 'absolute',

    width: 520,
    height: 520,

    borderRadius: 260,

    backgroundColor:
      colors.primaryLight,

    top: -260,
    left: -210,

    opacity: 0.18,
  },

  glowOneCelular: {
    width: 300,
    height: 300,

    borderRadius: 150,

    top: -150,
    left: -140,
  },

  glowTwo: {
    position: 'absolute',

    width: 440,
    height: 440,

    borderRadius: 220,

    backgroundColor:
      colors.primaryLight,

    bottom: -250,
    right: -150,

    opacity: 0.15,
  },

  glowTwoCelular: {
    width: 280,
    height: 280,

    borderRadius: 140,

    bottom: -150,
    right: -140,
  },

  /* ===================================================
     DESKTOP
  =================================================== */

  desktopArea: {
    flex: 1,

    width: '100%',

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 30,
    paddingVertical: 30,
  },

  loginContainer: {
    width: '100%',

    maxWidth: 1050,

    minHeight: 650,

    flexDirection: 'row',

    borderRadius: 28,

    overflow: 'hidden',

    backgroundColor:
      '#FFFFFF',

    ...(Platform.OS === 'web'
      ? {
          boxShadow:
            '0px 25px 70px rgba(15, 23, 42, 0.18)',
        }
      : {
          shadowColor:
            '#000000',

          shadowOffset: {
            width: 0,
            height: 15,
          },

          shadowOpacity: 0.13,
          shadowRadius: 28,

          elevation: 12,
        }),
  },

  brandPanel: {
    width: '46%',

    minHeight: 650,

    backgroundColor:
      colors.primaryDark,

    overflow: 'hidden',

    position: 'relative',
  },

  brandImage: {
    width: '100%',
    height: '100%',
  },

  brandOverlay: {
    position: 'absolute',

    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    backgroundColor:
      'rgba(15, 29, 54, 0.05)',
  },

  /* ===================================================
     MOBILE
  =================================================== */

  mobileScroll: {
    flex: 1,

    width: '100%',
  },

  mobileScrollContent: {
    flexGrow: 1,

    width: '100%',

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 20,
    paddingVertical: 30,
  },

  mobileScrollContentPequeno: {
    justifyContent:
      'flex-start',

    paddingTop: 20,
    paddingBottom: 20,
  },

  loginContainerCompacto: {
    width: '100%',

    maxWidth: 520,

    minHeight: 0,

    flexDirection: 'column',

    borderRadius: 22,
  },

  loginContainerCelular: {
    maxWidth: '100%',

    borderRadius: 18,
  },

  /* ===================================================
     FORMULÁRIO
  =================================================== */

  formPanel: {
    flex: 1,

    backgroundColor:
      '#FFFFFF',

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 55,

    paddingVertical: 40,
  },

  formPanelCompacto: {
    width: '100%',

    paddingHorizontal: 30,

    paddingVertical: 35,
  },

  formPanelCelular: {
    paddingHorizontal: 18,

    paddingTop: 26,

    paddingBottom: 24,
  },

  formContent: {
    width: '100%',

    maxWidth: 420,
  },

  formContentCelular: {
    maxWidth: '100%',
  },

  /* ===================================================
     CABEÇALHO
  =================================================== */

  welcomeArea: {
    marginBottom: 25,
  },

  welcomeAreaCelular: {
    marginBottom: 20,
  },

  welcomeSmall: {
    color: colors.primary,

    fontSize: 9,

    fontWeight: '900',

    letterSpacing: 1.2,
  },

  formTitle: {
    color: colors.text,

    fontSize: 28,

    fontWeight: '900',

    marginTop: 7,
  },

  formTitleCelular: {
    fontSize: 24,
  },

  formDescription: {
    color:
      colors.textSecondary,

    fontSize: 11,

    lineHeight: 17,

    marginTop: 6,
  },

  /* ===================================================
     TIPO
  =================================================== */

  tipoContainer: {
    width: '100%',

    flexDirection: 'row',

    backgroundColor:
      '#F3F6FA',

    borderRadius: 13,

    padding: 4,

    marginBottom: 24,
  },

  tipoContainerCelular: {
    marginBottom: 18,
  },

  tipoButton: {
    flex: 1,

    minWidth: 0,

    minHeight: 45,

    borderRadius: 10,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 6,
  },

  tipoButtonAtivo: {
    backgroundColor:
      colors.primary,

    ...(Platform.OS === 'web'
      ? {
          boxShadow:
            '0px 5px 14px rgba(37, 75, 190, 0.22)',
        }
      : {}),
  },

  tipoText: {
    color:
      colors.textSecondary,

    fontSize: 10,

    fontWeight: '800',

    marginLeft: 6,
  },

  tipoTextAtivo: {
    color: '#FFFFFF',
  },

  /* ===================================================
     INFORMAÇÃO DE ACESSO
  =================================================== */

  accessHeader: {
    width: '100%',

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor:
      '#F8FAFD',

    borderWidth: 1,

    borderColor:
      colors.border,

    borderRadius: 13,

    padding: 12,

    marginBottom: 20,
  },

  accessHeaderCelular: {
    padding: 10,

    marginBottom: 17,
  },

  accessIcon: {
    width: 38,

    height: 38,

    borderRadius: 11,

    backgroundColor:
      colors.primaryLight,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 11,

    flexShrink: 0,
  },

  accessText: {
    flex: 1,

    minWidth: 0,
  },

  accessTitle: {
    color: colors.text,

    fontSize: 11,

    fontWeight: '800',
  },

  accessDescription: {
    color:
      colors.textSecondary,

    fontSize: 8,

    lineHeight: 13,

    marginTop: 3,
  },

  /* ===================================================
     INPUTS
  =================================================== */

  inputGroup: {
    width: '100%',

    marginBottom: 16,
  },

  label: {
    color: colors.text,

    fontSize: 10,

    fontWeight: '800',

    marginBottom: 7,
  },

  inputContainer: {
    width: '100%',

    minHeight: 50,

    borderRadius: 12,

    borderWidth: 1,

    borderColor:
      colors.border,

    backgroundColor:
      '#F8FAFD',

    flexDirection: 'row',

    alignItems: 'center',

    overflow: 'hidden',
  },

  inputIcon: {
    width: 44,

    height: 48,

    alignItems: 'center',

    justifyContent: 'center',

    flexShrink: 0,
  },

  input: {
    flex: 1,

    minWidth: 0,

    height: 48,

    paddingRight: 12,

    fontSize: 12,

    color: colors.text,

    outlineStyle:
      Platform.OS === 'web'
        ? 'none'
        : undefined,
  } as any,

  eyeButton: {
    width: 45,

    height: 48,

    alignItems: 'center',

    justifyContent: 'center',

    flexShrink: 0,
  },

  /* ===================================================
     ERRO
  =================================================== */

  erroBox: {
    width: '100%',

    backgroundColor:
      colors.dangerLight,

    borderRadius: 10,

    paddingVertical: 10,

    paddingHorizontal: 12,

    marginBottom: 15,
  },

  erroText: {
    color: colors.danger,

    fontSize: 10,

    fontWeight: '700',

    lineHeight: 15,

    textAlign: 'center',
  },

  /* ===================================================
     BOTÃO
  =================================================== */

  button: {
    width: '100%',

    height: 52,

    borderRadius: 12,

    backgroundColor:
      colors.primary,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    marginTop: 3,

    paddingHorizontal: 12,

    ...(Platform.OS === 'web'
      ? {
          boxShadow:
            '0px 8px 20px rgba(37, 75, 190, 0.22)',
        }
      : {}),
  },

  buttonPressed: {
    opacity: 0.86,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#FFFFFF',

    fontSize: 12,

    fontWeight: '900',

    textAlign: 'center',
  },

  buttonArrow: {
    color: '#FFFFFF',

    fontSize: 18,

    fontWeight: '700',

    marginLeft: 10,

    marginTop: -2,
  },

  /* ===================================================
     SEGURANÇA
  =================================================== */

  securityInfo: {
    width: '100%',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    marginTop: 18,
  },

  securityText: {
    color:
      colors.textLight,

    fontSize: 8,

    marginLeft: 5,
  },
});