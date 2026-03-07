# PRD: CRM de Leads & Revenue — FLFloripa Performance

**Author:** Morgan (@pm) + Uma (@ux-design-expert) — Revenue Squad
**Version:** 1.0.0
**Date:** 2026-03-07
**Status:** Draft
**Parent PRD:** `docs/prd.md` (Epic 4 — Funil de Conversão & Leads)

---

## 1. Executive Summary

A plataforma FLFloripa Performance possui gestão de leads funcional mas sem estrutura de CRM. Leads são exibidos numa lista plana com cards expandíveis, sem visão de pipeline, sem página de detalhe individual, e sem sistema de notas/atividades. Campanhas são listadas sem possibilidade de drill-down em métricas diárias.

Este PRD define as features necessárias para transformar a gestão de leads em um CRM visual, adicionar visão de detalhe por campanha, e corrigir problemas de UI em calendário, funil e dashboard.

---

## 2. Gap Analysis por Seção

### 2.1 Leads

| Feature | Status | Gap |
|---------|--------|-----|
| Listagem com busca/filtro | ✅ Existe | — |
| Criação inline (form) | ✅ Existe | — |
| Avatar com iniciais | ✅ Existe | — |
| Badges (momento, VSL, origem) | ✅ Existe | — |
| Stage movement | ✅ Existe | — |
| Expandable details | ✅ Existe | — |
| Event timeline (stage changes) | ✅ Existe | — |
| **Página de detalhe /leads/[id]** | ❌ Não existe | Sem visão completa do lead |
| **Pipeline Kanban** | ❌ Não existe | Sem visualização por estágio |
| **Sistema de notas** | ❌ Parcial | Só notas de movimentação, sem notas livres |
| **Edição de campos** | ❌ Parcial | API PUT existe, UI não implementada |
| **Link para campanha de origem** | ❌ Não existe | campaignId existe no modelo mas não no UI |

### 2.2 Campanhas

| Feature | Status | Gap |
|---------|--------|-----|
| Listagem com métricas | ✅ Existe | — |
| Status badges | ✅ Existe | — |
| Budget progress bar | ✅ Existe | — |
| Metric tooltips (CPM/CPC/CTR) | ✅ Existe | — |
| **Página de detalhe /campaigns/[id]** | ❌ Não existe | Sem drill-down em métricas |
| **Gráfico de métricas diárias** | ❌ Não existe | API retorna metrics, sem chart |
| **Leads atribuídos** | ❌ Não existe | campaignId existe mas sem visão |

### 2.3 Dashboard

| Feature | Status | Gap |
|---------|--------|-----|
| KPI cards com tooltips | ✅ Existe | Visual genérico, falta personalidade |
| Trend badges | ✅ Existe | — |
| Charts (TrendChart, ChannelComparison) | ✅ Existe | — |
| Quick actions | ✅ Existe | Muitos botões, visual template-like |
| **Branding visual** | ⚠️ Parcial | Cores brand presentes mas layout genérico |

### 2.4 Calendário

| Feature | Status | Gap |
|---------|--------|-----|
| Monthly/Weekly view toggle | ✅ Existe | **Border leaking no toggle** |
| Entry cards | ✅ Existe | **Padding inconsistente em compact mode** |
| Filters | ✅ Existe | — |
| Create form | ✅ Existe | — |
| Weekly grid | ✅ Existe | **Sem responsividade mobile (7 cols fixas)** |

### 2.5 Funil

| Feature | Status | Gap |
|---------|--------|-----|
| SVG trapezoid | ✅ Existe | **Possível overflow do container** |
| Stage detail cards | ✅ Existe | — |
| Channel breakdown table | ✅ Existe | — |
| KPI cards | ✅ Existe | — |

---

## 3. CRM Spec — Lead Detail Page

### 3.1 Rota: `/leads/[id]`

**Objetivo:** Visão completa de um lead individual com perfil, timeline de atividades, e ações.

**Layout (2 colunas):**

```
┌─────────────────────────────────────────────────────┐
│ ← Voltar aos Leads    João Silva        [Editar] [🗑]│
├────────────────────────┬────────────────────────────┤
│                        │                            │
│  [Avatar Grande]       │  TIMELINE                  │
│  João Silva            │  ● Movido para Interesse   │
│  joao@email.com        │    por Admin — 05/03/2026  │
│  (48) 99999-0000       │  ● Registrado via Instagram│
│                        │    por Editor — 01/03/2026 │
│  ── Estágio ──         │                            │
│  [Badge: Interesse]    │  NOTAS (futuro)            │
│  [→ Próximo: Consider.]│  (placeholder para v2)     │
│  [Mover para ▼]        │                            │
│                        │                            │
│  ── Perfil ──          │                            │
│  Momento: Busca espir. │                            │
│  Inquietude: Sentido   │                            │
│  Fonte: reel-logosofia │                            │
│                        │                            │
│  ── Tracking ──        │                            │
│  Origem: Instagram     │                            │
│  UTM: ig/cpc/reel      │                            │
│  Ad Spend: R$ 15,00    │                            │
│  VSL: 3min 20s ✓       │                            │
│                        │                            │
└────────────────────────┴────────────────────────────┘
```

**Componentes usados:** Card, Badge, Button, Select, Separator, ScrollArea
**API:** GET `/api/leads/[id]` — precisa incluir events com fromStage/toStage/createdBy
**Interações:**
- Botão "Editar" abre Dialog com form de edição (reutiliza campos do create form)
- Botão "→ Próximo" avança estágio (POST `/api/leads/[id]/move`)
- Select "Mover para" permite pular estágios
- Botão "🗑" confirma exclusão com AlertDialog

### 3.2 Pipeline Kanban View

**Localização:** Tab "Pipeline" em `/leads` (ao lado de "Lista")

**Layout:**

```
 Leads    [Lista] [Pipeline]    [+ Novo Lead]

 ┌─Impactado(12)─┐ ┌─Engajado(8)──┐ ┌─Interessado(5)┐ ┌─Conversão(2)─┐
 │                │ │              │ │               │ │              │
 │ ┌────────────┐ │ │ ┌──────────┐ │ │ ┌───────────┐ │ │ ┌──────────┐ │
 │ │ JS João S. │ │ │ │ ML Maria │ │ │ │ PM Pedro  │ │ │ │ AR Ana R.│ │
 │ │ via IG     │ │ │ │ via TT   │ │ │ │ via LI    │ │ │ │ via IG   │ │
 │ │ [→ Next]   │ │ │ │ [→ Next] │ │ │ │ [→ Next]  │ │ │ │ [✓]      │ │
 │ └────────────┘ │ │ └──────────┘ │ │ └───────────┘ │ │ └──────────┘ │
 │ ┌────────────┐ │ │              │ │               │ │              │
 │ │ BM Bruno   │ │ │              │ │               │ │              │
 │ └────────────┘ │ │              │ │               │ │              │
 └────────────────┘ └──────────────┘ └───────────────┘ └──────────────┘
```

**Comportamento:**
- Colunas são FunnelStages ordenadas por position
- Cada card é clicável → navega para `/leads/[id]`
- Botão "→ Next" avança para o próximo estágio
- Header da coluna mostra nome + count de leads
- Scroll vertical por coluna (ScrollArea)
- Sem drag-and-drop (v1) — simplicidade

---

## 4. Campaign Detail Spec

### 4.1 Rota: `/campaigns/[id]`

**Objetivo:** Visão detalhada de uma campanha com gráfico de métricas ao longo do tempo.

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│ ← Campanhas    Campanha XYZ    [Badge: Ativa]       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ R$ 450  │ │ 12.5K   │ │ 890     │ │ 23      │  │
│  │ Gasto   │ │ Impress.│ │ Cliques │ │ Conv.   │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│                                                     │
│  ── Métricas Diárias ──                             │
│  [Select: spend | impressions | clicks | conversions]│
│                                                     │
│  📈 LineChart (Recharts)                            │
│  ▏        ╱╲                                        │
│  ▏   ╱╲  ╱  ╲  ╱╲                                  │
│  ▏  ╱  ╲╱    ╲╱  ╲                                 │
│  ▏─╱──────────────╲──── date axis                   │
│                                                     │
│  ── Detalhes ──                                     │
│  Objetivo: Conversions   Orçamento: R$ 1.000        │
│  Período: 01/02 — 28/02  Canal: Instagram — @conta  │
│  CPM: R$ 8,50  CPC: R$ 1,20  CTR: 3.2%             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**API:** GET `/api/campaigns/[id]` — já retorna `metrics[]` com dados diários
**Chart:** Recharts LineChart, reutilizando pattern de `trend-chart.tsx`
**Select de métrica:** Dropdown para alternar entre spend, impressions, clicks, conversions

---

## 5. Data Model

### Sem alterações de schema necessárias para v1

O Prisma schema atual já possui:
- `Lead` com todos os campos de perfil, tracking, e relações
- `LeadEvent` com fromStage/toStage/notes/createdBy — suficiente para timeline
- `Campaign` com channel/metrics/budget
- `CampaignMetric` com dados diários (spend, impressions, clicks, cpm, cpc, ctr, conversions)

### Futuro (v2):
- `LeadNote` model separado (notas livres sem stage change)
- `LeadTag` model para tags customizáveis
- `LeadScore` model para scoring automático

---

## 6. Epics de Implementação

### Epic 7.1: UI Bug Fixes
- Fix Calendar toggle border leaking
- Fix Calendar weekly grid responsividade mobile
- Fix Calendar entry card padding
- Fix Funnel SVG overflow
- Polish Dashboard visual (menos genérico)

### Epic 7.2: Lead Detail Page
- Criar rota /leads/[id] com page.tsx + client component
- Layout 2 colunas (perfil + timeline)
- Integrar com API GET /api/leads/[id]
- Botões de ação (editar, mover, excluir)
- Link da lista para detail page

### Epic 7.3: Pipeline Kanban View
- Adicionar Tabs (Lista | Pipeline) em /leads
- Implementar view de colunas por FunnelStage
- Cards de lead com avatar, nome, badges
- Botão de avançar estágio por card
- Card clicável → navegação para /leads/[id]

### Epic 7.4: Campaign Detail Page
- Criar rota /campaigns/[id] com page.tsx + client component
- KPI cards com métricas agregadas
- LineChart de métricas diárias (Recharts)
- Select de métrica a exibir
- Detalhes da campanha (objetivo, orçamento, período, canal)
- Link da lista para detail page
