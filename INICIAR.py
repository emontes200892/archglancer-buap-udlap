"""Ejecuta ArchGlancer localmente. Requiere Python 3; no requiere npm."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser

if __name__ == '__main__':
    directory = Path(__file__).resolve().parent / 'dist'
    if not (directory / 'index.html').is_file():
        raise SystemExit('Extrae todo el ZIP antes de iniciar; falta dist/index.html.')
    try:
        server = ThreadingHTTPServer(('127.0.0.1', 8000), partial(SimpleHTTPRequestHandler, directory=str(directory)))
    except OSError:
        server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(directory)))
    url = f'http://127.0.0.1:{server.server_port}'
    print(f'ArchGlancer: {url}\nMantén esta terminal abierta. Ctrl+C para cerrar.')
    webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
