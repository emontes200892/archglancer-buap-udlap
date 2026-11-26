# BIM 1 — 26 noviembre 2026

Versión anterior preservada: `28576570ad1e3669fe8ef82dca545d96ce4d232b`.

## Evidencia

- `npm test`: pasó la suite existente DXF, PDF, proyectos CAD, rueda PDF y stack XYZ, más `check-bim.mjs`.
- IFC4 de ejemplo: 19 componentes, 2 niveles, GUIDs deterministas; se comprobaron tipo, pertenencia a nivel, coordenadas XYZ, puertas, material simple y conversión metros/milímetros contra dimensiones conocidas del generador.
- IfcOpenShell: validación básica de esquema sin hallazgos. No se ejecutaron reglas EXPRESS adicionales por falta de la dependencia pytest; no se afirma validación completa del esquema.
- ZIP BIM: prueba automatizada de ida/vuelta conserva bytes IFC y estado; rechaza configuración inválida y paquetes dañados.
- Chrome: carga de IFC en worker, selección de ambas puertas desde la lista, filtros por nivel, cuatro vistas y cortes vinculados. Selección y corte conservados al regresar desde Inicio.
- Chrome: tras recargar, la copia local restauró la puerta #369 del Nivel 1, filtro por nivel y Z=4.31 m.
- Regresión interactiva: plano sintético CAD, PDF de dos páginas, volumen XYZ 64×64×32 y regreso a BIM con selección conservada.
- Manual: 14 páginas renderizadas y revisadas sin desbordamiento.

## Límites de la verificación

El navegador de pruebas tiene WebGL2 desactivado. Se verificó la ruta compatible por CPU, no la ruta GPU. Esta versión se publica como experimental; necesita prueba GPU en otros equipos y evaluación con IFC diversos antes de considerarse producción. El ZIP BIM se comprobó en Node; no se completó una prueba interactiva de importación ZIP en esta revisión. No hay generación de PDF desde IFC ni registro espacial entre IFC/CAD/XYZ.
