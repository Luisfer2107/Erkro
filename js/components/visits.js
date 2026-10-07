/**
 * Componente Agenda de Visitas y Citas Inmobiliarias (Erkro CRM)
 * Gestión de visitas a propiedades con registro de feedback post-visita y confirmación WhatsApp.
 */

import { store } from '../store.js';
import { escapeHTML, generateId, formatDate } from '../utils/formatters.js';

let visitFilter = 'all'; // 'all', 'Programada', 'Realizada', 'Cancelada'

export function renderVisits(containerId = 'content-area') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const visits = store.getVisits();
  const properties = store.getProperties();
  const contacts = store.getContacts();
  const agents = store.getAgents();

  const filtered = visits.filter(v => {
    return visitFilter === 'all' || v.status === visitFilter;
  }).sort((a, b) => new Date(b.date + 'T' + (b.time || '00:00')) - new Date(a.date + 'T' + (a.time || '00:00')));

  container.innerHTML = `
    <div class="space-y-6">
      <!-- HEADER -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Agenda de Visitas</h1>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              ${filtered.length} registradas
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Citas de inspección de inmuebles y bitácora de impresiones de los clientes
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Filtro Estado -->
          <div class="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <button class="btn-filter-vis px-3 py-1.5 rounded-lg ${visitFilter === 'all' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500'}" data-filter="all">Todas</button>
            <button class="btn-filter-vis px-3 py-1.5 rounded-lg ${visitFilter === 'Programada' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500'}" data-filter="Programada">Programadas</button>
            <button class="btn-filter-vis px-3 py-1.5 rounded-lg ${visitFilter === 'Realizada' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500'}" data-filter="Realizada">Realizadas</button>
          </div>

          <!-- Botón Agendar Visita -->
          <button id="btn-new-visit" class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors">
            <i data-lucide="calendar-plus" class="w-4 h-4"></i> Agendar Visita
          </button>
        </div>
      </div>

      <!-- LISTA DE VISITAS -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${filtered.length === 0 ? `
          <div class="col-span-full py-16 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400">
            <i data-lucide="calendar" class="w-10 h-10 mx-auto text-slate-300 mb-2"></i>
            <p class="text-sm font-semibold">No hay visitas con el estado seleccionado.</p>
          </div>
        ` : filtered.map(v => {
          const prop = properties.find(p => p.id === v.propertyId);
          const cnt = contacts.find(c => c.id === v.contactId);
          const ag = agents.find(a => a.id === v.agentId);

          const statusBadge = {
            'Programada': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300',
            'Realizada': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300',
            'Cancelada': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
          }[v.status] || 'bg-slate-100 text-slate-600';

          return `
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold px-2.5 py-1 rounded-full border ${v.modality === 'Virtual' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300' : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'}">
                      ${v.modality === 'Virtual' ? '💻 Virtual' : '🏢 Presencial'}
                    </span>
                    <span class="text-xs font-bold px-2.5 py-1 rounded-full border ${statusBadge}">
                      ${v.status}
                    </span>
                    <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <i data-lucide="clock" class="w-3.5 h-3.5"></i> ${formatDate(v.date)} a las ${v.time || '10:00'}
                    </span>
                  </div>

                  <button class="btn-edit-vis text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1" data-vis-id="${v.id}">
                    <i data-lucide="edit-3" class="w-4 h-4"></i>
                  </button>
                </div>

                <!-- Inmueble -->
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60 mb-3">
                  <div class="text-[10px] font-bold text-slate-400 uppercase">Inmueble</div>
                  <div class="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    ${prop ? `${escapeHTML(prop.code)} - ${escapeHTML(prop.title)}` : 'Inmueble no seleccionado'}
                  </div>
                  ${prop ? `
                    <div class="text-xs text-slate-500 mt-0.5">${escapeHTML(prop.address || '')} • ${escapeHTML(prop.neighborhood || prop.city)}</div>
                  ` : ''}
                </div>

                <!-- Cliente & Asesor -->
                <div class="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <span class="text-[10px] text-slate-400 font-semibold block">Cliente:</span>
                    <span class="font-bold text-slate-800 dark:text-slate-200">${cnt ? escapeHTML(cnt.name) : 'N/A'}</span>
                    <div class="text-[11px] text-slate-400">${cnt ? cnt.phone : ''}</div>
                  </div>
                  <div>
                    <span class="text-[10px] text-slate-400 font-semibold block">Asesor a cargo:</span>
                    <span class="font-bold text-slate-800 dark:text-slate-200">${ag ? escapeHTML(ag.name) : 'N/A'}</span>
                  </div>
                </div>

                <!-- Ubicación o Enlace Virtual -->
                <div class="text-xs mb-3">
                  ${v.modality === 'Virtual' ? `
                    <span class="text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1.5">
                      <i data-lucide="video" class="w-3.5 h-3.5"></i> ${v.location ? escapeHTML(v.location) : 'Videollamada'}
                    </span>
                  ` : `
                    <span class="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <i data-lucide="map-pin" class="w-3.5 h-3.5 text-blue-600"></i> ${v.location || (prop ? prop.address : 'En el inmueble')}
                    </span>
                  `}
                </div>

                <!-- Feedback Post-Visita si existe -->
                ${v.feedback ? `
                  <div class="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 text-xs">
                    <span class="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">Feedback del Cliente:</span>
                    <p class="text-slate-700 dark:text-slate-300 italic mt-0.5">"${escapeHTML(v.feedback)}"</p>
                  </div>
                ` : (v.notes ? `
                  <p class="text-xs text-slate-500 italic">Nota: "${escapeHTML(v.notes)}"</p>
                ` : '')}
              </div>

              <!-- Acciones WhatsApp -->
              <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <button class="btn-feedback-vis text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400" data-vis-id="${v.id}">
                  ${v.feedback ? 'Actualizar Feedback' : '+ Registrar Resultado / Feedback'}
                </button>

                ${cnt && cnt.whatsapp && v.status === 'Programada' ? `
                  <a href="https://wa.me/${cnt.whatsapp}?text=Hola%20${encodeURIComponent(cnt.name)},%20te%20contacto%20de%20Inmobiliaria%20Erkro%20para%20confirmar%20nuestra%20visita%20${v.modality === 'Virtual' ? 'virtual' : 'presencial'}%20del%20${v.date}%20a%20las%20${v.time}." target="_blank" class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5">
                    <i data-lucide="message-circle" class="w-3.5 h-3.5"></i> Confirmar WhatsApp
                  </a>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- MODAL DE VISITA -->
    <div id="modal-visit-container"></div>
  `;

  if (window.lucide) window.lucide.createIcons();

  attachVisitEvents(containerId);
}

function attachVisitEvents(containerId) {
  document.querySelectorAll('.btn-filter-vis').forEach(btn => {
    btn.addEventListener('click', () => {
      visitFilter = btn.getAttribute('data-filter');
      renderVisits(containerId);
    });
  });

  const btnNew = document.getElementById('btn-new-visit');
  if (btnNew) {
    btnNew.addEventListener('click', () => {
      openVisitModal(null, containerId);
    });
  }

  document.querySelectorAll('.btn-edit-vis, .btn-feedback-vis').forEach(btn => {
    btn.addEventListener('click', () => {
      const visId = btn.getAttribute('data-vis-id');
      openVisitModal(visId, containerId);
    });
  });
}

export function openVisitModal(visitId = null, containerId = 'content-area') {
  const modalContainer = document.getElementById('modal-visit-container');
  if (!modalContainer) return;

  const vis = visitId ? store.getVisits().find(v => v.id === visitId) : null;
  const properties = store.getProperties();
  const contacts = store.getContacts();
  const agents = store.getAgents();

  modalContainer.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 modal-backdrop overflow-y-auto">
      <div class="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 modal-content-anim relative my-8">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">
            ${vis ? 'Editar Visita Inmobiliaria' : 'Agendar Nueva Visita'}
          </h3>
          <button id="modal-vis-close" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="form-visit" class="mt-4 space-y-3.5">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Inmueble a Visitar *</label>
            <select name="propertyId" required class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
              <option value="">Selecciona propiedad...</option>
              ${properties.map(p => `<option value="${p.id}" ${vis && vis.propertyId === p.id ? 'selected' : ''}>${escapeHTML(p.code)} - ${escapeHTML(p.title)}</option>`).join('')}
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Cliente / Prospecto *</label>
              <select name="contactId" required class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
                <option value="">Selecciona cliente...</option>
                ${contacts.map(c => `<option value="${c.id}" ${vis && vis.contactId === c.id ? 'selected' : ''}>${escapeHTML(c.name)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Asesor Encargado</label>
              <select name="agentId" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
                ${agents.map(a => `<option value="${a.id}" ${vis && vis.agentId === a.id ? 'selected' : ''}>${escapeHTML(a.name)}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fecha *</label>
              <input type="date" name="date" required value="${vis ? vis.date : new Date().toISOString().split('T')[0]}" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Hora</label>
              <input type="time" name="time" value="${vis ? vis.time : '10:00'}" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Estado</label>
              <select name="status" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
                <option value="Programada" ${!vis || vis.status === 'Programada' ? 'selected' : ''}>Programada</option>
                <option value="Realizada" ${vis && vis.status === 'Realizada' ? 'selected' : ''}>Realizada</option>
                <option value="Cancelada" ${vis && vis.status === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Feedback / Resultado de la Visita</label>
            <textarea name="feedback" rows="2" placeholder="¿Qué le pareció al cliente? ¿Hará oferta? ¿Objeciones sobre precio o acabados?..." class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">${vis ? escapeHTML(vis.feedback || '') : ''}</textarea>
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
            ${vis ? `
              <button type="button" id="btn-delete-vis" class="text-xs font-semibold text-rose-600 hover:text-rose-700">
                Eliminar Visita
              </button>
            ` : '<span></span>'}

            <div class="flex items-center gap-2">
              <button type="button" id="btn-cancel-vis" class="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                Cancelar
              </button>
              <button type="submit" class="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                Guardar Visita
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  const closeBtn = document.getElementById('modal-vis-close');
  const cancelBtn = document.getElementById('btn-cancel-vis');
  const deleteBtn = document.getElementById('btn-delete-vis');
  const form = document.getElementById('form-visit');

  const closeModal = () => { modalContainer.innerHTML = ''; };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  if (deleteBtn && visitId) {
    deleteBtn.addEventListener('click', () => {
      if (confirm('¿Eliminar esta visita?')) {
        store.deleteVisit(visitId);
        closeModal();
        renderVisits(containerId);
      }
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);

      const visitData = {
        id: visitId || generateId('vis'),
        propertyId: fd.get('propertyId'),
        contactId: fd.get('contactId'),
        agentId: fd.get('agentId') || null,
        date: fd.get('date'),
        time: fd.get('time') || '10:00',
        status: fd.get('status') || 'Programada',
        feedback: fd.get('feedback') || ''
      };

      store.saveVisit(visitData);
      closeModal();
      renderVisits(containerId);
    });
  }
}
