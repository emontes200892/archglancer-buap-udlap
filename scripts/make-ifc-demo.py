"""Edificio sintético de dos niveles. Requiere ifcopenshell==0.8.5 y numpy.
No es un proyecto constructivo. Geometría y etiquetas creadas para pruebas.
"""
from pathlib import Path
import hashlib, json
import numpy as np
import ifcopenshell
from ifcopenshell.api import root, unit, context, aggregate, spatial, geometry, material, pset

f = ifcopenshell.file(schema='IFC4')
def entity(kind, name):
    e = root.create_entity(f, ifc_class=kind, name=name)
    e.GlobalId = ifcopenshell.guid.compress(hashlib.md5(('archglancer-demo:' + name).encode()).hexdigest())
    return e
project = entity('IfcProject', 'ArchGlancer - edificio sintetico')
unit.assign_unit(f, units=[unit.add_si_unit(f, unit_type='LENGTHUNIT')])
model = context.add_context(f, context_type='Model')
body = context.add_context(f, context_type='Model', context_identifier='Body', target_view='MODEL_VIEW', parent=model)
site, building = entity('IfcSite', 'Sitio de ejemplo'), entity('IfcBuilding', 'Edificio de dos niveles')
aggregate.assign_object(f, products=[site], relating_object=project)
aggregate.assign_object(f, products=[building], relating_object=site)
materials = {n: material.add_material(f, name=n) for n in ['Concreto de ejemplo', 'Madera de ejemplo']}
expected = []
for n, elevation in enumerate([0., 3.]):
    floor = entity('IfcBuildingStorey', ['Planta baja', 'Nivel 1'][n]); floor.Elevation = elevation
    aggregate.assign_object(f, products=[floor], relating_object=building)
    placement = np.eye(4); placement[2, 3] = elevation
    geometry.edit_object_placement(f, product=floor, matrix=placement)
    boxes = [
        ('IfcSlab', 'Losa', (0,0,0), (12,8,.25)),
        ('IfcWall', 'Muro oeste', (0,0,.25), (.2,8,2.75)),
        ('IfcWall', 'Muro este', (11.8,0,.25), (.2,8,2.75)),
        ('IfcWall', 'Muro posterior', (0,7.8,.25), (12,.2,2.75)),
        ('IfcWall', 'Frente izquierdo', (0,0,.25), (2,.2,2.75)),
        ('IfcWall', 'Frente derecho', (3.2,0,.25), (8.8,.2,2.75)),
        ('IfcWall', 'Dintel entrada', (2,0,2.35), (1.2,.2,.65)),
        ('IfcDoor', 'Puerta principal', (2,.05,.25), (1.2,.08,2.1)),
        ('IfcWall', 'Division interior', (6,2.8,.25), (.15,5,2.75)),
    ]
    if n == 1: boxes.append(('IfcSlab', 'Cubierta', (0,0,3), (12,8,.25)))
    for kind, name, xyz, size in boxes:
        e = entity(kind, f'{name} / {floor.Name}')
        spatial.assign_container(f, products=[e], relating_structure=floor)
        rep = geometry.add_wall_representation(f, context=body, length=size[0], thickness=size[1], height=size[2])
        geometry.assign_representation(f, product=e, representation=rep)
        mat = np.eye(4); mat[:3, 3] = [xyz[0], xyz[1], xyz[2]+elevation]
        geometry.edit_object_placement(f, product=e, matrix=mat)
        material.assign_material(f, products=[e], material=materials['Madera de ejemplo' if kind=='IfcDoor' else 'Concreto de ejemplo'])
        if kind == 'IfcDoor': e.OverallWidth, e.OverallHeight = size[0], size[2]
        properties = pset.add_pset(f, product=e, name='ArchGlancer_Example')
        pset.edit_pset(f, pset=properties, properties={'Synthetic': True, 'Purpose': 'Demostracion y pruebas, no construccion'})
        expected.append({'id':e.id(),'guid':e.GlobalId,'name':e.Name,'type':kind.upper(),'storey':floor.Name,'bounds':[xyz[0],xyz[1],xyz[2]+elevation,xyz[0]+size[0],xyz[1]+size[1],xyz[2]+elevation+size[2]]})
out = Path(__file__).resolve().parent.parent/'dist/data'
f.header.file_name.name = 'edificio-demo.ifc'; f.header.file_name.time_stamp = '2026-11-26T00:00:00'
f.header.file_name.author = ('ArchGlancer BUAP-UDLAP',)
f.write(str(out/'edificio-demo.ifc'))
(out/'edificio-demo.expected.json').write_text(json.dumps({'synthetic':True,'units':'m','schema':'IFC4','count':len(expected),'elements':expected},indent=2),encoding='utf-8')
print(f'IFC4 sintético: {len(expected)} componentes, 2 niveles, metros')
