const fs = require('fs');
const path = require('path');

// Tamaños requeridos para Android
const sizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

console.log('Para generar los iconos de la APK, necesitas:');
console.log('1. Una imagen de alta resolución (mínimo 512x512px)');
console.log('2. Usar una herramienta online como:');
console.log('   - https://appicon.co/');
console.log('   - https://icon.kitchen/');
console.log('   - https://romannurik.github.io/AndroidAssetStudio/');
console.log('');
console.log('Tamaños necesarios para Android:');
Object.entries(sizes).forEach(([folder, size]) => {
  console.log(`- ${folder}/ic_launcher.png: ${size}x${size}px`);
  console.log(`- ${folder}/ic_launcher_round.png: ${size}x${size}px`);
});
console.log('');
console.log('Una vez generados, reemplaza los archivos en:');
console.log('android/app/src/main/res/mipmap-*/');
