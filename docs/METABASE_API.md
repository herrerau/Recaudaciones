# 04 · Conexión con la API de Metabase (SENIAT) — conocimiento operativo

> El proyecto destino ya tiene su capa de conexión organizada; este documento traslada
> **lo aprendido operando contra la instancia real** para contrastarlo con esa capa:
> endpoints, límites, errores frecuentes y el mapa de bases/esquemas.
> Referencias completas en el origen: `METABASE_API.md` y `METABASE_INSTANCIA_SENIAT.md`.

## 1. Instancia

| Atributo | Valor |
|---|---|
| URL pública | `https://analisisdatos.seniat.gob.ve` |
| URL alterna (red interna) | `http://172.16.56.75:3000` |
| Versión | Metabase v0.54.9 (Docker) |
| Auth | Header `x-api-key: <token>` (usuario API superuser) |
| Embedding JWT | Habilitado (`POST /api/embed/card/{jwt}/query`) |
| Zona horaria de reportes | `America/La_Paz` |

⚠️ El token NO viaja en este kit. Variables esperadas en `.env` (git-ignored):
`METABASE_URL`, `METABASE_URL_ALT`, `METABASE_API_KEY`, `METABASE_DATABASE_ID=22`,
`METABASE_SCHEMA=ITAXUSER`, `METABASE_DW_ID=21`.

## 2. Endpoints que la capa debe cubrir

| Método | Ruta | Uso |
|---|---|---|
| `GET` | `/api/user/current` | Health check del token (esperar 200) |
| `POST` | `/api/dataset` | Ejecutar SQL nativo — el caballo de batalla |
| `GET` | `/api/search?q=<nombre>` | Buscar tablas por nombre |
| `GET` | `/api/table/<id>/query_metadata` | Columnas y tipos de una tabla |
| `GET` | `/api/database/<id>/metadata` | Inventario de esquemas/tablas |

### Cuerpo canónico de `POST /api/dataset`

```json
{
  "database": 22,
  "type": "native",
  "native": { "query": "SELECT ... FROM ITAXUSER.LIB_REPORTEZ WHERE ROWNUM <= 10" },
  "parameters": [],
  "constraints": { "max-results": 10000, "max-results-bare-rows": 10000 }
}
```

### Respuestas

- Éxito: `{"status":"completed","data":{"cols":[...],"rows":[[...]]},"row_count":N}`.
- Error: `{"status":"failed","error":"ORA-..."}` — **ojo:** según la versión el mensaje
  puede venir en `via[0].error`. La capa debe revisar ambos:

```python
if result.get("status") == "failed" or result.get("error"):
    err = result.get("error") or (result.get("via") or [{}])[0].get("error")
    raise RuntimeError(f"Consulta fallida: {err}")
```

El cliente Python de referencia (stdlib pura, carga `.env` sin dependencias) está en
[`assets/code/metabase_client.py`](./assets/code/metabase_client.py).

## 3. Mapa de bases → casos de uso

| Caso de uso | Base (ID) | Esquema.tablas clave |
|---|---|---|
| Declaraciones tributarias (IVA=impuesto 30, ISLR) | ORACLE 19c DataWarehouse (**21**) | `DBO.DECLARACION`, `DBO.MOVIMIENTO_PAGO`, `DBO.COMPROMISO_PAGO`, `DBO.TASA_CAMBIO_DIARIA` |
| Contribuyentes y regiones (GRTI) | **21** | `DATOSCONTRIBUYENTE.CONTRIBUYENTE`, `REGION`, `DEPENDENCIA` |
| Facturación electrónica / Reportes Z | SENIATFE (**22**) | `ITAXUSER.LIB_REPORTEZ` (~158 columnas), `CONT_MAQUINAS_FISCALES`, `CONT_CONTRIBUYENTES`, `CONT_SUCURSALES` |
| Software fiscal / validaciones | FISCADB (**23**, postgres) | `reporte_fiscal`, `fiscales`, `softwares_registrados` |
| Repositorio DW / aranceles | DWREPO (**25**) | `EXCOEX.*` |

Errores de esquema típicos: en la 22 el esquema es `ITAXUSER.`, en la 21 es `DBO.` o
`DATOSCONTRIBUYENTE.` — mezclar prefijos produce `ORA-00942`.

## 4. Consultas SQL de las colecciones (insumo directo)

La carpeta [`assets/sql/`](./assets/sql/) contiene las **28 consultas** de las
colecciones Metabase del origen: recaudación y declaraciones por GRTI (Capital,
Central, Zuliana, Los Andes, Los Llanos, Falcón, Guayana, Insular, Nor Oriental,
Occidental, Libertador, Contribuyentes Especiales), recaudación nacional, pagos y
aduanas. Son el punto de partida de las series del dashboard en el destino.

## 5. Límites y buenas prácticas de consulta (aprendidas a golpes)

1. **Nunca `SELECT *` ni `COUNT(*)` sin filtro de fecha** en tablas grandes
   (`LIB_REPORTEZ` es una tabla de hechos masiva).
2. **Rango de fechas cerrado**: `FECHA >= DATE '...' AND FECHA < DATE '...'`
   (evita problemas de bordes y usa particiones/índices).
3. **`ROWNUM <= N`** para muestras exploratorias (Oracle; no hay `LIMIT`).
4. **`constraints` siempre** en el body para acotar filas devueltas.
5. **Timeout de 600 s** en el cliente para consultas pesadas; si aún así expira,
   dividir en fases/lotes (por mes o por rangos de ID) en vez de un JOIN masivo.
6. **Extracciones masivas**: particionar por mes; nunca una sola llamada gigante.
7. Preferir la URL principal y probar la alterna como fallback
   (patrón `METABASE_URL_OK` del cliente de referencia).

## 6. Tabla de diagnóstico rápido

| Síntoma | Causa probable | Acción |
|---|---|---|
| HTTP 000 / sin respuesta | Sin ruta de red a esa URL | Probar la URL alterna |
| HTTP 401 / 403 | Token inválido o revocado | Revisar `.env`, rotar token |
| `status: failed` + `ORA-00942` | Tabla/esquema equivocado | Confirmar prefijo (`ITAXUSER.` vs `DBO.`) |
| `ORA-00904` | Columna inexistente | Ver columnas con una consulta `ROWNUM <= 1` |
| Timeout / HTTP 504 | Consulta demasiado pesada | Acotar fechas, ROWNUM, dividir en lotes |

Health check de un comando:

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  -H "x-api-key: $METABASE_API_KEY" "$METABASE_URL/api/user/current"
```

## 7. Conectividad (contexto de red)

Desde los servidores del proyecto **solo funciona la vía Metabase**; el acceso Oracle
directo (SENIATFE `172.17.34.131`, DWREPO `172.16.32.73`) no tiene ruta de red o
depende de VPN. La capa de datos del destino debe asumir Metabase como única puerta.

## 8. Seguridad del token

- El token identifica a un usuario **superuser**: tratarlo como credencial crítica.
- Solo en `.env` (git-ignored) o en un gestor de secretos; jamás en el bundle del
  cliente (las consultas se hacen **del lado servidor**), ni en chats/repos.
- Rotarlo en Metabase si se expone o deja de usarse.
- Si se necesita exponer datos al navegador, usar el embedding JWT de cards en lugar
  de reenviar el api-key.
