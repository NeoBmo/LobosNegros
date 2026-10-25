# Tareas 001 — Refinamiento visual e interacción

Estados: `pendiente` → `en_progreso` → `implementada` → `validada`.
La validación requiere revisión y evidencia en navegador.

| ID | Objetivo | Archivos | Estado | Commit |
|---|---|---|---|---|
| T-01 | Spec, plan y secuencia de ejecución | `specs/001-*` | `implementada` | `2ea07f0` |
| T-02 | Tokens tipográficos y espaciado base | `style.css` | `implementada` | `1464437` |
| T-03 | Scroll suave propio + replay de secciones + barra de títulos | `script.js`, `style.css`, `index.html` | `implementada` | `1464437` |
| T-04 | Hero: firma en una línea, móvil apilado, entrada, partículas y sombras | `index.html`, `style.css`, `script.js` | `implementada` | `7f8051c` |
| T-05 | About: ritmo, centrado móvil y microinteracciones | `style.css`, `index.html` | `implementada` | `7f8051c` |
| T-06 | Servicios: bento asimétrico, sombras y tilt 3D | `style.css`, `script.js` | `implementada` | `7f8051c` |
| T-07 | Beneficios y Testimonios: negro absoluto, acordeón, elevación y escala | `style.css`, `script.js` | `implementada` | `7f8051c` |
| T-08 | Mapa: dos sedes seleccionables, tarjeta sincronizada y fallback | `index.html`, `style.css`, `script.js` | `implementada` | `9c5140a` |
| T-09 | Rendimiento, responsive, reduced-motion, no-JS y revisión final | todos | `en_progreso` | — |

## Evidencia

Recogida en Chrome DevTools contra `http://127.0.0.1:8000/` y una copia sin JS
en `http://127.0.0.1:8001/`.

- Sintaxis: `node --check script.js` sin errores. W3C HTML y CSS: cero errores
  (sólo avisos de compatibilidad y el `/>` preexistente en elementos vacíos).
- Sin desbordamiento horizontal en 390, 480, 768, 769, 800, 860, 861, 1024 y
  1440 px (`scrollWidth === clientWidth`).
- Hero: una sola línea con el logo a partir de 769 px; a 768 px y menos pasa a
  apilado a la izquierda. Entrada sólo en la primera carga; el resto de
  secciones se revela al entrar y se reinicia al salir por arriba o por abajo.
- Scroll propio: clic en Contacto y rueda a mitad de recorrido deja `scrollY`
  en 29 (destino 3579), es decir, se cancela. Con movimiento reducido salta
  directo al destino (delta 0).
- Servicios: bento 4+2 / 2+4 a 1440 y 1024, dos columnas a 861–1024 y lista
  vertical de una columna a 768 y menos. Sin `filter: blur()` en hover.
- Beneficios: fondo `#000000`, borde rojo interior sólo en el elemento activo;
  el cuerpo abierto mide 128 px de 152 px de scroll y no recorta el párrafo.
- Testimonios: 8 diapositivas (4 + clones), escalas medidas 0.945 / 0.984 / 1,
  tarjeta completa visible sin recortes.
- Mapa: dos marcadores y dos pestañas sincronizadas (nombre, dirección y enlace
  de indicaciones). Vista inicial con `fitBounds`; al elegir sede, `flyTo` y
  popup por encima del pin. A 861 px la tarjeta va superpuesta sin tapar el pin;
  a 860 px pasa debajo del mapa. Atribución con fondo `rgba(10, 10, 12, 0.82)`.
  El fallback sin JS/red lista las dos direcciones.
- Movimiento reducido: salto instantáneo, todos los `[data-aos]` visibles,
  marquee con `transform: none` y animación del hero a `1e-05s`.
- Sin JS: selector de sede oculto, fallback visible con ambas direcciones,
  reveals visibles tras 2 s y `scroll-behavior: smooth` nativo.
- Consola del navegador limpia en todas las comprobaciones.

El veredicto del reviewer se registra al final, antes de marcar T-09 como
`validada`.
