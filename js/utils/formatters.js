/**
 * Formateadores y utilidades de presentación para Erkro CRM Inmobiliario
 */

/**
 * Formatea un valor monetario según la moneda seleccionada
 * @param {number} amount 
 * @param {string} currencyCode ('COP', 'USD', 'EUR', 'MXN')
 * @returns {string}
 */
export function formatCurrency(amount, currencyCode = 'COP') {
  if (amount === null || amount === undefined || isNaN(amount)) return '$ 0';
  
  const num = Number(amount);
  
  if (currencyCode === 'COP') {
    // Formato colombiano estándar: $ 450.000.000
    return '$ ' + new Intl.NumberFormat('es-CO', {
      maximumFractionDigits: 0
    }).format(num);
  } else if (currencyCode === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(num);
  } else if (currencyCode === 'EUR') {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(num);
  } else {
    return '$ ' + new Intl.NumberFormat('es-MX', {
      maximumFractionDigits: 0
    }).format(num);
  }
}

/**
 * Formato abreviado para KPIs grandes (ej. $ 1.25 B o $ 450 M)
 * @param {number} amount 
 * @param {string} currencyCode 
 * @returns {string}
 */
export function formatCompactCurrency(amount, currencyCode = 'COP') {
  if (!amount || isNaN(amount)) return '$ 0';
  const num = Number(amount);
  
  if (currencyCode === 'COP') {
    if (Math.abs(num) >= 1_000_000_000) {
      return '$ ' + (num / 1_000_000_000).toFixed(2).replace('.', ',') + ' B';
    }
    if (Math.abs(num) >= 1_000_000) {
      return '$ ' + (num / 1_000_000).toFixed(1).replace('.', ',') + ' M';
    }
    if (Math.abs(num) >= 1_000) {
      return '$ ' + (num / 1_000).toFixed(0) + ' K';
    }
    return '$ ' + num.toLocaleString('es-CO');
  }

  // USD / Otros
  if (Math.abs(num) >= 1_000_000) {
    return '$ ' + (num / 1_000_000).toFixed(2) + ' M';
  }
  if (Math.abs(num) >= 1_000) {
    return '$ ' + (num / 1_000).toFixed(1) + ' K';
  }
  return '$ ' + num.toLocaleString();
}

/**
 * Formatea una fecha ISO o string en español legible
 * @param {string} dateString 
 * @param {boolean} includeTime 
 * @returns {string}
 */
export function formatDate(dateString, includeTime = false) {
  if (!dateString) return 'Sin fecha';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const options = {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return date.toLocaleDateString('es-ES', options);
}

/**
 * Retorna fecha en formato ISO YYYY-MM-DD
 */
export function toISODate(date = new Date()) {
  return date.toISOString().split('T')[0];
}

/**
 * Calcula porcentaje de cambio YoY entre año actual y anterior
 * @param {number} current 
 * @param {number} previous 
 * @returns {{ percentage: number, isPositive: boolean, formatted: string, label: string }}
 */
export function calculateYoYGrowth(current, previous) {
  if (!previous || previous === 0) {
    if (current > 0) {
      return {
        percentage: 100,
        isPositive: true,
        formatted: '+100%',
        label: 'Nuevo crecimiento'
      };
    }
    return {
      percentage: 0,
      isPositive: true,
      formatted: '0%',
      label: 'Sin cambios'
    };
  }

  const change = ((current - previous) / previous) * 100;
  const isPositive = change >= 0;
  const formatted = (isPositive ? '+' : '') + change.toFixed(1) + '%';

  return {
    percentage: change,
    isPositive,
    formatted,
    label: isPositive ? 'Crecimiento vs año anterior' : 'Descenso vs año anterior'
  };
}

/**
 * Genera un ID único para nuevas entidades
 */
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Sanitiza texto para HTML seguro
 */
export function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
