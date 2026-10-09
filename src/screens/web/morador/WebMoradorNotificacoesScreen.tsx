import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  Bell,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react-native';

import { colors } from '../../../theme/theme';
import WebMoradorSidebar from '../../../components/WebMoradorSidebar';
import WebLayout from '../../../components/WebLayout';
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
  const { width } = useWindowDimensions();

  const isMobile = width < 768;

  const [notificacoes, setNotificacoes] =
    useState<Notificacao[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [atualizando, setAtualizando] =
    useState(false);

  const [erro, setErro] =
    useState('');

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

      // USUÁRIO LOGADO

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErro('Usuário não identificado.');
        setNotificacoes([]);
        return;
      }

      console.log(
        'USUÁRIO LOGADO:',
        user.id
      );

      // PERFIL

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
        setErro(
          'Este usuário não é um morador.'
        );
        return;
      }

      if (!perfil.ativo) {
        setErro(
          'Este morador está inativo.'
        );
        return;
      }

      console.log(
        'MORADOR:',
        perfil.nome
      );

      // NOTIFICAÇÕES

      const {
        data,
        error,
      } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('morador_id', user.id)
        .eq(
          'destinatario_tipo',
          'morador'
        )
        .order('criado_em', {
          ascending: false,
        });

      if (error) {
        console.error(
          'ERRO NOTIFICAÇÕES:',
          error
        );

        setErro(
          `Erro ao carregar notificações: ${error.message}`
        );

        setNotificacoes([]);
        return;
      }

      console.log(
        'DADOS RECEBIDOS:',
        data
      );

      console.log(
        'TOTAL:',
        data?.length ?? 0
      );

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

  async function marcarComoLida(
    id: string
  ) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { error } =
        await supabase
          .from('notificacoes')
          .update({
            lida: true,
          })
          .eq('id', id)
          .eq(
            'morador_id',
            user.id
          )
          .eq(
            'destinatario_tipo',
            'morador'
          );

      if (error) {
        setErro(
          `Erro ao marcar notificação: ${error.message}`
        );

        return;
      }

      setNotificacoes(
        (lista) =>
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

  function formatarData(
    data: string
  ) {
    if (!data) {
      return '';
    }

    return new Date(
      data
    ).toLocaleString('pt-BR');
  }

  const naoLidas =
    notificacoes.filter(
      (item) => !item.lida
    ).length;

  return (
    <WebLayout
      sidebar={
        <WebMoradorSidebar active="notificacoes" />
      }
    >
      <View style={styles.page}>
        {/* CABEÇALHO */}

        <View
          style={[
            styles.header,
            isMobile &&
              styles.headerMobile,
          ]}
        >
          <View
            style={
              isMobile
                ? styles.headerTextMobile
                : undefined
            }
          >
            <Text style={styles.title}>
              Notificações
            </Text>

            <Text style={styles.subtitle}>
              Avisos e informações importantes do condomínio.
            </Text>
          </View>

          <Pressable
            style={[
              styles.refreshButton,
              isMobile &&
                styles.refreshButtonMobile,
            ]}
            onPress={() =>
              carregarNotificacoes(true)
            }
            disabled={atualizando}
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

            <Text
              style={styles.refreshText}
            >
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

        <View
          style={[
            styles.summaryArea,
            isMobile &&
              styles.summaryAreaMobile,
          ]}
        >
          <View
            style={[
              styles.summaryCard,
              isMobile &&
                styles.summaryCardMobile,
            ]}
          >
            <View style={styles.summaryIcon}>
              <Bell
                size={24}
                color={colors.primary}
              />
            </View>

            <View
              style={styles.summaryContent}
            >
              <Text
                style={styles.summaryLabel}
              >
                Total de notificações
              </Text>

              <Text
                style={styles.summaryNumber}
              >
                {notificacoes.length}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.summaryCard,
              styles.summaryCardSecond,
              isMobile &&
                styles.summaryCardMobile,
              isMobile &&
                styles.summaryCardSecondMobile,
            ]}
          >
            <View style={styles.summaryIcon}>
              <Bell
                size={24}
                color={colors.primary}
              />
            </View>

            <View
              style={styles.summaryContent}
            >
              <Text
                style={styles.summaryLabel}
              >
                Não lidas
              </Text>

              <Text
                style={styles.summaryNumber}
              >
                {naoLidas}
              </Text>
            </View>
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

              <Text
                style={styles.loadingText}
              >
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
            notificacoes.map(
              (notificacao) => (
                <View
                  key={notificacao.id}
                  style={[
                    styles.notificationCard,

                    !notificacao.lida &&
                      styles.notificationUnread,

                    isMobile &&
                      styles.notificationCardMobile,
                  ]}
                >
                  {/* ÍCONE */}

                  <View
                    style={[
                      styles.notificationIcon,
                      isMobile &&
                        styles.notificationIconMobile,
                    ]}
                  >
                    <Bell
                      size={21}
                      color={colors.primary}
                    />
                  </View>

                  {/* CONTEÚDO */}

                  <View
                    style={
                      styles.notificationContent
                    }
                  >
                    <View
                      style={[
                        styles.titleRow,
                        isMobile &&
                          styles.titleRowMobile,
                      ]}
                    >
                      <Text
                        style={
                          styles.notificationTitle
                        }
                      >
                        {notificacao.titulo}
                      </Text>

                      {!notificacao.lida && (
                        <View
                          style={
                            styles.newBadge
                          }
                        >
                          <Text
                            style={
                              styles.newBadgeText
                            }
                          >
                            NOVA
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text
                      style={
                        styles.notificationMessage
                      }
                    >
                      {notificacao.mensagem}
                    </Text>

                    <View
                      style={[
                        styles.footer,
                        isMobile &&
                          styles.footerMobile,
                      ]}
                    >
                      <Text
                        style={styles.type}
                      >
                        {notificacao.tipo}
                      </Text>

                      <Text
                        style={styles.date}
                      >
                        {formatarData(
                          notificacao.criado_em
                        )}
                      </Text>
                    </View>

                    {/* BOTÃO NO MOBILE */}

                    {isMobile && (
                      <View
                        style={
                          styles.mobileStatusArea
                        }
                      >
                        {!notificacao.lida ? (
                          <Pressable
                            style={
                              styles.readButtonMobile
                            }
                            onPress={() =>
                              marcarComoLida(
                                notificacao.id
                              )
                            }
                          >
                            <CheckCircle2
                              size={16}
                              color={
                                colors.primary
                              }
                            />

                            <Text
                              style={
                                styles.readButtonText
                              }
                            >
                              Marcar como lida
                            </Text>
                          </Pressable>
                        ) : (
                          <View
                            style={
                              styles.readBadgeMobile
                            }
                          >
                            <CheckCircle2
                              size={15}
                              color="#15803D"
                            />

                            <Text
                              style={
                                styles.readText
                              }
                            >
                              Lida
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  {/* BOTÃO NO COMPUTADOR */}

                  {!isMobile &&
                    (!notificacao.lida ? (
                      <Pressable
                        style={
                          styles.readButton
                        }
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

                        <Text
                          style={
                            styles.readButtonText
                          }
                        >
                          Marcar como lida
                        </Text>
                      </Pressable>
                    ) : (
                      <View
                        style={styles.readBadge}
                      >
                        <CheckCircle2
                          size={15}
                          color="#15803D"
                        />

                        <Text
                          style={
                            styles.readText
                          }
                        >
                          Lida
                        </Text>
                      </View>
                    ))}
                </View>
              )
            )
          )}
        </View>
      </View>
    </WebLayout>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: '100%',
    minWidth: 0,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },

  headerMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginBottom: 20,
  },

  headerTextMobile: {
    width: '100%',
  },

  title: {
    fontSize: 27,
    fontWeight: '800',
    color: colors.text,
  },

  subtitle: {
    fontSize: 11,
    lineHeight: 17,
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
    justifyContent: 'center',
  },

  refreshButtonMobile: {
    width: '100%',
    marginTop: 14,
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

  summaryArea: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 25,
  },

  summaryAreaMobile: {
    flexDirection: 'column',
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
  },

  summaryCardSecond: {
    marginLeft: 12,
  },

  summaryCardMobile: {
    width: '100%',
    minHeight: 85,
  },

  summaryCardSecondMobile: {
    marginLeft: 0,
    marginTop: 10,
  },

  summaryIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    flexShrink: 0,
  },

  summaryContent: {
    flex: 1,
    minWidth: 0,
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
    width: '100%',
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
    padding: 20,
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },

  emptyText: {
    marginTop: 5,
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
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

  notificationCardMobile: {
    padding: 14,
    alignItems: 'flex-start',
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
    flexShrink: 0,
  },

  notificationIconMobile: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginRight: 10,
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

  titleRowMobile: {
    alignItems: 'flex-start',
  },

  notificationTitle: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
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

  footerMobile: {
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },

  type: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    marginRight: 12,
    marginBottom: 4,
  },

  date: {
    fontSize: 8,
    color: colors.textLight,
    marginBottom: 4,
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
    justifyContent: 'center',
    flexShrink: 0,
  },

  readButtonMobile: {
    minHeight: 38,
    width: '100%',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    flexShrink: 0,
  },

  readBadgeMobile: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  readText: {
    marginLeft: 5,
    fontSize: 8,
    fontWeight: '800',
    color: '#15803D',
  },

  mobileStatusArea: {
    width: '100%',
    marginTop: 12,
  },
});