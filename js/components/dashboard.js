/**
 * Componente Dashboard Ejecutivo y Métricas de Crecimiento YoY
 * Responde directamente a: ¿Estoy vendiendo más que el año anterior? ¿Estoy creciendo?
 */

import { store } from '../store.js';
import { formatCurrency, formatCompactCurrency, formatDate, escapeHTML } from '../utils/formatters.js';

let monthlyChartInstance = null;
let propertyTypeChartInstance = null;

export function renderDashboard(containerId = 'content-area', currentYear = 2026, previousYear = 2025) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const metrics = store.getYoYMetrics(currentYear, previousYear);
  const settings = store.getSettings();
  const availableYears = store.getAvailableYears();
  const visits = store.getVisits().filter(v => v.status === 'Programada').slice(0, 4);
  const properties = store.getProperties();
  const contacts = store.getContacts();

  // Determinación de crecimiento
  const isGrowing = metrics.salesGrowth >= 0;
  const growthBadgeClass = isGrowing 
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' 
    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800';
  const growthIcon = isGrowing ? 'lucide-trending-up' : 'lucide-trending-down';

  container.innerHTML = `
    <div class="space-y-6">
      <!-- HEADER CON SELECTORES DE AÑO & DIAGNÓSTICO DE CRECIMIENTO -->
      <div class="bg-gradient-to-r ${isGrowing ? 'from-slate-900 via-blue-950 to-indigo-950' : 'from-slate-900 via-slate-800 to-rose-950'} rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <!-- Decoración de fondo -->
        <div class="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
        <div class="absolute right-1/3 -top-10 w-52 h-52 rounded-full ${isGrowing ? 'bg-emerald-500/10' : 'bg-rose-500/10'} blur-2xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div class="space-y-2">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/10 backdrop-blur-md text-blue-200 border border-white/10">
              <i data-lucide="bar-chart-3" class="w-3.5 h-3.5"></i> Inteligencia Comercial Erkro
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Análisis de Crecimiento y Ventas
            </h1>
            <p class="text-slate-300 text-sm sm:text-base max-w-2xl">
              Monitorea el desempeño comercial de la inmobiliaria en tiempo real comparando el ejercicio actual frente a años anteriores.
            </p>
          </div>

          <!-- CONTROLES DE COMPARATIVA DE AÑO -->
          <div class="flex flex-wrap items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/15">
            <div class="flex flex-col">
              <label class="text-[11px] text-slate-300 font-medium uppercase tracking-wider mb-1">Año Actual</label>
              <select id="select-current-year" class="bg-slate-900/90 text-white text-sm font-semibold rounded-lg px-3 py-1.5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer">
                ${availableYears.map(y => `<option value="${y}" ${y === metrics.currentYear ? 'selected' : ''}>${y}</option>`).join('')}
              </select>
            </div>

            <div class="text-slate-400 font-bold text-sm pt-4">vs</div>

            <div class="flex flex-col">
              <label class="text-[11px] text-slate-300 font-medium uppercase tracking-wider mb-1">Año Comparativa</label>
              <select id="select-previous-year" class="bg-slate-900/90 text-white text-sm font-semibold rounded-lg px-3 py-1.5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer">
                ${availableYears.map(y => `<option value="${y}" ${y === metrics.previousYear ? 'selected' : ''}>${y}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- DIAGNÓSTICO EN TIEMPO REAL: ¿ESTOY VENDIENDO MÁS? -->
        <div class="mt-6 pt-6 border-t border-white/15 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white/10 rounded-xl p-4 border border-white/10 flex items-center justify-between">
            <div>
              <div class="text-xs text-slate-300 uppercase tracking-wider font-medium">¿Estás vendiendo más que en ${metrics.previousYear}?</div>
              <div class="text-xl sm:text-2xl font-bold mt-1 flex items-center gap-2 ${isGrowing ? 'text-emerald-400' : 'text-rose-400'}">
                <i data-lucide="${isGrowing ? 'check-circle-2' : 'alert-circle'}" class="w-6 h-6"></i>
                ${isGrowing ? 'SÍ, ESTÁS CRECIENDO' : 'NO, RITMO INFERIOR'}
              </div>
            </div>
            <div class="text-right">
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${isGrowing ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}">
                ${isGrowing ? '+' : ''}${metrics.salesGrowth.toFixed(1)}% YoY
              </span>
            </div>
          </div>

          <div class="bg-white/10 rounded-xl p-4 border border-white/10">
            <div class="text-xs text-slate-300 uppercase tracking-wider font-medium">Diferencia Neta en Ventas</div>
            <div class="text-xl sm:text-2xl font-bold mt-1 ${isGrowing ? 'text-emerald-300' : 'text-rose-300'}">
              ${isGrowing ? '+' : ''}${formatCurrency(metrics.currentSales - metrics.previousSales, settings.currency)}
            </div>
            <div class="text-xs text-slate-400 mt-0.5">
              ${formatCurrency(metrics.currentSales, settings.currency)} vs ${formatCurrency(metrics.previousSales, settings.currency)}
            </div>
          </div>

          <div class="bg-white/10 rounded-xl p-4 border border-white/10">
            <div class="text-xs text-slate-300 uppercase tracking-wider font-medium">Meta Anual de Ventas (${metrics.currentYear})</div>
            <div class="flex items-center justify-between mt-1">
              <span class="text-xl sm:text-2xl font-bold text-white">${metrics.goalAchievementPercent.toFixed(1)}%</span>
              <span class="text-xs text-slate-300">Meta: ${formatCompactCurrency(metrics.annualGoal, settings.currency)}</span>
            </div>
            <div class="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
              <div class="bg-blue-400 h-2 rounded-full transition-all duration-500" style="width: ${Math.min(metrics.goalAchievementPercent, 100)}%"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4 TARJETAS DE KPIS PRINCIPALES -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <!-- 1. Ventas Totales -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover-lift">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ventas Acumuladas</span>
            <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <i data-lucide="circle-dollar-sign" class="w-5 h-5"></i>
            </div>
          </div>
          <div class="mt-3">
            <div class="text-2xl font-bold text-slate-900 dark:text-white">
              ${formatCurrency(metrics.currentSales, settings.currency)}
            </div>
            <div class="mt-2 flex items-center gap-2">
              <span class="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${growthBadgeClass}">
                <i data-lucide="${growthIcon}" class="w-3 h-3"></i>
                ${isGrowing ? '+' : ''}${metrics.salesGrowth.toFixed(1)}%
              </span>
              <span class="text-xs text-slate-500 dark:text-slate-400">vs ${metrics.previousYear}</span>
            </div>
          </div>
        </div>

        <!-- 2. Unidades Vendidas -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover-lift">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Inmuebles Cerrados</span>
            <div class="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <i data-lucide="home" class="w-5 h-5"></i>
            </div>
          </div>
          <div class="mt-3">
            <div class="text-2xl font-bold text-slate-900 dark:text-white">
              ${metrics.currentUnits} <span class="text-sm font-normal text-slate-500">propiedades</span>
            </div>
            <div class="mt-2 flex items-center gap-2">
              <span class="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${metrics.unitsGrowth >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'}">
                <i data-lucide="${metrics.unitsGrowth >= 0 ? 'arrow-up-right' : 'arrow-down-right'}" class="w-3 h-3"></i>
                ${metrics.unitsGrowth >= 0 ? '+' : ''}${metrics.unitsGrowth.toFixed(1)}%
              </span>
              <span class="text-xs text-slate-500 dark:text-slate-400">(${metrics.previousUnits} en ${metrics.previousYear})</span>
            </div>
          </div>
        </div>

        <!-- 3. Ticket Promedio -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover-lift">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ticket Promedio</span>
            <div class="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <i data-lucide="receipt" class="w-5 h-5"></i>
            </div>
          </div>
          <div class="mt-3">
            <div class="text-2xl font-bold text-slate-900 dark:text-white">
              ${formatCurrency(metrics.currentTicket, settings.currency)}
            </div>
            <div class="mt-2 flex items-center gap-2">
              <span class="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${metrics.ticketGrowth >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'}">
                <i data-lucide="${metrics.ticketGrowth >= 0 ? 'trending-up' : 'trending-down'}" class="w-3 h-3"></i>
                ${metrics.ticketGrowth >= 0 ? '+' : ''}${metrics.ticketGrowth.toFixed(1)}%
              </span>
              <span class="text-xs text-slate-500 dark:text-slate-400">por propiedad</span>
            </div>
          </div>
        </div>

        <!-- 4. Pipeline Vivo / Oportunidades -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover-lift">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pipeline Activo</span>
            <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <i data-lucide="briefcase" class="w-5 h-5"></i>
            </div>
          </div>
          <div class="mt-3">
            <div class="text-2xl font-bold text-slate-900 dark:text-white">
              ${formatCurrency(metrics.pipelineActiveVolume, settings.currency)}
            </div>
            <div class="mt-2 flex items-center gap-2">
              <span class="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                En negociación
              </span>
              <span class="text-xs text-slate-500 dark:text-slate-400">oportunidades vivas</span>
            </div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN GRÁFICA: COMPARATIVA MES A MES & DISTRIBUCIÓN -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Gráfico Mes a Mes YoY -->
        <div class="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/60">
            <div>
              <h2 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <i data-lucide="line-chart" class="w-5 h-5 text-blue-600"></i>
                Ventas Mensuales: ${metrics.currentYear} vs ${metrics.previousYear}
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Comportamiento mes por mes para identificar picos de estacionalidad y crecimiento
              </p>
            </div>
            <div class="flex items-center gap-4 text-xs font-semibold">
              <span class="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <span class="w-3 h-3 rounded-sm bg-blue-600 inline-block"></span> ${metrics.currentYear}
              </span>
              <span class="flex items-center gap-1.5 text-slate-400">
                <span class="w-3 h-3 rounded-sm bg-slate-300 dark:bg-slate-600 inline-block"></span> ${metrics.previousYear}
              </span>
            </div>
          </div>

          <div class="mt-4 relative h-72 sm:h-80 w-full">
            <canvas id="chart-yoy-monthly"></canvas>
          </div>
        </div>

        <!-- Gráfico de Ventas por Tipo de Inmueble -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-700/60">
              <i data-lucide="pie-chart" class="w-5 h-5 text-teal-600"></i>
              Ventas por Inmueble
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Distribución de volumen cerrado en ${metrics.currentYear}
            </p>
            <div class="mt-4 relative h-56 w-full flex items-center justify-center">
              <canvas id="chart-property-type"></canvas>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60 space-y-2.5 text-xs">
            ${Object.entries(metrics.typeDistribution).map(([type, amount], idx) => {
              const colors = ['#2563eb', '#0d9488', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];
              const color = colors[idx % colors.length];
              const total = metrics.currentSales || 1;
              const pct = Math.round((amount / total) * 100);
              return `
                <div class="flex items-center justify-between text-slate-600 dark:text-slate-300 py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <span class="flex items-center gap-2.5 font-medium">
                    <span class="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm border border-white/60 dark:border-slate-700" style="background-color: ${color}"></span>
                    <span class="text-slate-800 dark:text-slate-200 font-bold">${escapeHTML(type)}</span>
                    <span class="text-[10px] text-slate-400 font-semibold">(${pct}%)</span>
                  </span>
                  <span class="font-black text-slate-900 dark:text-white">${formatCurrency(amount, settings.currency)}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- SECCIÓN EMBUDO DE CONVERSIÓN & ASESORES -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Embudo de Conversión de Ventas -->
        <div class="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60">
            <div>
              <h2 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <i data-lucide="filter" class="w-5 h-5 text-indigo-600"></i>
                Embudo Inmobiliario de Oportunidades
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Flujo de prospectos desde primer contacto hasta el cierre de venta
              </p>
            </div>
            <button onclick="window.router.navigate('pipeline')" class="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1">
              Ver Kanban <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <div class="mt-6 space-y-4">
            ${metrics.pipelineFunnel.filter(f => f.key !== 'perdida').map(stage => {
              const maxCount = Math.max(...metrics.pipelineFunnel.map(f => f.count), 1);
              const widthPct = Math.max((stage.count / maxCount) * 100, 12);
              return `
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${stage.color}"></span>
                      ${stage.label}
                    </span>
                    <div class="flex items-center gap-3">
                      <span class="text-slate-500 dark:text-slate-400 font-medium">${stage.count} oportunidades</span>
                      <span class="font-bold text-slate-900 dark:text-white">${formatCurrency(stage.totalAmount, settings.currency)}</span>
                    </div>
                  </div>
                  <div class="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-3 overflow-hidden">
                    <div class="h-3 rounded-full transition-all duration-500" style="width: ${widthPct}%; background-color: ${stage.color}"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Ranking de Asesores Inmobiliarios -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div class="pb-4 border-b border-slate-100 dark:border-slate-700/60">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i data-lucide="award" class="w-5 h-5 text-amber-500"></i>
              Top Asesores Comerciales
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Rendimiento de ventas en ${metrics.currentYear}
            </p>
          </div>

          <div class="mt-4 divide-y divide-slate-100 dark:divide-slate-700/60">
            ${metrics.agentRankings.map((agent, idx) => `
              <div class="py-3 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="relative">
                    <img src="${agent.avatar}" alt="${agent.name}" class="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700">
                    <span class="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-800">
                      ${idx + 1}
                    </span>
                  </div>
                  <div>
                    <div class="text-sm font-bold text-slate-900 dark:text-white">${escapeHTML(agent.name)}</div>
                    <div class="text-xs text-slate-500 dark:text-slate-400">${agent.units} cierres • ${agent.targetPercent.toFixed(0)}% de meta</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-xs font-bold text-slate-900 dark:text-white">${formatCurrency(agent.totalSales, settings.currency)}</div>
                  <div class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">+${formatCurrency(agent.commissions, settings.currency)} com.</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- PRÓXIMAS VISITAS AGENDADAS -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60">
          <div>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i data-lucide="calendar" class="w-5 h-5 text-teal-600"></i>
              Próximas Visitas Inmobiliarias
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Citas agendadas con clientes compradores e inversionistas
            </p>
          </div>
          <button onclick="window.router.navigate('visits')" class="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1">
            Ver Agenda Completa <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
          </button>
        </div>

        <div class="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          ${visits.length === 0 ? `
            <div class="col-span-full py-8 text-center text-slate-400 text-sm">
              No hay visitas pendientes agendadas.
            </div>
          ` : visits.map(v => {
            const prop = properties.find(p => p.id === v.propertyId);
            const cnt = contacts.find(c => c.id === v.contactId);
            return `
              <div class="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                      ${v.date} • ${v.time}
                    </span>
                    <span class="text-[11px] text-slate-400">${prop ? prop.code : ''}</span>
                  </div>
                  <h4 class="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">${prop ? escapeHTML(prop.title) : 'Propiedad'}</h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <i data-lucide="user" class="w-3 h-3"></i> ${cnt ? escapeHTML(cnt.name) : 'Cliente'}
                  </p>
                </div>
                ${cnt && cnt.whatsapp ? `
                  <a href="https://wa.me/${cnt.whatsapp}?text=Hola%20${encodeURIComponent(cnt.name)},%20te%20contacto%20de%20Inmobiliaria%20Erkro%20para%20confirmar%20nuestra%20visita%20del%20${v.date}" target="_blank" class="mt-3 inline-flex items-center justify-center gap-1.5 w-full text-xs font-semibold py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
                    <i data-lucide="message-circle" class="w-3.5 h-3.5"></i> Confirmar WhatsApp
                  </a>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  // Inicializar Iconos Lucide
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Event Listeners para selector de años
  const selectCurr = document.getElementById('select-current-year');
  const selectPrev = document.getElementById('select-previous-year');

  if (selectCurr) {
    selectCurr.addEventListener('change', (e) => {
      renderDashboard(containerId, Number(e.target.value), Number(selectPrev.value));
    });
  }

  if (selectPrev) {
    selectPrev.addEventListener('change', (e) => {
      renderDashboard(containerId, Number(selectCurr.value), Number(e.target.value));
    });
  }

  // Inicializar Gráficos con Chart.js
  initMonthlyChart(metrics);
  initPropertyTypeChart(metrics);
}

function initMonthlyChart(metrics) {
  const canvas = document.getElementById('chart-yoy-monthly');
  if (!canvas || !window.Chart) return;

  if (monthlyChartInstance) {
    monthlyChartInstance.destroy();
  }

  const isDark = document.documentElement.classList.contains('dark');
  const labels = metrics.monthlyComparison.map(m => m.monthName);
  const currentData = metrics.monthlyComparison.map(m => m.currentYearAmount);
  const previousData = metrics.monthlyComparison.map(m => m.previousYearAmount);

  monthlyChartInstance = new window.Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: `Ventas ${metrics.currentYear}`,
          data: currentData,
          backgroundColor: '#2563eb',
          borderRadius: 6,
          barPercentage: 0.6,
          categoryPercentage: 0.8
        },
        {
          label: `Ventas ${metrics.previousYear}`,
          data: previousData,
          backgroundColor: isDark ? '#475569' : '#cbd5e1',
          borderRadius: 6,
          barPercentage: 0.6,
          categoryPercentage: 0.8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const val = context.parsed.y || 0;
              return `${context.dataset.label}: $ ${val.toLocaleString('es-CO')}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 11 } }
        },
        y: {
          grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
          ticks: {
            color: isDark ? '#94a3b8' : '#64748b',
            font: { size: 10 },
            callback: function(value) {
              if (value >= 1000000000) return (value / 1000000000).toFixed(1) + 'B';
              if (value >= 1000000) return (value / 1000000).toFixed(0) + 'M';
              return value;
            }
          }
        }
      }
    }
  });
}

function initPropertyTypeChart(metrics) {
  const canvas = document.getElementById('chart-property-type');
  if (!canvas || !window.Chart) return;

  if (propertyTypeChartInstance) {
    propertyTypeChartInstance.destroy();
  }

  const isDark = document.documentElement.classList.contains('dark');
  const labels = Object.keys(metrics.typeDistribution);
  const data = Object.values(metrics.typeDistribution);

  const colors = ['#2563eb', '#0d9488', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

  propertyTypeChartInstance = new window.Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: isDark ? '#1e293b' : '#ffffff'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const val = context.parsed || 0;
              return `${context.label}: $ ${val.toLocaleString('es-CO')}`;
            }
          }
        }
      }
    }
  });
}
