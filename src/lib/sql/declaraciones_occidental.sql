-- ==============================================================================
-- Archivo: Declaraciones/declaraciones_centro_occidental.sql
-- Descripción: Conteo de declaraciones válidas por día (últimos 30 días) para la Región Centro Occidental.
-- ==============================================================================

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
    ON Dependencia.REGION_DEPENDENCIA = Region.CODIGO_REGION
  LEFT JOIN "DBO"."SITUACION_DECLARACION" Situacion_Declaracion 
    ON Declaracion.SITUACION_DECLARACION = Situacion_Declaracion.CODIGO_SITUACION_DECLARACION
WHERE
  Declaracion.FECHA_DECLARACION >= TRUNC(SYSDATE - 30)
  AND Declaracion.FECHA_DECLARACION < TRUNC(SYSDATE + 1)
  AND Region.NOMBRE_REGION = 'REGION CENTRO OCCIDENTAL'
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