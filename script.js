/**
 * @fileoverview Script principal para la landing page del Club Lobos Negros.
 * Implementa navegación suave, animaciones al hacer scroll mediante Intersection Observer,
 * efectos visuales de interacción y la integración con la API de Google Maps con carga perezosa (lazy load).
 * 
 * Filosofía: Código modular, documentado, accesible y optimizado para rendimiento.
 * @author Club Lobos Negros
 * @version 2.1.0
 */

// --- CONFIGURACIÓN GLOBAL ---

/**
 * Configuración global del sitio.
 * @type {Readonly<{scrollOffset: number, observerThreshold: number, observerRootMargin: string, debugMode: boolean, social: {whatsapp: string, instagram: string, facebook: string}, googleMapsKey: string, mapLocation: {lat: number, lng: number}}>}
 */
const CONFIG = {
  scrollOffset: 80,
  observerThreshold: 0.15,
  observerRootMargin: "0px 0px -100px 0px",
  debugMode: false,
  social: {
    whatsapp: "https://wa.me/+573003461130",
    instagram: "https://instagram.com/club_lobosnegros",
    facebook: "https://facebook.com/lobosnegrostaekwondo",
  },
  googleMapsKey: "AIzaSyCaAJC1ufdVWEXLqSRBsjDUDwcyuAPZEK8",
  mapLocation: { lat: 10.9575, lng: -74.8035 },
};

// --- UTILIDADES DE REGISTRO (LOGGING) ---

/**
 * Sistema de logging optimizado para depuración.
 */
const logger = {
  log: (msg) => CONFIG.debugMode && console.log(`[LN] ${msg}`),
  warn: (msg) => CONFIG.debugMode && console.warn(`[LN] ${msg}`),
  error: (msg) => CONFIG.debugMode && console.error(`[LN] ${msg}`),
};

// --- FUNCIÓN AUXILIAR DE RENDIMIENTO (THROTTLE) ---

/**
 * Limita la frecuencia de ejecución de una función para optimizar eventos de scroll y redimensionamiento.
 * @param {Function} func - Función a ejecutar.
 * @param {number} limit - Límite de tiempo en milisegundos.
 * @returns {Function} Función limitada por throttle.
 */
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

// --- CLASE: NAVEGACIÓN Y SCROLL SUAVE ---

/**
 * Controla el menú móvil, la navegación suave entre secciones y la actualización de enlaces activos al hacer scroll.
 */
class Navigation {
  constructor() {
    /** @type {HTMLElement|null} */
    this.navbar = document.querySelector(".navbar");
    /** @type {NodeListOf<HTMLAnchorElement>} */
    this.navLinks = document.querySelectorAll("[data-smooth-scroll]");
    /** @type {HTMLButtonElement|null} */
    this.mobileMenuBtn = document.querySelector(".mobile-menu-btn");
    /** @type {HTMLElement|null} */
    this.navMenu = document.querySelector(".nav-menu");
    /** @type {HTMLElement|null} */
    this.whatsappBtn = document.querySelector(".whatsapp-float");
    /** @type {HTMLElement|null} */
    this.heroSection = document.querySelector(".hero");

    this.init();
  }

  /**
   * Inicializa los escuchadores de eventos y el observador de scroll.
   */
  init() {
    if (!this.navbar) return;
    this.attachEventListeners();
    this.observeScroll();
  }

  /**
   * Agrega los escuchadores de eventos para enlaces y menú hamburguesa.
   */
  attachEventListeners() {
    // Scroll suave al hacer clic en los enlaces de navegación
    this.navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("href");
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
          this.smoothScroll(targetSection);
          this.closeMenu();
        }
      });
    });

    // Toggle del menú móvil
    if (this.mobileMenuBtn) {
      this.mobileMenuBtn.addEventListener("click", () => this.toggleMenu());
    }

    // Cerrar menú móvil al hacer clic fuera del header
    document.addEventListener("click", (e) => {
      if (this.navMenu?.classList.contains("active") && !e.target.closest(".navbar")) {
        this.closeMenu();
      }
    });
  }

  /**
   * Realiza un scroll suave animado hacia un elemento objetivo.
   * @param {HTMLElement} element - El elemento destino.
   */
  smoothScroll(element) {
    const offsetTop = element.offsetTop - CONFIG.scrollOffset;
    window.scrollTo({
      top: offsetTop,
      behavior: "smooth"
    });
  }

  /**
   * Activa o desactiva la vista del menú móvil y actualiza atributos ARIA.
   */
  toggleMenu() {
    if (!this.navMenu || !this.mobileMenuBtn) return;
    const isActive = this.navMenu.classList.toggle("active");
    this.mobileMenuBtn.setAttribute("aria-expanded", isActive);
  }

  /**
   * Cierra el menú móvil de forma segura.
   */
  closeMenu() {
    if (!this.navMenu || !this.mobileMenuBtn) return;
    this.navMenu.classList.remove("active");
    this.mobileMenuBtn.setAttribute("aria-expanded", "false");
  }

  /**
   * Observa el scroll de la ventana para desplegar el navbar y el botón de WhatsApp al desplazarse hacia la siguiente sección.
   */
  observeScroll() {
    const handleScrollState = () => {
      const scrollY = window.scrollY;
      const heroHeight = this.heroSection ? this.heroSection.offsetHeight : 400;
      // Desplegar cuando el usuario hace scroll hacia la siguiente sección (superando el 50% de la altura del hero)
      const isPastHero = scrollY >= (heroHeight * 0.5);

      if (isPastHero) {
        this.navbar?.classList.add("nav-visible");
        this.whatsappBtn?.classList.add("whatsapp-visible");
      } else {
        this.navbar?.classList.remove("nav-visible");
        this.whatsappBtn?.classList.remove("whatsapp-visible");
      }

      if (scrollY > 50) {
        this.navbar?.classList.add("scrolled");
      } else {
        this.navbar?.classList.remove("scrolled");
      }

      this.updateActiveLink();
    };

    window.addEventListener(
      "scroll",
      throttle(handleScrollState, 50),
      { passive: true }
    );

    // Inicializar estado en la primera carga
    handleScrollState();
  }

  /**
   * Detecta qué sección está actualmente en pantalla y añade la clase active a su enlace correspondiente.
   */
  updateActiveLink() {
    let currentSectionId = "";
    const sections = document.querySelectorAll("section[id]");
    const scrollPosition = window.scrollY + CONFIG.scrollOffset + 10;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;

      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        currentSectionId = section.getAttribute("id");
      }
    });

    this.navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${currentSectionId}`) {
        link.classList.add("active");
      }
    });
  }
}

// --- CLASE: ACORDEÓN DE BENEFICIOS ---

/**
 * Controla el acordeón interactivo de la sección de beneficios.
 * Un solo item abierto a la vez.
 */
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
  }

  /**
   * Abre o cierra un item del acordeón.
   * @param {HTMLElement} item - El .accordion-item a toggle.
   */
  toggle(item) {
    const isActive = item.classList.contains("active");
    const header = item.querySelector(".accordion-header");

    this.items.forEach((el) => {
      el.classList.remove("active");
      const body = el.querySelector(".accordion-body");
      if (body) body.style.maxHeight = "0px";
      const btn = el.querySelector(".accordion-header");
      if (btn) btn.setAttribute("aria-expanded", "false");
    });

    if (!isActive) {
      item.classList.add("active");
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

// --- CLASE: ANIMACIONES DE ENTRADA (AOS - ANIMATE ON SCROLL) ---

/**
 * Maneja las animaciones de entrada de elementos visuales utilizando Intersection Observer API.
 */
class AnimationObserver {
  constructor() {
    this.isSupported = "IntersectionObserver" in window;
    this.init();
  }

  /**
   * Inicializa el observador o aplica fallback en navegadores antiguos.
   */
  init() {
    if (!this.isSupported) {
      logger.warn("IntersectionObserver no soportado, usando fallback inmediato.");
      this.initFallback();
      return;
    }

    const elementsToAnimate = document.querySelectorAll("[data-aos]");
    if (elementsToAnimate.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.animateElement(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: CONFIG.observerThreshold,
        rootMargin: CONFIG.observerRootMargin,
      }
    );

    elementsToAnimate.forEach((el) => observer.observe(el));
  }

  /**
   * Ejecuta la animación en el elemento objetivo aplicando un retraso si está especificado.
   * @param {Element} element - Elemento del DOM a animar.
   */
  animateElement(element) {
    const delay = parseInt(element.getAttribute("data-aos-delay")) || 0;
    if (delay > 0) {
      element.style.transitionDelay = `${delay}ms`;
    }
    requestAnimationFrame(() => {
      element.classList.add("aos-animate");
    });
  }

  /**
   * Muestra todos los elementos animados de inmediato en caso de no soporte de la API.
   */
  initFallback() {
    const elementsToAnimate = document.querySelectorAll("[data-aos]");
    elementsToAnimate.forEach((el) => {
      el.classList.add("aos-animate");
    });
  }
}

// --- CLASE: EFECTOS VISUALES Y MICRO-INTERACCIONES ---

/**
 * Controla el carrusel de scroll snap de la sección de audiencia.
 */
class AudienceCarousel {
  constructor() {
    this.track = document.querySelector("[data-carousel]");
    this.dots = document.querySelectorAll("[data-carousel-nav] .carousel-dot");
    this.init();
  }

  init() {
    if (!this.track || !this.dots.length) return;

    // Click en dots
    this.dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const index = parseInt(dot.dataset.index);
        const slide = this.track.children[index];
        if (slide) {
          slide.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
        }
      });
    });

    // Sincronizar dots con scroll
    this.track.addEventListener(
      "scroll",
      throttle(() => this.updateDots(), 100),
      { passive: true }
    );
  }

  updateDots() {
    const slideWidth = this.track.children[0]?.offsetWidth || 1;
    const scrollLeft = this.track.scrollLeft;
    const index = Math.round(scrollLeft / slideWidth);

    this.dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
    });
  }
}

/**
 * Controla efectos interactivos de diseño premium, como la rotación 3D localizada de botones sociales.
 */
class VisualEffects {
  constructor() {
    this.init();
  }

  /**
   * Inicializa las micro-interacciones visuales.
   */
  init() {
    this.addMouseFollowEffect();
  }

  /**
   * Añade efecto 3D controlado a los enlaces sociales únicamente cuando el puntero interactúa con ellos.
   */
  addMouseFollowEffect() {
    const socialLinks = document.querySelectorAll(".social-link");
    socialLinks.forEach((link) => {
      link.addEventListener("mousemove", (e) => {
        const rect = link.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;

        // Rotación sutil basada en la posición local del puntero
        const angleX = -mouseY * 0.15;
        const angleY = mouseX * 0.15;

        link.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale(1.1)`;
      });

      link.addEventListener("mouseleave", () => {
        link.style.transform = "";
      });
    });
  }
}

// --- CLASE: UTILIDADES GENERALES Y ACCESIBILIDAD ---

/**
 * Maneja tareas transversales del sitio como el año del copyright y el soporte de accesibilidad.
 */
class SiteUtilities {
  constructor() {
    this.init();
  }

  init() {
    this.setCurrentYear();
    this.setWhatsAppLinks();
    this.handleReducedMotion();
  }

  /**
   * Establece el año actual en el copyright del footer.
   */
  setCurrentYear() {
    const yearElement = document.getElementById("year");
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  }

  /**
   * Asigna las URLs de redes sociales y WhatsApp desde la configuración central.
   */
  setWhatsAppLinks() {
    const whatsappFloat = document.querySelector("[data-whatsapp-float]");
    if (whatsappFloat) {
      whatsappFloat.href = CONFIG.social.whatsapp;
    }

    const socialLinks = document.querySelectorAll(".social-link");
    if (socialLinks.length) {
      socialLinks.forEach((link) => {
        const title = link.getAttribute("title");
        if (title === "WhatsApp") link.href = CONFIG.social.whatsapp;
        else if (title === "Instagram") link.href = CONFIG.social.instagram;
        else if (title === "Facebook") link.href = CONFIG.social.facebook;
      });
    }
  }

  /**
   * Ajusta dinámicamente las variables de velocidad de transición si el usuario prefiere movimiento reducido.
   */
  handleReducedMotion() {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotionPreferences = () => {
      if (prefersReducedMotion.matches) {
        document.documentElement.style.setProperty("--transition-base", "0ms");
        document.documentElement.style.setProperty("--transition-slow", "0ms");
      }
    };
    applyMotionPreferences();
    prefersReducedMotion.addEventListener("change", applyMotionPreferences);
  }
}

// --- CLASE: INTEGRACIÓN OPTIMIZADA CON GOOGLE MAPS (LAZY LOAD) ---

/**
 * Administra la carga e inicialización de la API de Google Maps bajo demanda.
 */
class GoogleMapsIntegration {
  constructor() {
    this.map = null;
    this.marker = null;
    this.apiKey = CONFIG.googleMapsKey;
    this.mapContainer = document.getElementById("map-container");
    this.mapElement = document.getElementById("map");
    this.isLoaded = false;

    this.init();
  }

  /**
   * Inicializa la carga perezosa si los elementos existen.
   */
  init() {
    if (!this.mapContainer || !this.mapElement) return;
    this.setupLazyLoad();
  }

  /**
   * Configura un IntersectionObserver para cargar el script de Google Maps solo cuando el contenedor esté cerca del viewport.
   */
  setupLazyLoad() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.isLoaded) {
            this.loadGoogleMapsAPI();
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: "150px", // Precargar antes de que sea visible
      }
    );

    observer.observe(this.mapContainer);
  }

  /**
   * Carga de forma asíncrona la API de Google Maps inyectando el elemento script.
   */
  loadGoogleMapsAPI() {
    if (window.google && window.google.maps) {
      this.initializeMap();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&language=es&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => this.initializeMap();
    script.onerror = () => this.showFallback();

    document.head.appendChild(script);
  }

  /**
   * Inicializa el mapa centrado en el Parque La Inmaculada y dibuja un marcador personalizado.
   */
  initializeMap() {
    try {
      const location = CONFIG.mapLocation;

      this.map = new google.maps.Map(this.mapElement, {
        zoom: 16,
        center: location,
        mapTypeId: "roadmap",
        styles: this.getMapStyles(),
        fullscreenControl: true,
        zoomControl: true,
        streetViewControl: true,
        mapTypeControl: false,
      });

      this.marker = new google.maps.Marker({
        position: location,
        map: this.map,
        title: "Club Lobos Negros - Parque La Inmaculada",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: "#ff4444",
          fillOpacity: 1,
          strokeColor: "#cc0000",
          strokeWeight: 2,
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 5px; font-family: sans-serif; color: #1a1a1a;">
            <h3 style="margin: 0 0 5px 0; color: #ff4444; font-size: 14px;">🐺 Club Lobos Negros</h3>
            <p style="margin: 0; font-size: 12px; font-weight: bold;">Parque La Inmaculada</p>
            <p style="margin: 3px 0 0 0; font-size: 11px; color: #555;">Barranquilla, Colombia</p>
          </div>
        `,
      });

      this.marker.addListener("click", () => infoWindow.open(this.map, this.marker));
      infoWindow.open(this.map, this.marker);

      this.isLoaded = true;
      this.hideMapLoading();
    } catch (error) {
      logger.error(`Error al construir mapa: ${error.message}`);
      this.showFallback();
    }
  }

  /**
   * Oculta el contenedor de carga una vez inicializado el mapa.
   */
  hideMapLoading() {
    const loading = this.mapContainer.querySelector(".map-loading");
    if (loading) loading.style.display = "none";
  }

  /**
   * Muestra información de error/fallback en caso de fallo en la API.
   */
  showFallback() {
    const loading = this.mapContainer.querySelector(".map-loading");
    if (loading) {
      loading.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <p style="color: #ff4444; font-weight: bold; margin-bottom: 8px;">Ubicación no disponible de forma interactiva.</p>
          <p style="font-size: 12px; color: #666;">Dirección: Parque La Inmaculada, Las Palmas, Barranquilla</p>
        </div>
      `;
    }
  }

  /**
   * Retorna los estilos visuales minimalistas para el mapa.
   * @returns {Array<object>} Configuración de estilos del mapa.
   */
  getMapStyles() {
    return [
      { elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#f1f1f1" }] },
      { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#d4e8d4" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9e6f0" }] }
    ];
  }
}

// --- INICIALIZACIÓN DE LA APLICACIÓN ---

/**
 * Punto de entrada para coordinar la inicialización del frontend.
 */
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

  /**
   * Instancia todas las clases y módulos del sitio.
   */
  bootstrap() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      new Navigation();
      new Accordion();
      new AnimationObserver();
      new VisualEffects();
      new AudienceCarousel();
      new SiteUtilities();
      new GoogleMapsIntegration();

      logger.log("Aplicación inicializada correctamente.");
    } catch (error) {
      logger.error(`Fallo crítico en inicialización: ${error.message}`);
    }
  }
}

// Arrancar aplicación
new App();
