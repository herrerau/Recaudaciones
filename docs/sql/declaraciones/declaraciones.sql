-- ==============================================================================
-- Nombre: conteo_declaraciones_certificadas_30d.sql
-- Descripción: Cuenta las declaraciones certificadas/pagadas de los últimos 30 días.
-- Optimización: Se eliminaron 3 JOINs basura y se cambió OR por IN.
-- ==============================================================================

SELECT
  TRUNC(d.FECHA_DECLARACION, 'DD') AS FECHA_DECLARACION,
  COUNT(*) AS TOTAL_DECLARACIONES
FROM
  "DBO"."DECLARACION" d
  INNER JOIN "DBO"."SITUACION_DECLARACION" s 
    ON d.SITUACION_DECLARACION = s.CODIGO_SITUACION_DECLARACION
WHERE
  d.FECHA_DECLARACION >= TRUNC(SYSDATE - 30)
  AND d.FECHA_DECLARACION < TRUNC(SYSDATE + 1)
  AND s.DESCRIPCION_SITUACION_DECLARAC IN (
    'DEFINITIVA CERTIFICADA - PAGO > 0',
    'DEFINITIVA CERTIFICADA - PAGO CERO',
    'DECLARACION PAGADA',
    'DEFINITIVA - PENDIENTE RECEPCION DE PAGO',
    'DEFINITIVA CERTIFICADA - PENDIENTE DE PAGO DE PORCIONES'
  )
GROUP BY
  TRUNC(d.FECHA_DECLARACION, 'DD')
ORDER BY
  FECHA_DECLARACION ASC;