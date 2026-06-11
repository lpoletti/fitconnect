## FitConnect Design System — Style Guide

Este guia reflete o Design System documentado em `RELATORIO_FITCONNECT_DESIGN_SYSTEM_2026-06-11.docx`.

---

## Layout

The root layout, `app/layout.tsx`, is the single place for app-wide providers and global infrastructure.

**Do not remove any existing entries without a reason.** Current infrastructure in the layout:

| Entry | Purpose |
|-------|---------|
| `ThemeProvider` | Light/dark mode via `next-themes` (default: dark) |
| `Toaster` | Global toast notifications via Sonner |
| `ChunkLoadErrorHandler` | Required — prevents known ChunkLoadError race condition bug |

---

## Typography

| Role | Font | Tailwind Class | Default Usage |
|------|------|---------------|-------|
| Body + Display | Inter | `font-sans` | All body text, labels, descriptions, page titles, headings |
| Mono | JetBrains Mono | `font-mono` | Code snippets, numeric data, IDs, timestamps |

**Font weights:** Regular (400) for body, SemiBold (600) for subtitles, Bold (700) for headings.

**Type scale tokens:**

| Token | Size | Weight | Line H | Usage |
|-------|------|--------|--------|-------|
| `display-lg` | 40px | 700 | 48px | Hero, landing, onboarding |
| `display-md` | 32px | 700 | 40px | Main section titles |
| `heading-1` | 28px | 700 | 36px | Screen titles |
| `heading-2` | 24px | 600 | 32px | Screen subtitles |
| `heading-3` | 20px | 600 | 28px | Card/section titles |
| `title-lg` | 18px | 600 | 26px | Card titles |
| `title-md` | 16px | 600 | 24px | Names, important labels |
| `title-sm` | 14px | 600 | 20px | Card subtitles |
| `body-lg` | 16px | 400 | 26px | Body text, descriptions |
| `body-md` | 14px | 400 | 22px | Running text, paragraphs |
| `body-sm` | 12px | 400 | 18px | Auxiliary text, metadata |
| `caption` | 11px | 400 | 16px | Small labels, timestamps |
| `overline` | 10px | 700 | 14px | Tags, badges, labels |

**Rules:**
- No more than 2 heading sizes per screen
- Body text never smaller than 14px for reading in motion
- Use `tracking-tight` on headings 24px+

---

## Color System (Design Tokens)

All colors use CSS variables — **never hardcode color values**.

| Token | Hex | Purpose |
|-------|-----|---------|
| `background` | #0F172A | Page-level bg |
| `foreground` | #F8FAFC | Page-level text |
| `card` | #1E293B | Card surfaces |
| `surface` | #1E293B | General surface (same as card) |
| `surface-elevated` | #334155 | Elevated elements, dropdowns, hover states |
| `primary` | #10B981 | Brand buttons, links, progress indicators |
| `primary-light` | #34D399 | Hover, highlight, glow effects |
| `secondary` | #1E293B | Secondary buttons |
| `muted` | #1E293B | Muted backgrounds |
| `muted-foreground` | #64748B | Placeholder, disabled text, labels |
| `accent` | #F59E0B | Accent highlights |
| `destructive` | #EF4444 | Errors, delete actions |
| `success` | #22C55E | Confirmation, check-in |
| `warning` | #F59E0B | Attention, alert |
| `info` | #3B82F6 | Information, tips |

Usage: `bg-primary`, `text-muted-foreground`, `border-border`, `bg-surface-elevated`.

---

## Spacing Scale

Based on a 4px grid:

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `--spacing-1` | 4px | `p-1`, `gap-1` | Micro-spacing icon to text |
| `--spacing-2` | 8px | `p-2`, `gap-2` | Component internal spacing |
| `--spacing-3` | 12px | `p-3`, `gap-3` | Compact card padding |
| `--spacing-4` | 16px | `p-4`, `gap-4` | Default card and button padding |
| `--spacing-5` | 20px | `p-5`, `gap-5` | Related element spacing |
| `--spacing-6` | 24px | `p-6`, `gap-6` | Section spacing |
| `--spacing-8` | 32px | `p-8`, `gap-8` | Content group spacing |
| `--spacing-12` | 48px | `p-12`, `gap-12` | Main section spacing |
| `--spacing-16` | 64px | `p-16`, `gap-16` | Hero spacing |

**Rules:**
- Cards: 16px padding default
- Screen margins mobile: 20px
- Screen margins desktop: 32-64px
- Buttons: 12px vertical, 20px horizontal

---

## Shadow Scale

| Token | Default Usage |
|-------|-------|
| `--shadow-sm` | Subtle card lift, input focus |
| `--shadow-md` | Cards, dropdowns, popovers |
| `--shadow-lg` | Modals, elevated panels |
| `--shadow-xl` | Highest elevation |
| `--shadow-glow` | Primary glow effect |

---

## Border Radius

| Token | Value | Default Usage |
|-------|-------|-------|
| `--radius` | 1rem (16px) | Default (buttons, inputs, cards) |
| `--radius-sm` | 12px | Small elements (badges, chips) |
| `--radius-lg` | 20px | Large containers, hero cards |
| `--radius-full` | 9999px | Avatars, pills, circular buttons |

---

## Animation Timing

| Token | Value | Default Usage |
|-------|-------|-------|
| `--duration-fast` | 100ms | Hover states, micro-interactions |
| `--duration-base` | 200ms | Component transitions |
| `--duration-slow` | 300ms | Page transitions, modals |
| `--duration-xl` | 500ms | Full page, onboarding |

**Easing curves:**
- Default transitions: `cubic-bezier(0.4, 0, 0.2, 1)`
- Elements entering: `cubic-bezier(0, 0, 0.2, 1)`
- Elements leaving: `cubic-bezier(0.4, 0, 1, 1)`
- Micro-interactions: spring physics

---

## Layout Components

### `Container` — `@/components/layouts/container`
Centers content with responsive padding. Props: `size` (`sm`|`md`|`lg`|`xl`|`full`).

### `Section` — `@/components/layouts/section`
Vertical spacing wrapper for page sections. Props: `id`, `className`.

### `PageHeader` — `@/components/layouts/page-header`
Title + description + action buttons. Use at top of every app page.

### `AppShell` — `@/components/layouts/app-shell`
Sidebar + header + main content. For dashboards and admin panels.

### `AuthLayout` — `@/components/layouts/auth-layout`
Centered card on gradient background. For login, signup, onboarding flows.

---

## Iconography

- **Library:** Lucide React (outline style, stroke-width 2px)
- **Sizes:** 16px (inline), 20px (buttons), 24px (navigation), 32px (empty states), 48px+ (illustrations)
- **Color:** `text-secondary` default, `primary` active
- Icons never used without labels except for universally recognized actions (X close, back arrow)

---

## UI Components — `@/components/ui/`

### Core
| Component | Import | Key Props |
|-----------|--------|-----------|
| `Button` | `@/components/ui/button` | `variant` (`default`|`secondary`|`outline`|`ghost`|`destructive`|`link`|`glass-dark`|`glass-light`), `size` (`default`|`xs`|`sm`|`lg`|`icon`|`icon-sm`), `loading` |
| `Badge` | `@/components/ui/badge` | `variant` (`default`|`secondary`|`outline`|`destructive`) |
| `Card` | `@/components/ui/card` | `variant` (`default`|`interactive`|`glass-dark`|`glass-dark-interactive`|`glass-light`|`glass-light-interactive`|`ghost`). Composed: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` |
| `Separator` | `@/components/ui/separator` | `orientation` (`horizontal`|`vertical`) |

### Forms
| Component | Import |
|-----------|--------|
| `Input` | `@/components/ui/input` | `variant` (`default`|`error`|`success`|`ghost`), `size` (`default`|`sm`|`lg`) |
| `Textarea` | `@/components/ui/textarea` |
| `Label` | `@/components/ui/label` |
| `Select` | `@/components/ui/select` |
| `Checkbox` | `@/components/ui/checkbox` |
| `RadioGroup` | `@/components/ui/radio-group` |
| `Switch` | `@/components/ui/switch` |
| `Slider` | `@/components/ui/slider` |
| `Calendar` | `@/components/ui/calendar` |
| `Form` | `@/components/ui/form` |

### Navigation & Layout
| Component | Import |
|-----------|--------|
| `Tabs` | `@/components/ui/tabs` |
| `Accordion` | `@/components/ui/accordion` |
| `NavigationMenu` | `@/components/ui/navigation-menu` |
| `Breadcrumb` | `@/components/ui/breadcrumb` |
| `Pagination` | `@/components/ui/pagination` |
| `ScrollArea` | `@/components/ui/scroll-area` |
| `Resizable` | `@/components/ui/resizable` |

### Overlays & Feedback
| Component | Import |
|-----------|--------|
| `Dialog` | `@/components/ui/dialog` |
| `AlertDialog` | `@/components/ui/alert-dialog` |
| `Sheet` | `@/components/ui/sheet` — side-panel overlay |
| `Drawer` | `@/components/ui/drawer` — bottom sheet |
| `Popover` | `@/components/ui/popover` |
| `Tooltip` | `@/components/ui/tooltip` |
| `HoverCard` | `@/components/ui/hover-card` |
| `DropdownMenu` | `@/components/ui/dropdown-menu` |
| `Command` | `@/components/ui/command` |
| `Alert` | `@/components/ui/alert` |
| `toast` | `import { toast } from 'sonner'` |

### Data Display
| Component | Import |
|-----------|--------|
| `Table` | `@/components/ui/table` |
| `Avatar` | `@/components/ui/avatar` |
| `Progress` | `@/components/ui/progress` |
| `Skeleton` | `@/components/ui/skeleton` |
| `Carousel` | `@/components/ui/carousel` |

---

## Fitness Components — `@/components/fitness/`

| Component | Description |
|-----------|-------------|
| `WorkoutCard` | Card de treino na home. Exibe nome, exercicios, duracao, dificuldade |
| `ExerciseCard` | Card de exercicio dentro de um treino. Exibe nome, series, carga |
| `ExerciseHero` | Destaque do exercicio atual durante execucao (40% da tela) |
| `SeriesTracker` | Registro de series com botoes check/X/+ |
| `RestTimer` | Cronometro de descanso com progress ring |
| `ProgressRing` | Anel de progresso circular |
| `EvaluationCard` | Card de avaliacao fisica com medidas e fotos |
| `BodyMetricsCard` | Card compacto de metricas corporais |
| `WorkoutHistoryCard` | Card de historico de treino |
| `StudentCard` | Card de aluno no dashboard do professor |
| `EvolutionChartCard` | Card de grafico de evolucao |
| `GoalCard` | Card de meta do aluno |
| `AchievementCard` | Card de conquista |

---

## Fitness Components Usage

### WorkoutCard
```tsx
<WorkoutCard
  name="Upper A"
  exercises={6}
  duration={45}
  difficulty="intermediate"
  onStart={() => router.push(`/aluno/treinos/${id}`)}
/>
```

### SeriesTracker
```tsx
<SeriesTracker
  currentSeries={2}
  totalSeries={4}
  weight={20}
  reps={12}
  onComplete={() => handleComplete()}
  onFail={() => handleFail()}
/>
```

### RestTimer
```tsx
<RestTimer
  duration={60}
  onSkip={() => handleSkip()}
  onComplete={() => handleRestComplete()}
/>
```

---

## Mobile UX Principles

1. **One Action Per Screen** — Every screen has a single primary action
2. **Thumb First Design** — Primary actions in thumb zone (bottom-center)
3. **Touch targets** minimum 48x48dp, primary buttons 56x56dp+
4. **Auto-save** every series — never lose progress
5. **Progressive disclosure** — complexity revealed as user progresses

---

## Accessibility

- WCAG 2.1 AA minimum, AAA where viable
- Contrast: text-primary on background = 14.8:1 (AAA)
- All icons have ARIA labels
- Respects `prefers-reduced-motion`
- All units in `rem` for system font adjustments
