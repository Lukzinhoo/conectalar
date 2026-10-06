# 🏢 ConectaLar

### Sistema de Gestão e Comunicação para Condomínios

O **ConectaLar** é uma plataforma desenvolvida para facilitar a administração de condomínios e melhorar a comunicação entre moradores, síndicos e administradores.

O sistema possui uma aplicação responsiva para moradores e administradores, permitindo centralizar reservas, comunicados, ocorrências, conversas, notificações e informações administrativas em um único ambiente.

---

## 🚀 Funcionalidades

### 👨‍💼 Área Administrativa

- 📊 Dashboard administrativo
- 👥 Cadastro e gerenciamento de moradores
- 🏠 Gerenciamento de residências
- 📅 Gerenciamento de reservas
- 📢 Publicação de comunicados
- 🚨 Gerenciamento de ocorrências
- 💬 Chat privado com moradores
- 🌐 Chat geral do condomínio
- 📖 Gerenciamento das regras do condomínio
- 🕐 Gerenciamento de horários de serviços
- 🔔 Sistema de notificações
- 💰 Controle financeiro

---

### 👤 Área do Morador

- 🏠 Página inicial
- 📅 Solicitação e acompanhamento de reservas
- 📢 Visualização de comunicados
- 🚨 Registro e acompanhamento de ocorrências
- 💬 Chat com a administração
- 🌐 Chat geral
- 📖 Consulta das regras do condomínio
- 🕐 Consulta dos horários de serviços
- 🔔 Notificações
- 👤 Perfil do morador

---

## 📅 Sistema de Reservas

O sistema permite que moradores solicitem reservas de espaços do condomínio.

A administração pode acompanhar e gerenciar as solicitações realizadas.

Também existe controle para evitar reservas conflitantes do mesmo espaço na mesma data.

---

## 💬 Sistema de Chat

O ConectaLar possui dois tipos de comunicação:

### Chat Privado

Permite a comunicação direta entre:

**Morador ↔ Administração**

### Chat Geral

Canal destinado à comunicação coletiva entre os participantes do condomínio.

---

## 🚨 Ocorrências

Os moradores podem registrar ocorrências diretamente pelo sistema.

A administração consegue visualizar e acompanhar as solicitações enviadas.

---

## 📢 Comunicados

A administração pode publicar informações importantes para os moradores através da área de comunicados.

Isso permite centralizar avisos do condomínio dentro da própria plataforma.

---

## 🔔 Notificações

O sistema possui notificações integradas para informar os usuários sobre eventos importantes.

Entre elas:

- Novas reservas
- Comunicados
- Ocorrências
- Mensagens
- Informações do sistema

---

## 💰 Financeiro

A área administrativa possui controle financeiro para organização de:

- Receitas
- Despesas
- Categorias
- Valores
- Vencimentos
- Pagamentos
- Status
- Observações

---

## 🛠️ Tecnologias Utilizadas

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)

---

## 🧱 Arquitetura do Projeto

```text
conectalar
│
├── src
│   ├── components
│   ├── navigation
│   ├── screens
│   │   ├── admin
│   │   ├── auth
│   │   ├── morador
│   │   └── web
│   │       ├── adm
│   │       └── morador
│   │
│   ├── services
│   └── theme
│
├── supabase
│   └── functions
│
└── assets
```

---

## 🗄️ Backend e Banco de Dados

O backend do projeto utiliza **Supabase**.

Ele é responsável por recursos como:

- 🔐 Autenticação
- 👥 Perfis de usuários
- 📅 Reservas
- 💬 Mensagens
- 📢 Comunicados
- 🚨 Ocorrências
- 🔔 Notificações
- 💰 Dados financeiros
- ⚡ Edge Functions

---

## 🔐 Tipos de Usuário

O sistema trabalha com diferentes níveis de acesso:

```text
Morador
Síndico
Subsíndico
Administrador
```

Cada perfil possui acesso às funcionalidades correspondentes à sua função.

---

## 📱 Responsividade

A interface web foi desenvolvida para funcionar em diferentes tamanhos de tela.

O sistema possui adaptação para:

```text
💻 Desktop
📱 Smartphone
📲 Tablet
```

---

## 🌐 Projeto Online

O ConectaLar está publicado na Vercel:

https://conectalar-one.vercel.app

---

## 📌 Status do Projeto

🚧 **Em desenvolvimento**

O projeto continua recebendo melhorias, novas funcionalidades e ajustes de interface.

---

## 🎯 Objetivo

O objetivo do ConectaLar é criar uma solução centralizada para gestão de condomínios, reduzindo processos manuais e facilitando a comunicação entre moradores e administração.

Além disso, o projeto faz parte do meu desenvolvimento profissional e da aplicação prática dos conhecimentos adquiridos durante minha formação em Ciência da Computação.

---

## 👨‍💻 Desenvolvedor

**Luiz Neto**

🎓 Ciência da Computação  
💻 Desenvolvimento de Software

GitHub:  
https://github.com/Lukzinhoo

---

⭐ Se você gostou do projeto, considere deixar uma estrela no repositório.
