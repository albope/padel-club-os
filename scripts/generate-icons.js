// Script para generar iconos PWA desde el SVG base
// Ejecutar: node scripts/generate-icons.js

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');
const SVG_PATH = path.join(ICONS_DIR, 'icon.svg');

// Leer el SVG base
const svgBuffer = fs.readFileSync(SVG_PATH);

// SVG con padding extra para variantes maskable (80% safe zone)
const svgContent = fs.readFileSync(SVG_PATH, 'utf8');
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(217,91%,52%)"/>
      <stop offset="100%" stop-color="hsl(197,85%,48%)"/>
    </linearGradient>
  </defs>
  <!-- Fondo completo (sin bordes redondeados para maskable) -->
  <rect width="512" height="512" fill="url(#bg)"/>
  <!-- Pista mas pequena (80% del area) -->
  <rect x="154" y="102" width="204" height="307" rx="10" stroke="white" stroke-width="10" fill="none" opacity="0.95"/>
  <line x1="154" y1="256" x2="358" y2="256" stroke="white" stroke-width="10" opacity="0.95"/>
  <line x1="256" y1="102" x2="256" y2="256" stroke="white" stroke-width="6" opacity="0.45"/>
  <line x1="154" y1="183" x2="358" y2="183" stroke="white" stroke-width="6" opacity="0.35"/>
  <line x1="256" y1="256" x2="256" y2="409" stroke="white" stroke-width="6" opacity="0.45"/>
  <line x1="154" y1="326" x2="358" y2="326" stroke="white" stroke-width="6" opacity="0.35"/>
</svg>`;

async function generarIconos() {
  const tamanos = [
    { nombre: 'icon-192x192.png', tamano: 192, maskable: false },
    { nombre: 'icon-512x512.png', tamano: 512, maskable: false },
    { nombre: 'icon-maskable-192x192.png', tamano: 192, maskable: true },
    { nombre: 'icon-maskable-512x512.png', tamano: 512, maskable: true },
    { nombre: 'apple-touch-icon.png', tamano: 180, maskable: false },
  ];

  for (const { nombre, tamano, maskable } of tamanos) {
    const input = maskable ? Buffer.from(maskableSvg) : svgBuffer;
    await sharp(input)
      .resize(tamano, tamano)
      .png()
      .toFile(path.join(ICONS_DIR, nombre));
    console.log(`Generado: ${nombre} (${tamano}x${tamano})`);
  }

  console.log('\nTodos los iconos generados correctamente.');
}

generarIconos().catch(console.error);
