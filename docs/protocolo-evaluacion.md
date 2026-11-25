# ArchGlancer BUAP-UDLAP: protocolo de evaluación piloto

Versión: 25 de noviembre de 2026. Protocolo propuesto, sin resultados experimentales.

## Pregunta
¿Una interfaz que integra capas, revisión de componentes, imágenes asociadas y
exportación por vista reduce tiempo y errores frente al flujo habitual de los usuarios?

## Datos y trazabilidad
Utilizar planos propios autorizados y un subconjunto identificable de un dataset.
Registrar origen, versión, licencia, formato, tamaño, unidades, número de entidades,
problemas de importación y criterios de selección. No redistribuir archivos sin permiso.
FloorPlanCAD se distribuye como SVG; no es un banco de DWG originales.
CubiCasa5K combina imágenes y anotaciones, con licencia no comercial según su repositorio.
Revisar las condiciones de cada descarga en origen. Los enlaces están en dist/datasets.html.
Separar por edificio/proyecto los casos usados para desarrollar de los usados para evaluar.
Evitar que pisos del mismo edificio aparezcan en ambos conjuntos.

## Referencia y tareas
Dos revisores deben comprobar independientemente una selección de entidades/vistas;
resolver desacuerdos y conservar el criterio y la procedencia de cada etiqueta.
Una etiqueta importada o sintética no equivale a una validación independiente.
Los IDs de trazo no siempre corresponden a una habitación o componente semántico completo.

Tareas equivalentes en ambas herramientas:
1. Localizar una vista y aislar las capas solicitadas.
2. Localizar entidades especificadas, revisar categoría y anotar discrepancias.
3. Asociar una imagen suministrada a la vista correcta.
4. Exportar el PDF con límites y escala acordados; comprobarlo contra el original.
5. Guardar y recuperar el trabajo sin perder etiquetas ni asociaciones.

## Diseño
Realizar primero un piloto de factibilidad (sin atribuirle potencia estadística).
Planificar después tamaño de muestra según la variabilidad y efecto relevante observados.
Alternar y contrabalancear el orden de las herramientas; proporcionar entrenamiento equivalente.
Usar tareas de dificultad comparable y criterios de finalización definidos antes de medir.
Registrar fallos y abandonos, no sólo los casos que importan correctamente.
Usar identificadores anónimos para participantes; seguir los requisitos institucionales del estudio.

## Medidas
Tiempo por tarea, éxito, errores frente a la referencia, correcciones necesarias y
pérdidas de información al exportar/recuperar. Registrar entorno, navegador y versión del código.
La plantilla evaluacion.csv se llena manualmente: ArchGlancer no instrumenta sesiones.
No mezclar precisión de anotación con fidelidad geométrica del importador.
Si más adelante se entrena un modelo, evaluar por clase y reservar un conjunto de prueba.
Reportar distribución e incertidumbre, no sólo promedios; distinguir piloto de estudio confirmatorio.

## Publicación
Posible contribución: flujo reproducible de inspección y anotación de planos, junto con
una evaluación de utilidad y limitaciones. Un visor por sí solo no demuestra novedad.
Publicar código/versiones, protocolo, esquema de anotaciones y datos autorizados.
No prometer compatibilidad con cualquier DWG ni presentar contornos 2D como reconstrucción 3D.
