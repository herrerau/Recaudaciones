# 01 · Sistema de diseño y estilos

> Fuente original: `DESIGN.md` + `src/app/globals.css` del proyecto `trends-dashboard`.
> Los tokens listos para copiar están en [`assets/css/tokens.css`](./assets/css/tokens.css).

## 1. North Star creativo: "La sala de lectura financiera"

Una sala silenciosa donde los números se leen sin distracción. El sistema es **papel
neutro y tinta precisa**: superficies casi blancas (o casi negras en oscuro), hairlines
apenas perceptibles y **una sola voz de color por gráfico**. La interfaz desaparece;
la tendencia es lo único que queda. Densidad baja a propósito: un slide, una métrica,
una conclusión — el panel se consulta de un vistazo, a veces desde el otro lado de la sala.

Personalidad de marca: sobrio, profesional, preciso. Confianza de herramienta financiera.

## 2. Tokens de color (CSS custom properties)

Todos los colores se consumen vía variables CSS — nunca hex hardcodeado en componentes.
El tema oscuro se activa con `@media (prefers-color-scheme: dark)` y redefine las mismas
variables (ningún tema es "el secundario").

### Superficies y tinta

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--background` | `#f9f9f7` | `#0d0d0d` | Fondo del body ("papel") |
| `--surface-1` | `#fcfcfb` | `#1a1a19` | Tarjetas y tooltips ("papel elevado") |
| `--foreground` | `#0b0b0b` | `#ffffff` | Titulares, valores destacados |
| `--text-secondary` | `#52514e` | `#c3c2b7` | Subtítulos, texto de controles |
| `--text-muted` | `#6e6c66` | `#898781` | Etiquetas de eje y microtexto (≥12px, nunca párrafos) |
| `--gridline` | `#e1e0d9` | `#2c2c2a` | Grillas horizontales, hover de controles |
| `--axis` | `#c3c2b7` | `#383835` | Eje X, dots inactivos, cursor del tooltip |
| `--border-hairline` | `rgba(11,11,11,0.1)` | `rgba(255,255,255,0.1)` | TODOS los bordes (1px) |

### Semánticos (deltas)

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--delta-good` | `#006300` | `#0ca30c` | Variación positiva — exclusivo del indicador |
| `--delta-bad` | `#d03b3b` | `#e66767` | Variación negativa — mismo contrato |

### Series de datos (una por gráfico)

| Token | Claro | Oscuro | Velo (`-soft`) |
|---|---|---|---|
| `--series-1` (azul) | `#2a78d6` | `#3987e5` | rgba de la serie al 14% (claro) / 18% (oscuro) |
| `--series-2` (verde) | `#12855d` | `#199e70` | ídem |
| `--series-3` (ámbar) | `#b87700` | `#c98500` | ídem |

Las marcas gráficas cumplen ≥3:1 sobre `--surface-1` en ambos temas.

### Reglas con nombre (obligatorias)

- **The Data-Only Color Rule.** El color cromático (azul, verde, ámbar) vive únicamente
  dentro del gráfico. Si un botón, borde o fondo fuera del área de datos lleva color de
  serie, está prohibido.
- **The One Voice Rule.** Un gráfico, una serie, un color. Jamás dos series compitiendo
  en el mismo slide.
- **The Hairline Rule.** Todo borde es de 1px y usa `--border-hairline`. Bordes gruesos,
  dobles o de color están prohibidos.
- **The Weight-Not-Color Rule.** El énfasis se logra con peso (600–700) o tamaño, nunca
  con color cromático ni gradientes de texto.

## 3. Tipografía

- **Familia única:** Geist Sans (fallback `system-ui, -apple-system, "Segoe UI", sans-serif`),
  cargada con `next/font/google` y expuesta como `--font-geist-sans`. Geist Mono
  (`--font-geist-mono`) queda reservada a valores tabulares si hacen falta.
- Se trabaja **por peso, no por mezcla de fuentes**.

| Rol | Peso | Tamaño | Line-height | Uso |
|---|---|---|---|---|
| Headline | 700 | 1.5rem | 1.2 | Título del panel (h1) — uno por página |
| Title | 600 | 1.125rem | 1.3 | Título del slide (h2) |
| Metric | 600 | 1.5rem | 1.2 | Valor destacado del último mes |
| Body | 400 | 0.875rem | 1.5 | Subtítulos, controles, tooltip |
| Label | 500 | 0.75rem | 1.4 | Microtexto, etiquetas de eje |

## 4. Elevación, radios y espaciado

- **Plano con hairlines:** sin sombras estructurales. Profundidad = dos capas tonales
  (papel → papel elevado) selladas con borde hairline. Máximo permitido: `shadow-sm`
  ambiental en la tarjeta principal y el tooltip.
- **Radios:** `6px` (botones, tooltip), `12px` (tarjetas), `9999px` (dots).
- **Espaciado:** 8 / 12 / 16 / 24 px (xs/sm/md/lg). Padding de tarjeta: 24px (`p-6`).

## 5. Recetas de componentes

### Tarjeta principal
```
bg: var(--surface-1) · border: 1px var(--border-hairline) · rounded-xl · p-6 · shadow-sm
```

### Botón ghost (única variante)
```
bg transparente · texto var(--text-secondary) · borde hairline · rounded-md · px-3 py-1.5
hover: bg var(--gridline) con transition-colors · focus visible obligatorio
```

### Dots de navegación
```
h-2.5 w-2.5 rounded-full · activo = var(--foreground) · inactivo = var(--axis)
transición de color, sin escala
```

### Tooltip de gráfico
```
bg var(--surface-1) · borde hairline · rounded-md · px-3 py-2 · texto 14px
etiqueta del mes en var(--text-muted) + "Métrica: valor" en peso 500
cursor: línea discontinua var(--axis) (línea/área) o velo var(--gridline) al 50% (barras)
```

### Gráfico de tendencia (componente firma, Recharts)
- Grilla **solo horizontal** en `--gridline` a 1px; eje X en `--axis`; sin línea de eje Y
  (solo ticks numéricos en `--text-muted` a 12px, formateados es-VE).
- Trazo de serie a 2px; **sin dots en reposo**; punto activo `r=5` con anillo de `--surface-1`.
- Área: relleno con la variante `-soft` de su propia serie.
- Barras: radio superior 4px, `barCategoryGap="25%"`.
- Márgenes: `{ top: 8, right: 8, bottom: 0, left: 0 }`, `YAxis width={48}`.

## 6. Anti-patrones (prohibiciones explícitas)

- ❌ Gradient text (`background-clip: text` + gradiente) — nunca.
- ❌ Side-stripe borders (`border-left/right` >1px como acento de color).
- ❌ Glassmorphism decorativo (blur sin propósito funcional).
- ❌ Template hero-metric con gradiente y grids de cards idénticas.
- ❌ Dashboard SaaS de fondo crema con acentos morados; panel "war room" de neones.
- ❌ Eyebrows uppercase tracked sobre cada sección.
- ❌ Texto `--text-muted` para párrafos o por debajo de 12px.
- ❌ Sombras estructurales y z-index arbitrarios (999/9999).

## 7. Integración con Tailwind 4

Tailwind 4 no usa `tailwind.config.js`: el tema se declara en CSS con `@theme inline`
después de `@import "tailwindcss"`:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

El resto de variables se consumen con sintaxis arbitraria: `bg-[var(--surface-1)]`,
`border-[var(--border-hairline)]`, `text-[var(--text-secondary)]`, etc.
El archivo completo listo para copiar es [`assets/css/tokens.css`](./assets/css/tokens.css).
