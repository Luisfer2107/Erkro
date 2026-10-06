/**
 * Componente Reporte Ejecutivo de Crecimiento y Ventas Año vs Año (YoY)
 * Responde con exactitud matemática y visual: ¿Estoy vendiendo más que el año anterior? ¿Estoy creciendo?
 */

import { store } from '../store.js';
import { formatCurrency, escapeHTML } from '../utils/formatters.js';
import { exportToCSV } from '../utils/export.js';

export function renderReports(containerId = 'content-area', currentYear = 2026, previousYear = 2025) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const metrics = store.getYoYMetrics(currentYear, previousYear);
  const settings = store.getSettings();
  const availableYears = store.getAvailableYears();
  const deals = store.getDeals();

  const isGrowing = metrics.salesGrowth >= 0;

  container.innerHTML = `
    <div class="space-y-6">
      <!-- HEADER CON SELECTORES Y EXPORTACIÓN -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm no-print">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Reporte de Crecimiento YoY</h1>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full ${isGrowing ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
              ${isGrowing ? 'En Crecimiento' : 'Por Debajo'}
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Análisis comparativo de volumen de facturación y eficiencia comercial
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Comparativa de años -->
          <div class="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <select id="report-curr-year" class="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none">
              ${availableYears.map(y => `<option value="${y}" ${y === metrics.currentYear ? 'selected' : ''}>${y}</option>`).join('')}
            </select>
            <span class="text-slate-400">vs</span>
            <select id="report-prev-year" class="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none">
              ${availableYears.map(y => `<option value="${y}" ${y === metrics.previousYear ? 'selected' : ''}>${y}</option>`).join('')}
            </select>
          </div>

          <!-- Botón Exportar CSV / Excel -->
          <button id="btn-export-csv" class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors">
            <i data-lucide="file-spreadsheet" class="w-4 h-4 text-emerald-600"></i> Descargar Excel
          </button>

          <!-- Botón Imprimir PDF -->
          <button onclick="window.print()" class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors">
            <i data-lucide="printer" class="w-4 h-4"></i> Imprimir Informe
          </button>
        </div>
      </div>

      <!-- INFORME EJECUTIVO IMPRIMIBLE -->
      <div id="printable-report" class="space-y-6">
        <!-- Tarjeta de Veredicto Principal -->
        <div class="p-6 rounded-2xl border ${isGrowing ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' : 'bg-rose-50/50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800'}">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span class="text-xs font-extrabold uppercase tracking-wider ${isGrowing ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}">
                Diagnóstico de Rendimiento Comercial
              </span>
              <h2 class="text-2xl font-black text-slate-900 dark:text-white mt-1">
                ${isGrowing 
                  ? `¡Felicidades! La inmobiliaria está vendiendo un ${metrics.salesGrowth.toFixed(1)}% MÁS que en ${metrics.previousYear}`
                  : `Atención: El volumen de ventas se encuentra un ${Math.abs(metrics.salesGrowth).toFixed(1)}% por debajo de ${metrics.previousYear}`
                }
              </h2>
              <p class="text-xs text-slate-600 dark:text-slate-300 mt-2 max-w-3xl leading-relaxed">
                Durante el periodo analizado de ${metrics.currentYear}, se han generado <strong>${formatCurrency(metrics.currentSales, settings.currency)}</strong> en cierres inmobiliarios efectivos a través de <strong>${metrics.currentUnits} transacciones</strong>, comparado con <strong>${formatCurrency(metrics.previousSales, settings.currency)}</strong> y <strong>${metrics.previousUnits} transacciones</strong> en ${metrics.previousYear}.
              </p>
            </div>

            <div class="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-center shrink-0 min-w-[180px]">
              <span class="text-[11px] font-semibold text-slate-400 uppercase">Crecimiento Neto</span>
              <div class="text-3xl font-black ${isGrowing ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} mt-0.5">
                ${isGrowing ? '+' : ''}${metrics.salesGrowth.toFixed(1)}%
              </div>
              <span class="text-xs font-bold text-slate-500 mt-1 block">
                ${isGrowing ? '+' : ''}${formatCurrency(metrics.currentSales - metrics.previousSales, settings.currency)}
              </span>
            </div>
          </div>
        </div>

        <!-- 3 Factores Clave del Crecimiento -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span class="text-xs text-slate-400 font-bold uppercase">1. Volumen de Transacciones</span>
            <div class="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              ${metrics.currentUnits} vs ${metrics.previousUnits} propiedades
            </div>
            <div class="text-xs font-semibold mt-1 ${metrics.unitsGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}">
              ${metrics.unitsGrowth >= 0 ? '+' : ''}${metrics.unitsGrowth.toFixed(1)}% en cantidad de cierres
            </div>
          </div>

          <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span class="text-xs text-slate-400 font-bold uppercase">2. Ticket Promedio de Venta</span>
            <div class="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              ${formatCurrency(metrics.currentTicket, settings.currency)}
            </div>
            <div class="text-xs font-semibold mt-1 ${metrics.ticketGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}">
              ${metrics.ticketGrowth >= 0 ? '+' : ''}${metrics.ticketGrowth.toFixed(1)}% vs ticket en ${metrics.previousYear}
            </div>
          </div>

          <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span class="text-xs text-slate-400 font-bold uppercase">3. Comisiones Recaudadas</span>
            <div class="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              ${formatCurrency(metrics.currentCommissions, settings.currency)}
            </div>
            <div class="text-xs font-semibold mt-1 ${metrics.commissionsGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}">
              ${metrics.commissionsGrowth >= 0 ? '+' : ''}${metrics.commissionsGrowth.toFixed(1)}% en honorarios ganados
            </div>
          </div>
        </div>

        <!-- TABLA COMPARATIVA MES A MES (ENERO A DICIEMBRE) -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div class="p-5 border-b border-slate-100 dark:border-slate-700">
            <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i data-lucide="calendar" class="w-4 h-4 text-blue-600"></i> Desglose Detallado Mes a Mes
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">
              Comparación mensual directa entre las ventas registradas en ${metrics.currentYear} y ${metrics.previousYear}
            </p>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead class="bg-slate-50 dark:bg-slate-900/60 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th class="py-3 px-4">Mes</th>
                  <th class="py-3 px-4 text-right">Ventas ${metrics.currentYear}</th>
                  <th class="py-3 px-4 text-right">Ventas ${metrics.previousYear}</th>
                  <th class="py-3 px-4 text-right">Diferencia Neta</th>
                  <th class="py-3 px-4 text-right">% Crecimiento</th>
                  <th class="py-3 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
                ${metrics.monthlyComparison.map(row => {
                  const mGrowing = row.difference >= 0;
                  return `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td class="py-3 px-4 font-bold text-slate-900 dark:text-white">${row.monthName}</td>
                      <td class="py-3 px-4 text-right font-bold text-blue-600 dark:text-blue-400">
                        ${formatCurrency(row.currentYearAmount, settings.currency)}
                      </td>
                      <td class="py-3 px-4 text-right text-slate-500 dark:text-slate-400">
                        ${formatCurrency(row.previousYearAmount, settings.currency)}
                      </td>
                      <td class="py-3 px-4 text-right font-semibold ${mGrowing ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">
                        ${mGrowing ? '+' : ''}${formatCurrency(row.difference, settings.currency)}
                      </td>
                      <td class="py-3 px-4 text-right font-bold ${mGrowing ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">
                        ${mGrowing ? '+' : ''}${row.growthPct.toFixed(1)}%
                      </td>
                      <td class="py-3 px-4 text-center">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.currentYearAmount === 0 && row.previousYearAmount === 0
                            ? 'bg-slate-100 text-slate-500'
                            : mGrowing 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                        }">
                          ${row.currentYearAmount === 0 && row.previousYearAmount === 0 ? 'Sin datos' : (mGrowing ? 'Superado' : 'Inferior')}
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
              <tfoot class="bg-slate-50 dark:bg-slate-900/80 font-bold border-t-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                <tr>
                  <td class="py-3 px-4 uppercase text-[11px]">Total Acumulado</td>
                  <td class="py-3 px-4 text-right text-blue-600 dark:text-blue-400">${formatCurrency(metrics.currentSales, settings.currency)}</td>
                  <td class="py-3 px-4 text-right">${formatCurrency(metrics.previousSales, settings.currency)}</td>
                  <td class="py-3 px-4 text-right ${isGrowing ? 'text-emerald-600' : 'text-rose-600'}">
                    ${isGrowing ? '+' : ''}${formatCurrency(metrics.currentSales - metrics.previousSales, settings.currency)}
                  </td>
                  <td class="py-3 px-4 text-right ${isGrowing ? 'text-emerald-600' : 'text-rose-600'}">
                    ${isGrowing ? '+' : ''}${metrics.salesGrowth.toFixed(1)}%
                  </td>
                  <td class="py-3 px-4 text-center">
                    <span class="text-[11px] font-black ${isGrowing ? 'text-emerald-600' : 'text-rose-600'}">
                      ${isGrowing ? 'CRECIENDO' : 'DECRECIENDO'}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Listeners de los selectores de año
  const currSelect = document.getElementById('report-curr-year');
  const prevSelect = document.getElementById('report-prev-year');

  if (currSelect) {
    currSelect.addEventListener('change', (e) => {
      renderReports(containerId, Number(e.target.value), Number(prevSelect.value));
    });
  }

  if (prevSelect) {
    prevSelect.addEventListener('change', (e) => {
      renderReports(containerId, Number(currSelect.value), Number(e.target.value));
    });
  }

  // Exportar Excel
  const btnExport = document.getElementById('btn-export-csv');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const exportRows = metrics.monthlyComparison.map(m => ({
        Mes: m.monthName,
        [`Ventas_${metrics.currentYear}`]: m.currentYearAmount,
        [`Ventas_${metrics.previousYear}`]: m.previousYearAmount,
        Diferencia_Neta: m.difference,
        Porcentaje_Crecimiento: m.growthPct.toFixed(2) + '%'
      }));

      exportToCSV(exportRows, `Reporte_Crecimiento_Inmobiliaria_Erkro_${metrics.currentYear}_vs_${metrics.previousYear}.csv`);
    });
  }
}
