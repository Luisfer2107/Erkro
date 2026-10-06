/**
 * Store y Capa de Persistencia para Erkro CRM Inmobiliario
 * Maneja el almacenamiento local, sincronización y cálculos de métricas de crecimiento YoY.
 */

import { INITIAL_DATA } from './demo-data.js';

const STORAGE_KEY = 'erkro_crm_storage_v1';

class CRMStore {
  constructor() {
    this.state = null;
    this.listeners = [];
    this.init();
  }

  /**
   * Inicializa el estado cargando desde localStorage o datos demo
   */
  init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.state = JSON.parse(stored);
      } else {
        this.state = JSON.parse(JSON.stringify(INITIAL_DATA));
        this.save();
      }
    } catch (e) {
      console.warn('Error al leer de localStorage, usando datos demo:', e);
      this.state = JSON.parse(JSON.stringify(INITIAL_DATA));
    }
  }

  /**
   * Guarda el estado actual en localStorage y notifica a los suscriptores
   */
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      this.notify();
    } catch (e) {
      console.error('Error al guardar en localStorage:', e);
    }
  }

  /**
   * Suscribe un callback a cambios de estado
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => {
      try {
        fn(this.state);
      } catch (err) {
        console.error('Error en listener de store:', err);
      }
    });
  }

  /**
   * Restablece los datos de fábrica a los de demostración
   */
  resetToDemo() {
    this.state = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.save();
  }

  /**
   * Importa un respaldo completo JSON
   */
  loadBackup(backupData) {
    if (!backupData || !backupData.properties || !backupData.deals) {
      throw new Error('Estructura de respaldo no válida');
    }
    this.state = backupData;
    this.save();
  }

  // ==================== GETTERS ====================

  getSettings() {
    return this.state.settings || INITIAL_DATA.settings;
  }

  updateSettings(newSettings) {
    this.state.settings = { ...this.state.settings, ...newSettings };
    this.save();
  }

  getAgents() {
    return this.state.agents || [];
  }

  getAgent(id) {
    return this.getAgents().find(a => a.id === id) || null;
  }

  getProperties() {
    return this.state.properties || [];
  }

  getProperty(id) {
    return this.getProperties().find(p => p.id === id) || null;
  }

  saveProperty(property) {
    const properties = this.getProperties();
    const index = properties.findIndex(p => p.id === property.id);
    if (index >= 0) {
      properties[index] = { ...properties[index], ...property, updatedAt: new Date().toISOString() };
    } else {
      properties.unshift({
        ...property,
        createdAt: property.createdAt || new Date().toISOString()
      });
    }
    this.state.properties = properties;
    this.save();
  }

  deleteProperty(id) {
    this.state.properties = this.getProperties().filter(p => p.id !== id);
    this.save();
  }

  getContacts() {
    return this.state.contacts || [];
  }

  getContact(id) {
    return this.getContacts().find(c => c.id === id) || null;
  }

  saveContact(contact) {
    const contacts = this.getContacts();
    const index = contacts.findIndex(c => c.id === contact.id);
    if (index >= 0) {
      contacts[index] = { ...contacts[index], ...contact, updatedAt: new Date().toISOString() };
    } else {
      contacts.unshift({
        ...contact,
        createdAt: contact.createdAt || new Date().toISOString()
      });
    }
    this.state.contacts = contacts;
    this.save();
  }

  deleteContact(id) {
    this.state.contacts = this.getContacts().filter(c => c.id !== id);
    this.save();
  }

  getDeals() {
    return this.state.deals || [];
  }

  getDeal(id) {
    return this.getDeals().find(d => d.id === id) || null;
  }

  saveDeal(deal) {
    const deals = this.getDeals();
    const index = deals.findIndex(d => d.id === deal.id);
    if (index >= 0) {
      deals[index] = { ...deals[index], ...deal, updatedAt: new Date().toISOString() };
    } else {
      deals.unshift({
        ...deal,
        createdAt: deal.createdAt || new Date().toISOString()
      });
    }
    this.state.deals = deals;
    this.save();
  }

  updateDealStage(dealId, newStage) {
    const deal = this.getDeal(dealId);
    if (!deal) return;

    deal.stage = newStage;
    if (newStage === 'ganada') {
      deal.closeDate = deal.closeDate || new Date().toISOString().split('T')[0];
      deal.probability = 100;

      // Si tiene inmueble vinculado, marcarlo como Vendido
      if (deal.propertyId) {
        const prop = this.getProperty(deal.propertyId);
        if (prop) {
          prop.status = 'Vendido';
          this.saveProperty(prop);
        }
      }
    } else if (newStage === 'promesa') {
      deal.probability = 90;
      if (deal.propertyId) {
        const prop = this.getProperty(deal.propertyId);
        if (prop && prop.status === 'Disponible') {
          prop.status = 'Reservado';
          this.saveProperty(prop);
        }
      }
    }

    this.saveDeal(deal);
  }

  deleteDeal(id) {
    this.state.deals = this.getDeals().filter(d => d.id !== id);
    this.save();
  }

  getVisits() {
    return this.state.visits || [];
  }

  saveVisit(visit) {
    const visits = this.getVisits();
    const index = visits.findIndex(v => v.id === visit.id);
    if (index >= 0) {
      visits[index] = { ...visits[index], ...visit };
    } else {
      visits.unshift(visit);
    }
    this.state.visits = visits;
    this.save();
  }

  deleteVisit(id) {
    this.state.visits = this.getVisits().filter(v => v.id !== id);
    this.save();
  }

  // ==================== INTELIGENCIA DE NEGOCIO & CRECIMIENTO YoY ====================

  /**
   * Obtiene la lista de años disponibles en los registros de ventas
   */
  getAvailableYears() {
    const yearsSet = new Set([2024, 2025, 2026]);
    this.getDeals().forEach(deal => {
      const dateStr = deal.closeDate || deal.createdAt;
      if (dateStr) {
        const y = new Date(dateStr).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }

  /**
   * Calcula el motor de análisis de crecimiento Año contra Año (YoY)
   * Responde directamente a la pregunta: ¿Estoy vendiendo más que el año anterior? ¿Estoy creciendo?
   * @param {number} currentYear Año actual a evaluar (ej. 2026)
   * @param {number} previousYear Año anterior de comparación (ej. 2025)
   */
  getYoYMetrics(currentYear = 2026, previousYear = 2025) {
    const deals = this.getDeals();
    const settings = this.getSettings();

    // Filtrar solo negocios ganados/cerrados
    const closedDeals = deals.filter(d => d.stage === 'ganada');

    // Negocios del año actual
    const currentYearDeals = closedDeals.filter(d => {
      const dateStr = d.closeDate || d.createdAt;
      return dateStr && new Date(dateStr).getFullYear() === Number(currentYear);
    });

    // Negocios del año anterior
    const previousYearDeals = closedDeals.filter(d => {
      const dateStr = d.closeDate || d.createdAt;
      return dateStr && new Date(dateStr).getFullYear() === Number(previousYear);
    });

    // 1. Volumen total de ventas
    const currentSales = currentYearDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const previousSales = previousYearDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const salesGrowth = previousSales > 0 ? ((currentSales - previousSales) / previousSales) * 100 : (currentSales > 0 ? 100 : 0);

    // 2. Unidades inmobiliarias cerradas
    const currentUnits = currentYearDeals.length;
    const previousUnits = previousYearDeals.length;
    const unitsGrowth = previousUnits > 0 ? ((currentUnits - previousUnits) / previousUnits) * 100 : 0;

    // 3. Ticket promedio de venta
    const currentTicket = currentUnits > 0 ? currentSales / currentUnits : 0;
    const previousTicket = previousUnits > 0 ? previousSales / previousUnits : 0;
    const ticketGrowth = previousTicket > 0 ? ((currentTicket - previousTicket) / previousTicket) * 100 : 0;

    // 4. Comisiones generadas
    const currentCommissions = currentYearDeals.reduce((sum, d) => {
      const comm = d.commissionExpected || (d.amount * (settings.defaultCommissionRate / 100));
      return sum + Number(comm);
    }, 0);
    const previousCommissions = previousYearDeals.reduce((sum, d) => {
      const comm = d.commissionExpected || (d.amount * (settings.defaultCommissionRate / 100));
      return sum + Number(comm);
    }, 0);
    const commissionsGrowth = previousCommissions > 0 ? ((currentCommissions - previousCommissions) / previousCommissions) * 100 : 0;

    // 5. Comparativa Mes a Mes (Enero a Diciembre)
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthlyComparison = monthNames.map((name, index) => {
      const currMonthTotal = currentYearDeals
        .filter(d => new Date(d.closeDate || d.createdAt).getMonth() === index)
        .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

      const prevMonthTotal = previousYearDeals
        .filter(d => new Date(d.closeDate || d.createdAt).getMonth() === index)
        .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

      const diff = currMonthTotal - prevMonthTotal;
      const pct = prevMonthTotal > 0 ? ((currMonthTotal - prevMonthTotal) / prevMonthTotal) * 100 : (currMonthTotal > 0 ? 100 : 0);

      return {
        monthIndex: index,
        monthName: name,
        currentYearAmount: currMonthTotal,
        previousYearAmount: prevMonthTotal,
        difference: diff,
        growthPct: pct
      };
    });

    // 6. Embudo de ventas actual (Pipeline activo de oportunidades vivas)
    const activeStages = [
      { key: 'prospecto', label: 'Prospecto Nuevo', color: '#94a3b8' },
      { key: 'calificado', label: 'Calificado', color: '#60a5fa' },
      { key: 'visita_agendada', label: 'Visita Agendada', color: '#818cf8' },
      { key: 'negociacion', label: 'En Negociación', color: '#f59e0b' },
      { key: 'promesa', label: 'Promesa de Venta', color: '#10b981' },
      { key: 'ganada', label: 'Cerrada / Ganada', color: '#059669' },
      { key: 'perdida', label: 'Perdida', color: '#ef4444' }
    ];

    const pipelineFunnel = activeStages.map(st => {
      const stageDeals = deals.filter(d => d.stage === st.key);
      const count = stageDeals.length;
      const totalAmount = stageDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      return {
        ...st,
        count,
        totalAmount
      };
    });

    // Total volumen activo en negociación (excluyendo cerradas y perdidas)
    const pipelineActiveVolume = deals
      .filter(d => !['ganada', 'perdida'].includes(d.stage))
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

    // 7. Ventas por tipo de inmueble (para el año actual)
    const properties = this.getProperties();
    const typeDistribution = {};
    currentYearDeals.forEach(deal => {
      let type = deal.propertyType;
      if (!type && deal.propertyId) {
        const prop = properties.find(p => p.id === deal.propertyId);
        if (prop) type = prop.type;
      }
      type = type || 'Apartamento';
      typeDistribution[type] = (typeDistribution[type] || 0) + Number(deal.amount);
    });

    // 8. Rendimiento de Asesores en el año actual
    const agents = this.getAgents();
    const agentRankings = agents.map(ag => {
      const agDeals = currentYearDeals.filter(d => d.agentId === ag.id);
      const totalSales = agDeals.reduce((sum, d) => sum + Number(d.amount), 0);
      const units = agDeals.length;
      const commissions = agDeals.reduce((sum, d) => sum + (Number(d.commissionExpected) || (d.amount * 0.03)), 0);
      const targetPercent = ag.target > 0 ? (totalSales / ag.target) * 100 : 0;

      return {
        ...ag,
        totalSales,
        units,
        commissions,
        targetPercent
      };
    }).sort((a, b) => b.totalSales - a.totalSales);

    // 9. Meta Anual del negocio vs Real
    const annualGoal = Number(settings[`annualGoal${currentYear}`] || settings.annualGoal2026 || 5000000000);
    const goalAchievementPercent = annualGoal > 0 ? (currentSales / annualGoal) * 100 : 0;

    return {
      currentYear: Number(currentYear),
      previousYear: Number(previousYear),
      currentSales,
      previousSales,
      salesGrowth,
      isSalesGrowing: salesGrowth >= 0,
      currentUnits,
      previousUnits,
      unitsGrowth,
      currentTicket,
      previousTicket,
      ticketGrowth,
      currentCommissions,
      previousCommissions,
      commissionsGrowth,
      monthlyComparison,
      pipelineFunnel,
      pipelineActiveVolume,
      typeDistribution,
      agentRankings,
      annualGoal,
      goalAchievementPercent
    };
  }
}

export const store = new CRMStore();
