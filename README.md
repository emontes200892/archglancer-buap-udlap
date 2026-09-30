# ArchGlancer BUAP-UDLAP — PDF por piso desde DWG/DXF

## Iniciar
python3 INICIAR.py
Abra http://localhost:8000. En Windows puede usar py en lugar de python3.
No abra index.html con doble clic. Este ZIP contiene el programa, no un proyecto
para el botón Abrir proyecto ZIP.

## Flujo
1. Cargar DWG o Abrir DXF / DWG / JSON. Espere la lectura del archivo.
2. Pisos y vistas del CAD enumera las ventanas 2D recuperadas del original.
3. Ver en CAD permite revisar cada ventana; edite el nombre y marque las que
   correspondan a los pisos deseados. Puede quitar cortes y detalles de la lista.
4. Si un piso está dentro del Modelo sin ventana propia, encuádrelo y pulse
   Delimitar un piso en el dibujo. Arrastre un rectángulo; Esc cancela.
5. Generar PDF de pisos produce un documento con las vistas marcadas e informe.
   PDF por piso (ZIP) genera un PDF por selección, más informe.txt separado.
6. A3/A4 ajusta la geometría a la hoja. La escala de impresión no está certificada.
7. Guardar proyecto ZIP conserva el CAD original cargado, geometría, selección y
   nombres de pisos, renders y último PDF. Abrir proyecto ZIP los recupera.
   Se conservan las capas visibles, textos y vista elegida; el zoom y desplazamiento temporales se reajustan.

No hay planos ni pisos precargados. Se retiraron las 18 imágenes derivadas de los
PDF anteriores, su visor y el recorte CTC precalculado. Los PDF se trazan con
geometría del CAD cargado, no con esas imágenes ni con los renders.
La galería comienza vacía. Los 51 renders CTC se ofrecen como ejemplo opcional y no se asignan a otros dibujos.

## Qué significa detectar pisos
Las ventanas de presentación son vistas candidatas: pueden mostrar pisos, cortes,
instalaciones o detalles. No se presupone un número de pisos ni se identifica una
ventana con un piso sin revisión. En el CTC suministrado se recuperaron 38 vistas;
las presentaciones tienen nombres como ARQUITECTONICO, ALBAÑILERIA y CORTES.
No se recuperó una estructura que identifique automáticamente nueve pisos.
Para CAD sin ventanas compatibles se requiere delimitar los pisos sobre el modelo.

## Límites
- DXF ASCII: 300 MB. DWG experimental LibreDWG: 100 MB. JSON: 300 MB.
- 250 000 trazos y 5 millones de vértices por dibujo.
- Ventanas ortogonales sin giro. No conserva recortes no rectangulares ni todas
  las reglas de visibilidad de capas por viewport.
- PDF vectorial con líneas negras, curvas discretizadas, Helvetica de sustitución,
  sin CTB/STB, SHX, estilos completos, xrefs, imágenes enlazadas ni sólidos 3D.
- La lectura parcial de DWG produce PDF parcial. Revise el informe de omisiones.
- Máximo 100 vistas y 2 millones de segmentos por exportación PDF individual.
- PDF local multipágina: 100 MB; visualización sin OCR ni edición.
- Renders: JPG/PNG/WebP; 100 imágenes, 32 MB cada una, 512 MB total, 80 MP por imagen.
- Proyecto descargable: 512 MB descomprimido; exige memoria adicional.
- Archivos locales: no se suben a servidores ni se guardan automáticamente.
- Esta versión es beta, sin garantía de compatibilidad universal o fidelidad AutoCAD.

## Comprobaciones
Lectura del DXF CTC: 107 072 trazos, 98 capas, 38 ventanas.
Lectura del DWG CTC: 100 565 trazos; el motor devuelve aviso 68, lectura parcial.
Las comprobaciones históricas del CTC corresponden a la v7. Los archivos CAD originales no están incluidos en este paquete.
Pruebas de importación, transformación de bloques, selección de capas, ZIP y PDF.
La v8 se probó en Chromium 153 real: importación DXF de prueba, dos vistas
CAD, visualización PDF multipágina, descarga por piso, recuperación del proyecto,
recorte manual, rechazo de DXF inválido y ancho móvil (390 px), sin errores JS.
La prueba interactiva utilizó datos sintéticos; no certifica fidelidad universal de DWG.
Se corrigió la reapertura del visor PDF (cierre del loading task), se recortan
segmentos fuera de la hoja y se permite cancelar exportaciones entre lotes.

## Desarrollo
npm ci
node scripts/build-cad.mjs
node scripts/build-production.mjs
node scripts/test-import.mjs
node scripts/check-cad.cjs
node scripts/check-renders.cjs
node scripts/check-production.mjs

src/floor-sheets.mjs: selección y delimitación de pisos/vistas.
src/pdf-export.mjs: trazado vectorial del CAD al PDF.
src/cad-import.mjs y src/dwg-adapter.mjs: importación.
Los ejemplos CAD/PDF y renders son del usuario; no están bajo licencia del código.
Consulte THIRD_PARTY.md y dist/licenses/ para las licencias del software libre.

## Funciones de esta edición
- Clasificación por piso, corte, detalle o fachada; orden con ↑/↓ y notas de revisión.
- Asociación manual de cada render con una vista CAD; botón para navegar a ella.
- Hojas A4/A3/A2/A1, vertical u horizontal y grosor uniforme configurable.
- Ajustar a hoja o escala 1:50, 1:100, 1:200, 1:500. Para escala numérica debe
  indicar correctamente las unidades del CAD. La exportación rechaza una vista
  que no cabe en lugar de recortarla silenciosamente. Imprima al 100 %, sin ajuste,
  y verifique una medida conocida. No sustituye un plano certificado.
- Proyecto ZIP conserva clasificación, orden, notas, vínculos de renders y
  opciones de impresión. El PDF por piso respeta el orden mostrado.

## Paquete completo y alcance
Incluye código fuente, visor compilado, motor DWG libre, motor PDF, logos BUAP y
UDLAP y los 51 renders originales. No necesita npm para ejecutarlo ni servicios
CAD comerciales. Requiere Python 3 y un navegador moderno para uso local.
Los logos identifican las instituciones; no implican aval de la aplicación.
La aplicación sigue siendo beta: no equivale a un trazador universal de DWG.
Los pisos necesitan revisión humana; no hay reconstrucción 3D ni segmentación IA.
No utiliza imágenes inventadas o extraídas de antiguos PDFs para generar planos.

## Manual de uso
Abra dist/manual.html o Manual_ArchGlancer_BUAP_UDLAP.pdf. También puede usar el botón Manual de la aplicación.

## Edición general (28 septiembre 2026)
- Inicio vacío, sin planos ni renders asignados al proyecto.
- Cada carga CAD nueva inicia su propio conjunto de imágenes y limpia el último
  PDF; guarda el proyecto anterior antes de cargar otro dibujo.
- Proyectos ZIP válidos con cero renders. Recuperación de capas, textos y vista.
- Vistas candidatas de las ventanas del archivo o, si no hay ventanas, una por
  espacio con geometría. No se presupone un número de pisos. Las propuestas
  comienzan desmarcadas; revísalas antes de exportar.
- Clasificación sugerida a partir del nombre de la vista (planta, corte, detalle,
  fachada y equivalentes en inglés). Es una regla de texto, no segmentación IA.
- Unidades de impresión preseleccionadas cuando el archivo las declara. Incluye
  pulgadas, pies, kilómetros, micrómetros y nanómetros además de mm/cm/m.
- Diagnóstico JSON descargable con formato, versión, unidades, espacios,
  elementos recuperados, omisiones y advertencias. No calcula una falsa tasa
  de integridad a partir del número de entidades.
- Pruebas sintéticas de casos métricos/imperiales, capas arbitrarias, espacios,
  bloque rotado y objeto omitido: node scripts/check-general.mjs.
- Prueba real de navegador de dos proyectos independientes, ZIP sin imágenes,
  limpieza de PDF/renders, unidades en pies y restauración de capas.

La compatibilidad DWG sigue siendo experimental: esta edición generaliza el
manejo de archivos y proyectos, no sustituye el motor por un trazador universal.
No incluye autoguardado: descarga el proyecto ZIP para conservar tu trabajo.
