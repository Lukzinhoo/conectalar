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
  CalendarDays,
  Clock3,
  RefreshCw,
} from 'lucide-react-native';

import WebMoradorSidebar from '../../../components/WebMoradorSidebar';
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
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarHorarios();
  }, []);

  async function carregarHorarios() {
    try {
      setCarregando(true);
      setErro('');

      const { data, error } = await supabase
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
        console.error('Erro ao buscar horários:', error);

        setHorarios([]);
        setErro(error.message);
        return;
      }

      console.log('HORÁRIOS DO SUPABASE:', data);

      setHorarios((data ?? []) as Horario[]);
    } catch (error) {
      console.error(error);

      setHorarios([]);
      setErro('Não foi possível carregar os horários.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={styles.container}>
      <WebMoradorSidebar active="horarios" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Horários
            </Text>

            <Text style={styles.subtitle}>
              Horários cadastrados pela administração
            </Text>
          </View>

          <Pressable
            style={styles.refreshButton}
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
              <Text style={styles.tryButtonText}>
                Tentar novamente
              </Text>
            </Pressable>
          </View>
        ) : horarios.length === 0 ? (
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
          <View style={styles.grid}>
            {horarios.map((horario) => (
              <View
                key={horario.id}
                style={styles.card}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.iconBox}>
                    <Clock3
                      size={22}
                      color="#2949C7"
                    />
                  </View>

                  <View style={styles.activeBadge}>
                    <View style={styles.activeDot} />

                    <Text style={styles.activeText}>
                      Ativo
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardTitle}>
                  {horario.titulo}
                </Text>

                <View style={styles.infoRow}>
                  <CalendarDays
                    size={16}
                    color="#64748B"
                  />

                  <Text style={styles.infoText}>
                    {horario.dias}
                  </Text>
                </View>

                <View style={styles.timeArea}>
                  <View>
                    <Text style={styles.timeLabel}>
                      Início
                    </Text>

                    <Text style={styles.time}>
                      {horario.horario_inicio}
                    </Text>
                  </View>

                  <Text style={styles.ate}>
                    até
                  </Text>

                  <View>
                    <Text style={styles.timeLabel}>
                      Fim
                    </Text>

                    <Text style={styles.time}>
                      {horario.horario_fim}
                    </Text>
                  </View>
                </View>

                {horario.observacao ? (
                  <View style={styles.observation}>
                    <Text style={styles.observationText}>
                      {horario.observacao}
                    </Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F5F7FB',
  },

  content: {
    flex: 1,
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
    fontSize: 28,
    fontWeight: '800',
    color: '#172033',
  },

  subtitle: {
    marginTop: 5,
    fontSize: 12,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -7,
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
    marginLeft: 8,
    fontSize: 11,
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
  },

  emptyText: {
    marginTop: 7,
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },

  errorBox: {
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
  },

  errorText: {
    marginTop: 8,
    fontSize: 11,
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