// Bundles the database map (src/) into ../public/map/app.js.
//   npm install     (once, in this folder)
//   npm run build
import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';
const here = path.dirname(fileURLToPath(import.meta.url));
await build({
  entryPoints: [path.join(here, 'src/boot.js')],
  bundle: true, minify: true, format: 'iife', target: 'es2020',
  outfile: path.join(here, '../public/map/app.js'),
  alias: { 'three/webgpu': path.join(here, 'src/webgpu-stub.js') },   // the map renders with WebGL only
  legalComments: 'none', logLevel: 'info',
});
