# API Metabase — Guía de uso (SENIAT FE Exploración)

Documento de referencia para consultar datos Oracle a través de la instancia Metabase desde este servidor/proyecto.

> **Fuente de verdad:** las variables viven en `.env` (archivo ignorado por git). Este documento replica los valores operativos vigentes.

---

## 1. Credenciales y parámetros

| Parámetro | Variable de entorno | Valor |
|---|---|---|
| URL principal | `METABASE_URL` | `https://analisisdatos.seniat.gob.ve` |
| URL alterna (red interna) | `METABASE_URL_ALT` | `http://172.16.56.75:3000` |
| API Key (token) | `METABASE_API_KEY` | *(ver archivo `.env`)* |
| Usuario asociado al token | — | `API SENIATFE` (superuser) |
| Base SENIAT FE | `METABASE_DATABASE_ID` | `22` |
| Nombre base SENIAT FE | `METABASE_DATABASE_NAME` | `SENIATFE` |
| Esquema SENIAT FE | `METABASE_SCHEMA` | `ITAXUSER` |
| Base DataWarehouse | `METABASE_DW_ID` | `21` |
| Nombre DataWarehouse | `METABASE_DW_NAME` | `ORACLE 19c DataWarehouse` |

### Cargar variables en la shell

```bash
cd /home/k8s/seniatfeexploracion
set -a && source .env && set +a
```

O exportar manualmente:

```bash
export METABASE_URL="https://analisisdatos.seniat.gob.ve"
export METABASE_API_KEY="<TU_API_KEY_AQUÍ>"  # ver .env.example
export METABASE_DATABASE_ID=22
export METABASE_SCHEMA=ITAXUSER
export METABASE_DW_ID=21
```

---

## 2. Autenticación

Metabase acepta el token en el header HTTP:

```
x-api-key: <METABASE_API_KEY>
Content-Type: application/json
```

No se usa usuario/contraseña en las llamadas API; el token identifica al usuario `API SENIATFE`.

---

## 3. Verificar conexión

### Usuario actual (health check)

```bash
curl -s -H "x-api-key: $METABASE_API_KEY" \
  "$METABASE_URL/api/user/current" | python3 -m json.tool
```

Respuesta esperada: HTTP `200` con JSON del usuario (`email`, `is_superuser`, etc.).

### Consulta mínima a SENIATFE

```bash
curl -s -X POST \
  -H "x-api-key: $METABASE_API_KEY" \
  -H "Content-Type: application/json" \
  "$METABASE_URL/api/dataset" \
  -d '{
    "database": 22,
    "type": "native",
    "native": {
      "query": "SELECT ID_LIB_REPORTEZ, FECHA_REPORTEZ FROM ITAXUSER.LIB_REPORTEZ WHERE ROWNUM <= 1"
    },
    "parameters": []
  }' | python3 -m json.tool
```

---

## 4. Endpoints utilizados en este proyecto

| Método | Ruta | Uso |
|---|---|---|
| `GET` | `/api/user/current` | Verificar token y usuario |
| `POST` | `/api/dataset` | Ejecutar SQL nativo (principal) |
| `GET` | `/api/search?q=<nombre>` | Buscar tablas por nombre |
| `GET` | `/api/table/<table_id>/query_metadata` | Columnas y metadatos de una tabla |

---

## 5. Ejecutar consultas SQL (`POST /api/dataset`)

### Cuerpo de la petición

```json
{
  "database": 22,
  "type": "native",
  "native": {
    "query": "SELECT ... FROM ITAXUSER.LIB_REPORTEZ WHERE ROWNUM <= 10"
  },
  "parameters": [],
  "constraints": {
    "max-results": 10000,
    "max-results-bare-rows": 10000
  }
}
```

| Campo | Descripción |
|---|---|
| `database` | ID de la base en Metabase (`22` = SENIATFE, `21` = DataWarehouse) |
| `type` | Siempre `"native"` para SQL directo |
| `native.query` | Consulta SQL Oracle |
| `parameters` | Lista vacía si no hay parámetros de Metabase |
| `constraints` | Opcional; limita filas devueltas (recomendado en tablas grandes) |

### Respuesta exitosa

```json
{
  "status": "completed",
  "data": {
    "cols": [{"name": "ID_LIB_REPORTEZ", ...}],
    "rows": [[12345, "2025-01-15T00:00:00+00:00"]]
  },
  "row_count": 1
}
```

### Respuesta con error

```json
{
  "status": "failed",
  "error": "ORA-00942: table or view does not exist"
}
```

O en `via[0].error` según la versión de Metabase.

---

## 6. Bases de datos disponibles

### 6.1 SENIATFE (`database: 22`)

Esquema principal: **`ITAXUSER`**.

Tablas clave del proyecto:

| Tabla | Descripción |
|---|---|
| `LIB_REPORTEZ` | Reportes Z (tabla de hechos, ~158 columnas) |
| `CONT_CONTRIBUYENTES` | Contribuyentes |
| `CONT_MAQUINAS_FISCALES` | Máquinas fiscales |
| `CONT_SUCURSALES` | Sucursales |
| `CONT_DISTRIBUIDOR` | Distribuidores |
| `CONT_MODELO_DISTRIBUIDOR` | Relación distribuidor ↔ modelo |

Ejemplo — conteo de reportes Z:

```bash
curl -s -X POST \
  -H "x-api-key: $METABASE_API_KEY" \
  -H "Content-Type: application/json" \
  "$METABASE_URL/api/dataset" \
  -d '{
    "database": 22,
    "type": "native",
    "native": {
      "query": "SELECT COUNT(*) AS TOTAL FROM ITAXUSER.LIB_REPORTEZ WHERE FECHA_REPORTEZ >= DATE '\''2025-01-01'\'' AND FECHA_REPORTEZ < DATE '\''2026-01-01'\''"
    }
  }'
```

### 6.2 ORACLE 19c DataWarehouse (`database: 21`)

Usada para **declaraciones tributarias** (IVA, ISLR, etc.).

Esquemas relevantes:

| Esquema | Contenido |
|---|---|
| `DBO` | `DECLARACION` y tablas del núcleo declarativo |
| `DATOSCONTRIBUYENTE` | `CONTRIBUYENTE`, `DEPENDENCIA`, `REGION` |

Ejemplo — declaraciones IVA (impuesto 30):

```bash
curl -s -X POST \
  -H "x-api-key: $METABASE_API_KEY" \
  -H "Content-Type: application/json" \
  "$METABASE_URL/api/dataset" \
  -d '{
    "database": 21,
    "type": "native",
    "native": {
      "query": "SELECT ID_DECLARACION, RIF_DECLARACION, FECHA_INICIO_PERIODO_D FROM DBO.DECLARACION WHERE IMPUESTO_DECLARACION = '\''30'\'' AND ROWNUM <= 5"
    }
  }'
```

### 6.3 Otras bases visibles en la instancia

| ID | Nombre | Motor | Notas |
|---|---|---|---|
| 22 | SENIATFE | oracle | Facturación electrónica / reportes Z |
| 21 | ORACLE 19c DataWarehouse | oracle | Declaraciones |
| 25 | ORACLE 19c DWREPO | oracle | Repositorio DW |
| 23 | FISCADB | postgres | — |
| 27 | Datax - Region Central | oracle | — |

---

## 7. Ejemplo de uso en TypeScript (Next.js)

La lógica de consultas vive en [`lib/metabase.ts`](../lib/metabase.ts). A continuación un ejemplo simplificado:

```typescript
import { metabaseQuery } from "@/lib/metabase";

// Consulta genérica
const rows = await metabaseQuery(
  `SELECT ID_LIB_REPORTEZ, FECHA_REPORTEZ
   FROM ITAXUSER.LIB_REPORTEZ
   WHERE ROWNUM <= 3`,
  22 // database ID
);
console.log(rows);
```

Las funciones exportadas por `lib/metabase.ts` (como `getRecaudacionTotalBs()`, `getRecaudacionRegionesHoy()`, etc.) ya encapsulan las consultas SQL y el parseo de resultados.

---

## 8. Ejecución del proyecto

### Instalar dependencias e iniciar

```bash
npm install
npm run dev
```

El servidor estará disponible en [http://localhost:3000](http://localhost:3000).

### Compilar para producción

```bash
npm run build
npm start
```
---

## 9. Buenas prácticas y límites

### Tablas grandes (`LIB_REPORTEZ`)

- **No** ejecutar `SELECT *` ni `COUNT(*)` sin filtro de fecha.
- Filtrar siempre por `FECHA_REPORTEZ` con rango cerrado (`>=` … `<`).
- Usar `ROWNUM <= N` para muestras exploratorias.
- Para extracciones masivas, particionar por mes o por lotes de IDs.

### Timeouts

- Consultas pesadas pueden tardar varios minutos; usar timeout de **600 s** en Python.
- Si hay timeout por JOINs masivos, dividir en fases (como hace `extraer_declaraciones.py`).

### Límite de filas

Usar `constraints` en el body para acotar resultados:

```json
"constraints": {
  "max-results": 50000,
  "max-results-bare-rows": 50000
}
```

### Conectividad

| Vía | ¿Funciona desde este servidor? |
|---|---|
| Metabase API (`analisisdatos.seniat.gob.ve`) | **Sí** |
| Oracle directo SENIATFE (`172.17.34.131`) | **No** (sin ruta de red) |
| Oracle directo DWREPO (`172.16.32.73`) | Depende de red/VPN |

Metabase es la **vía operativa recomendada** desde este ambiente.

---

## 10. Solución de problemas

| Síntoma | Causa probable | Acción |
|---|---|---|
| HTTP 401 / 403 | Token inválido o revocado | Verificar `METABASE_API_KEY` en `.env` |
| `Falta METABASE_API_KEY` | Variable no exportada | `source .env` antes de ejecutar scripts |
| `status: failed` + ORA-* | Error SQL o tabla inexistente | Revisar esquema (`ITAXUSER.` vs `DBO.`) |
| Timeout / HTTP 504 | Consulta muy pesada | Acotar fechas, usar `ROWNUM`, dividir en lotes |
| Tabla no encontrada en search | Nombre o esquema incorrecto | Confirmar `METABASE_SCHEMA=ITAXUSER` |

### Comando rápido de diagnóstico

```bash
set -a && source .env && set +a
echo "URL: $METABASE_URL"
echo "DB SENIATFE: $METABASE_DATABASE_ID | DW: $METABASE_DW_ID"
curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  -H "x-api-key: $METABASE_API_KEY" \
  "$METABASE_URL/api/user/current"
```

---

## 11. Seguridad

- El token es de un usuario **superuser**; tratarlo como credencial sensible.
- `.env` está en `.gitignore` — no subir el token a repositorios públicos.
- Si este `.md` se versiona en git, valorar referenciar solo `.env` o usar un gestor de secretos.
- Rotar el token en Metabase si se expone o deja de usarse.

---

## 12. Referencias en el repositorio

- `.env` — credenciales y IDs de bases (no versionado)
- `.env.example` — plantilla de variables de entorno
- `lib/metabase.ts` — lógica de conexión a Metabase y consultas SQL
- `lib/paneles.ts` — gestión de paneles por usuario
- `docs/sql/` — consultas SQL de referencia
