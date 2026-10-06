/**
 * Componente Directorio de Contactos y Clientes (Erkro CRM)
 * Gestión de Compradores, Propietarios, Inversionistas con perfil de requerimientos y WhatsApp.
 */

import { store } from '../store.js';
import { formatCurrency, escapeHTML, generateId } from '../utils/formatters.js';

let contactFilter = {
  search: '',
  type: 'all'
};

export function renderContacts(containerId = 'content-area') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const contacts = store.getContacts();
  const settings = store.getSettings();
  const agents = store.getAgents();

  const filtered = contacts.filter(c => {
    const term = contactFilter.search.toLowerCase();
    const matchSearch = !term ||
      c.name.toLowerCase().includes(term) ||
      (c.phone && c.phone.includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.notes && c.notes.toLowerCase().includes(term));

    const matchType = contactFilter.type === 'all' || c.type.includes(contactFilter.type);

    return matchSearch && matchType;
  });

  container.innerHTML = `
    <div class="space-y-6">
      <!-- HEADER CON BUSCADOR Y NUEVO CONTACTO -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Directorio de Contactos</h1>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              ${filtered.length} clientes
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compradores, inversionistas y propietarios con historial y perfil inmobiliario
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Búsqueda -->
          <div class="relative">
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
            <input 
              type="text" 
              id="contact-search" 
              placeholder="Buscar por nombre, tel..." 
              value="${escapeHTML(contactFilter.search)}"
              class="pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 w-44 sm:w-56"
            >
          </div>

          <!-- Filtro Tipo -->
          <select id="contact-type-filter" class="text-xs py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="all">Todos los roles</option>
            <option value="Comprador" ${contactFilter.type === 'Comprador' ? 'selected' : ''}>Comprador</option>
            <option value="Inversionista" ${contactFilter.type === 'Inversionista' ? 'selected' : ''}>Inversionista</option>
            <option value="Propietario" ${contactFilter.type === 'Propietario' ? 'selected' : ''}>Propietario</option>
          </select>

          <!-- Botón Nuevo Contacto -->
          <button id="btn-new-contact" class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-colors">
            <i data-lucide="user-plus" class="w-4 h-4"></i> Nuevo Contacto
          </button>
        </div>
      </div>

      <!-- GRILLA DE CONTACTOS -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${filtered.length === 0 ? `
          <div class="col-span-full py-16 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400">
            <i data-lucide="users" class="w-10 h-10 mx-auto text-slate-300 mb-2"></i>
            <p class="text-sm font-semibold">No se encontraron contactos que coincidan con la búsqueda.</p>
          </div>
        ` : filtered.map(cnt => {
          const agent = agents.find(a => a.id === cnt.assignedAgentId);

          return `
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover-lift flex flex-col justify-between">
              <div>
                <!-- Encabezado de la Tarjeta -->
                <div class="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200">
                      ${escapeHTML(cnt.type)}
                    </span>
                    <h3 class="text-base font-bold text-slate-900 dark:text-white mt-1">
                      ${escapeHTML(cnt.name)}
                    </h3>
                    <div class="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <i data-lucide="map-pin" class="w-3 h-3"></i> ${escapeHTML(cnt.city || 'Colombia')}
                    </div>
                  </div>

                  <button class="btn-edit-contact text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1" data-contact-id="${cnt.id}">
                    <i data-lucide="edit-3" class="w-4 h-4"></i>
                  </button>
                </div>

                <!-- Perfil de Requerimiento Inmobiliario -->
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60 text-xs space-y-1.5 mb-3">
                  <div class="flex items-center justify-between text-slate-500">
                    <span>Presupuesto Máx:</span>
                    <span class="font-bold text-slate-900 dark:text-white">
                      ${cnt.budgetMax ? formatCurrency(cnt.budgetMax, settings.currency) : 'Sin definir'}
                    </span>
                  </div>
                  <div class="flex items-center justify-between text-slate-500">
                    <span>Busca:</span>
                    <span class="font-semibold text-slate-800 dark:text-slate-200">${escapeHTML(cnt.preferredType || 'Cualquiera')}</span>
                  </div>
                  ${cnt.preferredZone ? `
                    <div class="flex items-center justify-between text-slate-500">
                      <span>Zona preferida:</span>
                      <span class="text-slate-800 dark:text-slate-200 truncate max-w-[150px]">${escapeHTML(cnt.preferredZone)}</span>
                    </div>
                  ` : ''}
                </div>

                <!-- Notas y Bitácora -->
                ${cnt.notes ? `
                  <p class="text-xs text-slate-600 dark:text-slate-300 italic line-clamp-2 mb-3">
                    "${escapeHTML(cnt.notes)}"
                  </p>
                ` : ''}
              </div>

              <!-- Barra de Contacto Directo (WhatsApp, Tel, Email) -->
              <div class="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                <div class="text-[11px] text-slate-400 flex items-center gap-1.5">
                  ${agent ? `
                    <img src="${agent.avatar}" class="w-4 h-4 rounded-full object-cover">
                    <span>${escapeHTML(agent.name.split(' ')[0])}</span>
                  ` : '<span>Sin asesor</span>'}
                </div>

                <div class="flex items-center gap-1.5">
                  ${cnt.whatsapp ? `
                    <a href="https://wa.me/${cnt.whatsapp}?text=Hola%20${encodeURIComponent(cnt.name)},%20te%20contacto%20de%20Inmobiliaria%20Erkro%20para%20darle%20seguimiento%20a%20tu%20b%C3%BAsqueda%20inmobiliaria." target="_blank" class="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200 transition-colors" title="Chatear por WhatsApp">
                      <i data-lucide="message-circle" class="w-4 h-4"></i>
                    </a>
                  ` : ''}
                  ${cnt.phone ? `
                    <a href="tel:${cnt.phone}" class="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 border border-blue-200 transition-colors" title="Llamar">
                      <i data-lucide="phone" class="w-4 h-4"></i>
                    </a>
                  ` : ''}
                  ${cnt.email ? `
                    <a href="mailto:${cnt.email}" class="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors" title="Enviar correo">
                      <i data-lucide="mail" class="w-4 h-4"></i>
                    </a>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- MODAL DE CONTACTO -->
    <div id="modal-contact-container"></div>
  `;

  if (window.lucide) window.lucide.createIcons();

  attachContactEvents(containerId);
}

function attachContactEvents(containerId) {
  const searchInput = document.getElementById('contact-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      contactFilter.search = e.target.value;
      renderContacts(containerId);
    });
  }

  const typeSelect = document.getElementById('contact-type-filter');
  if (typeSelect) {
    typeSelect.addEventListener('change', (e) => {
      contactFilter.type = e.target.value;
      renderContacts(containerId);
    });
  }

  const btnNew = document.getElementById('btn-new-contact');
  if (btnNew) {
    btnNew.addEventListener('click', () => {
      openContactModal(null, containerId);
    });
  }

  document.querySelectorAll('.btn-edit-contact').forEach(btn => {
    btn.addEventListener('click', () => {
      const cntId = btn.getAttribute('data-contact-id');
      openContactModal(cntId, containerId);
    });
  });
}

export function openContactModal(contactId = null, containerId = 'content-area') {
  const modalContainer = document.getElementById('modal-contact-container');
  if (!modalContainer) return;

  const cnt = contactId ? store.getContact(contactId) : null;
  const agents = store.getAgents();

  modalContainer.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 modal-backdrop overflow-y-auto">
      <div class="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 modal-content-anim relative my-8">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">
            ${cnt ? 'Editar Contacto' : 'Nuevo Contacto / Cliente'}
          </h3>
          <button id="modal-cnt-close" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="form-contact" class="mt-4 space-y-3.5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre Completo *</label>
              <input type="text" name="name" required value="${cnt ? escapeHTML(cnt.name) : ''}" placeholder="Ej. Carlos Valencia" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipo de Cliente</label>
              <select name="type" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
                <option value="Comprador" ${!cnt || cnt.type === 'Comprador' ? 'selected' : ''}>Comprador</option>
                <option value="Inversionista" ${cnt && cnt.type === 'Inversionista' ? 'selected' : ''}>Inversionista</option>
                <option value="Propietario" ${cnt && cnt.type === 'Propietario' ? 'selected' : ''}>Propietario / Vendedor</option>
                <option value="Inquilino" ${cnt && cnt.type === 'Inquilino' ? 'selected' : ''}>Inquilino</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Teléfono / Móvil</label>
              <input type="text" name="phone" value="${cnt ? escapeHTML(cnt.phone || '') : ''}" placeholder="+57 300 123 4567" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">WhatsApp (con código país)</label>
              <input type="text" name="whatsapp" value="${cnt ? escapeHTML(cnt.whatsapp || '') : ''}" placeholder="573001234567" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
              <input type="email" name="email" value="${cnt ? escapeHTML(cnt.email || '') : ''}" placeholder="cliente@correo.com" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ciudad</label>
              <input type="text" name="city" value="${cnt ? escapeHTML(cnt.city || '') : 'Medellín'}" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
            </div>
          </div>

          <!-- Perfil Requerimiento -->
          <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-3">
            <h4 class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Interés de Búsqueda</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-medium text-slate-500 mb-1">Presupuesto Máximo ($)</label>
                <input type="number" name="budgetMax" value="${cnt && cnt.budgetMax ? cnt.budgetMax : ''}" placeholder="Ej. 800000000" class="w-full text-xs px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white">
              </div>
              <div>
                <label class="block text-[11px] font-medium text-slate-500 mb-1">Tipo de Inmueble Preferido</label>
                <select name="preferredType" class="w-full text-xs px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white">
                  <option value="">Cualquiera...</option>
                  ${['Apartamento', 'Casa Campestre', 'Penthouse', 'Casa Urbana', 'Local Comercial', 'Oficina', 'Lote / Terreno'].map(t => `<option value="${t}" ${cnt && cnt.preferredType === t ? 'selected' : ''}>${t}</option>`).join('')}
                </select>
              </div>
            </div>
            <div>
              <label class="block text-[11px] font-medium text-slate-500 mb-1">Zonas de Interés</label>
              <input type="text" name="preferredZone" value="${cnt && cnt.preferredZone ? escapeHTML(cnt.preferredZone) : ''}" placeholder="Ej. El Poblado, Envigado, Laureles" class="w-full text-xs px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Asesor Asignado</label>
              <select name="assignedAgentId" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
                <option value="">Sin asignar...</option>
                ${agents.map(a => `<option value="${a.id}" ${cnt && cnt.assignedAgentId === a.id ? 'selected' : ''}>${escapeHTML(a.name)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Estado del Lead</label>
              <select name="status" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
                <option value="Nuevo Lead" ${!cnt || cnt.status === 'Nuevo Lead' ? 'selected' : ''}>Nuevo Lead</option>
                <option value="Calificado" ${cnt && cnt.status === 'Calificado' ? 'selected' : ''}>Calificado</option>
                <option value="En Visita" ${cnt && cnt.status === 'En Visita' ? 'selected' : ''}>En Visita</option>
                <option value="Negociación" ${cnt && cnt.status === 'Negociación' ? 'selected' : ''}>Negociación</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Notas y Observaciones</label>
            <textarea name="notes" rows="2" placeholder="Requerimientos específicos, tiempos de compra, forma de pago..." class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">${cnt ? escapeHTML(cnt.notes || '') : ''}</textarea>
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
            ${cnt ? `
              <button type="button" id="btn-delete-cnt" class="text-xs font-semibold text-rose-600 hover:text-rose-700">
                Eliminar Contacto
              </button>
            ` : '<span></span>'}

            <div class="flex items-center gap-2">
              <button type="button" id="btn-cancel-cnt" class="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                Cancelar
              </button>
              <button type="submit" class="px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm">
                Guardar Contacto
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  const closeBtn = document.getElementById('modal-cnt-close');
  const cancelBtn = document.getElementById('btn-cancel-cnt');
  const deleteBtn = document.getElementById('btn-delete-cnt');
  const form = document.getElementById('form-contact');

  const closeModal = () => { modalContainer.innerHTML = ''; };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  if (deleteBtn && contactId) {
    deleteBtn.addEventListener('click', () => {
      if (confirm('¿Eliminar este contacto?')) {
        store.deleteContact(contactId);
        closeModal();
        renderContacts(containerId);
      }
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);

      const contactData = {
        id: contactId || generateId('cnt'),
        name: fd.get('name'),
        type: fd.get('type'),
        phone: fd.get('phone') || '',
        whatsapp: fd.get('whatsapp') ? fd.get('whatsapp').replace(/[^0-9]/g, '') : '',
        email: fd.get('email') || '',
        city: fd.get('city') || 'Medellín',
        budgetMax: Number(fd.get('budgetMax')) || 0,
        preferredType: fd.get('preferredType') || '',
        preferredZone: fd.get('preferredZone') || '',
        assignedAgentId: fd.get('assignedAgentId') || null,
        status: fd.get('status') || 'Nuevo Lead',
        notes: fd.get('notes') || ''
      };

      store.saveContact(contactData);
      closeModal();
      renderContacts(containerId);
    });
  }
}
