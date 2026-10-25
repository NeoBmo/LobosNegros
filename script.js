/* Global configuration and Utilities */
const CONFIG = Object.freeze({
  scrollOffset: 80,
  navHideDistance: 240,
  observerThreshold: 0.15,
  observerRootMargin: "0px 0px -100px 0px",
  debugMode: false,
  // Los dos puntos de entrenamiento. La tarjeta, los marcadores y el fallback
  // se alimentan de esta lista; no dupliques coordenadas en el marcado.
  mapLocations: [
    {
      id: "inmaculada",
      shortName: "La Inmaculada",
      name: "Parque La Inmaculada",
      addressHtml:
        "Calle 37c #5a-58 · Barrio Las Palmas<br>Sur Oriente, Barranquilla, Atlántico",
      popupAddress: "Parque La Inmaculada<br>Calle 37c #5a-58, Barranquilla",
      lat: 10.940750,
      lng: -74.791333,
      directions:
        "https://www.google.com/maps/dir/?api=1&destination=10.940750,-74.791333",
    },
    {
      id: "soledad",
      shortName: "Soledad",
      name: "Cancha de Baloncesto Designado",
      addressHtml: "Cra. 30 #27C-35<br>Soledad, Atlántico",
      popupAddress: "Cancha de Baloncesto Designado<br>Cra. 30 #27C-35, Soledad",
      lat: 10.9282632,
      lng: -74.7741079,
      directions:
        "https://www.google.com/maps/dir/?api=1&destination=10.9282632,-74.7741079",
    },
  ],
});

/* Logger */
const logger = {
  log: (msg) => CONFIG.debugMode && console.log(`[LN] ${msg}`),
  warn: (msg) => CONFIG.debugMode && console.warn(`[LN] ${msg}`),
  error: (msg) => CONFIG.debugMode && console.error(`[LN] ${msg}`),
};

/* Throttle */
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Navbar
class Navigation {
  constructor() {
    this.navbar = document.querySelector(".navbar");
    this.navLinks = document.querySelectorAll("[data-smooth-scroll]");
    this.mobileMenuBtn = document.querySelector(".mobile-menu-btn");
    this.navMenu = document.querySelector(".nav-menu");
    this.heroSection = document.querySelector(".hero");
    this.reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.mobileMediaQuery = window.matchMedia("(max-width: 768px)");
    this.sections = Array.from(document.querySelectorAll("section[id]"));
    this.lastScrollY = window.scrollY;
    this.downAccum = 0;
    this.hasShownNavbar = false;
    this.rafPending = false;
    this.scrollRaf = null;
    this.isAutoScrolling = false;
    this.init();
  }

  init() {
    if (!this.navbar) return;
    this.attachEventListeners();
    this.updateHeader();
  }

  attachEventListeners() {
    this.navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        const isModified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
        if (isModified) return;

        const targetId = link.getAttribute("href");
        const targetSection = document.querySelector(targetId);
        if (!targetSection) return;

        e.preventDefault();
        this.smoothScroll(targetSection);
        this.closeMenu();
        try {
          // Sobre file:// el navegador lanza SecurityError al cambiar la URL,
          // y el sitio debe funcionar abierto directamente desde disco.
          history.replaceState(null, "", targetId);
        } catch (error) {
          logger.warn(`No se pudo actualizar el historial: ${error.message}`);
        }
      });
    });

    if (this.mobileMenuBtn) {
      this.mobileMenuBtn.addEventListener("click", () => this.toggleMenu());
    }

    document.addEventListener("click", (e) => {
      if (this.navMenu?.classList.contains("active") && !e.target.closest(".navbar")) {
        this.closeMenu();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (!this.navMenu?.classList.contains("active")) return;

      if (e.key === "Escape") {
        e.preventDefault();
        this.closeMenu({ restoreFocus: true });
        return;
      }

      // Sin trampa de foco, Tab sale del menú hacia la página de fondo, que el
      // scrim deja oculta pero no inaccesible.
      if (e.key === "Tab") this.trapFocus(e);
    });

    window.addEventListener("resize", throttle(() => {
      if (!this.mobileMediaQuery.matches) this.closeMenu();
      this.updateHeader();
    }, 150));

    window.addEventListener("scroll", () => this.onScroll(), { passive: true });

    // El desplazamiento propio no debe pelear con el usuario: rueda, tacto o
    // teclado lo interrumpen de inmediato.
    this.cancelScroll = this.cancelScroll.bind(this);
    ["wheel", "touchstart", "keydown"].forEach((eventName) => {
      window.addEventListener(eventName, this.cancelScroll, { passive: true });
    });
  }

  onScroll() {
    if (this.rafPending) return;
    this.rafPending = true;
    requestAnimationFrame(() => {
      this.rafPending = false;
      this.updateHeader();
    });
  }

  updateHeader() {
    const scrollY = window.scrollY;
    const delta = scrollY - this.lastScrollY;
    this.lastScrollY = scrollY;

    // MEDICIONES primero. Leer una propiedad de layout (offsetTop,
    // clientHeight) despues de escribir una clase fuerza un reflow sincrono.
    // El codigo anterior alternaba lectura y escritura en cada frame, asi que
    // hacer scroll provocaba layout thrashing continuo.
    const heroHeight = this.heroSection ? this.heroSection.offsetHeight : 400;
    const isPastHero = scrollY >= heroHeight * 0.5;
    const activeSectionId = this.computeActiveSectionId(scrollY);

    // A partir de aqui, solo escrituras al DOM.
    const menuOpen = this.navMenu?.classList.contains("active");
    let shouldShow = false;

    if (menuOpen) {
      shouldShow = true;
    } else if (!isPastHero) {
      this.downAccum = 0;
      this.hasShownNavbar = false;
    } else if (delta < -3) {
      this.downAccum = 0;
      shouldShow = true;
    } else if (delta > 3) {
      if (!this.hasShownNavbar) {
        this.hasShownNavbar = true;
        shouldShow = true;
      } else {
        this.downAccum += delta;
        shouldShow = this.downAccum < CONFIG.navHideDistance;
      }
    } else {
      this.hasShownNavbar = true;
      shouldShow = true;
    }

    this.navbar.classList.toggle("scrolled", isPastHero);
    this.navbar.classList.toggle("nav-visible", shouldShow);
    this.applyActiveLink(activeSectionId);
  }

  computeActiveSectionId(scrollY) {
    // La última sección no siempre puede alcanzar el punto de sondeo (el
    // footer limita el scroll máximo). En ese caso, al llegar al fondo, se
    // marca la última sección para que la nav no se quede en la anterior.
    const atBottom =
      window.innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
    if (atBottom && this.sections.length) {
      return this.sections[this.sections.length - 1].getAttribute("id");
    }

    const probe = scrollY + CONFIG.scrollOffset + 10;
    let currentSectionId = "";

    for (let i = 0; i < this.sections.length; i += 1) {
      const section = this.sections[i];
      const top = section.offsetTop;
      const height = section.clientHeight;
      if (probe >= top && probe < top + height) {
        currentSectionId = section.getAttribute("id");
      }
    }

    return currentSectionId;
  }

  applyActiveLink(currentSectionId) {
    for (let i = 0; i < this.navLinks.length; i += 1) {
      const link = this.navLinks[i];
      // El logotipo también desplaza, pero no participa del estado activo.
      if (!link.classList.contains("nav-link")) continue;
      const isActive = link.getAttribute("href") === `#${currentSectionId}`;
      link.classList.toggle("active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    }
  }

  // Curva propia en lugar del `scroll-behavior: smooth` nativo: así el
  // desplazamiento tiene una duración acotada y se puede cancelar. Es la
  // sensación de las landing animadas sin cargar una librería de scroll.
  smoothScroll(element) {
    const targetY = Math.max(0, element.offsetTop - CONFIG.scrollOffset);
    this.cancelScroll();

    if (this.reducedMotionQuery.matches) {
      window.scrollTo(0, targetY);
      return;
    }

    const startY = window.scrollY;
    const distance = targetY - startY;
    if (Math.abs(distance) < 2) return;

    const duration = Math.min(950, Math.max(480, Math.abs(distance) * 0.45));
    const startTime = performance.now();
    const easeInOutCubic = (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    this.isAutoScrolling = true;
    const step = (now) => {
      if (!this.isAutoScrolling) return;
      const progress = Math.min(1, (now - startTime) / duration);
      window.scrollTo(0, startY + distance * easeInOutCubic(progress));
      if (progress < 1) {
        this.scrollRaf = requestAnimationFrame(step);
      } else {
        this.isAutoScrolling = false;
        this.scrollRaf = null;
      }
    };

    this.scrollRaf = requestAnimationFrame(step);
  }

  cancelScroll() {
    if (!this.isAutoScrolling) return;
    this.isAutoScrolling = false;
    if (this.scrollRaf) {
      cancelAnimationFrame(this.scrollRaf);
      this.scrollRaf = null;
    }
  }

  toggleMenu() {
    if (!this.navMenu || !this.mobileMenuBtn) return;
    const isActive = this.navMenu.classList.toggle("active");
    this.mobileMenuBtn.setAttribute("aria-expanded", isActive);
    document.body.classList.toggle("menu-open", isActive);

    if (isActive) {
      this.navbar?.classList.add("nav-visible");
      // El foco entra en el menú. Sin esto, el primer Tab tras abrir salta al
      // skip-link y recorre la página que el scrim ya no deja leer.
      //
      // Se difiere dos frames porque el panel arranca en `visibility: hidden`
      // y la transición dura 200ms: enfocar un elemento invisible es un no-op,
      // y por eso el foco se quedaba en <body>.
      const firstLink = this.navMenu.querySelector("a");
      const focusFirstLink = () => {
        if (!this.navMenu.classList.contains("active")) return;
        if (firstLink) firstLink.focus({ preventScroll: true });
      };

      requestAnimationFrame(() => {
        requestAnimationFrame(focusFirstLink);
      });

      // En algunos motores la transición de visibilidad aún no ha dejado
      // enfocar el panel en esos dos frames. Se reintenta una vez, solo si el
      // foco sigue en el botón o en <body>, para no robarlo si el usuario ya
      // se movió con Tab.
      setTimeout(() => {
        const active = document.activeElement;
        if (active === this.mobileMenuBtn || active === document.body) {
          focusFirstLink();
        }
      }, 240);
    }
  }

  // El botón forma parte del ciclo para poder alcanzarlo con Shift+Tab.
  trapFocus(event) {
    const items = [this.mobileMenuBtn].concat(
      Array.from(this.navMenu.querySelectorAll("a, button"))
    );
    if (!items.length) return;

    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  closeMenu({ restoreFocus = false } = {}) {
    if (!this.navMenu || !this.mobileMenuBtn) return;
    const wasOpen = this.navMenu.classList.contains("active");

    this.navMenu.classList.remove("active");
    this.mobileMenuBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");

    // Solo se recupera el foco si el menú se cierra sin navegar: tras pulsar
    // un enlace, robar el foco devolvería al usuario arriba del todo.
    if (restoreFocus && wasOpen) this.mobileMenuBtn.focus();
  }
}

// Hero & Particles
class HeroParticles {
  constructor() {
    this.canvas = document.getElementById("hero-particles");
    if (!this.canvas) return;
    this.hero = document.querySelector(".hero");
    // `desynchronized` reduce la latencia del canvas sin cambiar el dibujo.
    this.ctx = this.canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!this.ctx) return;

    this.particles = [];
    this.animationFrameId = null;
    this.visibilityObserver = null;
    this.isRunning = false;
    this.isOnScreen = false;
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.maxParticles = 200;
    this.ambientTarget = 72;
    this.sizeScale = 1;
    this.lastFrame = 0;
    this.pointer = { x: null, y: null, lastX: 0, lastY: 0, lastAt: 0, hovering: false };
    this.heroOrigin = { left: 0, top: 0 };
    // Una sola función ligada: el bucle no asigna un cierre en cada frame.
    this.renderFrame = (time) => this.render(time);
    this.reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

    this.init();
  }

  init() {
    this.setupCanvas();
    this.measureLimits();
    this.createAmbientField();
    this.cacheHeroOrigin();
    this.attachEventListeners();
    this.setupVisibilityObserver();
    this.applyMotionPreference();
  }

  setupCanvas() {
    const width = this.hero ? this.hero.clientWidth : window.innerWidth;
    const height = this.hero ? this.hero.clientHeight : window.innerHeight;
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    // Asignar canvas.width reinicia el estado del contexto.
    this.ctx.fillStyle = "#DB1A1A";
  }

  measureLimits() {
    const narrow = this.width < 600;
    const tablet = this.width < 1024;
    this.maxParticles = narrow ? 90 : tablet ? 140 : 200;
    this.ambientTarget = narrow ? 44 : tablet ? 52 : 72;
    this.sizeScale = narrow ? 1.15 : 1;
  }

  createAmbientField() {
    this.particles = [];
    for (let i = 0; i < this.ambientTarget; i += 1) {
      this.particles.push(this.createAmbient(true));
    }
  }

  createAmbient(initial = false) {
    const depth = Math.random();
    const life = 12000 + Math.random() * 10000;
    const vy = -(0.22 + depth * 0.5);
    const baseX = Math.random() * this.width;
    const particle = {
      type: "ambient",
      x: baseX,
      baseX,
      y: this.height + 12,
      vx: 0,
      vy,
      ox: 0,
      oy: 0,
      size: (3 + depth * 5.5) * this.sizeScale,
      depth,
      baseAlpha: 0.55 + depth * 0.45,
      life,
      age: 0,
      fadeIn: life * 0.1,
      fadeOut: life * 0.24,
      sway: 0.12 + Math.random() * 0.28,
      swaySpeed: 0.00016 + Math.random() * 0.00024,
      swayOffset: Math.random() * Math.PI * 2,
    };

    if (initial) {
      // Se siembra a lo largo de su propia trayectoria, no en una altura
      // arbitraria: así el campo ya está poblado y cada partícula conserva su
      // fundido de entrada y salida.
      const travelPerMs = Math.abs(vy) / 16.67;
      const minAge = life * 0.14;
      const maxAge = Math.min(life * 0.8, (this.height - 10) / travelPerMs);
      particle.age = maxAge > minAge
        ? minAge + Math.random() * (maxAge - minAge)
        : minAge;
      particle.y = this.height + 12 - travelPerMs * particle.age;
    }
    return particle;
  }

  addParticle(particle) {
    if (this.particles.length < this.maxParticles) {
      this.particles.push(particle);
      return true;
    }

    // El cupo incluye el campo ambiental. Para no hacer desaparecer el fondo,
    // sólo se reciclan partículas de interacción ya casi invisibles: un corte
    // a la vista se notaría más que omitir una emisión.
    let candidate = -1;
    let lowest = 0.22;
    for (let i = 0; i < this.particles.length; i += 1) {
      const current = this.particles[i];
      if (current.type === "ambient") continue;
      const alpha = this.alphaOf(current);
      if (alpha < lowest) {
        lowest = alpha;
        candidate = i;
      }
    }

    if (candidate === -1) return false;
    this.particles[candidate] = particle;
    return true;
  }

  burst(x, y, amount) {
    if (this.reducedMotionQuery.matches) return;

    for (let i = 0; i < amount; i += 1) {
      // Sesgo ascendente: la ráfaga acompaña la dirección del campo.
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.7;
      const speed = 0.5 + Math.random() * 1.8;
      this.addParticle({
        type: "burst",
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.2,
        ox: 0,
        oy: 0,
        size: 5 + Math.random() * 7,
        depth: 0.4 + Math.random() * 0.6,
        baseAlpha: 0.9 + Math.random() * 0.1,
        life: 800 + Math.random() * 800,
        age: 0,
        fadeIn: 60,
        fadeOut: 460,
        sway: 0,
        swaySpeed: 0,
        swayOffset: 0,
      });
    }
    this.ensureRunning();
  }

  emitTrail(x, y, dx, dy) {
    if (this.reducedMotionQuery.matches || !this.finePointerQuery.matches) return;

    const now = performance.now();
    // Techo duro de ~30 emisiones por segundo, además del gate por distancia:
    // un barrido rápido no debe llenar el cupo de golpe.
    if (now - this.pointer.lastAt < 32) return;
    const distance = Math.hypot(x - this.pointer.lastX, y - this.pointer.lastY);
    if (now - this.pointer.lastAt < 70 && distance < 16) return;
    this.pointer.lastAt = now;
    this.pointer.lastX = x;
    this.pointer.lastY = y;

    const amount = distance > 34 ? 2 : 1;
    const driftX = Math.max(-0.9, Math.min(0.9, (dx || 0) * 0.12));
    const driftY = Math.max(-0.9, Math.min(0.4, (dy || 0) * 0.1));

    for (let i = 0; i < amount; i += 1) {
      this.addParticle({
        type: "trail",
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: driftX + (Math.random() - 0.5) * 0.3,
        vy: driftY - 0.12 - Math.random() * 0.2,
        ox: 0,
        oy: 0,
        size: 3.2 + Math.random() * 3,
        depth: 0.55 + Math.random() * 0.45,
        baseAlpha: 0.7 + Math.random() * 0.3,
        life: 900 + Math.random() * 600,
        age: 0,
        fadeIn: 120,
        fadeOut: 450,
        sway: 0,
        swaySpeed: 0,
        swayOffset: 0,
      });
    }
    this.ensureRunning();
  }

  alphaOf(particle) {
    let fadeIn = particle.fadeIn ? particle.age / particle.fadeIn : 1;
    let fadeOut = particle.fadeOut ? (particle.life - particle.age) / particle.fadeOut : 1;
    fadeIn = fadeIn > 1 ? 1 : fadeIn < 0 ? 0 : fadeIn;
    fadeOut = fadeOut > 1 ? 1 : fadeOut < 0 ? 0 : fadeOut;
    const depth = 0.75 + particle.depth * 0.25;
    return particle.baseAlpha
      * (fadeIn * fadeIn * (3 - 2 * fadeIn))
      * (fadeOut * fadeOut * (3 - 2 * fadeOut))
      * depth;
  }

  resetAmbient(particle) {
    const depth = Math.random();
    const life = 12000 + Math.random() * 10000;
    particle.age = 0;
    particle.baseX = Math.random() * this.width;
    particle.x = particle.baseX;
    particle.y = this.height + 10 + Math.random() * 26;
    particle.ox = 0;
    particle.oy = 0;
    particle.depth = depth;
    particle.size = (3 + depth * 5.5) * this.sizeScale;
    particle.vy = -(0.22 + depth * 0.5);
    particle.baseAlpha = 0.55 + depth * 0.45;
    particle.life = life;
    particle.fadeIn = life * 0.1;
    particle.fadeOut = life * 0.24;
    particle.sway = 0.12 + Math.random() * 0.28;
    particle.swaySpeed = 0.00016 + Math.random() * 0.00024;
    particle.swayOffset = Math.random() * Math.PI * 2;
  }

  attachEventListeners() {
    window.addEventListener("resize", throttle(() => this.handleResize(), 200), { passive: true });

    this.reducedMotionQuery.addEventListener?.("change", () => this.applyMotionPreference());

    document.addEventListener("visibilitychange", () => this.syncRunState());

    if (!this.hero) return;

    // Sólo el puntero fino deja estela; el táctil únicamente genera ráfaga al
    // tocar, para no inundar la escena mientras se hace scroll.
    this.hero.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      const point = this.pointFromEvent(event);
      const dx = this.pointer.x === null ? 0 : point.x - this.pointer.x;
      const dy = this.pointer.y === null ? 0 : point.y - this.pointer.y;
      this.pointer.x = point.x;
      this.pointer.y = point.y;
      this.pointer.hovering = true;
      this.emitTrail(point.x, point.y, dx, dy);
    }, { passive: true });

    this.hero.addEventListener("pointerleave", () => {
      this.pointer.hovering = false;
      this.pointer.x = null;
      this.pointer.y = null;
      this.pointer.lastX = 0;
      this.pointer.lastY = 0;
      this.pointer.lastAt = 0;
    }, { passive: true });

    this.hero.addEventListener("pointercancel", () => {
      this.pointer.hovering = false;
      this.pointer.x = null;
      this.pointer.y = null;
    }, { passive: true });

    this.hero.addEventListener("pointerup", (event) => {
      if (event.pointerType === "touch") this.pointer.hovering = false;
    }, { passive: true });

    // Ratón, lápiz y tacto comparten `pointerdown`; una pulsación secundaria
    // no dispara la ráfaga.
    this.hero.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      const point = this.pointFromEvent(event);
      this.pointer.x = point.x;
      this.pointer.y = point.y;
      this.pointer.lastX = point.x;
      this.pointer.lastY = point.y;
      this.pointer.lastAt = performance.now();
      this.pointer.hovering = event.pointerType !== "touch";
      this.burst(point.x, point.y, event.pointerType === "touch" ? 18 : 26);
    }, { passive: true });
  }

  cacheHeroOrigin() {
    if (!this.hero) return;
    const rect = this.hero.getBoundingClientRect();
    // Coordenadas de documento: el puntero se convierte sin medir el layout en
    // cada evento.
    this.heroOrigin.left = rect.left;
    this.heroOrigin.top = rect.top + window.scrollY;
  }

  pointFromEvent(event) {
    return {
      x: event.clientX - this.heroOrigin.left,
      y: event.clientY - (this.heroOrigin.top - window.scrollY),
    };
  }

  handleResize() {
    this.setupCanvas();
    this.measureLimits();
    this.cacheHeroOrigin();
    this.rebalanceAmbientField();
    // El canvas acaba de vaciarse: las transitorias quedan fuera de sus
    // posiciones y se descartan en lugar de reaparecer descolocadas.
    this.particles = this.particles.filter((particle) => particle.type === "ambient");
    if (this.reducedMotionQuery.matches) this.renderStaticFrame();
  }

  rebalanceAmbientField() {
    let ambient = 0;
    for (let i = 0; i < this.particles.length; i += 1) {
      if (this.particles[i].type === "ambient") ambient += 1;
    }

    while (ambient < this.ambientTarget) {
      this.particles.push(this.createAmbient(false));
      ambient += 1;
    }

    // Si el viewport se estrecha, se retiran las ambientales del final. Las
    // nuevas nacen fuera del lienzo, así que el cambio no produce un corte.
    while (ambient > this.ambientTarget) {
      let index = -1;
      for (let i = this.particles.length - 1; i >= 0; i -= 1) {
        if (this.particles[i].type === "ambient") {
          index = i;
          break;
        }
      }
      if (index === -1) break;
      this.particles.splice(index, 1);
      ambient -= 1;
    }
  }

  setupVisibilityObserver() {
    if (!("IntersectionObserver" in window) || !this.hero) {
      this.isOnScreen = true;
      this.syncRunState();
      return;
    }

    this.visibilityObserver = new IntersectionObserver((entries) => {
      for (let i = 0; i < entries.length; i += 1) {
        this.isOnScreen = entries[i].isIntersecting;
      }
      this.syncRunState();
    }, { threshold: 0 });

    this.visibilityObserver.observe(this.hero);
  }

  syncRunState() {
    if (this.reducedMotionQuery.matches || !this.isOnScreen || document.hidden) {
      this.stop();
      return;
    }
    this.start();
  }

  ensureRunning() {
    if (!this.isRunning) this.syncRunState();
  }

  applyMotionPreference() {
    if (this.reducedMotionQuery.matches) {
      this.stop();
      this.renderStaticFrame();
      return;
    }
    this.syncRunState();
  }

  renderStaticFrame() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = "#DB1A1A";
    for (let i = 0; i < this.particles.length; i += 1) {
      const p = this.particles[i];
      if (p.type !== "ambient") continue;
      const alpha = this.alphaOf(p);
      if (alpha <= 0.004) continue;
      const sway = Math.sin(p.swayOffset + p.age * p.swaySpeed) * p.sway;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillRect(p.baseX + sway - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    this.ctx.globalAlpha = 1;
  }

  start() {
    if (this.isRunning || this.reducedMotionQuery.matches || !this.isOnScreen || document.hidden) return;
    this.isRunning = true;
    this.lastFrame = 0;
    this.animationFrameId = requestAnimationFrame(this.renderFrame);
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  render(timestamp) {
    if (!this.isRunning) return;

    const now = timestamp || performance.now();
    const delta = this.lastFrame ? Math.min(now - this.lastFrame, 50) : 16.67;
    this.lastFrame = now;
    const step = delta / 16.67;
    const friction = Math.pow(0.94, step);
    const pushDecay = Math.pow(0.88, step);
    const pointerX = this.pointer.hovering && this.pointer.x !== null ? this.pointer.x : -1;
    const pointerY = this.pointer.hovering && this.pointer.y !== null ? this.pointer.y : -1;

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = "#DB1A1A";

    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const p = this.particles[i];
      p.age += delta;

      if (p.type === "ambient") {
        // La vida acaba con el fundido de salida en cero: el reinicio en el
        // borde inferior no se ve.
        if (p.age >= p.life || p.y < -20) {
          this.resetAmbient(p);
          continue;
        }
        p.y += p.vy * step;
        p.x = p.baseX + Math.sin(p.swayOffset + p.age * p.swaySpeed) * p.sway;
      } else {
        if (p.age >= p.life) {
          // Intercambio con la última: retirar del array sin desplazar el
          // resto ni dejar huecos.
          const last = this.particles.pop();
          if (i < this.particles.length) this.particles[i] = last;
          continue;
        }
        p.x += p.vx * step;
        p.y += p.vy * step;
        p.vx *= friction;
        p.vy *= friction;
      }

      // Repulsión suave como desplazamiento que decae: no altera la
      // trayectoria base de las ambientales.
      if (pointerX !== -1) {
        const dx = p.x - pointerX;
        const dy = p.y - pointerY;
        const distance = Math.hypot(dx, dy);
        if (distance < 220 && distance > 0.001) {
          const force = (1 - distance / 220) * 5 * step;
          p.ox += (dx / distance) * force;
          p.oy += (dy / distance) * force;
        }
      }
      p.ox *= pushDecay;
      p.oy *= pushDecay;

      const alpha = this.alphaOf(p);
      if (alpha < 0.004) continue;

      this.ctx.globalAlpha = alpha;
      this.ctx.fillRect(
        p.x + p.ox - p.size / 2,
        p.y + p.oy - p.size / 2,
        p.size,
        p.size
      );
    }

    this.ctx.globalAlpha = 1;
    this.animationFrameId = requestAnimationFrame(this.renderFrame);
  }
}

// Scroll animations
class AnimationObserver {
  constructor() {
    this.isSupported = "IntersectionObserver" in window;
    this.reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.elements = Array.from(document.querySelectorAll("[data-aos]"));
    this.observer = null;
    this.timers = new WeakMap();
    this.init();
  }

  init() {
    if (!this.isSupported) {
      this.revealAll();
      return;
    }

    // Con movimiento reducido no se oculta nada: el contenido nace visible y
    // se evita depender del observer para leer la página.
    if (this.reducedMotionQuery.matches) {
      this.revealAll();
      return;
    }

    if (this.elements.length === 0) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.animateElement(entry.target);
            return;
          }

          // Al salir por arriba o por abajo se retira el estado final. Así la
          // entrada se repite al volver a la sección, en ambas direcciones.
          entry.target.classList.remove("aos-animate");
          entry.target.style.willChange = "";
          entry.target.style.transitionDelay = "";
        });
      },
      {
        threshold: CONFIG.observerThreshold,
        rootMargin: CONFIG.observerRootMargin,
      }
    );

    this.elements.forEach((el) => this.observer.observe(el));
  }

  animateElement(element) {
    if (element.classList.contains("aos-animate")) return;

    const delay = parseInt(element.getAttribute("data-aos-delay")) || 0;
    if (delay > 0) {
      element.style.transitionDelay = `${delay}ms`;
    }

    const clearWillChange = () => {
      element.style.willChange = "";
      element.style.transitionDelay = "";
      this.timers.delete(element);
    };

    const previousTimer = this.timers.get(element);
    if (previousTimer) clearTimeout(previousTimer);

    element.style.willChange = "opacity, transform";
    requestAnimationFrame(() => {
      element.classList.add("aos-animate");
      element.addEventListener("transitionend", clearWillChange, { once: true });
      this.timers.set(element, setTimeout(clearWillChange, delay + 650));
    });
  }

  revealAll() {
    this.elements.forEach((el) => el.classList.add("aos-animate"));
  }

  initFallback() {
    this.revealAll();
  }
}

// About Team Dock (macOS-style magnification)
class TeamDock {
  constructor() {
    this.group = document.querySelector(".team-group");
    this.items = this.group ? Array.from(this.group.querySelectorAll(".team-item")) : [];

    if (!this.group || this.items.length === 0) return;

    this.maxScale = 1.75;
    this.minScale = 0.8;
    this.decay = 110;
    this.baseWidth = 0;
    this.baseCenters = [];
    this.baseSpan = 0;

    this.easeRate = 11;
    this.liftY = -8;

    this.activeItem = null;
    this.touchItem = null;
    this.overGroup = false;
    this.running = false;
    this.rafId = 0;
    this.lastTimestamp = 0;

    this.currentScales = [];
    this.targetScales = [];
    this.currentXs = [];
    this.targetXs = [];
    this.yPos = [];
    this.yVel = [];

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.reducedMotion = prefersReducedMotion.matches;
    prefersReducedMotion.addEventListener?.("change", (e) => {
      this.reducedMotion = e.matches;
      if (this.reducedMotion) this.reset();
    });

    this.measure();
    this.initState();
    this.writeTargets();
    this.bindEvents();
  }

  initState() {
    const count = this.items.length;
    this.currentScales = new Array(count).fill(1);
    this.targetScales = new Array(count).fill(1);
    this.currentXs = new Array(count).fill(0);
    this.targetXs = new Array(count).fill(0);
    this.yPos = new Array(count).fill(0);
    this.yVel = new Array(count).fill(0);
  }

  measure() {
    this.baseWidth = this.items[0].offsetWidth;
    this.baseCenters = this.items.map((item) => item.offsetLeft + item.offsetWidth / 2);
    const first = this.items[0].offsetLeft;
    const last = this.items[this.items.length - 1].offsetLeft + this.items[this.items.length - 1].offsetWidth;
    this.baseSpan = last - first;
  }

  bindEvents() {
    this.items.forEach((item) => {
      const avatar = item.querySelector(".team-avatar");

      // El hover del grupo ya magnifica vía `pointermove` + `applyDock`, así
      // que no hace falta un manejador por avatar.
      avatar.addEventListener("focusin", () => {
        const index = this.items.indexOf(item);
        this.applyDock(this.baseCenters[index]);
      });
      avatar.addEventListener("focusout", (event) => {
        if (event.relatedTarget?.closest?.(".team-group")) return;
        if (!this.overGroup) this.reset();
      });

      // Touch devices: tap selects an avatar and magnifies it
      item.addEventListener("pointerdown", (event) => {
        if (window.matchMedia("(hover: hover)").matches) return;
        event.preventDefault();
        if (this.touchItem === item) {
          this.clearTouch();
        } else {
          this.clearTouch();
          this.touchItem = item;
          item.classList.add("dock-active");
          this.applyDock(this.baseCenters[this.items.indexOf(item)]);
        }
      });
    });

    if (!this.reducedMotion && window.matchMedia("(hover: hover)").matches) {
      this.group.addEventListener("pointerenter", () => {
        this.overGroup = true;
        this.group.classList.add("is-active");
      });
      this.group.addEventListener("pointerleave", () => {
        this.overGroup = false;
        this.group.classList.remove("is-active");
        this.reset();
      });
      this.group.addEventListener("pointermove", (event) => {
        const rect = this.group.getBoundingClientRect();
        this.applyDock(event.clientX - rect.left);
      });
    }

    document.addEventListener("pointerdown", (event) => {
      if (this.touchItem && !event.target.closest(".team-group")) {
        this.clearTouch();
      }
    });

    // Sin throttle: measure() lee offsetLeft/offsetWidth de cada integrante,
    // y eso fuerza reflow en cada evento de resize mientras se arrastra la
    // ventana.
    window.addEventListener(
      "resize",
      throttle(() => {
        this.measure();
        this.initState();
        this.writeTargets();
      }, 150),
      { passive: true }
    );
  }

  applyDock(pointerX) {
    const count = this.items.length;

    const distances = this.items.map((item, index) =>
      Math.abs(this.baseCenters[index] - pointerX)
    );

    let hoverIndex = 0;
    let minDistance = Infinity;
    distances.forEach((distance, index) => {
      if (distance < minDistance) {
        minDistance = distance;
        hoverIndex = index;
      }
    });

    // The hovered item receives the full magnification; every other item
    // shares the leftover width budget (each keeps its reserved slot, so the
    // dock never outgrows its track), shrinking in proportion to its distance.
    const others = [];
    const weights = [];
    distances.forEach((distance, index) => {
      if (index === hoverIndex) return;
      others.push(index);
      weights.push(Math.exp(distance / this.decay));
    });
    const weightSum = weights.reduce((a, b) => a + b, 0);

    let scales = this.items.map((item, index) => {
      if (index === hoverIndex) return this.maxScale;
      const share = weights[others.indexOf(index)] / weightSum;
      return 1 - (this.maxScale - 1) * share;
    });

    // Enforce the minimum size and rebalance so the total stays untouched.
    for (let pass = 0; pass < 12; pass += 1) {
      const floorExcess = scales
        .map((scale, i) => (i === hoverIndex ? 0 : Math.max(0, this.minScale - scale)))
        .reduce((a, b) => a + b, 0);
      if (floorExcess < 0.0001) break;
      const floorWeights = scales.map((scale, i) =>
        i === hoverIndex || scale <= this.minScale ? 0 : weights[others.indexOf(i)]
      );
      const floorWeightSum = floorWeights.reduce((a, b) => a + b, 0);
      if (floorWeightSum === 0) break;
      scales = scales.map((scale, i) => {
        if (i === hoverIndex) return scale;
        if (scale <= this.minScale) return this.minScale;
        return scale - floorExcess * (floorWeights[i] / floorWeightSum);
      });
    }

    const widths = scales.map((scale) => this.baseWidth * scale);
    let gapSpace = this.baseSpan - widths.reduce((a, b) => a + b, 0);
    if (gapSpace < 0) gapSpace = 0;

    const adjSums = [];
    for (let i = 0; i < count - 1; i += 1) {
      adjSums.push(widths[i] + widths[i + 1]);
    }
    const adjTotal = adjSums.reduce((a, b) => a + b, 0);

    const finalCenters = [widths[0] / 2];
    for (let i = 0; i < count - 1; i += 1) {
      const gap = adjTotal > 0 ? gapSpace * (adjSums[i] / adjTotal) : 0;
      finalCenters.push(finalCenters[i] + widths[i] / 2 + gap + widths[i + 1] / 2);
    }

    const desiredCenter = this.baseSpan / 2;
    const actualCenter = (finalCenters[0] + finalCenters[count - 1]) / 2;
    const shift = desiredCenter - actualCenter;

    this.targetScales = scales;
    this.targetXs = finalCenters.map(
      (center, index) => center + shift - this.baseCenters[index]
    );

    this.setActive(this.items[hoverIndex]);

    if (this.reducedMotion) {
      this.writeTargets();
    } else {
      this.animate();
    }
  }

  animate() {
    if (this.reducedMotion || this.running) return;
    this.running = true;
    this.lastTimestamp = performance.now();

    const tick = (timestamp) => {
      const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05);
      this.lastTimestamp = timestamp;
      const factor = 1 - Math.exp(-dt * this.easeRate);

      let maxDelta = 0;
      this.items.forEach((item, index) => {
        this.currentScales[index] += (this.targetScales[index] - this.currentScales[index]) * factor;
        this.currentXs[index] += (this.targetXs[index] - this.currentXs[index]) * factor;

        const targetY = this.activeItem === item ? this.liftY : 0;
        this.yVel[index] += (targetY - this.yPos[index]) * 140 * dt;
        this.yVel[index] *= Math.exp(-10 * dt);
        this.yPos[index] += this.yVel[index] * dt;

        maxDelta = Math.max(
          maxDelta,
          Math.abs(this.targetScales[index] - this.currentScales[index]),
          Math.abs(this.targetXs[index] - this.currentXs[index]),
          Math.abs(targetY - this.yPos[index]) / 24
        );

        item.style.setProperty("--dock-s", this.currentScales[index].toFixed(4));
        item.style.setProperty("--dock-x", `${this.currentXs[index].toFixed(2)}px`);
        item.style.setProperty("--dock-y", `${this.yPos[index].toFixed(2)}px`);
      });

      if (maxDelta < 0.002) {
        this.writeTargets();
        this.running = false;
        return;
      }
      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  writeTargets() {
    this.items.forEach((item, index) => {
      this.currentScales[index] = this.targetScales[index];
      this.currentXs[index] = this.targetXs[index];
      const targetY = this.activeItem === item ? this.liftY : 0;
      this.yPos[index] = targetY;
      this.yVel[index] = 0;
      item.style.setProperty("--dock-s", String(this.targetScales[index]));
      item.style.setProperty("--dock-x", `${this.targetXs[index].toFixed(2)}px`);
      item.style.setProperty("--dock-y", `${targetY.toFixed(2)}px`);
    });
  }

  setActive(item) {
    if (this.activeItem === item) return;
    this.items.forEach((other) => other.classList.remove("dock-active"));
    if (item) item.classList.add("dock-active");
    this.activeItem = item;
  }

  reset() {
    this.items.forEach((item) => item.classList.remove("dock-active"));
    this.activeItem = null;
    this.touchItem = null;
    this.overGroup = false;
    this.targetScales = new Array(this.items.length).fill(1);
    this.targetXs = new Array(this.items.length).fill(0);
    if (this.reducedMotion) {
      cancelAnimationFrame(this.rafId);
      this.running = false;
      this.writeTargets();
    } else {
      this.animate();
    }
  }

  clearTouch() {
    if (this.touchItem) {
      this.touchItem = null;
      this.reset();
    }
  }
}

// Services: inclinación 3D muy contenida siguiendo el puntero.
// Sólo se activa con puntero fino y sin movimiento reducido; en táctil manda
// el estado :active del CSS.
class ServiceTilt {
  constructor() {
    this.cards = Array.from(document.querySelectorAll(".service-card"));
    this.finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    this.reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.activeCard = null;
    this.frame = 0;
    this.pointer = { x: 0, y: 0 };

    if (!this.cards.length || !this.finePointer.matches || this.reducedMotionQuery.matches) return;
    this.bind();
  }

  bind() {
    this.cards.forEach((card) => {
      card.addEventListener("pointerenter", () => this.activate(card));
      card.addEventListener("pointermove", (event) => {
        if (this.activeCard !== card) return;
        this.pointer.x = event.clientX;
        this.pointer.y = event.clientY;
        if (this.frame) return;
        this.frame = requestAnimationFrame(() => {
          this.frame = 0;
          this.tilt(card);
        });
      });
      card.addEventListener("pointerleave", () => this.reset(card));
      card.addEventListener("pointercancel", () => this.reset(card));
    });

    window.addEventListener("blur", () => {
      if (this.activeCard) this.reset(this.activeCard);
    });
  }

  activate(card) {
    if (this.activeCard && this.activeCard !== card) this.reset(this.activeCard);
    this.activeCard = card;
    card.classList.add("is-tilting");
  }

  tilt(card) {
    if (this.activeCard !== card) return;
    const rect = card.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const x = (this.pointer.x - rect.left) / rect.width - 0.5;
    const y = (this.pointer.y - rect.top) / rect.height - 0.5;
    card.style.transform =
      `perspective(900px) rotateX(${(-y * 3.2).toFixed(2)}deg) ` +
      `rotateY(${(x * 4).toFixed(2)}deg) translateY(-6px) scale(1.01)`;
  }

  reset(card) {
    card.style.transform = "";
    card.classList.remove("is-tilting");
    if (this.activeCard === card) this.activeCard = null;
    if (this.frame) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
  }
}

// Benefits
class Accordion {
  constructor() {
    this.items = document.querySelectorAll(".accordion-item");
    this.init();
  }

  init() {
    if (!this.items.length) return;

    this.items.forEach((item) => {
      const header = item.querySelector(".accordion-header");
      if (!header) return;
      header.addEventListener("click", () => this.toggle(item));
    });

    // El alto se fija en pixeles al abrir. Si la ventana cambia de ancho el
    // texto refluye y el maxHeight viejo recorta el contenido, asi que hay que
    // recalcularlo para los paneles que sigan abiertos.
    window.addEventListener(
      "resize",
      throttle(() => this.remeasureOpen(), 200),
      { passive: true }
    );
  }

  remeasureOpen() {
    this.items.forEach((item) => {
      if (!item.classList.contains("active")) return;
      const body = item.querySelector(".accordion-body");
      if (!body) return;
      body.style.maxHeight = "0px";
      requestAnimationFrame(() => {
        body.style.maxHeight = body.scrollHeight + "px";
      });
    });
  }

  toggle(item) {
    const isActive = item.classList.contains("active");

    this.items.forEach((el) => {
      el.classList.remove("active");
      const body = el.querySelector(".accordion-body");
      if (body) body.style.maxHeight = "0px";
      const btn = el.querySelector(".accordion-header");
      if (btn) btn.setAttribute("aria-expanded", "false");
    });

    if (!isActive) {
      item.classList.add("active");
      const header = item.querySelector(".accordion-header");
      if (header) header.setAttribute("aria-expanded", "true");
      const body = item.querySelector(".accordion-body");
      if (body) {
        requestAnimationFrame(() => {
          body.style.maxHeight = body.scrollHeight + "px";
        });
      }
    }
  }
}

// Testimonials: infinite marquee (auto-scroll + drag, wraps in both directions)
class TestimonialsMarquee {
  constructor() {
    this.section = document.querySelector(".testimonials");
    this.track = document.querySelector("[data-carousel]");
    this.speed = 0.5;
    this.offset = 0;
    this.period = 0;
    this.rafId = null;
    this.visible = false;
    this.hovered = false;
    this.dragging = false;
    this.dragStartX = 0;
    this.dragStartOffset = 0;
    this.slides = [];
    this.slideMetrics = [];
    this.lastScales = [];
    this.viewportWidth = window.innerWidth;
    this.reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.init();
  }

  init() {
    if (!this.track || !this.track.children.length) return;

    const clones = Array.from(this.track.children).map((node) => node.cloneNode(true));
    clones.forEach((node) => {
      node.setAttribute("aria-hidden", "true");
      node.removeAttribute("data-aos");
      this.track.appendChild(node);
    });

    this.measure();

    this.track.addEventListener("pointerenter", () => { this.hovered = true; this.run(); });
    this.track.addEventListener("pointerleave", () => { this.hovered = false; this.run(); });
    this.track.addEventListener("pointerdown", (e) => this.onDragStart(e));
    this.track.addEventListener("pointercancel", () => this.onDragEnd());
    window.addEventListener("pointerup", () => this.onDragEnd());
    this.track.addEventListener("pointermove", (e) => this.onDragMove(e));

    this.reducedMotionQuery.addEventListener("change", () => this.render());
    window.addEventListener("resize", throttle(() => { this.measure(); this.render(); }, 200), { passive: true });

    this.setupVisibilityObserver();
    this.render();
  }

  measure() {
    if (!this.track || !this.track.children.length) return;
    this.slides = Array.from(this.track.children);
    this.slideMetrics = this.slides.map((slide) => ({
      center: slide.offsetLeft + slide.offsetWidth / 2,
      width: slide.offsetWidth,
    }));

    const half = this.slides.length / 2;
    if (half < 1) return;
    this.period = this.slideMetrics[half]
      ? this.slideMetrics[half].center - this.slideMetrics[half].width / 2
      : 0;
    this.viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    this.lastScales = new Array(this.slides.length).fill(0);
  }

  setupVisibilityObserver() {
    if (!("IntersectionObserver" in window) || !this.section) {
      this.visible = true;
      this.run();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          this.visible = entry.isIntersecting;
          this.run();
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(this.section);
  }

  onDragStart(e) {
    if (this.reducedMotionQuery.matches || this.dragging) return;
    this.dragging = true;
    this.dragStartX = e.clientX;
    this.dragStartOffset = this.offset;
    this.track.setPointerCapture(e.pointerId);
    this.stop();
  }

  onDragMove(e) {
    if (!this.dragging) return;
    const dx = this.dragStartOffset - (e.clientX - this.dragStartX);
    this.offset = Math.max(0, Math.min(this.period, dx));
    this.render();
  }

  onDragEnd() {
    this.dragging = false;
    this.run();
  }

  wrap(value) {
    if (!this.period) return 0;
    return ((value % this.period) + this.period) % this.period;
  }

  render() {
    if (!this.track) return;
    this.track.style.transform = `translateX(${-this.offset}px)`;
    this.updateScales();
  }

  // Las tarjetas crecen al acercarse al centro y se reducen al salir. La
  // posición se calcula con métricas cacheadas: no hay getBoundingClientRect
  // por slide en cada frame.
  updateScales() {
    if (!this.slides.length) return;

    if (this.reducedMotionQuery.matches) {
      this.slides.forEach((slide) => {
        if (slide.style.transform) slide.style.transform = "";
      });
      this.lastScales = new Array(this.slides.length).fill(1);
      return;
    }

    const center = this.viewportWidth / 2;
    const falloff = Math.max(this.viewportWidth * 0.55, 1);

    for (let i = 0; i < this.slides.length; i += 1) {
      const metric = this.slideMetrics[i];
      if (!metric) continue;
      const slideCenter = metric.center - this.offset;
      const distance = Math.abs(center - slideCenter);
      const t = Math.min(1, distance / falloff);
      const scale = 1 - t * t * 0.055;
      if (Math.abs(scale - (this.lastScales[i] || 0)) < 0.001) continue;
      this.slides[i].style.transform = `scale(${scale.toFixed(3)})`;
      this.lastScales[i] = scale;
    }
  }

  run() {
    this.stop();
    if (this.reducedMotionQuery.matches || !this.visible || this.hovered || this.dragging) return;
    // will-change solo mientras el track se esta moviendo: mantener la capa
    // reservada cuando el marquee esta parado solo consume memoria.
    this.track.classList.add("is-running");
    const step = () => {
      this.offset = this.wrap(this.offset + this.speed);
      this.render();
      this.rafId = requestAnimationFrame(step);
    };
    this.rafId = requestAnimationFrame(step);
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.track) this.track.classList.remove("is-running");
  }
}

// Contact & Social
class VisualEffects {
  constructor() {
    this.init();
  }

  init() {
    this.addMouseFollowEffect();
    this.pauseOffscreenAnimations();
  }

  // Los keyframes `float` de .benefits::before (600px) y de los dos circles
  // del contacto (500px y 400px) son degradados radiales grandes. Tenian
  // `infinite` sin pausa, asi queseguian compositando aunque la seccion no
  // estuviera en pantalla.
  pauseOffscreenAnimations() {
    if (!("IntersectionObserver" in window)) return;
    const targets = document.querySelectorAll(".benefits, .contact-social");
    if (!targets.length) return;

    const observer = new IntersectionObserver((entries) => {
      for (let i = 0; i < entries.length; i += 1) {
        const entry = entries[i];
        entry.target.style.setProperty(
          "--anim-play",
          entry.isIntersecting ? "running" : "paused"
        );
      }
    }, { threshold: 0 });

    for (let i = 0; i < targets.length; i += 1) observer.observe(targets[i]);
  }

  addMouseFollowEffect() {
    // El tilt 3D es decorativo: se omite si el usuario pide menos movimiento.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const socialLinks = document.querySelectorAll(".contact-social .social-link");
    socialLinks.forEach((link) => {
      link.addEventListener("mousemove", (e) => {
        const rect = link.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;
        const angleX = -mouseY * 0.15;
        const angleY = mouseX * 0.15;
        link.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale(1.15)`;
      });
      link.addEventListener("mouseleave", () => { link.style.transform = ""; });
    });
  }
}

// Map
class MapLibreIntegration {
  constructor() {
    this.map = null;
    this.mapContainer = document.getElementById("map-container");
    this.mapElement = document.getElementById("map");
    this.isLoaded = false;
    this.locations = CONFIG.mapLocations;
    this.activeId = this.locations[0]?.id || null;
    this.markers = new Map();
    this.popup = null;
    this.tabs = Array.from(document.querySelectorAll("[data-location]"));
    this.locationName = document.querySelector("[data-location-name]");
    this.locationAddress = document.querySelector("[data-location-address]");
    this.locationDirections = document.querySelector("[data-location-directions]");
    this.locationStatus = document.querySelector("[data-location-status]");

    this.init();
  }

  init() {
    if (!this.mapContainer || !this.mapElement) return;
    this.bindLocationSelector();
    this.setupLazyLoad();
  }

  bindLocationSelector() {
    this.tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        this.selectLocation(tab.dataset.location, { fly: true, announce: true });
      });
    });
  }

  // Fuente única de la tarjeta, los tabs y los marcadores. Se puede llamar
  // antes de que MapLibre exista: la tarjeta se actualiza igual.
  selectLocation(id, { fly = false, announce = false, showPopup = true } = {}) {
    const location = this.locations.find((item) => item.id === id);
    if (!location) return;

    this.activeId = id;

    this.tabs.forEach((tab) => {
      const active = tab.dataset.location === id;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-pressed", String(active));
    });

    if (this.locationName) this.locationName.textContent = location.name;
    if (this.locationAddress) this.locationAddress.innerHTML = location.addressHtml;
    if (this.locationDirections) this.locationDirections.href = location.directions;
    if (announce && this.locationStatus) {
      this.locationStatus.textContent = `Punto seleccionado: ${location.name}`;
    }

    this.markers.forEach((marker, markerId) => {
      const element = marker.getElement();
      const active = markerId === id;
      element.classList.toggle("is-active", active);
      element.setAttribute("aria-pressed", String(active));
    });

    if (!this.map || !this.isLoaded) return;

    const coordinates = [location.lng, location.lat];
    if (showPopup && this.popup) {
      this.popup
        .setLngLat(coordinates)
        .setHTML(this.popupHtml(location))
        .addTo(this.map);
    }

    if (fly) {
      this.map.flyTo({
        center: coordinates,
        zoom: 16,
        duration: 900,
        essential: true,
      });
    }
  }

  popupHtml(location) {
    return `
      <div class="map-popup-content">
        <span class="map-popup-icon" aria-hidden="true"></span>
        <div>
          <p class="map-popup-title">Club Lobos Negros</p>
          <p class="map-popup-address">${location.popupAddress}</p>
        </div>
      </div>
    `;
  }

  createMarker(location) {
    const element = document.createElement("button");
    element.type = "button";
    element.className = "map-club-marker";
    element.dataset.locationId = location.id;
    element.setAttribute(
      "aria-label",
      `Seleccionar ${location.name} en el mapa`
    );
    element.setAttribute("aria-pressed", String(location.id === this.activeId));
    if (location.id === this.activeId) element.classList.add("is-active");
    element.innerHTML = `
      <span class="map-club-marker-pin">
        <svg viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M17 30L8.5 43.5L25.5 43.5L17 30Z" fill="#DB1A1A"/>
          <rect x="2" y="2" width="30" height="30" fill="#DB1A1A" stroke="#FFFFFF" stroke-width="2"/>
          <rect x="11" y="11" width="12" height="12" fill="#FFFFFF"/>
        </svg>
      </span>
    `;

    element.addEventListener("click", (event) => {
      event.stopPropagation();
      this.selectLocation(location.id, { fly: true, announce: true });
    });

    const marker = new maplibregl.Marker({ element, anchor: "bottom" })
      .setLngLat([location.lng, location.lat])
      .addTo(this.map);

    this.markers.set(location.id, marker);
  }

  fitLocations() {
    if (!this.map || this.locations.length < 1) return;
    const bounds = new maplibregl.LngLatBounds();
    this.locations.forEach((location) => {
      bounds.extend([location.lng, location.lat]);
    });

    const compact = window.matchMedia("(max-width: 860px)").matches;
    this.map.fitBounds(bounds, {
      // En escritorio la tarjeta ocupa la izquierda: el encuadre reserva ese
      // espacio. En móvil la tarjeta va debajo, pero los controles de zoom y
      // la atribución siguen abajo a la derecha: el margen evita tapar el pin.
      padding: compact
        ? { top: 72, bottom: 120, left: 56, right: 72 }
        : { top: 80, bottom: 110, left: 430, right: 100 },
      maxZoom: 15.6,
      duration: 0,
    });
  }

  setupLazyLoad() {
    if (!("IntersectionObserver" in window)) {
      this.loadMapLibre();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.isLoaded) {
            this.loadMapLibre();
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: "150px",
      }
    );

    observer.observe(this.mapContainer);
  }

  loadMapLibre() {
    if (window.maplibregl) {
      this.initializeMap();
      return;
    }

    this.loadMapStylesheet();

    const script = document.createElement("script");
    script.src = "https://unpkg.com/maplibre-gl@^5/dist/maplibre-gl.js";
    script.async = true;

    script.onload = () => this.initializeMap();
    script.onerror = () => this.showFallback();

    document.head.appendChild(script);
  }

  loadMapStylesheet() {
    const cssHref = "https://unpkg.com/maplibre-gl@^5/dist/maplibre-gl.css";
    if (document.querySelector(`link[href="${cssHref}"]`)) return;

    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = cssHref;
    document.head.appendChild(stylesheet);
  }

  initializeMap() {
    try {
      const primary = this.locations[0];

      this.map = new maplibregl.Map({
        container: this.mapElement,
        style: "https://tiles.openfreemap.org/styles/fiord",
        center: [primary.lng, primary.lat],
        zoom: 14.5,
        // La atribución queda siempre visible: en un mapa a sangre completa
        // el botón compacto se come el texto legal y añade un control extra.
        attributionControl: { compact: false },
        pitchWithRotate: false,
        dragRotate: false,
        scrollZoom: { smooth: true },
        doubleClickZoom: true,
        touchZoomRotate: true,
        keyboard: true,
        maxZoom: 19,
        minZoom: 12,
        // El mapa vive dentro de una página larga: la rueda y el arrastre de un
        // dedo no deben secuestrar el scroll. Ctrl/⌘ + rueda y dos dedos siguen
        // funcionando, y los botones de zoom cubren el resto.
        cooperativeGestures: true,
        locale: {
          "Map.Title": "Mapa de la ubicación del club",
          "Marker.Title": "Ubicación del club",
          "NavigationControl.ZoomIn": "Acercar el mapa",
          "NavigationControl.ZoomOut": "Alejar el mapa",
          "AttributionControl.ToggleAttribution": "Mostrar u ocultar atribución",
          "CooperativeGesturesHandler.WindowsHelpText": "Usa Ctrl + rueda para hacer zoom",
          "CooperativeGesturesHandler.MacHelpText": "Usa ⌘ + rueda para hacer zoom",
          "CooperativeGesturesHandler.MobileHelpText": "Usa dos dedos para mover el mapa",
        },
      });

      this.map.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        "bottom-right"
      );

      this.map.on("error", (event) => {
        logger.warn(`MapLibre: ${event.error?.message || "error desconocido"}`);
      });

      // La paleta se aplica en `style.load`, antes del primer render visible.
      // Si se aplicara en `load`, el usuario vería un frame con el azul de
      // `fiord` mientras MapLibre procesa el repintado.
      this.map.on("style.load", () => {
        this.applyBrandPalette();
      });

      this.map.on("load", () => {
        this.map.addSource("club-zones", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: this.locations.map((location) => ({
              type: "Feature",
              properties: { id: location.id },
              geometry: {
                type: "Point",
                coordinates: [location.lng, location.lat],
              },
            })),
          },
        });

        this.map.addLayer({
          id: "club-zones-fill",
          type: "circle",
          source: "club-zones",
          paint: {
            "circle-radius": 32,
            "circle-color": "#DB1A1A",
            "circle-opacity": 0.12,
            "circle-stroke-color": "#DB1A1A",
            "circle-stroke-width": 1.2,
            "circle-stroke-opacity": 0.55,
          },
        });

        this.popup = new maplibregl.Popup({
          // Ancla explícita: con `offset` negativo y anclaje automático, el
          // popup podía caer encima del pin en lugar de quedar por encima.
          anchor: "bottom",
          offset: [0, -52],
          className: "map-club-popup",
          closeButton: false,
          // El encuadre lo controla flyTo; el auto-pan del popup competiría.
          autoPan: false,
        });

        this.isLoaded = true;
        this.locations.forEach((location) => this.createMarker(location));
        this.fitLocations();
        this.selectLocation(this.activeId, {
          fly: false,
          announce: false,
          showPopup: false,
        });

        this.hideMapLoading();
      });
    } catch (error) {
      logger.error(`Failed to build MapLibre map: ${error.message}`);
      this.showFallback();
    }
  }

  // El estilo `fiord` es azul grisáceo y compite con la paleta del club.
  // Se repinta por capas para dejar el mapa en negro/grises, con el rojo
  // reservado al marcador. Las capas se comprueban antes de tocarlas para
  // que un cambio futuro del estilo no rompa la integración.
  applyBrandPalette() {
    const palette = {
      background: { "background-color": "#0A0A0C" },
      water: { "fill-color": "#121216" },
      landuse_residential: { "fill-color": "#0E0E12", "fill-opacity": 1 },
      landcover_wood: { "fill-color": "#0C0C10" },
      park: { "fill-color": "#101014", "fill-opacity": 0.85 },
      park_outline: { "line-color": "#2A2A31" },
      waterway: { "line-color": "#1C1C22" },
      building: { "fill-color": "#1A1A1F", "fill-opacity": 0.8 },
      "highway_path": { "line-color": "#2A2A31" },
      "highway_minor": { "line-color": "#2C2C33" },
      "highway_major_casing": { "line-color": "#3A3A42" },
      "highway_major_inner": { "line-color": "#2E2E35" },
      "highway_major_subtle": { "line-color": "#26262C" },
      "highway_motorway_casing": { "line-color": "#44444C" },
      "highway_motorway_inner": { "line-color": "#3A3A42" },
      "highway_motorway_subtle": { "line-color": "#26262C" },
      "railway_transit": { "line-color": "#2A2A31" },
      "railway_transit_dashline": { "line-color": "#3A3A42" },
      "railway_service": { "line-color": "#2A2A31" },
      "railway_service_dashline": { "line-color": "#3A3A42" },
      railway: { "line-color": "#2A2A31" },
      railway_dashline: { "line-color": "#3A3A42" },
      boundary_state: { "line-color": "#34343B" },
      "boundary_country_z0-4": { "line-color": "#34343B" },
      "boundary_country_z5-": { "line-color": "#34343B" },
      water_name: { "text-color": "#8A8A92", "text-halo-color": "#0A0A0C" },
      highway_name_other: { "text-color": "#9A9AA2", "text-halo-color": "#0A0A0C" },
      highway_ref: { "text-color": "#9A9AA2", "text-halo-color": "#0A0A0C" },
      place_other: { "text-color": "#9A9AA2", "text-halo-color": "#0A0A0C" },
      place_suburb: { "text-color": "#9A9AA2", "text-halo-color": "#0A0A0C" },
      place_village: { "text-color": "#9A9AA2", "text-halo-color": "#0A0A0C" },
      place_town: { "text-color": "#A5A5AD", "text-halo-color": "#0A0A0C" },
      place_city: { "text-color": "#A5A5AD", "text-halo-color": "#0A0A0C" },
      place_city_large: { "text-color": "#B8B8BE", "text-halo-color": "#0A0A0C" },
      place_state: { "text-color": "#A0A0A8", "text-halo-color": "#0A0A0C" },
      place_country_other: { "text-color": "#B8B8BE", "text-halo-color": "#0A0A0C" },
      place_country_minor: { "text-color": "#B8B8BE", "text-halo-color": "#0A0A0C" },
      place_country_major: { "text-color": "#C8C8CE", "text-halo-color": "#0A0A0C" },
      place_continent: { "text-color": "#E6E6EA", "text-halo-color": "#0A0A0C" },
      "aeroway-area": { "fill-color": "#1A1A1F" },
      "aeroway-runway": { "line-color": "#2A2A31" },
      "aeroway-runway-casing": { "line-color": "#3A3A42" },
      "aeroway-taxiway": { "line-color": "#2A2A31" },
      road_area_pier: { "fill-color": "#121216" },
      road_pier: { "line-color": "#2A2A31" },
      tunnel_motorway_casing: { "line-color": "#2A2A31" },
      tunnel_motorway_inner: { "line-color": "#26262C" },
    };

    Object.entries(palette).forEach(([layerId, properties]) => {
      if (!this.map.getLayer(layerId)) return;
      Object.entries(properties).forEach(([property, value]) => {
        this.map.setPaintProperty(layerId, property, value);
      });
    });
  }

  hideMapLoading() {
    const loading = this.mapContainer.querySelector(".map-loading");
    if (loading) loading.style.display = "none";
  }

  showFallback() {
    const loading = this.mapContainer.querySelector(".map-loading");
    if (loading) loading.style.display = "none";

    const fallback = this.mapContainer.querySelector(".map-fallback");
    if (fallback) fallback.classList.add("is-visible");
  }
}

// Footer & Utils
class SiteUtilities {
  constructor() {
    this.init();
  }

  init() {
    this.setCurrentYear();
    this.handleReducedMotion();
  }

  setCurrentYear() {
    const yearElement = document.getElementById("year");
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  }

  handleReducedMotion() {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotionPreferences = () => {
      const reduced = prefersReducedMotion.matches;
      document.documentElement.style.setProperty("--t-base", reduced ? "0ms" : "");
      document.documentElement.style.setProperty("--t-slow", reduced ? "0ms" : "");
    };
    applyMotionPreferences();
    prefersReducedMotion.addEventListener("change", applyMotionPreferences);
  }
}

// App
class App {
  constructor() {
    this.initialized = false;
    this.init();
  }

  init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.bootstrap());
    } else {
      this.bootstrap();
    }
  }

  bootstrap() {
    if (this.initialized) return;
    this.initialized = true;

    // Marca de JS activo. Acota el fallback `aosFallback` del CSS a
    // `html:not(.js)`; sin esta clase el fallback revelaba toda la pagina a
    // los 2 segundos y anulaba las animaciones de scroll.
    document.documentElement.classList.add("js");

    try {
      new Navigation();
      new HeroParticles();
      new AnimationObserver();
      new TeamDock();
      new ServiceTilt();
      new Accordion();
      new TestimonialsMarquee();
      new VisualEffects();
      new MapLibreIntegration();
      new SiteUtilities();

      logger.log("Application initialized successfully.");
    } catch (error) {
      logger.error(`Critical initialization failure: ${error.message}`);
    }
  }
}
new App();