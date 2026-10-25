# Tareas 002 — Pulido del hero

Estados: `pendiente` → `en_progreso` → `implementada` → `validada`.

| ID | Objetivo | Archivos | Estado |
|---|---|---|---|
| T-01 | Spec y plan del motor | `specs/002-*` | `implementada` |
| T-02 | Ciclo de vida, profundidad y cupo con reciclaje suave | `script.js` | `implementada` |
| T-03 | Estela con puntero fino y ráfaga con sesgo ascendente | `script.js` | `implementada` |
| T-04 | Pausa por visibilidad, pestaña y movimiento reducido | `script.js` | `implementada` |
| T-05 | Entrada escalonada uniforme de la firma | `style.css` | `implementada` |
| T-06 | Pruebas de responsive, fps, cupo, reduced-motion y no-JS | todos | `implementada` |
| T-07 | Revisión cruzada y cierre | `MEMORY.md` | `validada` |

## Evidencia (Chrome headless, servidor local, 2026-10-25)

### Sintaxis y consola

- `node --check script.js` sin errores.
- Sin mensajes de error ni advertencia en consola tras las recargas.

### Entrada de la firma

Medición con `document.getAnimations()` congelado en el tiempo:

| t | marca | Club | Lobos | Negros |
|---|---|---|---|---|
| 0 ms | 0 / +30,9 px | 0 / +30,9 px | 0 / +30,9 px | 0 / +30,9 px |
| 120 ms | 0,65 / +10,9 px | 0,08 / +28,6 px | 0 | 0 |
| 350 ms | 0,95 | 0,88 | 0,68 | 0,15 |
| 900 ms | 1 | ≈1 | ≈1 | 0,91 |

- Retardos 0 / 110 / 220 / 330 ms y duración 800 ms; la marca conserva una
  escala mínima (0,94→1) y ya no rota.

### Partículas

- 1440×900: 56 ambientales, 56 dibujos por frame en reposo.
- 500 pulsaciones seguidas: máximo 197 dibujos en un frame (cupo 200; tres
  ambientales estaban en alpha 0). A los 1,6 s el campo vuelve a ~55.
- 120 `pointermove` síncronos: sólo 1–2 emisiones por el techo de 32 ms.
  40 movimientos reales en 1,6 s: máximo 83 partículas dibujadas.
- 390×844 con DPR 3: canvas 780×1688 (DPR acotado a 2), 24 ambientales.
  `touchmove` no emite (máx. 24); un toque emite 8 (máx. 32); 500 toques
  seguidos se quedan en 90 (cupo móvil).
- Sin overflow horizontal a 390, 768, 1024 y 1440.

### Rendimiento y pausa

- 1440×900 con CPU 4× más lenta durante 3 s de interacción sostenida:
  546 frames / 3,03 s = **179,9 fps**, 142,5 partículas dibujadas por frame
  de media, máximo 167. El refresco del entorno era de 180 Hz.
- Hero fuera del viewport: 0 frames en 800 ms. Al volver: 143 frames en 800 ms.
- Reduced motion: 0 frames de rAF; un `resize` redibuja un fotograma estático
  con 56 partículas; texto con `animation: none` y opacidad 1.

### Capturas

- `hero-390-v2.png`, `hero-768.png`, `hero-1024.png`, `hero-1440-v2.png`.
- Entrada congelada a 120 ms: `hero-time-120.png`.
- Ráfaga congelada a 150 ms: `hero-1440-burst-offset.png`.

Ruta local: `C:\Users\BMO\AppData\Local\Temp\opencode\`.

## Revisión cruzada

- Revisor: `opencode/mimo-v2.6-flash-free` (familia MiMo, distinta de la
  implementación DeepSeek).
- Veredicto: **APROBADO**, sin bloqueantes.
- El revisor confirmó el alcance de los hunks, el cupo, el swap-pop, la pausa,
  la estela sin tacto, la ausencia de referencias muertas y la entrada
  escalonada. No pudo ejecutar `node --check` por permisos del entorno; lo
  suplió con lectura estructural y ejecución real en Chrome.
- Riesgos menores atendidos: las bandas del cupo quedan definidas por ancho
  (≥1024 / 600–1023 / <600) en spec y plan; las cifras del plan se alinearon
  con el código; `pointerdown` ya no exime la siguiente estela del techo de
  32 ms. El throttle de resize es preexistente y compartido; no se tocó.

## Pendiente

- Nada de la sección hero. Los cambios de `index.html` presentes en el árbol
  (nombres de la ubicación) son trabajo del usuario y quedan fuera de este
  commit.
