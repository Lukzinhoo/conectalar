import React, { useState } from 'react';

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  AtSign,
  CheckCircle2,
  Edit3,
  Home,
  IdCard,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  User,
  X,
} from 'lucide-react-native';

import { colors } from '../../../theme/theme';
import WebMoradorSidebar from '../../../components/WebMoradorSidebar';

type PerfilMorador = {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  casa: string;
  quadra: string;
};

const perfilExemplo: PerfilMorador = {
  nome: 'João da Silva',
  email: 'joao@email.com',
  cpf: '123.456.789-00',
  telefone: '(81) 99999-9999',
  casa: '12',
  quadra: 'A',
};

export default function WebMoradorPerfilScreen() {
  const [editando, setEditando] =
    useState(false);

  const [perfil, setPerfil] =
    useState<PerfilMorador>(
      perfilExemplo
    );

  const [form, setForm] =
    useState<PerfilMorador>(
      perfilExemplo
    );

  function iniciarEdicao() {
    setForm(perfil);
    setEditando(true);
  }

  function cancelarEdicao() {
    setForm(perfil);
    setEditando(false);
  }

  function salvarAlteracoes() {
    /*
      Mais tarde vamos conectar esta função
      ao Supabase.

      Por enquanto ela atualiza apenas
      os dados visuais da tela.
    */

    setPerfil(form);
    setEditando(false);
  }

  return (
    <View style={styles.container}>
      <WebMoradorSidebar
        active="perfil"
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={
          styles.contentContainer
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* CABEÇALHO */}

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Meu Perfil
            </Text>

            <Text style={styles.subtitle}>
              Consulte seus dados pessoais
              e informações da residência.
            </Text>
          </View>

          {!editando ? (
            <Pressable
              style={styles.editButton}
              onPress={iniciarEdicao}
            >
              <Edit3
                size={16}
                color={colors.primary}
              />

              <Text
                style={
                  styles.editButtonText
                }
              >
                Editar perfil
              </Text>
            </Pressable>
          ) : (
            <View
              style={
                styles.editActions
              }
            >
              <Pressable
                style={
                  styles.cancelButton
                }
                onPress={
                  cancelarEdicao
                }
              >
                <X
                  size={15}
                  color={
                    colors.textSecondary
                  }
                />

                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                style={
                  styles.saveButton
                }
                onPress={
                  salvarAlteracoes
                }
              >
                <Save
                  size={15}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  Salvar
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* CARTÃO PRINCIPAL */}

        <View style={styles.profileCard}>
          <View
            style={
              styles.profileAvatar
            }
          >
            <User
              size={34}
              color={colors.primary}
            />
          </View>

          <View
            style={styles.profileInfo}
          >
            <Text
              style={styles.profileName}
            >
              {perfil.nome}
            </Text>

            <Text
              style={styles.profileEmail}
            >
              {perfil.email}
            </Text>

            <View
              style={styles.statusRow}
            >
              <View
                style={
                  styles.activeBadge
                }
              >
                <CheckCircle2
                  size={12}
                  color="#15803D"
                />

                <Text
                  style={
                    styles.activeText
                  }
                >
                  Conta ativa
                </Text>
              </View>

              <View
                style={
                  styles.residentBadge
                }
              >
                <Home
                  size={12}
                  color={colors.primary}
                />

                <Text
                  style={
                    styles.residentText
                  }
                >
                  Morador
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* CONTEÚDO */}

        <View style={styles.columns}>
          {/* DADOS PESSOAIS */}

          <View style={styles.panel}>
            <View
              style={
                styles.panelHeader
              }
            >
              <View
                style={
                  styles.panelIcon
                }
              >
                <IdCard
                  size={19}
                  color={colors.primary}
                />
              </View>

              <View>
                <Text
                  style={
                    styles.panelTitle
                  }
                >
                  Dados pessoais
                </Text>

                <Text
                  style={
                    styles.panelSubtitle
                  }
                >
                  Informações cadastradas
                  na sua conta.
                </Text>
              </View>
            </View>

            <View style={styles.form}>
              <Field
                label="Nome completo"
                icon={
                  <User
                    size={15}
                    color={
                      colors.textSecondary
                    }
                  />
                }
                value={
                  editando
                    ? form.nome
                    : perfil.nome
                }
                editable={editando}
                onChangeText={(text) =>
                  setForm({
                    ...form,
                    nome: text,
                  })
                }
              />

              <Field
                label="E-mail"
                icon={
                  <Mail
                    size={15}
                    color={
                      colors.textSecondary
                    }
                  />
                }
                value={
                  editando
                    ? form.email
                    : perfil.email
                }
                editable={editando}
                onChangeText={(text) =>
                  setForm({
                    ...form,
                    email: text,
                  })
                }
              />

              <Field
                label="CPF"
                icon={
                  <IdCard
                    size={15}
                    color={
                      colors.textSecondary
                    }
                  />
                }
                value={
                  editando
                    ? form.cpf
                    : perfil.cpf
                }
                editable={false}
                onChangeText={() => {}}
              />

              <Field
                label="Telefone"
                icon={
                  <Phone
                    size={15}
                    color={
                      colors.textSecondary
                    }
                  />
                }
                value={
                  editando
                    ? form.telefone
                    : perfil.telefone
                }
                editable={editando}
                onChangeText={(text) =>
                  setForm({
                    ...form,
                    telefone: text,
                  })
                }
              />
            </View>
          </View>

          {/* RESIDÊNCIA */}

          <View style={styles.panel}>
            <View
              style={
                styles.panelHeader
              }
            >
              <View
                style={
                  styles.panelIcon
                }
              >
                <Home
                  size={19}
                  color={colors.primary}
                />
              </View>

              <View>
                <Text
                  style={
                    styles.panelTitle
                  }
                >
                  Residência
                </Text>

                <Text
                  style={
                    styles.panelSubtitle
                  }
                >
                  Informações da sua unidade.
                </Text>
              </View>
            </View>

            <View style={styles.form}>
              <Field
                label="Casa / Unidade"
                icon={
                  <Home
                    size={15}
                    color={
                      colors.textSecondary
                    }
                  />
                }
                value={
                  editando
                    ? form.casa
                    : perfil.casa
                }
                editable={false}
                onChangeText={() => {}}
              />

              <Field
                label="Quadra / Bloco"
                icon={
                  <MapPin
                    size={15}
                    color={
                      colors.textSecondary
                    }
                  />
                }
                value={
                  editando
                    ? form.quadra
                    : perfil.quadra
                }
                editable={false}
                onChangeText={() => {}}
              />
            </View>

            <View
              style={
                styles.residenceNotice
              }
            >
              <ShieldCheck
                size={17}
                color={colors.primary}
              />

              <Text
                style={
                  styles.residenceNoticeText
                }
              >
                Para alterar a residência,
                entre em contato com a
                administração do condomínio.
              </Text>
            </View>
          </View>
        </View>

        {/* CONTA */}

        <View style={styles.accountPanel}>
          <View
            style={
              styles.accountHeader
            }
          >
            <View
              style={
                styles.accountIcon
              }
            >
              <ShieldCheck
                size={20}
                color={colors.primary}
              />
            </View>

            <View>
              <Text
                style={
                  styles.accountTitle
                }
              >
                Conta e segurança
              </Text>

              <Text
                style={
                  styles.accountSubtitle
                }
              >
                Informações de acesso à
                plataforma.
              </Text>
            </View>
          </View>

          <View
            style={styles.accountGrid}
          >
            <View
              style={
                styles.accountItem
              }
            >
              <View
                style={
                  styles.accountItemIcon
                }
              >
                <AtSign
                  size={17}
                  color={colors.primary}
                />
              </View>

              <View>
                <Text
                  style={
                    styles.accountLabel
                  }
                >
                  E-mail de acesso
                </Text>

                <Text
                  style={
                    styles.accountValue
                  }
                >
                  {perfil.email}
                </Text>
              </View>
            </View>

            <View
              style={
                styles.accountItem
              }
            >
              <View
                style={
                  styles.accountItemIcon
                }
              >
                <Lock
                  size={17}
                  color={colors.primary}
                />
              </View>

              <View>
                <Text
                  style={
                    styles.accountLabel
                  }
                >
                  Senha
                </Text>

                <Text
                  style={
                    styles.accountValue
                  }
                >
                  ••••••••••
                </Text>
              </View>
            </View>

            <View
              style={
                styles.accountItem
              }
            >
              <View
                style={
                  styles.accountItemIcon
                }
              >
                <CheckCircle2
                  size={17}
                  color="#15803D"
                />
              </View>

              <View>
                <Text
                  style={
                    styles.accountLabel
                  }
                >
                  Status da conta
                </Text>

                <Text
                  style={[
                    styles.accountValue,
                    {
                      color: '#15803D',
                    },
                  ]}
                >
                  Ativa
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* AVISO */}

        <View style={styles.footerNotice}>
          <ShieldCheck
            size={18}
            color={colors.primary}
          />

          <View
            style={
              styles.footerNoticeContent
            }
          >
            <Text
              style={
                styles.footerNoticeTitle
              }
            >
              Seus dados
            </Text>

            <Text
              style={
                styles.footerNoticeText
              }
            >
              Mantenha seu telefone e e-mail
              atualizados para receber avisos
              importantes da administração.
              Alterações de CPF e residência
              deverão ser solicitadas à
              administração.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  icon,
  value,
  editable,
  onChangeText,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  editable: boolean;
  onChangeText: (
    text: string
  ) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
      </Text>

      <View
        style={[
          styles.inputContainer,

          !editable &&
            styles.inputDisabled,
        ]}
      >
        <View
          style={styles.inputIcon}
        >
          {icon}
        </View>

        <TextInput
          style={styles.input}
          value={value}
          editable={editable}
          onChangeText={onChangeText}
          placeholderTextColor={
            colors.textLight
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor:
      colors.background,
  },

  content: {
    flex: 1,
    minWidth: 0,
  },

  contentContainer: {
    padding: 30,
    paddingBottom: 60,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 22,
  },

  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },

  subtitle: {
    color:
      colors.textSecondary,
    fontSize: 11,
    marginTop: 5,
  },

  editButton: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor:
      colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  editButtonText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 6,
  },

  editActions: {
    flexDirection: 'row',
  },

  cancelButton: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor:
      colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  cancelButtonText: {
    color:
      colors.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 5,
  },

  saveButton: {
    height: 40,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor:
      colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 6,
  },

  profileCard: {
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor:
      colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 17,
  },

  profileInfo: {
    flex: 1,
  },

  profileName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },

  profileEmail: {
    color:
      colors.textSecondary,
    fontSize: 9,
    marginTop: 4,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: 7,
  },

  activeText: {
    color: '#15803D',
    fontSize: 7,
    fontWeight: '800',
    marginLeft: 4,
  },

  residentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  residentText: {
    color: colors.primary,
    fontSize: 7,
    fontWeight: '800',
    marginLeft: 4,
  },

  columns: {
    flexDirection: 'row',
    marginHorizontal: -6,
    marginBottom: 12,
  },

  panel: {
    flex: 1,
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 18,
    margin: 6,
  },

  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 19,
  },

  panelIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor:
      colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  panelTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },

  panelSubtitle: {
    color:
      colors.textSecondary,
    fontSize: 8,
    marginTop: 3,
  },

  form: {
    width: '100%',
  },

  field: {
    marginBottom: 14,
  },

  fieldLabel: {
    color:
      colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
    marginBottom: 6,
  },

  inputContainer: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor:
      colors.surface,
    overflow: 'hidden',
  },

  inputDisabled: {
    backgroundColor:
      colors.background,
  },

  inputIcon: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  input: {
    flex: 1,
    minHeight: 43,
    color: colors.text,
    fontSize: 9,
    outlineStyle: 'none' as any,
    paddingRight: 12,
  },

  residenceNotice: {
    backgroundColor:
      colors.primaryLight,
    borderRadius: 10,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 3,
  },

  residenceNoticeText: {
    flex: 1,
    color:
      colors.textSecondary,
    fontSize: 8,
    lineHeight: 13,
    marginLeft: 7,
  },

  accountPanel: {
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 18,
    marginBottom: 18,
  },

  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 17,
  },

  accountIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor:
      colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  accountTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },

  accountSubtitle: {
    color:
      colors.textSecondary,
    fontSize: 8,
    marginTop: 3,
  },

  accountGrid: {
    flexDirection: 'row',
  },

  accountItem: {
    flex: 1,
    minHeight: 75,
    backgroundColor:
      colors.background,
    borderRadius: 11,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 9,
  },

  accountItemIcon: {
    width: 37,
    height: 37,
    borderRadius: 10,
    backgroundColor:
      colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  accountLabel: {
    color:
      colors.textSecondary,
    fontSize: 7,
    fontWeight: '700',
  },

  accountValue: {
    color: colors.text,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 4,
  },

  footerNotice: {
    backgroundColor:
      colors.primaryLight,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  footerNoticeContent: {
    flex: 1,
    marginLeft: 10,
  },

  footerNoticeTitle: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
  },

  footerNoticeText: {
    color:
      colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
    marginTop: 4,
  },
});