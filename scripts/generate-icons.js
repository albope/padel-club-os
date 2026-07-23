// Script para generar iconos PWA desde los SVG de marca «Marcador».
// Ejecutar: node scripts/generate-icons.js
//
// Base (icono redondeado verde): public/icons/icon.svg
// Maskable (verde a sangre, safe zone): public/icons/icon-maskable.svg

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');
const SVG_BASE = fs.readFileSync(path.join(ICONS_DIR, 'icon.svg'));
const SVG_MASKABLE = fs.readFileSync(path.join(ICONS_DIR, 'icon-maskable.svg'));

async function generarIconos() {
  const tamanos = [
    { nombre: 'icon-192x192.png', tamano: 192, maskable: false },
    { nombre: 'icon-512x512.png', tamano: 512, maskable: false },
    { nombre: 'icon-maskable-192x192.png', tamano: 192, maskable: true },
    { nombre: 'icon-maskable-512x512.png', tamano: 512, maskable: true },
    { nombre: 'apple-touch-icon.png', tamano: 180, maskable: false },
  ];

  for (const { nombre, tamano, maskable } of tamanos) {
    const input = maskable ? SVG_MASKABLE : SVG_BASE;
    await sharp(input)
      .resize(tamano, tamano)
      .png()
      .toFile(path.join(ICONS_DIR, nombre));
    console.log(`Generado: ${nombre} (${tamano}x${tamano})`);
  }

  console.log('\nTodos los iconos generados correctamente.');
}

generarIconos().catch(console.error);
