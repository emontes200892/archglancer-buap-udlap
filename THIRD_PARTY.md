# Third-party software

- PDF.js / pdfjs-dist 6.3.289, Mozilla contributors, Apache-2.0.
  License: dist/licenses/pdfjs-dist-LICENSE.txt; https://github.com/mozilla/pdf.js
- pdf-lib 1.17.1, Andrew Dillon, MIT.
  License: dist/licenses/pdf-lib-LICENSE.txt; https://github.com/Hopding/pdf-lib
- fflate 0.8.3, Arjun Barrett, MIT.
  License: dist/licenses/fflate-LICENSE.txt; https://github.com/101arrowz/fflate

- dxf-parser 1.1.2, copyright GDS Storefront Estimating, MIT.
  License: dist/licenses/dxf-parser-MIT.txt. Source and build version in package-lock.json.
- @mlightcad/libredwg-web 0.7.14 / GNU LibreDWG, GPL-3.0.
  License: dist/licenses/GPL-3.txt.
  Corresponding upstream source: dist/licenses/libredwg-source-v0.7.14.tar.gz.
  Tag v0.7.14, commit 1dd682f46339f37b67c5ff1085d10d04a8c16d7e:
  https://github.com/mlightcad/libredwg-web/tree/v0.7.14
  Includes the pinned jsmn submodule, C/C++ sources, JavaScript/TypeScript bindings
  and build scripts. Binary CAD test drawings, media and precompiled WASM are omitted
  from the source archive; none are inputs needed to compile the motor. Build instructions
  are in bindings/javascript/README.md and its package.json.
  The npm-distributed WASM is unmodified.
- esbuild 0.28.2 is a build-time dependency (MIT); it is not shipped as a runtime.

Application source is available as dist/licenses/archglancer-source.tar.gz and in
the supplied code ZIP. CAD integration code is GPL-3.0-or-later, without warranty.
User drawings, raster PDF pages, logos and datasets are excluded from code licensing.
