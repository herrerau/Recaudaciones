-- ==============================================================================
-- Archivo: Recaudaciones/recaudaciones_falcon.sql
-- Descripción: Total recaudado en dólares por día (últimos 30 días) para la Región Falcón.
-- ==============================================================================

SELECT
  TRUNC(p.FECHA_HORA_TX_PAGO, 'DD') AS FECHA_PAGO,
  SUM(p.TOTAL_DOLARES) AS TOTAL_RECAUDADO_USD
FROM
  "DBO"."MEJORES_PAGADORES_GLOBAL" p
WHERE
  p.FECHA_HORA_TX_PAGO >= TRUNC(SYSDATE - 30)
  AND p.FECHA_HORA_TX_PAGO < TRUNC(SYSDATE + 1)
  AND p.REGION_NOMBRE = 'REGIÓN FALCÓN'
GROUP BY
  TRUNC(p.FECHA_HORA_TX_PAGO, 'DD')
ORDER BY
  FECHA_PAGO ASC;