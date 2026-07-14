# SENIAT · Dashboard Fiscal en Tiempo Real

> Sistema de monitoreo y análisis de datos tributarios de la República Bolivariana de Venezuela, conectado a la API de Metabase.

---

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Tecnologías](#tecnologías)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Estructura del Repositorio](#estructura-del-repositorio)
- [Instalación y Configuración](#instalación-y-configuración)
- [Endpoints de la API](#endpoints-de-la-api)
- [Estructura de Datos](#estructura-de-datos)
- [Frontend — Dashboard](#frontend--dashboard)
- [Regiones y Consultas SQL](#regiones-y-consultas-sql)
- [Guía de Uso](#guía-de-uso)
- [Seguridad](#seguridad)
- [Solución de Problemas](#solución-de-problemas)
- [Próximas Mejoras](#próximas-mejoras)

---

## Descripción General

El **SENIAT Dashboard Fiscal** es un sistema de monitoreo en tiempo real que permite visualizar y analizar datos tributarios a través de la API de Metabase. Proporciona una visión integral de la recaudación fiscal, pagos, y actividad económica por región y aduana.

### Objetivos Principales

1. **Monitoreo en Tiempo Real** — Visualización instantánea de la actividad fiscal del día.
2. **Análisis Regional** — Desglose de recaudación por regiones y aduanas.
3. **Comparación Histórica** — Datos de hoy vs. ayer para identificar tendencias.
4. **Personalización de Paneles** — Pantallas configurables por usuario/región.
5. **Transparencia Fiscal** — Visualización clara de la actividad económica.

### Funcionalidades Clave

- Recaudación total en **Bolívares** y **USD** (tiempo real).
- Recaudación desglosada por **región** y por **aduana**.
- Top 10 **contribuyentes** del día.
- Datos del día anterior para comparación.
- Ticker tape con indicadores clave.
- Panel de administración para configurar pantallas personalizadas.
- Verificación de consistencia con los datos de Metabase.

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19, TypeScript |
| Estilos | CSS vanilla |
| Tipografía | Google Fonts (Inter) |
| Iconos | Font Awesome 6 |
| Base de datos | Oracle 19c (vía Metabase API) |
| Conexión a datos | Metabase API (`POST /api/dataset`) |

---

## Arquitectura del Sistema

```
┌─────────────────────────────┐
│  FRONTEND (Next.js)         │
│  · Panel Admin (/)          │
│  · Panel Usuario (/usuario) │
│  · Ticker Banner            │
│  · Tabla de Regiones        │
└──────────┬──────────────────┘
           │ HTTP / JSON (API Routes)
           ▼
┌─────────────────────────────┐
│  BACKEND (Next.js API)      │
│  · API Routes (TypeScript)  │
│  · Caché en memoria (30s)   │
│  · Motor de consultas SQL   │
└──────────┬──────────────────┘
           │ HTTPS / API Key
           ▼
┌─────────────────────────────┐
│  METABASE API               │
│  analisisdatos.seniat.gob.ve│
└──────────┬──────────────────┘
           │ SQL / Oracle
           ▼
┌─────────────────────────────┐
│  BASES DE DATOS ORACLE      │
│  · DataWarehouse (ID: 21)   │
│    └─ DBO.MOVIMIENTO_PAGO   │
│    └─ DATOSCONTRIBUYENTE    │
│  · SENIATFE (ID: 22)        │
│    └─ ITAXUSER.LIB_REPORTEZ │
└─────────────────────────────┘
```

### Flujo de Datos

1. El usuario accede al dashboard en el navegador.
2. Los componentes React realizan `fetch` a las API Routes de Next.js.
3. Las API Routes verifican la caché (30 segundos de validez).
4. Si la caché expiró, se consulta la API de Metabase.
5. Metabase ejecuta las consultas SQL en Oracle.
6. Las API Routes procesan, enriquecen y cachean los resultados.
7. Los componentes React reciben JSON y renderizan las visualizaciones.

---

## Estructura del Repositorio

```
Recaudaciones/
├── app/                            # Aplicación Next.js (App Router)
│   ├── page.tsx                    # Página principal (admin)
│   ├── layout.tsx                  # Layout raíz
│   ├── admin-panel.tsx             # Componente del panel admin
│   ├── admin.css                   # Estilos del panel admin
│   ├── usuario/                    # Página del dashboard por usuario
│   │   ├── page.tsx
│   │   ├── dashboard-usuario.tsx
│   │   └── dashboard.css
│   └── api/                        # API Routes (Next.js)
│       ├── datos/route.ts          # GET /api/datos
│       ├── status/route.ts         # GET /api/status
│       ├── ticker/route.ts         # GET /api/ticker
│       ├── recaudacion/route.ts    # GET /api/recaudacion
│       ├── recaudacion-ayer/route.ts
│       ├── regiones/route.ts       # GET /api/regiones
│       ├── aduanas/route.ts        # GET /api/aduanas
│       ├── contribuyentes/route.ts # GET /api/contribuyentes
│       ├── verificar/route.ts      # GET /api/verificar
│       └── admin/
│           ├── config/route.ts     # GET|POST /api/admin/config
│           └── guardar/route.ts    # POST /api/admin/guardar
├── lib/                            # Lógica de negocio compartida
│   ├── metabase.ts                 # Conexión a Metabase y consultas SQL
│   └── paneles.ts                  # Gestión de paneles por usuario
├── docs/                           # Documentación técnica
│   ├── METABASE_API.md             # Guía de uso de la API de Metabase
│   └── sql/                        # Consultas SQL de referencia
│       ├── declaraciones/
│       └── recaudaciones/
├── paneles_usuarios.json           # Configuración de paneles
├── .env.example                    # Plantilla de variables de entorno
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
└── next-env.d.ts
```

---

## Instalación y Configuración

### Requisitos

- **Node.js** 18+ y **npm**
- Navegador actualizado (Chrome, Firefox, Edge)
- Conexión a la red de SENIAT (para la API de Metabase)

### 1. Clonar el Repositorio

```bash
git clone https://github.com/herrerau/Recaudaciones.git
cd Recaudaciones
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Copiar el archivo de ejemplo y completar con las credenciales reales:

```bash
cp .env.example .env
```

Editar `.env` con los valores correspondientes:

```env
METABASE_URL="https://analisisdatos.seniat.gob.ve"
METABASE_API_KEY="<TU_API_KEY_AQUÍ>"
METABASE_DATABASE_ID=22
METABASE_DW_ID=21
CACHE_DURATION=30
```

> **Importante:** Nunca subas el archivo `.env` al repositorio. Está incluido en `.gitignore`.

### 4. Ejecutar en Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

### 5. Compilar para Producción

```bash
npm run build
npm start
```

---

## Endpoints de la API

Todos los endpoints son **API Routes de Next.js** y devuelven JSON.

### Endpoints de Datos

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/status` | Estado del servidor y configuración |
| `GET` | `/api/datos` | Todos los datos del sistema (con caché) |
| `GET` | `/api/ticker` | Datos para el banner ticker |
| `GET` | `/api/recaudacion` | Recaudación total del día (Bs y USD) |
| `GET` | `/api/recaudacion-ayer` | Recaudación del día anterior |
| `GET` | `/api/regiones` | Recaudación desglosada por región |
| `GET` | `/api/aduanas` | Recaudación desglosada por aduana |
| `GET` | `/api/contribuyentes` | Top 10 contribuyentes del día |
| `GET` | `/api/verificar` | Verificación de consistencia con Metabase |

### Endpoints de Administración

| Método | Ruta | Descripción |
|---|---|---|
| `GET` / `POST` | `/api/admin/config` | Obtener configuración de paneles |
| `POST` | `/api/admin/guardar` | Guardar configuración de un panel |

### Ejemplo de Respuesta — `GET /api/recaudacion`

```json
{
  "total_bs": 1234567.89,
  "total_usd": 34567.12,
  "pagos_sin_conciliar": 1520,
  "pagos_conciliados": 3200,
  "pagos_sin_conciliar_ayer": 1480
}
```

---

## Estructura de Datos

### Respuesta completa — `GET /api/datos`

```json
{
  "status": "success",
  "timestamp": "2026-07-14T10:30:00.000Z",
  "recaudacion": {
    "total_bs": 1234567.89,
    "total_usd": 34567.12,
    "pagos_sin_conciliar": 1520,
    "pagos_conciliados": 3200,
    "pagos_sin_conciliar_ayer": 1480
  },
  "ayer": {
    "recaudacion": {
      "total_bs": 1100000.00,
      "total_usd": 30000.00,
      "total_regiones": 950000.00,
      "total_aduanas": 150000.00,
      "pagos": 1480
    },
    "regiones": [ ... ],
    "aduanas": [ ... ],
    "fecha": "2026-07-13"
  },
  "regiones": [ ... ],
  "aduanas": [ ... ],
  "contribuyentes": [ ... ],
  "ticker": [ ... ],
  "configuracion": {
    "tipos_documento": 148,
    "filtro_situacion": "22",
    "filtro_conciliado": "N",
    "mensaje": "Usando EXACTAMENTE la misma lógica que Metabase"
  }
}
```

---

## Frontend — Dashboard

### Componentes Visuales

| Componente | Tecnología |
|---|---|
| Iconos | Font Awesome 6 |
| Tipografía | Google Fonts (Inter) |
| Diseño | CSS Grid responsive |
| Actualización | Cada 30 segundos (controlada por caché del backend) |

### Páginas

| Ruta | Descripción |
|---|---|
| `/` | Panel de administración — crear y gestionar pantallas |
| `/usuario?user=<ID>` | Dashboard personalizado por usuario/pantalla |

---

## Regiones y Consultas SQL

Las consultas SQL se ejecutan contra la base **DataWarehouse** (ID: 21) a través de la API de Metabase.

### Filtros aplicados (mismos que Metabase)

- `SITUACION_PAGO = '22'` — Pagos confirmados
- `CONCILIADO_PAGO = 'N'` — No conciliados (datos del día)
- `FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE)` — Solo fecha de hoy
- **148 tipos de documento** filtrados explícitamente

### Ejemplo de Consulta — Recaudación por Región

```sql
SELECT
    dep.NOMBRE_DEPENDENCIA AS REGION,
    SUM(p.MONTO_TOTAL_PAGO) AS TOTAL
FROM "DBO"."MOVIMIENTO_PAGO" p
LEFT JOIN "DATOSCONTRIBUYENTE"."DEPENDENCIA" dep
    ON p.DEPENDENCIA_PAGO = dep.CODIGO_DEPENDENCIA
WHERE p.FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE)
    AND p.SITUACION_PAGO = '22'
    AND p.CONCILIADO_PAGO = 'N'
    AND (TIPO_DOCUMENTO_PAGO = '00011' OR ...)
GROUP BY dep.NOMBRE_DEPENDENCIA
ORDER BY TOTAL DESC
```

> Para ver la lista completa de tipos de documento, consulte la constante `TIPOS_DOCUMENTO_METABASE` en [`lib/metabase.ts`](lib/metabase.ts).

---

## Guía de Uso

### Inicio del Sistema

1. Configurar el archivo `.env` (ver [Instalación](#instalación-y-configuración)).
2. Ejecutar `npm run dev`.
3. Abrir [http://localhost:3000](http://localhost:3000).
4. Verificar el indicador de conexión ("API local activa").

### Panel de Administración (`/`)

Desde este panel puedes:

- **Crear pantallas personalizadas** con un ID único.
- **Asignar regiones** específicas a cada pantalla.
- **Elegir componentes visibles** (recaudación, máquinas, declaraciones).
- **Obtener el enlace** de la pantalla para monitores/TV.

### Dashboard de Usuario (`/usuario?user=<ID>`)

Muestra los datos filtrados según la configuración de la pantalla:

- Tarjetas de recaudación con tendencias.
- Tabla de regiones asignadas con montos.
- Actualización automática cada 30 segundos.

---

## Seguridad

- **API Key**: Se almacena exclusivamente en `.env` (nunca en el código fuente).
- **`.env`** está en `.gitignore` para evitar exposición accidental.
- **Caché**: Los datos se mantienen en memoria, no se persisten en disco.
- **Conexión HTTPS**: Comunicación cifrada con la API de Metabase.

---

## Solución de Problemas

| Problema | Causa Probable | Solución |
|---|---|---|
| `npm run dev` falla | Dependencias no instaladas | Ejecutar `npm install` |
| El servidor no inicia | Puerto 3000 ocupado | Verificar con `netstat -ano \| findstr :3000` |
| Datos no cargan | Sin conexión a Metabase | Verificar conectividad y API Key en `.env` |
| Error HTTP 401/403 | Token inválido o revocado | Verificar `METABASE_API_KEY` en `.env` |
| Consultas SQL fallan | Tablas inexistentes o permisos | Revisar esquema (`DBO.` vs `ITAXUSER.`) |
| Caché no se actualiza | Tiempo de caché no expirado | Esperar 30 segundos o reiniciar el servidor |

---

## Próximas Mejoras

- [ ] Gráficas de tendencia interactivas (series temporales, barras comparativas).
- [ ] Dashboards configurables con widgets arrastrables.
- [ ] Autenticación de usuarios (login/roles).
- [ ] Exportación de datos (CSV, Excel, PDF).
- [ ] Alertas y notificaciones por umbral.
- [ ] Mapas de calor geográficos interactivos.

---

## Documentación Adicional

- [Guía de la API de Metabase](docs/METABASE_API.md) — Credenciales, endpoints y ejemplos de uso.
- [`.env.example`](.env.example) — Plantilla de variables de entorno.