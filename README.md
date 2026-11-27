# ArchGlancer BUAP-UDLAP — BIM 1 (experimental)

## Iniciar
python3 INICIAR.py
Abra http://localhost:8000. En Windows puede usar py en lugar de python3.
No abra index.html con doble clic. Este ZIP contiene el programa, no un proyecto
para el botón Abrir proyecto ZIP.

## Flujo
1. Cargar DWG o Abrir DXF / DWG / SVG / JSON. Espere la lectura del archivo.
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

Los ejemplos sintéticos CAD/XYZ/IFC se abren desde Inicio. No se asignan planos propios automáticamente. Se retiraron las 18 imágenes derivadas de los
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
- Archivos locales: no se suben a servidores de conversión. CAD/XYZ requieren guardar ZIP antes de cerrar. BIM tiene copia local automática opcional; usa su ZIP para respaldo independiente.
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

## Componentes y datasets (25 noviembre 2026)

- Importador SVG de contornos: paths con subtrazos separados, transformaciones de
  grupos, líneas, polígonos, rectángulos, círculos y elipses. Conserva atributos de
  origen y etiquetas disponibles. Omite texto, CSS, rellenos, referencias y recortes.
  Máximo 20 MB, 30 000 nodos, 100 000 contornos y 2 millones de vértices.
- Busca entidades por ID interno, ID de origen, capa o categoría; corrige etiquetas,
  notas y estado de revisión humana. Exporta la tabla CSV o guarda el proyecto ZIP.
  La categoría no modifica la capa ni cambia la geometría exportada.
- Generador de planos sintéticos reproducibles mediante semilla, sin cámara.
  Son esquemas 2D de prueba, no diseños constructivos ni renders fotorrealistas.
- Guía de acceso a datasets: [dist/datasets.html](dist/datasets.html).
  Los datasets externos no están incluidos; descarga en origen y revisa su licencia.
  Se carga un SVG a la vez. No hay descarga automática de Kaggle ni modelos de IA.
- [Protocolo piloto](docs/protocolo-evaluacion.md) y [plantilla vacía](docs/evaluacion.csv)
  para evaluar el sistema. No se han realizado todavía experimentos con usuarios.

### Prueba rápida

1. Abre Datasets CAD y pulsa Generar plano SVG (semilla 42).
2. Busca `door-2`, selecciona el resultado y edita categoría/nota; marca Revisado.
3. Pulsa Guardar etiqueta, exporta CSV y guarda el proyecto ZIP.
4. Marca la vista Modelo en Pisos y vistas y genera PDF con Ajustar a hoja.
5. Vuelve a abrir el ZIP y verifica la etiqueta y el PDF.
6. Repite con tu DXF/DWG y con un SVG externo; comprueba el informe de omisiones.

### Compilar y verificar

```bash
npm ci
npm run build
npm test
# Requiere Playwright y Chromium instalados para pruebas de navegador:
npm run test:browser
```

`PLAYWRIGHT_MODULE` permite indicar la ruta al módulo Playwright;
`CHROMIUM_EXECUTABLE` permite indicar el ejecutable del navegador.
`SVG_SMOKE_FILE` agrega a la prueba un SVG externo local, sin redistribuirlo.
El manual HTML y PDF se regeneran juntos con scripts/make-manual.py.


## Navegación integrada, ejemplos y XYZ (25 noviembre 2026)

- Menú Inicio / Plano CAD / PDF / Renders / XYZ / Manual en la misma sesión.
  El iframe XYZ se mantiene vivo al cambiar de sección. No hay autoguardado tras recargar.
- Inicio muestra un resumen del plano y del stack; no los registra espacialmente entre sí.
- Ejemplos locales: SVG sintético (semilla 42), DXF incluido y phantom matemático
  de 64 × 64 × 32 vóxeles (esfera y conducto, spacing 1:1:2 en unidades de ejemplo).
- Enlaces `?demo=cad`, `?demo=dxf`, `?demo=volume`: cargan el ejemplo en una sesión nueva.
  No comparten archivos privados ni anotaciones. No requieren servicios externos.
- Guardar/Abrir stack ZIP conserva imágenes y orden, calibración, cursor, exageración,
  zoom, desplazamiento y orientación de paneles. Es independiente del ZIP CAD.
  Esquema `archglancer-stack/1`; no es compatible con precomputed de Neuroglancer.
- XYZ sigue siendo un visor de cortes ortogonales y planos con textura; no mallas ni
  reconstrucción automática. Los ejemplos antiguos en perspectiva no son tomografía.
- Manual nuevo de 12 temas en HTML y PDF: navegación, ejemplos, CAD, revisión,
  exportación, renders, preparación XYZ, controles, recuperación y límites.
  Generar con Python + reportlab: `python scripts/make-manual.py`.
- Prueba `scripts/check-stack.mjs`: bytes, orden no alfabético, calibración, cursor,
  cámaras, entradas inválidas y archivos faltantes. Ver `docs/verificacion-navegacion.md`.

## BIM 1 · 26 noviembre 2026

Añade **Edificio 3D**, manteniendo las secciones previas. IFC STEP mediante web-ifc, 4 vistas de la misma geometría (planta XY, XZ, YZ y perspectiva), selección por expressID/GlobalId, filtros por nivel y tipo, propiedades básicas y material simple. Cortes vinculados, guía 3D, aislamiento y selección por clic o lista.

`?demo=bim` abre un IFC4 sintético propio de 19 componentes y 2 niveles. `scripts/make-ifc-demo.py` lo reproduce con IfcOpenShell 0.8.5; los GUID son deterministas. `dist/data/edificio-demo.expected.json` documenta las coordenadas esperadas. No es un edificio real ni un proyecto constructivo.

La sección BIM guarda una copia local opcional en IndexedDB. El ZIP BIM conserva el IFC original y el estado. Se abre con **Abrir BIM ZIP**, separado de los ZIP CAD y XYZ. El archivo descargable de la aplicación sigue siendo un instalable local, no un proyecto.

Límites BIM: 50 MB, 20 000 mallas, 2 millones de triángulos, coordenadas absolutas menores de 1 000 000 m. Lectura cancelable en worker. Sin WebGL2: modo compatible por CPU, hasta 50 000 triángulos, ordenación aproximada. No se cierran las caras cortadas ni se generan cotas/PDF desde IFC. No se registra IFC con CAD/PDF/XYZ, no se edita BIM ni se reconstruye un edificio desde DWG.

Verificación: `npm test` incluye la importación IFC real del ejemplo, niveles, IDs, coordenadas, metros/milímetros, material simple y ZIP BIM. Prueba interactiva realizada en modo compatible porque WebGL2 está desactivado en el navegador de pruebas; la ruta GPU requiere validación adicional.

Versión anterior preservada: commit `28576570ad1e3669fe8ef82dca545d96ce4d232b` (navegación XYZ). Esta entrega amplía esa misma aplicación. Guarda tus proyectos antes de cambiar de versión; conserva sus originales.


## Reconstrucción CAD 1 · 27 noviembre 2026

Amplía BIM 1 con extrusión revisable de polilíneas cerradas del recorte CAD, selección de capas y escala, alturas generales o por componente, exclusiones y vínculo con IDs CAD. No usa IA ni reconstruye desde PDF/renders; no infiere puertas, ventanas, losas o niveles. No garantiza cualquier DWG.

En Plano CAD: **Reconstruir esta vista en 3D**. En Edificio 3D: revisar capas y alturas, **Guardar reconstrucción ZIP** y **Abrir BIM ZIP**. El ZIP guarda el CAD del recorte y las ediciones, más el estado de vistas. Exportación OBJ en metros. **Generar cortes XYZ** produce 64 cortes de hasta 256 píxeles en el lado mayor; son una rasterización de alturas provisionales y deben regenerarse tras editar. Manual: temas 15 y 16.

Límites: 2 000 perfiles, 512 vértices/perfil, 50 000 triángulos; no se cierran trazos abiertos. Se omiten perfiles fuera del recorte y autointersecciones detectadas. Anillos contenidos de la misma capa se interpretan como huecos y requieren revisión. El recorte conserva entidades con vértices dentro; no realiza recorte geométrico.

Pruebas: `npm test` incorpora volumen de malla hueca, escala mm/m, duplicados, alturas/base, exclusiones y ZIP de reconstrucción. Prueba interactiva con un recorte CAD aportado por el usuario: selección enlazada, altura editable y generación XYZ; modo CPU compatible, GPU pendiente de validación. Datos privados de prueba no se incluyen en esta actualización.
