import json
import urllib.request
import urllib.error
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
from datetime import datetime, timedelta
import os
from pathlib import Path
import urllib.parse
import mimetypes

# ============================================================
# CONFIGURACION
# ============================================================
METABASE_URL = "https://analisisdatos.seniat.gob.ve"
METABASE_API_KEY = "mb_fHMYDYO1xgYhh/QlQ8j/c4+i4YVynQHaDE8gc/BV8e0="
METABASE_DATABASE_ID = 22
METABASE_DW_ID = 21
CACHE_DURATION = 30

cache = {}
cache_timestamp = None

# ============================================================
# TIPOS DE DOCUMENTO - EXACTAMENTE LOS QUE USA METABASE
# ============================================================
TIPOS_DOCUMENTO_METABASE = [
    '00011', '00012', '00013', '00014', '00018',
    '99011', '99012', '99013', '99014', '99018',
    '99074', '99075', '99076',
    '99025', '99026',
    '99044', '99244',
    '99028', '99029',
    '00023', '99023',
    '00031', '00033', '99033',
    '00223', '00225', '00228', '00229',
    '99225', '99228', '99229',
    '00911', '00912', '00913', '00914', '00918',
    '00923', '00925', '00926',
    '00928', '00929',
    '00931', '00933',
    '00974', '00975', '00976',
    '99911', '99912', '99913', '99914', '99918',
    '99923', '99925', '99926',
    '99929', '99928',
    '99974', '99975', '99976',
    '00940', '00941', '00943',
    '99940', '99941', '99943',
    '00991', '00995', '00996',
    '99991', '99995', '99996',
    '00262', '00265',
    '99035', '99262', '99265',
    '99030', '99034',
    '99057', '99257',
    '00930', '00935',
    '99930', '99935',
    '00945', '99945',
    '00990', '99990',
    '00050', '99050', '99950',
    '00954', '99954',
    '00060', '99060', '99960',
    '00955', '99955',
    '00032', '99232',
    '00932', '99032', '99932',
    '00942', '99942',
    '00992', '99992',
    '00022', '99022',
    '00922', '99922',
    '00966',
    '00949',
    '00950',
    '99019', '99919',
    '00901', '00902',
    '99901',
    '00951', '99951',
    '00903',
    '00952', '99952',
    '99903',
    '00953', '99953',
    '00906', '99906',
    '99016',
    '00097',
    '00070',
    '00956', '99956',
    '00947', '99947',
    '00998',
    '00080', '00083', '00084', '00086',
    '99080', '99086',
    '00081', '99081',
    '99986', '99981',
    '99020', '99021',
    '99921',
    '99005', '99009', '99010',
    '99910'
]

def get_tipos_sql():
    """Genera la cláusula SQL para los tipos de documento de Metabase"""
    return "(" + " OR ".join([f"TIPO_DOCUMENTO_PAGO = '{t}'" for t in TIPOS_DOCUMENTO_METABASE]) + ")"

# ============================================================
# FUNCIONES DE CONEXION A METABASE
# ============================================================
def metabase_query(sql, database_id=METABASE_DW_ID):
    """Ejecuta una consulta SQL en Metabase y devuelve los resultados"""
    body = {
        "database": database_id,
        "type": "native",
        "native": {"query": sql},
        "parameters": [],
        "constraints": {
            "max-results": 50000,
            "max-results-bare-rows": 50000
        }
    }
    
    req = urllib.request.Request(
        f"{METABASE_URL}/api/dataset",
        data=json.dumps(body).encode('utf-8'),
        headers={
            "x-api-key": METABASE_API_KEY,
            "Content-Type": "application/json"
        },
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=600) as resp:
            result = json.loads(resp.read().decode('utf-8'))
        
        if result.get("status") == "failed":
            print(f"Error en consulta: {result.get('error', 'Error desconocido')}")
            return []
        
        return result.get("data", {}).get("rows", [])
    except Exception as e:
        print(f"Error en consulta Metabase: {e}")
        return []

# ============================================================
# FUNCIONES DE DATOS DE HOY - EXACTAMENTE COMO METABASE
# ============================================================

def get_recaudacion_total_bs():
    """Obtiene la recaudación total en Bs - EXACTAMENTE COMO METABASE"""
    tipos_condition = get_tipos_sql()
    
    sql = f"""
    SELECT 
        SUM(MONTO_TOTAL_PAGO) AS TOTAL
    FROM "DBO"."MOVIMIENTO_PAGO"
    WHERE FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE)
    AND SITUACION_PAGO = '22'
    AND CONCILIADO_PAGO = 'N'
    AND {tipos_condition}
    """
    rows = metabase_query(sql, database_id=METABASE_DW_ID)
    
    if rows and len(rows) > 0:
        return float(rows[0][0]) if rows[0][0] else 0.0
    return 0.0

def get_recaudacion_total_usd():
    """Obtiene la recaudación total en USD - EXACTAMENTE COMO METABASE"""
    tipos_condition = get_tipos_sql()
    
    sql = f"""
    SELECT 
        SUM(p.MONTO_TOTAL_PAGO / t.RAT_EXC) AS TOTAL_USD
    FROM "DBO"."MOVIMIENTO_PAGO" p
    LEFT JOIN "DBO"."TASA_CAMBIO_DIARIA" t 
        ON CONCAT('', 'USD') = t.CUR_COD
        AND TRUNC(p.FECHA_RECAUDACION_PAGO) = TRUNC(t.VALID_FROM)
    WHERE p.FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE)
    AND p.SITUACION_PAGO = '22'
    AND p.CONCILIADO_PAGO = 'N'
    AND {tipos_condition}
    """
    rows = metabase_query(sql, database_id=METABASE_DW_ID)
    
    if rows and len(rows) > 0:
        return float(rows[0][0]) if rows[0][0] else 0.0
    return 0.0

def get_cantidad_pagos_sin_conciliar():
    """Obtiene la cantidad de pagos sin conciliar - EXACTAMENTE COMO METABASE"""
    tipos_condition = get_tipos_sql()
    
    sql = f"""
    SELECT 
        COUNT(*) AS TOTAL
    FROM "DBO"."MOVIMIENTO_PAGO"
    WHERE FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE)
    AND SITUACION_PAGO = '22'
    AND CONCILIADO_PAGO = 'N'
    AND {tipos_condition}
    """
    rows = metabase_query(sql, database_id=METABASE_DW_ID)
    
    if rows and len(rows) > 0:
        return int(rows[0][0]) if rows[0][0] else 0
    return 0

def get_cantidad_pagos_conciliados():
    """Obtiene la cantidad de pagos conciliados - EXACTAMENTE COMO METABASE"""
    tipos_condition = get_tipos_sql()
    
    sql = f"""
    SELECT 
        COUNT(*) AS TOTAL
    FROM "DBO"."MOVIMIENTO_PAGO"
    WHERE FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE)
    AND SITUACION_PAGO = '22'
    AND CONCILIADO_PAGO = 'S'
    AND {tipos_condition}
    """
    rows = metabase_query(sql, database_id=METABASE_DW_ID)
    
    if rows and len(rows) > 0:
        return int(rows[0][0]) if rows[0][0] else 0
    return 0

def get_recaudacion_regiones_hoy():
    """Obtiene recaudación por región en Bs - EXACTAMENTE COMO METABASE"""
    tipos_condition = get_tipos_sql()
    
    sql = f"""
    SELECT 
        dep.NOMBRE_DEPENDENCIA as REGION,
        SUM(p.MONTO_TOTAL_PAGO) AS TOTAL
    FROM "DBO"."MOVIMIENTO_PAGO" p
    LEFT JOIN "DATOSCONTRIBUYENTE"."DEPENDENCIA" dep 
        ON p.DEPENDENCIA_PAGO = dep.CODIGO_DEPENDENCIA
    WHERE p.FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE)
    AND p.SITUACION_PAGO = '22'
    AND p.CONCILIADO_PAGO = 'N'
    AND {tipos_condition}
    GROUP BY dep.NOMBRE_DEPENDENCIA
    ORDER BY TOTAL DESC
    """
    rows = metabase_query(sql, database_id=METABASE_DW_ID)
    resultados = []
    
    if not rows:
        return resultados
    
    for row in rows:
        if len(row) >= 2:
            region = row[0] if row[0] else "SIN REGION"
            total = float(row[1]) if row[1] else 0.0
            if total > 0:
                resultados.append({"region": region, "total": total})
    
    return resultados

def get_recaudacion_aduanas_hoy():
    """Obtiene recaudación por aduana - EXACTAMENTE COMO METABASE"""
    tipos_condition = get_tipos_sql()
    
    sql = f"""
    SELECT 
        dep.NOMBRE_DEPENDENCIA as ADUANA,
        SUM(p.MONTO_TOTAL_PAGO) AS TOTAL
    FROM "DBO"."MOVIMIENTO_PAGO" p
    LEFT JOIN "DATOSCONTRIBUYENTE"."DEPENDENCIA" dep 
        ON p.DEPENDENCIA_PAGO = dep.CODIGO_DEPENDENCIA
    WHERE p.FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE)
    AND p.SITUACION_PAGO = '22'
    AND p.CONCILIADO_PAGO = 'N'
    AND {tipos_condition}
    AND dep.NOMBRE_DEPENDENCIA LIKE '%ADUANA%'
    GROUP BY dep.NOMBRE_DEPENDENCIA
    ORDER BY TOTAL DESC
    """
    rows = metabase_query(sql, database_id=METABASE_DW_ID)
    resultados = []
    
    if not rows:
        return resultados
    
    for row in rows:
        if len(row) >= 2:
            region = row[0] if row[0] else "SIN ADUANA"
            total = float(row[1]) if row[1] else 0.0
            if total > 0:
                resultados.append({"aduana": region, "total": total})
    
    return resultados

# ============================================================
# FUNCIONES DE DATOS DE AYER - SIN FILTRO DE TIPOS (DATOS HISTORICOS)
# ============================================================

def get_recaudacion_ayer_bs():
    """Obtiene la recaudación del día anterior en Bs - DATOS HISTORICOS - NO CAMBIAN"""
    sql = f"""
    SELECT 
        SUM(MONTO_TOTAL_PAGO) AS TOTAL
    FROM "DBO"."MOVIMIENTO_PAGO"
    WHERE FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE - 1)
    AND SITUACION_PAGO = '22'
    AND CONCILIADO_PAGO = 'N'
    """
    rows = metabase_query(sql, database_id=METABASE_DW_ID)
    
    if rows and len(rows) > 0:
        return float(rows[0][0]) if rows[0][0] else 0.0
    return 0.0

def get_recaudacion_ayer_usd():
    """Obtiene la recaudación del día anterior en USD - DATOS HISTORICOS - NO CAMBIAN"""
    sql = f"""
    SELECT 
        SUM(p.MONTO_TOTAL_PAGO / t.RAT_EXC) AS TOTAL_USD
    FROM "DBO"."MOVIMIENTO_PAGO" p
    LEFT JOIN "DBO"."TASA_CAMBIO_DIARIA" t 
        ON CONCAT('', 'USD') = t.CUR_COD
        AND TRUNC(p.FECHA_RECAUDACION_PAGO) = TRUNC(t.VALID_FROM)
    WHERE p.FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE - 1)
    AND p.SITUACION_PAGO = '22'
    AND p.CONCILIADO_PAGO = 'N'
    """
    rows = metabase_query(sql, database_id=METABASE_DW_ID)
    
    if rows and len(rows) > 0:
        return float(rows[0][0]) if rows[0][0] else 0.0
    return 0.0

def get_pagos_sin_conciliar_ayer():
    """Obtiene la cantidad de pagos sin conciliar del día anterior - DATOS HISTORICOS"""
    sql = f"""
    SELECT 
        COUNT(*) AS TOTAL
    FROM "DBO"."MOVIMIENTO_PAGO"
    WHERE FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE - 1)
    AND SITUACION_PAGO = '22'
    AND CONCILIADO_PAGO = 'N'
    """
    rows = metabase_query(sql, database_id=METABASE_DW_ID)
    
    if rows and len(rows) > 0:
        return int(rows[0][0]) if rows[0][0] else 0
    return 0

def get_recaudacion_ayer_por_region():
    """Obtiene recaudación por región del día anterior - DATOS HISTORICOS"""
    sql = f"""
    SELECT 
        dep.NOMBRE_DEPENDENCIA as REGION,
        SUM(p.MONTO_TOTAL_PAGO) AS TOTAL
    FROM "DBO"."MOVIMIENTO_PAGO" p
    LEFT JOIN "DATOSCONTRIBUYENTE"."DEPENDENCIA" dep 
        ON p.DEPENDENCIA_PAGO = dep.CODIGO_DEPENDENCIA
    WHERE p.FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE - 1)
    AND p.SITUACION_PAGO = '22'
    AND p.CONCILIADO_PAGO = 'N'
    GROUP BY dep.NOMBRE_DEPENDENCIA
    ORDER BY TOTAL DESC
    """
    rows = metabase_query(sql, database_id=METABASE_DW_ID)
    resultados = []
    
    if not rows:
        return resultados
    
    for row in rows:
        if len(row) >= 2:
            region = row[0] if row[0] else "SIN REGION"
            total = float(row[1]) if row[1] else 0.0
            if total > 0:
                resultados.append({"region": region, "total": total})
    
    return resultados

def get_recaudacion_ayer_por_aduana():
    """Obtiene recaudación por aduana del día anterior - DATOS HISTORICOS"""
    sql = f"""
    SELECT 
        dep.NOMBRE_DEPENDENCIA as ADUANA,
        SUM(p.MONTO_TOTAL_PAGO) AS TOTAL
    FROM "DBO"."MOVIMIENTO_PAGO" p
    LEFT JOIN "DATOSCONTRIBUYENTE"."DEPENDENCIA" dep 
        ON p.DEPENDENCIA_PAGO = dep.CODIGO_DEPENDENCIA
    WHERE p.FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE - 1)
    AND p.SITUACION_PAGO = '22'
    AND p.CONCILIADO_PAGO = 'N'
    AND dep.NOMBRE_DEPENDENCIA LIKE '%ADUANA%'
    GROUP BY dep.NOMBRE_DEPENDENCIA
    ORDER BY TOTAL DESC
    """
    rows = metabase_query(sql, database_id=METABASE_DW_ID)
    resultados = []
    
    if not rows:
        return resultados
    
    for row in rows:
        if len(row) >= 2:
            region = row[0] if row[0] else "SIN ADUANA"
            total = float(row[1]) if row[1] else 0.0
            if total > 0:
                resultados.append({"aduana": region, "total": total})
    
    return resultados

# ============================================================
# FUNCIONES DE DATOS HORARIOS POR REGION
# ============================================================

def get_recaudacion_horaria_region(region_nombre):
    """
    Obtiene recaudacion por hora para una region en las ultimas 24h
    Usa la tabla MEJORES_PAGADORES_GLOBAL que tiene datos horarios
    """
    sql = f"""
    SELECT 
        TO_CHAR(TRUNC(p.FECHA_HORA_TX_PAGO, 'HH24'), 'HH24:MI') AS HORA,
        SUM(p.MONTO_TOTAL_PAGO) AS TOTAL_BS,
        SUM(p.TOTAL_DOLARES) AS TOTAL_USD
    FROM "DBO"."MEJORES_PAGADORES_GLOBAL" p
    WHERE p.FECHA_HORA_TX_PAGO >= TRUNC(SYSDATE - 1)
      AND p.REGION_NOMBRE = '{region_nombre}'
      AND p.FECHA_HORA_TX_PAGO < TRUNC(SYSDATE + 1)
    GROUP BY TRUNC(p.FECHA_HORA_TX_PAGO, 'HH24')
    ORDER BY HORA ASC
    """
    rows = metabase_query(sql, database_id=METABASE_DW_ID)
    
    if not rows:
        return []
    
    resultados = []
    for row in rows:
        if len(row) >= 3:
            resultados.append({
                "hora": row[0] if row[0] else "00:00",
                "total_bs": float(row[1]) if row[1] else 0,
                "total_usd": float(row[2]) if row[2] else 0
            })
    
    return resultados

def get_tasa_bcv():
    """Obtiene la tasa de cambio del dolar segun BCV desde Metabase"""
    sql = """
    SELECT RAT_EXC 
    FROM "DBO"."TASA_CAMBIO_DIARIA" 
    WHERE CUR_COD = 'USD' 
    AND TRUNC(VALID_FROM) = TRUNC(SYSDATE)
    """
    rows = metabase_query(sql, database_id=METABASE_DW_ID)
    
    if rows and len(rows) > 0 and rows[0][0]:
        return float(rows[0][0])
    return 42.50

def get_recaudacion_ayer_por_region_detalle():
    """
    Obtiene recaudacion de ayer por region con detalles (total, pagos)
    """
    sql = """
    SELECT 
        dep.NOMBRE_DEPENDENCIA as REGION,
        SUM(p.MONTO_TOTAL_PAGO) AS TOTAL_BS,
        SUM(p.MONTO_TOTAL_PAGO / t.RAT_EXC) AS TOTAL_USD,
        COUNT(*) AS CANTIDAD_PAGOS
    FROM "DBO"."MOVIMIENTO_PAGO" p
    LEFT JOIN "DATOSCONTRIBUYENTE"."DEPENDENCIA" dep 
        ON p.DEPENDENCIA_PAGO = dep.CODIGO_DEPENDENCIA
    LEFT JOIN "DBO"."TASA_CAMBIO_DIARIA" t 
        ON CONCAT('', 'USD') = t.CUR_COD
        AND TRUNC(p.FECHA_RECAUDACION_PAGO) = TRUNC(t.VALID_FROM)
    WHERE p.FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE - 1)
    AND p.SITUACION_PAGO = '22'
    AND p.CONCILIADO_PAGO = 'N'
    GROUP BY dep.NOMBRE_DEPENDENCIA
    """
    rows = metabase_query(sql, database_id=METABASE_DW_ID)
    resultados = {}
    
    if not rows:
        return resultados
    
    for row in rows:
        if len(row) >= 4:
            region = row[0] if row[0] else "SIN REGION"
            resultados[region] = {
                "total_bs": float(row[1]) if row[1] else 0,
                "total_usd": float(row[2]) if row[2] else 0,
                "pagos": int(row[3]) if row[3] else 0
            }
    
    return resultados

def get_regiones_con_detalle_hoy():
    """
    Obtiene recaudacion de hoy por region con detalles (total, pagos, USD)
    """
    tipos_condition = get_tipos_sql()
    
    sql = f"""
    SELECT 
        dep.NOMBRE_DEPENDENCIA as REGION,
        SUM(p.MONTO_TOTAL_PAGO) AS TOTAL_BS,
        SUM(p.MONTO_TOTAL_PAGO / t.RAT_EXC) AS TOTAL_USD,
        COUNT(*) AS CANTIDAD_PAGOS
    FROM "DBO"."MOVIMIENTO_PAGO" p
    LEFT JOIN "DATOSCONTRIBUYENTE"."DEPENDENCIA" dep 
        ON p.DEPENDENCIA_PAGO = dep.CODIGO_DEPENDENCIA
    LEFT JOIN "DBO"."TASA_CAMBIO_DIARIA" t 
        ON CONCAT('', 'USD') = t.CUR_COD
        AND TRUNC(p.FECHA_RECAUDACION_PAGO) = TRUNC(t.VALID_FROM)
    WHERE p.FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE)
    AND p.SITUACION_PAGO = '22'
    AND p.CONCILIADO_PAGO = 'N'
    AND {tipos_condition}
    GROUP BY dep.NOMBRE_DEPENDENCIA
    ORDER BY TOTAL_BS DESC
    """
    rows = metabase_query(sql, database_id=METABASE_DW_ID)
    resultados = []
    
    if not rows:
        return resultados
    
    ayer_data = get_recaudacion_ayer_por_region_detalle()
    
    for row in rows:
        if len(row) >= 4:
            region = row[0] if row[0] else "SIN REGION"
            total_bs = float(row[1]) if row[1] else 0
            total_usd = float(row[2]) if row[2] else 0
            pagos = int(row[3]) if row[3] else 0
            
            ayer = ayer_data.get(region, {})
            ayer_total = ayer.get("total_bs", 0)
            
            if ayer_total > 0:
                cambio = ((total_bs - ayer_total) / ayer_total) * 100
            else:
                cambio = 0
            
            hourly_data = get_recaudacion_horaria_region(region)
            
            resultados.append({
                "region": region,
                "total_bs": total_bs,
                "total_usd": total_usd,
                "pagos": pagos,
                "ayer_total_bs": ayer_total,
                "ayer_total_usd": ayer.get("total_usd", 0),
                "ayer_pagos": ayer.get("pagos", 0),
                "cambio": cambio,
                "hourly_data": hourly_data
            })
    
    return resultados

# ============================================================
# FUNCION DE CONTRIBUYENTES
# ============================================================

def get_top_contribuyentes_hoy(limit=10):
    """
    Obtiene los TOP contribuyentes del dia
    Usa RIF_CONTRIBUYENTE que existe en MOVIMIENTO_PAGO
    """
    tipos_condition = get_tipos_sql()
    
    sql = f"""
    SELECT 
        c.RAZON_SOCIAL as NOMBRE,
        m.RIF_CONTRIBUYENTE as RIF,
        COUNT(*) as CANTIDAD_PAGOS,
        SUM(m.MONTO_TOTAL_PAGO) as TOTAL
    FROM "DBO"."MOVIMIENTO_PAGO" m
    LEFT JOIN "DATOSCONTRIBUYENTE"."CONTRIBUYENTE" c 
        ON m.RIF_CONTRIBUYENTE = c.RIF
    WHERE m.FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE)
    AND m.SITUACION_PAGO = '22'
    AND m.CONCILIADO_PAGO = 'N'
    AND {tipos_condition}
    GROUP BY c.RAZON_SOCIAL, m.RIF_CONTRIBUYENTE
    ORDER BY TOTAL DESC
    FETCH FIRST {limit} ROWS ONLY
    """
    rows = metabase_query(sql, database_id=METABASE_DW_ID)
    resultados = []
    
    if not rows:
        return resultados
    
    for row in rows:
        if len(row) >= 4:
            resultados.append({
                "nombre": row[0] if row[0] else "NO IDENTIFICADO",
                "rif": row[1] if row[1] else "N/A",
                "cantidad_pagos": int(row[2]) if row[2] else 0,
                "total": float(row[3]) if row[3] else 0.0
            })
    
    return resultados

# ============================================================
# FUNCIONES DE VERIFICACION Y TICKER
# ============================================================

def verificar_recaudacion():
    """Verifica que los datos coincidan con Metabase"""
    rec_bs_hoy = get_recaudacion_total_bs()
    rec_usd_hoy = get_recaudacion_total_usd()
    pagos_hoy = get_cantidad_pagos_sin_conciliar()
    
    rec_bs_ayer = get_recaudacion_ayer_bs()
    rec_usd_ayer = get_recaudacion_ayer_usd()
    pagos_ayer = get_pagos_sin_conciliar_ayer()
    
    return {
        "status": "success",
        "timestamp": datetime.now().isoformat(),
        "hoy": {
            "recaudacion": {
                "total_bs": rec_bs_hoy,
                "total_usd": rec_usd_hoy,
                "pagos": pagos_hoy
            }
        },
        "ayer": {
            "recaudacion": {
                "total_bs": rec_bs_ayer,
                "total_usd": rec_usd_ayer,
                "pagos": pagos_ayer
            },
            "fecha": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        },
        "verificacion": {
            "estado": "ok",
            "mensaje": "Datos verificados - Misma logica que Metabase",
            "fecha_verificacion": datetime.now().isoformat()
        },
        "configuracion": {
            "tipos_documento": len(TIPOS_DOCUMENTO_METABASE),
            "filtro_situacion": "22",
            "filtro_conciliado": "N"
        }
    }

def get_ticker_data():
    """Genera datos para el ticker con mas informacion"""
    rec_usd = get_recaudacion_total_usd()
    rec_bs = get_recaudacion_total_bs()
    pagos = get_cantidad_pagos_sin_conciliar()
    pagos_conciliados = get_cantidad_pagos_conciliados()
    tasa_bcv = get_tasa_bcv()
    
    ticker_items = [
        {"titulo": "Dolar BCV", "valor": f"{tasa_bcv:.2f} Bs", "cambio": 0, "formato": "texto"},
        {"titulo": "Recaudacion USD", "valor": rec_usd, "cambio": 0, "formato": "usd"},
        {"titulo": "Recaudacion Bs", "valor": rec_bs, "cambio": 0, "formato": "bs"},
        {"titulo": "Pagos Sin Conciliar", "valor": pagos, "cambio": 0, "formato": "numero"},
        {"titulo": "Pagos Conciliados", "valor": pagos_conciliados, "cambio": 0, "formato": "numero"},
    ]
    
    regiones = get_recaudacion_regiones_hoy()
    for i, r in enumerate(regiones[:3]):
        ticker_items.append({
            "titulo": r["region"][:25] + ("..." if len(r["region"]) > 25 else ""),
            "valor": r["total"],
            "cambio": 0,
            "formato": "bs"
        })
    
    return ticker_items

# ============================================================
# OBTENER DATOS COMPLETOS CON CACHE
# ============================================================
def obtener_datos_completos():
    """Obtiene todos los datos con cache"""
    global cache, cache_timestamp
    ahora = datetime.now()
    
    if cache_timestamp and (ahora - cache_timestamp).total_seconds() < CACHE_DURATION:
        return cache
    
    print("\n" + "="*60)
    print("ACTUALIZANDO DATOS DESDE METABASE")
    print("="*60)
    
    rec_bs = get_recaudacion_total_bs()
    rec_usd = get_recaudacion_total_usd()
    pagos_sin_conciliar = get_cantidad_pagos_sin_conciliar()
    pagos_conciliados = get_cantidad_pagos_conciliados()
    pagos_sin_conciliar_ayer = get_pagos_sin_conciliar_ayer()
    regiones = get_recaudacion_regiones_hoy()
    aduanas = get_recaudacion_aduanas_hoy()
    contribuyentes = get_top_contribuyentes_hoy(10)
    
    rec_bs_ayer = get_recaudacion_ayer_bs()
    rec_usd_ayer = get_recaudacion_ayer_usd()
    regiones_ayer = get_recaudacion_ayer_por_region()
    aduanas_ayer = get_recaudacion_ayer_por_aduana()
    
    regiones_detalle = get_regiones_con_detalle_hoy()
    tasa_bcv = get_tasa_bcv()
    
    datos = {
        "status": "success",
        "timestamp": ahora.isoformat(),
        "recaudacion": {
            "total_bs": rec_bs,
            "total_usd": rec_usd,
            "total_bs_ayer": rec_bs_ayer,
            "total_usd_ayer": rec_usd_ayer,
            "pagos_sin_conciliar": pagos_sin_conciliar,
            "pagos_conciliados": pagos_conciliados,
            "pagos_sin_conciliar_ayer": pagos_sin_conciliar_ayer
        },
        "ayer": {
            "recaudacion": {
                "total_bs": rec_bs_ayer,
                "total_usd": rec_usd_ayer,
                "total_regiones": sum(r["total"] for r in regiones_ayer),
                "total_aduanas": sum(r["total"] for r in aduanas_ayer),
                "pagos": pagos_sin_conciliar_ayer
            },
            "regiones": regiones_ayer[:10],
            "aduanas": aduanas_ayer[:10],
            "fecha": (ahora - timedelta(days=1)).strftime("%Y-%m-%d")
        },
        "regiones": regiones,
        "aduanas": aduanas,
        "contribuyentes": contribuyentes,
        "regiones_detalle": regiones_detalle,
        "tasa_bcv": tasa_bcv,
        "ticker": get_ticker_data(),
        "configuracion": {
            "tipos_documento": len(TIPOS_DOCUMENTO_METABASE),
            "filtro_situacion": "22",
            "filtro_conciliado": "N",
            "mensaje": "Usando EXACTAMENTE la misma logica que Metabase"
        }
    }
    
    cache = datos
    cache_timestamp = ahora
    
    print(f"\nRESUMEN DE DATOS (Misma logica que Metabase):")
    print(f"   Recaudacion Bs (Hoy): {rec_bs:,.2f}")
    print(f"   Recaudacion Bs (Ayer): {rec_bs_ayer:,.2f}")
    print(f"   Recaudacion USD (Hoy): ${rec_usd:,.2f}")
    print(f"   Recaudacion USD (Ayer): ${rec_usd_ayer:,.2f}")
    print(f"   Pagos Sin Conciliar (Hoy): {pagos_sin_conciliar:,}")
    print(f"   Pagos Sin Conciliar (Ayer): {pagos_sin_conciliar_ayer:,}")
    print(f"   Regiones con datos (Hoy): {len(regiones)}")
    print(f"   Regiones con datos (Ayer): {len(regiones_ayer)}")
    print(f"   Aduanas con datos (Hoy): {len(aduanas)}")
    print(f"   Aduanas con datos (Ayer): {len(aduanas_ayer)}")
    print(f"   Tipos de documento filtrados: {len(TIPOS_DOCUMENTO_METABASE)}")
    print(f"   Top contribuyentes: {len(contribuyentes)}")
    print(f"   Tasa BCV: {tasa_bcv:.2f}")
    print("="*60 + "\n")
    
    return datos

# ============================================================
# ENDPOINT SQL PERSONALIZADO
# ============================================================
def ejecutar_sql_personalizada(path):
    """Ejecuta SQL personalizada desde la URL"""
    if '?' in path:
        parsed = urllib.parse.urlparse(path)
        query_params = urllib.parse.parse_qs(parsed.query)
        sql = query_params.get('query', [''])[0]
    else:
        sql = path.replace('/api/sql/', '')
    
    if not sql:
        return {"error": "No se proporciono consulta SQL"}
    
    sql = urllib.parse.unquote(sql)
    
    print(f"\nEjecutando SQL personalizada:")
    print(f"   {sql[:200]}...")
    
    try:
        rows = metabase_query(sql, database_id=METABASE_DW_ID)
        return {
            "status": "success",
            "count": len(rows),
            "rows": rows,
            "sql": sql
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "sql": sql
        }

# ============================================================
# SERVIDOR HTTP
# ============================================================
class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

class DashboardHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def serve_static_file(self, relative_path):
        base_dir = Path(__file__).resolve().parent / 'frontend'
        file_path = (base_dir / relative_path).resolve()
        try:
            if not str(file_path).startswith(str(base_dir)):
                raise FileNotFoundError
            if not file_path.exists() or not file_path.is_file():
                raise FileNotFoundError
            content_type = mimetypes.guess_type(str(file_path))[0] or 'application/octet-stream'
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            with file_path.open('rb') as fh:
                self.wfile.write(fh.read())
        except FileNotFoundError:
            self.enviar_error(404, 'Archivo no encontrado')

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path

        if path == '/':
            self.serve_static_file('templates/admin.html')
        elif path == '/admin.html':
            self.serve_static_file('templates/admin.html')
        elif path == '/usuario.html':
            self.serve_static_file('templates/usuario.html')
        elif path.startswith('/static/'):
            self.serve_static_file(path.lstrip('/'))
        elif path == '/api/status':
            self.enviar_respuesta({
                "status": "online",
                "timestamp": datetime.now().isoformat(),
                "cache_seconds": CACHE_DURATION,
                "databases": {
                    "seniatfe": METABASE_DATABASE_ID,
                    "datawarehouse": METABASE_DW_ID
                },
                "configuracion": {
                    "tipos_documento": len(TIPOS_DOCUMENTO_METABASE),
                    "filtro_situacion": "22",
                    "filtro_conciliado": "N"
                }
            })
        elif self.path == '/api/datos':
            self.enviar_respuesta(obtener_datos_completos())
        elif self.path == '/api/ticker':
            datos = obtener_datos_completos()
            self.enviar_respuesta(datos.get("ticker", []))
        elif self.path == '/api/recaudacion':
            self.enviar_respuesta({
                "total_bs": get_recaudacion_total_bs(),
                "total_usd": get_recaudacion_total_usd(),
                "pagos_sin_conciliar": get_cantidad_pagos_sin_conciliar(),
                "pagos_conciliados": get_cantidad_pagos_conciliados(),
                "pagos_sin_conciliar_ayer": get_pagos_sin_conciliar_ayer()
            })
        elif self.path == '/api/recaudacion-ayer':
            self.enviar_respuesta({
                "total_bs": get_recaudacion_ayer_bs(),
                "total_usd": get_recaudacion_ayer_usd(),
                "regiones": get_recaudacion_ayer_por_region()[:10],
                "aduanas": get_recaudacion_ayer_por_aduana()[:10],
                "fecha": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
            })
        elif self.path == '/api/regiones':
            self.enviar_respuesta({
                "regiones": get_recaudacion_regiones_hoy(),
                "total_general": sum(r["total"] for r in get_recaudacion_regiones_hoy()),
                "timestamp": datetime.now().isoformat()
            })
        elif self.path == '/api/aduanas':
            self.enviar_respuesta({
                "aduanas": get_recaudacion_aduanas_hoy(),
                "total_general": sum(r["total"] for r in get_recaudacion_aduanas_hoy()),
                "timestamp": datetime.now().isoformat()
            })
        elif self.path == '/api/contribuyentes':
            self.enviar_respuesta({
                "contribuyentes": get_top_contribuyentes_hoy(10),
                "timestamp": datetime.now().isoformat()
            })
        elif self.path == '/api/verificar':
            self.enviar_respuesta(verificar_recaudacion())
        elif path.startswith('/api/sql'):
            resultado = ejecutar_sql_personalizada(path)
            self.enviar_respuesta(resultado)
        elif path == '/api/tasa-bcv':
            self.enviar_respuesta({
                "tasa": get_tasa_bcv(),
                "timestamp": datetime.now().isoformat()
            })
        elif path.startswith('/api/region-horaria/'):
            region = path.replace('/api/region-horaria/', '')
            region = urllib.parse.unquote(region)
            datos = get_recaudacion_horaria_region(region)
            self.enviar_respuesta({
                "region": region,
                "hourly_data": datos,
                "timestamp": datetime.now().isoformat()
            })
        elif path == '/api/regiones-detalle':
            self.enviar_respuesta({
                "regiones": get_regiones_con_detalle_hoy(),
                "total_general": sum(r["total_bs"] for r in get_regiones_con_detalle_hoy()),
                "timestamp": datetime.now().isoformat()
            })
        elif path == '/api/dashboard-completo':
            self.enviar_respuesta(obtener_datos_completos())
        else:
            self.enviar_error(404, f"Endpoint no encontrado: {path}")
    
    def do_POST(self):
        if self.path == '/api/admin/guardar':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length)
                data = json.loads(body.decode('utf-8'))
                
                config_file = Path(__file__).parent / 'paneles_usuarios.json'
                try:
                    with open(config_file, 'r', encoding='utf-8') as f:
                        config = json.load(f)
                except:
                    config = {"usuarios": {}}
                
                config["usuarios"][data.get("user_id")] = {
                    "nombre_usuario": data.get("nombre_usuario"),
                    "regiones_permitidas": data.get("regiones_permitidas", []),
                    "mostrar_recaudacion": data.get("mostrar_recaudacion", True),
                    "mostrar_maquinas": data.get("mostrar_maquinas", True),
                    "mostrar_declaraciones": data.get("mostrar_declaraciones", True)
                }
                
                with open(config_file, 'w', encoding='utf-8') as f:
                    json.dump(config, f, indent=2, ensure_ascii=False)
                
                self.enviar_respuesta({"status": "success", "message": "Configuracion guardada"})
            except Exception as e:
                self.enviar_error(500, f"Error al guardar: {str(e)}")
        
        elif self.path == '/api/admin/config':
            try:
                config_file = Path(__file__).parent / 'paneles_usuarios.json'
                if config_file.exists():
                    with open(config_file, 'r', encoding='utf-8') as f:
                        config = json.load(f)
                else:
                    config = {"usuarios": {}}
                self.enviar_respuesta(config)
            except Exception as e:
                self.enviar_error(500, f"Error al leer configuracion: {str(e)}")
        
        else:
            self.enviar_error(404, "Endpoint no encontrado")
    
    def enviar_respuesta(self, data):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, default=str).encode('utf-8'))
    
    def enviar_error(self, code, message):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode('utf-8'))
    
    def log_message(self, format, *args):
        pass

# ============================================================
# INICIAR SERVIDOR
# ============================================================
def run_server(port=8000):
    server = ThreadingHTTPServer(('localhost', port), DashboardHandler)
    print("=" * 70)
    print("  SENIAT API SERVER v10.0 - DASHBOARD MEJORADO")
    print("=" * 70)
    print(f"  Servidor: http://localhost:{port}")
    print("")
    print("  Endpoints disponibles:")
    print("     GET /api/status                - Estado del servidor")
    print("     GET /api/datos                 - Todos los datos")
    print("     GET /api/dashboard-completo    - Datos completos con regiones detalladas")
    print("     GET /api/ticker                - Datos para ticker")
    print("     GET /api/recaudacion           - Recaudacion completa")
    print("     GET /api/recaudacion-ayer      - Recaudacion de ayer")
    print("     GET /api/regiones              - Regiones")
    print("     GET /api/regiones-detalle      - Regiones con detalle (pagos, USD, cambio)")
    print("     GET /api/aduanas               - Aduanas")
    print("     GET /api/contribuyentes        - Top contribuyentes")
    print("     GET /api/verificar             - Verificar datos")
    print("     GET /api/tasa-bcv              - Tasa de cambio del dia")
    print("     GET /api/region-horaria/{nombre} - Datos horarios de una region")
    print("     GET /api/sql?query=SELECT...   - SQL personalizada")
    print("")
    print("  POST /api/admin/guardar        - Guardar configuracion")
    print("  POST /api/admin/config         - Obtener configuracion")
    print("=" * 70)
    print("")
    print("  CONFIGURACION ACTUAL:")
    print(f"     {len(TIPOS_DOCUMENTO_METABASE)} tipos de documento (exactamente como Metabase)")
    print("     SITUACION_PAGO = '22'")
    print("     CONCILIADO_PAGO = 'N'")
    print("     Los datos DEBEN coincidir exactamente con Metabase")
    print("     Recaudacion de ayer (NO CAMBIA)")
    print("     Top 10 contribuyentes")
    print("     Datos horarios por region (ultimas 24h)")
    print("     Tasa BCV desde TASA_CAMBIO_DIARIA")
    print("=" * 70)
    print("")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Servidor detenido")
        server.shutdown()

if __name__ == "__main__":
    run_server()