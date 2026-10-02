import { createClient } from "@supabase/supabase-js";

function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

Deno.serve(async (req: Request) => {
  try {
    // ============================================
    // CORS
    // ============================================

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods":
        "POST, OPTIONS",
    };

    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          sucesso: false,
          mensagem: "Método não permitido.",
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // ============================================
    // VARIÁVEIS DO SUPABASE
    // ============================================

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL");

    const serviceRoleKey =
      Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY"
      );

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      console.error(
        "Variáveis do Supabase não encontradas."
      );

      return new Response(
        JSON.stringify({
          sucesso: false,
          mensagem:
            "Erro de configuração do servidor.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // ============================================
    // CLIENTE ADMINISTRATIVO
    // ============================================

    const supabaseAdmin =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

    // ============================================
    // RECEBER CPF
    // ============================================

    const body = await req.json();

    const cpf = somenteNumeros(
      String(body?.cpf ?? "")
    );

    if (!cpf) {
      return new Response(
        JSON.stringify({
          sucesso: false,
          mensagem: "Informe o CPF.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (cpf.length !== 11) {
      return new Response(
        JSON.stringify({
          sucesso: false,
          mensagem: "CPF inválido.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // ============================================
    // LOCALIZAR MORADOR
    // ============================================

    const {
      data: perfil,
      error: perfilError,
    } = await supabaseAdmin
      .from("perfis")
      .select(`
        id,
        tipo,
        ativo
      `)
      .eq("cpf", cpf)
      .eq("tipo", "morador")
      .maybeSingle();

    if (perfilError) {
      console.error(
        "Erro ao localizar morador:",
        perfilError
      );

      return new Response(
        JSON.stringify({
          sucesso: false,
          mensagem:
            "Não foi possível localizar o morador.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!perfil) {
      return new Response(
        JSON.stringify({
          sucesso: false,
          mensagem:
            "Morador não encontrado.",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!perfil.ativo) {
      return new Response(
        JSON.stringify({
          sucesso: false,
          mensagem:
            "Este usuário está desativado. Procure a administração.",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // ============================================
    // RESULTADO
    // ============================================

    return new Response(
      JSON.stringify({
        sucesso: true,
        usuario_id: perfil.id,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error(
      "Erro inesperado:",
      error
    );

    return new Response(
      JSON.stringify({
        sucesso: false,
        mensagem:
          "Não foi possível realizar a operação.",
      }),
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      }
    );
  }
});