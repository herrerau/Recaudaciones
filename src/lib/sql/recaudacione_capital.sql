-- ==============================================================================
-- Nombre: suma_pagos_dolares_region_capital_30d.sql
-- Descripción: Total recaudado en dólares por día (últimos 30 días) para la Región Capital.
-- Optimización: Uso de alias 'p', fechas simplificadas y eliminación de ruido visual.
-- ==============================================================================

SELECT
  TRUNC(p.FECHA_HORA_TX_PAGO, 'DD') AS FECHA_PAGO,
  SUM(p.TOTAL_DOLARES) AS TOTAL_RECAUDADO_USD
FROM
  "DBO"."MEJORES_PAGADORES_GLOBAL" p
WHERE
  p.FECHA_HORA_TX_PAGO >= TRUNC(SYSDATE - 30)
  AND p.FECHA_HORA_TX_PAGO < TRUNC(SYSDATE + 1)
  AND p.REGION_NOMBRE = 'REGION CAPITAL'
GROUP BY
  TRUNC(p.FECHA_HORA_TX_PAGO, 'DD')
ORDER BY
  FECHA_PAGO ASC;