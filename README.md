# 🏢 Conectalar

O **Conectalar** é uma plataforma de gestão condominial desenvolvida para facilitar a comunicação entre moradores e administração, centralizando serviços importantes do condomínio em um único sistema.

O projeto possui uma área para **moradores** e um **painel administrativo**, com recursos para reservas, comunicados, ocorrências, chats, regras, horários, notificações e gestão de moradores.

---

## 🚀 Funcionalidades

### 👤 Área do Morador

- 🔐 Login de morador
- 🏠 Página inicial personalizada
- 📅 Reservas de espaços do condomínio
- 📢 Visualização de comunicados
- 🚨 Registro e acompanhamento de ocorrências
- 💬 Chat com a administração
- 👥 Chat geral
- 📖 Regras do condomínio
- 🕐 Horários de serviços
- 🔔 Notificações
- 👤 Perfil do morador

### 👨‍💼 Painel Administrativo

- 📊 Dashboard administrativo
- 👥 Gerenciamento de moradores
- ➕ Cadastro de novos moradores
- ✏️ Edição de moradores
- 🗑️ Exclusão de moradores
- 📅 Gerenciamento de reservas
- 📢 Gerenciamento de comunicados
- 🚨 Gerenciamento de ocorrências
- 💬 Chat com moradores
- 👥 Chat geral
- 📖 Gerenciamento de regras
- 🕐 Gerenciamento de horários
- 🔔 Notificações
- 💰 Área financeira

---

## 📅 Sistema de Reservas

O sistema permite administrar espaços compartilhados do condomínio.

A administração pode:

- Criar espaços para reserva
- Definir capacidade
- Definir horários disponíveis
- Visualizar solicitações
- Aprovar reservas
- Recusar reservas
- Cancelar ou excluir reservas

O morador pode consultar os espaços e solicitar uma reserva para uma data disponível.

---

## 🚨 Ocorrências

Os moradores podem registrar ocorrências diretamente pelo sistema.

A administração consegue visualizar e acompanhar as solicitações, permitindo centralizar a comunicação e facilitar o gerenciamento dos problemas do condomínio.

---

## 💬 Comunicação

O Conectalar possui diferentes formas de comunicação entre moradores e administração.

### Chat privado

Permite comunicação direta entre o morador e a administração.

### Chat geral

Espaço de comunicação coletiva disponível dentro da plataforma.

### Comunicados

A administração pode publicar informações importantes para os moradores, utilizando categorias e níveis de prioridade.

---

## 🔔 Notificações

O sistema possui uma área de notificações para manter os usuários informados sobre atividades importantes da plataforma.

Entre elas estão informações relacionadas a:

- Reservas
- Comunicados
- Ocorrências
- Mensagens
- Atualizações do sistema

---

## 💰 Financeiro

O painel administrativo possui uma área destinada ao gerenciamento financeiro do condomínio.

Ela permite trabalhar com informações como:

- Receitas
- Despesas
- Categorias
- Valores
- Datas de vencimento
- Datas de pagamento
- Status de pagamento
- Observações

---

## 🛠️ Tecnologias utilizadas

O projeto utiliza tecnologias modernas para desenvolvimento web e mobile:

- **React Native**
- **Expo**
- **TypeScript**
- **React Navigation**
- **Supabase**
- **PostgreSQL**
- **Supabase Authentication**
- **Supabase Edge Functions**
- **Vercel**
- **Git / GitHub**

---

## 🗄️ Backend

O backend do projeto utiliza o **Supabase**, responsável por recursos como:

- Banco de dados PostgreSQL
- Autenticação
- Perfis de usuários
- Políticas de segurança RLS
- Edge Functions
- Reservas
- Comunicados
- Ocorrências
- Chats
- Regras
- Horários
- Notificações
- Dados financeiros

---

## 🔐 Tipos de usuário

O sistema possui diferentes níveis de acesso:

```text
morador
sindico
subsindico
admin
```

As funcionalidades apresentadas são controladas de acordo com o tipo de usuário autenticado.

---

## 📂 Estrutura do projeto

```text
conectalar/
│
├── assets/
├── src/
│   ├── components/
│   ├── navigation/
│   ├── screens/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── morador/
│   │   └── web/
│   │       ├── adm/
│   │       └── morador/
│   ├── services/
│   └── theme/
│
├── supabase/
│   └── functions/
│
├── App.tsx
├── package.json
└── vercel.json
```

---

## 💻 Executando o projeto

Clone o repositório:

```bash
git clone https://github.com/Lukzinhoo/conectalar.git
```

Entre na pasta:

```bash
cd conectalar
```

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env.local` e configure as variáveis públicas necessárias para conexão com o Supabase:

```env
EXPO_PUBLIC_SUPABASE_URL=SEU_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=SUA_SUPABASE_ANON_KEY
```

> Nunca envie chaves administrativas ou `SUPABASE_SERVICE_ROLE_KEY` para o repositório.

---

## 🌐 Executando a versão Web

```bash
npx expo start --web
```

---

## 📱 Executando com Expo Go

```bash
npx expo start --go
```

Depois, utilize o aplicativo **Expo Go** para ler o QR Code exibido no terminal ou navegador.

---

## 🏗️ Gerando a versão Web

```bash
npx expo export -p web
```

O projeto exportado será gerado na pasta:

```text
dist/
```

---

## ☁️ Deploy

A versão web pode ser publicada utilizando a **Vercel**.

Para realizar um deploy de produção através da CLI:

```bash
vercel --prod
```

As variáveis de ambiente do Supabase também devem ser configuradas no ambiente de deploy.

---

## 🔒 Segurança

O projeto utiliza recursos de segurança do Supabase, incluindo:

- Autenticação de usuários
- Row Level Security (RLS)
- Controle de acesso por tipo de usuário
- Políticas de acesso ao banco de dados
- Variáveis de ambiente

Arquivos contendo credenciais privadas não devem ser enviados ao GitHub.

---

## 🎯 Objetivo

O objetivo do **Conectalar** é tornar a administração condominial mais organizada e acessível, oferecendo uma plataforma centralizada para moradores e administradores.

A proposta é reduzir processos manuais e melhorar a comunicação, permitindo que atividades comuns do condomínio sejam realizadas de maneira digital.

---

## 👨‍💻 Autor

Desenvolvido por **Lukzinhoo**.

GitHub: `@Lukzinhoo`

---

## 📌 Status do projeto

🚧 **Em desenvolvimento**

Novas funcionalidades e melhorias continuam sendo implementadas.
