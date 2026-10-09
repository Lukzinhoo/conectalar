import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  MessageSquare,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react-native';

import WebLayout from '../../../components/WebLayout';
import WebSidebar from '../../../components/WebSidebar';

import { colors } from '../../../theme/theme';
import { supabase } from '../../../services/supabase';

/* =========================================================
   TIPOS
========================================================= */

type AutorTipo = 'morador' | 'administracao';

type Perfil = {
  id: string;
  nome: string;
  casa: string | null;
  quadra: string | null;
  tipo: string;
  ativo?: boolean;
};

type MensagemBanco = {
  id: string;
  remetente_id: string;
  mensagem: string;
  criado_em: string;
};

type MensagemGeral = {
  id: string;
  autorId: string;
  autorNome: string;
  residencia?: string;
  autorTipo: AutorTipo;
  texto: string;
  horario: string;
  criadoEm: string;
};

/* =========================================================
   FUNÇÕES
========================================================= */

function formatarHorario(data: string) {
  try {
    return new Date(data).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function montarResidencia(perfil?: Perfil | null) {
  if (!perfil) {
    return undefined;
  }

  const partes: string[] = [];

  if (perfil.casa) {
    partes.push(`Casa ${perfil.casa}`);
  }

  if (perfil.quadra) {
    partes.push(`Quadra ${perfil.quadra}`);
  }

  if (partes.length === 0) {
    return undefined;
  }

  return partes.join(' • ');
}

function tipoAdministrativo(tipo?: string) {
  return (
    tipo === 'admin' ||
    tipo === 'sindico' ||
    tipo === 'subsindico'
  );
}

/* =========================================================
   TELA
========================================================= */

export default function WebChatGeralScreen() {
  const { width } = useWindowDimensions();

  const isMobile = width < 768;

  const [mensagens, setMensagens] = useState<MensagemGeral[]>(
    []
  );

  const [novaMensagem, setNovaMensagem] = useState('');

  const [usuarioAtualId, setUsuarioAtualId] = useState('');

  const [carregando, setCarregando] = useState(true);

  const [enviando, setEnviando] = useState(false);

  const [excluindoId, setExcluindoId] = useState<
    string | null
  >(null);

  const [erro, setErro] = useState('');

  const [atualizando, setAtualizando] = useState(false);

  const scrollRef = useRef<ScrollView | null>(null);

  /*
   * Guardamos o usuário atual também em uma ref.
   * Assim o Realtime sempre consegue acessar o ID
   * sem precisar recriar a conexão.
   */

  const usuarioAtualIdRef = useRef('');

  useEffect(() => {
    usuarioAtualIdRef.current = usuarioAtualId;
  }, [usuarioAtualId]);

  /* =======================================================
     BUSCAR PERFIL
  ======================================================= */

  const buscarPerfil = useCallback(
    async (usuarioId: string): Promise<Perfil | null> => {
      const { data, error } = await supabase
        .from('perfis')
        .select(`
          id,
          nome,
          casa,
          quadra,
          tipo,
          ativo
        `)
        .eq('id', usuarioId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar perfil:', error);

        return null;
      }

      return data as Perfil | null;
    },
    []
  );

  /* =======================================================
     CONVERTER MENSAGEM
  ======================================================= */

  const converterMensagem = useCallback(
    (
      item: MensagemBanco,
      perfil: Perfil | null,
      usuarioId: string
    ): MensagemGeral => {
      const admin = tipoAdministrativo(perfil?.tipo);

      return {
        id: item.id,

        autorId: item.remetente_id,

        autorNome: admin
          ? 'Administração'
          : perfil?.nome ?? 'Morador',

        residencia: admin
          ? undefined
          : montarResidencia(perfil),

        autorTipo: admin ? 'administracao' : 'morador',

        texto: item.mensagem,

        horario: formatarHorario(item.criado_em),

        criadoEm: item.criado_em,
      };
    },
    []
  );

  /* =======================================================
     CARREGAR MENSAGENS
  ======================================================= */

  const carregarMensagens = useCallback(
    async (
      idAtual?: string,
      mostrarCarregamento = true
    ) => {
      try {
        if (mostrarCarregamento) {
          setAtualizando(true);
        }

        setErro('');

        let id = idAtual || usuarioAtualIdRef.current;

        if (!id) {
          const { data: userData } =
            await supabase.auth.getUser();

          id = userData.user?.id ?? '';
        }

        if (!id) {
          setErro('Sua sessão não foi encontrada.');

          return;
        }

        const { data, error } = await supabase
          .from('chat_geral_mensagens')
          .select(`
            id,
            remetente_id,
            mensagem,
            criado_em
          `)
          .order('criado_em', {
            ascending: true,
          });

        if (error) {
          console.error(
            'Erro ao carregar mensagens:',
            error
          );

          setErro(
            `Não foi possível carregar as mensagens: ${error.message}`
          );

          return;
        }

        const mensagensBanco =
          (data ?? []) as MensagemBanco[];

        if (mensagensBanco.length === 0) {
          setMensagens([]);

          return;
        }

        /*
         * Pega todos os autores das mensagens.
         */

        const ids = Array.from(
          new Set(
            mensagensBanco.map(
              item => item.remetente_id
            )
          )
        );

        const {
          data: perfisData,
          error: perfisError,
        } = await supabase
          .from('perfis')
          .select(`
            id,
            nome,
            casa,
            quadra,
            tipo,
            ativo
          `)
          .in('id', ids);

        if (perfisError) {
          console.error(
            'Erro ao carregar perfis:',
            perfisError
          );

          setErro(
            `As mensagens foram encontradas, mas não foi possível carregar os autores: ${perfisError.message}`
          );

          return;
        }

        const perfis = (perfisData ?? []) as Perfil[];

        const mapa = new Map<string, Perfil>();

        perfis.forEach(perfil => {
          mapa.set(perfil.id, perfil);
        });

        const lista = mensagensBanco.map(item =>
          converterMensagem(
            item,
            mapa.get(item.remetente_id) ?? null,
            id
          )
        );

        setMensagens(lista);
      } catch (error) {
        console.error(
          'Erro inesperado ao carregar mensagens:',
          error
        );

        setErro(
          'Não foi possível carregar as mensagens.'
        );
      } finally {
        if (mostrarCarregamento) {
          setAtualizando(false);
        }
      }
    },
    [converterMensagem]
  );

  /* =======================================================
     INICIAR CHAT
  ======================================================= */

  const iniciarChat = useCallback(async () => {
    try {
      setCarregando(true);
      setErro('');

      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        setErro(
          'Não foi possível identificar o usuário.'
        );

        return;
      }

      const usuarioId = userData.user.id;

      setUsuarioAtualId(usuarioId);

      usuarioAtualIdRef.current = usuarioId;

      const {
        data: perfil,
        error: perfilError,
      } = await supabase
        .from('perfis')
        .select(
          'id, nome, casa, quadra, tipo, ativo'
        )
        .eq('id', usuarioId)
        .maybeSingle();

      if (perfilError || !perfil) {
        setErro(
          'Perfil administrativo não encontrado.'
        );

        return;
      }

      if (
        !perfil.ativo ||
        !tipoAdministrativo(perfil.tipo)
      ) {
        setErro(
          'Este usuário não possui acesso ao Chat Geral administrativo.'
        );

        return;
      }

      await carregarMensagens(usuarioId, false);
    } catch (error) {
      console.error(
        'Erro ao iniciar Chat Geral:',
        error
      );

      setErro(
        'Não foi possível abrir o Chat Geral.'
      );
    } finally {
      setCarregando(false);
    }
  }, [carregarMensagens]);

  useEffect(() => {
    iniciarChat();
  }, [iniciarChat]);

  /* =======================================================
     REALTIME
  ======================================================= */

  useEffect(() => {
    let canalAtivo = true;

    const canal = supabase
      .channel('admin-chat-geral-realtime')

      /*
       * NOVAS MENSAGENS
       */

      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_geral_mensagens',
        },
        async payload => {
          if (!canalAtivo) {
            return;
          }

          const item = payload.new as MensagemBanco;

          if (!item?.id || !item?.remetente_id) {
            return;
          }

          /*
           * Busca somente o perfil do autor da
           * mensagem nova.
           *
           * Não recarrega o Chat Geral inteiro.
           */

          const perfil = await buscarPerfil(
            item.remetente_id
          );

          if (!canalAtivo) {
            return;
          }

          const nova = converterMensagem(
            item,
            perfil,
            usuarioAtualIdRef.current
          );

          /*
           * Aqui fica a verificação correta.
           *
           * Se a mensagem já entrou pelo envio local,
           * o Realtime NÃO adiciona novamente.
           */

          setMensagens(atual => {
            const jaExiste = atual.some(
              mensagem => mensagem.id === nova.id
            );

            if (jaExiste) {
              return atual;
            }

            return [...atual, nova];
          });
        }
      )

      /*
       * EXCLUSÃO EM TEMPO REAL
       */

      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_geral_mensagens',
        },
        payload => {
          if (!canalAtivo) {
            return;
          }

          const antiga = payload.old as {
            id?: string;
          };

          if (!antiga?.id) {
            return;
          }

          setMensagens(atual =>
            atual.filter(
              item => item.id !== antiga.id
            )
          );
        }
      )

      .subscribe(status => {
        console.log(
          'REALTIME CHAT GERAL ADMIN:',
          status
        );
      });

    return () => {
      canalAtivo = false;

      supabase.removeChannel(canal);
    };
  }, [buscarPerfil, converterMensagem]);

  /* =======================================================
     SCROLL AUTOMÁTICO
  ======================================================= */

  useEffect(() => {
    if (mensagens.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({
        animated: true,
      });
    }, 80);

    return () => clearTimeout(timer);
  }, [mensagens.length]);

  /* =======================================================
     ENVIAR MENSAGEM
  ======================================================= */

  async function enviarMensagem() {
    const texto = novaMensagem.trim();

    if (!texto || enviando) {
      return;
    }

    /*
     * Limpa imediatamente.
     *
     * Assim o campo responde na hora mesmo enquanto
     * o Supabase termina de salvar.
     */

    setNovaMensagem('');
    setEnviando(true);
    setErro('');

    try {
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        setNovaMensagem(texto);

        setErro(
          'Sua sessão não foi encontrada. Entre novamente.'
        );

        return;
      }

      const { data, error } = await supabase
        .from('chat_geral_mensagens')
        .insert({
          remetente_id: userData.user.id,
          mensagem: texto,
        })
        .select(`
          id,
          remetente_id,
          mensagem,
          criado_em
        `)
        .single();

      if (error) {
        console.error(
          'Erro ao enviar mensagem:',
          error
        );

        /*
         * Se der erro, devolve o texto para o campo.
         */

        setNovaMensagem(texto);

        setErro(
          `Não foi possível enviar a mensagem: ${error.message}`
        );

        return;
      }

      const item = data as MensagemBanco;

      const nova: MensagemGeral = {
        id: item.id,

        autorId: item.remetente_id,

        autorNome: 'Administração',

        autorTipo: 'administracao',

        texto: item.mensagem,

        horario: formatarHorario(
          item.criado_em
        ),

        criadoEm: item.criado_em,
      };

      /*
       * Coloca imediatamente na tela do administrador.
       *
       * O Realtime também receberá a mensagem,
       * mas o ID impede duplicação.
       */

      setMensagens(atual => {
        const jaExiste = atual.some(
          mensagem => mensagem.id === nova.id
        );

        if (jaExiste) {
          return atual;
        }

        return [...atual, nova];
      });
    } catch (error) {
      console.error(
        'Erro inesperado ao enviar mensagem:',
        error
      );

      setNovaMensagem(texto);

      setErro(
        'Não foi possível enviar a mensagem.'
      );
    } finally {
      setEnviando(false);
    }
  }

  /* =======================================================
     EXCLUIR MENSAGEM
  ======================================================= */

  async function excluirMensagem(
    mensagem: MensagemGeral
  ) {
    if (excluindoId) {
      return;
    }

    const confirmar =
      typeof window !== 'undefined'
        ? window.confirm(
            `Deseja excluir esta mensagem de ${mensagem.autorNome}?`
          )
        : true;

    if (!confirmar) {
      return;
    }

    try {
      setExcluindoId(mensagem.id);

      setErro('');

      const { error } = await supabase
        .from('chat_geral_mensagens')
        .delete()
        .eq('id', mensagem.id);

      if (error) {
        console.error(
          'Erro ao excluir mensagem:',
          error
        );

        setErro(
          `Não foi possível excluir a mensagem: ${error.message}`
        );

        return;
      }

      /*
       * Remove imediatamente desta tela.
       *
       * O Realtime sincroniza as outras telas.
       */

      setMensagens(atual =>
        atual.filter(
          item => item.id !== mensagem.id
        )
      );
    } catch (error) {
      console.error(
        'Erro inesperado ao excluir mensagem:',
        error
      );

      setErro(
        'Não foi possível excluir a mensagem.'
      );
    } finally {
      setExcluindoId(null);
    }
  }

  /* =======================================================
     PARTICIPANTES
  ======================================================= */

  const participantes = useMemo(() => {
    return new Set(
      mensagens.map(item => item.autorId)
    ).size;
  }, [mensagens]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <WebLayout
      sidebar={
        <WebSidebar active="chatGeral" />
      }
      scroll={isMobile}
      contentStyle={styles.layoutContent}
    >
      <View
        style={[
          styles.page,
          isMobile && styles.pageMobile,
        ]}
      >
        {/* CABEÇALHO */}

        <View
          style={[
            styles.header,
            isMobile && styles.headerMobile,
          ]}
        >
          <View style={styles.headerTextArea}>
            <Text
              style={[
                styles.title,
                isMobile && styles.titleMobile,
              ]}
            >
              Chat Geral
            </Text>

            <Text style={styles.subtitle}>
              Acompanhe e participe da conversa da
              comunidade.
            </Text>
          </View>

          <View
            style={[
              styles.headerActions,
              isMobile &&
                styles.headerActionsMobile,
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                styles.refreshButton,

                isMobile &&
                  styles.refreshButtonMobile,

                pressed &&
                  styles.buttonPressed,
              ]}
              onPress={() =>
                carregarMensagens(
                  undefined,
                  true
                )
              }
              disabled={
                atualizando || carregando
              }
            >
              {atualizando ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                />
              ) : (
                <RefreshCw
                  size={16}
                  color={colors.primary}
                />
              )}

              <Text style={styles.refreshText}>
                Atualizar
              </Text>
            </Pressable>

            {!isMobile && (
              <View style={styles.headerIcon}>
                <Users
                  size={24}
                  color={colors.primary}
                />
              </View>
            )}
          </View>
        </View>

        {/* ERRO */}

        {!!erro && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              {erro}
            </Text>
          </View>
        )}

        {/* CARDS */}

        <View
          style={[
            styles.cards,
            isMobile && styles.cardsMobile,
          ]}
        >
          {/* MENSAGENS */}

          <View
            style={[
              styles.infoCard,
              isMobile &&
                styles.infoCardMobile,
            ]}
          >
            <View style={styles.infoIcon}>
              <MessageSquare
                size={20}
                color={colors.primary}
              />
            </View>

            <View style={styles.infoTextArea}>
              <Text style={styles.infoValue}>
                {mensagens.length}
              </Text>

              <Text style={styles.infoLabel}>
                Mensagens
              </Text>
            </View>
          </View>

          {/* PARTICIPANTES */}

          <View
            style={[
              styles.infoCard,
              isMobile &&
                styles.infoCardMobile,
            ]}
          >
            <View style={styles.infoIcon}>
              <Users
                size={20}
                color={colors.primary}
              />
            </View>

            <View style={styles.infoTextArea}>
              <Text style={styles.infoValue}>
                {participantes}
              </Text>

              <Text style={styles.infoLabel}>
                Participantes
              </Text>
            </View>
          </View>

          {/* ADMINISTRAÇÃO */}

          <View
            style={[
              styles.infoCard,
              isMobile &&
                styles.infoCardMobile,
            ]}
          >
            <View style={styles.infoIcon}>
              <ShieldCheck
                size={20}
                color={colors.primary}
              />
            </View>

            <View style={styles.infoTextArea}>
              <Text
                style={styles.infoValue}
                numberOfLines={1}
              >
                Administração
              </Text>

              <Text style={styles.infoLabel}>
                Moderação ativa
              </Text>
            </View>
          </View>
        </View>

        {/* CHAT */}

        <View
          style={[
            styles.chatCard,
            isMobile &&
              styles.chatCardMobile,
          ]}
        >
          {/* HEADER DO CHAT */}

          <View
            style={[
              styles.chatHeader,
              isMobile &&
                styles.chatHeaderMobile,
            ]}
          >
            <View style={styles.chatHeaderInfo}>
              <Text
                style={styles.chatHeaderTitle}
              >
                Comunidade ConectaLar
              </Text>

              <Text
                style={styles.chatHeaderText}
              >
                Espaço de comunicação entre
                moradores e administração.
              </Text>
            </View>

            {!isMobile && (
              <View style={styles.onlineBox}>
                <View style={styles.onlineDot} />

                <Text style={styles.onlineText}>
                  Chat geral
                </Text>
              </View>
            )}
          </View>

          {/* MENSAGENS */}

          <View style={styles.messagesContainer}>
            <ScrollView
              ref={scrollRef}
              style={[
                styles.messageScroll,

                isMobile &&
                  styles.messageScrollMobile,
              ]}
              contentContainerStyle={[
                styles.mensagens,

                isMobile &&
                  styles.mensagensMobile,
              ]}
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              onContentSizeChange={() =>
                scrollRef.current?.scrollToEnd(
                  {
                    animated: true,
                  }
                )
              }
            >
              {carregando ? (
                <View style={styles.vazio}>
                  <ActivityIndicator
                    size="large"
                    color={colors.primary}
                  />

                  <Text
                    style={styles.vazioText}
                  >
                    Carregando mensagens...
                  </Text>
                </View>
              ) : mensagens.length === 0 ? (
                <View style={styles.vazio}>
                  <MessageSquare
                    size={42}
                    color={colors.textLight}
                  />

                  <Text
                    style={styles.vazioTitle}
                  >
                    Nenhuma mensagem
                  </Text>

                  <Text
                    style={[
                      styles.vazioText,

                      isMobile &&
                        styles.vazioTextMobile,
                    ]}
                  >
                    Seja o primeiro a enviar uma
                    mensagem para a comunidade.
                  </Text>
                </View>
              ) : (
                mensagens.map(mensagem => {
                  const admin =
                    mensagem.autorTipo ===
                    'administracao';

                  const mensagemPropria =
                    mensagem.autorId ===
                    usuarioAtualId;

                  const inicial =
                    mensagem.autorNome
                      ?.trim()
                      ?.charAt(0)
                      ?.toUpperCase() || '?';

                  return (
                    <View
                      key={mensagem.id}
                      style={[
                        styles.mensagemLinha,

                        admin
                          ? styles.linhaAdmin
                          : styles.linhaMorador,
                      ]}
                    >
                      <View
                        style={[
                          styles.mensagemBox,

                          isMobile &&
                            styles.mensagemBoxMobile,

                          admin
                            ? styles.mensagemAdmin
                            : styles.mensagemMorador,
                        ]}
                      >
                        {/* AUTOR */}

                        <View
                          style={styles.autorLinha}
                        >
                          <View
                            style={[
                              styles.avatar,

                              admin &&
                                styles.avatarAdmin,
                            ]}
                          >
                            <Text
                              style={[
                                styles.avatarText,

                                admin &&
                                  styles.avatarTextAdmin,
                              ]}
                            >
                              {inicial}
                            </Text>
                          </View>

                          <View
                            style={styles.autorInfo}
                          >
                            <View
                              style={styles.nomeLinha}
                            >
                              <Text
                                style={[
                                  styles.autorNome,

                                  admin &&
                                    styles.textoAdmin,
                                ]}
                                numberOfLines={1}
                              >
                                {
                                  mensagem.autorNome
                                }
                              </Text>

                              {admin && (
                                <View
                                  style={
                                    styles.adminBadge
                                  }
                                >
                                  <Text
                                    style={
                                      styles.adminBadgeText
                                    }
                                  >
                                    ADM
                                  </Text>
                                </View>
                              )}
                            </View>

                            {!!mensagem.residencia && (
                              <Text
                                style={[
                                  styles.residencia,

                                  admin &&
                                    styles.textoAdminSecundario,
                                ]}
                                numberOfLines={1}
                              >
                                {
                                  mensagem.residencia
                                }
                              </Text>
                            )}
                          </View>

                          {/* ADMIN PODE EXCLUIR */}

                          <Pressable
                            style={({ pressed }) => [
                              styles.deleteButton,

                              pressed &&
                                styles.buttonPressed,
                            ]}
                            onPress={() =>
                              excluirMensagem(
                                mensagem
                              )
                            }
                            disabled={
                              excluindoId ===
                              mensagem.id
                            }
                          >
                            {excluindoId ===
                            mensagem.id ? (
                              <ActivityIndicator
                                size="small"
                                color={
                                  admin
                                    ? '#FFFFFF'
                                    : colors.danger
                                }
                              />
                            ) : (
                              <Trash2
                                size={15}
                                color={
                                  admin
                                    ? '#FFFFFF'
                                    : colors.danger
                                }
                              />
                            )}
                          </Pressable>
                        </View>

                        {/* TEXTO */}

                        <Text
                          style={[
                            styles.mensagemTexto,

                            admin &&
                              styles.textoAdmin,
                          ]}
                        >
                          {mensagem.texto}
                        </Text>

                        {/* HORÁRIO */}

                        <View
                          style={
                            styles.messageBottom
                          }
                        >
                          {mensagemPropria &&
                            admin && (
                              <Text
                                style={styles.youText}
                              >
                                Você
                              </Text>
                            )}

                          <Text
                            style={[
                              styles.horario,

                              admin &&
                                styles.textoAdminSecundario,
                            ]}
                          >
                            {mensagem.horario}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>

          {/* ENVIO */}

          <View
            style={[
              styles.enviarArea,

              isMobile &&
                styles.enviarAreaMobile,
            ]}
          >
            <View style={styles.inputWrapper}>
              <TextInput
                value={novaMensagem}
                onChangeText={setNovaMensagem}
                placeholder="Escreva uma mensagem..."
                placeholderTextColor={
                  colors.textLight
                }
                style={[
                  styles.input,

                  isMobile &&
                    styles.inputMobile,
                ]}
                multiline
                maxLength={1000}
                editable={
                  !enviando &&
                  !carregando
                }
              />

              <Text
                style={styles.characterCount}
              >
                {novaMensagem.length}/1000
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.sendButton,

                isMobile &&
                  styles.sendButtonMobile,

                (!novaMensagem.trim() ||
                  enviando ||
                  carregando) &&
                  styles.sendDisabled,

                pressed &&
                  !!novaMensagem.trim() &&
                  !enviando &&
                  !carregando &&
                  styles.buttonPressed,
              ]}
              onPress={enviarMensagem}
              disabled={
                !novaMensagem.trim() ||
                enviando ||
                carregando
              }
            >
              {enviando ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Send
                  size={19}
                  color="#FFFFFF"
                />
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </WebLayout>
  );
}

/* =========================================================
   ESTILOS
========================================================= */

const styles = StyleSheet.create({
  layoutContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },

  page: {
    flex: 1,
    width: '100%',
    minWidth: 0,
  },

  pageMobile: {
    flex: 0,
    flexGrow: 0,
    flexShrink: 0,
    width: '100%',
    minWidth: 0,
    paddingBottom: 24,
  },

  /* HEADER */

  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  headerMobile: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    marginBottom: 16,
  },

  headerTextArea: {
    flex: 1,
    minWidth: 0,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },

  headerActionsMobile: {
    width: '100%',
    marginLeft: 0,
    marginTop: 14,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },

  titleMobile: {
    fontSize: 23,
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    marginTop: 5,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  refreshButton: {
    height: 42,
    paddingHorizontal: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  refreshButtonMobile: {
    width: '100%',
    marginRight: 0,
  },

  refreshText: {
    marginLeft: 7,
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },

  buttonPressed: {
    opacity: 0.72,
  },

  /* ERRO */

  errorBox: {
    width: '100%',
    backgroundColor: colors.dangerLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 15,
  },

  errorText: {
    color: colors.danger,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '700',
  },

  /* CARDS */

  cards: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 18,
    gap: 12,
  },

  cardsMobile: {
    flexDirection: 'column',
    gap: 10,
  },

  infoCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoCardMobile: {
    width: '100%',
    flex: 0,
    minHeight: 68,
    paddingVertical: 10,
  },

  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    flexShrink: 0,
  },

  infoTextArea: {
    flex: 1,
    minWidth: 0,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },

  infoLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },

  /* CHAT */

  chatCard: {
    flex: 1,
    width: '100%',
    minWidth: 0,
    minHeight: 520,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    overflow: 'hidden',
  },

  /*
   * CORREÇÃO MOBILE
   *
   * Mantemos a altura fixa para o chat
   * não encolher nem desaparecer no celular.
   */

  chatCardMobile: {
    flex: 0,
    flexGrow: 0,
    flexShrink: 0,

    width: '100%',
    minWidth: 0,

    height: 620,
    minHeight: 620,
    maxHeight: 620,
    flexBasis: 620,

    borderRadius: 14,
    marginBottom: 20,

    overflow: 'hidden',
  },

  /* HEADER CHAT */

  chatHeader: {
    minHeight: 70,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },

  chatHeaderMobile: {
    height: 74,
    minHeight: 74,
    maxHeight: 74,

    paddingHorizontal: 14,
    paddingVertical: 12,

    flexShrink: 0,
  },

  chatHeaderInfo: {
    flex: 1,
    minWidth: 0,
  },

  chatHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },

  chatHeaderText: {
    fontSize: 10,
    lineHeight: 15,
    color: colors.textSecondary,
    marginTop: 3,
  },

  onlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginLeft: 12,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 6,
  },

  onlineText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  /* CONTAINER DAS MENSAGENS */

  messagesContainer: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,

    width: '100%',
    minHeight: 0,

    overflow: 'hidden',

    backgroundColor: colors.background,
  },

  messageScroll: {
    flex: 1,
    flexGrow: 1,

    width: '100%',
    minHeight: 0,

    backgroundColor: colors.background,
  },

  messageScrollMobile: {
    flex: 1,
    flexGrow: 1,
    minHeight: 0,
  },

  mensagens: {
    flexGrow: 1,
    padding: 20,
  },

  mensagensMobile: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },

  /* MENSAGEM */

  mensagemLinha: {
    width: '100%',
    marginBottom: 13,
  },

  linhaAdmin: {
    alignItems: 'flex-end',
  },

  linhaMorador: {
    alignItems: 'flex-start',
  },

  mensagemBox: {
    width: 'auto',
    maxWidth: '76%',
    minWidth: 180,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },

  mensagemBoxMobile: {
    maxWidth: '92%',
    minWidth: 0,
    width: 'auto',
  },

  mensagemAdmin: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },

  mensagemMorador: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },

  /* AUTOR */

  autorLinha: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
  },

  avatarAdmin: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  avatarText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },

  avatarTextAdmin: {
    color: '#FFFFFF',
  },

  autorInfo: {
    flex: 1,
    minWidth: 0,
  },

  nomeLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },

  autorNome: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: '800',
    color: colors.text,
  },

  residencia: {
    fontSize: 8,
    color: colors.textSecondary,
    marginTop: 2,
  },

  adminBadge: {
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  adminBadgeText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  deleteButton: {
    width: 29,
    height: 29,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    flexShrink: 0,
  },

  mensagemTexto: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.text,
  },

  textoAdmin: {
    color: '#FFFFFF',
  },

  textoAdminSecundario: {
    color: 'rgba(255,255,255,0.72)',
  },

  messageBottom: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 7,
  },

  youText: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.72)',
    marginRight: 7,
  },

  horario: {
    fontSize: 8,
    color: colors.textSecondary,
  },

  /* ENVIO */

  enviarArea: {
    width: '100%',
    minHeight: 76,

    borderTopWidth: 1,
    borderTopColor: colors.border,

    backgroundColor: colors.surface,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 16,
    paddingVertical: 11,

    flexShrink: 0,
  },

  /*
   * Fica fixo no rodapé do chat mobile.
   */

  enviarAreaMobile: {
    width: '100%',

    height: 76,
    minHeight: 76,
    maxHeight: 76,

    paddingHorizontal: 10,
    paddingVertical: 10,

    flexShrink: 0,
    flexGrow: 0,
  },

  inputWrapper: {
    flex: 1,
    minWidth: 0,
    position: 'relative',
  },

  input: {
    width: '100%',
    minHeight: 46,
    maxHeight: 90,

    borderWidth: 1,
    borderColor: colors.border,

    borderRadius: 12,

    backgroundColor: colors.background,

    paddingLeft: 13,
    paddingRight: 52,
    paddingTop: 11,
    paddingBottom: 11,

    fontSize: 11,
    color: colors.text,

    outlineStyle: 'none',
  } as any,

  inputMobile: {
    height: 46,
    minHeight: 46,
    maxHeight: 46,

    paddingHorizontal: 11,
    paddingRight: 48,
  },

  characterCount: {
    position: 'absolute',
    right: 9,
    bottom: 5,

    fontSize: 7,
    color: colors.textLight,
  },

  sendButton: {
    width: 46,
    height: 46,

    borderRadius: 12,

    backgroundColor: colors.primary,

    alignItems: 'center',
    justifyContent: 'center',

    marginLeft: 10,

    flexShrink: 0,
  },

  sendButtonMobile: {
    width: 46,
    height: 46,
  },

  sendDisabled: {
    opacity: 0.45,
  },

  /* VAZIO */

  vazio: {
    flex: 1,
    minHeight: 260,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 25,
    paddingVertical: 35,
  },

  vazioTitle: {
    marginTop: 12,

    fontSize: 15,
    fontWeight: '800',

    color: colors.text,

    textAlign: 'center',
  },

  vazioText: {
    marginTop: 7,

    maxWidth: 320,

    fontSize: 10,
    lineHeight: 16,

    color: colors.textSecondary,

    textAlign: 'center',
  },

  vazioTextMobile: {
    maxWidth: 240,
  },
});