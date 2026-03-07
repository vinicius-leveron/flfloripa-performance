# Deploy no Supabase — FLFloripa Performance

## Pré-requisitos

- Conta no [Supabase](https://supabase.com)
- Conta no [Google Cloud Console](https://console.cloud.google.com) (para Google OAuth)

## Passo a passo

### 1. Criar projeto no Supabase

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Clique em "New Project"
3. Escolha organização, nome e senha do banco
4. Região: escolha a mais próxima (ex: São Paulo)
5. Aguarde o projeto ser criado

### 2. Configurar banco de dados

1. No dashboard do Supabase, vá em **SQL Editor**
2. Cole o conteúdo de `supabase/schema.sql` e execute
3. Cole o conteúdo de `supabase/seed.sql` e execute

### 3. Obter connection string

1. Vá em **Settings > Database**
2. Copie a **Connection string** (URI format)
3. No `.env` do projeto, substitua `DATABASE_URL` pela connection string:

```
DATABASE_URL="postgresql://postgres:[SUA-SENHA]@db.[SEU-PROJETO].supabase.co:5432/postgres"
```

### 4. Configurar Google OAuth

1. Acesse [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Crie um novo projeto (ou use existente)
3. Vá em **APIs & Services > Credentials**
4. Clique em **Create Credentials > OAuth 2.0 Client ID**
5. Tipo: **Web application**
6. Nome: `FLFloripa Performance`
7. **Authorized redirect URIs**: adicione:
   - `https://seu-dominio.com/api/auth/callback/google` (produção)
   - `http://localhost:3000/api/auth/callback/google` (desenvolvimento)
8. Copie o **Client ID** e **Client Secret**

9. No `.env`:
```
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret
```

### 5. Configurar domínio permitido

O login Google está restrito a emails `@logosofia.org.br`. Para alterar:
- Edite `src/lib/auth.ts`, no callback `signIn`, altere o domínio em `endsWith()`.

### 6. Variáveis de ambiente para produção

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://seu-dominio.com"
NEXTAUTH_SECRET="gere-uma-string-segura-com-openssl-rand-base64-32"
GOOGLE_CLIENT_ID="seu-client-id"
GOOGLE_CLIENT_SECRET="seu-client-secret"
```

Para gerar o `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 7. Deploy

O projeto pode ser deployed em:
- **Vercel**: `vercel deploy`
- **Railway**: push para o repo conectado
- **Docker**: build e deploy com Docker

### Notas

- O schema SQL inclui **Row Level Security (RLS)** ativo em todas as tabelas
- As policies permitem leitura para todos os autenticados e escrita para ADMIN/EDITOR
- Se usar Prisma em vez do SQL direto, rode `npx prisma db push` com a connection string do Supabase
