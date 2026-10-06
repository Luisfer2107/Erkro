/**
 * Componente Herramientas Comerciales Inmobiliarias (Erkro CRM)
 * Incluye Calculadora Hipotecaria para clientes, Simulador de Comisiones y Plantillas de WhatsApp.
 */

import { store } from '../store.js';
import { formatCurrency, escapeHTML } from '../utils/formatters.js';

export function renderTools(containerId = 'content-area') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const settings = store.getSettings();

  container.innerHTML = `
    <div class="space-y-6">
      <!-- HEADER -->
      <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Herramientas Comerciales</h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Calculadoras y generadores para agilizar el cierre con clientes compradores e inversionistas
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 1. CALCULADORA DE CRÉDITO HIPOTECARIO -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-700">
              <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <i data-lucide="calculator" class="w-4 h-4"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">Calculadora Hipotecaria</h3>
                <p class="text-[11px] text-slate-400">Simulación de cuota mensual y financiación bancaria</p>
              </div>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Valor del Inmueble ($)</label>
                <input type="number" id="calc-prop-price" value="650000000" step="5000000" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold">
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Cuota Inicial (%)</label>
                  <input type="number" id="calc-down-pct" value="30" min="10" max="90" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Plazo (Años)</label>
                  <input type="number" id="calc-years" value="20" min="5" max="30" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
                </div>
              </div>

              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tasa Efectiva Anual (E.A. %)</label>
                <input type="number" id="calc-rate-ea" value="12.5" step="0.1" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
              </div>
            </div>

            <!-- RESULTADOS CÁLCULO -->
            <div class="mt-4 p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 space-y-2 text-xs">
              <div class="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Cuota Inicial (30%):</span>
                <span id="res-down-payment" class="font-bold text-slate-900 dark:text-white">$ 195.000.000</span>
              </div>
              <div class="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Monto a Financiar (70%):</span>
                <span id="res-loan-amount" class="font-bold text-slate-900 dark:text-white">$ 455.000.000</span>
              </div>
              <div class="pt-2 border-t border-blue-200 dark:border-blue-800 flex items-center justify-between">
                <span class="font-bold text-blue-900 dark:text-blue-200">Cuota Mensual Aprox:</span>
                <span id="res-monthly-payment" class="text-base font-extrabold text-blue-700 dark:text-blue-300">$ 4.980.000</span>
              </div>
            </div>
          </div>

          <button id="btn-copy-calc" class="mt-4 inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors">
            <i data-lucide="copy" class="w-3.5 h-3.5"></i> Copiar Simulación para WhatsApp
          </button>
        </div>

        <!-- 2. SIMULADOR DE COMISIONES INMOBILIARIAS -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-700">
              <div class="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <i data-lucide="percent" class="w-4 h-4"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">Simulador de Comisiones</h3>
                <p class="text-[11px] text-slate-400">Cálculo de honorarios y distribución asesor / agencia</p>
              </div>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Precio Acordado de Venta ($)</label>
                <input type="number" id="comm-price" value="850000000" step="5000000" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold">
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">% Comisión Agencia</label>
                  <select id="comm-pct" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
                    <option value="3.0">3.0% (Residencial Urbano)</option>
                    <option value="4.0">4.0% (Comercial / Preventa)</option>
                    <option value="5.0">5.0% (Campestre / Lotes)</option>
                  </select>
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">% Asesor Captador/Cerrador</label>
                  <select id="comm-agent-split" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white">
                    <option value="50">50% para el Asesor</option>
                    <option value="40">40% para el Asesor</option>
                    <option value="60">60% para el Asesor</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- RESULTADOS COMISIÓN -->
            <div class="mt-4 p-4 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/50 space-y-2 text-xs">
              <div class="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Honorario Total Inmobiliaria:</span>
                <span id="res-comm-total" class="font-bold text-teal-700 dark:text-teal-300 text-sm">$ 25.500.000</span>
              </div>
              <div class="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Ingreso Neto Agencia:</span>
                <span id="res-comm-agency" class="font-bold text-slate-900 dark:text-white">$ 12.750.000</span>
              </div>
              <div class="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Comisión para el Asesor:</span>
                <span id="res-comm-agent" class="font-bold text-slate-900 dark:text-white">$ 12.750.000</span>
              </div>
            </div>
          </div>

          <div class="mt-4 text-[11px] text-slate-400 text-center">
            * Nota: Los valores son calculados antes de retenciones tributarias.
          </div>
        </div>
      </div>

      <!-- 3. PLANTILLAS RÁPIDAS PARA WHATSAPP -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div class="pb-3 mb-4 border-b border-slate-100 dark:border-slate-700">
          <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <i data-lucide="message-square" class="w-4 h-4 text-emerald-600"></i> Plantillas Inmobiliarias para WhatsApp
          </h3>
          <p class="text-xs text-slate-500">Copia con un clic mensajes profesionales listos para enviar a prospectos</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <span class="font-bold text-slate-900 dark:text-white block mb-1">1. Primer Contacto</span>
              <p class="text-slate-500 italic mb-3">"Hola [Nombre], te saluda [Asesor] de Inmobiliaria Erkro. Vi que solicitaste información sobre nuestras propiedades. ¿Tienes un minuto para contarte los detalles?"</p>
            </div>
            <button class="btn-copy-template px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100" data-text="Hola, te saluda Inmobiliaria Erkro. Vi que solicitaste información sobre nuestras propiedades disponibles. ¿Tienes unos minutos para conversar y ayudarte a encontrar la opción ideal?">
              Copiar Mensaje
            </button>
          </div>

          <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <span class="font-bold text-slate-900 dark:text-white block mb-1">2. Confirmar Visita</span>
              <p class="text-slate-500 italic mb-3">"Hola [Nombre], te confirmamos la visita agendada para el inmueble [Código] el día [Fecha] a las [Hora]. Te comparto la ubicación exacta."</p>
            </div>
            <button class="btn-copy-template px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100" data-text="Hola, te confirmamos la visita agendada a la propiedad. Por favor confírmanos si la hora te sigue quedando perfecta para que nuestro asesor esté esperándote puntualmente en la portería.">
              Copiar Mensaje
            </button>
          </div>

          <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <span class="font-bold text-slate-900 dark:text-white block mb-1">3. Seguimiento Post-Visita</span>
              <p class="text-slate-500 italic mb-3">"Hola [Nombre], ¿cómo te sentiste en la visita a la propiedad? ¿Te gustaría que preparemos una propuesta formal para presentarle al propietario?"</p>
            </div>
            <button class="btn-copy-template px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100" data-text="Hola, fue un gusto acompañarte en la visita. ¿Qué te pareció el inmueble? Si deseas podemos coordinar una oferta económica formal con el propietario para asegurar el precio.">
              Copiar Mensaje
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  setupCalculatorLogic();
}

function setupCalculatorLogic() {
  const priceInput = document.getElementById('calc-prop-price');
  const downPctInput = document.getElementById('calc-down-pct');
  const yearsInput = document.getElementById('calc-years');
  const rateEaInput = document.getElementById('calc-rate-ea');

  const updateMortgage = () => {
    const price = Number(priceInput.value) || 0;
    const downPct = Number(downPctInput.value) || 30;
    const years = Number(yearsInput.value) || 20;
    const rateEa = Number(rateEaInput.value) || 12.5;

    const downPayment = price * (downPct / 100);
    const loanAmount = price - downPayment;

    // Convertir tasa EA a tasa mensual efectiva aproximada
    const monthlyRate = Math.pow(1 + (rateEa / 100), 1 / 12) - 1;
    const totalMonths = years * 12;

    let monthlyPayment = 0;
    if (monthlyRate > 0 && totalMonths > 0) {
      monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }

    const resDown = document.getElementById('res-down-payment');
    const resLoan = document.getElementById('res-loan-amount');
    const resMonthly = document.getElementById('res-monthly-payment');

    if (resDown) resDown.innerText = formatCurrency(downPayment, 'COP');
    if (resLoan) resLoan.innerText = formatCurrency(loanAmount, 'COP');
    if (resMonthly) resMonthly.innerText = formatCurrency(monthlyPayment, 'COP');
  };

  [priceInput, downPctInput, yearsInput, rateEaInput].forEach(inp => {
    if (inp) inp.addEventListener('input', updateMortgage);
  });
  updateMortgage();

  // Copiar simulación
  const copyBtn = document.getElementById('btn-copy-calc');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const price = Number(priceInput.value) || 0;
      const downPayment = price * ((Number(downPctInput.value) || 30) / 100);
      const loanAmount = price - downPayment;
      const monthly = document.getElementById('res-monthly-payment').innerText;

      const text = `🏡 *Simulación de Crédito Hipotecario - Inmobiliaria Erkro*\n\n` +
        `• Valor Inmueble: ${formatCurrency(price, 'COP')}\n` +
        `• Cuota Inicial (${downPctInput.value}%): ${formatCurrency(downPayment, 'COP')}\n` +
        `• Monto Financiado: ${formatCurrency(loanAmount, 'COP')}\n` +
        `• Plazo: ${yearsInput.value} años\n` +
        `• Cuota Mensual Estimada: ${monthly}\n\n` +
        `_Simulación de referencia sujeta a políticas de la entidad bancaria._`;

      navigator.clipboard.writeText(text).then(() => {
        alert('¡Simulación copiada al portapapeles! Puedes pegarla en WhatsApp.');
      });
    });
  }

  // Lógica Comisiones
  const commPrice = document.getElementById('comm-price');
  const commPct = document.getElementById('comm-pct');
  const commSplit = document.getElementById('comm-agent-split');

  const updateCommission = () => {
    const price = Number(commPrice.value) || 0;
    const pct = Number(commPct.value) || 3.0;
    const split = Number(commSplit.value) || 50;

    const totalComm = price * (pct / 100);
    const agentComm = totalComm * (split / 100);
    const agencyComm = totalComm - agentComm;

    const resTot = document.getElementById('res-comm-total');
    const resAg = document.getElementById('res-comm-agency');
    const resAgt = document.getElementById('res-comm-agent');

    if (resTot) resTot.innerText = formatCurrency(totalComm, 'COP');
    if (resAg) resAg.innerText = formatCurrency(agencyComm, 'COP');
    if (resAgt) resAgt.innerText = formatCurrency(agentComm, 'COP');
  };

  [commPrice, commPct, commSplit].forEach(inp => {
    if (inp) inp.addEventListener('input', updateCommission);
  });
  updateCommission();

  // Copiar plantillas
  document.querySelectorAll('.btn-copy-template').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-text');
      navigator.clipboard.writeText(text).then(() => {
        alert('¡Plantilla copiada al portapapeles!');
      });
    });
  });
}
