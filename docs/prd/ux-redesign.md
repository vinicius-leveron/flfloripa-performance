# PRD: UX/UI Redesign — FLFloripa Performance

**Author:** Uma (@ux-design-expert) — Synkra AIOX
**Version:** 1.0.0
**Date:** 2026-03-07
**Status:** Draft
**Parent PRD:** `docs/prd.md` (Seção 3 — User Interface Design Goals)

---

## 1. Executive Summary

A plataforma FLFloripa Performance está funcional, mas a UI/UX é visualmente pobre e incompleta em todas as áreas. O PRD original especifica uma "interface limpa, moderna e acolhedora" com shadcn/ui, mas a implementação atual usa apenas 5 componentes primitivos hand-rolled. Este PRD define o redesign completo da UI/UX com audit detalhado, design system spec, especificações por tela, e epics de implementação.

### Problemas Críticos Identificados

| Categoria | Severidade | Descrição |
|-----------|-----------|-----------|
| Design System | ALTA | Apenas 5 componentes básicos (Card, Button, Input, Select, Skeleton) |
| Component Library | ALTA | Sem Dialog, Tabs, Badge, Avatar, DropdownMenu, Sheet, Tooltip, Toast |
| Select Component | ALTA | Usa `<select>` nativo do browser — visual inconsistente |
| Mobile | ALTA | Sem menu hamburger, sidebar não responsiva, tabelas quebram |
| Feedback UX | ALTA | Sem toasts, confirmações, loading spinners contextuais |
| Empty States | MÉDIA | Texto simples sem ilustrações ou call-to-action ricos |
| Acessibilidade | MÉDIA | Sem skip links, contraste não verificado, sem labels em ícones |
| Header | MÉDIA | Vazio — sem breadcrumbs, notificações, busca global |
| Sidebar | MÉDIA | Sem logo, sem tooltip quando colapsada, sem mobile drawer |

---

## 2. UX Audit Report

### 2.1 Scoring Methodology

Cada tela é avaliada em 5 dimensões (escala 1-5):

| Dimensão | 1 | 3 | 5 |
|----------|---|---|---|
| **Visual Polish** | Sem styling/bruto | Funcional | Refinado e coeso |
| **Component Completeness** | Faltam componentes essenciais | Parcial | Todos os componentes necessários |
| **Responsividade Mobile** | Quebra no mobile | Parcial | Totalmente responsivo |
| **Acessibilidade (WCAG AA)** | Sem consideração | Parcial | Compliant |
| **UX Patterns** | Sem feedback/estados | Parcial | Loading, empty, error, success |

### 2.2 Audit por Tela

#### 2.2.1 Login/Register (`/login`, `/register`)

| Dimensão | Score | Notas |
|----------|-------|-------|
| Visual Polish | 4 | Gradient blob decorativo, design mais cuidado |
| Component Completeness | 3 | Formulário funcional, Google sign-in |
| Responsividade | 3 | Layout centra mas sem mobile optimization |
| Acessibilidade | 2 | Sem aria-labels nos inputs, contraste não verificado |
| UX Patterns | 2 | Sem feedback de erro inline, sem loading state no botão |
| **Média** | **2.8** | |

**Problemas:**
- Botão de submit não mostra loading state durante autenticação
- Erro de login aparece como texto simples, sem destaque visual
- Sem opção "Esqueci minha senha"
- Google sign-in usa string `'demo'` como fallback sem feedback visual

**Proposta:**
- Adicionar loading spinner no botão durante auth
- Toast de erro com ícone e cor vermelha
- Animação suave de transição entre login/register
- Skeleton do formulário durante hydration

---

#### 2.2.2 Sidebar (`components/sidebar.tsx`)

| Dimensão | Score | Notas |
|----------|-------|-------|
| Visual Polish | 3 | Cor navy #1B2A4A ok, mas sem logo |
| Component Completeness | 2 | Sem tooltip quando colapsada, sem badge de notificações |
| Responsividade | 1 | Sem mobile drawer, invisível em telas pequenas |
| Acessibilidade | 2 | Sem aria-label nos links de navegação, sem skip link |
| UX Patterns | 2 | Sem hover tooltip, sem active indicator animado |
| **Média** | **2.0** | |

**Problemas:**
- Sem logo da Fundação Logosófica no topo
- Quando colapsada (w-16), ícones sem tooltip — usuário não sabe o que cada ícone faz
- Sem mobile drawer (menu hamburger)
- Sem badge de contagem em "Alertas" (unread count)
- Active state é apenas `bg-white/10` — sutil demais
- Botão de colapsar sem aria-label
- Sem separador visual entre seções de navegação

**Proposta:**
```
┌──────────────────────┐
│  [Logo FL]           │
│  FLFloripa           │
│  Performance         │
├──────────────────────┤
│  ■ Dashboard         │
│  ■ Funil             │
│  ■ Leads             │
│  ■ Calendário        │
│  ■ Campanhas         │
├──────────────────────┤
│  ■ Alertas    (3)    │
│  ■ Relatórios        │
├──────────────────────┤
│  ■ Configurações     │
│                      │
│  ┌─────────────────┐ │
│  │ Avatar  Nome    │ │
│  │ Editor  Logout  │ │
│  └─────────────────┘ │
└──────────────────────┘
```

- Logo no topo com fallback para ícone
- Seções separadas por divider
- Badge de notificação em Alertas
- User card na base com Avatar + role badge
- Tooltip ao hover quando colapsada (usando Tooltip component)
- Mobile: Sheet/Drawer abrindo da esquerda com backdrop

---

#### 2.2.3 Header (`components/header.tsx`)

| Dimensão | Score | Notas |
|----------|-------|-------|
| Visual Polish | 1 | Praticamente vazio |
| Component Completeness | 1 | Só nome + botão logout |
| Responsividade | 2 | Simples o suficiente pra não quebrar |
| Acessibilidade | 1 | Sem breadcrumbs, sem landmarks |
| UX Patterns | 1 | Sem notificações, sem busca |
| **Média** | **1.2** | |

**Problemas:**
- Lado esquerdo completamente vazio
- Sem breadcrumbs (usuário não sabe onde está)
- Sem ícone de notificações/alertas
- Sem busca global
- Sem avatar do usuário
- Botão "Sair" sem confirmação

**Proposta:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ [≡]  Dashboard > Visão Geral          🔍 Buscar...  🔔(3)  [AV]▾ │
└─────────────────────────────────────────────────────────────────────┘
```

- Mobile: hamburger menu [≡] para abrir sidebar drawer
- Breadcrumbs dinâmicos baseados na rota
- Busca global (Command+K / Ctrl+K) com CommandDialog
- Ícone de notificações com badge de unread count
- Avatar com DropdownMenu: perfil, configurações, logout

---

#### 2.2.4 Dashboard (`/dashboard`)

| Dimensão | Score | Notas |
|----------|-------|-------|
| Visual Polish | 3 | KPI cards ok, gráficos funcionais |
| Component Completeness | 3 | Tem charts e filtros |
| Responsividade | 2 | Cards empilham, mas gráficos não adaptam |
| Acessibilidade | 2 | Gráficos sem alt text, cores sem contraste verificado |
| UX Patterns | 3 | Skeleton loading, filtros funcionais |
| **Média** | **2.6** | |

**Problemas:**
- KPI cards sem drill-down (PRD pede: "clicar em qualquer métrica leva aos detalhes")
- Comparativo de canais é um gráfico de barras simples, sem interatividade
- Sem quick-actions (PRD pede: "botões de ação rápida para registrar lead, criar entrada no calendário")
- Sem indicador de aderência à cadência
- Gráficos não responsivos em mobile
- Sem tooltips explicativos em métricas (CPM, CTR, etc.)

**Proposta:**
- KPI cards clicáveis com hover effect e drill-down para detalhe do canal
- Quick-action bar: "Registrar Lead", "Criar Conteúdo", "Gerar Relatório"
- Tooltip com explicação em métricas técnicas
- Charts responsivos com scroll horizontal em mobile
- Card de "Aderência à Cadência" com mini-gráfico
- Trend badges animados (slide-up on load)

---

#### 2.2.5 Funil de Conversão (`/funnel`)

| Dimensão | Score | Notas |
|----------|-------|-------|
| Visual Polish | 2 | Barras coloridas simples, sem formato funil |
| Component Completeness | 3 | KPIs, stage details, channel breakdown |
| Responsividade | 2 | Grid de 7 colunas quebra em mobile |
| Acessibilidade | 2 | Cores sem contraste verificado em todos os estágios |
| UX Patterns | 2 | Sem animações, sem drill-down por estágio |
| **Média** | **2.2** | |

**Problemas:**
- PRD pede "formato trapézio/pirâmide invertida" — implementação usa barras retangulares com largura variável
- 7 cards de estágio em grid de 7 colunas — impossível de ler em mobile
- Sem animação de transição entre estágios
- Channel breakdown é tabela simples sem visual diferenciado
- Sem drill-down: clicar em um estágio deveria mostrar os leads naquele estágio

**Proposta:**
```
         ┌─────────────────────────────────────┐
         │         Alcance    125.000          │
         └──────┐                       ┌──────┘
                │    Engajamento  8.200 │
                └───┐               ┌───┘
                    │ Interesse 1.2K│
                    └──┐         ┌──┘
                       │Consid 340│
                       └─┐     ┌─┘
                         │Conv 89│
                         └┐   ┌┘
                          │Ret│
                          └───┘
```

- Formato trapézio real com SVG ou CSS clip-path
- Animação de preenchimento ao carregar
- Hover em cada estágio mostra tooltip com taxa de conversão
- Click em estágio navega para leads filtrados por aquele estágio
- Mobile: funil vertical com estágios empilhados como cards
- Channel breakdown com mini-barras de progresso

---

#### 2.2.6 Leads (`/leads`)

| Dimensão | Score | Notas |
|----------|-------|-------|
| Visual Polish | 3 | Busca, filtros, cards expandíveis |
| Component Completeness | 3 | CRUD completo, timeline, UTM fields |
| Responsividade | 2 | Formulário modal não otimizado para mobile |
| Acessibilidade | 2 | Sem role="listbox" nos filtros, sem focus management |
| UX Patterns | 3 | Expandable cards, timeline, search |
| **Média** | **2.6** | |

**Problemas:**
- Sem vista Kanban (drag-and-drop entre estágios)
- Sem avatar/iniciais do lead
- Sem tags visuais (canal de origem, estágio)
- Select de filtro é `<select>` nativo
- Timeline sem ícones de ação
- Sem paginação (lista todos os leads de uma vez)
- Botão "Novo Lead" abre formulário inline — deveria ser Dialog/Sheet

**Proposta:**
- Dual view: Lista (default) + Kanban (board)
- Kanban com colunas por estágio do funil, drag-and-drop para mover leads
- Avatar com iniciais coloridas para cada lead
- Badge colorido para canal de origem (Instagram = roxo, TikTok = rosa, LinkedIn = azul)
- Dialog para criar/editar lead
- Paginação com 20 items por página
- Timeline com ícones por tipo de evento

---

#### 2.2.7 Calendário (`/calendar`)

| Dimensão | Score | Notas |
|----------|-------|-------|
| Visual Polish | 2 | Grid básico funcional |
| Component Completeness | 2 | Sem componente de calendário real |
| Responsividade | 1 | Grid de 7 colunas quebra completamente |
| Acessibilidade | 1 | Sem navigation por teclado, sem aria-labels |
| UX Patterns | 2 | Sem drag-and-drop, sem modal de detalhes |
| **Média** | **1.6** | |

**Problemas:**
- Usa grid CSS básico em vez de componente de calendário
- Sem toggle semana/mês (PRD pede visão mensal E semanal)
- Sem drag-and-drop para mover entradas entre dias
- Sem modal de detalhes ao clicar em uma entrada
- Sem botão "+" em cada dia para criação rápida
- Ícones de formato são emojis em vez de ícones consistentes
- Categorias sem cor consistente
- Sem indicador de aderência à cadência
- Mobile completamente quebrado (7 colunas)

**Proposta:**
- Componente de calendário real com visões: Mês, Semana, Dia
- Toggle de visão no header do calendário
- Cada entrada mostra: ícone do canal, título truncado, cor da categoria
- Click em entrada abre Sheet com detalhes completos
- "+" flutuante em cada dia para criação rápida
- Drag-and-drop (desktop) para reagendar
- Mobile: visão semanal como default com swipe horizontal
- Barra de aderência à cadência no topo: "3/5 posts esta semana"

---

#### 2.2.8 Campanhas (`/campaigns`)

| Dimensão | Score | Notas |
|----------|-------|-------|
| Visual Polish | 3 | Cards com métricas organizadas |
| Component Completeness | 2 | Sem gráficos de performance, sem filtros |
| Responsividade | 2 | Cards adaptam mas grid de métricas pode comprimir |
| Acessibilidade | 2 | Status badge sem aria-label |
| UX Patterns | 3 | Empty state com ícone e instrução |
| **Média** | **2.4** | |

**Problemas:**
- Sem gráfico de gasto vs. conversões ao longo do tempo (PRD pede)
- Sem filtros por período ou status
- Sem comparativo/ranking entre campanhas
- Sem indicador visual de ROI (positivo/negativo)
- Métricas secundárias (CPM, CPC, CTR) em texto simples sem destaque

**Proposta:**
- Tabs: "Visão Geral" (lista) + "Comparativo" (tabela ranking)
- Filtros: período, status (ativa/pausada/finalizada)
- Mini sparkline em cada card mostrando tendência de gasto
- Badge de ROI com cor: verde (positivo), vermelho (negativo)
- Gráfico de gasto vs. conversões (area chart)
- Mobile: cards simplificados com métricas em accordion

---

#### 2.2.9 Alertas (`/alerts`)

| Dimensão | Score | Notas |
|----------|-------|-------|
| Visual Polish | 3 | Ícones por tipo, cores diferenciadas |
| Component Completeness | 2 | Sem categorização, sem filtros |
| Responsividade | 3 | Layout simples adapta bem |
| Acessibilidade | 2 | Sem aria-live para unread count |
| UX Patterns | 3 | Mark as read, unread count |
| **Média** | **2.6** | |

**Problemas:**
- Sem filtros por tipo de alerta
- Sem categorização visual por severidade (crítico/warning/info)
- Sem ação "Marcar todos como lidos"
- Sem link para o item relacionado (campanha/canal)
- Alertas lidos ficam com opacity:0.6 — deveria ser mais claro
- Sem badge de severidade (alta/média/baixa)

**Proposta:**
- Tabs: "Não lidos" + "Todos" + "Configurações"
- Badge de severidade: Crítico (vermelho), Atenção (amarelo), Info (azul)
- Link direto para campanha/canal afetado
- "Marcar todos como lidos" no header
- Alertas agrupados por data
- Animação de slide-out ao marcar como lido

---

#### 2.2.10 Relatórios (`/reports`)

| Dimensão | Score | Notas |
|----------|-------|-------|
| Visual Polish | 2 | Lista simples de relatórios |
| Component Completeness | 3 | Formulário de criação, download PDF |
| Responsividade | 2 | Formulário em grid de 3 colunas pode comprimir |
| Acessibilidade | 2 | Select nativo, sem labels visíveis nos inputs date |
| UX Patterns | 3 | Empty state com CTA, loading no botão |
| **Média** | **2.4** | |

**Problemas:**
- Formulário de criação usa Select nativo e inputs de data sem label visível
- Sem preview do relatório antes de gerar
- Sem indicador de progresso durante geração
- Sem opção de relatório recorrente (gerar automaticamente)
- Lista de relatórios sem thumbnail/preview

**Proposta:**
- Dialog para criação com labels visíveis e date picker
- Progress bar durante geração do relatório
- Thumbnail/preview do PDF na lista
- Opção de agendamento (semanal automático)
- Filtros por tipo e período

---

#### 2.2.11 Configurações (`/settings`)

| Dimensão | Score | Notas |
|----------|-------|-------|
| Visual Polish | 2 | Cards de link simples |
| Component Completeness | 2 | Só perfil + 2 links |
| Responsividade | 3 | Layout simples adapta |
| Acessibilidade | 2 | Cards link sem role="link" explícito |
| UX Patterns | 2 | Sem feedback de ações, sem edição de perfil |
| **Média** | **2.2** | |

**Problemas:**
- Perfil é read-only — sem edição
- Sem avatar/foto do usuário
- Sem gerenciamento de usuários (admin)
- Sem configuração de cadência de publicação
- Sem preferências de notificação
- Apenas 2 sub-páginas (Canais, Alertas)

**Proposta:**
- Tabs: Perfil | Canais | Alertas | Cadência | Usuários (admin)
- Perfil editável com avatar upload
- Seção de cadência: metas de posts por semana por canal
- Gerenciamento de usuários com convite por email
- Toggle de preferências de notificação

---

#### 2.2.12 Canais (`/settings/channels`)

| Dimensão | Score | Notas |
|----------|-------|-------|
| Visual Polish | 3 | Cards com status visual |
| Component Completeness | 3 | Connect/disconnect, sync, status |
| Responsividade | 3 | Cards empilham ok |
| Acessibilidade | 2 | Sem aria-labels em botões de ação |
| UX Patterns | 3 | Status visual (connected/disconnected), sync button |
| **Média** | **2.8** | |

**Problemas:**
- Sem ícone/logo da plataforma (Instagram, TikTok, etc.)
- Sem indicador de última sincronização bem-sucedida
- Sem métricas resumidas por canal (seguidores, posts)
- Botão de sync sem feedback visual de progresso

**Proposta:**
- Logo/ícone de cada plataforma no card
- Indicador "Última sync: há 2 horas"
- Mini-métricas: seguidores, posts últimos 7 dias
- Animação de loading durante sync
- Toast de confirmação após sync/connect/disconnect

---

#### 2.2.13 Configurações de Alertas (`/settings/alerts`)

| Dimensão | Score | Notas |
|----------|-------|-------|
| Visual Polish | 2 | Formulário básico |
| Component Completeness | 2 | Sem threshold configurável |
| Responsividade | 3 | Formulário adapta |
| Acessibilidade | 2 | Sem descriptions nos campos |
| UX Patterns | 2 | Sem preview de regras ativas |
| **Média** | **2.2** | |

**Problemas:**
- Sem configuração visual de thresholds
- Sem lista de regras ativas
- Sem toggle por canal
- Sem preview do que cada threshold significa

**Proposta:**
- Sliders para configurar thresholds (ex: "Alertar quando engajamento cair mais de X%")
- Lista de regras ativas com toggle on/off
- Configuração por canal
- Preview: "Se o engajamento do Instagram cair 30% vs. semana anterior, você será alertado"

---

### 2.3 Resumo do Audit

| Tela | Visual | Components | Mobile | A11y | UX | **Média** |
|------|--------|-----------|--------|------|----|---------:|
| Login/Register | 4 | 3 | 3 | 2 | 2 | **2.8** |
| Sidebar | 3 | 2 | 1 | 2 | 2 | **2.0** |
| Header | 1 | 1 | 2 | 1 | 1 | **1.2** |
| Dashboard | 3 | 3 | 2 | 2 | 3 | **2.6** |
| Funil | 2 | 3 | 2 | 2 | 2 | **2.2** |
| Leads | 3 | 3 | 2 | 2 | 3 | **2.6** |
| Calendário | 2 | 2 | 1 | 1 | 2 | **1.6** |
| Campanhas | 3 | 2 | 2 | 2 | 3 | **2.4** |
| Alertas | 3 | 2 | 3 | 2 | 3 | **2.6** |
| Relatórios | 2 | 3 | 2 | 2 | 3 | **2.4** |
| Configurações | 2 | 2 | 3 | 2 | 2 | **2.2** |
| Canais | 3 | 3 | 3 | 2 | 3 | **2.8** |
| Config. Alertas | 2 | 2 | 3 | 2 | 2 | **2.2** |
| **Média Global** | **2.5** | **2.4** | **2.2** | **1.8** | **2.4** | **2.3** |

**Veredicto:** Score global 2.3/5.0 — abaixo do aceitável. Redesign é necessário em todas as áreas, com prioridade em: Header (1.2), Calendário (1.6), Sidebar (2.0), e Acessibilidade (1.8 global).

---

## 3. Design System Specification

### 3.1 Color Palette

#### Brand Colors
| Token | Hex | Uso |
|-------|-----|-----|
| `--brand-navy` | `#1B2A4A` | Sidebar, headers, textos primários |
| `--brand-navy-light` | `#2A3F6A` | Hover states, secondary elements |
| `--brand-navy-lighter` | `#3A5585` | Tertiary, borders |
| `--brand-orange` | `#E8792A` | CTA primário, accent, active states |
| `--brand-orange-dark` | `#D16A22` | CTA hover |
| `--brand-gold` | `#F5A623` | Destaques, badges, warnings |
| `--brand-orange-bg` | `#FDF2E9` | Background sutil de accent |

#### Semantic Colors
| Token | Hex | Uso |
|-------|-----|-----|
| `--success` | `#4CAF50` | Positivo, conectado, conversão |
| `--success-bg` | `#F0FDF4` | Background de success |
| `--warning` | `#F59E0B` | Atenção, pausado |
| `--warning-bg` | `#FFFBEB` | Background de warning |
| `--error` | `#EF4444` | Erro, desconectado, queda |
| `--error-bg` | `#FEF2F2` | Background de error |
| `--info` | `#3B82F6` | Informativo, planejado |
| `--info-bg` | `#EFF6FF` | Background de info |

#### Neutral Colors
| Token | Hex | Uso |
|-------|-----|-----|
| `--gray-50` | `#F9FAFB` | Page background |
| `--gray-100` | `#F3F4F6` | Card backgrounds alternativos |
| `--gray-200` | `#E5E7EB` | Borders, dividers |
| `--gray-300` | `#D1D5DB` | Disabled states |
| `--gray-400` | `#9CA3AF` | Placeholder text |
| `--gray-500` | `#6B7280` | Secondary text |
| `--gray-600` | `#4B5563` | Body text |
| `--gray-700` | `#374151` | Headings |
| `--gray-900` | `#111827` | Primary text |

### 3.2 Typography

| Token | Font | Size | Weight | Use |
|-------|------|------|--------|-----|
| `--text-h1` | Inter | 24px / 1.5rem | 700 | Page titles |
| `--text-h2` | Inter | 20px / 1.25rem | 600 | Section titles |
| `--text-h3` | Inter | 16px / 1rem | 600 | Card titles |
| `--text-body` | Inter | 14px / 0.875rem | 400 | Body text |
| `--text-small` | Inter | 12px / 0.75rem | 400 | Captions, labels |
| `--text-tiny` | Inter | 10px / 0.625rem | 500 | Badges, tags |
| `--text-kpi` | Inter | 28px / 1.75rem | 700 | KPI numbers |

### 3.3 Spacing Scale

Baseado em múltiplos de 4px:

| Token | Value | Use |
|-------|-------|-----|
| `--space-1` | 4px | Inline spacing, icon padding |
| `--space-2` | 8px | Tight spacing between related elements |
| `--space-3` | 12px | Default padding in small components |
| `--space-4` | 16px | Standard padding, gap |
| `--space-5` | 20px | Comfortable spacing |
| `--space-6` | 24px | Section padding, card padding |
| `--space-8` | 32px | Section gaps |
| `--space-10` | 40px | Page-level gaps |
| `--space-12` | 48px | Large section separators |

### 3.4 Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `--radius-sm` | 4px | Badges, tags |
| `--radius-md` | 8px | Buttons, inputs |
| `--radius-lg` | 12px | Cards, dialogs |
| `--radius-xl` | 16px | Large containers |
| `--radius-full` | 9999px | Avatars, pills |

### 3.5 Shadows

| Token | Value | Use |
|-------|-------|-----|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Cards at rest |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | Cards on hover |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.10)` | Dialogs, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.10)` | Modals |

### 3.6 Breakpoints

| Token | Value | Use |
|-------|-------|-----|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Wide desktop |
| `2xl` | 1536px | Ultra-wide |

---

## 4. Component Library

### 4.1 Componentes Existentes (Manter/Refatorar)

| Componente | Arquivo | Ação |
|-----------|---------|------|
| Button | `ui/button.tsx` | Manter — adicionar variant `link`, size `icon` |
| Card | `ui/card.tsx` | Manter — adicionar CardFooter, hover effect |
| Input | `ui/input.tsx` | Refatorar — adicionar error state, description |
| Select | `ui/select.tsx` | **Substituir** — trocar por Combobox shadcn |
| Skeleton | `ui/skeleton.tsx` | Manter |

### 4.2 Componentes Novos Necessários (shadcn/ui)

#### Tier 1 — Críticos (bloqueiam redesign)

| Componente | Prioridade | Uso Principal |
|-----------|-----------|---------------|
| **Dialog** | P0 | Criar/editar lead, criar conteúdo, confirmações |
| **Sheet** | P0 | Detalhes de lead, sidebar mobile drawer |
| **DropdownMenu** | P0 | User menu no header, ações contextuais |
| **Toast / Sonner** | P0 | Feedback de todas as ações (save, delete, sync) |
| **Tooltip** | P0 | Sidebar colapsada, métricas com explicação |
| **Badge** | P0 | Status, tags de canal, severidade de alerta |
| **Avatar** | P0 | User no header/sidebar, leads, responsáveis |
| **Tabs** | P0 | Settings, leads (lista/kanban), campanhas |

#### Tier 2 — Importantes (completam a experiência)

| Componente | Prioridade | Uso Principal |
|-----------|-----------|---------------|
| **Command** | P1 | Busca global (Ctrl+K) |
| **Combobox** | P1 | Substituir select nativo, busca em opções |
| **Calendar (component)** | P1 | Date picker, seleção de período |
| **Popover** | P1 | Filtros, date range picker |
| **Progress** | P1 | Aderência à cadência, geração de relatório |
| **Separator** | P1 | Divisores na sidebar, seções |
| **ScrollArea** | P1 | Sidebar content, listas longas |
| **Switch** | P1 | Toggle de configurações |

#### Tier 3 — Nice to Have (polish)

| Componente | Prioridade | Uso Principal |
|-----------|-----------|---------------|
| **Breadcrumb** | P2 | Header — navegação contextual |
| **Collapsible** | P2 | Seções recolhíveis em settings |
| **HoverCard** | P2 | Preview de lead ao hover |
| **AlertDialog** | P2 | Confirmações destrutivas (deletar) |
| **Accordion** | P2 | FAQ, detalhes de campanha em mobile |
| **Table** | P2 | Channel breakdown, comparativo de campanhas |
| **Pagination** | P2 | Lista de leads, relatórios |
| **Label** | P2 | Formulários acessíveis |

---

## 5. Interaction Patterns

### 5.1 Loading States

| Padrão | Quando Usar | Implementação |
|--------|-------------|---------------|
| **Skeleton** | Carregamento inicial de página | Skeleton matching layout dos dados |
| **Spinner no botão** | Ações pontuais (save, sync, delete) | `isPending` desabilita botão + mostra spinner |
| **Progress bar** | Ações longas (gerar relatório, sync) | Progress component com % |
| **Optimistic update** | Ações rápidas (mark as read, move lead) | Atualizar UI imediatamente, reverter se erro |

### 5.2 Empty States

Cada empty state deve ter 3 elementos:

1. **Ilustração/Ícone** — Ícone Lucide grande (48px) em cor sutil
2. **Mensagem** — Explicação do que apareceria aqui
3. **CTA** — Botão para a ação que popula esta seção

Exemplos:
- Dashboard sem canais: ícone Link2 + "Conecte seus canais para ver métricas" + Botão "Conectar Canais"
- Leads vazio: ícone Users + "Registre seu primeiro lead" + Botão "Novo Lead"
- Calendário vazio: ícone CalendarPlus + "Planeje seu conteúdo" + Botão "Criar Entrada"

### 5.3 Feedback (Toast Notifications)

| Ação | Tipo | Mensagem Exemplo |
|------|------|------------------|
| Lead criado | Success | "Lead João Silva adicionado ao estágio Consideração" |
| Lead movido | Success | "Lead movido para Conversão" |
| Canal conectado | Success | "Instagram conectado com sucesso" |
| Canal desconectado | Info | "Instagram desconectado" |
| Sync concluído | Success | "Métricas sincronizadas — 3 canais atualizados" |
| Erro de sync | Error | "Falha ao sincronizar TikTok — token expirado" |
| Relatório gerado | Success | "Relatório mensal pronto para download" |
| Confirmação de delete | Warning | "Tem certeza? Esta ação não pode ser desfeita" |

### 5.4 Animations & Transitions

| Elemento | Animação | Duração | Easing |
|----------|----------|---------|--------|
| Page transitions | Fade in | 200ms | ease-out |
| Card hover | Scale 1.01 + shadow | 150ms | ease-in-out |
| Sidebar collapse | Width transition | 200ms | ease-in-out |
| Toast slide-in | Slide from right | 300ms | spring |
| Dialog/Sheet open | Fade + scale | 200ms | ease-out |
| Badge count update | Scale bounce | 200ms | spring |
| KPI number change | Count-up animation | 500ms | ease-out |
| Funnel load | Staggered slide-in | 100ms per stage | ease-out |

### 5.5 Confirmations

Ações destrutivas devem usar AlertDialog:
- Deletar lead
- Desconectar canal
- Remover usuário

Ações reversíveis usam Toast com undo:
- Marcar alerta como lido
- Mover lead de estágio

---

## 6. Mobile-First Responsive Specifications

### 6.1 Layout Breakpoints

| Breakpoint | Layout |
|-----------|--------|
| **< 640px** (mobile) | Sidebar = Sheet drawer, Header com hamburger, single column |
| **640-1023px** (tablet) | Sidebar colapsada (ícones), 2 columns |
| **>= 1024px** (desktop) | Sidebar expandida, multi-column |

### 6.2 Component Adaptations

| Componente | Desktop | Mobile |
|-----------|---------|--------|
| Sidebar | Fixed, expandida (w-64) | Sheet/Drawer, abre com hamburger |
| Header | Breadcrumbs + search + avatar | Hamburger + título da página + avatar |
| KPI Cards | Grid 5 colunas | Stack vertical, 1 coluna |
| Charts | Full width, interactive | Scroll horizontal, simplified |
| Funnel | Horizontal trapézio | Cards verticais empilhados |
| Leads list | Cards expandíveis | Cards simplificados |
| Calendar | Grid 7 colunas (mês) | Visão semanal (default), swipe |
| Campanhas | Cards com grid de métricas | Cards com métricas em accordion |
| Tables | Full table com scroll | Card list alternativo |
| Dialogs | Center, max-w-lg | Full screen bottom sheet |

### 6.3 Touch Targets

- Mínimo 44x44px para todos os elementos interativos
- Espaçamento mínimo de 8px entre touch targets adjacentes
- Botões de ação com padding mínimo de 12px vertical

### 6.4 Mobile-Specific Patterns

- **Pull-to-refresh**: Dashboard, leads, alerts (via react-query refetch)
- **Swipe actions**: Alertas (swipe left = marcar como lido)
- **Bottom navigation**: Considerar bottom tab bar como alternativa à sidebar em mobile
- **Gesture navigation**: Swipe horizontal no calendário para navegar semanas

---

## 7. Accessibility Requirements (WCAG AA)

### 7.1 Mandatory Requirements

| Critério | WCAG | Requisito | Status Atual |
|----------|------|-----------|-------------|
| 1.1.1 | Non-text Content | Alt text em todos os ícones decorativos, aria-hidden para decorativos | Ausente |
| 1.3.1 | Info and Relationships | Semantic HTML (nav, main, aside, section, header) | Parcial |
| 1.4.3 | Contrast (Minimum) | Ratio 4.5:1 para texto, 3:1 para texto grande | Não verificado |
| 1.4.11 | Non-text Contrast | 3:1 para elementos UI (borders, icons) | Não verificado |
| 2.1.1 | Keyboard | Todos os elementos interativos acessíveis via teclado | Parcial |
| 2.4.1 | Bypass Blocks | Skip link para conteúdo principal | Ausente |
| 2.4.2 | Page Titled | Títulos descritivos por página | Ausente |
| 2.4.3 | Focus Order | Ordem lógica de foco em formulários e modais | Não verificado |
| 2.4.7 | Focus Visible | Indicador visual de foco | Default browser |
| 3.3.1 | Error Identification | Erros identificados em texto (não só cor) | Parcial |
| 3.3.2 | Labels or Instructions | Labels visíveis em todos os inputs | Parcial |
| 4.1.2 | Name, Role, Value | ARIA labels em componentes custom | Ausente |

### 7.2 Implementation Checklist

- [ ] Adicionar `<a href="#main-content" class="sr-only focus:not-sr-only">Pular para conteúdo</a>` no layout
- [ ] Adicionar `role="navigation"` e `aria-label` na sidebar
- [ ] Adicionar `aria-current="page"` no item de navegação ativo
- [ ] Verificar contraste de todas as cores com ferramenta (contrast ratio checker)
- [ ] Adicionar `aria-label` em todos os botões que contêm apenas ícones
- [ ] Adicionar `aria-live="polite"` para contadores de alertas/notificações
- [ ] Gerenciar focus trap em Dialog/Sheet
- [ ] Adicionar `<title>` dinâmico por página via metadata do Next.js
- [ ] Testar navegação completa via teclado (Tab, Shift+Tab, Enter, Escape)
- [ ] Adicionar `aria-describedby` para campos com descrições/erros
- [ ] Usar `role="status"` para toasts
- [ ] Garantir que gráficos tenham descrição textual alternativa

---

## 8. Implementation Epics

### Epic UX-1: Design System Foundation

**Goal:** Instalar e configurar todos os componentes shadcn/ui necessários, estabelecer design tokens, e criar base do design system.

**Stories:**
1. Instalar shadcn/ui CLI e configurar `components.json`
2. Instalar componentes Tier 1: Dialog, Sheet, DropdownMenu, Toast/Sonner, Tooltip, Badge, Avatar, Tabs
3. Instalar componentes Tier 2: Command, Combobox, Calendar, Popover, Progress, Separator, ScrollArea, Switch
4. Configurar design tokens no `tailwind.config.ts` (cores, typography, spacing, shadows)
5. Substituir Select nativo por Combobox em todas as telas
6. Adicionar CardFooter e hover effects ao Card component
7. Refatorar Input com error state e description

**Acceptance Criteria:**
- Todos os componentes Tier 1 e Tier 2 instalados e importáveis
- Design tokens configurados no Tailwind
- Select nativo 100% substituído
- Storybook ou page de teste visual para cada componente

**Estimativa:** ~20 tasks

---

### Epic UX-2: Layout & Navigation Redesign

**Goal:** Redesenhar sidebar, header, e layout base para mobile-first responsive.

**Stories:**
1. Redesenhar Sidebar com logo, seções, badges, user card, e tooltip em estado colapsado
2. Implementar mobile drawer (Sheet) para sidebar com backdrop
3. Redesenhar Header com breadcrumbs, busca global (Command dialog), notificações, avatar menu
4. Implementar hamburger menu em mobile que abre sidebar drawer
5. Adicionar skip link para acessibilidade
6. Implementar `<title>` dinâmico via Next.js metadata por página
7. Adicionar transições suaves de página (fade-in)

**Acceptance Criteria:**
- Sidebar funcional em desktop (expandida/colapsada) e mobile (drawer)
- Header com breadcrumbs, busca Ctrl+K, notificações, user menu
- Skip link presente e funcional
- Lighthouse accessibility score > 85

**Estimativa:** ~15 tasks

---

### Epic UX-3: Dashboard Redesign

**Goal:** Tornar o dashboard interativo com drill-down, quick-actions, e métricas ricas.

**Stories:**
1. KPI cards clicáveis com hover effect e navegação para detalhe do canal
2. Adicionar quick-action bar ("Registrar Lead", "Criar Conteúdo", "Gerar Relatório")
3. Tooltip explicativos em métricas técnicas (CPM, CTR, CPC)
4. Card de "Aderência à Cadência" com mini progress bar
5. Charts responsivos com scroll horizontal em mobile
6. Animação de count-up nos números de KPI

**Acceptance Criteria:**
- KPIs clicáveis com drill-down
- Quick-actions funcionais
- Charts responsivos em mobile
- Tooltips em todas as métricas técnicas

**Estimativa:** ~12 tasks

---

### Epic UX-4: Funnel Visualization Redesign

**Goal:** Implementar visualização de funil em formato trapézio/pirâmide com animações e interatividade.

**Stories:**
1. Criar componente de funil SVG/CSS com formato trapézio real
2. Animação de preenchimento staggered ao carregar
3. Tooltip com taxa de conversão ao hover em cada estágio
4. Click em estágio navega para leads filtrados
5. Mobile: funil vertical com cards empilhados
6. Channel breakdown com mini-barras de progresso em vez de tabela

**Acceptance Criteria:**
- Funil visual em formato trapézio (não barras retangulares)
- Animação suave de load
- Interativo: hover mostra dados, click navega
- Responsivo em mobile

**Estimativa:** ~10 tasks

---

### Epic UX-5: Leads UX Enhancement

**Goal:** Adicionar vista Kanban, avatars, tags, paginação, e melhorar CRUD com Dialog.

**Stories:**
1. Dual view toggle: Lista (default) + Kanban board
2. Kanban com colunas por estágio e drag-and-drop
3. Avatar com iniciais coloridas para cada lead
4. Badge colorido para canal de origem
5. Substituir formulário inline por Dialog/Sheet
6. Adicionar paginação (20 por página)
7. Timeline com ícones por tipo de evento
8. Busca e filtros com Combobox

**Acceptance Criteria:**
- Kanban funcional com drag-and-drop
- Avatars e badges em todos os leads
- Dialog para CRUD
- Paginação funcional

**Estimativa:** ~15 tasks

---

### Epic UX-6: Calendar Redesign

**Goal:** Implementar componente de calendário real com visões mês/semana/dia, drag-and-drop, e aderência.

**Stories:**
1. Componente de calendário com visão mensal (grid real)
2. Visão semanal expandida
3. Toggle de visão (mês/semana) no header
4. Sheet de detalhes ao clicar em entrada
5. Botão "+" em cada dia para criação rápida
6. Drag-and-drop para reagendar (desktop)
7. Barra de aderência à cadência no topo
8. Mobile: visão semanal default com swipe

**Acceptance Criteria:**
- Calendário real com grid funcional (não CSS grid básico)
- Visões mês e semana alternáveis
- Criação rápida funcional
- Drag-and-drop no desktop
- Mobile com swipe horizontal

**Estimativa:** ~15 tasks

---

### Epic UX-7: Campaigns & Reports Polish

**Goal:** Adicionar gráficos, filtros, comparativos em campanhas e melhorar UX de relatórios.

**Stories:**
1. Campanhas: Tabs "Visão Geral" + "Comparativo"
2. Campanhas: filtros por período e status
3. Campanhas: mini sparklines de tendência
4. Campanhas: badge de ROI (positivo/negativo)
5. Relatórios: Dialog para criação com date picker
6. Relatórios: progress bar durante geração
7. Alertas: Tabs "Não lidos" + "Todos"
8. Alertas: badge de severidade (crítico/warning/info)
9. Alertas: "Marcar todos como lidos"
10. Alertas: link para item relacionado

**Acceptance Criteria:**
- Campanhas com filtros e comparativo
- Relatórios com Dialog e progress
- Alertas com categorização e batch actions

**Estimativa:** ~18 tasks

---

### Epic UX-8: Mobile Responsiveness

**Goal:** Garantir que toda a aplicação funcione em mobile (< 640px).

**Stories:**
1. Testar e corrigir todas as 13 telas em viewport 375px (iPhone SE)
2. Converter tabelas para card lists em mobile
3. Dialogs full-screen como bottom sheet em mobile
4. Dashboard: KPI cards em stack vertical
5. Charts: scroll horizontal com indicador visual
6. Calendar: visão semanal default
7. Leads: cards simplificados
8. Touch targets: audit e correção de todos os < 44px

**Acceptance Criteria:**
- Todas as 13 telas funcionais em 375px viewport
- Nenhuma tabela horizontal quebrada
- Touch targets >= 44px
- Lighthouse mobile > 80

**Estimativa:** ~12 tasks

---

### Epic UX-9: Accessibility & Feedback Systems

**Goal:** Implementar WCAG AA compliance e sistema completo de feedback (toasts, confirmações).

**Stories:**
1. Skip link no layout principal
2. ARIA labels em todos os botões icon-only
3. aria-current="page" na navegação
4. Focus trap em Dialog/Sheet
5. Contraste audit e correções
6. Keyboard navigation completa (Tab, Enter, Escape)
7. aria-live regions para contadores
8. Toast system (Sonner) integrado em todas as ações
9. AlertDialog para ações destrutivas
10. Metadata dinâmico (`<title>`) por página
11. Alt text / aria-label em gráficos

**Acceptance Criteria:**
- WCAG AA compliance verificável via axe-core
- Navegação completa por teclado
- Toasts em todas as ações de mutação
- Confirmação em todas as ações destrutivas
- Lighthouse accessibility > 90

**Estimativa:** ~18 tasks

---

## 9. Priority & Sequencing

### Sequência Recomendada

```
Epic UX-1 (Design System)
    ↓
Epic UX-2 (Layout/Nav)
    ↓
┌─────────┬─────────┬─────────┐
│ UX-3    │ UX-4    │ UX-5    │  (parallelizable)
│Dashboard│ Funnel  │ Leads   │
└─────────┴─────────┴─────────┘
    ↓
┌─────────┬─────────┐
│ UX-6    │ UX-7    │  (parallelizable)
│Calendar │Campaigns│
└─────────┴─────────┘
    ↓
Epic UX-8 (Mobile)
    ↓
Epic UX-9 (A11y & Feedback)
```

### Rationale

1. **UX-1 primeiro** — todos os outros epics dependem dos componentes do design system
2. **UX-2 segundo** — layout e navegação afetam todas as telas
3. **UX-3/4/5 em paralelo** — são telas independentes que podem ser trabalhadas simultaneamente
4. **UX-6/7 em paralelo** — também independentes entre si
5. **UX-8 depois** — mobile é mais eficiente de fazer após as telas estarem redesenhadas
6. **UX-9 por último** — feedback e a11y se beneficiam de ter todos os componentes no lugar

### Effort Estimate

| Epic | Tasks | Complexidade |
|------|-------|-------------|
| UX-1 Design System | ~20 | Média |
| UX-2 Layout/Nav | ~15 | Alta |
| UX-3 Dashboard | ~12 | Média |
| UX-4 Funnel | ~10 | Alta |
| UX-5 Leads | ~15 | Alta |
| UX-6 Calendar | ~15 | Alta |
| UX-7 Campaigns/Reports | ~18 | Média |
| UX-8 Mobile | ~12 | Média |
| UX-9 A11y & Feedback | ~18 | Média |
| **Total** | **~135** | |

---

## 10. Success Metrics

| Métrica | Atual | Target |
|---------|-------|--------|
| UX Audit Score (média global) | 2.3/5.0 | >= 4.0/5.0 |
| Lighthouse Accessibility (mobile) | ~50 | >= 90 |
| Lighthouse Performance (mobile) | ~60 | >= 80 |
| Componentes shadcn/ui instalados | 0 | >= 20 |
| Componentes UI hand-rolled | 5 | 5 (mantidos + refatorados) |
| Telas mobile-ready | 2/13 | 13/13 |
| Touch targets < 44px | ~30+ | 0 |
| Ações sem feedback (toast) | ~15 | 0 |
| Ações destrutivas sem confirmação | ~5 | 0 |

---

**Generated by:** Uma (@ux-design-expert) — Synkra AIOX v5.0.3
**Methodology:** Sally (UX Empathy) + Brad Frost (Atomic Design Systems)
**— Uma, desenhando com empatia**
