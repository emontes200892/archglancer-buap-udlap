"""Export the architectural viewport as portable ArchGlancer JSON.
Usage: python scripts/export_dxf.py source.dxf dist/data/ctc.json
Requires ezdxf. Curves are approximated; unsupported entities are counted.
"""
import sys, json, collections
from pathlib import Path
import ezdxf
from ezdxf.path import make_path

doc = ezdxf.readfile(sys.argv[1])
bounds = [95.55, 249.80, 122.93, 269.54]
objects, skipped = [], collections.Counter()

def visit(entity, ident, inherited='0', depth=0):
    kind = entity.dxftype()
    layer = entity.dxf.get('layer', '0')
    if layer == '0': layer = inherited
    if kind == 'INSERT' and depth < 12:
        try:
            for i, child in enumerate(entity.virtual_entities()):
                visit(child, f'{ident}/{i}', layer, depth+1)
        except Exception: skipped[kind] += 1
        return
    try:
        if kind in ('TEXT', 'MTEXT'):
            p = entity.dxf.insert
            points = [[p.x, p.y]]
            label = entity.plain_text()
        else:
            points = [[v.x, v.y] for v in make_path(entity).flattening(0.015)]
            label = None
        if not points: return
        xs, ys = list(zip(*points))
        if max(xs)<bounds[0] or min(xs)>bounds[2] or max(ys)<bounds[1] or min(ys)>bounds[3]: return
        # Keep complete intersecting entities; viewport clipping occurs in viewer.
        obj = dict(id=ident, layer=layer, type=kind, points=[[round(x,5),round(y,5)] for x,y in points])
        if label: obj['label'] = label
        objects.append(obj)
    except (TypeError, ValueError, AttributeError, NotImplementedError): skipped[kind] += 1

for e in doc.modelspace(): visit(e, e.dxf.handle)
data = dict(schema='archglancer/1', name='CTC · Arquitectónico DXF', units='m (cabecera DXF; sin calibrar)', bounds=bounds,
    description='Recorte de la lámina ARQUITECTONICO. Correspondencia con PB de los PDF no verificada. Curvas aproximadas; no incluye todas las clases DXF.',
    source=dict(file=Path(sys.argv[1]).name, layout='ARQUITECTONICO', unsupported=dict(skipped)), objects=objects)
Path(sys.argv[2]).parent.mkdir(parents=True,exist_ok=True)
Path(sys.argv[2]).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
print(f'{len(objects)} objects; {len(set(o["layer"] for o in objects))} layers; skipped {dict(skipped)}')
