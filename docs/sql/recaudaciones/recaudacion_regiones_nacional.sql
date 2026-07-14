-- ==============================================================================
-- Nombre: suma_pagos_dolares_30d.sql
-- Descripción: Calcula el total recaudado en dólares por día en los últimos 30 días.
-- Optimización: Simplificación de funciones de fecha Oracle y uso de alias corto.
-- ==============================================================================

SELECT
  TRUNC(p.FECHA_HORA_TX_PAGO, 'DD') AS FECHA_PAGO,
  SUM(p.TOTAL_DOLARES) AS TOTAL_RECAUDADO_USD
FROM
  "DBO"."MEJORES_PAGADORES_GLOBAL" p
WHERE
  p.FECHA_HORA_TX_PAGO >= TRUNC(SYSDATE - 30)
  AND p.FECHA_HORA_TX_PAGO < TRUNC(SYSDATE + 1)
GROUP BY
  TRUNC(p.FECHA_HORA_TX_PAGO, 'DD')
ORDER BY
  FECHA_PAGO ASC;