# Sentinellium Brand Guidelines

> **Version 1.0** · February 2026
> The definitive brand bible for Sentinellium — the AI defense grid that sees what others can't.

---

## 1. Brand Essence

### The Name

**Sentinellium** fuses _Sentinel_ (a guard, a watcher) with the suffix _-ium_ (evoking a rare element, something foundational and irreducible). It speaks to permanence, vigilance, and elemental strength.

### Brand Promise

> _"Intelligence at the edge. Privacy at the core."_

Sentinellium is the invisible guardian — AI security that runs on your hardware, sees through deception, and never phones home. It transforms every browser into a fortress, every GPU into a security analyst.

### Core Values

| Value                     | Expression                                                |
| ------------------------- | --------------------------------------------------------- |
| **Privacy-First**         | Zero cloud inference. Your data never leaves your device. |
| **Proactive Defense**     | We don't react to threats — we anticipate them.           |
| **Transparency**          | Open provenance. Verifiable trust. No black boxes.        |
| **Enterprise Resilience** | Built for the SOC, trusted by the CISO.                   |
| **Edge Intelligence**     | The thick client renaissance — compute where it matters.  |

### Brand Personality

Sentinellium is a **composed, authoritative, technically brilliant** presence. Think: a senior threat analyst who speaks in clean, direct sentences — never alarmist, always precise. The brand feels like a control room at 3 AM — calm, illuminated, watching everything.

---

## 2. Logo

### Primary Mark

The Sentinellium logo is a geometric shield-eye hybrid — a hexagonal shield form containing a stylized iris/pupil that doubles as a neural network node graph. It communicates vigilance, intelligence, and protection in a single glyph.

### Logo Variants

| Variant           | Usage                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| **Full lockup**   | Logo mark + wordmark. Primary usage for headers, documentation, marketing.                          |
| **Mark only**     | Shield-eye glyph alone. For favicons, app icons, extension badges, small surfaces.                  |
| **Wordmark only** | Logotype without mark. For inline text references, footers, dense layouts.                          |
| **Monochrome**    | Single-color version (Sentinel White or Void Black). For overlays, watermarks, restricted palettes. |

### Clear Space & Minimum Size

- **Clear space**: Maintain padding equal to the height of the "S" in the wordmark on all sides.
- **Minimum size**: Mark only — 24×24px. Full lockup — 120px wide.
- **Never**: Stretch, rotate, add drop shadows, place on busy backgrounds without contrast overlay, or alter proportions.

### Logo on Backgrounds

| Background                     | Logo Version                                  |
| ------------------------------ | --------------------------------------------- |
| Dark surfaces (Void, Obsidian) | Sentinel White mark + Plasma Cyan wordmark    |
| Light surfaces (White, Ash)    | Void Black mark + Obsidian wordmark           |
| Gradient backgrounds           | Monochrome white with backdrop blur           |
| Photography                    | Monochrome white with dark overlay underneath |

---

## 3. Color Palette

### Primary Colors

```css
:root {
  /* ── Core Identity ── */
  --sentinel-cyan: hsl(
    192,
    100%,
    55%
  ); /* #1AC8FF — The signature. Plasma energy. */
  --sentinel-cyan-glow: hsl(192, 100%, 65%); /* #4DD4FF — Hover/active state */
  --sentinel-cyan-dim: hsl(192, 60%, 35%); /* #245C6B — Muted references */

  /* ── Dark Foundation ── */
  --void-black: hsl(220, 25%, 6%); /* #0D0F14 — Deepest background */
  --obsidian: hsl(220, 20%, 10%); /* #151820 — Card/panel bg */
  --graphite: hsl(220, 15%, 15%); /* #1F2229 — Elevated surfaces */
  --slate: hsl(220, 10%, 25%); /* #3A3D44 — Borders, dividers */

  /* ── Text Hierarchy ── */
  --sentinel-white: hsl(210, 20%, 95%); /* #EDF0F5 — Primary text */
  --ash: hsl(210, 10%, 65%); /* #9CA3AF — Secondary text */
  --smoke: hsl(210, 8%, 45%); /* #6B7280 — Tertiary/disabled */
}
```

### Semantic Colors

```css
:root {
  /* ── Threat Severity ── */
  --severity-critical: hsl(
    0,
    85%,
    55%
  ); /* #E63946 — Immediate action required */
  --severity-high: hsl(25, 95%, 55%); /* #F77F00 — Urgent attention */
  --severity-medium: hsl(45, 90%, 55%); /* #FCBF49 — Monitor closely */
  --severity-low: hsl(160, 60%, 45%); /* #2D9C6F — Informational */

  /* ── Status ── */
  --status-verified: hsl(145, 70%, 50%); /* #34D058 — C2PA verified, healthy */
  --status-unverified: hsl(35, 90%, 55%); /* #E8A317 — Provenance unknown */
  --status-blocked: hsl(0, 75%, 55%); /* #D94040 — DLP blocked */
  --status-scanning: var(--sentinel-cyan); /* Active analysis */
}
```

### Gradients

```css
:root {
  --gradient-plasma: linear-gradient(
    135deg,
    hsl(192, 100%, 55%) 0%,
    hsl(260, 80%, 60%) 100%
  );
  --gradient-shield: linear-gradient(
    180deg,
    hsl(220, 25%, 12%) 0%,
    hsl(220, 25%, 6%) 100%
  );
  --gradient-threat: linear-gradient(
    135deg,
    hsl(0, 85%, 55%) 0%,
    hsl(25, 95%, 55%) 100%
  );
  --gradient-mesh:
    radial-gradient(
      ellipse at 20% 80%,
      hsla(192, 100%, 55%, 0.08) 0%,
      transparent 50%
    ),
    radial-gradient(
      ellipse at 80% 20%,
      hsla(260, 80%, 60%, 0.06) 0%,
      transparent 50%
    );
}
```

### Color Usage Rules

> [!IMPORTANT]
>
> - **Sentinel Cyan** is the hero color — use it for primary actions, key indicators, and the logo glow. Never use it for body text.
> - **Severity colors** are sacred — they must map 1:1 to threat levels. Never use red for non-critical items.
> - Dark mode is the default. Light mode must maintain the same visual hierarchy and contrast ratios (WCAG AAA ≥ 7:1 for text).

---

## 4. Typography

### Font Stack

| Role                    | Font                                                           | Weight        | Fallback                 |
| ----------------------- | -------------------------------------------------------------- | ------------- | ------------------------ |
| **Display / Headlines** | [Clash Display](https://www.fontshare.com/fonts/clash-display) | 600, 700      | `system-ui, sans-serif`  |
| **Body / UI**           | [Satoshi](https://www.fontshare.com/fonts/satoshi)             | 400, 500, 700 | `system-ui, sans-serif`  |
| **Code / Data**         | [JetBrains Mono](https://www.jetbrains.com/lp/mono/)           | 400, 500      | `'Fira Code', monospace` |

### Type Scale

```css
:root {
  --text-xs: 0.75rem; /* 12px — Captions, metadata */
  --text-sm: 0.875rem; /* 14px — Secondary text, labels */
  --text-base: 1rem; /* 16px — Body text */
  --text-lg: 1.125rem; /* 18px — Lead paragraphs */
  --text-xl: 1.25rem; /* 20px — Section titles */
  --text-2xl: 1.5rem; /* 24px — Card headers */
  --text-3xl: 1.875rem; /* 30px — Page titles */
  --text-4xl: 2.25rem; /* 36px — Hero titles */
  --text-5xl: 3rem; /* 48px — Display headlines */

  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
}
```

### Typography Rules

- **Headlines**: Clash Display, 600–700 weight, `--leading-tight`. Uppercase sparingly — only for badges and status labels.
- **Body**: Satoshi 400 with `--leading-normal`. Max line length: 72ch.
- **Data/Code**: JetBrains Mono for all numeric values, API keys, hash digests, and code samples.
- **Tabular numbers**: Always enable `font-variant-numeric: tabular-nums` for data tables and dashboards.

---

## 5. Spacing & Layout

### Spacing Scale

```css
:root {
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-5: 1.25rem; /* 20px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-10: 2.5rem; /* 40px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */
}
```

### Border Radius

```css
:root {
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
}
```

### Surface Elevation (Dark Mode)

| Level | Background     | Border                               | Shadow                       | Usage               |
| ----- | -------------- | ------------------------------------ | ---------------------------- | ------------------- |
| 0     | `--void-black` | none                                 | none                         | Page background     |
| 1     | `--obsidian`   | `1px solid var(--slate)`             | `0 1px 3px rgba(0,0,0,0.4)`  | Cards, panels       |
| 2     | `--graphite`   | `1px solid var(--slate)`             | `0 4px 12px rgba(0,0,0,0.5)` | Dropdowns, popovers |
| 3     | `--graphite`   | `1px solid var(--sentinel-cyan-dim)` | `0 8px 32px rgba(0,0,0,0.6)` | Modals, alerts      |

---

## 6. Iconography

### Style

- **Stroke-based** icons, 1.5px stroke weight at 24×24 grid with 2px padding
- Rounded line caps and joins
- Consistent with [Lucide](https://lucide.dev/) icon library

### Custom Icons

| Icon              | Meaning                                     |
| ----------------- | ------------------------------------------- |
| Shield-Eye        | Sentinellium brand mark / active protection |
| Brain-Circuit     | AI inference / model processing             |
| Scan-Eye          | Phishing analysis active                    |
| Fingerprint-Check | C2PA verified media                         |
| Lock-KeyHole      | DLP protection active                       |
| Grid-3x3          | Fleet view / multi-instance                 |
| Activity-Pulse    | Real-time telemetry                         |

### Icon Color Rules

- **Default**: `var(--ash)` — neutral, non-interactive
- **Interactive**: `var(--sentinel-white)` on hover
- **Active**: `var(--sentinel-cyan)` — currently selected / active protection
- **Semantic**: Use severity colors only for alert/status icons

---

## 7. Motion & Animation

### Timing

```css
:root {
  --duration-instant: 100ms;
  --duration-fast: 200ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Key Animations

| Element         | Animation                  | Duration            |
| --------------- | -------------------------- | ------------------- |
| Alert cards     | Slide in from right + fade | `--duration-normal` |
| Threat score    | Counter roll-up            | `--duration-slow`   |
| Scan indicator  | Pulsing cyan ring          | `2s infinite`       |
| Extension badge | Color transition on threat | `--duration-fast`   |
| Modal open      | Scale 0.95→1 + fade        | `--duration-normal` |
| Data loading    | Skeleton shimmer           | `1.5s infinite`     |

---

## 8. Voice & Tone

### Writing Principles

| Principle   | Do                                                    | Don't                                                       |
| ----------- | ----------------------------------------------------- | ----------------------------------------------------------- |
| **Direct**  | "3 phishing threats blocked today"                    | "We're happy to report that our system has successfully..." |
| **Precise** | "Severity: Critical — credential harvesting detected" | "Something suspicious was found"                            |
| **Calm**    | "Action recommended: review flagged items"            | "🚨 DANGER! THREAT DETECTED! ACT NOW!"                      |
| **Human**   | "No threats found. You're clear."                     | "Zero (0) threats detected in the current session."         |

### Alert Copy Hierarchy

```
[SEVERITY] — [WHAT HAPPENED]
[WHERE] · [WHEN]
[RECOMMENDED ACTION]
```

---

## 9. Light Mode

```css
[data-theme="light"] {
  --void-black: hsl(210, 20%, 98%); /* #F8FAFC */
  --obsidian: hsl(210, 20%, 95%); /* #EDF0F5 */
  --graphite: hsl(210, 15%, 90%); /* #E2E6EC */
  --slate: hsl(210, 10%, 80%); /* #C9CDD5 */
  --sentinel-white: hsl(220, 25%, 10%); /* #151820 */
  --ash: hsl(210, 10%, 40%); /* #5F6673 */
  --smoke: hsl(210, 8%, 60%); /* #929AA6 */
  --sentinel-cyan: hsl(192, 100%, 35%); /* #0098B8 — Darker for contrast */
}
```

---

## 10. Accessibility

- **WCAG 2.2 AA** minimum, **AAA** target for text contrast
- Visible focus indicators: `2px solid var(--sentinel-cyan)`, `outline-offset: 2px`
- Screen reader announcements: `role="alert"` + `aria-live="assertive"` for security alerts
- Full keyboard navigation
- `@media (prefers-reduced-motion: reduce)` support
- Color never the sole indicator — always pair with text and/or iconography

---

## 11. Co-Branding

- Sentinellium logo at equal or greater size than partner marks
- Clear space between marks: minimum 2× the "S" height
- Never merge the Sentinellium mark with another logo
- Partner integrations use `Powered by Sentinellium` lockup (SVG provided)

---

## 12. Marketing Taglines

- _"Intelligence at the edge. Privacy at the core."_
- _"Your GPU is the new SOC."_
- _"The browser extension that thinks like an analyst."_
- _"Zero cloud. Zero latency. Zero compromise."_
