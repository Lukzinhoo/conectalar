import { supabase } from './supabase';

export type TipoUsuario =
  | 'morador'
  | 'sindico'
  | 'subsindico'
  | 'admin';

export interface PerfilUsuario {
  id: string;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  casa: string | null;
  quadra: string | null;
  tipo: TipoUsuario;
  ativo: boolean;
}

export interface ResultadoLogin {
  sucesso: boolean;
  mensagem: string;
  perfil?: PerfilUsuario;
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, '');
}

async function buscarPerfil(
  usuarioId: string
): Promise<{
  perfil: PerfilUsuario | null;
  erro: string | null;
}> {
  try {
    const {
      data: perfil,
      error: perfilError,
    } = await supabase
      .from('perfis')
      .select(`
        id,
        nome,
        cpf,
        telefone,
        casa,
        quadra,
        tipo,
        ativo
      `)
      .eq('id', usuarioId)
      .maybeSingle();

    if (perfilError) {
      console.error(
        'ERRO AO BUSCAR PERFIL:',
        perfilError
      );

      return {
        perfil: null,
        erro: perfilError.message,
      };
    }

    if (!perfil) {
      return {
        perfil: null,
        erro: 'Perfil não encontrado.',
      };
    }

    return {
      perfil: perfil as PerfilUsuario,
      erro: null,
    };
  } catch (error) {
    console.error(
      'ERRO INESPERADO AO BUSCAR PERFIL:',
      error
    );

    return {
      perfil: null,
      erro: 'Erro ao buscar perfil.',
    };
  }
}

// =====================================================
// LOGIN ADMINISTRATIVO
// =====================================================

export async function loginAdministrativo(
  email: string,
  senha: string
): Promise<ResultadoLogin> {
  try {
    const emailLimpo =
      email.trim().toLowerCase();

    if (!emailLimpo || !senha) {
      return {
        sucesso: false,
        mensagem:
          'Informe o e-mail e a senha.',
      };
    }

    console.log(
      'Iniciando login administrativo...'
    );

    const {
      data: authData,
      error: authError,
    } =
      await supabase.auth.signInWithPassword({
        email: emailLimpo,
        password: senha,
      });

    if (authError) {
      console.log(
        'ERRO DE AUTENTICAÇÃO:',
        authError
      );

      return {
        sucesso: false,
        mensagem:
          'E-mail ou senha incorretos.',
      };
    }

    if (!authData.user) {
      return {
        sucesso: false,
        mensagem:
          'Não foi possível identificar o usuário.',
      };
    }

    const {
      perfil,
      erro,
    } = await buscarPerfil(
      authData.user.id
    );

    if (erro || !perfil) {
      await supabase.auth.signOut();

      return {
        sucesso: false,
        mensagem:
          'O usuário foi autenticado, mas o perfil não foi encontrado.',
      };
    }

    if (!perfil.ativo) {
      await supabase.auth.signOut();

      return {
        sucesso: false,
        mensagem:
          'Este usuário está desativado. Procure a administração.',
      };
    }

    const cargosAdministrativos:
      TipoUsuario[] = [
        'admin',
        'sindico',
        'subsindico',
      ];

    if (
      !cargosAdministrativos.includes(
        perfil.tipo
      )
    ) {
      await supabase.auth.signOut();

      return {
        sucesso: false,
        mensagem:
          'Este usuário não possui acesso à área administrativa.',
      };
    }

    console.log(
      'ACESSO ADMINISTRATIVO AUTORIZADO'
    );

    console.log(
      'TIPO:',
      perfil.tipo
    );

    console.log(
      'NOME:',
      perfil.nome
    );

    return {
      sucesso: true,
      mensagem:
        'Login realizado com sucesso.',
      perfil,
    };
  } catch (error) {
    console.error(
      'ERRO INESPERADO NO LOGIN ADMINISTRATIVO:',
      error
    );

    try {
      await supabase.auth.signOut();
    } catch {}

    return {
      sucesso: false,
      mensagem:
        'Não foi possível realizar o login. Tente novamente.',
    };
  }
}

// =====================================================
// LOGIN DO MORADOR POR CPF
// =====================================================

export async function loginMorador(
  cpf: string,
  senha: string
): Promise<ResultadoLogin> {
  try {
    const cpfLimpo =
      somenteNumeros(cpf);

    // =================================================
    // VALIDAR CPF
    // =================================================

    if (!cpfLimpo) {
      return {
        sucesso: false,
        mensagem: 'Informe o CPF.',
      };
    }

    if (cpfLimpo.length !== 11) {
      return {
        sucesso: false,
        mensagem:
          'Informe um CPF válido com 11 números.',
      };
    }

    if (!senha) {
      return {
        sucesso: false,
        mensagem: 'Informe a senha.',
      };
    }

    // =================================================
    // GERAR O MESMO E-MAIL INTERNO DO CADASTRO
    // =================================================

    const emailInterno =
      `${cpfLimpo}@morador.conectalar.local`;

    console.log(
      'Iniciando login do morador...'
    );

    // =================================================
    // AUTENTICAR
    // =================================================

    const {
      data: authData,
      error: authError,
    } =
      await supabase.auth.signInWithPassword({
        email: emailInterno,
        password: senha,
      });

    if (authError) {
      console.log(
        'ERRO LOGIN MORADOR:',
        authError
      );

      return {
        sucesso: false,
        mensagem:
          'CPF ou senha incorretos.',
      };
    }

    if (!authData.user) {
      return {
        sucesso: false,
        mensagem:
          'Não foi possível identificar o morador.',
      };
    }

    // =================================================
    // BUSCAR PERFIL
    // =================================================

    const {
      perfil,
      erro,
    } = await buscarPerfil(
      authData.user.id
    );

    if (erro || !perfil) {
      await supabase.auth.signOut();

      return {
        sucesso: false,
        mensagem:
          'A conta foi autenticada, mas o perfil do morador não foi encontrado.',
      };
    }

    // =================================================
    // VERIFICAR SE É MORADOR
    // =================================================

    if (perfil.tipo !== 'morador') {
      await supabase.auth.signOut();

      return {
        sucesso: false,
        mensagem:
          'Esta conta não possui acesso à área do morador.',
      };
    }

    // =================================================
    // VERIFICAR CONTA ATIVA
    // =================================================

    if (!perfil.ativo) {
      await supabase.auth.signOut();

      return {
        sucesso: false,
        mensagem:
          'Este usuário está desativado. Procure a administração.',
      };
    }

    // =================================================
    // CONFIRMAR CPF DO PERFIL
    // =================================================

    const cpfPerfil =
      somenteNumeros(
        perfil.cpf ?? ''
      );

    if (
      cpfPerfil &&
      cpfPerfil !== cpfLimpo
    ) {
      await supabase.auth.signOut();

      return {
        sucesso: false,
        mensagem:
          'Os dados desta conta não correspondem ao CPF informado.',
      };
    }

    console.log(
      'LOGIN DO MORADOR REALIZADO'
    );

    console.log(
      'MORADOR:',
      perfil.nome
    );

    return {
      sucesso: true,
      mensagem:
        'Login realizado com sucesso.',
      perfil,
    };
  } catch (error) {
    console.error(
      'ERRO INESPERADO NO LOGIN DO MORADOR:',
      error
    );

    try {
      await supabase.auth.signOut();
    } catch {}

    return {
      sucesso: false,
      mensagem:
        'Não foi possível realizar o login. Tente novamente.',
    };
  }
}

// =====================================================
// OBTER PERFIL ATUAL
// =====================================================

export async function obterPerfilAtual(): Promise<PerfilUsuario | null> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.log(
        'ERRO AO OBTER USUÁRIO ATUAL:',
        userError
      );

      return null;
    }

    if (!user) {
      return null;
    }

    const {
      perfil,
      erro,
    } = await buscarPerfil(
      user.id
    );

    if (erro || !perfil) {
      return null;
    }

    return perfil;
  } catch (error) {
    console.error(
      'ERRO INESPERADO AO OBTER PERFIL:',
      error
    );

    return null;
  }
}

// =====================================================
// SAIR
// =====================================================

export async function sair(): Promise<boolean> {
  try {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        'ERRO AO SAIR:',
        error
      );

      return false;
    }

    return true;
  } catch (error) {
    console.error(
      'ERRO INESPERADO AO SAIR:',
      error
    );

    return false;
  }
}