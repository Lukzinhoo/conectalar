import React, { useState } from 'react';

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthStackParamList } from '../../../navigation/AuthNavigator';
import { supabase } from '../../../services/supabase';

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
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');

  // NOVO: e-mail de contato
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

    const cpfNumeros = cpf.replace(
      /\D/g,
      ''
    );

    const emailLimpo = email
      .trim()
      .toLowerCase();

    const telefoneLimpo = telefone.trim();

    // ===============================
    // VALIDAÇÕES
    // ===============================

    if (!nomeLimpo) {
      setErro(
        'Informe o nome completo do morador.'
      );
      return;
    }

    if (cpfNumeros.length !== 11) {
      setErro(
        'Informe um CPF com 11 números.'
      );
      return;
    }

    if (!emailLimpo) {
      setErro(
        'Informe o e-mail do morador.'
      );
      return;
    }

    if (!validarEmail(emailLimpo)) {
      setErro(
        'Informe um e-mail válido.'
      );
      return;
    }

    if (
      tipoResidencia ===
        'apartamento_bloco' &&
      (!apartamento.trim() ||
        !bloco.trim())
    ) {
      setErro(
        'Informe o apartamento e o bloco.'
      );
      return;
    }

    if (
      (tipoResidencia === 'casa' ||
        tipoResidencia ===
          'casa_quadra') &&
      !casa.trim()
    ) {
      setErro(
        'Informe a casa do morador.'
      );
      return;
    }

    if (
      tipoResidencia ===
        'casa_quadra' &&
      !quadra.trim()
    ) {
      setErro(
        'Informe a quadra do morador.'
      );
      return;
    }

    if (senha.length < 6) {
      setErro(
        'A senha deve ter pelo menos 6 caracteres.'
      );
      return;
    }

    if (senha !== confirmarSenha) {
      setErro(
        'A senha e a confirmação são diferentes.'
      );
      return;
    }

    // ===============================
    // CADASTRAR
    // ===============================

    try {
      setCadastrando(true);

      const {
        data: { session },
        error: sessionError,
      } =
        await supabase.auth.getSession();

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

              // E-MAIL AGORA É ENVIADO
              // DIRETAMENTE PARA A EDGE FUNCTION
              email: emailLimpo,

              telefone:
                telefoneLimpo || null,

              tipoResidencia,

              apartamento:
                tipoResidencia ===
                'apartamento_bloco'
                  ? apartamento.trim()
                  : null,

              bloco:
                tipoResidencia ===
                'apartamento_bloco'
                  ? bloco.trim()
                  : null,

              casa:
                tipoResidencia ===
                  'casa' ||
                tipoResidencia ===
                  'casa_quadra'
                  ? casa.trim()
                  : null,

              quadra:
                tipoResidencia ===
                'casa_quadra'
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

      // ===============================
      // ERRO DA EDGE FUNCTION
      // ===============================

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
            const resposta =
              await contexto
                .clone()
                .json();

            if (resposta?.mensagem) {
              mensagem =
                resposta.mensagem;
            } else if (
              resposta?.message
            ) {
              mensagem =
                resposta.message;
            } else if (
              resposta?.error
            ) {
              mensagem =
                resposta.error;
            }
          } catch {
            // mantém a mensagem original
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

      // ===============================
      // SUCESSO
      // ===============================

      setSucesso(
        data?.mensagem ||
          'Morador cadastrado com sucesso.'
      );

      setTimeout(() => {
        navigation.replace(
          'WebMoradores'
        );
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

  async function sair() {
    await supabase.auth.signOut();

    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'WebLogin',
        },
      ],
    });
  }

  return (
    <View style={styles.container}>
      {/* SIDEBAR */}

      <View style={styles.sidebar}>
        <View>
          <View style={styles.logoArea}>
            <View style={styles.logo}>
              <Text style={styles.logoLetter}>
                C
              </Text>
            </View>

            <View>
              <Text style={styles.logoName}>
                ConectaLar
              </Text>

              <Text
                style={styles.logoSubtitle}
              >
                Administração
              </Text>
            </View>
          </View>

          <View style={styles.menu}>
            <MenuItem
              icon="⌂"
              title="Dashboard"
              onPress={() =>
                navigation.navigate(
                  'WebDashboard'
                )
              }
            />

            <MenuItem
              icon="♙"
              title="Moradores"
              active
              onPress={() =>
                navigation.navigate(
                  'WebMoradores'
                )
              }
            />

            <MenuItem
              icon="▣"
              title="Reservas"
              onPress={() =>
                navigation.navigate(
                  'WebReservas'
                )
              }
            />

            <MenuItem
              icon="◁"
              title="Comunicados"
              onPress={() =>
                navigation.navigate(
                  'WebComunicados'
                )
              }
            />

            <MenuItem
              icon="△"
              title="Ocorrências"
              onPress={() =>
                navigation.navigate(
                  'WebOcorrencias'
                )
              }
            />

            <MenuItem
              icon="○"
              title="Chat"
              onPress={() =>
                navigation.navigate(
                  'WebChat'
                )
              }
            />

            <MenuItem
              icon="□"
              title="Chat Geral"
              onPress={() =>
                navigation.navigate(
                  'WebChatGeral'
                )
              }
            />

            <MenuItem
              icon="▤"
              title="Regras"
              onPress={() =>
                navigation.navigate(
                  'WebRegras'
                )
              }
            />

            <MenuItem
              icon="◷"
              title="Horários"
              onPress={() =>
                navigation.navigate(
                  'WebHorarios'
                )
              }
            />

            <MenuItem
              icon="♢"
              title="Notificações"
              onPress={() =>
                navigation.navigate(
                  'WebNotificacoes'
                )
              }
            />

            <MenuItem
              icon="$"
              title="Financeiro"
              onPress={() =>
                navigation.navigate(
                  'WebFinanceiro'
                )
              }
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.logout}
          onPress={sair}
        >
          <Text style={styles.logoutIcon}>
            ↪
          </Text>

          <Text style={styles.logoutText}>
            Sair da conta
          </Text>
        </TouchableOpacity>
      </View>

      {/* CONTEÚDO */}

      <View style={styles.main}>
        {/* HEADER */}

        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>
              Novo morador
            </Text>

            <Text
              style={styles.pageSubtitle}
            >
              Cadastre um novo morador no
              condomínio
            </Text>
          </View>

          <View style={styles.adminArea}>
            <View style={styles.avatar}>
              <Text
                style={styles.avatarText}
              >
                A
              </Text>
            </View>

            <View>
              <Text
                style={styles.adminName}
              >
                Administrador
              </Text>

              <Text
                style={styles.adminRole}
              >
                Administrador
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={
            styles.content
          }
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              navigation.navigate(
                'WebMoradores'
              )
            }
          >
            <Text style={styles.backText}>
              ← Voltar para moradores
            </Text>
          </TouchableOpacity>

          <View
            style={styles.formContainer}
          >
            <View
              style={styles.formHeader}
            >
              <Text
                style={styles.formTitle}
              >
                Cadastrar morador
              </Text>

              <Text
                style={
                  styles.formDescription
                }
              >
                Preencha os dados pessoais,
                a unidade residencial e a
                senha inicial.
              </Text>
            </View>

            {/* ERRO */}

            {erro ? (
              <View
                style={styles.errorBox}
              >
                <Text
                  style={
                    styles.errorTitle
                  }
                >
                  Não foi possível
                  continuar
                </Text>

                <Text
                  style={
                    styles.errorText
                  }
                >
                  {erro}
                </Text>
              </View>
            ) : null}

            {/* SUCESSO */}

            {sucesso ? (
              <View
                style={styles.successBox}
              >
                <Text
                  style={
                    styles.successTitle
                  }
                >
                  Cadastro concluído
                </Text>

                <Text
                  style={
                    styles.successText
                  }
                >
                  {sucesso}
                </Text>
              </View>
            ) : null}

            {/* DADOS PESSOAIS */}

            <View style={styles.card}>
              <Text
                style={styles.cardTitle}
              >
                Dados pessoais
              </Text>

              <Text
                style={
                  styles.cardDescription
                }
              >
                Informações de identificação
                e contato do morador.
              </Text>

              {/* NOME + CPF */}

              <View
                style={styles.twoColumns}
              >
                <View
                  style={styles.fieldLarge}
                >
                  <Text
                    style={styles.label}
                  >
                    Nome completo
                  </Text>

                  <TextInput
                    value={nome}
                    onChangeText={setNome}
                    placeholder="Nome completo do morador"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                  />
                </View>

                <View
                  style={styles.field}
                >
                  <Text
                    style={styles.label}
                  >
                    CPF
                  </Text>

                  <TextInput
                    value={cpf}
                    onChangeText={(
                      valor
                    ) =>
                      setCpf(
                        formatarCPF(
                          valor
                        )
                      )
                    }
                    placeholder="000.000.000-00"
                    placeholderTextColor="#94A3B8"
                    maxLength={14}
                    style={styles.input}
                  />
                </View>
              </View>

              {/* EMAIL + TELEFONE */}

              <View
                style={styles.twoColumns}
              >
                <View
                  style={styles.field}
                >
                  <Text
                    style={styles.label}
                  >
                    E-mail
                  </Text>

                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="morador@email.com"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={styles.input}
                  />
                </View>

                <View
                  style={styles.field}
                >
                  <Text
                    style={styles.label}
                  >
                    Telefone
                  </Text>

                  <TextInput
                    value={telefone}
                    onChangeText={(
                      valor
                    ) =>
                      setTelefone(
                        formatarTelefone(
                          valor
                        )
                      )
                    }
                    placeholder="(00) 00000-0000"
                    placeholderTextColor="#94A3B8"
                    maxLength={15}
                    style={styles.input}
                  />
                </View>
              </View>
            </View>

            {/* UNIDADE RESIDENCIAL */}

            <View style={styles.card}>
              <Text
                style={styles.cardTitle}
              >
                Unidade residencial
              </Text>

              <Text
                style={
                  styles.cardDescription
                }
              >
                Selecione o tipo de
                residência.
              </Text>

              <View
                style={
                  styles.residenceRow
                }
              >
                <ResidenceButton
                  title="Apartamento e Bloco"
                  subtitle="Morador de apartamento"
                  icon="A"
                  selected={
                    tipoResidencia ===
                    'apartamento_bloco'
                  }
                  onPress={() =>
                    selecionarTipo(
                      'apartamento_bloco'
                    )
                  }
                />

                <ResidenceButton
                  title="Casa"
                  subtitle="Morador de casa"
                  icon="C"
                  selected={
                    tipoResidencia ===
                    'casa'
                  }
                  onPress={() =>
                    selecionarTipo(
                      'casa'
                    )
                  }
                />

                <ResidenceButton
                  title="Casa e Quadra"
                  subtitle="Casa identificada por quadra"
                  icon="Q"
                  selected={
                    tipoResidencia ===
                    'casa_quadra'
                  }
                  onPress={() =>
                    selecionarTipo(
                      'casa_quadra'
                    )
                  }
                />
              </View>

              {/* APARTAMENTO */}

              {tipoResidencia ===
              'apartamento_bloco' ? (
                <View
                  style={
                    styles.twoColumns
                  }
                >
                  <View
                    style={
                      styles.field
                    }
                  >
                    <Text
                      style={
                        styles.label
                      }
                    >
                      Apartamento
                    </Text>

                    <TextInput
                      value={
                        apartamento
                      }
                      onChangeText={
                        setApartamento
                      }
                      placeholder="Ex: 302"
                      placeholderTextColor="#94A3B8"
                      style={
                        styles.input
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.field
                    }
                  >
                    <Text
                      style={
                        styles.label
                      }
                    >
                      Bloco
                    </Text>

                    <TextInput
                      value={bloco}
                      onChangeText={
                        setBloco
                      }
                      placeholder="Ex: B"
                      placeholderTextColor="#94A3B8"
                      style={
                        styles.input
                      }
                    />
                  </View>
                </View>
              ) : null}

              {/* CASA */}

              {tipoResidencia ===
              'casa' ? (
                <View
                  style={
                    styles.fieldTop
                  }
                >
                  <Text
                    style={
                      styles.label
                    }
                  >
                    Casa
                  </Text>

                  <TextInput
                    value={casa}
                    onChangeText={
                      setCasa
                    }
                    placeholder="Ex: 12"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                  />
                </View>
              ) : null}

              {/* CASA + QUADRA */}

              {tipoResidencia ===
              'casa_quadra' ? (
                <View
                  style={
                    styles.twoColumns
                  }
                >
                  <View
                    style={
                      styles.field
                    }
                  >
                    <Text
                      style={
                        styles.label
                      }
                    >
                      Casa
                    </Text>

                    <TextInput
                      value={casa}
                      onChangeText={
                        setCasa
                      }
                      placeholder="Ex: 12"
                      placeholderTextColor="#94A3B8"
                      style={
                        styles.input
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.field
                    }
                  >
                    <Text
                      style={
                        styles.label
                      }
                    >
                      Quadra
                    </Text>

                    <TextInput
                      value={quadra}
                      onChangeText={
                        setQuadra
                      }
                      placeholder="Ex: A"
                      placeholderTextColor="#94A3B8"
                      style={
                        styles.input
                      }
                    />
                  </View>
                </View>
              ) : null}
            </View>

            {/* ACESSO */}

            <View style={styles.card}>
              <Text
                style={styles.cardTitle}
              >
                Acesso do morador
              </Text>

              <Text
                style={
                  styles.cardDescription
                }
              >
                Defina a senha inicial do
                morador. O acesso continua
                sendo feito com CPF e senha.
              </Text>

              <View
                style={styles.twoColumns}
              >
                <View
                  style={styles.field}
                >
                  <Text
                    style={styles.label}
                  >
                    Senha inicial
                  </Text>

                  <View
                    style={
                      styles.passwordBox
                    }
                  >
                    <TextInput
                      value={senha}
                      onChangeText={
                        setSenha
                      }
                      placeholder="Mínimo de 6 caracteres"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={
                        !mostrarSenha
                      }
                      style={
                        styles.passwordInput
                      }
                    />

                    <TouchableOpacity
                      onPress={() =>
                        setMostrarSenha(
                          (valor) =>
                            !valor
                        )
                      }
                    >
                      <Text
                        style={
                          styles.eye
                        }
                      >
                        {mostrarSenha
                          ? 'Ocultar'
                          : 'Ver'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View
                  style={styles.field}
                >
                  <Text
                    style={styles.label}
                  >
                    Confirmar senha
                  </Text>

                  <TextInput
                    value={
                      confirmarSenha
                    }
                    onChangeText={
                      setConfirmarSenha
                    }
                    placeholder="Digite a senha novamente"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={
                      !mostrarSenha
                    }
                    style={styles.input}
                  />
                </View>
              </View>
            </View>

            {/* BOTÕES */}

            <View
              style={styles.actions}
            >
              <TouchableOpacity
                style={
                  styles.cancelButton
                }
                disabled={cadastrando}
                onPress={() =>
                  navigation.navigate(
                    'WebMoradores'
                  )
                }
              >
                <Text
                  style={
                    styles.cancelText
                  }
                >
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,

                  cadastrando &&
                    styles.saveButtonDisabled,
                ]}
                disabled={cadastrando}
                onPress={cadastrar}
              >
                {cadastrando ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : null}

                <Text
                  style={
                    styles.saveText
                  }
                >
                  {cadastrando
                    ? 'Cadastrando...'
                    : 'Cadastrar morador'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// =====================================
// MENU
// =====================================

type MenuItemProps = {
  icon: string;
  title: string;
  active?: boolean;
  onPress?: () => void;
};

function MenuItem({
  icon,
  title,
  active,
  onPress,
}: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[
        styles.menuItem,
        active &&
          styles.menuItemActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={styles.menuIcon}
      >
        {icon}
      </Text>

      <Text
        style={[
          styles.menuText,

          active &&
            styles.menuTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

// =====================================
// TIPO DE RESIDÊNCIA
// =====================================

type ResidenceButtonProps = {
  title: string;
  subtitle: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
};

function ResidenceButton({
  title,
  subtitle,
  icon,
  selected,
  onPress,
}: ResidenceButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.residenceButton,

        selected &&
          styles.residenceButtonSelected,
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
        <Text
          style={[
            styles.residenceIcon,

            selected &&
              styles.residenceIconSelected,
          ]}
        >
          {icon}
        </Text>
      </View>

      <View
        style={
          styles.residenceTextArea
        }
      >
        <Text
          style={[
            styles.residenceTitle,

            selected &&
              styles.residenceTitleSelected,
          ]}
        >
          {title}
        </Text>

        <Text
          style={
            styles.residenceSubtitle
          }
        >
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
        {selected ? (
          <View
            style={
              styles.radioInside
            }
          />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// =====================================
// ESTILOS
// =====================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
  },

  sidebar: {
    width: 260,
    backgroundColor: '#0F172A',
    paddingHorizontal: 18,
    paddingVertical: 28,
    justifyContent: 'space-between',
  },

  logoArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 32,
  },

  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  logoLetter: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '800',
  },

  logoName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },

  logoSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },

  menu: {
    gap: 4,
  },

  menuItem: {
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 10,
  },

  menuItemActive: {
    backgroundColor: '#1E40AF',
  },

  menuIcon: {
    width: 30,
    color: '#94A3B8',
    fontSize: 17,
    textAlign: 'center',
  },

  menuText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },

  menuTextActive: {
    color: '#FFFFFF',
  },

  logout: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  logoutIcon: {
    color: '#94A3B8',
    width: 30,
    fontSize: 20,
  },

  logoutText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },

  main: {
    flex: 1,
  },

  header: {
    height: 88,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  pageTitle: {
    color: '#0F172A',
    fontSize: 23,
    fontWeight: '800',
  },

  pageSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 3,
  },

  adminArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  avatarText: {
    color: '#2563EB',
    fontWeight: '800',
  },

  adminName: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },

  adminRole: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: 35,
    paddingBottom: 60,
  },

  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 18,
  },

  backText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
  },

  formContainer: {
    width: '100%',
    maxWidth: 1050,
    alignSelf: 'center',
  },

  formHeader: {
    marginBottom: 20,
  },

  formTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
  },

  formDescription: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 5,
  },

  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },

  errorTitle: {
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '800',
  },

  errorText: {
    color: '#B91C1C',
    fontSize: 11,
    marginTop: 4,
  },

  successBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },

  successTitle: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '800',
  },

  successText: {
    color: '#15803D',
    fontSize: 11,
    marginTop: 4,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 13,
    padding: 22,
    marginBottom: 16,
  },

  cardTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },

  cardDescription: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 3,
    marginBottom: 18,
  },

  twoColumns: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 13,
  },

  field: {
    flex: 1,
  },

  fieldLarge: {
    flex: 1.5,
  },

  fieldTop: {
    marginTop: 15,
  },

  label: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 7,
  },

  input: {
    height: 46,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 13,
    color: '#0F172A',
    fontSize: 12,
  },

  residenceRow: {
    flexDirection: 'row',
    gap: 12,
  },

  residenceButton: {
    flex: 1,
    minHeight: 78,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  residenceButtonSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },

  residenceIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  residenceIconBoxSelected: {
    backgroundColor: '#DBEAFE',
  },

  residenceIcon: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '800',
  },

  residenceIconSelected: {
    color: '#2563EB',
  },

  residenceTextArea: {
    flex: 1,
  },

  residenceTitle: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
  },

  residenceTitleSelected: {
    color: '#2563EB',
  },

  residenceSubtitle: {
    color: '#94A3B8',
    fontSize: 8,
    marginTop: 3,
  },

  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },

  radioSelected: {
    borderColor: '#2563EB',
  },

  radioInside: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },

  passwordBox: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 13,
  },

  passwordInput: {
    flex: 1,
    height: '100%',
    color: '#0F172A',
    fontSize: 12,
  },

  eye: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '700',
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 5,
  },

  cancelButton: {
    height: 46,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    paddingHorizontal: 22,
    justifyContent: 'center',
  },

  cancelText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },

  saveButton: {
    minWidth: 180,
    height: 46,
    backgroundColor: '#2563EB',
    borderRadius: 9,
    paddingHorizontal: 22,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonDisabled: {
    opacity: 0.65,
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});