# Minecraft Build Battle Vote

Sistema de votação para Build Battle de Minecraft com anti-fraude por IP/device e agendamento de votação.

## Funcionalidades

### Votação Pública (`/`)
- **Anti-fraude duplo**: 1 voto por device_id + 1 voto por IP por rodada
- **Detecção de IP client-side**: APIs gratuitas (ipify, ipapi.co, ipwho.is) com geo (país/região/cidade)
- **JWT stateless**: Token no localStorage, sem dependência de session/server state
- **Timer regressivo preciso**: Baseado em timestamp `ends_at` do banco (zero drift)
- **Estados de votação**:
  - `not_started` - Mostra contagem regressiva para início
  - `active` - Timer regressivo para término + botões de voto
  - `ended` - Status "Encerrada", sem votação
- **Interface temática Minecraft** com molduras ilustradas (Jack-o-Lantern, Warden, Pale Garden, Wither, Ender Dragon)
- **Zoom nas construções** ao clicar na imagem
- **Resultados ao vivo** (opcional, controlado pelo admin)

### Painel Admin (`/admin`)
- **Supabase Auth nativo**: Email/password, JWT seguro, refresh token automático
- **Credenciais padrão**: `admin@email.com` / `GiodLgQjH7w` (altere no primeiro login)
- **Botão "Alterar Senha"** no header
- **Gerenciamento de rodadas**:
  - Criar rodadas com título
  - Definir `starts_at` (início da votação) e `ends_at` (fim da votação)
  - Status: draft → active → paused/finished
  - Toggle "Placar ao vivo" / "Modo Suspense"
  - Zerar votos
- **Gerenciamento de competidores**:
  - Adicionar com nick (skin automática via mc-heads.net), nome real opcional, tema, imagem (upload Supabase Storage ou URL)
  - Editar/remover competidores
- **Exportar relatório** (botão `Exportar` no header, com dropdown):
  - **PDF**: abre um relatório formatado numa aba nova (pódio top 3 com foto da build + avatar, ranking completo, mapa de geografia dos votos, registro voto a voto) e dispara a impressão — escolha "Salvar como PDF"
  - **CSV**: planilha para Excel com 5 seções (resumo, ranking, origem por localidade, origem por país, votos detalhados)
- **Links rápidos** para overlays OBS (Top 3, Cena Pódio)

### Overlays OBS
- `/overlay/top3` - Pódio top 3 para stream
- `/overlay/cena` - Cena completa do pódio

## Stack
- **React 19** + **TypeScript**
- **TanStack Router** (file-based routing)
- **Vite** + **Tailwind CSS**
- **Framer Motion** (animações)
- **Supabase** (Postgres + Auth + Storage + Realtime)
- **Lucide React** (ícones)

## Setup

### 1. Variáveis de ambiente
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

### 2. Banco de dados (Supabase SQL Editor)
Execute `supabase/schema.sql` - cria:
- Tabelas: `rounds`, `competitors`, `votes`
- Constraints únicas: `(round_id, device_id)` e `(round_id, ip)`
- Colunas de IP/geo: `ip`, `country`, `region`, `city`
- Timestamps: `starts_at`, `ends_at`
- RLS policies (acesso público via anon key)
- Storage bucket `builds` (público)
- Realtime habilitado nas 3 tabelas

### 2.1 Migrations incrementais
Para bancos já existentes, rode os arquivos de `supabase/migrations/` em ordem:
- `20260101000000_add_competitor_player_name.sql` - adiciona `competitors.player_name` (text, nullable, só identificação/relatório)
- `20260101010000_add_competitor_skin_url.sql` - adiciona `competitors.skin_url` (estava no `schema.sql` mas faltava em bancos já criados)

### 3. Usuário Admin
No Dashboard Supabase: **Authentication → Users → Add user**
- Email: `admin@email.com`
- Password: `GiodLgQjH7w`
- Auto confirm: ✓

### 4. Desenvolvimento
```bash
npm install
npm run dev
```

### 5. Build
```bash
npm run build
```

## Estrutura do Projeto
```
app/
├── lib/
│   ├── supabase/               # Cliente Supabase + tipos + helpers
│   ├── export/                 # Relatório: modelo, CSV e HTML de impressão
│   ├── auth/  ip/  vote/
├── routes/
│   ├── index.tsx               # Página de votação pública
│   ├── admin.tsx               # Painel admin
│   ├── overlay/top3.tsx        # Overlay OBS Top 3
│   └── overlay/cena.tsx        # Overlay OBS Cena Pódio
├── components/
│   ├── custom/                 # MinecraftButton, PlayerHead, VoteBar, ExportMenu...
│   ├── ui/                     # Componentes UI (Button, Popover, Calendar, Field)
│   └── DateTimePicker.tsx      # Seletor data/hora para admin
└── styles.css                  # Estilos globais + fontes Press Start 2P
supabase/
├── schema.sql                  # Schema completo do banco
├── migrations/                 # Migrations incrementais
└── functions/get-skin/         # Edge function (Mojang API)
```

## Fluxo de Votação

1. **Admin cria rodada** → define `starts_at` e `ends_at`
2. **Antes de `starts_at`**: Público vê competidores + "Inicia em Xh Ym Zs" (sem botão votar)
3. **Entre `starts_at` e `ends_at`**: Votação aberta → timer "Termina em HH:MM:SS" + botões ativos
4. **Após `ends_at`**: Status "Encerrada" → sem votação, resultados finais
5. **Anti-fraude**: Device_id (localStorage) + IP (API) → constraints únicas no banco garantem integridade

## Deploy
- **Vercel/Netlify**: Conecte o repo, adicione env vars, deploy automático
- **Supabase**: Já configurado via Dashboard

## Licença
MIT