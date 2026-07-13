# SENIAT · Dashboard Fiscal en Tiempo Real
## Sistema de Monitoreo y Análisis de Datos Tributarios

================================================================================
INDICE
================================================================================

1. Descripcion General
2. Arquitectura del Sistema
3. Componentes del Backend
4. Endpoints API
5. Estructura de Datos
6. Frontend Dashboard
7. Regiones y Consultas SQL
8. Instalacion y Configuracion
9. Guia de Uso
10. Seguridad y Buenas Practicas
11. Solucion de Problemas
12. Proximas Mejoras

================================================================================
1. DESCRIPCION GENERAL
================================================================================

Vision del Sistema
------------------
El SENIAT Dashboard Fiscal es un sistema de monitoreo en tiempo real que permite 
visualizar y analizar datos tributarios de la Republica Bolivariana de Venezuela 
a traves de la API de Metabase. El sistema esta diseñado para proporcionar una 
vision integral de la recaudacion fiscal, declaraciones tributarias y actividad 
economica por region.

Objetivos Principales
---------------------
1. Monitoreo en Tiempo Real: Visualizacion instantanea de la actividad fiscal
2. Analisis Regional: Desglose de datos por regiones politico-tributarias
3. Tendencias y Proyecciones: Identificacion de patrones y estimaciones futuras
4. Toma de Decisiones: Herramienta para analistas y autoridades tributarias
5. Transparencia Fiscal: Visualizacion clara de la actividad economica

Funcionalidades Clave
---------------------
- Recaudacion Total: Visualizacion de montos recaudados en tiempo real
- Declaraciones por Region: Desglose detallado de declaraciones en 13 regiones
- Maquinas Fiscales: Estado y distribucion de equipos fiscales
- Ticker Tape: Banner continuo con variaciones porcentuales
- Graficas de Tendencia: Evolucion historica de recaudacion
- Proyecciones: Estimaciones basadas en tendencias actuales
- Distribucion por Impuesto: Desglose por tipo de tributo
- Estado de Declaraciones: Pagadas, pendientes, vencidas, en proceso

================================================================================
2. ARQUITECTURA DEL SISTEMA
================================================================================

Diagrama de Arquitectura
------------------------
FRONTEND (Dashboard)
  - Ticker Banner
  - Mapa de Calor
  - Graficas de Series
  - Tabla de Regiones
  - Detalle Diario
         |
         v HTTP / JSON
API SERVER (Python - Puerto 8000)
  - Endpoints REST
  - Cache en Memoria (30 segundos)
  - Motor de Consultas SQL
  - Lectura de Archivos SQL
         |
         v HTTPS / API Key
METABASE API
  - https://analisisdatos.seniat.gob.ve
         |
         v SQL / Oracle
BASES DE DATOS ORACLE
  - SENIATFE (ID: 22)
    * LIB_REPORTEZ
    * CONT_MAQUINAS_FISCALES
  - DataWarehouse (ID: 21)
    * DBO.DECLARACION
    * DATOSCONTRIBUYENTE

Flujo de Datos
--------------
1. Usuario accede al dashboard HTML en el navegador
2. Dashboard hace peticiones HTTP a la API Server (localhost:8000)
3. API Server verifica cache (30 segundos de validez)
4. Si la cache esta expirada, API Server consulta Metabase
5. Metabase ejecuta las consultas SQL en Oracle
6. Oracle retorna los datos
7. API Server procesa, enriquece y cachea los datos
8. Dashboard recibe JSON y renderiza visualizaciones

================================================================================
3. COMPONENTES DEL BACKEND
================================================================================

Archivo: api_server.py
----------------------
El archivo principal que contiene toda la logica del servidor.

Modulos y Funciones
-------------------
metabase_query()         - Ejecuta consultas SQL en Metabase
leer_archivo_sql()       - Lee archivos .sql desde carpeta Declaraciones/
obtener_sql_region()     - Asocia nombre region con archivo SQL
calcular_tendencia()     - Calcula variacion porcentual
get_declaraciones_reales_por_region() - Consulta todas las regiones
get_recaudacion_total()  - Obtiene totales de LIB_REPORTEZ
get_maquinas_fiscales()  - Estado de maquinas fiscales
get_declaraciones()      - Totales de declaraciones
get_series_temporales()  - Datos de 12 meses
get_ticker_data()        - Datos para banner
get_proyecciones()       - Estimaciones futuras
obtener_datos_completos() - Gestion de cache

Configuracion
-------------
METABASE_URL = "https://analisisdatos.seniat.gob.ve"
METABASE_API_KEY = "mb_fHMYDYO1xgYhh/QlQ8j/c4+i4YVynQHaDE8gc/BV8e0="
METABASE_DATABASE_ID = 22
METABASE_DW_ID = 21
CACHE_DURATION = 30

================================================================================
4. ENDPOINTS API
================================================================================

Lista Completa de Endpoints
---------------------------
GET /api/datos           - Todos los datos del sistema
GET /api/ticker          - Datos para el banner
GET /api/recaudacion     - Recaudacion total
GET /api/maquinas        - Maquinas fiscales
GET /api/declaraciones   - Totales de declaraciones
GET /api/regiones        - Datos por region
GET /api/proyecciones    - Proyecciones
GET /api/region-detalle/{nombre} - Detalle de una region
GET /api/sql/{query_encoded} - Ejecutar SQL personalizada
GET /api/status          - Estado del servidor

Ejemplo de Respuesta /api/regiones
----------------------------------
{
  "regiones": [
    {
      "region": "Capital",
      "total": 12345,
      "dias": 30,
      "ultima_fecha": "2026-07-08T00:00:00",
      "tendencia": 2.5,
      "participacion": 15.3,
      "detalle_diario": [
        {"fecha": "2026-07-08T00:00:00", "total": 450},
        {"fecha": "2026-07-07T00:00:00", "total": 420}
      ]
    }
  ],
  "total_general": 80500,
  "timestamp": "2026-07-08T14:21:37.979768"
}

================================================================================
5. ESTRUCTURA DE DATOS
================================================================================

Objeto de Respuesta Completo /api/datos
---------------------------------------
{
  "recaudacion": {
    "total": 100000,
    "mes_actual": 25000,
    "mes_anterior": 22000,
    "tendencia": 13.64
  },
  "maquinas": {
    "total": 5000,
    "activas": 3750,
    "inactivas": 1250
  },
  "declaraciones": {
    "total": 8000,
    "pagadas": 5200,
    "pendientes": 2800
  },
  "regiones": [
    {
      "region": "Capital",
      "total": 15000,
      "dias": 30,
      "ultima_fecha": "2026-07-08T00:00:00",
      "tendencia": 2.5,
      "participacion": 15.0,
      "detalle_diario": [...]
    }
  ],
  "series_temporales": [
    {"mes": "Jul 2026", "valor": 8500},
    {"mes": "Jun 2026", "valor": 8200}
  ],
  "ticker": [
    {"titulo": "Recaudacion Total", "valor": 100000, "cambio": 13.64},
    {"titulo": "Capital", "valor": 15000, "cambio": 2.5}
  ],
  "proyecciones": {
    "proyeccion_mensual": 108000,
    "proyeccion_anual": 1250000,
    "crecimiento_estimado": 8.5,
    "meta_recaudacion": 115000
  },
  "estado_declaraciones": [
    {"estado": "Pagadas", "cantidad": 3200},
    {"estado": "Pendientes", "cantidad": 2400}
  ],
  "distribucion_impuestos": [
    {"nombre": "IVA", "valor": 25000},
    {"nombre": "ISLR", "valor": 18000}
  ],
  "timestamp": "2026-07-08T14:21:37.979768"
}

================================================================================
6. FRONTEND DASHBOARD
================================================================================

Archivos HTML
-------------
dashboard_seniat_v2.html - Dashboard principal con todas las graficas

Componentes Visuales
--------------------
- Graficas: Lightweight Charts
- Iconos: Font Awesome 6
- Tipografia: Google Fonts (Inter)
- Diseño: CSS Grid responsive

Actualizacion de Datos
----------------------
- Intervalo: 30 segundos
- Mecanismo: setInterval(fetchData, 30000)
- Cache: Controlada por el backend

================================================================================
7. REGIONES Y CONSULTAS SQL
================================================================================

Mapeo de Regiones
-----------------
Capital          -> REGION CAPITAL          -> declaraciones_capital.sql
Zuliana          -> REGION ZULIANA          -> declaracion_zuliana.sql
Central          -> REGION CENTRAL          -> declaraciones_central.sql
Falcon           -> REGION FALCON           -> declaraciones_falcon.sql
Guayana          -> REGION GUAYANA          -> declaraciones_guayana.sql
Insular          -> REGION INSULAR          -> declaraciones_insular.sql
Los Llanos       -> REGION LOS LLANOS       -> declaraciones_losllanos.sql
Nor Oriental     -> REGION NOR ORIENTAL     -> declaraciones_norOriental.sql
Centro Occidental-> REGION CENTRO OCCIDENTAL-> declaraciones_occidental.sql
Los Andes        -> REGION LOS ANDES        -> declaracion_losAndes.sql
Libertador       -> REGION LIBERTADOR       -> declaracion_libertador.sql
Cobros/Aduanas   -> REGION DE LA UNIDAD DE COBROS Y RECUPERACIONES DE ADUANAS -> declaraciones_cobros_recuperaciones_aduanas.sql
Especiales       -> REGION DE CONTRIBUYENTES ESPECIALES -> declaraciones_especiales_plzVEN.sql

Estructura de Consultas SQL
---------------------------
SELECT
  TRUNC(Declaracion.FECHA_DECLARACION, 'DD') AS FECHA_DECLARACION,
  COUNT(*) AS TOTAL_DECLARACIONES
FROM
  "DBO"."DECLARACION" Declaracion
  LEFT JOIN "DATOSCONTRIBUYENTE"."CONTRIBUYENTE" Contribuyente
    ON Declaracion.ID_CONTRIBUYENTE = Contribuyente.ID_CONTRIBUYENTE
  LEFT JOIN "DATOSCONTRIBUYENTE"."DEPENDENCIA" Dependencia
    ON Contribuyente.DEPENDENCIA_ADSCRIPCION_C = Dependencia.CODIGO_DEPENDENCIA
  LEFT JOIN "DATOSCONTRIBUYENTE"."REGION" Region
    ON Dependencia.REGION_DEPENDENCIA = r.CODIGO_REGION
  LEFT JOIN "DBO"."SITUACION_DECLARACION" Situacion_Declaracion
    ON Declaracion.SITUACION_DECLARACION = Situacion_Declaracion.CODIGO_SITUACION_DECLARACION
WHERE
  Declaracion.FECHA_DECLARACION >= TRUNC(SYSDATE - 30)
  AND Declaracion.FECHA_DECLARACION < TRUNC(SYSDATE + 1)
  AND Region.NOMBRE_REGION = 'REGION CAPITAL'
  AND Situacion_Declaracion.DESCRIPCION_SITUACION_DECLARAC IN (
    'DEFINITIVA CERTIFICADA - PAGO > 0',
    'DEFINITIVA CERTIFICADA - PAGO CERO',
    'DECLARACION PAGADA',
    'DEFINITIVA - PENDIENTE RECEPCION DE PAGO',
    'DEFINITIVA CERTIFICADA - PENDIENTE DE PAGO DE PORCIONES'
  )
GROUP BY
  TRUNC(Declaracion.FECHA_DECLARACION, 'DD')
ORDER BY
  FECHA_DECLARACION ASC;

================================================================================
8. INSTALACION Y CONFIGURACION
================================================================================

Requisitos del Sistema
----------------------
- Python 3.8 o superior
- Windows / Linux / macOS
- Navegador actualizado (Chrome, Firefox, Edge)
- Conexion a Internet (para Metabase API)

Estructura de Directorios
-------------------------
C:\Users\Soporte\Desktop\metabase.0\
├── Declaraciones/
│   ├── declaraciones_capital.sql
│   ├── declaracion_zuliana.sql
│   ├── declaraciones_central.sql
│   ├── declaraciones_falcon.sql
│   ├── declaraciones_guayana.sql
│   ├── declaraciones_insular.sql
│   ├── declaraciones_losllanos.sql
│   ├── declaraciones_norOriental.sql
│   ├── declaraciones_occidental.sql
│   ├── declaracion_losAndes.sql
│   ├── declaracion_libertador.sql
│   ├── declaraciones_cobros_recuperaciones_aduanas.sql
│   └── declaraciones_especiales_plzVEN.sql
├── scripts/
│   └── .env
├── api_server.py
├── dashboard_seniat_v2.html
├── dashboard_seniat.html
└── METABASE_API (1).md

Configuracion de Variables de Entorno
-------------------------------------
Crear archivo .env en scripts/ o en la raiz:

METABASE_URL="https://analisisdatos.seniat.gob.ve"
METABASE_API_KEY="mb_fHMYDYO1xgYhh/QlQ8j/c4+i4YVynQHaDE8gc/BV8e0="
METABASE_DATABASE_ID=22
METABASE_SCHEMA=ITAXUSER
METABASE_DW_ID=21

Pasos de Instalacion
--------------------
1. Clonar/Descargar el proyecto en C:\Users\Soporte\Desktop\metabase.0

2. Verificar archivos SQL:
   cd C:\Users\Soporte\Desktop\metabase.0\Declaraciones
   dir *.sql

3. Ejecutar el servidor:
   cd C:\Users\Soporte\Desktop\metabase.0
   python api_server.py

4. Abrir el dashboard en el navegador:
   dashboard_seniat_v2.html

5. Verificar API:
   curl http://localhost:8000/api/status

================================================================================
9. GUIA DE USO
================================================================================

Inicio del Sistema
------------------
1. Ejecutar el servidor en la terminal:
   cd C:\Users\Soporte\Desktop\metabase.0
   python api_server.py

2. Abrir el dashboard en el navegador:
   - Doble clic en dashboard_seniat_v2.html
   - O arrastrar al navegador

3. Verificar conexion:
   - Buscar el indicador verde "Conectado"
   - Verificar que los datos se carguen

Lectura del Dashboard
---------------------
Recaudacion Total (Tarjeta Principal)
- Numero grande: Total recaudado
- Porcentaje: Variacion vs mes anterior
- Regiones: Lista con barras de participacion
- Proyeccion: Estimacion mensual

Maquinas Fiscales
- Total: Equipos registrados
- Activas: En funcionamiento
- Inactivas: Fuera de servicio

Declaraciones
- Total: Numero de declaraciones
- Pagadas: Con pago realizado
- Pendientes: En espera de pago
- Tasa de cumplimiento: Porcentaje pagado

Grafica de Evolucion
- Eje X: Meses (ultimos 12)
- Eje Y: Monto recaudado
- Area: Tendencia historica

Distribucion por Impuesto
- IVA: Impuesto al valor agregado
- ISLR: Impuesto sobre la renta
- Aranceles: Impuestos aduaneros
- Renta Petrolera: Ingresos petroleros
- Retenciones: Retenciones fiscales
- Multas: Sanciones tributarias

Estado de Declaraciones
- Pagadas: Completadas
- Pendientes: En proceso
- Vencidas: Fuera de plazo
- En Proceso: En revision

Interpretacion de Datos
-----------------------
Tendencia Positiva  -> Crecimiento en recaudacion -> Mantener politicas
Tendencia Negativa  -> Disminucion en recaudacion -> Investigar causas
Alta Participacion  -> Region con mayor actividad -> Enfocar recursos
Baja Participacion  -> Region con menor actividad -> Analizar causas
Cumplimiento Alto   -> Buena cultura tributaria -> Mantener comunicacion
Cumplimiento Bajo   -> Problemas de cobro -> Revisar estrategias

API para Desarrolladores
------------------------
Desde Python:
import requests

# Obtener todos los datos
response = requests.get('http://localhost:8000/api/datos')
data = response.json()

# Obtener datos de una region
response = requests.get('http://localhost:8000/api/region-detalle/Capital')
region = response.json()

Desde JavaScript:
// Obtener todos los datos
fetch('http://localhost:8000/api/datos')
  .then(response => response.json())
  .then(data => console.log(data));

// Obtener regiones
fetch('http://localhost:8000/api/regiones')
  .then(response => response.json())
  .then(data => console.log(data.regiones));

================================================================================
10. SEGURIDAD Y BUENAS PRACTICAS
================================================================================

Seguridad de Datos
------------------
- API Key: No expuesta en frontend (solo backend)
- CORS: Limitado a localhost en desarrollo
- Cache: Datos en memoria, no en disco
- Conexion: HTTPS con Metabase

Buenas Practicas
----------------
- Variables de entorno para credenciales
- Cache para reducir consultas
- Timeout en consultas (600 segundos)
- Manejo de errores en todas las funciones
- Logs para debugging
- Versionado de archivos SQL

================================================================================
11. SOLUCION DE PROBLEMAS
================================================================================

Error: Servidor no inicia
-------------------------
Verificar que el puerto 8000 este libre:
netstat -ano | findstr :8000

Error: API no responde
----------------------
Verificar que el servidor este corriendo:
curl http://localhost:8000/api/status

Error: Datos no cargan
----------------------
1. Verificar conexion a internet
2. Verificar API Key en .env
3. Verificar que los archivos SQL existan

Error: Consultas SQL fallan
---------------------------
1. Verificar que las tablas existan en Oracle
2. Verificar permisos de usuario
3. Revisar sintaxis SQL en archivos

Error: Cache no se actualiza
----------------------------
1. Reiniciar el servidor
2. Verificar CACHE_DURATION en api_server.py

================================================================================
12. PROXIMAS MEJORAS
================================================================================

Mejoras Planeadas
-----------------
1. Autenticacion de usuarios
2. Exportacion de datos (CSV, Excel)
3. Alertas y notificaciones
4. Panel de administracion
5. Configuracion de actualizacion por componente
6. Soporte para mas fuentes de datos
7. Historial de consultas
8. Dashboard personalizable
9. Mapas de calor geograficos
10. Analisis predictivo con IA

================================================================================
FIN DEL DOCUMENTO
================================================================================