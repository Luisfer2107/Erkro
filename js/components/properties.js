/**
 * Componente Catálogo y Gestión de Inmuebles (Inventario Inmobiliario Erkro)
 * Incluye Ficha Técnica completa, Galería, Matching con Clientes Compradores e Impresión.
 */

import { store } from '../store.js';
import { formatCurrency, escapeHTML, generateId } from '../utils/formatters.js';

let propertyFilters = {
  search: '',
  status: 'all',
  type: 'all',
  operation: 'all'
};

export function renderProperties(containerId = 'content-area') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const properties = store.getProperties();
  const settings = store.getSettings();

  // Filtrado
  const filtered = properties.filter(p => {
    const term = propertyFilters.search.toLowerCase();
    const matchSearch = !term ||
      p.title.toLowerCase().includes(term) ||
      p.code.toLowerCase().includes(term) ||
      (p.neighborhood && p.neighborhood.toLowerCase().includes(term)) ||
      (p.city && p.city.toLowerCase().includes(term));

    const matchStatus = propertyFilters.status === 'all' || p.status === propertyFilters.status;
    const matchType = propertyFilters.type === 'all' || p.type === propertyFilters.type;
    const matchOp = propertyFilters.operation === 'all' || p.operation === propertyFilters.operation;

    return matchSearch && matchStatus && matchType && matchOp;
  });

  const availableTypes = Array.from(new Set(properties.map(p => p.type)));

  container.innerHTML = `
    <div class="space-y-6">
      <!-- HEADER CON FILTROS Y BOTÓN NUEVA PROPIEDAD -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Inventario de Propiedades</h1>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              ${filtered.length} inmuebles
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Catálogo inmobiliario activo para venta, alquiler y preventa
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Búsqueda -->
          <div class="relative">
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
            <input 
              type="text" 
              id="prop-search" 
              placeholder="Buscar por código, zona..." 
              value="${escapeHTML(propertyFilters.search)}"
              class="pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 sm:w-48"
            >
          </div>

          <!-- Filtro Estado -->
          <select id="prop-status-filter" class="text-xs py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">Todos los estados</option>
            <option value="Disponible" ${propertyFilters.status === 'Disponible' ? 'selected' : ''}>Disponible</option>
            <option value="Reservado" ${propertyFilters.status === 'Reservado' ? 'selected' : ''}>Reservado</option>
            <option value="Vendido" ${propertyFilters.status === 'Vendido' ? 'selected' : ''}>Vendido</option>
            <option value="Alquilado" ${propertyFilters.status === 'Alquilado' ? 'selected' : ''}>Alquilado</option>
          </select>

          <!-- Filtro Tipo -->
          <select id="prop-type-filter" class="text-xs py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">Todos los tipos</option>
            ${availableTypes.map(t => `<option value="${t}" ${propertyFilters.type === t ? 'selected' : ''}>${escapeHTML(t)}</option>`).join('')}
          </select>

          <!-- Botón Nuevo Inmueble -->
          <button id="btn-new-property" class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors">
            <i data-lucide="plus" class="w-4 h-4"></i> Publicar Inmueble
          </button>
        </div>
      </div>

      <!-- GRILLA DE TARJETAS DE PROPIEDADES -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${filtered.length === 0 ? `
          <div class="col-span-full py-16 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400">
            <i data-lucide="home" class="w-10 h-10 mx-auto text-slate-300 mb-2"></i>
            <p class="text-sm font-semibold">No se encontraron propiedades con los filtros seleccionados.</p>
          </div>
        ` : filtered.map(prop => {
          const mainImage = prop.images && prop.images.length ? prop.images[0] : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800';
          const statusColors = {
            'Disponible': 'bg-emerald-500 text-white',
            'Reservado': 'bg-amber-500 text-white',
            'Vendido': 'bg-rose-500 text-white',
            'Alquilado': 'bg-blue-500 text-white'
          };
          const statusBg = statusColors[prop.status] || 'bg-slate-500 text-white';

          return `
            <div class="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm hover-lift flex flex-col justify-between">
              <!-- Foto Principal e Insignias -->
              <div class="relative h-52 w-full overflow-hidden group">
                <img 
                  src="${mainImage}" 
                  alt="${escapeHTML(prop.title)}" 
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                >
                <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>

                <!-- Insignia Estado -->
                <span class="absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full ${statusBg} shadow-sm">
                  ${prop.status}
                </span>

                <!-- Código Inmueble -->
                <span class="absolute top-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white border border-white/20">
                  ${escapeHTML(prop.code)}
                </span>

                <!-- Precio Destacado sobre la imagen -->
                <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                  <div>
                    <span class="text-[11px] text-slate-300 uppercase font-semibold">${prop.operation || 'Venta'}</span>
                    <div class="text-xl font-extrabold text-white">
                      ${formatCurrency(prop.price, settings.currency)}
                    </div>
                  </div>
                  <span class="text-xs font-bold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/20">
                    ${prop.type}
                  </span>
                </div>
              </div>

              <!-- Contenido de la Ficha -->
              <div class="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 class="text-base font-bold text-slate-900 dark:text-white line-clamp-1 mb-1">
                    ${escapeHTML(prop.title)}
                  </h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-3">
                    <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-400"></i>
                    ${escapeHTML(prop.neighborhood ? `${prop.neighborhood}, ${prop.city}` : prop.city)}
                  </p>

                  <!-- Fila de Características (m², habs, baños, garajes) -->
                  <div class="grid grid-cols-4 gap-2 py-2.5 border-y border-slate-100 dark:border-slate-700/60 text-center text-xs text-slate-600 dark:text-slate-300 mb-3">
                    <div>
                      <span class="block font-bold text-slate-900 dark:text-white">${prop.area} m²</span>
                      <span class="text-[10px] text-slate-400">Área</span>
                    </div>
                    <div>
                      <span class="block font-bold text-slate-900 dark:text-white">${prop.bedrooms || 0}</span>
                      <span class="text-[10px] text-slate-400">Habs</span>
                    </div>
                    <div>
                      <span class="block font-bold text-slate-900 dark:text-white">${prop.bathrooms || 0}</span>
                      <span class="text-[10px] text-slate-400">Baños</span>
                    </div>
                    <div>
                      <span class="block font-bold text-slate-900 dark:text-white">${prop.garages || 0}</span>
                      <span class="text-[10px] text-slate-400">Garajes</span>
                    </div>
                  </div>
                </div>

                <!-- Botones de Acción Inmobiliaria -->
                <div class="pt-2 flex items-center gap-2">
                  <button class="btn-view-prop flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 transition-colors" data-prop-id="${prop.id}">
                    <i data-lucide="eye" class="w-3.5 h-3.5"></i> Ficha Técnica
                  </button>
                  <button class="btn-match-clients inline-flex items-center justify-center p-2 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 transition-colors" title="Buscar Clientes Potenciales para este inmueble" data-prop-id="${prop.id}">
                    <i data-lucide="users" class="w-4 h-4"></i>
                  </button>
                  <button class="btn-edit-prop inline-flex items-center justify-center p-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors" data-prop-id="${prop.id}">
                    <i data-lucide="edit-3" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- MODAL DETALLE / FICHA TÉCNICA -->
    <div id="modal-property-container"></div>
  `;

  if (window.lucide) window.lucide.createIcons();

  attachPropertyEvents(containerId);
}

function attachPropertyEvents(containerId) {
  // Filtros
  const searchInput = document.getElementById('prop-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      propertyFilters.search = e.target.value;
      renderProperties(containerId);
    });
  }

  const statusSelect = document.getElementById('prop-status-filter');
  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      propertyFilters.status = e.target.value;
      renderProperties(containerId);
    });
  }

  const typeSelect = document.getElementById('prop-type-filter');
  if (typeSelect) {
    typeSelect.addEventListener('change', (e) => {
      propertyFilters.type = e.target.value;
      renderProperties(containerId);
    });
  }

  // Nuevo Inmueble
  const btnNew = document.getElementById('btn-new-property');
  if (btnNew) {
    btnNew.addEventListener('click', () => {
      openPropertyFormModal(null, containerId);
    });
  }

  // Ficha Técnica
  document.querySelectorAll('.btn-view-prop').forEach(btn => {
    btn.addEventListener('click', () => {
      const propId = btn.getAttribute('data-prop-id');
      openPropertyDetailModal(propId);
    });
  });

  // Matching Inteligente con Clientes
  document.querySelectorAll('.btn-match-clients').forEach(btn => {
    btn.addEventListener('click', () => {
      const propId = btn.getAttribute('data-prop-id');
      openPropertyMatchingModal(propId);
    });
  });

  // Editar
  document.querySelectorAll('.btn-edit-prop').forEach(btn => {
    btn.addEventListener('click', () => {
      const propId = btn.getAttribute('data-prop-id');
      openPropertyFormModal(propId, containerId);
    });
  });
}

/**
 * Modal Detalle de Ficha Técnica Imprimible
 */
export function openPropertyDetailModal(propId) {
  const modalContainer = document.getElementById('modal-property-container');
  if (!modalContainer) return;

  const prop = store.getProperty(propId);
  if (!prop) return;

  const settings = store.getSettings();
  const agent = prop.agentId ? store.getAgent(prop.agentId) : null;

  modalContainer.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 modal-backdrop overflow-y-auto">
      <div id="printable-property-sheet" class="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-700 modal-content-anim relative my-8">
        
        <!-- Botones Superiores -->
        <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-700 no-print">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Ficha Técnica Inmobiliaria
            </span>
            <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              ${escapeHTML(prop.code)}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.print()" class="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <i data-lucide="printer" class="w-3.5 h-3.5"></i> Imprimir Ficha
            </button>
            <button id="modal-prop-close" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
        </div>

        <!-- Encabezado Ficha -->
        <div class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">${escapeHTML(prop.title)}</h2>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                <i data-lucide="map-pin" class="w-3.5 h-3.5"></i>
                ${escapeHTML(prop.address || '')} • ${escapeHTML(prop.neighborhood || '')}, ${escapeHTML(prop.city)}
              </p>
            </div>
            <div class="text-right sm:text-right">
              <span class="text-xs text-slate-400 font-semibold uppercase">${prop.operation || 'Venta'}</span>
              <div class="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                ${formatCurrency(prop.price, settings.currency)}
              </div>
            </div>
          </div>

          <!-- Galería de Fotos -->
          <div class="grid grid-cols-2 gap-2 rounded-xl overflow-hidden max-h-72">
            ${prop.images && prop.images.length ? prop.images.slice(0, 2).map((img, i) => `
              <img src="${img}" class="w-full h-48 sm:h-56 object-cover ${i === 0 && prop.images.length === 1 ? 'col-span-2' : ''}">
            `).join('') : '<div class="col-span-2 py-12 text-center text-slate-400">Sin imágenes</div>'}
          </div>

          <!-- Especificaciones Principales -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60 text-xs">
            <div>
              <span class="text-slate-400 block font-medium">Área Construida</span>
              <span class="text-sm font-bold text-slate-900 dark:text-white">${prop.area} m²</span>
            </div>
            <div>
              <span class="text-slate-400 block font-medium">Habitaciones</span>
              <span class="text-sm font-bold text-slate-900 dark:text-white">${prop.bedrooms || 0} alcobas</span>
            </div>
            <div>
              <span class="text-slate-400 block font-medium">Baños</span>
              <span class="text-sm font-bold text-slate-900 dark:text-white">${prop.bathrooms || 0} baños</span>
            </div>
            <div>
              <span class="text-slate-400 block font-medium">Parqueaderos</span>
              <span class="text-sm font-bold text-slate-900 dark:text-white">${prop.garages || 0} plazas</span>
            </div>
          </div>

          <!-- Descripción -->
          <div>
            <h4 class="text-xs font-bold uppercase text-slate-500 mb-1">Descripción</h4>
            <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              ${escapeHTML(prop.description || 'Sin descripción detallada.')}
            </p>
          </div>

          <!-- Comodidades / Amenities -->
          ${prop.amenities && prop.amenities.length ? `
            <div>
              <h4 class="text-xs font-bold uppercase text-slate-500 mb-2">Comodidades y Acabados</h4>
              <div class="flex flex-wrap gap-1.5">
                ${prop.amenities.map(a => `
                  <span class="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    ✓ ${escapeHTML(a)}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Asesor a Cargo -->
          ${agent ? `
            <div class="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <img src="${agent.avatar}" class="w-10 h-10 rounded-full object-cover">
                <div>
                  <div class="text-xs font-bold text-slate-900 dark:text-white">${escapeHTML(agent.name)}</div>
                  <div class="text-[11px] text-slate-400">${escapeHTML(agent.role)} • ${agent.phone}</div>
                </div>
              </div>
              <a href="https://wa.me/${agent.phone.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(agent.name)},%20solicito%20información%20del%20inmueble%20${prop.code}" target="_blank" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold no-print flex items-center gap-1.5">
                <i data-lucide="message-circle" class="w-3.5 h-3.5"></i> Contactar Asesor
              </a>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  const closeBtn = document.getElementById('modal-prop-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modalContainer.innerHTML = '';
    });
  }
}

/**
 * Matching Inteligente: Busca compradores interesados en este inmueble
 */
export function openPropertyMatchingModal(propId) {
  const modalContainer = document.getElementById('modal-property-container');
  if (!modalContainer) return;

  const prop = store.getProperty(propId);
  const contacts = store.getContacts();
  const settings = store.getSettings();

  // Algoritmo de compatibilidad:
  // 1. Presupuesto máximo del comprador >= precio del inmueble (o margen de 15%)
  // 2. Tipo de propiedad buscada coincide
  const matches = contacts.map(c => {
    let score = 0;
    const reasons = [];

    // Verificación tipo
    if (c.preferredType && c.preferredType.toLowerCase() === prop.type.toLowerCase()) {
      score += 50;
      reasons.push(`Busca ${prop.type}`);
    }

    // Verificación presupuesto
    if (c.budgetMax) {
      if (c.budgetMax >= prop.price) {
        score += 40;
        reasons.push(`Presupuesto cubre el valor (${formatCurrency(c.budgetMax, settings.currency)})`);
      } else if (c.budgetMax >= prop.price * 0.85) {
        score += 20;
        reasons.push(`Presupuesto cercano al 85% del valor`);
      }
    }

    // Verificación zona
    if (c.preferredZone && prop.neighborhood && c.preferredZone.toLowerCase().includes(prop.neighborhood.toLowerCase())) {
      score += 10;
      reasons.push(`Zona preferida coincide (${prop.neighborhood})`);
    }

    return { contact: c, score, reasons };
  }).filter(m => m.score > 20).sort((a, b) => b.score - a.score);

  modalContainer.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 modal-backdrop">
      <div class="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 modal-content-anim relative">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i data-lucide="sparkles" class="w-5 h-5 text-amber-500"></i> Cruce Inteligente de Clientes
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">Propiedad: <span class="font-semibold text-slate-800 dark:text-slate-200">${escapeHTML(prop.code)} - ${escapeHTML(prop.title)}</span></p>
          </div>
          <button id="modal-match-close" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <div class="mt-4 space-y-3 max-h-96 overflow-y-auto">
          ${matches.length === 0 ? `
            <div class="py-8 text-center text-slate-400 text-xs">
              No hay contactos con presupuesto o tipo afín a esta propiedad actualmente.
            </div>
          ` : matches.map(m => `
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-slate-900 dark:text-white">${escapeHTML(m.contact.name)}</span>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                    ${m.score}% afinidad
                  </span>
                </div>
                <div class="text-[11px] text-slate-500 mt-1">
                  ${m.reasons.join(' • ')}
                </div>
              </div>
              ${m.contact.whatsapp ? `
                <a href="https://wa.me/${m.contact.whatsapp}?text=Hola%20${encodeURIComponent(m.contact.name)},%20te%20comparto%20una%20propiedad%20que%20encaja%20con%20lo%20que%20buscas:%20${encodeURIComponent(prop.title)}%20(${formatCurrency(prop.price, settings.currency)})." target="_blank" class="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shrink-0" title="Presentar Inmueble por WhatsApp">
                  <i data-lucide="message-circle" class="w-4 h-4"></i>
                </a>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  const closeBtn = document.getElementById('modal-match-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modalContainer.innerHTML = '';
    });
  }
}

/**
 * Modal Crear / Editar Propiedad
 */
export function openPropertyFormModal(propId = null, containerId = 'content-area') {
  const modalContainer = document.getElementById('modal-property-container');
  if (!modalContainer) return;

  const prop = propId ? store.getProperty(propId) : null;
  const agents = store.getAgents();

  modalContainer.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 modal-backdrop overflow-y-auto">
      <div class="bg-white dark:bg-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 modal-content-anim relative my-8">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">
            ${prop ? 'Editar Propiedad' : 'Registrar Nuevo Inmueble'}
          </h3>
          <button id="modal-prop-form-close" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="form-prop" class="mt-4 space-y-3.5">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Código Ref. *</label>
              <input type="text" name="code" required value="${prop ? escapeHTML(prop.code) : 'ERK-' + Math.floor(100 + Math.random() * 900)}" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500">
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Título del Inmueble *</label>
              <input type="text" name="title" required value="${prop ? escapeHTML(prop.title) : ''}" placeholder="Ej. Apto en Rosales con vista a la ciudad" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
              <select name="type" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
                ${['Apartamento', 'Casa Campestre', 'Penthouse', 'Casa Urbana', 'Local Comercial', 'Oficina', 'Lote / Terreno'].map(t => `<option value="${t}" ${prop && prop.type === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Operación</label>
              <select name="operation" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
                <option value="Venta" ${prop && prop.operation === 'Venta' ? 'selected' : ''}>Venta</option>
                <option value="Alquiler" ${prop && prop.operation === 'Alquiler' ? 'selected' : ''}>Alquiler</option>
                <option value="Preventa" ${prop && prop.operation === 'Preventa' ? 'selected' : ''}>Preventa</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Estado</label>
              <select name="status" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
                <option value="Disponible" ${!prop || prop.status === 'Disponible' ? 'selected' : ''}>Disponible</option>
                <option value="Reservado" ${prop && prop.status === 'Reservado' ? 'selected' : ''}>Reservado</option>
                <option value="Vendido" ${prop && prop.status === 'Vendido' ? 'selected' : ''}>Vendido</option>
                <option value="Alquilado" ${prop && prop.status === 'Alquilado' ? 'selected' : ''}>Alquilado</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Precio ($) *</label>
              <input type="number" name="price" required value="${prop ? prop.price : ''}" placeholder="Ej. 750000000" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Área Construida (m²)</label>
              <input type="number" name="area" value="${prop ? prop.area : ''}" placeholder="Ej. 120" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Habitaciones</label>
              <input type="number" name="bedrooms" value="${prop ? prop.bedrooms : '3'}" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Baños</label>
              <input type="number" name="bathrooms" value="${prop ? prop.bathrooms : '2'}" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Garajes</label>
              <input type="number" name="garages" value="${prop ? prop.garages : '1'}" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ciudad</label>
              <input type="text" name="city" value="${prop ? escapeHTML(prop.city) : 'Medellín'}" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Barrio / Zona</label>
              <input type="text" name="neighborhood" value="${prop ? escapeHTML(prop.neighborhood) : ''}" placeholder="Ej. El Poblado" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">URL de Foto Principal</label>
            <input type="url" name="imageUrl" value="${prop && prop.images && prop.images[0] ? escapeHTML(prop.images[0]) : ''}" placeholder="https://images.unsplash.com/..." class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
            <textarea name="description" rows="2" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">${prop ? escapeHTML(prop.description || '') : ''}</textarea>
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
            ${prop ? `
              <button type="button" id="btn-delete-prop" class="text-xs font-semibold text-rose-600 hover:text-rose-700">
                Eliminar Inmueble
              </button>
            ` : '<span></span>'}

            <div class="flex items-center gap-2">
              <button type="button" id="btn-cancel-prop" class="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                Cancelar
              </button>
              <button type="submit" class="px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm">
                Guardar Inmueble
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  const closeBtn = document.getElementById('modal-prop-form-close');
  const cancelBtn = document.getElementById('btn-cancel-prop');
  const deleteBtn = document.getElementById('btn-delete-prop');
  const form = document.getElementById('form-prop');

  const closeModal = () => { modalContainer.innerHTML = ''; };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  if (deleteBtn && propId) {
    deleteBtn.addEventListener('click', () => {
      if (confirm('¿Eliminar definitivamente esta propiedad?')) {
        store.deleteProperty(propId);
        closeModal();
        renderProperties(containerId);
      }
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);

      const propData = {
        id: propId || generateId('prop'),
        code: fd.get('code'),
        title: fd.get('title'),
        type: fd.get('type'),
        operation: fd.get('operation'),
        status: fd.get('status'),
        price: Number(fd.get('price')) || 0,
        area: Number(fd.get('area')) || 0,
        bedrooms: Number(fd.get('bedrooms')) || 0,
        bathrooms: Number(fd.get('bathrooms')) || 0,
        garages: Number(fd.get('garages')) || 0,
        city: fd.get('city') || 'Medellín',
        neighborhood: fd.get('neighborhood') || '',
        description: fd.get('description') || '',
        images: fd.get('imageUrl') ? [fd.get('imageUrl')] : (prop && prop.images ? prop.images : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'])
      };

      store.saveProperty(propData);
      closeModal();
      renderProperties(containerId);
    });
  }
}
