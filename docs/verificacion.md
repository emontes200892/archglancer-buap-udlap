# Verificación de la edición de componentes

Fecha: 25 de noviembre de 2026. Base: commit d796990 del repositorio público.

Ejecutado satisfactoriamente:
- `npm test`: importación DXF, bloques/transformaciones, casos métricos e imperiales,
  informes de omisiones, PDF vectorial, ZIP y controles de rueda PDF.
- `npm run test:browser` en Chromium headless real: DXF, dos vistas, PDF multipágina,
  descarga por piso, recuperación de proyecto, recorte manual, capas, vínculos de
  renders, ajustes de impresión y ancho móvil de 390 px.
- Nuevas pruebas SVG: transformaciones, subtrazos separados, esquinas exactas,
  exclusión de scripts/imágenes externas, conservación del dibujo ante SVG inválido,
  semilla reproducible, búsqueda por ID de origen, edición de etiquetas, CSV, ZIP,
  generación de PDF y zoom con rueda en ambos sentidos. Sin errores JavaScript.
- Prueba de apertura del ejemplo público teaser01.svg de FloorPlanCAD: 1 876 contornos.
  Fuente: https://raw.githubusercontent.com/floorplancad/floorplancad.github.io/master/images/teaser01.svg
  No se incluye el archivo en la distribución. Es una prueba de apertura, no una
  evaluación de precisión de etiquetas o fidelidad de todo el dataset.

No se han vuelto a probar los DWG privados originales del usuario porque no están
disponibles en esta sesión. El motor DWG no se ha sustituido ni se certifica su
compatibilidad universal. No hay estudio de usuarios ni resultados científicos aún.
