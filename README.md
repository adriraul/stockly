# STOCKLY - Inventario de Alimentos Personal

Una aplicación móvil completa para gestionar tu inventario de alimentos personal, desarrollada con React Native, TypeScript y Expo.

**Creado por Adrián Bravo** 🚀

## 🚀 Estado Actual

✅ **Aplicación Funcional**: La aplicación está completamente implementada y funcional
✅ **UI Completa**: Todas las pantallas y componentes están creados
✅ **Base de Datos**: SQLite configurado con repositorios usando expo-sqlite
✅ **Lógica de Negocio**: FIFO, alertas, plantillas implementadas
✅ **Diseño Moderno**: UI atractiva y responsiva
✅ **Expo Ready**: Configurado para desarrollo con Expo
✅ **EAS Build**: Configurado para generar APK de producción
✅ **APK Lista**: Preparada para distribución

## 📱 Cómo Probar la Aplicación

### Opción 1: Android Emulator (Recomendado)

1. **Instalar Android Studio**:

   - Descarga desde: https://developer.android.com/studio
   - Instala y configura el SDK de Android

2. **Crear un emulador**:

   - Abre Android Studio
   - Ve a AVD Manager
   - Crea un nuevo emulador (recomendado: Pixel 9 con Android 16)

3. **Ejecutar la aplicación**:
   ```bash
   cd /home/abravo/Projects/StocklyApp
   npx expo start --android --clear
   ```

### Opción 2: Dispositivo Físico con Expo Go

1. **Instalar Expo Go**:

   - Descarga desde Google Play Store o App Store

2. **Ejecutar la aplicación**:

   ```bash
   cd /home/abravo/Projects/StocklyApp
   npx expo start
   ```

3. **Escanear QR**: Usa la app Expo Go para escanear el código QR

## 🎯 Funcionalidades Implementadas

### ✅ Pantallas Completas

- **Dashboard**: Pantalla principal con estadísticas
- **Inventario**: Lista de productos con stock
- **Detalle de Producto**: Edición y gestión de items
- **Plantilla Ideal**: Configuración de cantidades ideales
- **Lista de Compra**: Generada automáticamente
- **Caducidades**: Productos próximos a caducar
- **Exportar**: Respaldos en CSV/JSON
- **Configuración**: Ajustes de la aplicación

### ✅ Componentes UI

- **Card**: Contenedor con sombra
- **Button**: Botón con variantes
- **Input**: Campo de entrada con validación
- **Badge**: Etiqueta de estado
- **QuantityStepper**: Selector de cantidad

### ✅ Base de Datos

- **SQLite**: Almacenamiento local
- **Repositorios**: Patrón DAO para acceso a datos
- **Migraciones**: Sistema inteligente de migración de esquemas
- **Preservación de Datos**: Los datos se mantienen entre actualizaciones

### ✅ Lógica de Negocio

- **FIFO**: Consumo por orden de caducidad
- **Alertas**: Productos próximos a caducar
- **Plantillas**: Cantidades ideales por producto
- **Lista de Compra**: Generada automáticamente

## 🔄 Sistema de Migración de Base de Datos

### ¿Por qué es importante?

La aplicación incluye un **sistema inteligente de migración** que garantiza que **nunca se pierdan los datos** al actualizar la aplicación. Esto es crucial cuando distribuyes la APK a amigos o familiares.

### ¿Cómo funciona?

1. **Control de Versiones**: La base de datos tiene un sistema de versionado interno
2. **Migración Automática**: Al abrir la app, detecta si necesita actualizar el esquema
3. **Preservación de Datos**: Migra los datos existentes a la nueva estructura
4. **Solo si es Necesario**: Si la versión es la misma, no hace nada

### Ejemplo Práctico

```typescript
// Versión actual de la base de datos
private readonly DATABASE_VERSION = 2;

// Al abrir la app:
// - Si es versión 0: Crea base de datos nueva
// - Si es versión 1: Migra a versión 2 preservando datos
// - Si es versión 2: No hace nada, todo está actualizado
```

### Migraciones Implementadas

- **Versión 1 → 2**: Migración de columna `category` de `NOT NULL` a `NULL`
  - Convierte automáticamente "Sin categoría" a `NULL`
  - Preserva todos los productos existentes

### Para Futuras Actualizaciones

Cuando necesites cambiar el esquema de la base de datos:

1. **Incrementa la versión**:

   ```typescript
   private readonly DATABASE_VERSION = 3; // Nueva versión
   ```

2. **Agrega la migración**:
   ```typescript
   if (fromVersion < 3) {
     await this.migrateToVersion3();
     await this.setDatabaseVersion(3);
   }
   ```

### Ventajas

- ✅ **Datos Seguros**: Los usuarios nunca pierden su inventario
- ✅ **Actualizaciones Transparentes**: Se aplican automáticamente
- ✅ **Escalable**: Fácil agregar nuevas migraciones
- ✅ **Robusto**: Solo recrea la base de datos en casos extremos

## 🛠️ Estructura del Proyecto

```
StocklyApp/
├── src/
│   ├── components/          # Componentes UI reutilizables
│   ├── screens/            # Pantallas de la aplicación
│   ├── services/           # Lógica de negocio y base de datos
│   │   ├── database/       # Configuración de SQLite
│   │   └── repositories/   # Acceso a datos
│   ├── types/              # Definiciones de TypeScript
│   └── navigation/         # Configuración de navegación
├── android/                # Código nativo Android
├── ios/                    # Código nativo iOS
└── public/                 # Archivos estáticos para web
```

## 🎨 Diseño

- **Colores**: Azul corporativo (#0369a1)
- **Tipografía**: Sistema nativo de React Native
- **Iconos**: Emojis para mejor UX
- **Layout**: Responsive y moderno

## 📝 Scripts Disponibles

### Desarrollo

- `npx expo start`: Inicia el servidor de desarrollo Expo
- `npx expo start --android`: Ejecuta en Android emulator
- `npx expo start --ios`: Ejecuta en iOS simulator
- `npx expo start --web`: Ejecuta en navegador web

### Generación de APK

- `eas build --platform android --profile production`: Genera APK de producción
- `eas build --platform android --profile preview`: Genera APK de preview
- `eas build --platform android --profile development`: Genera APK de desarrollo

### Scripts Personalizados

- `./scripts/build-apk.sh`: Script automatizado para generar APK
- `node scripts/generate-icons.js`: Guía para generar iconos Android

## 🐛 Solución de Problemas

### Error de Android SDK

Si ves "SDK location not found":

1. Instala Android Studio
2. Configura ANDROID_HOME
3. Crea un emulador

### Error de Dependencias

Si hay conflictos de versiones:

```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Error de Metro

Si Metro no inicia:

```bash
npx react-native start --reset-cache
```

## 🚀 Generar APK de Producción

### Método 1: EAS Build (Recomendado)

1. **Asegúrate de estar logueado**:

   ```bash
   eas login
   ```

2. **Generar APK de producción**:

   ```bash
   eas build --platform android --profile production
   ```

3. **Descargar APK**: Una vez completado, descarga el APK desde el enlace que te proporcione EAS

### Método 2: Script Automatizado

```bash
chmod +x scripts/build-apk.sh
./scripts/build-apk.sh
```

### Método 3: Build Local (Avanzado)

```bash
eas build --platform android --profile production --local
```

## 📱 Instalación en Dispositivo

1. **Habilitar fuentes desconocidas** en tu Android
2. **Transferir el APK** a tu dispositivo
3. **Instalar** tocando el archivo APK
4. **¡Disfrutar!** Tu app Stockly estará lista para usar

## 📞 Soporte

La aplicación está **100% funcional** y lista para usar. Si encuentras algún problema:

1. Verifica que todas las dependencias estén instaladas
2. Usa `npm run web` para probar rápidamente
3. Configura Android Studio para probar en móvil

---

**STOCKLY** - Tu inventario de alimentos personal, siempre organizado. 🥕📦
