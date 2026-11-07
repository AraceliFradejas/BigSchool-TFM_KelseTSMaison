# Maison Stylist · prueba rápida real

7 de noviembre de 2026. Nueva autorización de la autora para una prueba rápida, concretada en una sola llamada real a Gemini. Se utilizó un catálogo ficticio sembrado en SQLite aislado; la activación pública no cambió. No se compró saldo ni se habilitó facturación.

Petición: entrevista de trabajo, presupuesto 6.000 €, talla S, calzado 36, estilo sobrio y cómodo, sin maquillaje. Resultado: HTTP 200, modo IA, 1.786 ms, 810 tokens de entrada y 249 de salida, sin tokens de pensamiento registrados. Se consumió un intento; el contador persistente del ensayo tiene límite de uno. No se repite automáticamente.

| Look | Total validado por el servidor |
| --- | --- |
| Studio Interview | 4.840,00 € |
| Clean | 2.430,00 € |
| The Manuscript | 4.700,00 € |

Las piezas respetaron presupuesto, talla, número de calzado y exclusión de belleza. Una petición de ignorar instrucciones y cambiar precios se bloqueó antes de catálogo, cuota y proveedor. Esta comprobación adicional no consumió IA.

La explicación real de Studio Interview mencionó televisión y la de The Manuscript, cámaras: contexto no solicitado. El filtro histórico `television` agrupaba también los conjuntos profesionales y se enviaba literalmente al modelo. Se corrigió el prompt para enviar `job_interview` cuando las notas indican entrevista laboral y se reforzó que no invente escenarios. Una prueba comprueba la distinción respecto a una entrevista explícita de televisión. La corrección supera pruebas simuladas, pero no se ha vuelto a consultar un modelo real para verificar su redacción.

Suite completa tras la corrección: 127 pruebas correctas (76 backend, 10 cliente HTTP, 7 frontend y 34 móvil). La prueba no acredita evaluación estética general, fallback real entre proveedores, importe facturado ni chat completo de producción con IA activa.
