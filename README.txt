PROYECTO: Historia Argentina - Instituto Juan XXIII

1) Instalar dependencias:
   npm install

2) Ejecutar en desarrollo:
   npm run dev

3) Archivos que tenés que agregar manualmente en /public:
   - logo.png
   - click.mp3
   - correct.mp3
   - wrong.mp3
   - transition.mp3
   - win.mp3

4) Videos que tenés que agregar en /public/videos:
   - mayo.mp4
   - independencia.mp4
   - rosas.mp4
   - organizacion.mp4
   - agroexportador.mp4
   - peronismo.mp4
   - dictadura.mp4
   - democracia.mp4

5) Para Android con Capacitor:
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init
   npx cap add android
   npm run build
   npx cap sync
   npx cap open android
