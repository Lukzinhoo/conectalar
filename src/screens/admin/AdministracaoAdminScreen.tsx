import React, { useCallback, useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ArrowLeft,
  Bell,
  Building2,
  CalendarDays,
  Home,
  Info,
  MapPin,
  Save,
  Settings,
  ShieldCheck,
  UserCog,
} from 'lucide-react-native';

import { colors } from '../../theme/theme';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { supabase } from '../../services/supabase';

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'AdministracaoAdmin'
>;

type Configuracao = {
  id: string;
  nome_condominio: string;
  cnpj: string | null;

  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;

  telefone: string | null;
  email: string | null;

  nome_sindico: string | null;
  nome_subsindico: string | null;

  permitir_reservas: boolean;
  permitir_ocorrencias: boolean;

  notificacao_comunicados: boolean;
  notificacao_reservas: boolean;
  notificacao_ocorrencias: boolean;

  criado_em: string;
  atualizado_em: string;
};

export default function AdministracaoAdminScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  const [id, setId] = useState<string | null>(null);

  const [nomeCondominio, setNomeCondominio] =
    useState('ConectaLar');

  const [cnpj, setCnpj] = useState('');

  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');

  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');

  const [nomeSindico, setNomeSindico] = useState('');
  const [nomeSubsindico, setNomeSubsindico] =
    useState('');

  const [permitirReservas, setPermitirReservas] =
    useState(true);

  const [permitirOcorrencias, setPermitirOcorrencias] =
    useState(true);

  const [
    notificacaoComunicados,
    setNotificacaoComunicados,
  ] = useState(true);

  const [
    notificacaoReservas,
    setNotificacaoReservas,
  ] = useState(true);

  const [
    notificacaoOcorrencias,
    setNotificacaoOcorrencias,
  ] = useState(true);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregarConfiguracoes = useCallback(async () => {
    try {
      setCarregando(true);

      const { data, error } = await supabase
        .from('configuracoes_condominio')
        .select('*')
        .order('criado_em', {
          ascending: true,
        })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        const { data: novaConfiguracao, error: erroCriacao } =
          await supabase
            .from('configuracoes_condominio')
            .insert({
              nome_condominio: 'ConectaLar',
            })
            .select()
            .single();

        if (erroCriacao) {
          throw erroCriacao;
        }

        preencherFormulario(
          novaConfiguracao as Configuracao
        );

        return;
      }

      preencherFormulario(data as Configuracao);
    } catch (error: any) {
      console.error(
        'Erro ao carregar configurações:',
        error
      );

      Alert.alert(
        'Erro',
        error?.message ||
          'Não foi possível carregar as configurações.'
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarConfiguracoes();
  }, [carregarConfiguracoes]);

  function preencherFormulario(config: Configuracao) {
    setId(config.id);

    setNomeCondominio(
      config.nome_condominio || 'ConectaLar'
    );

    setCnpj(config.cnpj || '');

    setEndereco(config.endereco || '');
    setNumero(config.numero || '');
    setComplemento(config.complemento || '');
    setBairro(config.bairro || '');
    setCidade(config.cidade || '');
    setEstado(config.estado || '');
    setCep(config.cep || '');

    setTelefone(config.telefone || '');
    setEmail(config.email || '');

    setNomeSindico(config.nome_sindico || '');
    setNomeSubsindico(
      config.nome_subsindico || ''
    );

    setPermitirReservas(
      config.permitir_reservas ?? true
    );

    setPermitirOcorrencias(
      config.permitir_ocorrencias ?? true
    );

    setNotificacaoComunicados(
      config.notificacao_comunicados ?? true
    );

    setNotificacaoReservas(
      config.notificacao_reservas ?? true
    );

    setNotificacaoOcorrencias(
      config.notificacao_ocorrencias ?? true
    );
  }

  async function salvarConfiguracoes() {
    if (!nomeCondominio.trim()) {
      Alert.alert(
        'Atenção',
        'Informe o nome do condomínio.'
      );

      return;
    }

    try {
      setSalvando(true);

      const dados = {
        nome_condominio: nomeCondominio.trim(),

        cnpj: cnpj.trim() || null,

        endereco: endereco.trim() || null,
        numero: numero.trim() || null,
        complemento: complemento.trim() || null,
        bairro: bairro.trim() || null,
        cidade: cidade.trim() || null,
        estado: estado.trim() || null,
        cep: cep.trim() || null,

        telefone: telefone.trim() || null,
        email: email.trim() || null,

        nome_sindico: nomeSindico.trim() || null,
        nome_subsindico:
          nomeSubsindico.trim() || null,

        permitir_reservas: permitirReservas,
        permitir_ocorrencias:
          permitirOcorrencias,

        notificacao_comunicados:
          notificacaoComunicados,

        notificacao_reservas:
          notificacaoReservas,

        notificacao_ocorrencias:
          notificacaoOcorrencias,

        atualizado_em: new Date().toISOString(),
      };

      if (id) {
        const { error } = await supabase
          .from('configuracoes_condominio')
          .update(dados)
          .eq('id', id);

        if (error) {
          throw error;
        }
      } else {
        const { data, error } = await supabase
          .from('configuracoes_condominio')
          .insert(dados)
          .select()
          .single();

        if (error) {
          throw error;
        }

        setId(data.id);
      }

      Alert.alert(
        'Sucesso',
        'Configurações salvas com sucesso.'
      );
    } catch (error: any) {
      console.error(
        'Erro ao salvar configurações:',
        error
      );

      Alert.alert(
        'Erro',
        error?.message ||
          'Não foi possível salvar as configurações.'
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.loadingPage}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text style={styles.loadingText}>
          Carregando configurações...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              Math.max(insets.bottom, 20) + 30,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
          <View style={styles.headerTop}>
            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft
                size={20}
                color="#FFFFFF"
              />
            </Pressable>

            <View style={styles.brandRow}>
              <View style={styles.brandIcon}>
                <Home
                  size={18}
                  color="#FFFFFF"
                  strokeWidth={2.5}
                />
              </View>

              <Text style={styles.brand}>
                ConectaLar
              </Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          <Text style={styles.headerTitle}>
            Administração
          </Text>

          <Text style={styles.headerDescription}>
            Gerencie os dados e configurações
            gerais do condomínio.
          </Text>
        </View>

        <View style={styles.body}>
          {/* DADOS DO CONDOMÍNIO */}
          <SectionCard
            icon={
              <Building2
                size={20}
                color={colors.primary}
              />
            }
            title="Dados do condomínio"
            description="Informações principais do condomínio."
          >
            <InputField
              label="NOME DO CONDOMÍNIO"
              value={nomeCondominio}
              onChangeText={setNomeCondominio}
              placeholder="Nome do condomínio"
            />

            <InputField
              label="CNPJ"
              value={cnpj}
              onChangeText={setCnpj}
              placeholder="00.000.000/0000-00"
              keyboardType="numeric"
            />

            <View style={styles.row}>
              <View style={styles.flexTwo}>
                <InputField
                  label="ENDEREÇO"
                  value={endereco}
                  onChangeText={setEndereco}
                  placeholder="Rua / Avenida"
                />
              </View>

              <View style={styles.smallColumn}>
                <InputField
                  label="NÚMERO"
                  value={numero}
                  onChangeText={setNumero}
                  placeholder="Nº"
                />
              </View>
            </View>

            <InputField
              label="COMPLEMENTO"
              value={complemento}
              onChangeText={setComplemento}
              placeholder="Complemento"
            />

            <InputField
              label="BAIRRO"
              value={bairro}
              onChangeText={setBairro}
              placeholder="Bairro"
            />

            <View style={styles.row}>
              <View style={styles.flexTwo}>
                <InputField
                  label="CIDADE"
                  value={cidade}
                  onChangeText={setCidade}
                  placeholder="Cidade"
                />
              </View>

              <View style={styles.stateColumn}>
                <InputField
                  label="UF"
                  value={estado}
                  onChangeText={texto =>
                    setEstado(
                      texto
                        .toUpperCase()
                        .slice(0, 2)
                    )
                  }
                  placeholder="PE"
                  maxLength={2}
                />
              </View>
            </View>

            <InputField
              label="CEP"
              value={cep}
              onChangeText={setCep}
              placeholder="00000-000"
              keyboardType="numeric"
            />

            <InputField
              label="TELEFONE"
              value={telefone}
              onChangeText={setTelefone}
              placeholder="(00) 00000-0000"
              keyboardType="phone-pad"
            />

            <InputField
              label="E-MAIL"
              value={email}
              onChangeText={setEmail}
              placeholder="condominio@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </SectionCard>

          {/* EQUIPE */}
          <SectionCard
            icon={
              <UserCog
                size={20}
                color={colors.primary}
              />
            }
            title="Equipe administrativa"
            description="Responsáveis pela administração."
          >
            <InputField
              label="SÍNDICO"
              value={nomeSindico}
              onChangeText={setNomeSindico}
              placeholder="Nome do síndico"
            />

            <InputField
              label="SUBSÍNDICO"
              value={nomeSubsindico}
              onChangeText={setNomeSubsindico}
              placeholder="Nome do subsíndico"
            />
          </SectionCard>

          {/* RECURSOS */}
          <SectionCard
            icon={
              <Settings
                size={20}
                color={colors.primary}
              />
            }
            title="Recursos do aplicativo"
            description="Controle os recursos disponíveis."
          >
            <SettingRow
              icon={
                <CalendarDays
                  size={18}
                  color={colors.primary}
                />
              }
              title="Reservas"
              description="Permitir novas reservas de áreas."
              value={permitirReservas}
              onValueChange={setPermitirReservas}
            />

            <SettingRow
              icon={
                <ShieldCheck
                  size={18}
                  color={colors.primary}
                />
              }
              title="Ocorrências"
              description="Permitir envio de ocorrências."
              value={permitirOcorrencias}
              onValueChange={setPermitirOcorrencias}
              last
            />
          </SectionCard>

          {/* NOTIFICAÇÕES */}
          <SectionCard
            icon={
              <Bell
                size={20}
                color={colors.primary}
              />
            }
            title="Notificações"
            description="Escolha quais eventos poderão gerar avisos."
          >
            <SettingRow
              icon={
                <Bell
                  size={18}
                  color={colors.primary}
                />
              }
              title="Comunicados"
              description="Avisos de novos comunicados."
              value={notificacaoComunicados}
              onValueChange={
                setNotificacaoComunicados
              }
            />

            <SettingRow
              icon={
                <CalendarDays
                  size={18}
                  color={colors.primary}
                />
              }
              title="Reservas"
              description="Avisos relacionados às reservas."
              value={notificacaoReservas}
              onValueChange={
                setNotificacaoReservas
              }
            />

            <SettingRow
              icon={
                <ShieldCheck
                  size={18}
                  color={colors.primary}
                />
              }
              title="Ocorrências"
              description="Avisos sobre ocorrências."
              value={notificacaoOcorrencias}
              onValueChange={
                setNotificacaoOcorrencias
              }
              last
            />
          </SectionCard>

          {/* SEGURANÇA */}
          <SectionCard
            icon={
              <ShieldCheck
                size={20}
                color={colors.primary}
              />
            }
            title="Segurança e permissões"
            description="Controle administrativo do sistema."
          >
            <View style={styles.informationBox}>
              <ShieldCheck
                size={20}
                color={colors.primary}
              />

              <View
                style={styles.informationContent}
              >
                <Text
                  style={styles.informationTitle}
                >
                  Área administrativa
                </Text>

                <Text
                  style={
                    styles.informationDescription
                  }
                >
                  As configurações desta área
                  devem ser acessadas somente por
                  usuários administrativos
                  autorizados.
                </Text>
              </View>
            </View>
          </SectionCard>

          {/* SISTEMA */}
          <SectionCard
            icon={
              <Info
                size={20}
                color={colors.primary}
              />
            }
            title="Sistema"
            description="Informações do aplicativo."
          >
            <View style={styles.systemRow}>
              <Text style={styles.systemLabel}>
                Aplicativo
              </Text>

              <Text style={styles.systemValue}>
                ConectaLar
              </Text>
            </View>

            <View style={styles.systemDivider} />

            <View style={styles.systemRow}>
              <Text style={styles.systemLabel}>
                Painel
              </Text>

              <Text style={styles.systemValue}>
                Administração
              </Text>
            </View>

            <View style={styles.systemDivider} />

            <View style={styles.systemRow}>
              <Text style={styles.systemLabel}>
                Status
              </Text>

              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />

                <Text style={styles.statusText}>
                  Ativo
                </Text>
              </View>
            </View>
          </SectionCard>

          {/* SALVAR */}
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              pressed &&
                !salvando &&
                styles.pressed,
              salvando &&
                styles.disabledButton,
            ]}
            onPress={salvarConfiguracoes}
            disabled={salvando}
          >
            {salvando ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <>
                <Save
                  size={18}
                  color="#FFFFFF"
                />

                <Text
                  style={styles.saveButtonText}
                >
                  Salvar configurações
                </Text>
              </>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>
              ConectaLar
            </Text>

            <Text style={styles.footerText}>
              Seu condomínio mais conectado.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* COMPONENTES */

type SectionCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
};

function SectionCard({
  icon,
  title,
  description,
  children,
}: SectionCardProps) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionCardHeader}>
        <View style={styles.sectionIcon}>
          {icon}
        </View>

        <View style={styles.sectionHeaderContent}>
          <Text style={styles.sectionTitle}>
            {title}
          </Text>

          <Text style={styles.sectionDescription}>
            {description}
          </Text>
        </View>
      </View>

      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
}

type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: any;
  autoCapitalize?: any;
  maxLength?: number;
};

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  maxLength,
}: InputFieldProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label}
      </Text>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
      />
    </View>
  );
}

type SettingRowProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  last?: boolean;
};

function SettingRow({
  icon,
  title,
  description,
  value,
  onValueChange,
  last = false,
}: SettingRowProps) {
  return (
    <View
      style={[
        styles.settingRow,
        last && styles.settingRowLast,
      ]}
    >
      <View style={styles.settingIcon}>
        {icon}
      </View>

      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>
          {title}
        </Text>

        <Text
          style={styles.settingDescription}
        >
          {description}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: '#CBD5E1',
          true: colors.primary,
        }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    flexGrow: 1,
  },

  loadingPage: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 10,
  },

  header: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor:
      'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  brandIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  brand: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },

  headerSpacer: {
    width: 40,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
    marginTop: 23,
  },

  headerDescription: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
    maxWidth: 330,
  },

  body: {
    paddingHorizontal: 18,
    paddingTop: 20,
  },

  sectionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 13,
  },

  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionHeaderContent: {
    flex: 1,
    marginLeft: 11,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },

  sectionDescription: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 13,
    marginTop: 2,
  },

  sectionContent: {
    marginTop: 15,
  },

  inputGroup: {
    marginBottom: 11,
  },

  inputLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 5,
  },

  input: {
    height: 44,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    color: colors.text,
    fontSize: 11,
  },

  row: {
    flexDirection: 'row',
  },

  flexTwo: {
    flex: 1,
    marginRight: 8,
  },

  smallColumn: {
    width: 82,
  },

  stateColumn: {
    width: 76,
  },

  settingRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
  },

  settingRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },

  settingIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingContent: {
    flex: 1,
    marginLeft: 10,
    paddingRight: 8,
  },

  settingTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },

  settingDescription: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 13,
    marginTop: 2,
  },

  informationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 13,
    padding: 12,
  },

  informationContent: {
    flex: 1,
    marginLeft: 10,
  },

  informationTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },

  informationDescription: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  systemRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  systemLabel: {
    color: colors.textSecondary,
    fontSize: 10,
  },

  systemValue: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
  },

  systemDivider: {
    height: 1,
    backgroundColor: colors.border,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 5,
  },

  statusText: {
    color: '#166534',
    fontSize: 8,
    fontWeight: '800',
  },

  saveButton: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 7,
  },

  pressed: {
    opacity: 0.75,
  },

  disabledButton: {
    opacity: 0.6,
  },

  footer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 4,
  },

  footerBrand: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },

  footerText: {
    color: colors.textLight,
    fontSize: 9,
    marginTop: 2,
  },
});