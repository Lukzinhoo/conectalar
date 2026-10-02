import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Bell,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react-native';

import { colors } from '../../../theme/theme';
import WebMoradorSidebar from '../../../components/WebMoradorSidebar';
import { supabase } from '../../../services/supabase';

type Notificacao = {
  id: string;
  morador_id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  criado_em: string;
  destinatario_tipo: string;
};

export default function WebMoradorNotificacoesScreen() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarNotificacoes(false);
  }, []);

  async function carregarNotificacoes(
    mostrarAtualizando = true
  ) {
    try {
      if (mostrarAtualizando) {
        setAtualizando(true);
      } else {
        setCarregando(true);
      }

      setErro('');

      // ==========================================
      // USUÁRIO LOGADO
      // ==========================================

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErro('Usuário não identificado.');
        setNotificacoes([]);
        return;
      }

      console.log('USUÁRIO LOGADO:', user.id);

      // ==========================================
      // PERFIL
      // ==========================================

      const {
        data: perfil,
        error: perfilError,
      } = await supabase
        .from('perfis')
        .select('id, nome, tipo, ativo')
        .eq('id', user.id)
        .maybeSingle();

      if (perfilError) {
        console.error(perfilError);

        setErro(
          `Erro ao verificar perfil: ${perfilError.message}`
        );

        return;
      }

      if (!perfil) {
        setErro('Perfil não encontrado.');
        return;
      }

      if (perfil.tipo !== 'morador') {
        setErro('Este usuário não é um morador.');
        return;
      }

      if (!perfil.ativo) {
        setErro('Este morador está inativo.');
        return;
      }

      console.log('MORADOR:', perfil.nome);

      // ==========================================
      // NOTIFICAÇÕES
      // ==========================================

      const {
        data,
        error,
      } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('morador_id', user.id)
        .eq('destinatario_tipo', 'morador')
        .order('criado_em', {
          ascending: false,
        });

      if (error) {
        console.error('ERRO NOTIFICAÇÕES:', error);

        setErro(
          `Erro ao carregar notificações: ${error.message}`
        );

        setNotificacoes([]);
        return;
      }

      console.log('DADOS RECEBIDOS:', data);
      console.log('TOTAL:', data?.length ?? 0);

      setNotificacoes(
        (data ?? []) as Notificacao[]
      );
    } catch (error) {
      console.error(error);

      setErro(
        'Ocorreu um erro inesperado ao carregar as notificações.'
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  async function marcarComoLida(id: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { error } = await supabase
        .from('notificacoes')
        .update({
          lida: true,
        })
        .eq('id', id)
        .eq('morador_id', user.id)
        .eq('destinatario_tipo', 'morador');

      if (error) {
        setErro(
          `Erro ao marcar notificação: ${error.message}`
        );

        return;
      }

      setNotificacoes((lista) =>
        lista.map((item) =>
          item.id === id
            ? {
                ...item,
                lida: true,
              }
            : item
        )
      );
    } catch (error) {
      console.error(error);
    }
  }

  function formatarData(data: string) {
    if (!data) {
      return '';
    }

    return new Date(data).toLocaleString('pt-BR');
  }

  return (
    <View style={styles.container}>
      <WebMoradorSidebar active="notificacoes" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* CABEÇALHO */}

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Notificações
            </Text>

            <Text style={styles.subtitle}>
              Avisos e informações importantes do condomínio.
            </Text>
          </View>

          <Pressable
            style={styles.refreshButton}
            onPress={() =>
              carregarNotificacoes(true)
            }
          >
            {atualizando ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
              />
            ) : (
              <RefreshCw
                size={17}
                color={colors.primary}
              />
            )}

            <Text style={styles.refreshText}>
              Atualizar
            </Text>
          </Pressable>
        </View>

        {/* ERRO */}

        {erro !== '' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              {erro}
            </Text>
          </View>
        )}

        {/* RESUMO */}

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Bell
              size={24}
              color={colors.primary}
            />
          </View>

          <View>
            <Text style={styles.summaryLabel}>
              Total de notificações
            </Text>

            <Text style={styles.summaryNumber}>
              {notificacoes.length}
            </Text>
          </View>
        </View>

        {/* LISTA */}

        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>
            Suas notificações
          </Text>

          {carregando ? (
            <View style={styles.loading}>
              <ActivityIndicator
                size="large"
                color={colors.primary}
              />

              <Text style={styles.loadingText}>
                Carregando...
              </Text>
            </View>
          ) : notificacoes.length === 0 ? (
            <View style={styles.empty}>
              <Bell
                size={45}
                color={colors.textLight}
              />

              <Text style={styles.emptyTitle}>
                Nenhuma notificação
              </Text>

              <Text style={styles.emptyText}>
                Você ainda não possui notificações.
              </Text>
            </View>
          ) : (
            notificacoes.map((notificacao) => (
              <View
                key={notificacao.id}
                style={[
                  styles.notificationCard,

                  !notificacao.lida &&
                    styles.notificationUnread,
                ]}
              >
                <View style={styles.notificationIcon}>
                  <Bell
                    size={21}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.notificationContent}>
                  <View style={styles.titleRow}>
                    <Text style={styles.notificationTitle}>
                      {notificacao.titulo}
                    </Text>

                    {!notificacao.lida && (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>
                          NOVA
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.notificationMessage}>
                    {notificacao.mensagem}
                  </Text>

                  <View style={styles.footer}>
                    <Text style={styles.type}>
                      {notificacao.tipo}
                    </Text>

                    <Text style={styles.date}>
                      {formatarData(
                        notificacao.criado_em
                      )}
                    </Text>
                  </View>
                </View>

                {!notificacao.lida ? (
                  <Pressable
                    style={styles.readButton}
                    onPress={() =>
                      marcarComoLida(
                        notificacao.id
                      )
                    }
                  >
                    <CheckCircle2
                      size={16}
                      color={colors.primary}
                    />

                    <Text style={styles.readButtonText}>
                      Marcar como lida
                    </Text>
                  </Pressable>
                ) : (
                  <View style={styles.readBadge}>
                    <CheckCircle2
                      size={15}
                      color="#15803D"
                    />

                    <Text style={styles.readText}>
                      Lida
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
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
    justifyContent: 'space-between',
    marginBottom: 25,
  },

  title: {
    fontSize: 27,
    fontWeight: '800',
    color: colors.text,
  },

  subtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 5,
  },

  refreshButton: {
    height: 42,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },

  refreshText: {
    marginLeft: 7,
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },

  errorBox: {
    padding: 14,
    backgroundColor: colors.dangerLight,
    borderRadius: 10,
    marginBottom: 20,
  },

  errorText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '700',
  },

  summaryCard: {
    width: 230,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },

  summaryIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  summaryLabel: {
    fontSize: 9,
    color: colors.textSecondary,
  },

  summaryNumber: {
    fontSize: 23,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },

  listContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  loading: {
    minHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 10,
    color: colors.textSecondary,
    fontSize: 10,
  },

  empty: {
    minHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },

  emptyText: {
    marginTop: 5,
    fontSize: 10,
    color: colors.textSecondary,
  },

  notificationCard: {
    minHeight: 120,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },

  notificationUnread: {
    backgroundColor: colors.primaryLight,
  },

  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },

  notificationContent: {
    flex: 1,
    minWidth: 0,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  notificationTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginRight: 8,
  },

  newBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },

  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '800',
  },

  notificationMessage: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 17,
    color: colors.textSecondary,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  type: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    marginRight: 12,
  },

  date: {
    fontSize: 8,
    color: colors.textLight,
  },

  readButton: {
    minHeight: 38,
    paddingHorizontal: 13,
    marginLeft: 15,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },

  readButtonText: {
    marginLeft: 6,
    fontSize: 8,
    fontWeight: '800',
    color: colors.primary,
  },

  readBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
  },

  readText: {
    marginLeft: 5,
    fontSize: 8,
    fontWeight: '800',
    color: '#15803D',
  },
});