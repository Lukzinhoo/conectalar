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
  CalendarDays,
  Clock3,
  RefreshCw,
} from 'lucide-react-native';

import WebMoradorSidebar from '../../../components/WebMoradorSidebar';
import WebLayout from '../../../components/WebLayout';
import { supabase } from '../../../services/supabase';

type Horario = {
  id: string;
  titulo: string;
  dias: string;
  horario_inicio: string;
  horario_fim: string;
  observacao: string | null;
};

export default function WebMoradorHorariosScreen() {
  const { width } = useWindowDimensions();

  const isMobile = width < 768;

  const [horarios, setHorarios] =
    useState<Horario[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState('');

  useEffect(() => {
    carregarHorarios();
  }, []);

  async function carregarHorarios() {
    try {
      setCarregando(true);
      setErro('');

      const { data, error } =
        await supabase
          .from('horarios')
          .select(`
            id,
            titulo,
            dias,
            horario_inicio,
            horario_fim,
            observacao
          `)
          .eq('ativo', true)
          .order('criado_em', {
            ascending: false,
          });

      if (error) {
        console.error(
          'Erro ao buscar horários:',
          error
        );

        setHorarios([]);
        setErro(error.message);

        return;
      }

      console.log(
        'HORÁRIOS DO SUPABASE:',
        data
      );

      setHorarios(
        (data ?? []) as Horario[]
      );
    } catch (error) {
      console.error(error);

      setHorarios([]);

      setErro(
        'Não foi possível carregar os horários.'
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <WebLayout
      sidebar={
        <WebMoradorSidebar active="horarios" />
      }
    >
      <View style={styles.page}>
        {/* CABEÇALHO */}

        <View
          style={[
            styles.header,
            isMobile && styles.headerMobile,
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
              Horários
            </Text>

            <Text style={styles.subtitle}>
              Horários cadastrados pela administração
            </Text>
          </View>

          <Pressable
            style={[
              styles.refreshButton,
              isMobile &&
                styles.refreshButtonMobile,
            ]}
            onPress={carregarHorarios}
          >
            <RefreshCw
              size={17}
              color="#2949C7"
            />

            <Text style={styles.refreshText}>
              Atualizar
            </Text>
          </Pressable>
        </View>

        {/* CARREGANDO */}

        {carregando ? (
          <View style={styles.center}>
            <ActivityIndicator
              size="large"
              color="#2949C7"
            />

            <Text style={styles.loadingText}>
              Carregando horários...
            </Text>
          </View>
        ) : erro ? (
          /* ERRO */

          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>
              Não foi possível carregar
            </Text>

            <Text style={styles.errorText}>
              {erro}
            </Text>

            <Pressable
              style={styles.tryButton}
              onPress={carregarHorarios}
            >
              <Text
                style={styles.tryButtonText}
              >
                Tentar novamente
              </Text>
            </Pressable>
          </View>
        ) : horarios.length === 0 ? (
          /* VAZIO */

          <View style={styles.emptyBox}>
            <Clock3
              size={42}
              color="#2949C7"
            />

            <Text style={styles.emptyTitle}>
              Nenhum horário cadastrado
            </Text>

            <Text style={styles.emptyText}>
              Quando a administração cadastrar um horário,
              ele aparecerá aqui.
            </Text>
          </View>
        ) : (
          /* CARDS */

          <View
            style={[
              styles.grid,
              isMobile && styles.gridMobile,
            ]}
          >
            {horarios.map((horario) => (
              <View
                key={horario.id}
                style={[
                  styles.card,
                  isMobile && styles.cardMobile,
                ]}
              >
                {/* TOPO DO CARD */}

                <View style={styles.cardHeader}>
                  <View style={styles.iconBox}>
                    <Clock3
                      size={22}
                      color="#2949C7"
                    />
                  </View>

                  <View style={styles.activeBadge}>
                    <View
                      style={styles.activeDot}
                    />

                    <Text
                      style={styles.activeText}
                    >
                      Ativo
                    </Text>
                  </View>
                </View>

                {/* TÍTULO */}

                <Text style={styles.cardTitle}>
                  {horario.titulo}
                </Text>

                {/* DIAS */}

                <View style={styles.infoRow}>
                  <CalendarDays
                    size={16}
                    color="#64748B"
                  />

                  <Text style={styles.infoText}>
                    {horario.dias}
                  </Text>
                </View>

                {/* HORÁRIO */}

                <View
                  style={[
                    styles.timeArea,
                    isMobile &&
                      styles.timeAreaMobile,
                  ]}
                >
                  <View
                    style={styles.timeBlock}
                  >
                    <Text
                      style={styles.timeLabel}
                    >
                      Início
                    </Text>

                    <Text style={styles.time}>
                      {horario.horario_inicio}
                    </Text>
                  </View>

                  <Text style={styles.ate}>
                    até
                  </Text>

                  <View
                    style={[
                      styles.timeBlock,
                      styles.timeBlockEnd,
                    ]}
                  >
                    <Text
                      style={styles.timeLabel}
                    >
                      Fim
                    </Text>

                    <Text style={styles.time}>
                      {horario.horario_fim}
                    </Text>
                  </View>
                </View>

                {/* OBSERVAÇÃO */}

                {horario.observacao ? (
                  <View
                    style={styles.observation}
                  >
                    <Text
                      style={
                        styles.observationText
                      }
                    >
                      {horario.observacao}
                    </Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}
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
    fontSize: 28,
    fontWeight: '800',
    color: '#172033',
  },

  subtitle: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: '#64748B',
  },

  refreshButton: {
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE2EA',
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
    color: '#2949C7',
    fontWeight: '700',
    fontSize: 11,
  },

  center: {
    minHeight: 350,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 11,
    color: '#64748B',
  },

  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -7,
  },

  gridMobile: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
    marginHorizontal: 0,
  },

  card: {
    width: '47%',
    minHeight: 230,
    margin: 7,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E6ED',
  },

  cardMobile: {
    width: '100%',
    minHeight: 0,
    margin: 0,
    marginBottom: 14,
    padding: 17,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2949C7',
    marginRight: 6,
  },

  activeText: {
    color: '#2949C7',
    fontSize: 9,
    fontWeight: '700',
  },

  cardTitle: {
    marginTop: 17,
    fontSize: 16,
    fontWeight: '800',
    color: '#172033',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },

  infoText: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
    fontSize: 11,
    lineHeight: 17,
    color: '#64748B',
    fontWeight: '600',
  },

  timeArea: {
    marginTop: 17,
    padding: 14,
    borderRadius: 11,
    backgroundColor: '#F7F8FB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  timeAreaMobile: {
    width: '100%',
    paddingHorizontal: 12,
  },

  timeBlock: {
    flex: 1,
    minWidth: 0,
  },

  timeBlockEnd: {
    alignItems: 'flex-end',
  },

  timeLabel: {
    fontSize: 8,
    color: '#94A3B8',
    fontWeight: '600',
  },

  time: {
    marginTop: 3,
    fontSize: 16,
    fontWeight: '800',
    color: '#172033',
  },

  ate: {
    color: '#94A3B8',
    fontSize: 9,
    marginHorizontal: 12,
  },

  observation: {
    marginTop: 14,
    padding: 11,
    borderRadius: 9,
    backgroundColor: '#EEF2FF',
  },

  observationText: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 15,
  },

  emptyBox: {
    width: '100%',
    minHeight: 350,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E6ED',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  emptyTitle: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '800',
    color: '#172033',
    textAlign: 'center',
  },

  emptyText: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 17,
    color: '#64748B',
    textAlign: 'center',
  },

  errorBox: {
    width: '100%',
    minHeight: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E1E6ED',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#172033',
    textAlign: 'center',
  },

  errorText: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 17,
    color: '#DC2626',
    textAlign: 'center',
  },

  tryButton: {
    marginTop: 16,
    backgroundColor: '#2949C7',
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 9,
  },

  tryButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});