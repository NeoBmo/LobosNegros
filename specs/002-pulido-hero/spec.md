# Spec 002 — Pulido del hero

El hero es la primera sección y el patrón de movimiento del resto del sitio.
Debe sentirse vivo sin convertirse en un adorno costoso.

## Requisitos (EARS)

- **RF-01** — AL CARGAR la página, EL SISTEMA muestra la firma con una entrada
  escalonada desde abajo y opacidad 0→1, en orden marca → Club → Lobos →
  Negros. La secuencia ocurre una sola vez.
- **RF-02** — MIENTRAS el hero está visible, EL SISTEMA mantiene un campo de
  partículas ambientales que emergen del borde inferior, suben con parallax de
  profundidad (tamaño, velocidad y opacidad) y se desvanecen al nacer y al
  morir. Ninguna aparece o desaparece de golpe.
- **RF-03** — CUANDO el puntero fino se mueve sobre el hero, EL SISTEMA emite
  una estela corta de partículas en el recorrido, limitada por distancia y
  tiempo para no inundar la escena.
- **RF-04** — CUANDO se pulsa o toca el hero, EL SISTEMA emite una ráfaga
  radial con sesgo ascendente desde el punto de contacto.
- **RF-05** — EL SISTEMA nunca supera las 200 partículas en escritorio, 140 en
  tablet y 90 en móvil. Para hacer sitio recicla la partícula menos visible.
- **RF-06** — SI no existe una partícula suficientemente desvanecida, ENTONCES
  EL SISTEMA omite la emisión en lugar de teletransportar una visible.
- **RF-07** — CUANDO el hero sale del viewport o la pestaña pasa a segundo
  plano, EL SISTEMA detiene el bucle de animación y deja de emitir. Al volver,
  reanuda sin saltos.
- **RF-08** — SI el usuario prefiere movimiento reducido, ENTONCES EL SISTEMA
  no anima partículas ni entrada: dibuja un fotograma estático y mantiene la
  firma visible.
- **RF-09** — EL SISTEMA conserva la firma como `h1` accesible con `aria-label`,
  el canvas decorativo oculto a lectores de pantalla y el scroll táctil libre
  (listeners pasivos, sin `preventDefault`).
- **RF-10** — EL SISTEMA no crea cadenas de color ni objetos por frame, no usa
  `filter: blur()` y mantiene el coste por frame acotado por el cupo.

## Criterios de aceptación

1. A 1440, 768 y 390 la entrada se percibe escalonada y el texto queda en su
   posición final sin saltos de layout.
2. Con el hero en pantalla, las partículas nacen desde abajo y se desvanecen
   en ambos extremos de su vida; no hay apariciones ni cortes secos.
3. Mover el ratón deja una estela discreta; un clic genera una ráfaga que se
   agota sola. En táctil, sólo el toque genera ráfaga.
4. Tras 500 pulsaciones seguidas, el número de partículas dibujadas por frame
   no supera el cupo del viewport y la consola sigue limpia.
5. Al desplazarse fuera del hero, el canvas deja de repintarse; al volver,
   continúa.
6. `prefers-reduced-motion: reduce` deja un fotograma fijo, sin rAF ni
   emisiones; el texto es visible de inmediato.
7. Sin JS, la firma sigue visible y legible; el canvas vacío no afecta al
   layout.
8. El promedio de frames durante una interacción sostenida se mantiene en
   ~60 fps en escritorio (y por encima de 50 fps con CPU 4× más lenta).

## Fuera de alcance

- Cambiar la identidad visual, el copy o la composición de la firma.
- Añadir dependencias, WebGL o librerías de partículas.
- Animar otras secciones.
