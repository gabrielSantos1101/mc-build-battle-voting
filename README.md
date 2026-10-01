# 🎃 Minecraft Build Battle: Halloween Edition - Sistema de Votação para Live

Sistema completo de votação em tempo real para competições de construção no Minecraft, desenhado com estética temática **Minecraft x Halloween & Horror** (Warden/Sculk, Pale Garden/Creaking, Wither, Ender Dragon e Jack-o'-Lantern).

---

## 🚀 Como Rodar o Projeto

1. **Instalar dependências (caso não tenha instalado):**
   ```bash
   npm install
   ```

2. **Iniciar o Servidor de Desenvolvimento:**
   ```bash
   npm run dev
   ```
   O site estará rodando em `http://localhost:3000`.

3. **Gerar Build de Produção (para deploy na Vercel / Netlify):**
   ```bash
   npm run build
   ```

---

## 🌐 Rotas da Aplicação

| Rota | Descrição | Uso |
| :--- | :--- | :--- |
| `/` | **Página de Votação Pública** | Mobile-First com QR Code na live. O chat vota (1 voto por dispositivo), visualiza skins e fotos em zoom. |
| `/overlay/top3` | **Overlay Top 3 (OBS)** | Widget com fundo 100% transparente para colocar no cantinho da transmissão com ranking e barras animadas ao vivo. |
| `/overlay/cena` | **Cena OBS (Pódio 1920x1080)** | Cena completa com revelação cinematográfica, partículas de fogo e pódio dos campeões. |
| `/admin` | **Painel do Streamer** | Protegido por PIN (padrão `1234`). Cadastra participantes com foto e nick, abre/pausa votação e reseta rodadas. |

---

## 🗄️ Como Configurar o Supabase

1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. Vá no **SQL Editor** do Supabase e execute o conteúdo do arquivo [`supabase/schema.sql`](./supabase/schema.sql).
3. No arquivo `.env` (ou `.env.local`), preencha com as credenciais do seu projeto:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
   VITE_ADMIN_PIN=1234
   ```

---

## 🎬 Como Adicionar no OBS Studio

### 1. Widget Top 3 no cantinho da Live:
* No OBS, adicione uma nova fonte: **Navegador (Browser Source)**.
* **URL:** `http://localhost:3000/overlay/top3` (ou a URL do seu site publicado).
* **Largura (Width):** `350` | **Altura (Height):** `400`.
* Marque a opção: *"Desativar quando não estiver visível"*.

### 2. Cena Cheia de Pódio e Revelação:
* No OBS, crie uma cena e adicione uma fonte **Navegador (Browser Source)**.
* **URL:** `http://localhost:3000/overlay/cena`.
* **Largura (Width):** `1920` | **Altura (Height):** `1080`.
