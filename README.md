# 🎓 Historia App - Instituto Juan XXIII

Una aplicación educativa interactiva diseñada para el **Instituto Juan XXIII**, que permite a los alumnos aprender historia a través de una experiencia gamificada por equipos.

![Versión](https://img.shields.io/badge/versión-1.0.0-blue)
![Tecnologías](https://img.shields.io/badge/tech-React%20%7C%20Node.js%20%7C%20SQLite-green)

## 🚀 Características Principales

### 🎮 Para los Alumnos (El Juego)
- **Modo Equipos**: Competencia entre el Equipo Rojo y el Equipo Azul.
- **Experiencia Multimedia**: Cada época (tema) comienza con un video introductorio.
- **Sistema de Preguntas**: Tanda de preguntas por tiempo para cada equipo.
- **Scoreboard Dinámico**: Seguimiento de puntos en tiempo real con énfasis visual en el turno actual.

### 🛠️ Para los Docentes (Panel Admin)
- **Gestión de Contenido (ABM)**: Control total sobre Materias, Temas y Preguntas.
- **Subida de Videos**: Soporte para adjuntar archivos de video directamente al servidor (límite 500MB).
- **Dashboard de Estadísticas**: Vista rápida del total de contenidos cargados.
- **Modo Oscuro/Claro**: Interfaz premium con soporte para ambos temas.
- **Seguridad**: Acceso protegido por contraseña.

## 🛠️ Stack Tecnológico

- **Frontend**: React.js, Vite, Lucide React, Framer Motion (animaciones).
- **Backend**: Node.js, Express.js.
- **Base de Datos**: SQLite3 (liviana y portable).
- **Almacenamiento**: Multer para gestión de archivos multimedia.

## 📦 Instalación y Configuración

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/tu-usuario/historia-app.git
   cd historia-app
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar el servidor**:
   El servidor se inicializará automáticamente con una base de datos SQLite. No requiere configuración adicional de base de datos.

4. **Iniciar la aplicación**:
   En terminales separadas, ejecutar:
   
   **Frontend:**
   ```bash
   npm run dev
   ```
   **Backend:**
   ```bash
   node server/index.js
   ```

## 🔐 Acceso de Administración

El panel de administración se encuentra en `/admin`. 
- **Usuario por defecto**: `admin`
- **Contraseña**: (Configurada por el usuario)

## 📄 Licencia

Este proyecto fue desarrollado exclusivamente para el **Instituto Juan XXIII**.

---
Desarrollado con ❤️ para la educación.
