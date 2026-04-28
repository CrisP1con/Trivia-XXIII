# Historia Juan XXIII - Versión Flutter (Nativa)

Este proyecto es un "remake" nativo del juego de historia, diseñado para ofrecer el máximo rendimiento y una estética premium en dispositivos móviles.

## 🚀 Requisitos Previos

Para correr este proyecto necesitas:

1.  **Flutter SDK**: Descárgalo desde [flutter.dev](https://docs.flutter.dev/get-started/install/windows).
2.  **Android Studio**: Ya lo tienes instalado. Asegúrate de tener instalado el "Command Line Tools" en el SDK Manager de Android Studio.
3.  **Visual Studio Code**: Recomendado con las extensiones de "Flutter" y "Dart".

## 🛠️ Configuración Inicial

1.  Mueve esta carpeta (`PROYECTO_FLUTTER`) a una ubicación definitiva (ej: `C:\historia-app-flutter`).
2.  Abre una terminal dentro de la carpeta y ejecuta:
    ```bash
    flutter pub get
    ```
3.  Conecta un celular o abre un emulador.

## 🌐 Conexión con el Servidor

La app está configurada para conectarse al servidor Node.js que ya tienes funcionando. 
**Importante**: Debes actualizar la IP del servidor en el archivo `lib/services/api_service.dart`.

## 📦 Generar el APK Nativo

Para generar el archivo final para las tablets:
```bash
flutter build apk --split-per-abi
```
El archivo se encontrará en `build/app/outputs/flutter-apk/app-release.apk`.

## 🎨 Estética del Proyecto
- **Dark Mode**: Fondo `#0a0a0a` con acentos en Rojo (`#b91c1c`) y Azul (`#1d4ed8`).
- **Animaciones**: Uso de `animate_do` para entradas suaves de tarjetas y botones.
- **Tipografía**: Inter y Roboto vía Google Fonts.

---
*Desarrollado para el Instituto Juan XXIII*
