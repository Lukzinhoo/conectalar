import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function resposta(
  body: Record<string, unknown>,
  status = 200
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, '');
}

function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return resposta(
      {
        sucesso: false,
        mensagem: 'Método não permitido.',
      },
      405
    );
  }

  try {
    // =====================================================
    // CONFIGURAÇÃO
    // =====================================================

    const supabaseUrl =
      Deno.env.get('SUPABASE_URL');

    const serviceRoleKey =
      Deno.env.get(
        'SUPABASE_SERVICE_ROLE_KEY'
      );

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(
        'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente.'
      );

      return resposta(
        {
          sucesso: false,
          mensagem:
            'Configuração do servidor incompleta.',
        },
        500
      );
    }

    // =====================================================
    // TOKEN
    // =====================================================

    const authorization =
      req.headers.get('Authorization');

    if (!authorization) {
      return resposta(
        {
          sucesso: false,
          mensagem:
            'Usuário não autenticado.',
        },
        401
      );
    }

    const token =
      authorization.replace(
        /^Bearer\s+/i,
        ''
      );

    if (!token) {
      return resposta(
        {
          sucesso: false,
          mensagem:
            'Token de acesso não encontrado.',
        },
        401
      );
    }

    // =====================================================
    // CLIENTE ADMINISTRATIVO
    // =====================================================

    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // =====================================================
    // USUÁRIO LOGADO
    // =====================================================

    const {
      data: usuarioData,
      error: erroUsuario,
    } =
      await adminClient.auth.getUser(
        token
      );

    const usuarioAtual =
      usuarioData?.user;

    if (
      erroUsuario ||
      !usuarioAtual
    ) {
      console.error(
        'Erro ao identificar usuário:',
        erroUsuario
      );

      return resposta(
        {
          sucesso: false,
          mensagem:
            'Sessão inválida ou expirada.',
        },
        401
      );
    }

    // =====================================================
    // PERFIL ADMINISTRATIVO
    // =====================================================

    const {
      data: perfilAdmin,
      error: erroPerfil,
    } = await adminClient
      .schema('public')
      .from('perfis')
      .select(
        'id, nome, tipo, ativo'
      )
      .eq('id', usuarioAtual.id)
      .maybeSingle();

    if (erroPerfil) {
      console.error(
        'Erro ao consultar perfil administrativo:',
        erroPerfil
      );

      return resposta(
        {
          sucesso: false,
          mensagem:
            'Não foi possível verificar o perfil administrativo.',
        },
        500
      );
    }

    if (!perfilAdmin) {
      return resposta(
        {
          sucesso: false,
          mensagem:
            'Perfil administrativo não encontrado.',
        },
        403
      );
    }

    // =====================================================
    // PERMISSÃO
    // =====================================================

    const cargosPermitidos = [
      'admin',
      'sindico',
      'subsindico',
    ];

    if (
      !perfilAdmin.ativo ||
      !cargosPermitidos.includes(
        perfilAdmin.tipo
      )
    ) {
      return resposta(
        {
          sucesso: false,
          mensagem:
            'Você não possui permissão para cadastrar moradores.',
        },
        403
      );
    }

    // =====================================================
    // RECEBER DADOS
    // =====================================================

    let body: Record<
      string,
      unknown
    >;

    try {
      body = await req.json();
    } catch {
      return resposta(
        {
          sucesso: false,
          mensagem:
            'Os dados enviados para o cadastro são inválidos.',
        },
        400
      );
    }

    const nome = String(
      body.nome ?? ''
    ).trim();

    const cpf = somenteNumeros(
      String(body.cpf ?? '')
    );

    // E-MAIL PESSOAL / CONTATO
    const email = String(
      body.email ?? ''
    )
      .trim()
      .toLowerCase();

    const telefone = String(
      body.telefone ?? ''
    ).trim();

    const tipoResidencia =
      String(
        body.tipoResidencia ?? ''
      ).trim();

    const apartamento =
      String(
        body.apartamento ?? ''
      ).trim();

    const bloco = String(
      body.bloco ?? ''
    ).trim();

    const casa = String(
      body.casa ?? ''
    ).trim();

    const quadra = String(
      body.quadra ?? ''
    ).trim();

    const senha = String(
      body.senha ?? ''
    );

    // =====================================================
    // VALIDAÇÕES
    // =====================================================

    if (!nome) {
      return resposta(
        {
          sucesso: false,
          mensagem:
            'Informe o nome do morador.',
        },
        400
      );
    }

    if (cpf.length !== 11) {
      return resposta(
        {
          sucesso: false,
          mensagem:
            'Informe um CPF com 11 números.',
        },
        400
      );
    }

    if (!email) {
      return resposta(
        {
          sucesso: false,
          mensagem:
            'Informe o e-mail do morador.',
        },
        400
      );
    }

    if (!emailValido(email)) {
      return resposta(
        {
          sucesso: false,
          mensagem:
            'Informe um e-mail válido.',
        },
        400
      );
    }

    if (senha.length < 6) {
      return resposta(
        {
          sucesso: false,
          mensagem:
            'A senha deve possuir pelo menos 6 caracteres.',
        },
        400
      );
    }

    const tiposPermitidos = [
      'apartamento_bloco',
      'casa',
      'casa_quadra',
    ];

    if (
      !tiposPermitidos.includes(
        tipoResidencia
      )
    ) {
      return resposta(
        {
          sucesso: false,
          mensagem:
            'Selecione um tipo de residência válido.',
        },
        400
      );
    }

    if (
      tipoResidencia ===
        'apartamento_bloco' &&
      (!apartamento || !bloco)
    ) {
      return resposta(
        {
          sucesso: false,
          mensagem:
            'Informe o apartamento e o bloco.',
        },
        400
      );
    }

    if (
      tipoResidencia === 'casa' &&
      !casa
    ) {
      return resposta(
        {
          sucesso: false,
          mensagem:
            'Informe a casa.',
        },
        400
      );
    }

    if (
      tipoResidencia ===
        'casa_quadra' &&
      (!casa || !quadra)
    ) {
      return resposta(
        {
          sucesso: false,
          mensagem:
            'Informe a casa e a quadra.',
        },
        400
      );
    }

    // =====================================================
    // VERIFICAR CPF EXISTENTE
    // =====================================================

    const {
      data: cpfExistente,
      error: erroCpf,
    } = await adminClient
      .schema('public')
      .from('perfis')
      .select('id')
      .eq('cpf', cpf)
      .maybeSingle();

    if (erroCpf) {
      console.error(
        'Erro ao verificar CPF:',
        erroCpf
      );

      return resposta(
        {
          sucesso: false,
          mensagem:
            'Não foi possível verificar o CPF informado.',
        },
        500
      );
    }

    if (cpfExistente) {
      return resposta(
        {
          sucesso: false,
          mensagem:
            'Já existe um morador cadastrado com este CPF.',
        },
        409
      );
    }

    // =====================================================
    // EMAIL INTERNO DO LOGIN
    // =====================================================
    //
    // IMPORTANTE:
    // O morador continua entrando com CPF + senha.
    //
    // O Supabase Auth utiliza este endereço interno.
    // O e-mail pessoal informado no formulário será
    // armazenado somente na tabela perfis.
    // =====================================================

    const emailInterno =
      `${cpf}@morador.conectalar.local`;

    // =====================================================
    // CRIAR USUÁRIO NO AUTH
    // =====================================================

    const {
      data: novoUsuario,
      error: erroCriacao,
    } =
      await adminClient
        .auth.admin.createUser({
          email: emailInterno,
          password: senha,
          email_confirm: true,

          user_metadata: {
            nome,
            cpf,

            // E-mail pessoal
            email_contato: email,

            telefone:
              telefone || null,

            casa:
              tipoResidencia ===
                'casa' ||
              tipoResidencia ===
                'casa_quadra'
                ? casa
                : null,

            quadra:
              tipoResidencia ===
              'casa_quadra'
                ? quadra
                : null,
          },
        });

    if (
      erroCriacao ||
      !novoUsuario?.user
    ) {
      console.error(
        'Erro ao criar usuário:',
        erroCriacao
      );

      return resposta(
        {
          sucesso: false,
          mensagem:
            erroCriacao?.message ||
            'Não foi possível criar a conta do morador.',
        },
        400
      );
    }

    const usuarioId =
      novoUsuario.user.id;

    console.log(
      'Usuário criado:',
      usuarioId
    );

    // =====================================================
    // AGUARDAR O TRIGGER CRIAR O PERFIL
    // =====================================================

    let perfilMoradorEncontrado =
      false;

    for (
      let tentativa = 0;
      tentativa < 5;
      tentativa++
    ) {
      const {
        data: perfilMorador,
        error: erroBuscaPerfil,
      } = await adminClient
        .schema('public')
        .from('perfis')
        .select('id')
        .eq('id', usuarioId)
        .maybeSingle();

      if (erroBuscaPerfil) {
        console.error(
          'Erro ao procurar perfil:',
          erroBuscaPerfil
        );
      }

      if (perfilMorador) {
        perfilMoradorEncontrado =
          true;

        break;
      }

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            200
          )
      );
    }

    // =====================================================
    // TRIGGER NÃO CRIOU PERFIL
    // =====================================================

    if (!perfilMoradorEncontrado) {
      console.error(
        'Trigger não criou o perfil:',
        usuarioId
      );

      await adminClient
        .auth.admin.deleteUser(
          usuarioId
        );

      return resposta(
        {
          sucesso: false,
          mensagem:
            'A conta foi criada, mas o perfil do morador não foi gerado. O cadastro foi cancelado.',
        },
        500
      );
    }

    // =====================================================
    // ATUALIZAR PERFIL COMPLETO
    // =====================================================

    const {
      data: perfilAtualizado,
      error: erroAtualizacao,
    } = await adminClient
      .schema('public')
      .from('perfis')
      .update({
        nome,

        cpf,

        // NOVO CAMPO
        email,

        telefone:
          telefone || null,

        tipo_residencia:
          tipoResidencia,

        apartamento:
          tipoResidencia ===
          'apartamento_bloco'
            ? apartamento
            : null,

        bloco:
          tipoResidencia ===
          'apartamento_bloco'
            ? bloco
            : null,

        casa:
          tipoResidencia ===
            'casa' ||
          tipoResidencia ===
            'casa_quadra'
            ? casa
            : null,

        quadra:
          tipoResidencia ===
          'casa_quadra'
            ? quadra
            : null,

        tipo: 'morador',

        ativo: true,

        atualizado_em:
          new Date().toISOString(),
      })
      .eq('id', usuarioId)
      .select(
        `
          id,
          nome,
          cpf,
          email,
          telefone,
          tipo_residencia,
          apartamento,
          bloco,
          casa,
          quadra,
          tipo,
          ativo
        `
      )
      .maybeSingle();

    // =====================================================
    // ERRO AO SALVAR PERFIL
    // =====================================================

    if (
      erroAtualizacao ||
      !perfilAtualizado
    ) {
      console.error(
        'Erro ao atualizar perfil:',
        erroAtualizacao
      );

      // Remove o usuário do Auth para não deixar
      // cadastro incompleto.
      await adminClient
        .auth.admin.deleteUser(
          usuarioId
        );

      return resposta(
        {
          sucesso: false,
          mensagem:
            erroAtualizacao?.message ||
            'Não foi possível salvar os dados do morador.',
        },
        500
      );
    }

    // =====================================================
    // SUCESSO
    // =====================================================

    console.log(
      'Morador cadastrado com sucesso:',
      usuarioId
    );

    return resposta({
      sucesso: true,

      mensagem:
        'Morador cadastrado com sucesso.',

      morador: {
        id:
          perfilAtualizado.id,

        nome:
          perfilAtualizado.nome,

        cpf:
          perfilAtualizado.cpf,

        email:
          perfilAtualizado.email,

        telefone:
          perfilAtualizado.telefone,

        tipoResidencia:
          perfilAtualizado.tipo_residencia,

        apartamento:
          perfilAtualizado.apartamento,

        bloco:
          perfilAtualizado.bloco,

        casa:
          perfilAtualizado.casa,

        quadra:
          perfilAtualizado.quadra,
      },
    });
  } catch (error) {
    console.error(
      'Erro inesperado na cadastrar-morador:',
      error
    );

    const mensagem =
      error instanceof Error
        ? error.message
        : 'Erro desconhecido.';

    return resposta(
      {
        sucesso: false,
        mensagem:
          `Ocorreu um erro inesperado ao cadastrar o morador: ${mensagem}`,
      },
      500
    );
  }
});