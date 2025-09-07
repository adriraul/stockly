#!/bin/bash

echo "🚀 Generando APK para Stockly..."
echo ""

# Verificar que EAS CLI está instalado
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI no está instalado. Instalando..."
    npm install -g eas-cli
fi

# Verificar que estamos logueados en Expo
echo "🔐 Verificando autenticación..."
if ! eas whoami &> /dev/null; then
    echo "❌ No estás logueado en Expo. Ejecuta: eas login"
    exit 1
fi

echo "✅ Autenticado correctamente"
echo ""

# Configurar EAS si no existe
if [ ! -f "eas.json" ]; then
    echo "⚙️ Configurando EAS Build..."
    eas build:configure
fi

echo "📱 Iniciando build de APK..."
echo ""

# Generar APK para Android
eas build --platform android --profile preview

echo ""
echo "✅ Build iniciado. Puedes seguir el progreso en:"
echo "   https://expo.dev/accounts/[tu-usuario]/projects/stockly/builds"
echo ""
echo "📥 Una vez completado, podrás descargar la APK desde el enlace anterior."
