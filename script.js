/**
 * ============================================================================
 * CLUB LOBOS NEGROS - SCRIPT PRINCIPAL
 * ============================================================================
 */

// ============================================================================
// CONFIGURACIÓN GLOBAL
// ============================================================================

const CONFIG = {
  animationDuration: 300,
  scrollOffset: 80,
  observerThreshold: 0.15,
  observerRootMargin: "0px 0px -100px 0px",
  debugMode: false,
};

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

const logger = {
  log: (msg) => CONFIG.debugMode && console.log(`🐺 ${msg}`),
  warn: (msg) => CONFIG.debugMode && console.warn(`⚠️ ${msg}`),
  error: (msg) => CONFIG.debugMode && console.error(`❌ ${msg}`),
};

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Debounce para optimizar el rendimiento de eventos
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle para eventos frecuentes
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

/**
 * Esperar a que un elemento esté listo
 */
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Elemento ${selector} no encontrado`));
    }, timeout);
  });
}

// ============================================================================
// NAVEGACIÓN Y SCROLL SUAVE
// ============================================================================

class Navigation {
  constructor() {
    this.navbar = document.querySelector(".navbar");
    this.navLinks = document.querySelectorAll("[data-smooth-scroll]");
    this.mobileMenuBtn = document.querySelector(".mobile-menu-btn");
    this.navMenu = document.querySelector(".nav-menu");
    this.init();
  }

  init() {
    this.attachEventListeners();
    this.observeScroll();
  }

  attachEventListeners() {
    // Smooth scroll en enlaces
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

    // Mobile menu toggle
    if (this.mobileMenuBtn) {
      this.mobileMenuBtn.addEventListener("click", () => {
        this.toggleMenu();
      });
    }

    // Cerrar menu al hacer click fuera
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".navbar")) {
        this.closeMenu();
      }
    });
  }

  smoothScroll(element) {
    const offsetTop = element.offsetTop - CONFIG.scrollOffset;
    const startPosition = window.scrollY;
    const distance = offsetTop - startPosition;
    const duration = CONFIG.animationDuration * 2;
    let start = null;

    const easeInOutQuad = (t, b, c, d) => {
      t /= d / 2;
      if (t < 1) return (c / 2) * t * t + b;
      t--;
      return (-c / 2) * (t * (t - 2) - 1) + b;
    };

    const animation = (currentTime) => {
      if (start === null) start = currentTime;
      const elapsed = currentTime - start;
      const position = easeInOutQuad(
        elapsed,
        startPosition,
        distance,
        duration,
      );

      window.scrollTo(0, position);

      if (elapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  }

  toggleMenu() {
    this.navMenu.classList.toggle("active");
    const isActive = this.navMenu.classList.contains("active");
    this.mobileMenuBtn.setAttribute("aria-expanded", isActive);
  }

  closeMenu() {
    this.navMenu.classList.remove("active");
    this.mobileMenuBtn.setAttribute("aria-expanded", "false");
  }

  observeScroll() {
    window.addEventListener(
      "scroll",
      throttle(() => {
        if (window.scrollY > 100) {
          this.navbar.classList.add("scrolled");
        } else {
          this.navbar.classList.remove("scrolled");
        }

        // Update active nav link
        this.updateActiveLink();
      }, 100),
    );
  }

  updateActiveLink() {
    let current = "";
    const sections = document.querySelectorAll("section[id]");

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;

      if (scrollY >= sectionTop - CONFIG.scrollOffset) {
        current = section.getAttribute("id");
      }
    });

    this.navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active");
      }
    });
  }
}

// ============================================================================
// ANIMACIONES CON INTERSECTION OBSERVER - VERSIÓN MEJORADA
// ============================================================================

class AnimationObserver {
  constructor() {
    this.elementsToAnimate = [];
    this.observer = null;
    this.isSupported = "IntersectionObserver" in window;
    this.init();
  }

  init() {
    if (!this.isSupported) {
      logger.warn("IntersectionObserver no soportado, usando fallback");
      this.initFallback();
      return;
    }

    logger.log("Inicializando AnimationObserver");
    this.observer = this.createObserver();
    this.observeElements();

    // Fallback: animar elementos ya visibles al cargar
    this.animateVisibleElements();
  }

  createObserver() {
    const options = {
      threshold: CONFIG.observerThreshold,
      rootMargin: CONFIG.observerRootMargin,
    };

    return new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.animateElement(entry.target);
          this.observer.unobserve(entry.target);
          logger.log(`Animado: ${entry.target.className}`);
        }
      });
    }, options);
  }

  observeElements() {
    const elementsToAnimate = document.querySelectorAll("[data-aos]");

    if (elementsToAnimate.length === 0) {
      logger.warn("No se encontraron elementos con data-aos");
      return;
    }

    logger.log(`Observando ${elementsToAnimate.length} elementos`);

    elementsToAnimate.forEach((el) => {
      this.elementsToAnimate.push(el);
      this.observer.observe(el);
    });
  }

  animateElement(element) {
    const animationType = element.getAttribute("data-aos");
    const delay = parseInt(element.getAttribute("data-aos-delay")) || 0;

    // Aplicar delay
    if (delay > 0) {
      element.style.transitionDelay = `${delay}ms`;
    }

    // Trigger animation en el siguiente frame
    requestAnimationFrame(() => {
      element.classList.add("aos-animate");
    });
  }

  // Fallback para navegadores sin IntersectionObserver
  initFallback() {
    const elementsToAnimate = document.querySelectorAll("[data-aos]");
    elementsToAnimate.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add("aos-animate");
      }, index * 100);
    });
  }

  // Animar elementos visibles al cargar
  animateVisibleElements() {
    requestAnimationFrame(() => {
      const elementsToAnimate = document.querySelectorAll("[data-aos]");

      elementsToAnimate.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

        if (isVisible) {
          this.animateElement(element);
        }
      });
    });
  }
}

// ============================================================================
// INTERACTIVIDAD DE TARJETAS
// ============================================================================

class CardInteraction {
  constructor() {
    this.cards = {
      service: document.querySelectorAll(".service-card"),
      benefit: document.querySelectorAll(".benefit-item"),
      audience: document.querySelectorAll(".audience-card"),
    };
    this.init();
  }

  init() {
    this.attachCardListeners(this.cards.service);
    this.attachCardListeners(this.cards.benefit);
    this.attachCardListeners(this.cards.audience);
  }

  attachCardListeners(cards) {
    cards.forEach((card) => {
      card.addEventListener("mouseenter", () => this.handleCardEnter(card));
      card.addEventListener("mouseleave", () => this.handleCardLeave(card));
    });
  }

  handleCardEnter(card) {
    card.style.transition = "all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)";
  }

  handleCardLeave(card) {
    card.style.transition = "all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)";
  }
}

// ============================================================================
// EFECTOS VISUALES
// ============================================================================

class VisualEffects {
  constructor() {
    this.init();
  }

  init() {
    this.addParallaxEffect();
    this.addMouseFollowEffect();
  }

  addParallaxEffect() {
    const parallaxElements = document.querySelectorAll("[data-parallax]");

    if (parallaxElements.length > 0) {
      window.addEventListener(
        "scroll",
        throttle(() => {
          parallaxElements.forEach((el) => {
            const scrollPosition = window.scrollY;
            const elementOffset = el.offsetTop;
            const elementHeight = el.clientHeight;

            if (scrollPosition + window.innerHeight > elementOffset) {
              const distance = (scrollPosition - elementOffset) * 0.5;
              el.style.transform = `translateY(${distance}px)`;
            }
          });
        }, 50),
      );
    }
  }

  addMouseFollowEffect() {
    const socialLinks = document.querySelectorAll(".social-link");

    if (socialLinks.length === 0) return;

    document.addEventListener(
      "mousemove",
      throttle((e) => {
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        socialLinks.forEach((link) => {
          const rect = link.getBoundingClientRect();
          const linkX = rect.left + rect.width / 2;
          const linkY = rect.top + rect.height / 2;

          const angleX = (mouseY - linkY) * 0.1;
          const angleY = (mouseX - linkX) * 0.1;

          if (Math.abs(angleX) < 5 && Math.abs(angleY) < 5) {
            link.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg)`;
          }
        });
      }, 50),
    );
  }
}

// ============================================================================
// UTILIDADES DEL SITIO
// ============================================================================

class SiteUtilities {
  constructor() {
    this.init();
  }

  init() {
    this.setCurrentYear();
    this.addAccessibilityFeatures();
    this.initializePerformance();
  }

  setCurrentYear() {
    const yearElement = document.getElementById("year");
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  }

  addAccessibilityFeatures() {
    // Detectar preferencia de movimiento reducido
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    if (prefersReducedMotion.matches) {
      document.documentElement.style.setProperty("--transition-base", "0ms");
      document.documentElement.style.setProperty("--transition-smooth", "0ms");
      document.documentElement.style.setProperty("--transition-slow", "0ms");
    }

    // Mejorar keyboard navigation
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const nav = document.querySelector(".nav-menu");
        if (nav && nav.classList.contains("active")) {
          nav.classList.remove("active");
        }
      }
    });
  }

  initializePerformance() {
    // Lazy load images if needed
    if ("IntersectionObserver" in window) {
      const imageElements = document.querySelectorAll("img[data-src]");
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute("data-src");
            imageObserver.unobserve(img);
          }
        });
      });

      imageElements.forEach((img) => imageObserver.observe(img));
    }
  }
}

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

class App {
  constructor() {
    this.initialized = false;
    this.init();
  }

  init() {
    // Esperar a que el DOM esté completamente cargado
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.bootstrap());
    } else {
      this.bootstrap();
    }

    // Fallback: también ejecutar en load
    if (document.readyState !== "complete") {
      window.addEventListener("load", () => {
        if (!this.initialized) {
          logger.log("Ejecutando bootstrap desde event load");
          this.bootstrap();
        }
      });
    }
  }

  bootstrap() {
    if (this.initialized) return;
    this.initialized = true;

    logger.log("Iniciando aplicación...");

    try {
      // Inicializar módulos
      new Navigation();
      logger.log("✓ Navigation inicializada");

      new AnimationObserver();
      logger.log("✓ AnimationObserver inicializado");

      new CardInteraction();
      logger.log("✓ CardInteraction inicializado");

      new VisualEffects();
      logger.log("✓ VisualEffects inicializado");

      new SiteUtilities();
      logger.log("✓ SiteUtilities inicializado");

      // Trigger para animaciones iniciales
      this.triggerInitialAnimations();
      logger.log("✓ Animaciones iniciales activadas");

      console.log(
        "✅ 🐺 Club Lobos Negros - Aplicación inicializada correctamente",
      );
    } catch (error) {
      logger.error(`Error durante bootstrap: ${error.message}`);
      console.error("Error:", error);
      // Aún así, mostrar los elementos como fallback
      this.showAllElements();
    }
  }

  triggerInitialAnimations() {
    // Activar animaciones de elementos visibles inmediatamente
    const visibleElements = document.querySelectorAll("[data-aos]");

    visibleElements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

      if (isVisible) {
        const delay = parseInt(element.getAttribute("data-aos-delay")) || 0;
        setTimeout(() => {
          element.classList.add("aos-animate");
        }, delay);
      }
    });
  }

  // Mostrar todos los elementos como fallback
  showAllElements() {
    logger.warn("Mostrando todos los elementos como fallback");
    const elements = document.querySelectorAll("[data-aos]");
    elements.forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "translate3d(0, 0, 0)";
      el.classList.add("aos-animate");
    });
  }
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

function monitorPerformance() {
  if (window.performance) {
    window.addEventListener("load", () => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      logger.log(`⏱️ Tiempo de carga total: ${pageLoadTime}ms`);

      // Log de Core Web Vitals
      if ("web-vital" in window) {
        logger.log("Web Vitals disponibles");
      }
    });
  }
}

// ============================================================================
// INICIAR APLICACIÓN
// ============================================================================

let app;

try {
  app = new App();
  monitorPerformance();
  logger.log("App instance creada");
} catch (error) {
  console.error("❌ Error critico:", error);
  // Fallback brutal: mostrar todo
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-aos]").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "translate3d(0, 0, 0)";
    });
  });
}
// ============================================================================
// GOOGLE MAPS INTEGRATION CON LAZY LOAD
// ============================================================================

class GoogleMapsIntegration {
  constructor() {
    this.map = null;
    this.marker = null;
    this.apiKey = "AIzaSyCaAJC1ufdVWEXLqSRBsjDUDwcyuAPZEK8"; // nueva api
    this.mapContainer = document.getElementById("map-container");
    this.mapElement = document.getElementById("map");
    this.isLoaded = false;
    this.init();
  }

  init() {
    if (!this.mapContainer || !this.mapElement) {
      logger.warn("Elementos de mapa no encontrados");
      return;
    }

    logger.log("GoogleMapsIntegration inicializado");
    this.setupLazyLoad();
  }

  setupLazyLoad() {
    // Lazy load: cargar maps solo cuando el usuario scrollea al footer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.isLoaded) {
            logger.log("Maps visible, cargando...");
            this.loadGoogleMapsAPI();
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "100px",
      },
    );

    observer.observe(this.mapContainer);
  }

  loadGoogleMapsAPI() {
    // Si la API ya está cargada
    if (window.google && window.google.maps) {
      this.initializeMap();
      return;
    }

    // Si no, cargar el script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&language=es&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      logger.log("Google Maps API cargado");
      this.initializeMap();
    };

    script.onerror = () => {
      logger.error("Error cargando Google Maps API");
      this.showFallback();
    };

    document.head.appendChild(script);
  }

  initializeMap() {
    try {
      // Coordenadas del Parque La Inmaculada
      const parkLocation = {
        lat: 10.9575,
        lng: -74.8035,
      };

      // Crear mapa
      this.map = new google.maps.Map(this.mapElement, {
        zoom: 16,
        center: parkLocation,
        mapTypeId: "roadmap",
        styles: this.getMapStyles(),
        fullscreenControl: true,
        zoomControl: true,
        streetViewControl: true,
        mapTypeControl: false,
      });

      // Crear marcador
      this.marker = new google.maps.Marker({
        position: parkLocation,
        map: this.map,
        title: "Parque La Inmaculada - Club Lobos Negros",
        icon: this.getCustomMarkerIcon(),
      });

      // Info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; font-family: Arial;">
            <h3 style="margin: 0 0 8px 0; color: #ff4444;">🐺 Club Lobos Negros</h3>
            <p style="margin: 0 0 5px 0;"><strong>Parque La Inmaculada</strong></p>
            <p style="margin: 0 0 5px 0;">Calle 37c #5a58</p>
            <p style="margin: 0 0 5px 0;">Barrio Las Palmas, Barranquilla</p>
            <p style="margin: 0; font-size: 12px; color: #666;">Entrenamiento de Taekwondo</p>
          </div>
        `,
      });

      this.marker.addListener("click", () => {
        infoWindow.open(this.map, this.marker);
      });

      // Abrir info al cargar
      infoWindow.open(this.map, this.marker);

      this.isLoaded = true;
      this.hideMapLoading();
      logger.log("✓ Google Maps inicializado correctamente");
    } catch (error) {
      logger.error(`Error inicializando mapa: ${error.message}`);
      this.showFallback();
    }
  }

  getMapStyles() {
    return [
      {
        elementType: "geometry",
        stylers: [{ color: "#eeeeee" }],
      },
      {
        elementType: "labels.text.fill",
        stylers: [{ color: "#616161" }],
      },
      {
        elementType: "labels.text.stroke",
        stylers: [{ color: "#f1f1f1" }],
      },
      {
        featureType: "administrative",
        elementType: "geometry",
        stylers: [{ color: "#f1f1f1" }],
      },
      {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#bdbdbd" }],
      },
      {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#757575" }],
      },
      {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#d4e8d4" }],
      },
      {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9e9e9e" }],
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#ffffff" }],
      },
      {
        featureType: "road.arterial",
        elementType: "labels.text.fill",
        stylers: [{ color: "#757575" }],
      },
      {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#dadada" }],
      },
      {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#616161" }],
      },
      {
        featureType: "road.local",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9e9e9e" }],
      },
      {
        featureType: "transit.line",
        elementType: "geometry",
        stylers: [{ color: "#e5e5e5" }],
      },
      {
        featureType: "transit.station",
        elementType: "geometry",
        stylers: [{ color: "#eeeeee" }],
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#c9e6f0" }],
      },
      {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9e9e9e" }],
      },
    ];
  }
  getCustomMarkerIcon() {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 15,
      fillColor: "#ff4444",
      fillOpacity: 1,
      strokeColor: "#cc0000",
      strokeWeight: 3,
    };
  }

  hideMapLoading() {
    const loading = this.mapContainer.querySelector(".map-loading");
    if (loading) {
      loading.style.display = "none";
    }
  }

  showFallback() {
    logger.warn("Mostrando fallback de mapa");
    const loading = this.mapContainer.querySelector(".map-loading");
    if (loading) {
      loading.innerHTML = `
        <div>
          <p>No se pudo cargar el mapa.</p>
          <p style="font-size: 12px; color: #999;">
            Verifica tu API key de Google Maps
          </p>
        </div>
      `;
    }
  }
}

// Inicializar Google Maps cuando el script cargue
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new GoogleMapsIntegration();
  });
} else {
  new GoogleMapsIntegration();
}
