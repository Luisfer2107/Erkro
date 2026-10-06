/**
 * Aplicación Principal y Enrutador SPA para Erkro CRM Inmobiliario
 */

import { store } from './store.js';
import { renderDashboard } from './components/dashboard.js';
import { renderPipeline } from './components/pipeline.js';
import { renderProperties } from './components/properties.js';
import { renderContacts } from './components/contacts.js';
import { renderVisits } from './components/visits.js';
import { renderReports } from './components/reports.js';
import { renderTools } from './components/tools.js';
import { exportToJSON, importFromJSON } from './utils/export.js';

class AppRouter {
  constructor() {
    this.currentRoute = 'dashboard';
    this.routes = {
      dashboard: renderDashboard,
      pipeline: renderPipeline,
      properties: renderProperties,
      contacts: renderContacts,
      visits: renderVisits,
      reports: renderReports,
      tools: renderTools
    };
  }

  init() {
    // Escuchar cambios de hash si los hay
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      this.navigate(hash, false);
    });

    const initialHash = window.location.hash.replace('#', '') || 'dashboard';
    this.navigate(initialHash, true);
    this.setupTheme();
    this.setupGlobalEvents();
  }

  navigate(routeName, updateHash = true) {
    if (!this.routes[routeName]) {
      routeName = 'dashboard';
    }

    this.currentRoute = routeName;
    if (updateHash) {
      window.location.hash = routeName;
    }

    // Actualizar estilos activos en el Sidebar
    document.querySelectorAll('.nav-link').forEach(link => {
      const target = link.getAttribute('data-route');
      if (target === routeName) {
        link.classList.add('bg-blue-600', 'text-white', 'shadow-md');
        link.classList.remove('text-slate-600', 'dark:text-slate-300', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
      } else {
        link.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
        link.classList.add('text-slate-600', 'dark:text-slate-300', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
      }
    });

    // Renderizar componente en content-area
    const renderFn = this.routes[routeName];
    if (renderFn) {
      renderFn('content-area');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Cerrar sidebar en pantallas móviles tras hacer clic
    const sidebar = document.getElementById('sidebar');
    if (sidebar && !sidebar.classList.contains('-translate-x-full') && window.innerWidth < 1024) {
      sidebar.classList.add('-translate-x-full');
    }
  }

  setupTheme() {
    const isDark = localStorage.getItem('erkro_theme') === 'dark' ||
      (!('erkro_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const themeBtn = document.getElementById('btn-toggle-theme');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const currentDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('erkro_theme', currentDark ? 'dark' : 'light');

        // Re-renderizar la vista activa para actualizar colores de gráficos si aplica
        this.navigate(this.currentRoute, false);
      });
    }
  }

  setupGlobalEvents() {
    // Toggle Mobile Sidebar
    const toggleSidebarBtn = document.getElementById('btn-toggle-sidebar');
    const sidebar = document.getElementById('sidebar');
    if (toggleSidebarBtn && sidebar) {
      toggleSidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full');
      });
    }

    // Enlaces de navegación del sidebar
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const route = link.getAttribute('data-route');
        if (route) this.navigate(route);
      });
    });

    // Modal de Respaldo / Configuración
    const btnBackup = document.getElementById('btn-open-backup');
    if (btnBackup) {
      btnBackup.addEventListener('click', () => this.openBackupModal());
    }
  }

  openBackupModal() {
    const modalContainer = document.getElementById('global-modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 modal-backdrop">
        <div class="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 modal-content-anim relative">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
            <h3 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i data-lucide="database" class="w-5 h-5 text-blue-600"></i> Copia de Seguridad & Migración
            </h3>
            <button id="modal-backup-close" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="mt-4 space-y-4 text-xs">
            <p class="text-slate-600 dark:text-slate-300 leading-relaxed">
              Tus datos están guardados localmente en tu navegador. Puedes exportar una copia completa en formato JSON para respaldar o para trasladar tu CRM a Hostinger o cualquier otro servidor.
            </p>

            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <span class="font-bold text-slate-900 dark:text-white block">Descargar Respaldo JSON</span>
                  <span class="text-slate-400">Guarda todas las ventas, contactos y propiedades en un archivo.</span>
                </div>
                <button id="btn-do-export" class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  Exportar
                </button>
              </div>

              <div class="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span class="font-bold text-slate-900 dark:text-white block">Restaurar Respaldo</span>
                  <span class="text-slate-400">Carga un archivo JSON previamente exportado.</span>
                </div>
                <label class="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold cursor-pointer">
                  Importar
                  <input type="file" id="file-import-json" accept=".json" class="hidden">
                </label>
              </div>

              <div class="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span class="font-bold text-rose-600 block">Restablecer Datos de Demostración</span>
                  <span class="text-slate-400">Reinicia los datos a los valores iniciales de prueba (2025 y 2026).</span>
                </div>
                <button id="btn-do-reset" class="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold">
                  Reiniciar
                </button>
              </div>
            </div>

            <!-- Información para Hostinger -->
            <div class="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
              <span class="font-bold text-blue-900 dark:text-blue-300 block mb-1">🚀 Listo para GitHub y Hostinger</span>
              <p class="text-slate-600 dark:text-slate-300">
                Este CRM funciona 100% de manera estática para <strong>GitHub Pages</strong> y es compatible con el Administrador de Archivos de <strong>Hostinger</strong>. En la carpeta <code>/hostinger</code> encontrarás el script MySQL y PHP opcional si deseas base de datos en línea.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    const closeBtn = document.getElementById('modal-backup-close');
    const closeModal = () => { modalContainer.innerHTML = ''; };
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    const exportBtn = document.getElementById('btn-do-export');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        exportToJSON(store.state, `Erkro_CRM_Backup_${new Date().toISOString().split('T')[0]}.json`);
      });
    }

    const importInput = document.getElementById('file-import-json');
    if (importInput) {
      importInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            const data = await importFromJSON(file);
            store.loadBackup(data);
            alert('¡Respaldo importado exitosamente!');
            closeModal();
            this.navigate(this.currentRoute, false);
          } catch (err) {
            alert('Error al importar archivo: ' + err.message);
          }
        }
      });
    }

    const resetBtn = document.getElementById('btn-do-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('¿Restablecer todos los datos a la versión de demostración inicial?')) {
          store.resetToDemo();
          alert('Datos restablecidos.');
          closeModal();
          this.navigate(this.currentRoute, false);
        }
      });
    }
  }
}

// Instanciar y exportar
export const router = new AppRouter();
window.router = router;

// Iniciar al cargar DOM
document.addEventListener('DOMContentLoaded', () => {
  router.init();
});
