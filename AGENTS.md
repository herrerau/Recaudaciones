# 02 · Dependencias, plugins y configuración de build

## 1. Stack exacto del proyecto origen

| Paquete | Versión | Rol |
|---|---|---|
| `next` | **16.2.10** | Framework (App Router) |
| `react` / `react-dom` | 19.2.4 | UI |
| `recharts` | ^3.9.2 | Gráficos (línea, área, barras) |
| `zustand` | ^5.0.14 | Estado global ligero (slides + paneles UI) |
| `tailwindcss` | ^4 | Estilos utilitarios |
| `@tailwindcss/postcss` | ^4 | Plugin PostCSS de Tailwind 4 |
| `typescript` | ^5 | Tipado |
| `eslint` + `eslint-config-next` | ^9 / 16.2.10 | Lint |

Instalación en el destino:

```bash
npm i next@16 react@19 react-dom@19 recharts@^3.9 zustand@^5
npm i -D tailwindcss@^4 @tailwindcss/postcss@^4 typescript@^5 eslint@^9 eslint-config-next@16
```

## 2. ⚠️ Advertencias de versión (importante)

- **Next 16 tiene breaking changes** respecto a Next 13/14: APIs, convenciones y
  estructura de archivos difieren. Antes de escribir código, consultar las guías en
  `node_modules/next/dist/docs/` del proyecto y atender los avisos de deprecación.
  (Esta regla vive en `AGENTS.md`/`CLAUDE.md` del origen y conviene replicarla.)
- **Tailwind 4 no usa `tailwind.config.js`.** La configuración es CSS-first:
  `@import "tailwindcss"` + `@theme inline` en el CSS global (ver doc 01).
- **Recharts 3** cambió tipos de tooltip: se usa `TooltipContentProps<ValueType, NameType>`
  importado de `recharts` y `recharts/types/component/DefaultTooltipContent`.

## 3. Archivos de configuración

### `postcss.config.mjs` (único plugin de build necesario)

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

### `next.config.ts`

```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {};
export default nextConfig;
```

Sin configuración extra: no hay rewrites, ni imágenes remotas, ni transpile.

### `tsconfig.json` — alias de imports

El código usa el alias `@/*` → `./src/*` (imports tipo `@/lib/trends-data`,
`@/store/ui-store`). Asegurar en el destino:

```jsonc
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### Fuentes (layout raíz)

```tsx
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
// <body className="min-h-full flex flex-col">
```

## 4. Scripts npm

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

## 5. Dependencias del lado de scripts/datos

Los scripts de exploración de Metabase (`scripts/metabase/`) usan **solo la stdlib de
Python 3** (`urllib.request`, `json`) y `bash + curl`. No hay que instalar nada:
decisión deliberada para que corran en servidores sin pip (ver doc 04).

## 6. Qué NO migrar

- `public/next.svg`, `vercel.svg`, `globe.svg`, `file.svg`, `window.svg` — restos del
  scaffold de create-next-app, sin uso.
- `tsconfig.tsbuildinfo`, `scripts/metabase/out/` — artefactos generados.
- Los datos mock de `src/lib/trends-data.ts` — en el destino los reemplaza la capa
  Metabase (solo se migran los **tipos**, ver doc 03).
