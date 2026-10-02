import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Building2,
  Eye,
  EyeOff,
  Home,
  LockKeyhole,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';

import { colors } from '../../theme/theme';
import { supabase } from '../../services/supabase';

type TipoResidencia =
  | 'apartamento_bloco'
  | 'casa'
  | 'casa_quadra';

export default function NovoMoradorScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');

  const [tipoResidencia, setTipoResidencia] =
    useState<TipoResidencia>('apartamento_bloco');

  const [apartamento, setApartamento] = useState('');
  const [bloco, setBloco] = useState('');
  const [casa, setCasa] = useState('');
  const [quadra, setQuadra] = useState('');

  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] =
    useState('');

  const [mostrarSenha, setMostrarSenha] =
    useState(false);

  const [mostrarConfirmacao, setMostrarConfirmacao] =
    useState(false);

  const [cadastrando, setCadastrando] = useState(false);

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

  function selecionarTipoResidencia(
    tipo: TipoResidencia
  ) {
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

    const nomeLimpo = nome.trim();
    const cpfNumeros = cpf.replace(/\D/g, '');
    const telefoneLimpo = telefone.trim();

    if (!nomeLimpo) {
      Alert.alert('Atenção', 'Informe o nome completo do morador.');
      return;
    }

    if (cpfNumeros.length !== 11) {
      Alert.alert('Atenção', 'Informe um CPF com 11 números.');
      return;
    }

    if (
      tipoResidencia === 'apartamento_bloco' &&
      (!apartamento.trim() || !bloco.trim())
    ) {
      Alert.alert(
        'Atenção',
        'Informe o apartamento e o bloco do morador.'
      );
      return;
    }

    if (
      (tipoResidencia === 'casa' ||
        tipoResidencia === 'casa_quadra') &&
      !casa.trim()
    ) {
      Alert.alert('Atenção', 'Informe a casa do morador.');
      return;
    }

    if (
      tipoResidencia === 'casa_quadra' &&
      !quadra.trim()
    ) {
      Alert.alert('Atenção', 'Informe a quadra do morador.');
      return;
    }

    if (senha.length < 6) {
      Alert.alert(
        'Atenção',
        'A senha deve ter pelo menos 6 caracteres.'
      );
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert(
        'Atenção',
        'A senha e a confirmação de senha são diferentes.'
      );
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
        Alert.alert(
          'Sessão expirada',
          'Entre novamente na área administrativa e tente cadastrar o morador.'
        );
        return;
      }

      console.log(
        'Chamando Edge Function cadastrar-morador...'
      );

      const { data, error } =
        await supabase.functions.invoke(
          'cadastrar-morador',
          {
            body: {
              nome: nomeLimpo,
              cpf: cpfNumeros,
              telefone: telefoneLimpo || null,
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
              Authorization:
                `Bearer ${session.access_token}`,
            },
          }
        );

      console.log('Resposta da Edge Function:', {
        data,
        error: error
          ? {
              name: error.name,
              message: error.message,
            }
          : null,
      });

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
            const resposta = await contexto.clone().json();

            if (resposta?.mensagem) {
              mensagem = resposta.mensagem;
            } else if (resposta?.message) {
              mensagem = resposta.message;
            } else if (resposta?.error) {
              mensagem = resposta.error;
            }
          } catch {
            // Mantém a mensagem original do Supabase.
          }
        }

        Alert.alert('Erro no cadastro', mensagem);
        return;
      }

      if (!data?.sucesso) {
        Alert.alert(
          'Erro no cadastro',
          data?.mensagem ||
            'O servidor não confirmou o cadastro do morador.'
        );
        return;
      }

      Alert.alert(
        'Cadastro concluído',
        data?.mensagem ||
          'Morador cadastrado com sucesso.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (erro) {
      console.error('Erro ao cadastrar morador:', erro);

      const mensagem =
        erro instanceof Error
          ? erro.message
          : 'Ocorreu um erro inesperado durante o cadastro.';

      Alert.alert('Erro no cadastro', mensagem);
    } finally {
      setCadastrando(false);
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
              paddingTop: Math.max(insets.top, 14),
              paddingBottom:
                Math.max(insets.bottom, 18) + 24,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* CABEÇALHO */}
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft
                size={21}
                color="#FFFFFF"
              />
            </Pressable>

            <View style={styles.headerContent}>
              <Text style={styles.headerLabel}>
                ADMINISTRAÇÃO
              </Text>

              <Text style={styles.headerTitle}>
                Novo morador
              </Text>
            </View>

            <View style={styles.headerIcon}>
              <UserRound
                size={22}
                color="#FFFFFF"
              />
            </View>
          </View>

          {/* INTRODUÇÃO */}
          <View style={styles.intro}>
            <Text style={styles.title}>
              Cadastrar morador
            </Text>

            <Text style={styles.subtitle}>
              Preencha as informações do morador e da
              sua unidade residencial.
            </Text>
          </View>

          {/* AVISO */}
          <View style={styles.securityCard}>
            <View style={styles.securityIcon}>
              <ShieldCheck
                size={20}
                color={colors.primary}
              />
            </View>

            <View style={styles.securityContent}>
              <Text style={styles.securityTitle}>
                Cadastro administrativo
              </Text>

              <Text
                style={styles.securityDescription}
              >
                O acesso do morador será criado e
                administrado pelo condomínio.
              </Text>
            </View>
          </View>

          {/* DADOS PESSOAIS */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>
              Dados pessoais
            </Text>

            <Text
              style={styles.sectionDescription}
            >
              Informações de identificação do morador.
            </Text>

            <Text style={styles.label}>
              Nome completo
            </Text>

            <View style={styles.inputContainer}>
              <UserRound
                size={18}
                color={colors.textSecondary}
              />

              <TextInput
                style={styles.input}
                value={nome}
                onChangeText={setNome}
                placeholder="Nome completo do morador"
                placeholderTextColor={
                  colors.textLight
                }
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <Text style={styles.label}>
              CPF
            </Text>

            <View style={styles.inputContainer}>
              <ShieldCheck
                size={18}
                color={colors.textSecondary}
              />

              <TextInput
                style={styles.input}
                value={cpf}
                onChangeText={(valor) =>
                  setCpf(formatarCPF(valor))
                }
                placeholder="000.000.000-00"
                placeholderTextColor={
                  colors.textLight
                }
                keyboardType="numeric"
                maxLength={14}
                returnKeyType="next"
              />
            </View>

            <Text style={styles.label}>
              Telefone
            </Text>

            <View style={styles.inputContainer}>
              <Phone
                size={18}
                color={colors.textSecondary}
              />

              <TextInput
                style={styles.input}
                value={telefone}
                onChangeText={(valor) =>
                  setTelefone(
                    formatarTelefone(valor)
                  )
                }
                placeholder="(00) 00000-0000"
                placeholderTextColor={
                  colors.textLight
                }
                keyboardType="phone-pad"
                maxLength={15}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* UNIDADE RESIDENCIAL */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>
              Unidade residencial
            </Text>

            <Text
              style={styles.sectionDescription}
            >
              Selecione o tipo de unidade do morador.
            </Text>

            {/* OPÇÃO APARTAMENTO */}
            <Pressable
              style={({ pressed }) => [
                styles.residenceOption,
                tipoResidencia ===
                  'apartamento_bloco' &&
                  styles.residenceOptionSelected,
                pressed && styles.optionPressed,
              ]}
              onPress={() =>
                selecionarTipoResidencia(
                  'apartamento_bloco'
                )
              }
            >
              <View
                style={[
                  styles.residenceIcon,
                  tipoResidencia ===
                    'apartamento_bloco' &&
                    styles.residenceIconSelected,
                ]}
              >
                <Building2
                  size={20}
                  color={
                    tipoResidencia ===
                    'apartamento_bloco'
                      ? '#FFFFFF'
                      : colors.textSecondary
                  }
                />
              </View>

              <View style={styles.residenceContent}>
                <Text
                  style={[
                    styles.residenceTitle,
                    tipoResidencia ===
                      'apartamento_bloco' &&
                      styles.residenceTitleSelected,
                  ]}
                >
                  Apartamento e Bloco
                </Text>

                <Text
                  style={
                    styles.residenceDescription
                  }
                >
                  Morador de apartamento
                </Text>
              </View>

              <View
                style={[
                  styles.radioOuter,
                  tipoResidencia ===
                    'apartamento_bloco' &&
                    styles.radioOuterSelected,
                ]}
              >
                {tipoResidencia ===
                'apartamento_bloco' ? (
                  <View
                    style={styles.radioInner}
                  />
                ) : null}
              </View>
            </Pressable>

            {/* OPÇÃO CASA */}
            <Pressable
              style={({ pressed }) => [
                styles.residenceOption,
                tipoResidencia === 'casa' &&
                  styles.residenceOptionSelected,
                pressed && styles.optionPressed,
              ]}
              onPress={() =>
                selecionarTipoResidencia('casa')
              }
            >
              <View
                style={[
                  styles.residenceIcon,
                  tipoResidencia === 'casa' &&
                    styles.residenceIconSelected,
                ]}
              >
                <Home
                  size={20}
                  color={
                    tipoResidencia === 'casa'
                      ? '#FFFFFF'
                      : colors.textSecondary
                  }
                />
              </View>

              <View style={styles.residenceContent}>
                <Text
                  style={[
                    styles.residenceTitle,
                    tipoResidencia === 'casa' &&
                      styles.residenceTitleSelected,
                  ]}
                >
                  Casa
                </Text>

                <Text
                  style={
                    styles.residenceDescription
                  }
                >
                  Morador de casa
                </Text>
              </View>

              <View
                style={[
                  styles.radioOuter,
                  tipoResidencia === 'casa' &&
                    styles.radioOuterSelected,
                ]}
              >
                {tipoResidencia === 'casa' ? (
                  <View
                    style={styles.radioInner}
                  />
                ) : null}
              </View>
            </Pressable>

            {/* OPÇÃO CASA E QUADRA */}
            <Pressable
              style={({ pressed }) => [
                styles.residenceOption,
                tipoResidencia ===
                  'casa_quadra' &&
                  styles.residenceOptionSelected,
                pressed && styles.optionPressed,
              ]}
              onPress={() =>
                selecionarTipoResidencia(
                  'casa_quadra'
                )
              }
            >
              <View
                style={[
                  styles.residenceIcon,
                  tipoResidencia ===
                    'casa_quadra' &&
                    styles.residenceIconSelected,
                ]}
              >
                <MapPin
                  size={20}
                  color={
                    tipoResidencia ===
                    'casa_quadra'
                      ? '#FFFFFF'
                      : colors.textSecondary
                  }
                />
              </View>

              <View style={styles.residenceContent}>
                <Text
                  style={[
                    styles.residenceTitle,
                    tipoResidencia ===
                      'casa_quadra' &&
                      styles.residenceTitleSelected,
                  ]}
                >
                  Casa e Quadra
                </Text>

                <Text
                  style={
                    styles.residenceDescription
                  }
                >
                  Casa identificada por quadra
                </Text>
              </View>

              <View
                style={[
                  styles.radioOuter,
                  tipoResidencia ===
                    'casa_quadra' &&
                    styles.radioOuterSelected,
                ]}
              >
                {tipoResidencia ===
                'casa_quadra' ? (
                  <View
                    style={styles.radioInner}
                  />
                ) : null}
              </View>
            </Pressable>

            {/* APARTAMENTO E BLOCO */}
            {tipoResidencia ===
            'apartamento_bloco' ? (
              <View style={styles.fieldsArea}>
                <View style={styles.row}>
                  <View style={styles.half}>
                    <Text style={styles.label}>
                      Apartamento
                    </Text>

                    <View
                      style={
                        styles.inputContainer
                      }
                    >
                      <Building2
                        size={18}
                        color={
                          colors.textSecondary
                        }
                      />

                      <TextInput
                        style={styles.input}
                        value={apartamento}
                        onChangeText={
                          setApartamento
                        }
                        placeholder="Ex: 302"
                        placeholderTextColor={
                          colors.textLight
                        }
                        autoCapitalize="characters"
                      />
                    </View>
                  </View>

                  <View
                    style={styles.rowSpace}
                  />

                  <View style={styles.half}>
                    <Text style={styles.label}>
                      Bloco
                    </Text>

                    <View
                      style={
                        styles.inputContainer
                      }
                    >
                      <MapPin
                        size={18}
                        color={
                          colors.textSecondary
                        }
                      />

                      <TextInput
                        style={styles.input}
                        value={bloco}
                        onChangeText={setBloco}
                        placeholder="Ex: B"
                        placeholderTextColor={
                          colors.textLight
                        }
                        autoCapitalize="characters"
                      />
                    </View>
                  </View>
                </View>
              </View>
            ) : null}

            {/* SOMENTE CASA */}
            {tipoResidencia === 'casa' ? (
              <View style={styles.fieldsArea}>
                <Text style={styles.label}>
                  Casa
                </Text>

                <View
                  style={styles.inputContainer}
                >
                  <Home
                    size={18}
                    color={colors.textSecondary}
                  />

                  <TextInput
                    style={styles.input}
                    value={casa}
                    onChangeText={setCasa}
                    placeholder="Ex: 12"
                    placeholderTextColor={
                      colors.textLight
                    }
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            ) : null}

            {/* CASA E QUADRA */}
            {tipoResidencia ===
            'casa_quadra' ? (
              <View style={styles.fieldsArea}>
                <View style={styles.row}>
                  <View style={styles.half}>
                    <Text style={styles.label}>
                      Casa
                    </Text>

                    <View
                      style={
                        styles.inputContainer
                      }
                    >
                      <Home
                        size={18}
                        color={
                          colors.textSecondary
                        }
                      />

                      <TextInput
                        style={styles.input}
                        value={casa}
                        onChangeText={setCasa}
                        placeholder="Ex: 12"
                        placeholderTextColor={
                          colors.textLight
                        }
                        autoCapitalize="characters"
                      />
                    </View>
                  </View>

                  <View
                    style={styles.rowSpace}
                  />

                  <View style={styles.half}>
                    <Text style={styles.label}>
                      Quadra
                    </Text>

                    <View
                      style={
                        styles.inputContainer
                      }
                    >
                      <MapPin
                        size={18}
                        color={
                          colors.textSecondary
                        }
                      />

                      <TextInput
                        style={styles.input}
                        value={quadra}
                        onChangeText={setQuadra}
                        placeholder="Ex: A"
                        placeholderTextColor={
                          colors.textLight
                        }
                        autoCapitalize="characters"
                      />
                    </View>
                  </View>
                </View>
              </View>
            ) : null}
          </View>

          {/* ACESSO */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>
              Acesso do morador
            </Text>

            <Text
              style={styles.sectionDescription}
            >
              Defina uma senha inicial para o primeiro
              acesso.
            </Text>

            <Text style={styles.label}>
              Senha inicial
            </Text>

            <View style={styles.inputContainer}>
              <LockKeyhole
                size={18}
                color={colors.textSecondary}
              />

              <TextInput
                style={styles.input}
                value={senha}
                onChangeText={setSenha}
                placeholder="Mínimo de 6 caracteres"
                placeholderTextColor={
                  colors.textLight
                }
                secureTextEntry={!mostrarSenha}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
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

            <Text style={styles.label}>
              Confirmar senha
            </Text>

            <View style={styles.inputContainer}>
              <LockKeyhole
                size={18}
                color={colors.textSecondary}
              />

              <TextInput
                style={styles.input}
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                placeholder="Digite a senha novamente"
                placeholderTextColor={
                  colors.textLight
                }
                secureTextEntry={
                  !mostrarConfirmacao
                }
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onFocus={() => {
                  setTimeout(() => {
                    scrollRef.current?.scrollToEnd({
                      animated: true,
                    });
                  }, 250);
                }}
              />

              <Pressable
                style={styles.eyeButton}
                onPress={() =>
                  setMostrarConfirmacao(
                    (valor) => !valor
                  )
                }
              >
                {mostrarConfirmacao ? (
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
          </View>

          {/* BOTÃO CADASTRAR */}
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              cadastrando && styles.saveButtonDisabled,
              pressed &&
                !cadastrando &&
                styles.savePressed,
            ]}
            onPress={cadastrar}
            disabled={cadastrando}
          >
            {cadastrando ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <Save
                size={19}
                color="#FFFFFF"
              />
            )}

            <Text style={styles.saveButtonText}>
              {cadastrando
                ? 'Cadastrando...'
                : 'Cadastrar morador'}
            </Text>
          </Pressable>

          <Text style={styles.requiredText}>
            Todos os campos principais deverão ser
            preenchidos antes de finalizar o cadastro.
          </Text>

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>
              ConectaLar
            </Text>

            <Text style={styles.footerText}>
              Gestão segura do condomínio
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
  },

  header: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    marginHorizontal: 16,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor:
      'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerContent: {
    flex: 1,
    marginLeft: 13,
  },

  headerLabel: {
    color: '#93C5FD',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  intro: {
    paddingHorizontal: 20,
    marginTop: 23,
  },

  title: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.4,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
  },

  securityIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  securityContent: {
    flex: 1,
    marginLeft: 10,
  },

  securityTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },

  securityDescription: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 13,
    marginTop: 2,
  },

  formCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    marginHorizontal: 20,
    marginTop: 14,
    padding: 14,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },

  sectionDescription: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 2,
    marginBottom: 14,
  },

  label: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 5,
    marginTop: 11,
  },

  inputContainer: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 11,
  },

  input: {
    flex: 1,
    height: 47,
    color: colors.text,
    fontSize: 11,
    marginLeft: 9,
  },

  eyeButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },

  residenceOption: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    paddingHorizontal: 11,
    paddingVertical: 9,
    marginBottom: 8,
  },

  residenceOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },

  residenceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  residenceIconSelected: {
    backgroundColor: colors.primary,
  },

  residenceContent: {
    flex: 1,
    marginLeft: 10,
  },

  residenceTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },

  residenceTitleSelected: {
    color: colors.primary,
    fontWeight: '800',
  },

  residenceDescription: {
    color: colors.textSecondary,
    fontSize: 8,
    marginTop: 2,
  },

  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioOuterSelected: {
    borderColor: colors.primary,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },

  optionPressed: {
    opacity: 0.78,
  },

  fieldsArea: {
    marginTop: 3,
  },

  row: {
    flexDirection: 'row',
  },

  half: {
    flex: 1,
  },

  rowSpace: {
    width: 10,
  },

  saveButton: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 18,
    gap: 8,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  saveButtonDisabled: {
    opacity: 0.65,
  },

  savePressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },

  requiredText: {
    color: colors.textLight,
    fontSize: 8,
    lineHeight: 12,
    textAlign: 'center',
    marginHorizontal: 35,
    marginTop: 9,
  },

  footer: {
    alignItems: 'center',
    paddingTop: 20,
  },

  footerBrand: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
  },

  footerText: {
    color: colors.textLight,
    fontSize: 8,
    marginTop: 2,
  },

  pressed: {
    opacity: 0.75,
  },
});