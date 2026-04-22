# README_AI.md
## Proyecto: Juego interactivo de Historia Argentina para pantalla táctil Android
### Institución: Instituto Juan XXIII
### Contexto: 60 años educando con historia y futuro

---

## 1. Propósito del proyecto

Este proyecto consiste en una **aplicación interactiva educativa** pensada para una **pantalla táctil 4K con Android**, destinada a estudiantes de **3° año de secundaria**.

La experiencia debe combinar:

- contenido histórico argentino,
- dinámica de juego por equipos,
- reproducción de videos por bloque temático,
- preguntas y respuestas táctiles,
- puntaje en vivo,
- estética institucional,
- uso simple e intuitivo en aula.

No se busca una app genérica ni un sitio web común.  
Se busca una **experiencia inmersiva, escolar, visualmente fuerte e institucional**, lista para ser usada en clase, actos, muestras o jornadas pedagógicas.

---

## 2. Objetivo pedagógico

La aplicación debe ayudar a trabajar **Historia Argentina** vinculando:

- pasado,
- presente,
- ciudadanía,
- memoria,
- democracia,
- organización política,
- pensamiento crítico.

No debe ser un simple cuestionario.  
Debe sentirse como una **experiencia interactiva guiada**, con ritmo, competencia sana y contenido claro.

---

## 3. Público objetivo

- alumnos de secundaria (aprox. 14 a 16 años),
- docentes que conducen la actividad,
- uso grupal frente a pantalla táctil,
- dinámica por equipos.

---

## 4. Modo de uso esperado

La experiencia está pensada para ser usada así:

1. se inicia la app,
2. aparece pantalla institucional del colegio,
3. comienza el modo de juego por equipos:
   - equipo rojo,
   - equipo azul,
4. cada bloque histórico presenta:
   - título,
   - breve texto puente,
   - video explicativo,
5. luego del video comienza una serie de preguntas,
6. se alterna el turno entre equipos,
7. se muestra puntaje en vivo,
8. al final se presenta resultado y cierre institucional.

---

## 5. Estado actual del proyecto

Actualmente el proyecto ya tiene:

- React + Vite,
- interfaz principal funcional,
- modo equipos rojo/azul,
- cronómetro por pregunta,
- videos por estación,
- puntaje en vivo,
- pantalla inicial,
- pantalla de video,
- pantalla de preguntas,
- pantalla final,
- identidad visual institucional,
- estructura pensada para luego usar Capacitor y compilar APK Android.

---

## 6. Framework y stack técnico

### Base obligatoria
- React
- Vite
- CSS propio
- Framer Motion

### Futuro empaquetado móvil
- Capacitor para Android

### No usar salvo necesidad real
- No migrar a Next.js
- No migrar a Tailwind salvo pedido explícito
- No reemplazar CSS propio por frameworks pesados
- No agregar librerías UI innecesarias

Este proyecto debe seguir siendo:
- ligero,
- táctil,
- mantenible,
- fácil de ejecutar en entorno escolar.

---

## 7. Principios de diseño

### La interfaz debe ser:
- clara,
- grande,
- táctil,
- elegante,
- institucional,
- apta para pantalla 4K,
- legible a distancia.

### Debe evitar:
- botones pequeños,
- texto amontonado,
- exceso de elementos,
- estética de dashboard empresarial,
- apariencia de plantilla genérica.

### Inspiración visual
La app debe sentirse como una mezcla entre:
- museo interactivo,
- experiencia educativa premium,
- recurso institucional moderno.

---

## 8. Identidad institucional

La app pertenece al **Instituto Juan XXIII**.

Debe incorporar:
- logo institucional,
- frase institucional,
- clima visual serio pero atractivo,
- guiño a los **60 años** de trayectoria.

La identidad visual debe transmitir:
- historia,
- prestigio,
- formación,
- memoria,
- futuro.

No debe parecer un videojuego comercial ni una app infantil.

---

## 9. Estructura funcional esperada

### Pantalla 1: Inicio
Debe incluir:
- logo,
- nombre del colegio,
- subtítulo institucional,
- botón grande de inicio.

### Pantalla 2: Video por bloque
Debe incluir:
- nombre de la época,
- texto puente,
- reproductor de video,
- bloqueo hasta finalizar video,
- opción de saltar video si el docente lo desea.

### Pantalla 3: Preguntas
Debe incluir:
- marcador rojo/azul,
- turno actual,
- cronómetro,
- pregunta principal,
- opciones grandes táctiles,
- feedback visual tras responder.

### Pantalla 4: Final
Debe incluir:
- puntaje final,
- ganador o empate,
- cierre institucional,
- opción de reiniciar.

---

## 10. Contenido histórico actual

La app trabaja bloques como:

- Revolución de Mayo
- Independencia de 1816
- Rosas y conflictos internos
- Organización Nacional
- Modelo agroexportador
- Peronismo
- Dictadura de 1976
- Democracia y presente

Cada estación puede tener:
- video,
- texto puente,
- 4 o más preguntas,
- explicación breve por respuesta.

---

## 11. Carpetas y assets esperados

```bash
/public
  /logo.png
  /click.mp3
  /correct.mp3
  /wrong.mp3
  /transition.mp3
  /win.mp3
  /videos
    /mayo.mp4
    /independencia.mp4
    /rosas.mp4
    /organizacion.mp4
    /agroexportador.mp4
    /peronismo.mp4
    /dictadura.mp4
    /democracia.mp4