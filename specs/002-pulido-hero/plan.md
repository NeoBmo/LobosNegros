# Plan 002 — Motor de partículas y entrada del hero

## Estado actual

- `HeroParticles` crea 18/28/42 partículas ambientales en posiciones
  aleatorias y las envuelve al salir por arriba; no nacen del borde inferior.
- El clic emite una ráfaga que aparece a opacidad plena y sólo se desvanece al
  final. El ratón únicamente repele.
- El cupo (36/48/64) elimina la primera ambiental del array, que puede estar
  visible: se ve un corte.
- El texto ya tiene escalonado CSS, pero la marca entra con giro y las palabras
  con 80 ms de diferencia: la secuencia se lee casi como un bloque.

## Diseño

### Modelo de partícula

Un solo array con tres tipos: `ambient`, `trail`, `burst`. Cada partícula
guarda posición, velocidad, tamaño, profundidad (0 lejos–1 cerca), opacidad
base, edad, vida y tiempos de fundido. La opacidad efectiva se calcula como
`base × fundidoEntrada × fundidoSalida × profundidad`, de modo que toda
partícula nace y muere en alpha 0.

- **Ambiental**: nace en `y = alto + margen`, sube 0,2–0,7 px/frame con vaivén
  lateral; vida 9–18 s; fundido de entrada 12 % y de salida 28 %. Al agotarse
  se recicla en el borde inferior, sin salir del array.
- **Estela**: 1–2 px, vida 0,8–1,4 s, nace en el puntero con la inercia del
  movimiento y sube lentamente.
- **Ráfaga**: radial, sesgo ascendente, vida 0,6–1,2 s, fricción 0,93.

### Cupo y reciclaje

`maxParticles` = 200 escritorio, 140 tablet, 90 móvil. Al emitir:

1. Si hay hueco, se añade.
2. Si no, se busca la partícula con menor alpha efectivo.
3. Sólo se reutiliza si ese alpha es < 0,22; si no, se omite la emisión.

Las partículas de estela/ráfaga se retiran con intercambio con la última
(`O(1)`); las ambientales se reinician en su sitio para no generar basura.

### Interacción

- `pointermove` con `pointerType !== "touch"`, `(hover: hover) and
  (pointer: fine)` y sin movimiento reducido: emite si el puntero avanzó ≥ 16
  px o pasaron ≥ 70 ms; máximo 2 por evento.
- `pointerdown` (botón principal): ráfaga de 12 (ratón/lápiz) u 8 (tacto).
  En táctil no hay estela durante el scroll.
- La repulsión existente se conserva atenuada (radio 110, fuerza 0,35) para
  que la estela no se sienta pegada.
- Todos los listeners son pasivos y se retiran del juego cuando el hero no
  está visible.

### Pausa

`IntersectionObserver` con `threshold: 0` sobre `.hero` arranca/detiene el
rAF. `visibilitychange` detiene al ocultar la pestaña. `resize` (con throttle)
redimensiona el buffer y redistribuye el campo. Con movimiento reducido se
dibuja un fotograma estático y no se instala el bucle; un `change` del
`matchMedia` alterna entre ambos modos.

### Rendimiento

- `ctx.fillStyle` se fija una vez (`#DB1A1A`); la variación va por
  `globalAlpha`. Cero plantillas de color por frame.
- Canvas con `desynchronized: true`, DPR acotado a 2.
- Sin `filter`, sin sombras por partícula y sin `will-change` permanente.
- El cupo y el recorte de `delta` a 50 ms limitan el coste tras un tirón.

### Entrada del texto

- Marca y palabras comparten dirección (desde abajo) y opacidad 0→1.
- Retardos 0 / 110 / 220 / 330 ms, duración 800 ms, `both`.
- La marca conserva una escala mínima (0,94→1) sin rotación para no romper la
  lectura de una sola línea.
- `prefers-reduced-motion` ya fuerza duración 0,01 ms; se mantiene.

## Riesgos

- Más partículas = más `fillRect`; el cupo por viewport y la medición de fps
  deciden si hay que bajar el objetivo ambiental.
- El reciclaje por menor alpha puede omitir clics en ráfagas muy densas; es
  preferible a un salto visible.
- En iOS, `pointermove` táctil puede dispararse durante el scroll; se filtra
  por `pointerType`.
