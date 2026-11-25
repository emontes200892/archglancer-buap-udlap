"""Bundle application sources without user datasets or precompiled dependencies."""
from pathlib import Path
import tarfile
root = Path(__file__).resolve().parent.parent
files = ['package.json', 'package-lock.json', 'README.md', 'THIRD_PARTY.md', 'INICIAR.py',
         'INICIAR_MAC_LINUX.sh', 'INICIAR_WINDOWS.bat']
for folder in ['src', 'scripts', 'docs']:
    files.extend(str(p.relative_to(root)) for p in (root / folder).rglob('*') if p.is_file() and '__pycache__' not in str(p))
for p in (root / 'dist').iterdir():
    if p.suffix in ('.html', '.css', '.js') and p.name not in ('production.js', 'svg-import.js'):
        files.append(str(p.relative_to(root)))
with tarfile.open(root / 'dist/licenses/archglancer-source.tar.gz', 'w:gz') as archive:
    for name in sorted(files):
        archive.add(root / name, arcname=name)
print('Application source archive:', len(files), 'files')
