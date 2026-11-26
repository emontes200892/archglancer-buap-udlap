# Verificación de navegación y XYZ — 25 noviembre 2026

## Pruebas automatizadas

`npm test` pasó: importación DXF, transformaciones de bloques, cinco fixtures de distintas unidades/espacios, PDF vectorial, ZIP CAD, rueda del PDF y archivo ZIP XYZ.

El nuevo `scripts/check-stack.mjs` comprueba bytes de imágenes, orden explícito (incluido un orden distinto del alfanumérico), calibración, cursor, cámara y rechazo de ZIP/configuración/archivos incompletos.

## Prueba manual en Chrome

- Abrir el plano sintético, buscar `door-2`, guardar una nota y marcarlo revisado.
- Abrir XYZ desde Inicio, generar 64 × 64 × 32, invertir Z y mover un corte.
- Regresar a CAD: nota y revisión conservadas.
- Generar un PDF de dos páginas, pasar a XYZ y regresar al PDF: documento conservado.
- Abrir el manual integrado y usar su enlace de regreso: Inicio muestra el volumen existente.
- Revisar visualmente la distribución del menú horizontal y tarjetas del Inicio.
- En el visor XYZ independiente: descargar ZIP, recargar y reabrirlo. Se recuperaron orden invertido, corte Z 19/32 (`slice-013.png`), separaciones 1/1/2 y unidad de ejemplo.
- Abrir `?demo=volume`: carga automática correcta, sin escoger archivos.
- Manual PDF: 12 páginas renderizadas y revisadas; sin cortes ni superposición de texto.

Los scripts de navegador existentes se ajustaron para entrar en `/#cad`; no se ejecutaron en esta revisión. Las comprobaciones de interfaz descritas arriba se realizaron manualmente. La suite Node no valida por sí sola la renderización del navegador.

## Alcance

La conservación entre secciones dura mientras la pestaña no se recargue. No hay autoguardado permanente. CAD y XYZ son conjuntos independientes. El volumen sintético es un ejemplo matemático; no valida reconstrucción física. No se certifican DWG arbitrarios, correspondencia CAD/volumen, segmentación 3D, mediciones ni rendimiento con volúmenes grandes.
