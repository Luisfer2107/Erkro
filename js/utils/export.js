/**
 * Utilidades de exportación, copia de seguridad e importación para Erkro CRM
 */

/**
 * Descarga datos en formato JSON como respaldo
 * @param {Object} data 
 * @param {string} filename 
 */
export function exportToJSON(data, filename = 'erkro_crm_backup.json') {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Lee un archivo JSON cargado por el usuario
 * @param {File} file 
 * @returns {Promise<Object>}
 */
export function importFromJSON(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No se seleccionó ningún archivo'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        resolve(parsed);
      } catch (err) {
        reject(new Error('El archivo no tiene un formato JSON válido'));
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsText(file);
  });
}

/**
 * Convierte un arreglo de objetos en un archivo CSV compatible con Excel
 * @param {Array<Object>} data 
 * @param {string} filename 
 */
export function exportToCSV(data, filename = 'export.csv') {
  if (!data || !data.length) {
    alert('No hay datos para exportar.');
    return;
  }

  // Extraer encabezados de las claves del primer objeto
  const headers = Object.keys(data[0]);
  
  // Generar filas CSV
  const csvRows = [];
  
  // Cabecera con BOM UTF-8 para que Excel lo abra sin problemas de tildes
  csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(';'));

  for (const row of data) {
    const values = headers.map(header => {
      let val = row[header];
      if (val === null || val === undefined) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      const stringified = String(val).replace(/"/g, '""');
      return `"${stringified}"`;
    });
    csvRows.push(values.join(';'));
  }

  const csvString = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Imprime un contenedor específico como documento limpio
 * @param {string} elementId 
 * @param {string} title 
 */
export function printElement(elementId, title = 'Documento Erkro CRM') {
  const element = document.getElementById(elementId);
  if (!element) return;

  const originalTitle = document.title;
  document.title = title;
  window.print();
  document.title = originalTitle;
}
