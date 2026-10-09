import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  DollarSign,
  Edit3,
  FileText,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  Wallet,
  X,
} from 'lucide-react-native';

import { colors } from '../../../theme/theme';
import { supabase } from '../../../services/supabase';

import WebLayout from '../../../components/WebLayout';
import WebSidebar from '../../../components/WebSidebar';

/* =====================================================
   TIPOS
===================================================== */

type TipoFinanceiro =
  | 'receita'
  | 'despesa';

type StatusFinanceiro =
  | 'pendente'
  | 'pago'
  | 'recebido'
  | 'atrasado'
  | 'cancelado';

type Financeiro = {
  id: string;
  tipo: TipoFinanceiro;
  categoria: string;
  descricao: string;
  fornecedor: string | null;
  documento_numero: string | null;
  valor: number;
  data_lancamento: string;
  data_vencimento: string | null;
  data_pagamento: string | null;
  status: StatusFinanceiro;
  forma_pagamento: string | null;
  observacao: string | null;
  visivel_moradores: boolean;
  criado_em: string;
  atualizado_em: string;
};

type DocumentoFinanceiro = {
  id: string;
  lancamento_id: string | null;
  nome_arquivo: string;
  caminho_arquivo: string;
  tipo_arquivo: string | null;
  tamanho_arquivo: number | null;
  ocr_processado: boolean;
  criado_em: string;
};

const CATEGORIAS_RECEITA = [
  'Taxa condominial',
  'Multa',
  'Reserva',
  'Acordo',
  'Outros',
];

const CATEGORIAS_DESPESA = [
  'Água',
  'Energia',
  'Manutenção',
  'Funcionários',
  'Limpeza',
  'Segurança',
  'Internet',
  'Contabilidade',
  'Material',
  'Obras',
  'Outros',
];

/* =====================================================
   COMPONENTE
===================================================== */

export default function WebFinanceiroScreen() {
  const { width } = useWindowDimensions();

  const isMobile = width < 768;

  const inputArquivoRef =
    useRef<HTMLInputElement | null>(null);

  const [registros, setRegistros] =
    useState<Financeiro[]>([]);

  const [documentos, setDocumentos] =
    useState<DocumentoFinanceiro[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [atualizando, setAtualizando] =
    useState(false);

  const [salvando, setSalvando] =
    useState(false);

  const [excluindo, setExcluindo] =
    useState(false);

  const [enviandoArquivo, setEnviandoArquivo] =
    useState(false);

  const [modalVisivel, setModalVisivel] =
    useState(false);

  const [
    modalDocumentos,
    setModalDocumentos,
  ] = useState(false);

  const [
    registroEditando,
    setRegistroEditando,
  ] = useState<Financeiro | null>(
    null
  );

  /* ===================================================
     FORMULÁRIO
  =================================================== */

  const [tipo, setTipo] =
    useState<TipoFinanceiro>(
      'despesa'
    );

  const [categoria, setCategoria] =
    useState('Outros');

  const [descricao, setDescricao] =
    useState('');

  const [fornecedor, setFornecedor] =
    useState('');

  const [
    numeroDocumento,
    setNumeroDocumento,
  ] = useState('');

  const [valor, setValor] =
    useState('');

  const [
    dataLancamento,
    setDataLancamento,
  ] = useState(
    new Date()
      .toISOString()
      .slice(0, 10)
  );

  const [
    dataVencimento,
    setDataVencimento,
  ] = useState('');

  const [
    dataPagamento,
    setDataPagamento,
  ] = useState('');

  const [
    status,
    setStatus,
  ] = useState<StatusFinanceiro>(
    'pendente'
  );

  const [
    formaPagamento,
    setFormaPagamento,
  ] = useState('');

  const [
    observacao,
    setObservacao,
  ] = useState('');

  const [
    visivelMoradores,
    setVisivelMoradores,
  ] = useState(true);

  const [erro, setErro] =
    useState('');

  const [sucesso, setSucesso] =
    useState('');

  /* ===================================================
     CARREGAR DADOS
  =================================================== */

  const carregarFinanceiro =
    useCallback(
      async (
        modoAtualizacao = false
      ) => {
        try {
          setErro('');

          if (modoAtualizacao) {
            setAtualizando(true);
          } else {
            setCarregando(true);
          }

          const {
            data,
            error,
          } = await supabase
            .from(
              'financeiro_lancamentos'
            )
            .select(`
              id,
              tipo,
              categoria,
              descricao,
              fornecedor,
              documento_numero,
              valor,
              data_lancamento,
              data_vencimento,
              data_pagamento,
              status,
              forma_pagamento,
              observacao,
              visivel_moradores,
              criado_em,
              atualizado_em
            `)
            .order(
              'criado_em',
              {
                ascending: false,
              }
            );

          if (error) {
            throw error;
          }

          setRegistros(
            (data ?? []) as Financeiro[]
          );

          const {
            data: docsData,
            error: docsError,
          } = await supabase
            .from(
              'financeiro_documentos'
            )
            .select(`
              id,
              lancamento_id,
              nome_arquivo,
              caminho_arquivo,
              tipo_arquivo,
              tamanho_arquivo,
              ocr_processado,
              criado_em
            `)
            .order(
              'criado_em',
              {
                ascending: false,
              }
            );

          if (docsError) {
            throw docsError;
          }

          setDocumentos(
            (docsData ??
              []) as DocumentoFinanceiro[]
          );
        } catch (error: any) {
          console.error(
            'Erro financeiro:',
            error
          );

          setErro(
            error?.message ||
              'Não foi possível carregar o financeiro.'
          );
        } finally {
          setCarregando(false);
          setAtualizando(false);
        }
      },
      []
    );

  useEffect(() => {
    carregarFinanceiro();
  }, [carregarFinanceiro]);

  /* ===================================================
     RESUMO
  =================================================== */

  const resumo = useMemo(() => {
    const receitas =
      registros
        .filter(
          (item) =>
            item.tipo ===
              'receita' &&
            item.status ===
              'recebido'
        )
        .reduce(
          (total, item) =>
            total +
            Number(
              item.valor || 0
            ),
          0
        );

    const despesas =
      registros
        .filter(
          (item) =>
            item.tipo ===
              'despesa' &&
            item.status ===
              'pago'
        )
        .reduce(
          (total, item) =>
            total +
            Number(
              item.valor || 0
            ),
          0
        );

    const pendentes =
      registros
        .filter(
          (item) =>
            item.status ===
              'pendente' ||
            item.status ===
              'atrasado'
        )
        .reduce(
          (total, item) =>
            total +
            Number(
              item.valor || 0
            ),
          0
        );

    return {
      receitas,
      despesas,
      saldo:
        receitas - despesas,
      pendentes,
    };
  }, [registros]);

  /* ===================================================
     FORMULÁRIO
  =================================================== */

  function limparFormulario() {
    setTipo('despesa');
    setCategoria('Outros');
    setDescricao('');
    setFornecedor('');
    setNumeroDocumento('');
    setValor('');

    setDataLancamento(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

    setDataVencimento('');
    setDataPagamento('');
    setStatus('pendente');
    setFormaPagamento('');
    setObservacao('');
    setVisivelMoradores(true);

    setRegistroEditando(null);
  }

  function abrirNovoRegistro() {
    limparFormulario();

    setErro('');
    setSucesso('');

    setModalVisivel(true);
  }

  function abrirEdicao(
    item: Financeiro
  ) {
    setRegistroEditando(item);

    setTipo(item.tipo);
    setCategoria(
      item.categoria
    );

    setDescricao(
      item.descricao
    );

    setFornecedor(
      item.fornecedor ?? ''
    );

    setNumeroDocumento(
      item.documento_numero ??
        ''
    );

    setValor(
      Number(item.valor)
        .toFixed(2)
        .replace('.', ',')
    );

    setDataLancamento(
      item.data_lancamento
    );

    setDataVencimento(
      item.data_vencimento ??
        ''
    );

    setDataPagamento(
      item.data_pagamento ?? ''
    );

    setStatus(item.status);

    setFormaPagamento(
      item.forma_pagamento ??
        ''
    );

    setObservacao(
      item.observacao ?? ''
    );

    setVisivelMoradores(
      item.visivel_moradores
    );

    setErro('');
    setSucesso('');

    setModalVisivel(true);
  }

  function fecharModal() {
    if (
      salvando ||
      excluindo
    ) {
      return;
    }

    setModalVisivel(false);
    limparFormulario();
  }

  /* ===================================================
     VALOR
  =================================================== */

  function converterValor(
    valorDigitado: string
  ) {
    let texto =
      valorDigitado
        .trim()
        .replace(/\s/g, '')
        .replace('R$', '');

    if (
      texto.includes('.') &&
      texto.includes(',')
    ) {
      texto = texto
        .replace(/\./g, '')
        .replace(',', '.');
    } else if (
      texto.includes(',')
    ) {
      texto =
        texto.replace(',', '.');
    }

    return Number(texto);
  }

  /* ===================================================
     SALVAR
  =================================================== */

  async function salvarRegistro() {
    try {
      setErro('');
      setSucesso('');

      const descricaoLimpa =
        descricao.trim();

      const valorNumero =
        converterValor(valor);

      if (!descricaoLimpa) {
        setErro(
          'Digite a descrição do lançamento.'
        );
        return;
      }

      if (
        !Number.isFinite(
          valorNumero
        ) ||
        valorNumero <= 0
      ) {
        setErro(
          'Digite um valor válido.'
        );
        return;
      }

      if (!dataLancamento) {
        setErro(
          'Informe a data do lançamento.'
        );
        return;
      }

      setSalvando(true);

      const {
        data: userData,
      } =
        await supabase.auth.getUser();

      const dados = {
        tipo,
        categoria,
        descricao:
          descricaoLimpa,

        fornecedor:
          fornecedor.trim() ||
          null,

        documento_numero:
          numeroDocumento.trim() ||
          null,

        valor:
          valorNumero,

        data_lancamento:
          dataLancamento,

        data_vencimento:
          dataVencimento ||
          null,

        data_pagamento:
          dataPagamento ||
          null,

        status,

        forma_pagamento:
          formaPagamento.trim() ||
          null,

        observacao:
          observacao.trim() ||
          null,

        visivel_moradores:
          visivelMoradores,
      };

      if (registroEditando) {
        const {
          error,
        } = await supabase
          .from(
            'financeiro_lancamentos'
          )
          .update(dados)
          .eq(
            'id',
            registroEditando.id
          );

        if (error) {
          throw error;
        }

        setSucesso(
          'Lançamento atualizado com sucesso.'
        );
      } else {
        const {
          error,
        } = await supabase
          .from(
            'financeiro_lancamentos'
          )
          .insert({
            ...dados,

            criado_por:
              userData.user?.id ??
              null,
          });

        if (error) {
          throw error;
        }

        setSucesso(
          'Lançamento cadastrado com sucesso.'
        );
      }

      setModalVisivel(false);

      limparFormulario();

      await carregarFinanceiro(
        true
      );
    } catch (error: any) {
      console.error(
        'Erro ao salvar:',
        error
      );

      setErro(
        error?.message ||
          'Não foi possível salvar o lançamento.'
      );
    } finally {
      setSalvando(false);
    }
  }

  /* ===================================================
     EXCLUIR
  =================================================== */

  async function excluirRegistro() {
    if (!registroEditando) {
      return;
    }

    const confirmar =
      typeof globalThis !==
        'undefined' &&
      typeof (
        globalThis as any
      ).confirm ===
        'function'
        ? (
            globalThis as any
          ).confirm(
            `Deseja excluir "${registroEditando.descricao}"?`
          )
        : true;

    if (!confirmar) {
      return;
    }

    try {
      setExcluindo(true);
      setErro('');

      const {
        error,
      } = await supabase
        .from(
          'financeiro_lancamentos'
        )
        .delete()
        .eq(
          'id',
          registroEditando.id
        );

      if (error) {
        throw error;
      }

      setModalVisivel(false);

      limparFormulario();

      setSucesso(
        'Lançamento excluído com sucesso.'
      );

      await carregarFinanceiro(
        true
      );
    } catch (error: any) {
      setErro(
        error?.message ||
          'Não foi possível excluir.'
      );
    } finally {
      setExcluindo(false);
    }
  }

  /* ===================================================
     UPLOAD
  =================================================== */

  function abrirSeletorArquivo() {
    inputArquivoRef.current?.click();
  }

  async function enviarArquivo(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const arquivo =
      event.target.files?.[0];

    if (!arquivo) {
      return;
    }

    try {
      setEnviandoArquivo(true);
      setErro('');
      setSucesso('');

      const tiposPermitidos = [
        'application/pdf',
        'image/jpeg',
        'image/png',
      ];

      if (
        !tiposPermitidos.includes(
          arquivo.type
        )
      ) {
        setErro(
          'Envie um arquivo PDF, JPG ou PNG.'
        );
        return;
      }

      if (
        arquivo.size >
        10 * 1024 * 1024
      ) {
        setErro(
          'O arquivo deve ter no máximo 10 MB.'
        );
        return;
      }

      const {
        data: userData,
      } =
        await supabase.auth.getUser();

      if (!userData.user) {
        throw new Error(
          'Usuário não autenticado.'
        );
      }

      const extensao =
        arquivo.name
          .split('.')
          .pop()
          ?.toLowerCase() ||
        'arquivo';

      const nomeSeguro =
        arquivo.name
          .replace(
            /[^a-zA-Z0-9._-]/g,
            '_'
          )
          .replace(
            /_+/g,
            '_'
          );

      const caminho =
        `${userData.user.id}/` +
        `${Date.now()}-${nomeSeguro}`;

      const {
        error: uploadError,
      } =
        await supabase.storage
          .from(
            'financeiro-documentos'
          )
          .upload(
            caminho,
            arquivo,
            {
              contentType:
                arquivo.type,
              upsert: false,
            }
          );

      if (uploadError) {
        throw uploadError;
      }

      const {
        error: bancoError,
      } = await supabase
        .from(
          'financeiro_documentos'
        )
        .insert({
          lancamento_id:
            null,

          nome_arquivo:
            arquivo.name,

          caminho_arquivo:
            caminho,

          tipo_arquivo:
            arquivo.type,

          tamanho_arquivo:
            arquivo.size,

          ocr_processado:
            false,

          enviado_por:
            userData.user.id,
        });

      if (bancoError) {
        /*
         * Se falhar ao registrar no banco,
         * removemos o arquivo do Storage
         * para não deixar arquivo órfão.
         */

        await supabase.storage
          .from(
            'financeiro-documentos'
          )
          .remove([
            caminho,
          ]);

        throw bancoError;
      }

      setSucesso(
        'Documento enviado com sucesso. Ele está pronto para a leitura automática.'
      );

      setModalDocumentos(true);

      await carregarFinanceiro(
        true
      );
    } catch (error: any) {
      console.error(
        'Erro no upload:',
        error
      );

      setErro(
        error?.message ||
          'Não foi possível enviar o documento.'
      );
    } finally {
      setEnviandoArquivo(
        false
      );

      event.target.value =
        '';
    }
  }

  /* ===================================================
     EXCLUIR DOCUMENTO
  =================================================== */

  async function excluirDocumento(
    documento: DocumentoFinanceiro
  ) {
    const confirmado =
      typeof globalThis !==
        'undefined' &&
      typeof (
        globalThis as any
      ).confirm ===
        'function'
        ? (
            globalThis as any
          ).confirm(
            `Excluir "${documento.nome_arquivo}"?`
          )
        : true;

    if (!confirmado) {
      return;
    }

    try {
      setErro('');

      const {
        error: storageError,
      } =
        await supabase.storage
          .from(
            'financeiro-documentos'
          )
          .remove([
            documento
              .caminho_arquivo,
          ]);

      if (storageError) {
        throw storageError;
      }

      const {
        error: bancoError,
      } = await supabase
        .from(
          'financeiro_documentos'
        )
        .delete()
        .eq(
          'id',
          documento.id
        );

      if (bancoError) {
        throw bancoError;
      }

      setSucesso(
        'Documento excluído.'
      );

      await carregarFinanceiro(
        true
      );
    } catch (error: any) {
      setErro(
        error?.message ||
          'Não foi possível excluir o documento.'
      );
    }
  }

  /* ===================================================
     FORMATAÇÃO
  =================================================== */

  function formatarMoeda(
    numero: number
  ) {
    return Number(
      numero || 0
    ).toLocaleString(
      'pt-BR',
      {
        style: 'currency',
        currency: 'BRL',
      }
    );
  }

  function formatarData(
    data: string | null
  ) {
    if (!data) {
      return '-';
    }

    const partes =
      data.split('-');

    if (
      partes.length !== 3
    ) {
      return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  function nomeStatus(
    valorStatus:
      StatusFinanceiro
  ) {
    switch (valorStatus) {
      case 'pago':
        return 'Pago';

      case 'recebido':
        return 'Recebido';

      case 'atrasado':
        return 'Atrasado';

      case 'cancelado':
        return 'Cancelado';

      default:
        return 'Pendente';
    }
  }

  const categorias =
    tipo === 'receita'
      ? CATEGORIAS_RECEITA
      : CATEGORIAS_DESPESA;

  /* ===================================================
     TELA
  =================================================== */

  return (
    <WebLayout
      sidebar={
        <WebSidebar
          active="financeiro"
        />
      }
      scroll
    >
      <View
        style={[
          styles.page,
          isMobile &&
            styles.pageMobile,
        ]}
      >
        {/* INPUT REAL DO NAVEGADOR */}

        <input
          ref={inputArquivoRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          onChange={enviarArquivo}
          style={{
            display: 'none',
          }}
        />

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
              styles.headerText
            }
          >
            <Text
              style={
                styles.pageTitle
              }
            >
              Financeiro
            </Text>

            <Text
              style={
                styles.pageSubtitle
              }
            >
              Controle receitas,
              despesas e documentos
              do condomínio.
            </Text>
          </View>

          <View
            style={[
              styles.headerActions,
              isMobile &&
                styles.headerActionsMobile,
            ]}
          >
            <TouchableOpacity
              style={
                styles.secondaryButton
              }
              onPress={() =>
                carregarFinanceiro(
                  true
                )
              }
              disabled={
                atualizando
              }
            >
              <RefreshCw
                size={18}
                color={
                  colors.primary
                }
              />

              <Text
                style={
                  styles.secondaryButtonText
                }
              >
                {atualizando
                  ? 'Atualizando...'
                  : 'Atualizar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.uploadButton
              }
              onPress={
                abrirSeletorArquivo
              }
              disabled={
                enviandoArquivo
              }
            >
              {enviandoArquivo ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Upload
                  size={18}
                  color="#FFFFFF"
                />
              )}

              <Text
                style={
                  styles.primaryButtonText
                }
              >
                {enviandoArquivo
                  ? 'Enviando...'
                  : 'Enviar documento'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.primaryButton
              }
              onPress={
                abrirNovoRegistro
              }
            >
              <Plus
                size={18}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Novo lançamento
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* MENSAGENS */}

        {!!erro && (
          <View
            style={
              styles.errorBox
            }
          >
            <Text
              style={
                styles.errorText
              }
            >
              {erro}
            </Text>
          </View>
        )}

        {!!sucesso && (
          <View
            style={
              styles.successBox
            }
          >
            <Text
              style={
                styles.successText
              }
            >
              {sucesso}
            </Text>
          </View>
        )}

        {/* RESUMO */}

        <View
          style={[
            styles.summaryGrid,
            isMobile &&
              styles.summaryGridMobile,
          ]}
        >
          <ResumoCard
            icon={
              <ArrowUpCircle
                size={24}
                color="#16A34A"
              />
            }
            titulo="Receitas"
            valor={formatarMoeda(
              resumo.receitas
            )}
          />

          <ResumoCard
            icon={
              <ArrowDownCircle
                size={24}
                color="#DC2626"
              />
            }
            titulo="Despesas"
            valor={formatarMoeda(
              resumo.despesas
            )}
          />

          <ResumoCard
            icon={
              <Wallet
                size={24}
                color={
                  colors.primary
                }
              />
            }
            titulo="Saldo"
            valor={formatarMoeda(
              resumo.saldo
            )}
          />

          <ResumoCard
            icon={
              <DollarSign
                size={24}
                color="#F59E0B"
              />
            }
            titulo="Pendentes"
            valor={formatarMoeda(
              resumo.pendentes
            )}
          />
        </View>

        {/* DOCUMENTOS */}

        <View
          style={
            styles.documentsCard
          }
        >
          <View
            style={[
              styles.sectionHeader,
              isMobile &&
                styles.sectionHeaderMobile,
            ]}
          >
            <View>
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Documentos financeiros
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                PDFs e imagens
                enviados para leitura
                automática.
              </Text>
            </View>

            <TouchableOpacity
              style={
                styles.viewDocumentsButton
              }
              onPress={() =>
                setModalDocumentos(
                  true
                )
              }
            >
              <FileText
                size={17}
                color={
                  colors.primary
                }
              />

              <Text
                style={
                  styles.viewDocumentsText
                }
              >
                Ver documentos (
                {documentos.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* LANÇAMENTOS */}

        <View
          style={
            styles.tableCard
          }
        >
          <View
            style={
              styles.sectionHeader
            }
          >
            <View>
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Lançamentos
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Receitas e despesas
                cadastradas.
              </Text>
            </View>
          </View>

          {carregando ? (
            <View
              style={
                styles.loadingArea
              }
            >
              <ActivityIndicator
                size="large"
                color={
                  colors.primary
                }
              />

              <Text
                style={
                  styles.loadingText
                }
              >
                Carregando...
              </Text>
            </View>
          ) : registros.length ===
            0 ? (
            <View
              style={
                styles.emptyArea
              }
            >
              <DollarSign
                size={36}
                color={
                  colors.textLight
                }
              />

              <Text
                style={
                  styles.emptyTitle
                }
              >
                Nenhum lançamento
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Cadastre a primeira
                receita ou despesa.
              </Text>
            </View>
          ) : (
            <View
              style={
                styles.list
              }
            >
              {registros.map(
                (item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.listItem,
                      isMobile &&
                        styles.listItemMobile,
                    ]}
                    onPress={() =>
                      abrirEdicao(
                        item
                      )
                    }
                  >
                    <View
                      style={
                        styles.typeIcon
                      }
                    >
                      {item.tipo ===
                      'receita' ? (
                        <ArrowUpCircle
                          size={22}
                          color="#16A34A"
                        />
                      ) : (
                        <ArrowDownCircle
                          size={22}
                          color="#DC2626"
                        />
                      )}
                    </View>

                    <View
                      style={
                        styles.itemInfo
                      }
                    >
                      <Text
                        style={
                          styles.itemTitle
                        }
                      >
                        {
                          item.descricao
                        }
                      </Text>

                      <Text
                        style={
                          styles.itemSubtitle
                        }
                      >
                        {
                          item.categoria
                        }
                        {' • '}
                        {formatarData(
                          item.data_vencimento
                        )}
                      </Text>

                      {item.fornecedor && (
                        <Text
                          style={
                            styles.itemSmall
                          }
                        >
                          {
                            item.fornecedor
                          }
                        </Text>
                      )}
                    </View>

                    <View
                      style={
                        styles.itemRight
                      }
                    >
                      <Text
                        style={[
                          styles.itemValue,
                          item.tipo ===
                          'receita'
                            ? styles.receitaText
                            : styles.despesaText,
                        ]}
                      >
                        {formatarMoeda(
                          item.valor
                        )}
                      </Text>

                      <Text
                        style={
                          styles.statusText
                        }
                      >
                        {nomeStatus(
                          item.status
                        )}
                      </Text>
                    </View>

                    <Edit3
                      size={17}
                      color={
                        colors.textSecondary
                      }
                    />
                  </TouchableOpacity>
                )
              )}
            </View>
          )}
        </View>

        {/* MODAL LANÇAMENTO */}

        <Modal
          visible={modalVisivel}
          transparent
          animationType="fade"
          onRequestClose={
            fecharModal
          }
        >
          <View
            style={
              styles.modalOverlay
            }
          >
            <View
              style={[
                styles.modalCard,
                isMobile &&
                  styles.modalCardMobile,
              ]}
            >
              <View
                style={
                  styles.modalHeader
                }
              >
                <View>
                  <Text
                    style={
                      styles.modalTitle
                    }
                  >
                    {registroEditando
                      ? 'Editar lançamento'
                      : 'Novo lançamento'}
                  </Text>

                  <Text
                    style={
                      styles.modalSubtitle
                    }
                  >
                    Preencha os dados
                    financeiros.
                  </Text>
                </View>

                <Pressable
                  onPress={
                    fecharModal
                  }
                >
                  <X
                    size={23}
                    color={
                      colors.textSecondary
                    }
                  />
                </Pressable>
              </View>

              <ScrollView
                style={
                  styles.modalScroll
                }
                showsVerticalScrollIndicator={
                  false
                }
              >
                <Text
                  style={
                    styles.label
                  }
                >
                  Tipo
                </Text>

                <View
                  style={
                    styles.optionRow
                  }
                >
                  <OptionButton
                    ativo={
                      tipo ===
                      'despesa'
                    }
                    texto="Despesa"
                    onPress={() => {
                      setTipo(
                        'despesa'
                      );
                      setCategoria(
                        'Outros'
                      );

                      if (
                        status ===
                        'recebido'
                      ) {
                        setStatus(
                          'pendente'
                        );
                      }
                    }}
                  />

                  <OptionButton
                    ativo={
                      tipo ===
                      'receita'
                    }
                    texto="Receita"
                    onPress={() => {
                      setTipo(
                        'receita'
                      );
                      setCategoria(
                        'Outros'
                      );

                      if (
                        status ===
                        'pago'
                      ) {
                        setStatus(
                          'pendente'
                        );
                      }
                    }}
                  />
                </View>

                <Campo
                  label="Descrição"
                  value={descricao}
                  onChangeText={
                    setDescricao
                  }
                  placeholder="Ex.: Conta de energia"
                />

                <Text
                  style={
                    styles.label
                  }
                >
                  Categoria
                </Text>

                <View
                  style={
                    styles.categories
                  }
                >
                  {categorias.map(
                    (item) => (
                      <TouchableOpacity
                        key={item}
                        style={[
                          styles.categoryButton,
                          categoria ===
                            item &&
                            styles.categoryButtonActive,
                        ]}
                        onPress={() =>
                          setCategoria(
                            item
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.categoryText,
                            categoria ===
                              item &&
                              styles.categoryTextActive,
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>

                <Campo
                  label="Fornecedor / empresa"
                  value={fornecedor}
                  onChangeText={
                    setFornecedor
                  }
                  placeholder="Ex.: Neoenergia"
                />

                <Campo
                  label="Número do documento"
                  value={
                    numeroDocumento
                  }
                  onChangeText={
                    setNumeroDocumento
                  }
                  placeholder="Nota, boleto, fatura..."
                />

                <Campo
                  label="Valor"
                  value={valor}
                  onChangeText={
                    setValor
                  }
                  placeholder="0,00"
                />

                <Campo
                  label="Data do lançamento"
                  value={
                    dataLancamento
                  }
                  onChangeText={
                    setDataLancamento
                  }
                  placeholder="AAAA-MM-DD"
                />

                <Campo
                  label="Vencimento"
                  value={
                    dataVencimento
                  }
                  onChangeText={
                    setDataVencimento
                  }
                  placeholder="AAAA-MM-DD"
                />

                <Text
                  style={
                    styles.label
                  }
                >
                  Status
                </Text>

                <View
                  style={
                    styles.categories
                  }
                >
                  <OptionButton
                    ativo={
                      status ===
                      'pendente'
                    }
                    texto="Pendente"
                    onPress={() =>
                      setStatus(
                        'pendente'
                      )
                    }
                  />

                  {tipo ===
                    'despesa' && (
                    <OptionButton
                      ativo={
                        status ===
                        'pago'
                      }
                      texto="Pago"
                      onPress={() =>
                        setStatus(
                          'pago'
                        )
                      }
                    />
                  )}

                  {tipo ===
                    'receita' && (
                    <OptionButton
                      ativo={
                        status ===
                        'recebido'
                      }
                      texto="Recebido"
                      onPress={() =>
                        setStatus(
                          'recebido'
                        )
                      }
                    />
                  )}

                  <OptionButton
                    ativo={
                      status ===
                      'atrasado'
                    }
                    texto="Atrasado"
                    onPress={() =>
                      setStatus(
                        'atrasado'
                      )
                    }
                  />

                  <OptionButton
                    ativo={
                      status ===
                      'cancelado'
                    }
                    texto="Cancelado"
                    onPress={() =>
                      setStatus(
                        'cancelado'
                      )
                    }
                  />
                </View>

                {(status ===
                  'pago' ||
                  status ===
                    'recebido') && (
                  <Campo
                    label={
                      tipo ===
                      'receita'
                        ? 'Data do recebimento'
                        : 'Data do pagamento'
                    }
                    value={
                      dataPagamento
                    }
                    onChangeText={
                      setDataPagamento
                    }
                    placeholder="AAAA-MM-DD"
                  />
                )}

                <Campo
                  label="Forma de pagamento"
                  value={
                    formaPagamento
                  }
                  onChangeText={
                    setFormaPagamento
                  }
                  placeholder="PIX, boleto, transferência..."
                />

                <Campo
                  label="Observação"
                  value={observacao}
                  onChangeText={
                    setObservacao
                  }
                  placeholder="Observações..."
                  multiline
                />

                <Text
                  style={
                    styles.label
                  }
                >
                  Visibilidade
                </Text>

                <TouchableOpacity
                  style={
                    styles.visibilityRow
                  }
                  onPress={() =>
                    setVisivelMoradores(
                      !visivelMoradores
                    )
                  }
                >
                  <View
                    style={[
                      styles.checkbox,
                      visivelMoradores &&
                        styles.checkboxActive,
                    ]}
                  >
                    {visivelMoradores && (
                      <CheckCircle2
                        size={16}
                        color="#FFFFFF"
                      />
                    )}
                  </View>

                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text
                      style={
                        styles.visibilityTitle
                      }
                    >
                      Visível para
                      moradores
                    </Text>

                    <Text
                      style={
                        styles.visibilityText
                      }
                    >
                      Permitir que este
                      lançamento apareça
                      na área financeira
                      do morador.
                    </Text>
                  </View>
                </TouchableOpacity>
              </ScrollView>

              <View
                style={[
                  styles.modalFooter,
                  isMobile &&
                    styles.modalFooterMobile,
                ]}
              >
                {registroEditando && (
                  <TouchableOpacity
                    style={
                      styles.deleteButton
                    }
                    onPress={
                      excluirRegistro
                    }
                    disabled={
                      excluindo
                    }
                  >
                    <Trash2
                      size={18}
                      color="#FFFFFF"
                    />

                    <Text
                      style={
                        styles.deleteButtonText
                      }
                    >
                      {excluindo
                        ? 'Excluindo...'
                        : 'Excluir'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={
                    styles.cancelButton
                  }
                  onPress={
                    fecharModal
                  }
                >
                  <Text
                    style={
                      styles.cancelButtonText
                    }
                  >
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.saveButton
                  }
                  onPress={
                    salvarRegistro
                  }
                  disabled={
                    salvando
                  }
                >
                  {salvando ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  ) : (
                    <Text
                      style={
                        styles.saveButtonText
                      }
                    >
                      Salvar
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL DOCUMENTOS */}

        <Modal
          visible={
            modalDocumentos
          }
          transparent
          animationType="fade"
          onRequestClose={() =>
            setModalDocumentos(
              false
            )
          }
        >
          <View
            style={
              styles.modalOverlay
            }
          >
            <View
              style={[
                styles.documentsModal,
                isMobile &&
                  styles.modalCardMobile,
              ]}
            >
              <View
                style={
                  styles.modalHeader
                }
              >
                <View>
                  <Text
                    style={
                      styles.modalTitle
                    }
                  >
                    Documentos
                  </Text>

                  <Text
                    style={
                      styles.modalSubtitle
                    }
                  >
                    Arquivos enviados
                    para o Financeiro.
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setModalDocumentos(
                      false
                    )
                  }
                >
                  <X
                    size={23}
                    color={
                      colors.textSecondary
                    }
                  />
                </Pressable>
              </View>

              <ScrollView>
                {documentos.length ===
                0 ? (
                  <View
                    style={
                      styles.emptyArea
                    }
                  >
                    <FileText
                      size={35}
                      color={
                        colors.textLight
                      }
                    />

                    <Text
                      style={
                        styles.emptyTitle
                      }
                    >
                      Nenhum documento
                    </Text>
                  </View>
                ) : (
                  documentos.map(
                    (documento) => (
                      <View
                        key={
                          documento.id
                        }
                        style={
                          styles.documentItem
                        }
                      >
                        <View
                          style={
                            styles.documentIcon
                          }
                        >
                          <FileText
                            size={21}
                            color={
                              colors.primary
                            }
                          />
                        </View>

                        <View
                          style={
                            styles.documentInfo
                          }
                        >
                          <Text
                            style={
                              styles.documentName
                            }
                            numberOfLines={
                              1
                            }
                          >
                            {
                              documento.nome_arquivo
                            }
                          </Text>

                          <Text
                            style={
                              styles.documentStatus
                            }
                          >
                            {documento.ocr_processado
                              ? 'Leitura concluída'
                              : 'Aguardando leitura automática'}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={
                            styles.documentDelete
                          }
                          onPress={() =>
                            excluirDocumento(
                              documento
                            )
                          }
                        >
                          <Trash2
                            size={18}
                            color={
                              colors.danger
                            }
                          />
                        </TouchableOpacity>
                      </View>
                    )
                  )
                )}
              </ScrollView>

              <TouchableOpacity
                style={
                  styles.primaryButton
                }
                onPress={
                  abrirSeletorArquivo
                }
              >
                <Upload
                  size={18}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Enviar outro
                  documento
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </WebLayout>
  );
}

/* =====================================================
   COMPONENTES AUXILIARES
===================================================== */

function ResumoCard({
  icon,
  titulo,
  valor,
}: {
  icon: React.ReactNode;
  titulo: string;
  valor: string;
}) {
  return (
    <View
      style={
        styles.summaryCard
      }
    >
      <View
        style={
          styles.summaryIcon
        }
      >
        {icon}
      </View>

      <View>
        <Text
          style={
            styles.summaryLabel
          }
        >
          {titulo}
        </Text>

        <Text
          style={
            styles.summaryValue
          }
        >
          {valor}
        </Text>
      </View>
    </View>
  );
}

function OptionButton({
  ativo,
  texto,
  onPress,
}: {
  ativo: boolean;
  texto: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.optionButton,
        ativo &&
          styles.optionButtonActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.optionText,
          ativo &&
            styles.optionTextActive,
        ]}
      >
        {texto}
      </Text>
    </TouchableOpacity>
  );
}

function Campo({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (
    value: string
  ) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
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
        {label}
      </Text>

      <TextInput
        style={[
          styles.input,
          multiline &&
            styles.textarea,
        ]}
        value={value}
        onChangeText={
          onChangeText
        }
        placeholder={
          placeholder
        }
        placeholderTextColor={
          colors.textLight
        }
        multiline={multiline}
      />
    </View>
  );
}

/* =====================================================
   ESTILOS
===================================================== */

const styles =
  StyleSheet.create({
    page: {
      width: '100%',
      paddingBottom: 40,
    },

    pageMobile: {
      paddingBottom: 50,
    },

    header: {
      width: '100%',

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',

      marginBottom: 24,
    },

    headerMobile: {
      flexDirection: 'column',
      alignItems: 'stretch',
    },

    headerText: {
      flex: 1,
      minWidth: 0,
    },

    pageTitle: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '800',
      color: colors.text,
    },

    pageSubtitle: {
      marginTop: 5,
      fontSize: 14,
      lineHeight: 21,
      color:
        colors.textSecondary,
    },

    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',

      marginLeft: 20,
      gap: 9,
    },

    headerActionsMobile: {
      width: '100%',
      marginLeft: 0,
      marginTop: 16,

      flexDirection: 'column',
      alignItems: 'stretch',
    },

    primaryButton: {
      minHeight: 44,

      paddingHorizontal: 16,
      paddingVertical: 10,

      borderRadius: 9,

      backgroundColor:
        colors.primary,

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',

      gap: 7,
    },

    uploadButton: {
      minHeight: 44,

      paddingHorizontal: 16,
      paddingVertical: 10,

      borderRadius: 9,

      backgroundColor:
        colors.primaryDark,

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',

      gap: 7,
    },

    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },

    secondaryButton: {
      minHeight: 44,

      paddingHorizontal: 14,
      paddingVertical: 10,

      borderWidth: 1,
      borderColor:
        colors.border,

      borderRadius: 9,

      backgroundColor:
        colors.surface,

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',

      gap: 7,
    },

    secondaryButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '700',
    },

    errorBox: {
      width: '100%',
      padding: 13,
      borderRadius: 9,
      marginBottom: 16,

      backgroundColor:
        colors.dangerLight,

      borderWidth: 1,
      borderColor:
        colors.danger,
    },

    errorText: {
      color: colors.danger,
      fontSize: 14,
    },

    successBox: {
      width: '100%',
      padding: 13,
      borderRadius: 9,
      marginBottom: 16,

      backgroundColor:
        '#ECFDF5',

      borderWidth: 1,
      borderColor:
        '#86EFAC',
    },

    successText: {
      color: '#166534',
      fontSize: 14,
    },

    summaryGrid: {
      width: '100%',

      flexDirection: 'row',
      flexWrap: 'wrap',

      gap: 12,

      marginBottom: 20,
    },

    summaryGridMobile: {
      flexDirection: 'column',
    },

    summaryCard: {
      flexGrow: 1,
      flexBasis: 210,

      minWidth: 190,

      backgroundColor:
        colors.surface,

      borderWidth: 1,
      borderColor:
        colors.border,

      borderRadius: 14,

      padding: 18,

      flexDirection: 'row',
      alignItems: 'center',

      gap: 13,
    },

    summaryIcon: {
      width: 46,
      height: 46,

      borderRadius: 12,

      backgroundColor:
        colors.primaryLight,

      alignItems: 'center',
      justifyContent:
        'center',
    },

    summaryLabel: {
      fontSize: 13,
      color:
        colors.textSecondary,
    },

    summaryValue: {
      marginTop: 3,

      fontSize: 20,
      fontWeight: '800',

      color: colors.text,
    },

    documentsCard: {
      width: '100%',

      backgroundColor:
        colors.surface,

      borderWidth: 1,
      borderColor:
        colors.border,

      borderRadius: 14,

      padding: 18,

      marginBottom: 18,
    },

    tableCard: {
      width: '100%',

      backgroundColor:
        colors.surface,

      borderWidth: 1,
      borderColor:
        colors.border,

      borderRadius: 14,

      padding: 18,
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',

      gap: 15,
    },

    sectionHeaderMobile: {
      flexDirection: 'column',
      alignItems: 'stretch',
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
    },

    sectionSubtitle: {
      marginTop: 4,
      fontSize: 13,
      lineHeight: 19,
      color:
        colors.textSecondary,
    },

    viewDocumentsButton: {
      minHeight: 40,

      paddingHorizontal: 13,

      borderRadius: 8,

      borderWidth: 1,
      borderColor:
        colors.border,

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',

      gap: 6,
    },

    viewDocumentsText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '700',
    },

    loadingArea: {
      minHeight: 220,

      alignItems: 'center',
      justifyContent:
        'center',
    },

    loadingText: {
      marginTop: 10,
      color:
        colors.textSecondary,
    },

    emptyArea: {
      minHeight: 180,

      alignItems: 'center',
      justifyContent:
        'center',

      padding: 20,
    },

    emptyTitle: {
      marginTop: 9,
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },

    emptyText: {
      marginTop: 5,
      fontSize: 13,
      color:
        colors.textSecondary,
      textAlign: 'center',
    },

    list: {
      width: '100%',
      marginTop: 15,
    },

    listItem: {
      width: '100%',

      minHeight: 72,

      flexDirection: 'row',
      alignItems: 'center',

      paddingVertical: 12,

      borderBottomWidth: 1,
      borderBottomColor:
        colors.border,

      gap: 11,
    },

    listItemMobile: {
      alignItems: 'flex-start',
    },

    typeIcon: {
      width: 40,
      height: 40,

      borderRadius: 10,

      backgroundColor:
        colors.background,

      alignItems: 'center',
      justifyContent:
        'center',

      flexShrink: 0,
    },

    itemInfo: {
      flex: 1,
      minWidth: 0,
    },

    itemTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },

    itemSubtitle: {
      marginTop: 3,
      fontSize: 12,
      color:
        colors.textSecondary,
    },

    itemSmall: {
      marginTop: 3,
      fontSize: 12,
      color:
        colors.textLight,
    },

    itemRight: {
      alignItems: 'flex-end',
      flexShrink: 0,
    },

    itemValue: {
      fontSize: 14,
      fontWeight: '800',
    },

    receitaText: {
      color: '#16A34A',
    },

    despesaText: {
      color: '#DC2626',
    },

    statusText: {
      marginTop: 4,
      fontSize: 11,
      color:
        colors.textSecondary,
    },

    modalOverlay: {
      flex: 1,

      backgroundColor:
        'rgba(15, 23, 42, 0.55)',

      alignItems: 'center',
      justifyContent:
        'center',

      padding: 20,
    },

    modalCard: {
      width: '100%',
      maxWidth: 650,
      maxHeight: '92%',

      backgroundColor:
        colors.surface,

      borderRadius: 16,

      padding: 20,
    },

    modalCardMobile: {
      maxWidth: '100%',
      maxHeight: '95%',
      padding: 16,
    },

    modalHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent:
        'space-between',

      marginBottom: 17,
    },

    modalTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
    },

    modalSubtitle: {
      marginTop: 3,
      fontSize: 13,
      color:
        colors.textSecondary,
    },

    modalScroll: {
      width: '100%',
    },

    field: {
      marginBottom: 14,
    },

    label: {
      fontSize: 13,
      fontWeight: '700',

      color: colors.text,

      marginBottom: 7,
      marginTop: 5,
    },

    input: {
      width: '100%',
      minHeight: 44,

      borderWidth: 1,
      borderColor:
        colors.border,

      borderRadius: 9,

      backgroundColor:
        colors.background,

      paddingHorizontal: 12,
      paddingVertical: 10,

      fontSize: 14,
      color: colors.text,
    },

    textarea: {
      minHeight: 90,
      textAlignVertical: 'top',
    },

    optionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',

      gap: 8,

      marginBottom: 14,
    },

    optionButton: {
      minHeight: 38,

      paddingHorizontal: 13,
      paddingVertical: 8,

      borderWidth: 1,
      borderColor:
        colors.border,

      borderRadius: 8,

      backgroundColor:
        colors.surface,

      alignItems: 'center',
      justifyContent:
        'center',
    },

    optionButtonActive: {
      borderColor:
        colors.primary,

      backgroundColor:
        colors.primaryLight,
    },

    optionText: {
      fontSize: 13,
      color:
        colors.textSecondary,
    },

    optionTextActive: {
      color: colors.primary,
      fontWeight: '700',
    },

    categories: {
      flexDirection: 'row',
      flexWrap: 'wrap',

      gap: 7,

      marginBottom: 14,
    },

    categoryButton: {
      paddingHorizontal: 11,
      paddingVertical: 8,

      borderRadius: 8,

      borderWidth: 1,
      borderColor:
        colors.border,
    },

    categoryButtonActive: {
      borderColor:
        colors.primary,

      backgroundColor:
        colors.primaryLight,
    },

    categoryText: {
      fontSize: 12,
      color:
        colors.textSecondary,
    },

    categoryTextActive: {
      color: colors.primary,
      fontWeight: '700',
    },

    visibilityRow: {
      width: '100%',

      flexDirection: 'row',
      alignItems: 'flex-start',

      gap: 10,

      padding: 13,

      borderRadius: 9,

      borderWidth: 1,
      borderColor:
        colors.border,

      marginBottom: 15,
    },

    checkbox: {
      width: 22,
      height: 22,

      borderRadius: 5,

      borderWidth: 1,
      borderColor:
        colors.border,

      alignItems: 'center',
      justifyContent:
        'center',
    },

    checkboxActive: {
      backgroundColor:
        colors.primary,

      borderColor:
        colors.primary,
    },

    visibilityTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },

    visibilityText: {
      marginTop: 2,
      fontSize: 12,
      lineHeight: 17,
      color:
        colors.textSecondary,
    },

    modalFooter: {
      width: '100%',

      flexDirection: 'row',
      justifyContent:
        'flex-end',

      gap: 8,

      paddingTop: 15,

      borderTopWidth: 1,
      borderTopColor:
        colors.border,
    },

    modalFooterMobile: {
      flexWrap: 'wrap',
    },

    saveButton: {
      minHeight: 42,

      paddingHorizontal: 20,

      borderRadius: 8,

      backgroundColor:
        colors.primary,

      alignItems: 'center',
      justifyContent:
        'center',
    },

    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },

    cancelButton: {
      minHeight: 42,

      paddingHorizontal: 18,

      borderRadius: 8,

      borderWidth: 1,
      borderColor:
        colors.border,

      alignItems: 'center',
      justifyContent:
        'center',
    },

    cancelButtonText: {
      color:
        colors.textSecondary,

      fontWeight: '700',
    },

    deleteButton: {
      minHeight: 42,

      paddingHorizontal: 16,

      borderRadius: 8,

      backgroundColor:
        colors.danger,

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',

      gap: 6,

      marginRight: 'auto',
    },

    deleteButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },

    documentsModal: {
      width: '100%',
      maxWidth: 620,
      maxHeight: '85%',

      backgroundColor:
        colors.surface,

      borderRadius: 16,

      padding: 20,
    },

    documentItem: {
      width: '100%',

      minHeight: 65,

      flexDirection: 'row',
      alignItems: 'center',

      paddingVertical: 11,

      borderBottomWidth: 1,
      borderBottomColor:
        colors.border,

      gap: 10,
    },

    documentIcon: {
      width: 40,
      height: 40,

      borderRadius: 9,

      backgroundColor:
        colors.primaryLight,

      alignItems: 'center',
      justifyContent:
        'center',
    },

    documentInfo: {
      flex: 1,
      minWidth: 0,
    },

    documentName: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },

    documentStatus: {
      marginTop: 3,
      fontSize: 11,
      color:
        colors.textSecondary,
    },

    documentDelete: {
      width: 36,
      height: 36,

      alignItems: 'center',
      justifyContent:
        'center',
    },
  });