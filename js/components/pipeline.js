/**
 * Componente Pipeline y Embudo de Oportunidades Inmobiliarias (Kanban & Lista)
 * Permite gestionar el ciclo completo de venta inmobiliaria con Drag & Drop fluido.
 */

import { store } from '../store.js';
import { formatCurrency, escapeHTML, generateId } from '../utils/formatters.js';

let currentFilter = {
  search: '',
  agentId: 'all',
  priority: 'all',
  view: 'kanban' // 'kanban' o 'list'
};

const STAGES = [
  { id: 'prospecto', name: 'Prospecto / Nuevo Lead', color: 'border-slate-300 dark:border-slate-700', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { id: 'calificado', name: 'Calificado / Interesado', color: 'border-blue-300 dark:border-blue-700', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  { id: 'visita_agendada', name: 'Visita Agendada', color: 'border-indigo-300 dark:border-indigo-700', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' },
  { id: 'negociacion', name: 'Oferta / Negociación', color: 'border-amber-300 dark:border-amber-700', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  { id: 'promesa', name: 'Promesa de Compraventa', color: 'border-teal-300 dark:border-teal-700', badge: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300' },
  { id: 'ganada', name: 'Cierre Ganado 🎉', color: 'border-emerald-300 dark:border-emerald-700', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  { id: 'perdida', name: 'Cierre Perdido', color: 'border-rose-300 dark:border-rose-700', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' }
];

export function renderPipeline(containerId = 'content-area') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const deals = store.getDeals();
  const agents = store.getAgents();
  const settings = store.getSettings();

  // Filtrado
  const filteredDeals = deals.filter(deal => {
    const matchSearch = !currentFilter.search || 
      deal.title.toLowerCase().includes(currentFilter.search.toLowerCase()) ||
      (deal.notes && deal.notes.toLowerCase().includes(currentFilter.search.toLowerCase()));
    
    const matchAgent = currentFilter.agentId === 'all' || deal.agentId === currentFilter.agentId;
    const matchPriority = currentFilter.priority === 'all' || deal.priority === currentFilter.priority;

    return matchSearch && matchAgent && matchPriority;
  });

  const totalFilteredVolume = filteredDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  container.innerHTML = `
    <div class="space-y-6">
      <!-- HEADER CON FILTROS Y BOTÓN NUEVA OPORTUNIDAD -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Embudo de Oportunidades</h1>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              ${filteredDeals.length} negocios
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Volumen filtrado: <span class="font-bold text-slate-900 dark:text-white">${formatCurrency(totalFilteredVolume, settings.currency)}</span>
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Búsqueda -->
          <div class="relative">
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
            <input 
              type="text" 
              id="pipeline-search" 
              placeholder="Buscar oportunidad..." 
              value="${escapeHTML(currentFilter.search)}"
              class="pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 sm:w-48"
            >
          </div>

          <!-- Filtro Asesor -->
          <select id="pipeline-agent-filter" class="text-xs py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">Todos los asesores</option>
            ${agents.map(ag => `<option value="${ag.id}" ${currentFilter.agentId === ag.id ? 'selected' : ''}>${escapeHTML(ag.name)}</option>`).join('')}
          </select>

          <!-- Filtro Prioridad -->
          <select id="pipeline-priority-filter" class="text-xs py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">Toda prioridad</option>
            <option value="Alta" ${currentFilter.priority === 'Alta' ? 'selected' : ''}>Alta</option>
            <option value="Media" ${currentFilter.priority === 'Media' ? 'selected' : ''}>Media</option>
            <option value="Baja" ${currentFilter.priority === 'Baja' ? 'selected' : ''}>Baja</option>
          </select>

          <!-- Toggle Kanban / Lista -->
          <div class="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-700">
            <button id="btn-view-kanban" class="px-2.5 py-1 text-xs font-semibold rounded-lg ${currentFilter.view === 'kanban' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}">
              <i data-lucide="kanban" class="w-3.5 h-3.5 inline"></i>
            </button>
            <button id="btn-view-list" class="px-2.5 py-1 text-xs font-semibold rounded-lg ${currentFilter.view === 'list' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}">
              <i data-lucide="list" class="w-3.5 h-3.5 inline"></i>
            </button>
          </div>

          <!-- Botón Nueva Oportunidad -->
          <button id="btn-new-deal" class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors">
            <i data-lucide="plus" class="w-4 h-4"></i> Nueva Oportunidad
          </button>
        </div>
      </div>

      <!-- VISTA KANBAN O LISTA -->
      ${currentFilter.view === 'kanban' ? renderKanbanView(filteredDeals) : renderListView(filteredDeals)}
    </div>

    <!-- MODAL DE CREAR / EDITAR OPORTUNIDAD -->
    <div id="modal-deal-container"></div>
  `;

  if (window.lucide) window.lucide.createIcons();

  attachPipelineEvents(containerId);
}

function renderKanbanView(deals) {
  const settings = store.getSettings();
  const contacts = store.getContacts();
  const properties = store.getProperties();
  const agents = store.getAgents();

  return `
    <div class="kanban-board-scroll">
      ${STAGES.map(stage => {
        const stageDeals = deals.filter(d => d.stage === stage.id);
        const stageTotal = stageDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

        return `
          <div class="kanban-stage-col flex flex-col bg-slate-50/90 dark:bg-slate-900/60 rounded-2xl border ${stage.color} p-3.5 shadow-sm">
            <!-- Encabezado de Columna -->
            <div class="flex items-center justify-between pb-2 mb-3 border-b border-slate-200/80 dark:border-slate-800">
              <div>
                <h3 class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  ${stage.name}
                  <span class="w-5 h-5 rounded-full ${stage.badge} text-[10px] font-bold flex items-center justify-center">
                    ${stageDeals.length}
                  </span>
                </h3>
                <div class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  ${formatCurrency(stageTotal, settings.currency)}
                </div>
              </div>
            </div>

            <!-- Contenedor Drag & Drop -->
            <div 
              class="kanban-column flex-1" 
              data-stage="${stage.id}"
            >
              ${stageDeals.map(deal => {
                const contact = contacts.find(c => c.id === deal.contactId);
                const property = properties.find(p => p.id === deal.propertyId);
                const agent = agents.find(a => a.id === deal.agentId);

                return `
                  <div 
                    class="kanban-card bg-white dark:bg-slate-800 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700/80 shadow-sm hover-lift"
                    draggable="true"
                    data-deal-id="${deal.id}"
                  >
                    <!-- Prioridad y Menú -->
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        deal.priority === 'Alta' 
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200' 
                          : deal.priority === 'Media'
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }">
                        ${deal.priority || 'Normal'}
                      </span>
                      <button class="btn-edit-deal text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" data-deal-id="${deal.id}">
                        <i data-lucide="more-horizontal" class="w-4 h-4"></i>
                      </button>
                    </div>

                    <!-- Título -->
                    <h4 class="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 mb-2 hover:text-blue-600 cursor-pointer btn-edit-deal" data-deal-id="${deal.id}">
                      ${escapeHTML(deal.title)}
                    </h4>

                    <!-- Monto -->
                    <div class="text-sm font-extrabold text-blue-600 dark:text-blue-400 mb-2.5">
                      ${formatCurrency(deal.amount, settings.currency)}
                    </div>

                    <!-- Inmueble vinculado -->
                    ${property ? `
                      <div class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2 truncate">
                        <i data-lucide="home" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i>
                        <span class="truncate font-medium">${escapeHTML(property.code)} - ${escapeHTML(property.neighborhood || property.city)}</span>
                      </div>
                    ` : ''}

                    <!-- Contacto / Cliente -->
                    ${contact ? `
                      <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                        <span class="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[130px]">
                          ${escapeHTML(contact.name)}
                        </span>
                        ${contact.whatsapp ? `
                          <a href="https://wa.me/${contact.whatsapp}?text=Hola%20${encodeURIComponent(contact.name)},%20te%20contacto%20de%20Inmobiliaria%20Erkro%20respecto%20a%20tu%20inter%C3%A9s%20inmobiliario." target="_blank" class="text-emerald-500 hover:text-emerald-600 p-1" title="Chatear por WhatsApp">
                            <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
                          </a>
                        ` : ''}
                      </div>
                    ` : ''}

                    <!-- Asesor -->
                    ${agent ? `
                      <div class="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                        <div class="flex items-center gap-1.5 truncate">
                          <img src="${agent.avatar}" class="w-4 h-4 rounded-full object-cover">
                          <span class="truncate">${escapeHTML(agent.name.split(' ')[0])}</span>
                        </div>
                        <span>${deal.expectedCloseDate ? deal.expectedCloseDate.substring(5) : ''}</span>
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderListView(deals) {
  const settings = store.getSettings();
  const contacts = store.getContacts();
  const properties = store.getProperties();
  const agents = store.getAgents();

  return `
    <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead class="bg-slate-50 dark:bg-slate-900/60 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th class="py-3.5 px-4">Oportunidad</th>
              <th class="py-3.5 px-4">Fase</th>
              <th class="py-3.5 px-4">Valor Estimado</th>
              <th class="py-3.5 px-4">Cliente</th>
              <th class="py-3.5 px-4">Propiedad</th>
              <th class="py-3.5 px-4">Asesor</th>
              <th class="py-3.5 px-4">Fecha Cierre</th>
              <th class="py-3.5 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
            ${deals.length === 0 ? `
              <tr>
                <td colspan="8" class="py-8 text-center text-slate-400">No hay oportunidades que coincidan con los filtros.</td>
              </tr>
            ` : deals.map(deal => {
              const contact = contacts.find(c => c.id === deal.contactId);
              const property = properties.find(p => p.id === deal.propertyId);
              const agent = agents.find(a => a.id === deal.agentId);
              const stageObj = STAGES.find(s => s.id === deal.stage) || { name: deal.stage, badge: 'bg-slate-100 text-slate-600' };

              return `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <td class="py-3.5 px-4">
                    <div class="font-bold text-slate-900 dark:text-white">${escapeHTML(deal.title)}</div>
                    <div class="text-[11px] text-slate-400">${deal.priority || 'Normal'} prioridad</div>
                  </td>
                  <td class="py-3.5 px-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${stageObj.badge}">
                      ${stageObj.name}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 font-bold text-blue-600 dark:text-blue-400">
                    ${formatCurrency(deal.amount, settings.currency)}
                  </td>
                  <td class="py-3.5 px-4">
                    ${contact ? `
                      <div class="font-medium text-slate-800 dark:text-slate-200">${escapeHTML(contact.name)}</div>
                      <div class="text-[11px] text-slate-400">${contact.phone || ''}</div>
                    ` : '<span class="text-slate-400">N/A</span>'}
                  </td>
                  <td class="py-3.5 px-4">
                    ${property ? `
                      <div class="font-medium text-slate-800 dark:text-slate-200">${escapeHTML(property.code)}</div>
                      <div class="text-[11px] text-slate-400 truncate max-w-[150px]">${escapeHTML(property.title)}</div>
                    ` : '<span class="text-slate-400">Sin propiedad</span>'}
                  </td>
                  <td class="py-3.5 px-4">
                    ${agent ? `
                      <div class="flex items-center gap-1.5">
                        <img src="${agent.avatar}" class="w-5 h-5 rounded-full object-cover">
                        <span>${escapeHTML(agent.name)}</span>
                      </div>
                    ` : '<span class="text-slate-400">Sin asignar</span>'}
                  </td>
                  <td class="py-3.5 px-4 text-slate-500">
                    ${deal.expectedCloseDate || 'Pendiente'}
                  </td>
                  <td class="py-3.5 px-4 text-right">
                    <button class="btn-edit-deal text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors" data-deal-id="${deal.id}">
                      Editar
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function attachPipelineEvents(containerId) {
  // Filtros
  const searchInput = document.getElementById('pipeline-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentFilter.search = e.target.value;
      renderPipeline(containerId);
    });
  }

  const agentSelect = document.getElementById('pipeline-agent-filter');
  if (agentSelect) {
    agentSelect.addEventListener('change', (e) => {
      currentFilter.agentId = e.target.value;
      renderPipeline(containerId);
    });
  }

  const prioritySelect = document.getElementById('pipeline-priority-filter');
  if (prioritySelect) {
    prioritySelect.addEventListener('change', (e) => {
      currentFilter.priority = e.target.value;
      renderPipeline(containerId);
    });
  }

  // Toggle vistas
  const btnKanban = document.getElementById('btn-view-kanban');
  const btnList = document.getElementById('btn-view-list');
  if (btnKanban) {
    btnKanban.addEventListener('click', () => {
      currentFilter.view = 'kanban';
      renderPipeline(containerId);
    });
  }
  if (btnList) {
    btnList.addEventListener('click', () => {
      currentFilter.view = 'list';
      renderPipeline(containerId);
    });
  }

  // Botón nueva oportunidad
  const btnNewDeal = document.getElementById('btn-new-deal');
  if (btnNewDeal) {
    btnNewDeal.addEventListener('click', () => {
      openDealModal(null, containerId);
    });
  }

  // Botones editar oportunidad
  document.querySelectorAll('.btn-edit-deal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const dealId = btn.getAttribute('data-deal-id');
      openDealModal(dealId, containerId);
    });
  });

  // DRAG & DROP HTML5
  if (currentFilter.view === 'kanban') {
    const cards = document.querySelectorAll('.kanban-card');
    const columns = document.querySelectorAll('.kanban-column');

    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', card.getAttribute('data-deal-id'));
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
      });
    });

    columns.forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        col.classList.add('drag-over');
      });

      col.addEventListener('dragleave', () => {
        col.classList.remove('drag-over');
      });

      col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.classList.remove('drag-over');
        const dealId = e.dataTransfer.getData('text/plain');
        const newStage = col.getAttribute('data-stage');

        if (dealId && newStage) {
          store.updateDealStage(dealId, newStage);

          // Si la fase es ganada, disparar confetti de celebración
          if (newStage === 'ganada' && window.confetti) {
            window.confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
          }

          renderPipeline(containerId);
        }
      });
    });
  }
}

export function openDealModal(dealId = null, containerId = 'content-area') {
  const modalContainer = document.getElementById('modal-deal-container');
  if (!modalContainer) return;

  const deal = dealId ? store.getDeal(dealId) : null;
  const contacts = store.getContacts();
  const properties = store.getProperties();
  const agents = store.getAgents();

  modalContainer.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 modal-backdrop">
      <div class="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 modal-content-anim relative">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">
            ${deal ? 'Editar Oportunidad' : 'Nueva Oportunidad Inmobiliaria'}
          </h3>
          <button id="modal-deal-close" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="form-deal" class="mt-4 space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Título del Negocio *</label>
            <input 
              type="text" 
              name="title" 
              required
              value="${deal ? escapeHTML(deal.title) : ''}"
              placeholder="Ej. Venta Apartamento El Poblado"
              class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Cliente / Contacto</label>
              <select name="contactId" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Seleccionar cliente...</option>
                ${contacts.map(c => `<option value="${c.id}" ${deal && deal.contactId === c.id ? 'selected' : ''}>${escapeHTML(c.name)}</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Inmueble Vinculado</label>
              <select name="propertyId" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Ninguno / Por definir...</option>
                ${properties.map(p => `<option value="${p.id}" ${deal && deal.propertyId === p.id ? 'selected' : ''}>${escapeHTML(p.code)} - ${escapeHTML(p.title)}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Valor del Negocio ($) *</label>
              <input 
                type="number" 
                name="amount" 
                required
                min="0"
                value="${deal ? deal.amount : ''}"
                placeholder="Ej. 650000000"
                class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fase del Embudo</label>
              <select name="stage" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                ${STAGES.map(s => `<option value="${s.id}" ${deal && deal.stage === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Asesor Asignado</label>
              <select name="agentId" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                ${agents.map(a => `<option value="${a.id}" ${deal && deal.agentId === a.id ? 'selected' : ''}>${escapeHTML(a.name)}</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Prioridad</label>
              <select name="priority" class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Alta" ${deal && deal.priority === 'Alta' ? 'selected' : ''}>Alta</option>
                <option value="Media" ${!deal || deal.priority === 'Media' ? 'selected' : ''}>Media</option>
                <option value="Baja" ${deal && deal.priority === 'Baja' ? 'selected' : ''}>Baja</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Cierre Estimado</label>
              <input 
                type="date" 
                name="expectedCloseDate" 
                value="${deal && deal.expectedCloseDate ? deal.expectedCloseDate : ''}"
                class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Notas y Seguimiento</label>
            <textarea 
              name="notes" 
              rows="3" 
              placeholder="Detalles sobre ofertas, requerimientos o compromisos acordados..."
              class="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >${deal ? escapeHTML(deal.notes || '') : ''}</textarea>
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
            ${deal ? `
              <button type="button" id="btn-delete-deal" class="text-xs font-semibold text-rose-600 hover:text-rose-700">
                Eliminar
              </button>
            ` : '<span></span>'}

            <div class="flex items-center gap-2">
              <button type="button" id="btn-cancel-deal" class="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200">
                Cancelar
              </button>
              <button type="submit" class="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                Guardar Oportunidad
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  const closeBtn = document.getElementById('modal-deal-close');
  const cancelBtn = document.getElementById('btn-cancel-deal');
  const deleteBtn = document.getElementById('btn-delete-deal');
  const form = document.getElementById('form-deal');

  const closeModal = () => { modalContainer.innerHTML = ''; };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  if (deleteBtn && dealId) {
    deleteBtn.addEventListener('click', () => {
      if (confirm('¿Estás seguro de eliminar esta oportunidad?')) {
        store.deleteDeal(dealId);
        closeModal();
        renderPipeline(containerId);
      }
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);

      const dealData = {
        id: dealId || generateId('deal'),
        title: formData.get('title'),
        contactId: formData.get('contactId') || null,
        propertyId: formData.get('propertyId') || null,
        amount: Number(formData.get('amount')) || 0,
        stage: formData.get('stage') || 'prospecto',
        agentId: formData.get('agentId') || null,
        priority: formData.get('priority') || 'Media',
        expectedCloseDate: formData.get('expectedCloseDate') || null,
        notes: formData.get('notes') || '',
        commissionExpected: (Number(formData.get('amount')) || 0) * 0.03
      };

      if (dealData.stage === 'ganada') {
        store.updateDealStage(dealData.id, 'ganada');
      } else {
        store.saveDeal(dealData);
      }

      closeModal();
      renderPipeline(containerId);
    });
  }
}
