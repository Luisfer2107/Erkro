/**
 * ====================================================================
 * Erkro CRM Inmobiliario - Núcleo Completo Autónomo
 * 
 * Actualizaciones solicitadas:
 * 1. Ventas de 2026 en adelante únicamente (eliminado 2025 ficticio).
 * 2. Tablero Kanban con tarjetas separadas (no sobrepuestas ni excesivamente largas).
 * 3. Usuario único inicial: "Rodrigo Hernández" + funcionalidad para crear más usuarios.
 * 4. Creador de inmuebles con subida y arrastre de fotos desde carpetas locales.
 * 5. Calculadora con espacio editable para el % financiado del restante tras cuota inicial.
 * ====================================================================
 */

(function () {
  'use strict';

  // ==================================================================
  // 1. UTILIDADES Y FORMATEADORES
  // ==================================================================
  const Formatters = {
    formatCurrency(amount, currencyCode = 'COP') {
      if (amount === null || amount === undefined || isNaN(amount)) return '$ 0';
      const num = Number(amount);
      if (currencyCode === 'COP') {
        return '$ ' + new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(num);
      } else if (currencyCode === 'USD') {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
      } else {
        return '$ ' + new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(num);
      }
    },

    formatCompactCurrency(amount, currencyCode = 'COP') {
      if (!amount || isNaN(amount)) return '$ 0';
      const num = Number(amount);
      if (currencyCode === 'COP') {
        if (Math.abs(num) >= 1_000_000_000) return '$ ' + (num / 1_000_000_000).toFixed(2).replace('.', ',') + ' B';
        if (Math.abs(num) >= 1_000_000) return '$ ' + (num / 1_000_000).toFixed(1).replace('.', ',') + ' M';
        if (Math.abs(num) >= 1_000) return '$ ' + (num / 1_000).toFixed(0) + ' K';
        return '$ ' + num.toLocaleString('es-CO');
      }
      if (Math.abs(num) >= 1_000_000) return '$ ' + (num / 1_000_000).toFixed(2) + ' M';
      return '$ ' + num.toLocaleString();
    },

    formatDate(dateString, includeTime = false) {
      if (!dateString) return 'Sin fecha';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const opts = { day: 'numeric', month: 'short', year: 'numeric' };
      if (includeTime) { opts.hour = '2-digit'; opts.minute = '2-digit'; }
      return date.toLocaleDateString('es-ES', opts);
    },

    generateId(prefix = 'id') {
      return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    },

    escapeHTML(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  };

  // ==================================================================
  // 2. EXPORTACIÓN Y RESPALDO
  // ==================================================================
  const ExportUtils = {
    exportToJSON(data, filename = 'erkro_crm_backup.json') {
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
    },

    importFromJSON(file) {
      return new Promise((resolve, reject) => {
        if (!file) return reject(new Error('No se seleccionó ningún archivo'));
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            resolve(JSON.parse(e.target.result));
          } catch (err) {
            reject(new Error('Formato JSON no válido'));
          }
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsText(file);
      });
    },

    exportToCSV(data, filename = 'export.csv') {
      if (!data || !data.length) {
        alert('No hay datos para exportar.');
        return;
      }
      const headers = Object.keys(data[0]);
      const csvRows = [];
      csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(';'));
      for (const row of data) {
        const values = headers.map(header => {
          let val = row[header];
          if (val === null || val === undefined) val = '';
          if (typeof val === 'object') val = JSON.stringify(val);
          return `"${String(val).replace(/"/g, '""')}"`;
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
  };

  // ==================================================================
  // 3. DATOS INICIALES (SOLO 2026 EN ADELANTE Y RODRIGO HERNÁNDEZ)
  // ==================================================================
  const INITIAL_DATA = {
    settings: {
      agencyName: "Inmobiliaria Erkro",
      currency: "COP",
      annualGoal2026: 5500000000, // Meta 2026: 5.500 Millones COP
      defaultCommissionRate: 3.0
    },
    // Usuario único inicial: Rodrigo Hernández
    agents: [
      {
        id: "ag_rodrigo",
        name: "Rodrigo Hernández",
        email: "rodrigo.hernandez@erkro.com",
        phone: "+57 310 987 6543",
        role: "Director Inmobiliario",
        avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
        target: 5500000000,
        commissionRate: 3.5
      }
    ],
    properties: [
      {
        id: "prop_1",
        code: "ERK-101",
        title: "Apartamento Luxury en El Poblado",
        type: "Apartamento",
        operation: "Venta",
        price: 850000000,
        area: 142,
        bedrooms: 3,
        bathrooms: 3,
        garages: 2,
        neighborhood: "El Poblado",
        city: "Medellín",
        status: "Disponible",
        address: "Transversal Inferior con Calle 10",
        description: "Espectacular apartamento con acabados italianos de lujo, vista panorámica inigualable a la ciudad, balcón amplio con zona BBQ y club house completo.",
        amenities: ["Piscina climatizada", "Gimnasio", "Vigilancia 24/7", "Balcón amplio", "Zona BBQ"],
        images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80"],
        agentId: "ag_rodrigo"
      },
      {
        id: "prop_2",
        code: "ERK-102",
        title: "Casa Campestre Moderna con Piscina",
        type: "Casa Campestre",
        operation: "Venta",
        price: 1650000000,
        area: 380,
        bedrooms: 4,
        bathrooms: 5,
        garages: 4,
        neighborhood: "Llanogrande",
        city: "Rionegro",
        status: "Disponible",
        address: "Vereda La Acuarela",
        description: "Diseño bioclimático contemporáneo rodeado de naturaleza. Techos doble altura, piscina privada con jacuzzi climatizado y amplios jardines.",
        amenities: ["Piscina privada", "Jacuzzi", "Zona verde 1200m²", "Seguridad privada"],
        images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80"],
        agentId: "ag_rodrigo"
      },
      {
        id: "prop_3",
        code: "ERK-103",
        title: "Penthouse Dúplex con Terraza Privada",
        type: "Penthouse",
        operation: "Venta",
        price: 1200000000,
        area: 215,
        bedrooms: 3,
        bathrooms: 4,
        garages: 3,
        neighborhood: "Rosales / Chicó",
        city: "Bogotá",
        status: "Reservado",
        address: "Calle 85 con Carrera 9",
        description: "Exclusivo penthouse dúplex con terraza de 45m² y vista a los cerros orientales.",
        amenities: ["Terraza 45m²", "Vista a cerros", "Chimenea", "Planta eléctrica"],
        images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80"],
        agentId: "ag_rodrigo"
      },
      {
        id: "prop_4",
        code: "ERK-104",
        title: "Local Comercial Centro Empresarial",
        type: "Local Comercial",
        operation: "Venta",
        price: 580000000,
        area: 88,
        bedrooms: 0,
        bathrooms: 2,
        garages: 1,
        neighborhood: "Salitre Plaza",
        city: "Bogotá",
        status: "Disponible",
        address: "Avenida El Dorado",
        description: "Excelente local comercial a doble altura con vitrina acristalada hacia plazoleta corporativa.",
        amenities: ["Vitrina comercial", "Doble altura", "Parqueadero clientes"],
        images: ["https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80"],
        agentId: "ag_rodrigo"
      },
      {
        id: "prop_5",
        code: "ERK-105",
        title: "Apartamento Familiar en Laureles",
        type: "Apartamento",
        operation: "Venta",
        price: 520000000,
        area: 98,
        bedrooms: 3,
        bathrooms: 2,
        garages: 1,
        neighborhood: "Laureles",
        city: "Medellín",
        status: "Disponible",
        address: "Circular 4ta con Carrera 73",
        description: "Apartamento iluminado cerca a colegios y zona gastronómica de Laureles.",
        amenities: ["Balcón", "Cocina remodelada", "Ascensor"],
        images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80"],
        agentId: "ag_rodrigo"
      }
    ],
    contacts: [
      {
        id: "cnt_1",
        name: "Alejandro Jaramillo",
        type: "Comprador",
        phone: "+57 300 456 7890",
        whatsapp: "573004567890",
        email: "a.jaramillo@techcorp.co",
        city: "Medellín",
        budgetMin: 700000000,
        budgetMax: 950000000,
        preferredType: "Apartamento",
        preferredZone: "El Poblado / Envigado",
        notes: "Gerente de tecnología. Pago de contado + crédito preaprobado.",
        status: "Calificado",
        assignedAgentId: "ag_rodrigo"
      },
      {
        id: "cnt_2",
        name: "Dra. Sofía Benítez",
        type: "Comprador / Inversionista",
        phone: "+57 311 234 5678",
        whatsapp: "573112345678",
        email: "sofia.benitez@clinica.com",
        city: "Rionegro",
        budgetMin: 1400000000,
        budgetMax: 1800000000,
        preferredType: "Casa Campestre",
        preferredZone: "Llanogrande",
        notes: "Médica especialista. Muy interesada en acabados modernos y seguridad.",
        status: "En Visita",
        assignedAgentId: "ag_rodrigo"
      },
      {
        id: "cnt_3",
        name: "Juan Manuel Ospina",
        type: "Inversionista",
        phone: "+57 316 789 0123",
        whatsapp: "573167890123",
        email: "jm.ospina@inversiones.com",
        city: "Bogotá",
        budgetMin: 500000000,
        budgetMax: 1300000000,
        preferredType: "Penthouse",
        preferredZone: "Chicó / Rosales",
        notes: "Empresario con capital disponible para renta corporativa.",
        status: "Negociación",
        assignedAgentId: "ag_rodrigo"
      },
      {
        id: "cnt_4",
        name: "Juliana Caicedo",
        type: "Comprador",
        phone: "+57 318 432 1098",
        whatsapp: "573184321098",
        email: "juliana.caicedo@gmail.com",
        city: "Medellín",
        budgetMin: 450000000,
        budgetMax: 550000000,
        preferredType: "Apartamento",
        preferredZone: "Laureles",
        notes: "Arquitecta. Crédito Bancolombia aprobado.",
        status: "Nuevo Lead",
        assignedAgentId: "ag_rodrigo"
      },
      {
        id: "cnt_5",
        name: "Rodrigo Echeverry",
        type: "Inversionista",
        phone: "+57 313 876 5432",
        whatsapp: "573138765432",
        email: "rodrigo.ech@inmocapital.com",
        city: "Bogotá",
        budgetMin: 550000000,
        budgetMax: 700000000,
        preferredType: "Local Comercial",
        preferredZone: "Salitre",
        notes: "Busca locales comerciales con contratos vigentes.",
        status: "Calificado",
        assignedAgentId: "ag_rodrigo"
      }
    ],
    deals: [
      // 1. OPORTUNIDADES ACTIVAS EN PIPELINE (2026)
      {
        id: "deal_1",
        title: "Venta Apto Luxury El Poblado",
        contactId: "cnt_1",
        propertyId: "prop_1",
        agentId: "ag_rodrigo",
        stage: "visita_agendada",
        amount: 850000000,
        expectedCloseDate: "2026-11-20",
        priority: "Alta",
        notes: "Cliente muy entusiasmado tras ver fotos. Visita este fin de semana."
      },
      {
        id: "deal_2",
        title: "Venta Casa Campestre Llanogrande",
        contactId: "cnt_2",
        propertyId: "prop_2",
        agentId: "ag_rodrigo",
        stage: "negociacion",
        amount: 1650000000,
        expectedCloseDate: "2026-11-10",
        priority: "Alta",
        notes: "Dra. Sofía presentó contraoferta de 1.600M."
      },
      {
        id: "deal_3",
        title: "Promesa Penthouse Rosales",
        contactId: "cnt_3",
        propertyId: "prop_3",
        agentId: "ag_rodrigo",
        stage: "promesa",
        amount: 1200000000,
        expectedCloseDate: "2026-10-30",
        priority: "Alta",
        notes: "Elaborando promesa de compraventa en Notaría 45."
      },
      {
        id: "deal_4",
        title: "Interés Local Centro Empresarial",
        contactId: "cnt_5",
        propertyId: "prop_4",
        agentId: "ag_rodrigo",
        stage: "calificado",
        amount: 580000000,
        expectedCloseDate: "2026-12-15",
        priority: "Media",
        notes: "Evaluando flujo proyectado de rentas."
      },
      {
        id: "deal_5",
        title: "Lead Primer Apto Laureles",
        contactId: "cnt_4",
        propertyId: "prop_5",
        agentId: "ag_rodrigo",
        stage: "prospecto",
        amount: 520000000,
        expectedCloseDate: "2026-12-28",
        priority: "Media",
        notes: "Se enviará catálogo por WhatsApp."
      },

      // 2. VENTAS CERRADAS Y GANADAS EN 2026 A LA FECHA DE HOY
      // Total 2026 acumulado cerrado: 4.890.000.000 COP
      { id: "dc_26_1", title: "Venta Apto San Lucas", agentId: "ag_rodrigo", stage: "ganada", amount: 720000000, closeDate: "2026-01-28", propertyType: "Apartamento" },
      { id: "dc_26_2", title: "Venta Casa Campestre El Retiro", agentId: "ag_rodrigo", stage: "ganada", amount: 1450000000, closeDate: "2026-02-24", propertyType: "Casa Campestre" },
      { id: "dc_26_3", title: "Venta Oficina Corporativa Chicó", agentId: "ag_rodrigo", stage: "ganada", amount: 680000000, closeDate: "2026-03-19", propertyType: "Oficina" },
      { id: "dc_26_4", title: "Venta Apartamento Envigado", agentId: "ag_rodrigo", stage: "ganada", amount: 510000000, closeDate: "2026-04-30", propertyType: "Apartamento" },
      { id: "dc_26_5", title: "Venta Lote Parcelación La Ceja", agentId: "ag_rodrigo", stage: "ganada", amount: 430000000, closeDate: "2026-06-15", propertyType: "Lote / Terreno" },
      { id: "dc_26_6", title: "Venta Penthouse Santa Bárbara", agentId: "ag_rodrigo", stage: "ganada", amount: 1100000000, closeDate: "2026-08-14", propertyType: "Penthouse" }
    ],
    visits: [
      {
        id: "vis_1",
        propertyId: "prop_1",
        contactId: "cnt_1",
        agentId: "ag_rodrigo",
        date: "2026-10-10",
        time: "10:30",
        duration: "45 min",
        modality: "Presencial",
        location: "Carrera 32 # 2 Sur - 45, El Poblado (Portería Principal)",
        status: "Programada",
        notes: "Llevar catálogo impreso y verificar disponibilidad de parqueaderos.",
        feedback: ""
      },
      {
        id: "vis_2",
        propertyId: "prop_2",
        contactId: "cnt_2",
        agentId: "ag_rodrigo",
        date: "2026-09-28",
        time: "15:00",
        duration: "1 hora",
        modality: "Presencial",
        location: "Km 4 Vía Don Diego - Rionegro",
        status: "Realizada",
        notes: "Visita familiar con cónyuge.",
        feedback: "Les encantó la piscina y el diseño. Pidieron margen de descuento para ofertar."
      },
      {
        id: "vis_3",
        propertyId: "prop_3",
        contactId: "cnt_3",
        agentId: "ag_rodrigo",
        date: "2026-10-14",
        time: "16:00",
        duration: "45 min",
        modality: "Virtual",
        location: "https://meet.google.com/erk-vis-360",
        status: "Programada",
        notes: "Recorrido virtual 360° en vivo con inversionista radicado en Bogotá.",
        feedback: ""
      }
    ]
  };

  // ==================================================================
  // 4. ALMACÉN Y ESTADO REACTIVO (STORE)
  // ==================================================================
  const STORAGE_KEY = 'erkro_crm_storage_v2';

  class CRMStore {
    constructor() {
      this.state = null;
      this.init();
    }

    init() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.state = JSON.parse(stored);
          // Asegurar que si falta agents o tiene datos viejos, se agregue Rodrigo
          if (!this.state.agents || !this.state.agents.length) {
            this.state.agents = INITIAL_DATA.agents;
            this.save();
          }
          if (this.state.visits && this.state.visits.length) {
            let updated = false;
            this.state.visits.forEach(v => {
              if (!v.modality) { v.modality = 'Presencial'; updated = true; }
            });
            if (updated) this.save();
          }
        } else {
          this.state = JSON.parse(JSON.stringify(INITIAL_DATA));
          this.save();
        }
      } catch (e) {
        this.state = JSON.parse(JSON.stringify(INITIAL_DATA));
      }
    }

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (e) {
        console.error(e);
      }
    }

    resetToDemo() {
      this.state = JSON.parse(JSON.stringify(INITIAL_DATA));
      this.save();
    }

    loadBackup(data) {
      if (!data || !data.properties || !data.deals) throw new Error('Estructura de respaldo no válida');
      this.state = data;
      this.save();
    }

    getSettings() { return this.state.settings || INITIAL_DATA.settings; }
    getAgents() { return this.state.agents || INITIAL_DATA.agents; }
    getAgent(id) { return this.getAgents().find(a => a.id === id) || this.getAgents()[0] || null; }
    getProperties() { return this.state.properties || []; }
    getProperty(id) { return this.getProperties().find(p => p.id === id) || null; }
    getContacts() { return this.state.contacts || []; }
    getContact(id) { return this.getContacts().find(c => c.id === id) || null; }
    getDeals() { return this.state.deals || []; }
    getDeal(id) { return this.getDeals().find(d => d.id === id) || null; }
    getVisits() { return this.state.visits || []; }
    getVisit(id) { return this.getVisits().find(v => v.id === id) || null; }

    // Guardar / Crear nuevo usuario o asesor
    saveAgent(agent) {
      const list = this.getAgents();
      const idx = list.findIndex(a => a.id === agent.id);
      if (idx >= 0) list[idx] = { ...list[idx], ...agent };
      else list.push(agent);
      this.state.agents = list;
      this.save();
    }

    deleteAgent(id) {
      if (this.getAgents().length <= 1) {
        alert('Debe existir al menos un usuario en el sistema.');
        return;
      }
      this.state.agents = this.getAgents().filter(a => a.id !== id);
      this.save();
    }

    saveProperty(prop) {
      const list = this.getProperties();
      const idx = list.findIndex(p => p.id === prop.id);
      if (idx >= 0) list[idx] = { ...list[idx], ...prop };
      else list.unshift(prop);
      this.state.properties = list;
      this.save();
    }

    deleteProperty(id) {
      this.state.properties = this.getProperties().filter(p => p.id !== id);
      this.save();
    }

    saveContact(cnt) {
      const list = this.getContacts();
      const idx = list.findIndex(c => c.id === cnt.id);
      if (idx >= 0) list[idx] = { ...list[idx], ...cnt };
      else list.unshift(cnt);
      this.state.contacts = list;
      this.save();
    }

    deleteContact(id) {
      this.state.contacts = this.getContacts().filter(c => c.id !== id);
      this.save();
    }

    saveDeal(deal) {
      const list = this.getDeals();
      const idx = list.findIndex(d => d.id === deal.id);
      if (idx >= 0) list[idx] = { ...list[idx], ...deal };
      else list.unshift(deal);
      this.state.deals = list;
      this.save();
    }

    updateDealStage(dealId, newStage) {
      const deal = this.getDeal(dealId);
      if (!deal) return;
      deal.stage = newStage;
      if (newStage === 'ganada') {
        deal.closeDate = deal.closeDate || new Date().toISOString().split('T')[0];
        if (deal.propertyId) {
          const prop = this.getProperty(deal.propertyId);
          if (prop) { prop.status = 'Vendido'; this.saveProperty(prop); }
        }
      } else if (newStage === 'promesa') {
        if (deal.propertyId) {
          const prop = this.getProperty(deal.propertyId);
          if (prop && prop.status === 'Disponible') { prop.status = 'Reservado'; this.saveProperty(prop); }
        }
      }
      this.saveDeal(deal);
    }

    deleteDeal(id) {
      this.state.deals = this.getDeals().filter(d => d.id !== id);
      this.save();
    }

    saveVisit(vis) {
      const list = this.getVisits();
      const idx = list.findIndex(v => v.id === vis.id);
      if (idx >= 0) list[idx] = { ...list[idx], ...vis };
      else list.unshift(vis);
      this.state.visits = list;
      this.save();
    }

    deleteVisit(id) {
      this.state.visits = this.getVisits().filter(v => v.id !== id);
      this.save();
    }

    /**
     * Métricas 2026 en adelante a la fecha de hoy
     */
    getMetrics2026(year = 2026) {
      const deals = this.getDeals();
      const settings = this.getSettings();

      // Cierres ganados del año
      const closedDeals = deals.filter(d => {
        if (d.stage !== 'ganada') return false;
        const dt = d.closeDate || d.createdAt;
        return dt && new Date(dt).getFullYear() === Number(year);
      });

      const totalSales = closedDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      const unitsClosed = closedDeals.length;
      const averageTicket = unitsClosed > 0 ? totalSales / unitsClosed : 0;
      const commissionsEarned = closedDeals.reduce((sum, d) => sum + (Number(d.commissionExpected) || (d.amount * 0.03)), 0);

      const annualGoal = Number(settings[`annualGoal${year}`] || settings.annualGoal2026 || 5500000000);
      const goalAchievement = annualGoal > 0 ? (totalSales / annualGoal) * 100 : 0;

      // Pipeline vivo en proceso de cierre
      const activeDeals = deals.filter(d => !['ganada', 'perdida'].includes(d.stage));
      const pipelineActiveVolume = activeDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

      // Desglose mes a mes 2026
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const monthlyBreakdown = monthNames.map((name, index) => {
        const mDeals = closedDeals.filter(d => new Date(d.closeDate || d.createdAt).getMonth() === index);
        const amount = mDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
        return {
          monthIndex: index,
          monthName: name,
          amount,
          units: mDeals.length
        };
      });

      // Embudo de conversión activo
      const stages = [
        { key: 'prospecto', label: 'Prospecto / Nuevo Lead', color: '#94a3b8' },
        { key: 'calificado', label: 'Calificado / Interesado', color: '#60a5fa' },
        { key: 'visita_agendada', label: 'Visita Agendada', color: '#818cf8' },
        { key: 'negociacion', label: 'En Negociación', color: '#f59e0b' },
        { key: 'promesa', label: 'Promesa de Venta', color: '#10b981' },
        { key: 'ganada', label: 'Cierre Ganado 🎉', color: '#059669' }
      ];

      const funnel = stages.map(st => {
        const sDeals = deals.filter(d => d.stage === st.key);
        return {
          ...st,
          count: sDeals.length,
          totalAmount: sDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
        };
      });

      // Distribución por tipo de inmueble
      const properties = this.getProperties();
      const typeDistribution = {};
      closedDeals.forEach(d => {
        let t = d.propertyType;
        if (!t && d.propertyId) {
          const pr = properties.find(p => p.id === d.propertyId);
          if (pr) t = pr.type;
        }
        t = t || 'Apartamento';
        typeDistribution[t] = (typeDistribution[t] || 0) + Number(d.amount);
      });

      // Ranking Asesores
      const agentRankings = this.getAgents().map(ag => {
        const agDeals = closedDeals.filter(d => d.agentId === ag.id);
        const sales = agDeals.reduce((sum, d) => sum + Number(d.amount), 0);
        return {
          ...ag,
          totalSales: sales,
          units: agDeals.length,
          commissions: agDeals.reduce((sum, d) => sum + (Number(d.commissionExpected) || (d.amount * 0.03)), 0),
          targetPercent: ag.target > 0 ? (sales / ag.target) * 100 : 0
        };
      }).sort((a, b) => b.totalSales - a.totalSales);

      return {
        year,
        totalSales,
        unitsClosed,
        averageTicket,
        commissionsEarned,
        annualGoal,
        goalAchievement,
        pipelineActiveVolume,
        activeDealsCount: activeDeals.length,
        monthlyBreakdown,
        funnel,
        typeDistribution,
        agentRankings
      };
    }
  }

  const store = new CRMStore();

  // ==================================================================
  // 5. COMPONENTE: DASHBOARD (2026 EN ADELANTE A LA FECHA)
  // ==================================================================
  let monthlyChartInstance = null;
  let propertyTypeChartInstance = null;

  // Paleta de colores distintivos para cada tipo de inmueble
  const PROPERTY_TYPE_COLORS = {
    'Apartamento': '#2563eb',      // Azul Real
    'Casa Campestre': '#0d9488',   // Esmeralda / Teal
    'Oficina': '#f59e0b',          // Ámbar / Naranja
    'Penthouse': '#8b5cf6',        // Violeta / Púrpura
    'Local Comercial': '#ec4899',  // Rosa / Fucsia
    'Lote / Terreno': '#06b6d4',   // Cyan / Celeste
    'Bodega': '#64748b'            // Gris Pizarra
  };
  const PROPERTY_TYPE_FALLBACKS = ['#2563eb', '#0d9488', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

  function getPropertyColor(type, idx = 0) {
    return PROPERTY_TYPE_COLORS[type] || PROPERTY_TYPE_FALLBACKS[idx % PROPERTY_TYPE_FALLBACKS.length];
  }

  function renderDashboard(containerId = 'content-area', year = 2026) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const metrics = store.getMetrics2026(year);
    const settings = store.getSettings();
    const visits = store.getVisits().filter(v => v.status === 'Programada').slice(0, 4);
    const properties = store.getProperties();
    const contacts = store.getContacts();

    container.innerHTML = `
      <div class="space-y-6">
        <!-- HEADER EJECUTIVO: VENTAS 2026 A LA FECHA DE HOY -->
        <div class="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div class="space-y-2">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/10 backdrop-blur-md text-blue-200 border border-white/10">
                <i data-lucide="bar-chart-3" class="w-3.5 h-3.5"></i> Rendimiento Comercial ${metrics.year}
              </div>
              <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Estado de Ventas y Crecimiento a la Fecha
              </h1>
              <p class="text-slate-300 text-sm sm:text-base max-w-2xl">
                Monitoreo comercial consolidado del año ${metrics.year}. Registra transacciones, analiza el ritmo mensual y proyecta el cumplimiento de metas.
              </p>
            </div>

            <!-- BOTONES RÁPIDOS: NUEVO ASESOR Y NUEVA OPORTUNIDAD -->
            <div class="flex flex-wrap items-center gap-3">
              <button onclick="window.ErkroApp.openUserModal()" class="px-3.5 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 flex items-center gap-2 transition-colors cursor-pointer" title="Crear nuevo usuario">
                <i data-lucide="user-plus" class="w-4 h-4"></i> Crear Usuario
              </button>
              <button onclick="window.ErkroApp.goToPipeline(true)" class="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center gap-2 transition-colors cursor-pointer" title="Crear nueva oportunidad en el embudo">
                <i data-lucide="plus-circle" class="w-4 h-4"></i> Nueva Oportunidad
              </button>
            </div>
          </div>

          <!-- DIAGNÓSTICO DEL AÑO A LA FECHA -->
          <div class="mt-6 pt-6 border-t border-white/15 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white/10 rounded-xl p-4 border border-white/10">
              <div class="text-xs text-slate-300 uppercase tracking-wider font-medium">Ventas Facturadas (${metrics.year} a la fecha)</div>
              <div class="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">
                ${Formatters.formatCurrency(metrics.totalSales, settings.currency)}
              </div>
              <div class="text-xs text-slate-300 mt-1">
                ${metrics.unitsClosed} inmuebles vendidos con éxito
              </div>
            </div>

            <div class="bg-white/10 rounded-xl p-4 border border-white/10">
              <div class="text-xs text-slate-300 uppercase tracking-wider font-medium">Meta Anual ${metrics.year}</div>
              <div class="flex items-center justify-between mt-1">
                <span class="text-2xl sm:text-3xl font-extrabold text-white">${metrics.goalAchievement.toFixed(1)}%</span>
                <span class="text-xs text-slate-300">Meta: ${Formatters.formatCompactCurrency(metrics.annualGoal, settings.currency)}</span>
              </div>
              <div class="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
                <div class="bg-blue-400 h-2 rounded-full transition-all duration-500" style="width: ${Math.min(metrics.goalAchievement, 100)}%"></div>
              </div>
            </div>

            <div class="bg-white/10 rounded-xl p-4 border border-white/10">
              <div class="text-xs text-slate-300 uppercase tracking-wider font-medium">Pipeline en Trámite</div>
              <div class="text-2xl sm:text-3xl font-extrabold text-amber-300 mt-1">
                ${Formatters.formatCurrency(metrics.pipelineActiveVolume, settings.currency)}
              </div>
              <div class="text-xs text-slate-300 mt-1">
                ${metrics.activeDealsCount} oportunidades vivas en negociación
              </div>
            </div>
          </div>
        </div>

        <!-- 4 TARJETAS DE KPIS PRINCIPALES -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover-lift">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Facturado a la Fecha</span>
              <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <i data-lucide="circle-dollar-sign" class="w-5 h-5"></i>
              </div>
            </div>
            <div class="mt-3">
              <div class="text-2xl font-bold text-slate-900 dark:text-white">
                ${Formatters.formatCurrency(metrics.totalSales, settings.currency)}
              </div>
              <div class="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <i data-lucide="trending-up" class="w-3.5 h-3.5"></i> Cierres activos en ${metrics.year}
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover-lift">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Inmuebles Vendidos</span>
              <div class="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <i data-lucide="home" class="w-5 h-5"></i>
              </div>
            </div>
            <div class="mt-3">
              <div class="text-2xl font-bold text-slate-900 dark:text-white">
                ${metrics.unitsClosed} <span class="text-sm font-normal text-slate-500">propiedades</span>
              </div>
              <div class="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Transacciones cerradas en notaría
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover-lift">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ticket Promedio</span>
              <div class="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <i data-lucide="receipt" class="w-5 h-5"></i>
              </div>
            </div>
            <div class="mt-3">
              <div class="text-2xl font-bold text-slate-900 dark:text-white">
                ${Formatters.formatCurrency(metrics.averageTicket, settings.currency)}
              </div>
              <div class="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Valor promedio por cierre
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover-lift">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Comisiones Ganadas</span>
              <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <i data-lucide="award" class="w-5 h-5"></i>
              </div>
            </div>
            <div class="mt-3">
              <div class="text-2xl font-bold text-slate-900 dark:text-white">
                ${Formatters.formatCurrency(metrics.commissionsEarned, settings.currency)}
              </div>
              <div class="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                Honorarios inmobiliarios percibidos
              </div>
            </div>
          </div>
        </div>

        <!-- GRÁFICOS: VENTAS MES A MES 2026 & DISTRIBUCIÓN -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/60">
              <div>
                <h2 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <i data-lucide="line-chart" class="w-5 h-5 text-blue-600"></i>
                  Ritmo Mensual de Ventas (${metrics.year})
                </h2>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Facturación mes a mes acumulada a la fecha de hoy
                </p>
              </div>
              <div class="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                Total: ${Formatters.formatCurrency(metrics.totalSales, settings.currency)}
              </div>
            </div>

            <div class="mt-4 relative h-72 sm:h-80 w-full">
              <canvas id="chart-monthly-2026"></canvas>
            </div>
          </div>

          <!-- Distribución por Tipo de Inmueble -->
          <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
            <div>
              <h2 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-700/60">
                <i data-lucide="pie-chart" class="w-5 h-5 text-teal-600"></i>
                Ventas por Inmueble
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Distribución del volumen cerrado en ${metrics.year}
              </p>
              <div class="mt-4 relative h-52 w-full flex items-center justify-center">
                <canvas id="chart-property-type"></canvas>
              </div>
            </div>

            <div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60 space-y-2.5 text-xs">
              ${Object.entries(metrics.typeDistribution).map(([type, amount], idx) => {
                const color = getPropertyColor(type, idx);
                const total = metrics.totalSales || 1;
                const pct = Math.round((amount / total) * 100);
                return `
                  <div class="flex items-center justify-between text-slate-600 dark:text-slate-300 py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <span class="flex items-center gap-2.5 font-medium">
                      <!-- Indicador de color correspondiente al gráfico -->
                      <span class="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm border border-white/60 dark:border-slate-700" style="background-color: ${color}"></span>
                      <span class="text-slate-800 dark:text-slate-200 font-bold">${Formatters.escapeHTML(type)}</span>
                      <span class="text-[10px] text-slate-400 font-semibold">(${pct}%)</span>
                    </span>
                    <span class="font-black text-slate-900 dark:text-white">${Formatters.formatCurrency(amount, settings.currency)}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- EMBUDO DE CONVERSIÓN & USUARIOS COMERCIALES -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60">
              <div>
                <h2 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <i data-lucide="filter" class="w-5 h-5 text-indigo-600"></i>
                  Embudo de Conversión de Oportunidades
                </h2>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Flujo de prospectos desde primer contacto hasta el cierre
                </p>
              </div>
              <button onclick="window.ErkroApp.navigate('pipeline')" class="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1">
                Ver Kanban <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
              </button>
            </div>

            <div class="mt-6 space-y-4">
              ${metrics.funnel.filter(f => f.key !== 'perdida').map(stage => {
                const maxCount = Math.max(...metrics.funnel.map(f => f.count), 1);
                const widthPct = Math.max((stage.count / maxCount) * 100, 12);
                return `
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between text-xs">
                      <span class="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${stage.color}"></span>
                        ${stage.label}
                      </span>
                      <div class="flex items-center gap-3">
                        <span class="text-slate-500 font-medium">${stage.count} oportunidades</span>
                        <span class="font-bold text-slate-900 dark:text-white">${Formatters.formatCurrency(stage.totalAmount, settings.currency)}</span>
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

          <!-- Equipo Comercial & Usuarios -->
          <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60">
                <div>
                  <h2 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <i data-lucide="users" class="w-5 h-5 text-amber-500"></i>
                    Equipo Comercial
                  </h2>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Usuarios del sistema</p>
                </div>
                <button onclick="window.ErkroApp.openUserModal()" class="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 hover:bg-blue-100">
                  + Usuario
                </button>
              </div>

              <div class="mt-4 divide-y divide-slate-100 dark:divide-slate-700/60">
                ${metrics.agentRankings.map((agent, idx) => `
                  <div class="py-3 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                      <img src="${agent.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100'}" class="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700">
                      <div>
                        <div class="text-sm font-bold text-slate-900 dark:text-white">${Formatters.escapeHTML(agent.name)}</div>
                        <div class="text-xs text-slate-500 dark:text-slate-400">${agent.role || 'Asesor'} • ${agent.units} cierres</div>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-xs font-bold text-slate-900 dark:text-white">${Formatters.formatCurrency(agent.totalSales, settings.currency)}</div>
                      <div class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">+${Formatters.formatCurrency(agent.commissions, settings.currency)} com.</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 text-center">
              <span class="text-xs text-slate-400">Puedes crear más usuarios en cualquier momento</span>
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
                Citas agendadas con clientes
              </p>
            </div>
            <button onclick="window.ErkroApp.navigate('visits')" class="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1">
              Ver Agenda <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <div class="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${visits.map(v => {
              const prop = properties.find(p => p.id === v.propertyId);
              const cnt = contacts.find(c => c.id === v.contactId);
              const ag = store.getAgent(v.agentId);
              const isVirtual = v.modality === 'Virtual';

              const waMsg = encodeURIComponent(
                `🏡 *Confirmación de Cita Inmobiliaria - Inmobiliaria Erkro*\n\n` +
                `Hola ${cnt ? cnt.name : 'Estimado cliente'}, te saluda ${ag ? ag.name : 'tu asesor'} de Inmobiliaria Erkro.\n` +
                `Te confirmo los detalles de nuestra cita agendada:\n` +
                `• *Inmueble:* ${prop ? `${prop.title} (${prop.code})` : 'Inmueble Erkro'}\n` +
                `• *Modalidad:* ${isVirtual ? '💻 Visita Virtual (Videollamada / Tour 360°)' : '🏢 Visita Presencial'}\n` +
                `• *Fecha:* ${v.date}\n` +
                `• *Hora:* ${v.time || '10:30'}\n` +
                `• *${isVirtual ? 'Enlace' : 'Lugar'}:* ${v.location || (prop ? prop.address : 'Coordinar con asesor')}\n` +
                `• *Asesor:* ${ag ? ag.name : 'Rodrigo Hernández'}\n\n` +
                `¿Nos confirmas tu asistencia? ¡Quedamos atentos!`
              );

              return `
                <div class="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <i data-lucide="clock" class="w-3 h-3"></i> ${v.date} • ${v.time || '10:30'}
                      </span>
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isVirtual 
                          ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                      }">
                        ${isVirtual ? '💻 Virtual' : '🏢 Presencial'}
                      </span>
                    </div>

                    <h4 class="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      ${prop ? `[${prop.code}] ${Formatters.escapeHTML(prop.title)}` : 'Inmueble'}
                    </h4>

                    <div class="mt-2 space-y-1 text-xs text-slate-500">
                      <p class="flex items-center gap-1.5 truncate">
                        <i data-lucide="user" class="w-3.5 h-3.5 text-slate-400"></i>
                        <span>Cliente: <strong class="text-slate-800 dark:text-slate-200">${cnt ? Formatters.escapeHTML(cnt.name) : 'N/A'}</strong></span>
                      </p>
                      <p class="flex items-center gap-1.5 truncate">
                        <i data-lucide="briefcase" class="w-3.5 h-3.5 text-slate-400"></i>
                        <span>Asesor: <strong class="text-slate-700 dark:text-slate-300">${ag ? Formatters.escapeHTML(ag.name) : 'Rodrigo Hernández'}</strong></span>
                      </p>
                      <p class="flex items-center gap-1.5 truncate text-[11px] text-slate-400">
                        <i data-lucide="${isVirtual ? 'link' : 'map-pin'}" class="w-3.5 h-3.5 text-slate-400"></i>
                        <span class="truncate">${v.location || (prop ? prop.neighborhood : 'Por coordinar')}</span>
                      </p>
                    </div>
                  </div>

                  ${cnt && cnt.whatsapp ? `
                    <a href="https://wa.me/${cnt.whatsapp}?text=${waMsg}" target="_blank" class="mt-3 inline-flex items-center justify-center gap-1.5 w-full text-xs font-semibold py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
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

    if (window.lucide) window.lucide.createIcons();

    initMonthlyChart(metrics);
    initPropertyTypeChart(metrics);
  }

  function initMonthlyChart(metrics) {
    const canvas = document.getElementById('chart-monthly-2026');
    if (!canvas || !window.Chart) return;
    if (monthlyChartInstance) monthlyChartInstance.destroy();

    const isDark = document.documentElement.classList.contains('dark');
    monthlyChartInstance = new window.Chart(canvas, {
      type: 'bar',
      data: {
        labels: metrics.monthlyBreakdown.map(m => m.monthName),
        datasets: [
          {
            label: `Ventas ${metrics.year}`,
            data: metrics.monthlyBreakdown.map(m => m.amount),
            backgroundColor: '#2563eb',
            borderRadius: 6
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
              label: (ctx) => `Ventas: $ ${(ctx.parsed.y || 0).toLocaleString('es-CO')}`
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            ticks: {
              callback: (v) => v >= 1000000000 ? (v/1000000000).toFixed(1) + 'B' : (v >= 1000000 ? (v/1000000).toFixed(0) + 'M' : v)
            }
          }
        }
      }
    });
  }

  function initPropertyTypeChart(metrics) {
    const canvas = document.getElementById('chart-property-type');
    if (!canvas || !window.Chart) return;
    if (propertyTypeChartInstance) propertyTypeChartInstance.destroy();

    const labels = Object.keys(metrics.typeDistribution);
    const data = Object.values(metrics.typeDistribution);
    const colors = labels.map((type, idx) => getPropertyColor(type, idx));
    const isDark = document.documentElement.classList.contains('dark');

    propertyTypeChartInstance = new window.Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: isDark ? '#1e293b' : '#ffffff',
          borderWidth: 2,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: $ ${(ctx.parsed || 0).toLocaleString('es-CO')}`
            }
          }
        }
      }
    });
  }

  // ==================================================================
  // 6. COMPONENTE: PIPELINE / KANBAN COMPACTO Y BIEN SEPARADO
  // ==================================================================
  let pipelineFilter = { search: '', agentId: 'all', priority: 'all' };
  const STAGES = [
    { id: 'prospecto', name: 'Prospecto / Lead', color: 'border-slate-300 dark:border-slate-700', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    { id: 'calificado', name: 'Calificado', color: 'border-blue-300 dark:border-blue-700', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    { id: 'visita_agendada', name: 'Visita Agendada', color: 'border-indigo-300 dark:border-indigo-700', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' },
    { id: 'negociacion', name: 'En Negociación', color: 'border-amber-300 dark:border-amber-700', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    { id: 'promesa', name: 'Promesa de Venta', color: 'border-teal-300 dark:border-teal-700', badge: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300' },
    { id: 'ganada', name: 'Cierre Ganado 🎉', color: 'border-emerald-300 dark:border-emerald-700', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' }
  ];

  function renderPipeline(containerId = 'content-area') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const deals = store.getDeals();
    const agents = store.getAgents();
    const settings = store.getSettings();
    const contacts = store.getContacts();
    const properties = store.getProperties();

    const filtered = deals.filter(d => {
      const matchSearch = !pipelineFilter.search || d.title.toLowerCase().includes(pipelineFilter.search.toLowerCase());
      const matchAgent = pipelineFilter.agentId === 'all' || d.agentId === pipelineFilter.agentId;
      const matchPri = pipelineFilter.priority === 'all' || d.priority === pipelineFilter.priority;
      return matchSearch && matchAgent && matchPri;
    });

    container.innerHTML = `
      <div class="space-y-6">
        <!-- HEADER KANBAN -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Embudo de Oportunidades</h1>
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                ${filtered.length} oportunidades
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">Arrastra las tarjetas entre columnas para actualizar el estado del negocio</p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <input type="text" id="pipe-search" placeholder="Buscar negocio..." value="${Formatters.escapeHTML(pipelineFilter.search)}" class="text-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
            <select id="pipe-agent" class="text-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
              <option value="all">Todos los usuarios</option>
              ${agents.map(a => `<option value="${a.id}" ${pipelineFilter.agentId === a.id ? 'selected' : ''}>${Formatters.escapeHTML(a.name)}</option>`).join('')}
            </select>
            <button id="btn-add-deal" class="px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5 transition-colors">
              <i data-lucide="plus" class="w-4 h-4"></i> Nueva Oportunidad
            </button>
          </div>
        </div>

        <!-- COLUMNAS KANBAN CON TARJETAS SEPARADAS Y COMPACTAS (SCROLL HORIZONTAL NATURAL) -->
        <div class="kanban-board-scroll">
          ${STAGES.map(stage => {
            const stageDeals = filtered.filter(d => d.stage === stage.id);
            const total = stageDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
            return `
              <div class="kanban-stage-col flex flex-col bg-slate-50/90 dark:bg-slate-900/60 rounded-2xl border ${stage.color} p-3.5 shadow-sm">
                <!-- Header Columna -->
                <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
                  <h3 class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    ${stage.name}
                    <span class="w-5 h-5 rounded-full ${stage.badge} text-[10px] font-bold flex items-center justify-center">${stageDeals.length}</span>
                  </h3>
                </div>
                <div class="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-3">${Formatters.formatCurrency(total, settings.currency)}</div>

                <!-- Contenedor con espaciado vertical estricto (gap: 12px) -->
                <div class="kanban-column" data-stage="${stage.id}">
                  ${stageDeals.length === 0 ? `
                    <div class="py-6 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      Sin negocios
                    </div>
                  ` : stageDeals.map(d => {
                    const c = contacts.find(cnt => cnt.id === d.contactId);
                    const p = properties.find(pr => pr.id === d.propertyId);
                    return `
                      <div class="kanban-card" draggable="true" data-deal-id="${d.id}">
                        <!-- Fila 1: Prioridad y Menú -->
                        <div class="flex items-center justify-between mb-1.5">
                          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            d.priority === 'Alta' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200' :
                            d.priority === 'Media' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200' :
                            'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }">
                            ${d.priority || 'Normal'}
                          </span>
                          <button class="btn-edit-deal text-slate-400 hover:text-blue-600 p-1" data-deal-id="${d.id}" title="Editar oportunidad">
                            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                          </button>
                        </div>

                        <!-- Fila 2: Título (compacto, max 2 líneas) -->
                        <h4 class="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug mb-1">
                          ${Formatters.escapeHTML(d.title)}
                        </h4>

                        <!-- Fila 3: Valor Destacado -->
                        <div class="text-sm font-black text-blue-600 dark:text-blue-400 mb-1.5">
                          ${Formatters.formatCurrency(d.amount, settings.currency)}
                        </div>

                        <!-- Fila 4: Inmueble o Cliente en una sola línea -->
                        ${p || c ? `
                          <div class="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 truncate mb-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                            ${p ? `<span class="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-medium">🏡 ${Formatters.escapeHTML(p.code)}</span>` : ''}
                            ${c ? `<span class="truncate">👤 ${Formatters.escapeHTML(c.name.split(' ')[0])}</span>` : ''}
                          </div>
                        ` : ''}

                        <!-- Fila 5: Pie con fecha / botón ver -->
                        <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span>${d.expectedCloseDate ? d.expectedCloseDate.substring(5) : 'Pendiente'}</span>
                          <button class="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold cursor-pointer btn-edit-deal" data-deal-id="${d.id}">Ver</button>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      <div id="modal-deal-container"></div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Eventos
    const searchInp = document.getElementById('pipe-search');
    if (searchInp) {
      searchInp.addEventListener('input', (e) => {
        pipelineFilter.search = e.target.value;
        renderPipeline(containerId);
      });
    }

    const agentSel = document.getElementById('pipe-agent');
    if (agentSel) {
      agentSel.addEventListener('change', (e) => {
        pipelineFilter.agentId = e.target.value;
        renderPipeline(containerId);
      });
    }

    const addBtn = document.getElementById('btn-add-deal');
    if (addBtn) {
      addBtn.addEventListener('click', () => openDealModal(null, containerId));
    }

    document.querySelectorAll('.btn-edit-deal').forEach(b => {
      b.addEventListener('click', () => openDealModal(b.getAttribute('data-deal-id'), containerId));
    });

    // Drag & Drop
    document.querySelectorAll('.kanban-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', card.getAttribute('data-deal-id'));
      });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
    });

    document.querySelectorAll('.kanban-column').forEach(col => {
      col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('drag-over'); });
      col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
      col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.classList.remove('drag-over');
        const dealId = e.dataTransfer.getData('text/plain');
        const newStage = col.getAttribute('data-stage');
        if (dealId && newStage) {
          store.updateDealStage(dealId, newStage);
          if (newStage === 'ganada' && window.confetti) {
            window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          }
          renderPipeline(containerId);
        }
      });
    });
  }

  function openDealModal(dealId = null, containerId = 'content-area') {
    const modalContainer = document.getElementById('modal-deal-container');
    if (!modalContainer) return;
    const deal = dealId ? store.getDeal(dealId) : null;
    const agents = store.getAgents();
    const contacts = store.getContacts();
    const properties = store.getProperties();

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 modal-backdrop">
        <div class="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative">
          <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-700">
            <h3 class="text-base font-bold text-slate-900 dark:text-white">
              ${deal ? 'Editar Oportunidad' : 'Nueva Oportunidad'}
            </h3>
            <button onclick="document.getElementById('modal-deal-container').innerHTML=''" class="text-slate-400">✕</button>
          </div>
          <form id="form-deal" class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold mb-1">Título del Negocio *</label>
              <input type="text" name="title" required value="${deal ? Formatters.escapeHTML(deal.title) : ''}" placeholder="Ej. Venta Apartamento Rosales" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-semibold mb-1">Valor del Negocio ($) *</label>
                <input type="number" name="amount" required value="${deal ? deal.amount : ''}" placeholder="Ej. 650000000" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
              </div>
              <div>
                <label class="block font-semibold mb-1">Fase del Embudo</label>
                <select name="stage" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                  ${STAGES.map(s => `<option value="${s.id}" ${deal && deal.stage === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-semibold mb-1">Cliente</label>
                <select name="contactId" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <option value="">Seleccionar cliente...</option>
                  ${contacts.map(c => `<option value="${c.id}" ${deal && deal.contactId === c.id ? 'selected' : ''}>${Formatters.escapeHTML(c.name)}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="block font-semibold mb-1">Inmueble</label>
                <select name="propertyId" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <option value="">Seleccionar inmueble...</option>
                  ${properties.map(p => `<option value="${p.id}" ${deal && deal.propertyId === p.id ? 'selected' : ''}>${Formatters.escapeHTML(p.code)} - ${Formatters.escapeHTML(p.title)}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-semibold mb-1">Asesor Asignado</label>
                <select name="agentId" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                  ${agents.map(a => `<option value="${a.id}" ${deal && deal.agentId === a.id ? 'selected' : ''}>${Formatters.escapeHTML(a.name)}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="block font-semibold mb-1">Prioridad</label>
                <select name="priority" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <option value="Alta" ${deal && deal.priority === 'Alta' ? 'selected' : ''}>Alta</option>
                  <option value="Media" ${!deal || deal.priority === 'Media' ? 'selected' : ''}>Media</option>
                  <option value="Baja" ${deal && deal.priority === 'Baja' ? 'selected' : ''}>Baja</option>
                </select>
              </div>
            </div>
            <div class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
              ${deal ? `
                <button type="button" id="btn-del-deal" class="text-xs font-semibold text-rose-500">Eliminar</button>
              ` : '<span></span>'}
              <div class="flex gap-2">
                <button type="button" onclick="document.getElementById('modal-deal-container').innerHTML=''" class="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">Cancelar</button>
                <button type="submit" class="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold">Guardar</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;

    const delBtn = document.getElementById('btn-del-deal');
    if (delBtn && dealId) {
      delBtn.addEventListener('click', () => {
        if (confirm('¿Eliminar esta oportunidad?')) {
          store.deleteDeal(dealId);
          modalContainer.innerHTML = '';
          renderPipeline(containerId);
        }
      });
    }

    document.getElementById('form-deal').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = {
        id: dealId || Formatters.generateId('deal'),
        title: fd.get('title'),
        amount: Number(fd.get('amount')) || 0,
        stage: fd.get('stage'),
        contactId: fd.get('contactId') || null,
        propertyId: fd.get('propertyId') || null,
        agentId: fd.get('agentId') || agents[0].id,
        priority: fd.get('priority') || 'Media',
        expectedCloseDate: '2026-11-30'
      };
      if (data.stage === 'ganada') store.updateDealStage(data.id, 'ganada');
      else store.saveDeal(data);
      modalContainer.innerHTML = '';
      renderPipeline(containerId);
    });
  }

  // ==================================================================
  // 7. COMPONENTE: INMUEBLES CON ARRASTRE DE FOTOS DESDE CARPETA
  // ==================================================================
  function renderProperties(containerId = 'content-area') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const props = store.getProperties();
    const settings = store.getSettings();

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Inventario de Propiedades</h1>
            <p class="text-xs text-slate-500 mt-0.5">Catálogo activo de inmuebles para venta y renta</p>
          </div>
          <button id="btn-add-prop" class="px-3.5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm flex items-center gap-1.5 transition-colors">
            <i data-lucide="plus" class="w-4 h-4"></i> Publicar Inmueble con Fotos
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${props.map(p => `
            <div class="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm hover-lift flex flex-col justify-between">
              <div class="relative h-48 w-full overflow-hidden">
                <img src="${p.images && p.images[0] ? p.images[0] : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'}" class="w-full h-full object-cover">
                <span class="absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">${p.status}</span>
                <span class="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-white">${p.code}</span>
              </div>
              <div class="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 class="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">${Formatters.escapeHTML(p.title)}</h3>
                  <div class="text-xs text-slate-400 mt-1">${p.neighborhood || p.city}</div>
                  <div class="text-base font-extrabold text-blue-600 dark:text-blue-400 mt-2">
                    ${Formatters.formatCurrency(p.price, settings.currency)}
                  </div>
                  <div class="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 dark:border-slate-700 text-center text-xs mt-3">
                    <div><span class="font-bold">${p.area}</span> m²</div>
                    <div><span class="font-bold">${p.bedrooms || 0}</span> habs</div>
                    <div><span class="font-bold">${p.bathrooms || 0}</span> baños</div>
                  </div>
                </div>
                <div class="pt-3 flex items-center gap-2">
                  <button class="btn-match-c flex-1 py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs transition-colors" data-prop-id="${p.id}">
                    Emparejar Clientes
                  </button>
                  <button onclick="window.print()" class="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600" title="Imprimir Ficha">
                    <i data-lucide="printer" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div id="modal-prop-container"></div>
    `;

    if (window.lucide) window.lucide.createIcons();

    document.querySelectorAll('.btn-match-c').forEach(b => {
      b.addEventListener('click', () => openMatchingModal(b.getAttribute('data-prop-id')));
    });

    const addBtn = document.getElementById('btn-add-prop');
    if (addBtn) addBtn.addEventListener('click', () => openPropModal(null, containerId));
  }

  function openMatchingModal(propId) {
    const prop = store.getProperty(propId);
    const contacts = store.getContacts();
    const settings = store.getSettings();
    const container = document.getElementById('modal-prop-container');
    if (!container || !prop) return;

    const matches = contacts.filter(c => c.budgetMax && c.budgetMax >= prop.price * 0.85);

    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 modal-backdrop">
        <div class="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i data-lucide="sparkles" class="w-4 h-4 text-amber-500"></i> Cruce con Clientes
            </h3>
            <button onclick="document.getElementById('modal-prop-container').innerHTML=''" class="text-slate-400">✕</button>
          </div>
          <div class="mt-3 space-y-2 text-xs max-h-72 overflow-y-auto">
            ${matches.length === 0 ? '<p class="text-slate-400 py-4 text-center">No hay compradores con presupuesto afín.</p>' : matches.map(m => `
              <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 flex items-center justify-between">
                <div>
                  <div class="font-bold text-slate-900 dark:text-white">${Formatters.escapeHTML(m.name)}</div>
                  <div class="text-[11px] text-slate-500">Presupuesto: ${Formatters.formatCurrency(m.budgetMax, settings.currency)}</div>
                </div>
                ${m.whatsapp ? `
                  <a href="https://wa.me/${m.whatsapp}?text=Hola%20${encodeURIComponent(m.name)},%20te%20comparto%20el%20inmueble%20${encodeURIComponent(prop.title)}%20(${Formatters.formatCurrency(prop.price, settings.currency)})." target="_blank" class="p-2 rounded-xl bg-emerald-600 text-white font-bold">
                    WhatsApp
                  </a>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  // MODAL CREAR INMUEBLE CON ARRASTRE DE FOTOS DESDE CARPETA
  function openPropModal(propId = null, containerId = 'content-area') {
    const container = document.getElementById('modal-prop-container');
    if (!container) return;

    let uploadedImages = [];

    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 modal-backdrop overflow-y-auto">
        <div class="bg-white dark:bg-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative my-8">
          <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-700">
            <h3 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i data-lucide="home" class="w-5 h-5 text-teal-600"></i> Registrar Nuevo Inmueble
            </h3>
            <button onclick="document.getElementById('modal-prop-container').innerHTML=''" class="text-slate-400">✕</button>
          </div>

          <form id="form-prop" class="space-y-3.5 text-xs">
            <div>
              <label class="block font-semibold mb-1">Título del Inmueble *</label>
              <input type="text" name="title" required placeholder="Ej. Apto Vista Panorámica El Poblado" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold mb-1">Precio de Venta ($) *</label>
                <input type="number" name="price" required placeholder="Ej. 750000000" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold">
              </div>
              <div>
                <label class="block font-semibold mb-1">Área Construida (m²)</label>
                <input type="number" name="area" value="120" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block font-semibold mb-1">Tipo</label>
                <select name="type" class="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <option value="Apartamento">Apartamento</option>
                  <option value="Casa Campestre">Casa Campestre</option>
                  <option value="Penthouse">Penthouse</option>
                  <option value="Local Comercial">Local Comercial</option>
                  <option value="Lote / Terreno">Lote / Terreno</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold mb-1">Habitaciones</label>
                <input type="number" name="bedrooms" value="3" class="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
              </div>
              <div>
                <label class="block font-semibold mb-1">Baños</label>
                <input type="number" name="bathrooms" value="2" class="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold mb-1">Ciudad</label>
                <input type="text" name="city" value="Medellín" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
              </div>
              <div>
                <label class="block font-semibold mb-1">Barrio / Sector</label>
                <input type="text" name="neighborhood" placeholder="Ej. El Poblado" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
              </div>
            </div>

            <!-- ZONA DE ARRASTRE Y SUBIDA DE FOTOS -->
            <div>
              <label class="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                Fotos del Inmueble (Arrastra desde tu carpeta o selecciona)
              </label>
              
              <div id="photo-dropzone" class="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-teal-500 rounded-2xl p-5 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
                <i data-lucide="image-plus" class="w-8 h-8 text-teal-600 mx-auto mb-2"></i>
                <p class="font-bold text-slate-700 dark:text-slate-300 text-xs">
                  Arrastra aquí las fotos desde cualquier carpeta de tu computador
                </p>
                <p class="text-[11px] text-slate-400 mt-1">o haz clic aquí para seleccionar archivos (JPG, PNG, WEBP)</p>
                <input type="file" id="prop-file-input" multiple accept="image/*" class="hidden">
              </div>

              <!-- Galería de Miniaturas Subidas -->
              <div id="photos-preview-grid" class="grid grid-cols-4 gap-2 mt-3"></div>
            </div>

            <div>
              <label class="block font-semibold mb-1">Descripción</label>
              <textarea name="description" rows="2" placeholder="Detalles de acabados, comodidades, zona social..." class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"></textarea>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button type="button" onclick="document.getElementById('modal-prop-container').innerHTML=''" class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">Cancelar</button>
              <button type="submit" class="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold">Publicar Inmueble</button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Lógica Drag & Drop y File Input
    const dropzone = document.getElementById('photo-dropzone');
    const fileInput = document.getElementById('prop-file-input');
    const previewGrid = document.getElementById('photos-preview-grid');

    const updatePreview = () => {
      previewGrid.innerHTML = uploadedImages.map((imgSrc, idx) => `
        <div class="relative group h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <img src="${imgSrc}" class="w-full h-full object-cover">
          <button type="button" class="btn-remove-photo absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold" data-idx="${idx}">
            ✕
          </button>
        </div>
      `).join('');

      document.querySelectorAll('.btn-remove-photo').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const i = Number(btn.getAttribute('data-idx'));
          uploadedImages.splice(i, 1);
          updatePreview();
        });
      });
    };

    const processFiles = (files) => {
      Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadedImages.push(e.target.result);
          updatePreview();
        };
        reader.readAsDataURL(file);
      });
    };

    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => processFiles(e.target.files));

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('border-teal-500', 'bg-teal-50/20');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('border-teal-500', 'bg-teal-50/20');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('border-teal-500', 'bg-teal-50/20');
      if (e.dataTransfer.files && e.dataTransfer.files.length) {
        processFiles(e.dataTransfer.files);
      }
    });

    document.getElementById('form-prop').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const agents = store.getAgents();

      store.saveProperty({
        id: Formatters.generateId('prop'),
        code: 'ERK-' + Math.floor(100 + Math.random() * 900),
        title: fd.get('title'),
        price: Number(fd.get('price')) || 0,
        area: Number(fd.get('area')) || 100,
        type: fd.get('type') || 'Apartamento',
        bedrooms: Number(fd.get('bedrooms')) || 3,
        bathrooms: Number(fd.get('bathrooms')) || 2,
        city: fd.get('city') || 'Medellín',
        neighborhood: fd.get('neighborhood') || '',
        description: fd.get('description') || '',
        status: 'Disponible',
        agentId: agents[0].id,
        images: uploadedImages.length ? uploadedImages : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800']
      });

      container.innerHTML = '';
      renderProperties(containerId);
    });
  }

  // ==================================================================
  // 8. COMPONENTE: CONTACTOS
  // ==================================================================
  function renderContacts(containerId = 'content-area') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const contacts = store.getContacts();
    const settings = store.getSettings();

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Directorio de Contactos</h1>
            <p class="text-xs text-slate-500 mt-0.5">Compradores, propietarios e inversionistas</p>
          </div>
          <button id="btn-add-contact" class="px-3.5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm flex items-center gap-1.5 transition-colors">
            <i data-lucide="user-plus" class="w-4 h-4"></i> Nuevo Contacto
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${contacts.map(c => `
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover-lift flex flex-col justify-between">
              <div>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">${c.type}</span>
                <h3 class="text-base font-bold text-slate-900 dark:text-white mt-2">${Formatters.escapeHTML(c.name)}</h3>
                <div class="text-xs text-slate-400 mt-1">${c.phone || ''}</div>
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700 text-xs mt-3 space-y-1">
                  <div>Presupuesto: <strong>${c.budgetMax ? Formatters.formatCurrency(c.budgetMax, settings.currency) : 'N/A'}</strong></div>
                  <div>Busca: <strong>${c.preferredType || 'Cualquiera'}</strong></div>
                </div>
              </div>
              <div class="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-700 mt-4">
                ${c.whatsapp ? `
                  <a href="https://wa.me/${c.whatsapp}?text=Hola%20${encodeURIComponent(c.name)},%20te%20contacto%20de%20Inmobiliaria%20Erkro." target="_blank" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5">
                    <i data-lucide="message-circle" class="w-3.5 h-3.5"></i> WhatsApp
                  </a>
                ` : '<span></span>'}
                <button class="btn-del-contact text-xs text-rose-500 font-semibold" data-cnt-id="${c.id}">Eliminar</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div id="modal-cnt-container"></div>
    `;

    if (window.lucide) window.lucide.createIcons();

    document.querySelectorAll('.btn-del-contact').forEach(b => {
      b.addEventListener('click', () => {
        if (confirm('¿Eliminar contacto?')) {
          store.deleteContact(b.getAttribute('data-cnt-id'));
          renderContacts(containerId);
        }
      });
    });

    const addBtn = document.getElementById('btn-add-contact');
    if (addBtn) addBtn.addEventListener('click', () => openContactModal(null, containerId));
  }

  function openContactModal(cntId = null, containerId = 'content-area') {
    const container = document.getElementById('modal-cnt-container');
    if (!container) return;

    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 modal-backdrop">
        <div class="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4">Nuevo Contacto</h3>
          <form id="form-cnt" class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold mb-1">Nombre Completo *</label>
              <input type="text" name="name" required placeholder="Ej. Juan Pérez" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-semibold mb-1">WhatsApp</label>
                <input type="text" name="whatsapp" placeholder="573001234567" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
              </div>
              <div>
                <label class="block font-semibold mb-1">Presupuesto ($)</label>
                <input type="number" name="budgetMax" placeholder="700000000" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
              </div>
            </div>
            <div class="flex items-center justify-end gap-2 pt-4">
              <button type="button" onclick="document.getElementById('modal-cnt-container').innerHTML=''" class="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 font-semibold">Cancelar</button>
              <button type="submit" class="px-4 py-1.5 rounded-xl bg-purple-600 text-white font-bold">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('form-cnt').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      store.saveContact({
        id: Formatters.generateId('cnt'),
        name: fd.get('name'),
        type: 'Comprador',
        whatsapp: fd.get('whatsapp') ? fd.get('whatsapp').replace(/[^0-9]/g, '') : '',
        budgetMax: Number(fd.get('budgetMax')) || 0,
        city: 'Medellín'
      });
      container.innerHTML = '';
      renderContacts(containerId);
    });
  }

  // ==================================================================
  // 9. COMPONENTE: AGENDA DE VISITAS INMOBILIARIAS (PRESENCIAL / VIRTUAL)
  // ==================================================================
  let visitsFilter = { status: 'all', modality: 'all', search: '' };

  function renderVisits(containerId = 'content-area') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const visits = store.getVisits();
    const props = store.getProperties();
    const contacts = store.getContacts();
    const agents = store.getAgents();
    const settings = store.getSettings();

    // Filtrar visitas
    const filteredVisits = visits.filter(v => {
      const vModality = v.modality || 'Presencial';
      const matchStatus = visitsFilter.status === 'all' || v.status === visitsFilter.status;
      const matchModality = visitsFilter.modality === 'all' || vModality === visitsFilter.modality;
      
      let matchSearch = true;
      if (visitsFilter.search) {
        const q = visitsFilter.search.toLowerCase();
        const p = props.find(pr => pr.id === v.propertyId);
        const c = contacts.find(cn => cn.id === v.contactId);
        const a = agents.find(ag => ag.id === v.agentId);
        const pText = p ? `${p.code} ${p.title} ${p.neighborhood}`.toLowerCase() : '';
        const cText = c ? `${c.name} ${c.phone}`.toLowerCase() : '';
        const aText = a ? `${a.name}`.toLowerCase() : '';
        matchSearch = pText.includes(q) || cText.includes(q) || aText.includes(q) || (v.notes && v.notes.toLowerCase().includes(q)) || (v.location && v.location.toLowerCase().includes(q));
      }
      return matchStatus && matchModality && matchSearch;
    }).sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`) - new Date(`${a.date}T${a.time || '00:00'}`));

    const pendingCount = visits.filter(v => v.status === 'Programada' || v.status === 'Confirmada').length;

    container.innerHTML = `
      <div class="space-y-6">
        <!-- HEADER PRINCIPAL -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Agenda de Visitas Inmobiliarias</h1>
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                ${pendingCount} pendientes
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">Control de citas con clientes, verificación de inmuebles, asesor asignado y modalidad (Virtual o Presencial)</p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <button id="btn-add-visit" class="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2 transition-colors cursor-pointer">
              <i data-lucide="calendar-plus" class="w-4 h-4"></i> Agendar Nueva Visita
            </button>
          </div>
        </div>

        <!-- BARRA DE FILTROS Y BÚSQUEDA -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-xs">
          <!-- Búsqueda rápida -->
          <div class="relative flex-1 max-w-sm">
            <input type="text" id="vis-search" placeholder="Buscar por inmueble, cliente o asesor..." value="${Formatters.escapeHTML(visitsFilter.search)}" class="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
            <span class="absolute left-2.5 top-2 text-slate-400">🔍</span>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <!-- Filtro Modalidad: Todas / Presencial / Virtual -->
            <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button class="btn-filter-mod px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${visitsFilter.modality === 'all' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs' : 'text-slate-500'}" data-mod="all">Todas</button>
              <button class="btn-filter-mod px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${visitsFilter.modality === 'Presencial' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs' : 'text-slate-500'}" data-mod="Presencial">🏢 Presenciales</button>
              <button class="btn-filter-mod px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${visitsFilter.modality === 'Virtual' ? 'bg-white dark:bg-slate-800 text-purple-600 shadow-xs' : 'text-slate-500'}" data-mod="Virtual">💻 Virtuales</button>
            </div>

            <!-- Filtro Estado -->
            <select id="vis-status-filter" class="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium cursor-pointer">
              <option value="all" ${visitsFilter.status === 'all' ? 'selected' : ''}>Todos los estados</option>
              <option value="Programada" ${visitsFilter.status === 'Programada' ? 'selected' : ''}>Programada</option>
              <option value="Confirmada" ${visitsFilter.status === 'Confirmada' ? 'selected' : ''}>Confirmada</option>
              <option value="Realizada" ${visitsFilter.status === 'Realizada' ? 'selected' : ''}>Realizada</option>
              <option value="Cancelada" ${visitsFilter.status === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
            </select>
          </div>
        </div>

        <!-- CUADRÍCULA DE TARJETAS DE VISITAS DETALLADAS -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          ${filteredVisits.length === 0 ? `
            <div class="col-span-full py-16 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400">
              <i data-lucide="calendar" class="w-12 h-12 mx-auto text-slate-300 mb-2"></i>
              <p class="text-sm font-bold text-slate-700 dark:text-slate-300">No hay visitas agendadas con los filtros seleccionados.</p>
              <p class="text-xs text-slate-400 mt-1">Haz clic en "Agendar Nueva Visita" para programar una cita con un cliente.</p>
            </div>
          ` : filteredVisits.map(v => {
            const p = props.find(pr => pr.id === v.propertyId);
            const c = contacts.find(cn => cn.id === v.contactId);
            const a = agents.find(ag => ag.id === v.agentId) || agents[0];
            const isVirtual = (v.modality || 'Presencial') === 'Virtual';

            const statusColors = {
              'Programada': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
              'Confirmada': 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
              'Realizada': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
              'Cancelada': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
            }[v.status] || 'bg-slate-100 text-slate-700 border-slate-200';

            // Mensaje completo para WhatsApp
            const waMsg = encodeURIComponent(
              `🏡 *Confirmación de Cita Inmobiliaria - Inmobiliaria Erkro*\n\n` +
              `Hola ${c ? c.name : 'Estimado cliente'}, te saluda ${a ? a.name : 'tu asesor'} de Inmobiliaria Erkro.\n\n` +
              `Te confirmo los detalles de nuestra cita agendada:\n` +
              `• *Inmueble:* ${p ? `${p.title} (${p.code})` : 'Inmueble Erkro'}\n` +
              `• *Modalidad:* ${isVirtual ? '💻 Visita Virtual (Videollamada / Tour 360°)' : '🏢 Visita Presencial'}\n` +
              `• *Fecha:* ${v.date}\n` +
              `• *Hora:* ${v.time || '10:30'} ${v.duration ? `(${v.duration})` : ''}\n` +
              `• *${isVirtual ? 'Enlace de Reunión' : 'Punto de Encuentro'}:* ${v.location || (p ? p.address : 'Coordinar con asesor')}\n` +
              `• *Asesor Comercial:* ${a ? a.name : 'Rodrigo Hernández'}\n\n` +
              `¿Nos confirmas tu asistencia? ¡Quedamos atentos!`
            );

            return `
              <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover-lift flex flex-col justify-between transition-all">
                <div class="space-y-3.5">
                  <!-- FILA 1: MODALIDAD, ESTADO & GESTIÓN -->
                  <div class="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                    <div class="flex flex-wrap items-center gap-2">
                      <!-- Badge Modalidad: Virtual vs Presencial -->
                      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        isVirtual 
                          ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800' 
                          : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                      }">
                        ${isVirtual ? '💻 Visita Virtual (Online)' : '🏢 Visita Presencial'}
                      </span>

                      <!-- Badge Estado -->
                      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statusColors}">
                        ${v.status || 'Programada'}
                      </span>
                    </div>

                    <!-- Botón Editar Visita -->
                    <button class="btn-edit-vis p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer" data-vis-id="${v.id}" title="Editar cita o registrar bitácora">
                      <i data-lucide="edit-3" class="w-4 h-4"></i>
                    </button>
                  </div>

                  <!-- FILA 2: FECHA Y HORA DESTACADA -->
                  <div class="flex items-center gap-4 text-xs font-bold text-slate-800 dark:text-slate-100">
                    <span class="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <i data-lucide="calendar" class="w-4 h-4"></i> ${v.date}
                    </span>
                    <span class="flex items-center gap-1.5">
                      <i data-lucide="clock" class="w-4 h-4 text-slate-400"></i> ${v.time || '10:00'} ${v.duration ? `<span class="text-slate-400 font-normal">(${v.duration})</span>` : ''}
                    </span>
                  </div>

                  <!-- FILA 3: FICHA DEL INMUEBLE -->
                  <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                    <img src="${p && p.images && p.images[0] ? p.images[0] : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200'}" alt="Inmueble" class="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700">
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                        <span>🏡 ${p ? p.code : 'INMUEBLE'}</span>
                        <span class="text-slate-400">•</span>
                        <span class="text-slate-500">${p ? p.type : ''}</span>
                      </div>
                      <h4 class="text-xs font-bold text-slate-900 dark:text-white truncate">
                        ${p ? Formatters.escapeHTML(p.title) : 'Inmueble no asignado'}
                      </h4>
                      <div class="text-[11px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                        ${p ? `${p.neighborhood || p.city} • ${Formatters.formatCurrency(p.price, settings.currency)}` : ''}
                      </div>
                    </div>
                  </div>

                  <!-- FILA 4: CLIENTE Y ASESOR EN CUADRICULA -->
                  <div class="grid grid-cols-2 gap-3 text-xs">
                    <!-- Cliente -->
                    <div class="p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <div class="text-[10px] font-bold text-slate-400 uppercase">Cliente / Prospecto</div>
                      <div class="font-bold text-slate-900 dark:text-white truncate mt-0.5">${c ? Formatters.escapeHTML(c.name) : 'Sin cliente'}</div>
                      <div class="text-[11px] text-slate-400 truncate">${c && c.phone ? c.phone : 'Sin teléfono'}</div>
                    </div>

                    <!-- Asesor Comercial -->
                    <div class="p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <div class="text-[10px] font-bold text-slate-400 uppercase">Asesor Asignado</div>
                      <div class="flex items-center gap-1.5 mt-0.5 truncate">
                        <img src="${a && a.avatar ? a.avatar : 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100'}" class="w-4 h-4 rounded-full object-cover">
                        <span class="font-bold text-slate-900 dark:text-white truncate">${a ? Formatters.escapeHTML(a.name) : 'Rodrigo Hernández'}</span>
                      </div>
                      <div class="text-[11px] text-slate-400 truncate">${a ? a.role : 'Director Inmobiliario'}</div>
                    </div>
                  </div>

                  <!-- FILA 5: UBICACIÓN O ENLACE VIRTUAL -->
                  <div class="text-xs">
                    ${isVirtual ? `
                      <div class="p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/60 flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2 truncate text-purple-700 dark:text-purple-300">
                          <i data-lucide="video" class="w-4 h-4 flex-shrink-0"></i>
                          <span class="truncate font-semibold">${v.location ? Formatters.escapeHTML(v.location) : 'Videollamada por coordinar'}</span>
                        </div>
                        ${v.location && v.location.startsWith('http') ? `
                          <a href="${v.location}" target="_blank" class="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] flex-shrink-0">
                            Abrir Link
                          </a>
                        ` : ''}
                      </div>
                    ` : `
                      <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700 flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <i data-lucide="map-pin" class="w-4 h-4 text-blue-600 flex-shrink-0"></i>
                        <span class="truncate font-medium">${v.location || (p ? p.address : 'Punto de encuentro en el inmueble')}</span>
                      </div>
                    `}
                  </div>

                  <!-- FILA 6: NOTAS / REQUERIMIENTOS PREVIOS -->
                  ${v.notes ? `
                    <div class="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                      <i data-lucide="info" class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5"></i>
                      <span><strong>Requerimientos:</strong> ${Formatters.escapeHTML(v.notes)}</span>
                    </div>
                  ` : ''}

                  <!-- FILA 7: FEEDBACK POST-VISITA (SI EXISTE) -->
                  ${v.feedback ? `
                    <div class="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 italic flex items-start gap-2">
                      <i data-lucide="message-square" class="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5"></i>
                      <span><strong>Resultado de la visita:</strong> "${Formatters.escapeHTML(v.feedback)}"</span>
                    </div>
                  ` : ''}
                </div>

                <!-- ACCIONES INFERIORES: WHATSAPP, MARCAR REALIZADA & EDITAR -->
                <div class="pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2 mt-4 text-xs">
                  ${c && c.whatsapp ? `
                    <a href="https://wa.me/${c.whatsapp}?text=${waMsg}" target="_blank" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition-colors">
                      <i data-lucide="message-circle" class="w-4 h-4"></i> Confirmar WhatsApp
                    </a>
                  ` : `
                    <span class="text-slate-400 text-[11px]">Sin WhatsApp</span>
                  `}

                  <div class="flex items-center gap-2">
                    ${v.status !== 'Realizada' ? `
                      <button class="btn-mark-done px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold transition-colors cursor-pointer" data-vis-id="${v.id}">
                        ✓ Realizada
                      </button>
                    ` : ''}
                    <button class="btn-edit-vis px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 font-bold transition-colors cursor-pointer" data-vis-id="${v.id}">
                      Gestionar
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      <div id="modal-vis-container"></div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Eventos de Filtro y Búsqueda
    const searchInp = document.getElementById('vis-search');
    if (searchInp) {
      searchInp.addEventListener('input', (e) => {
        visitsFilter.search = e.target.value;
        renderVisits(containerId);
      });
    }

    const statusSel = document.getElementById('vis-status-filter');
    if (statusSel) {
      statusSel.addEventListener('change', (e) => {
        visitsFilter.status = e.target.value;
        renderVisits(containerId);
      });
    }

    document.querySelectorAll('.btn-filter-mod').forEach(b => {
      b.addEventListener('click', () => {
        visitsFilter.modality = b.getAttribute('data-mod');
        renderVisits(containerId);
      });
    });

    // Abrir Modal para Nueva Visita
    const addBtn = document.getElementById('btn-add-visit');
    if (addBtn) {
      addBtn.addEventListener('click', () => openVisitModal(null, containerId));
    }

    // Editar Visita
    document.querySelectorAll('.btn-edit-vis').forEach(b => {
      b.addEventListener('click', () => openVisitModal(b.getAttribute('data-vis-id'), containerId));
    });

    // Marcar como Realizada rápidamente
    document.querySelectorAll('.btn-mark-done').forEach(b => {
      b.addEventListener('click', () => {
        const vId = b.getAttribute('data-vis-id');
        const v = store.getVisit(vId);
        if (!v) return;
        const feedback = prompt('¿Qué impresiones dejó la visita con el cliente? (Bitácora):', v.feedback || 'Visita realizada satisfactoriamente con el cliente.');
        if (feedback !== null) {
          v.status = 'Realizada';
          v.feedback = feedback;
          store.saveVisit(v);
          renderVisits(containerId);
        }
      });
    });
  }

  // ==================================================================
  // MODAL COMPLETO DE AGENDAR / EDITAR VISITA (PRESENCIAL / VIRTUAL)
  // ==================================================================
  function openVisitModal(visitId = null, containerId = 'content-area') {
    const modalContainer = document.getElementById('modal-vis-container');
    if (!modalContainer) return;

    const vis = visitId ? store.getVisit(visitId) : null;
    const properties = store.getProperties();
    const contacts = store.getContacts();
    const agents = store.getAgents();

    if (!properties.length || !contacts.length) {
      alert('Debes tener registrado al menos un inmueble y un cliente para agendar una visita.');
      return;
    }

    const defaultProp = properties[0];
    const currentModality = vis ? (vModality(vis)) : 'Presencial';

    function vModality(v) {
      return v && v.modality ? v.modality : 'Presencial';
    }

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 modal-backdrop overflow-y-auto">
        <div class="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative my-8">
          <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-700">
            <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i data-lucide="calendar-plus" class="w-5 h-5 text-blue-600"></i>
              ${vis ? 'Editar / Gestionar Cita de Visita' : 'Agendar Nueva Visita Inmobiliaria'}
            </h3>
            <button onclick="document.getElementById('modal-vis-container').innerHTML=''" class="text-slate-400 hover:text-slate-600 p-1">✕</button>
          </div>

          <form id="form-visit-edit" class="space-y-3.5 text-xs">
            <!-- 1. MODALIDAD: VIRTUAL O PRESENCIAL (DESTACADA) -->
            <div>
              <label class="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Modalidad de la Cita *
              </label>
              <div class="grid grid-cols-2 gap-3">
                <label id="opt-presencial-label" class="flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  currentModality === 'Presencial' 
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold' 
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                }">
                  <input type="radio" name="modality" value="Presencial" ${currentModality === 'Presencial' ? 'checked' : ''} class="text-blue-600 focus:ring-blue-500">
                  <div>
                    <div class="flex items-center gap-1 font-bold">🏢 Presencial</div>
                    <div class="text-[10px] text-slate-400 font-normal">En el inmueble físico</div>
                  </div>
                </label>

                <label id="opt-virtual-label" class="flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  currentModality === 'Virtual' 
                    ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-bold' 
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                }">
                  <input type="radio" name="modality" value="Virtual" ${currentModality === 'Virtual' ? 'checked' : ''} class="text-purple-600 focus:ring-purple-500">
                  <div>
                    <div class="flex items-center gap-1 font-bold text-purple-600 dark:text-purple-400">💻 Virtual (Online)</div>
                    <div class="text-[10px] text-slate-400 font-normal">Videollamada / Tour 360°</div>
                  </div>
                </label>
              </div>
            </div>

            <!-- 2. INMUEBLE A VISITAR -->
            <div>
              <label class="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Inmueble a Visitar *
              </label>
              <select name="propertyId" id="vis-form-prop" required class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium">
                ${properties.map(p => `
                  <option value="${p.id}" ${vis && vis.propertyId === p.id ? 'selected' : ''} data-addr="${Formatters.escapeHTML(p.address || '')}">
                    [${p.code}] ${Formatters.escapeHTML(p.title)} - ${Formatters.formatCurrency(p.price, 'COP')}
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- 3. CLIENTE Y ASESOR -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Cliente / Prospecto *</label>
                <select name="contactId" required class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium">
                  ${contacts.map(c => `
                    <option value="${c.id}" ${vis && vis.contactId === c.id ? 'selected' : ''}>
                      ${Formatters.escapeHTML(c.name)} (${c.phone || 'Sin tel.'})
                    </option>
                  `).join('')}
                </select>
              </div>

              <div>
                <label class="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Asesor Responsable *</label>
                <select name="agentId" required class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium">
                  ${agents.map(a => `
                    <option value="${a.id}" ${vis && vis.agentId === a.id ? 'selected' : ''}>
                      ${Formatters.escapeHTML(a.name)} (${a.role})
                    </option>
                  `).join('')}
                </select>
              </div>
            </div>

            <!-- 4. FECHA, HORA Y DURACIÓN -->
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block font-semibold mb-1">Fecha *</label>
                <input type="date" name="date" required value="${vis ? vis.date : new Date().toISOString().split('T')[0]}" class="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
              </div>
              <div>
                <label class="block font-semibold mb-1">Hora *</label>
                <input type="time" name="time" required value="${vis ? vis.time : '10:30'}" class="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold">
              </div>
              <div>
                <label class="block font-semibold mb-1">Duración</label>
                <select name="duration" class="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <option value="30 min" ${vis && vis.duration === '30 min' ? 'selected' : ''}>30 min</option>
                  <option value="45 min" ${!vis || vis.duration === '45 min' ? 'selected' : ''}>45 min</option>
                  <option value="1 hora" ${vis && vis.duration === '1 hora' ? 'selected' : ''}>1 hora</option>
                  <option value="1.5 horas" ${vis && vis.duration === '1.5 horas' ? 'selected' : ''}>1.5 horas</option>
                </select>
              </div>
            </div>

            <!-- 5. UBICACIÓN / LINK REUNIÓN -->
            <div>
              <label id="lbl-location-text" class="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                ${currentModality === 'Virtual' ? 'Enlace de Videollamada (Meet / Zoom / WhatsApp Video) *' : 'Punto de Encuentro / Dirección Física *'}
              </label>
              <input type="text" id="inp-location" name="location" value="${vis ? Formatters.escapeHTML(vis.location || '') : (defaultProp.address || '')}" placeholder="${currentModality === 'Virtual' ? 'https://meet.google.com/...' : 'Ej. Carrera 32 # 2 Sur - 45, Portería Principal'}" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
            </div>

            <!-- 6. ESTADO Y REQUERIMIENTOS -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold mb-1">Estado de la Cita</label>
                <select name="status" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold">
                  <option value="Programada" ${!vis || vis.status === 'Programada' ? 'selected' : ''}>Programada</option>
                  <option value="Confirmada" ${vis && vis.status === 'Confirmada' ? 'selected' : ''}>Confirmada</option>
                  <option value="Realizada" ${vis && vis.status === 'Realizada' ? 'selected' : ''}>Realizada</option>
                  <option value="Cancelada" ${vis && vis.status === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
                </select>
              </div>

              <div>
                <label class="block font-semibold mb-1">Requerimientos / Instrucciones</label>
                <input type="text" name="notes" value="${vis ? Formatters.escapeHTML(vis.notes || '') : ''}" placeholder="Ej. Llevar llaves, parqueadero..." class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
              </div>
            </div>

            <!-- 7. FEEDBACK / RESULTADO DE LA VISITA -->
            <div>
              <label class="block font-semibold mb-1">Feedback / Impresiones del Cliente (Bitácora)</label>
              <textarea name="feedback" rows="2" placeholder="¿Qué le pareció la propiedad? ¿Hará oferta? Objeciones observadas..." class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">${vis ? Formatters.escapeHTML(vis.feedback || '') : ''}</textarea>
            </div>

            <!-- BOTONES DE ACCIÓN -->
            <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
              ${vis ? `
                <button type="button" id="btn-delete-this-vis" class="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer">
                  Eliminar Cita
                </button>
              ` : '<span></span>'}

              <div class="flex items-center gap-2">
                <button type="button" onclick="document.getElementById('modal-vis-container').innerHTML=''" class="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs">
                  ${vis ? 'Actualizar Cita' : 'Agendar Visita'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Toggle Modalidad (Presencial vs Virtual)
    const radioPresencial = document.querySelector('input[name="modality"][value="Presencial"]');
    const radioVirtual = document.querySelector('input[name="modality"][value="Virtual"]');
    const labelPresencial = document.getElementById('opt-presencial-label');
    const labelVirtual = document.getElementById('opt-virtual-label');
    const lblLocation = document.getElementById('lbl-location-text');
    const inpLocation = document.getElementById('inp-location');
    const selProp = document.getElementById('vis-form-prop');

    function syncModalityUI(isVirt) {
      if (isVirt) {
        labelVirtual.className = 'flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-bold';
        labelPresencial.className = 'flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400';
        lblLocation.innerText = 'Enlace de Videollamada (Meet / Zoom / WhatsApp Video) *';
        inpLocation.placeholder = 'https://meet.google.com/...';
        if (!inpLocation.value || !inpLocation.value.startsWith('http')) {
          inpLocation.value = 'https://meet.google.com/erk-vis-' + Math.floor(100 + Math.random() * 900);
        }
      } else {
        labelPresencial.className = 'flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold';
        labelVirtual.className = 'flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400';
        lblLocation.innerText = 'Punto de Encuentro / Dirección Física *';
        inpLocation.placeholder = 'Ej. Carrera 32 # 2 Sur - 45, Portería Principal';
        const opt = selProp.options[selProp.selectedIndex];
        if (opt && opt.getAttribute('data-addr')) {
          inpLocation.value = opt.getAttribute('data-addr');
        }
      }
    }

    if (radioPresencial) radioPresencial.addEventListener('change', () => syncModalityUI(false));
    if (radioVirtual) radioVirtual.addEventListener('change', () => syncModalityUI(true));

    if (selProp) {
      selProp.addEventListener('change', () => {
        if (radioPresencial && radioPresencial.checked) {
          const opt = selProp.options[selProp.selectedIndex];
          if (opt && opt.getAttribute('data-addr')) {
            inpLocation.value = opt.getAttribute('data-addr');
          }
        }
      });
    }

    // Eliminar Cita
    const btnDel = document.getElementById('btn-delete-this-vis');
    if (btnDel) {
      btnDel.addEventListener('click', () => {
        if (confirm('¿Estás seguro de eliminar esta cita de la agenda?')) {
          store.deleteVisit(vis.id);
          modalContainer.innerHTML = '';
          renderVisits(containerId);
        }
      });
    }

    // Submit Guardar / Actualizar
    document.getElementById('form-visit-edit').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);

      const visitData = {
        id: vis ? vis.id : Formatters.generateId('vis'),
        propertyId: fd.get('propertyId'),
        contactId: fd.get('contactId'),
        agentId: fd.get('agentId'),
        modality: fd.get('modality') || 'Presencial',
        date: fd.get('date'),
        time: fd.get('time') || '10:30',
        duration: fd.get('duration') || '45 min',
        location: fd.get('location') || '',
        status: fd.get('status') || 'Programada',
        notes: fd.get('notes') || '',
        feedback: fd.get('feedback') || ''
      };

      store.saveVisit(visitData);
      modalContainer.innerHTML = '';
      renderVisits(containerId);
    });
  }

  // ==================================================================
  // 10. COMPONENTE: REPORTE DE VENTAS 2026 EN ADELANTE
  // ==================================================================
  function renderReports(containerId = 'content-area', year = 2026) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const metrics = store.getMetrics2026(year);
    const settings = store.getSettings();

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm no-print">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Reporte de Ventas ${metrics.year}</h1>
            <p class="text-xs text-slate-500 mt-0.5">Seguimiento detallado a la fecha de hoy</p>
          </div>
          <div class="flex items-center gap-2">
            <button id="btn-export-excel" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <i data-lucide="file-spreadsheet" class="w-4 h-4 text-emerald-600"></i> Descargar Excel
            </button>
            <button onclick="window.print()" class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white flex items-center gap-1.5">
              <i data-lucide="printer" class="w-4 h-4"></i> Imprimir Informe
            </button>
          </div>
        </div>

        <div class="p-6 rounded-2xl border bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
          <h2 class="text-xl font-black text-blue-900 dark:text-blue-200">
            Resumen Comercial Consolidado (${metrics.year} a la fecha)
          </h2>
          <div class="text-sm font-bold text-slate-700 dark:text-slate-300 mt-2">
            Total facturado en cierres ganados: <span class="text-emerald-600 font-black">${Formatters.formatCurrency(metrics.totalSales, settings.currency)}</span> con ${metrics.unitsClosed} inmuebles vendidos.
          </div>
        </div>

        <!-- TABLA MES A MES 2026 -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <table class="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead class="bg-slate-50 dark:bg-slate-900/60 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th class="p-3">Mes</th>
                <th class="p-3 text-center">Inmuebles Cerrados</th>
                <th class="p-3 text-right">Monto Facturado</th>
                <th class="p-3 text-right">Comisión Estimada (3%)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
              ${metrics.monthlyBreakdown.map(row => `
                <tr>
                  <td class="p-3 font-bold text-slate-900 dark:text-white">${row.monthName}</td>
                  <td class="p-3 text-center font-semibold">${row.units}</td>
                  <td class="p-3 text-right text-blue-600 font-bold">${Formatters.formatCurrency(row.amount, settings.currency)}</td>
                  <td class="p-3 text-right text-emerald-600 font-semibold">${Formatters.formatCurrency(row.amount * 0.03, settings.currency)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot class="bg-slate-50 dark:bg-slate-900 font-black border-t-2 border-slate-200">
              <tr>
                <td class="p-3 uppercase">Total Acumulado</td>
                <td class="p-3 text-center">${metrics.unitsClosed}</td>
                <td class="p-3 text-right text-blue-600">${Formatters.formatCurrency(metrics.totalSales, settings.currency)}</td>
                <td class="p-3 text-right text-emerald-600">${Formatters.formatCurrency(metrics.commissionsEarned, settings.currency)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    const excelBtn = document.getElementById('btn-export-excel');
    if (excelBtn) {
      excelBtn.addEventListener('click', () => {
        const rows = metrics.monthlyBreakdown.map(m => ({
          Mes: m.monthName,
          Inmuebles_Cerrados: m.units,
          Monto_Facturado: m.amount,
          Comision_Estimada: m.amount * 0.03
        }));
        ExportUtils.exportToCSV(rows, `Ventas_${metrics.year}_A_La_Fecha.csv`);
      });
    }
  }

  // ==================================================================
  // 11. COMPONENTE: CALCULADORA HIPOTECARIA
  // Con espacio editable para el % financiado del restante
  // ==================================================================
  function renderTools(containerId = 'content-area') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="space-y-6">
        <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <i data-lucide="calculator" class="w-6 h-6 text-blue-600"></i> Calculadora Hipotecaria Avanzada
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">Calcula la cuota inicial y personaliza el porcentaje financiado del restante</p>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm max-w-xl space-y-4 text-xs">
          <!-- 1. Valor Inmueble -->
          <div>
            <label class="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Valor Total del Inmueble ($) *</label>
            <input type="number" id="tools-price" value="650000000" step="1000000" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white text-sm">
          </div>

          <!-- 2. Cuota Inicial & % Financiado del Restante -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700">
            <div>
              <label class="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Cuota Inicial (%)</label>
              <input type="number" id="tools-down-pct" value="30" min="0" max="100" class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white">
              <span id="tools-down-hint" class="text-[11px] text-slate-400 mt-1 block">Equivale a: $ 195.000.000</span>
            </div>

            <div>
              <label class="block font-bold mb-1 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                % a Financiar (Restante)
              </label>
              <!-- Espacio en blanco editable para el % financiado del restante -->
              <input type="number" id="tools-finance-pct" value="70" min="0" max="100" placeholder="Escribe el % financiado" class="w-full px-3 py-2 bg-white dark:bg-slate-800 border-2 border-blue-400 dark:border-blue-500 rounded-xl font-extrabold text-blue-600 dark:text-blue-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <span class="text-[11px] text-slate-400 mt-1 block">Espacio editable para personalizar</span>
            </div>
          </div>

          <!-- 3. Plazo y Tasa -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Plazo (Años)</label>
              <input type="number" id="tools-years" value="20" min="5" max="30" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
            </div>
            <div>
              <label class="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Tasa Interés (% E.A.)</label>
              <input type="number" id="tools-rate-ea" value="12.5" step="0.1" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
            </div>
          </div>

          <!-- RESULTADOS -->
          <div class="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 space-y-2.5 mt-4">
            <div class="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Cuota Inicial a Pagar:</span>
              <strong id="tools-res-down" class="text-slate-900 dark:text-white">$ 195.000.000</strong>
            </div>
            <div class="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Monto Total Financiado:</span>
              <strong id="tools-res-loan" class="text-blue-600 dark:text-blue-400">$ 455.000.000</strong>
            </div>
            <div class="flex justify-between items-center text-blue-700 dark:text-blue-300 font-bold text-sm pt-2.5 border-t border-blue-200 dark:border-blue-800">
              <span>Cuota Mensual Estimada:</span>
              <span id="tools-res-monthly" class="text-base font-black">$ 4.980.000</span>
            </div>
          </div>

          <button id="btn-copy-calc" class="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 transition-colors">
            <i data-lucide="copy" class="w-4 h-4"></i> Copiar Resumen para WhatsApp
          </button>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    const priceInp = document.getElementById('tools-price');
    const downPctInp = document.getElementById('tools-down-pct');
    const financePctInp = document.getElementById('tools-finance-pct');
    const yearsInp = document.getElementById('tools-years');
    const rateInp = document.getElementById('tools-rate-ea');

    const updateCalc = () => {
      const p = Number(priceInp.value) || 0;
      const dPct = Number(downPctInp.value) || 0;
      const fPct = Number(financePctInp.value) || 0;
      const y = Number(yearsInp.value) || 20;
      const r = Number(rateInp.value) || 12.5;

      const downPayment = p * (dPct / 100);
      // El monto financiado corresponde al % ingresado en el espacio en blanco
      const loanAmount = p * (fPct / 100);

      const mRate = Math.pow(1 + (r / 100), 1 / 12) - 1;
      const months = y * 12;
      let monthly = 0;
      if (mRate > 0 && months > 0 && loanAmount > 0) {
        monthly = loanAmount * (mRate * Math.pow(1 + mRate, months)) / (Math.pow(1 + mRate, months) - 1);
      }

      document.getElementById('tools-down-hint').innerText = `Equivale a: ${Formatters.formatCurrency(downPayment, 'COP')}`;
      document.getElementById('tools-res-down').innerText = Formatters.formatCurrency(downPayment, 'COP');
      document.getElementById('tools-res-loan').innerText = Formatters.formatCurrency(loanAmount, 'COP');
      document.getElementById('tools-res-monthly').innerText = Formatters.formatCurrency(monthly, 'COP');
    };

    [priceInp, downPctInp, financePctInp, yearsInp, rateInp].forEach(i => i.addEventListener('input', updateCalc));
    updateCalc();

    const copyBtn = document.getElementById('btn-copy-calc');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const p = Number(priceInp.value) || 0;
        const dAmt = document.getElementById('tools-res-down').innerText;
        const lAmt = document.getElementById('tools-res-loan').innerText;
        const mPay = document.getElementById('tools-res-monthly').innerText;

        const text = `🏡 *Simulación de Crédito Hipotecario - Inmobiliaria Erkro*\n\n` +
          `• Valor Inmueble: ${Formatters.formatCurrency(p, 'COP')}\n` +
          `• Cuota Inicial (${downPctInp.value}%): ${dAmt}\n` +
          `• Monto Financiado (${financePctInp.value}%): ${lAmt}\n` +
          `• Plazo: ${yearsInp.value} años\n` +
          `• Cuota Mensual Estimada: ${mPay}\n\n` +
          `_Asesor Comercial: Rodrigo Hernández_`;

        navigator.clipboard.writeText(text).then(() => {
          alert('¡Simulación copiada al portapapeles! Puedes pegarla en WhatsApp.');
        });
      });
    }
  }

  // ==================================================================
  // 12. GESTIÓN DE USUARIOS / ASESORES (RODRIGO HERNÁNDEZ + NUEVOS)
  // ==================================================================
  function openUserModal() {
    const container = document.getElementById('global-modal-container');
    if (!container) return;

    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 modal-backdrop">
        <div class="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative">
          <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-700">
            <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i data-lucide="user-plus" class="w-5 h-5 text-blue-600"></i> Registrar Nuevo Asesor / Usuario
            </h3>
            <button onclick="document.getElementById('global-modal-container').innerHTML=''" class="text-slate-400">✕</button>
          </div>

          <form id="form-user" class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold mb-1">Nombre Completo *</label>
              <input type="text" name="name" required placeholder="Ej. Camila Morales" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
            </div>

            <div>
              <label class="block font-semibold mb-1">Cargo / Rol</label>
              <input type="text" name="role" value="Asesor Comercial" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-semibold mb-1">Teléfono / WhatsApp</label>
                <input type="text" name="phone" placeholder="+57 300 000 0000" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
              </div>
              <div>
                <label class="block font-semibold mb-1">Meta de Ventas ($)</label>
                <input type="number" name="target" value="1500000000" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
              </div>
            </div>

            <div>
              <label class="block font-semibold mb-1">Correo Electrónico</label>
              <input type="email" name="email" placeholder="asesor@erkro.com" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button type="button" onclick="document.getElementById('global-modal-container').innerHTML=''" class="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">Cancelar</button>
              <button type="submit" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold">Crear Usuario</button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    document.getElementById('form-user').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);

      store.saveAgent({
        id: Formatters.generateId('ag'),
        name: fd.get('name'),
        role: fd.get('role') || 'Asesor Comercial',
        phone: fd.get('phone') || '',
        email: fd.get('email') || '',
        target: Number(fd.get('target')) || 1500000000,
        commissionRate: 3.0,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
      });

      alert('¡Usuario creado exitosamente!');
      container.innerHTML = '';
      window.ErkroApp.navigate(window.ErkroApp.currentRoute, false);
    });
  }

  // ==================================================================
  // 13. ENRUTADOR Y CONTROLADOR GLOBAL
  // ==================================================================
  class AppController {
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
      window.addEventListener('hashchange', () => {
        const hash = window.location.hash.replace('#', '') || 'dashboard';
        this.navigate(hash, false);
      });

      const initial = window.location.hash.replace('#', '') || 'dashboard';
      this.navigate(initial, true);
      this.setupTheme();
      this.setupEvents();
      this.updateSidebarUser();
    }

    updateSidebarUser() {
      const activeUser = store.getAgents()[0];
      const userEl = document.getElementById('sidebar-user-name');
      const roleEl = document.getElementById('sidebar-user-role');
      if (userEl && activeUser) userEl.innerText = activeUser.name;
      if (roleEl && activeUser) roleEl.innerText = activeUser.role;
    }

    navigate(routeName, updateHash = true) {
      if (!this.routes[routeName]) routeName = 'dashboard';
      this.currentRoute = routeName;
      if (updateHash) window.location.hash = routeName;

      document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('data-route') === routeName) {
          link.classList.add('bg-blue-600', 'text-white', 'shadow-md');
          link.classList.remove('text-slate-600', 'dark:text-slate-300');
        } else {
          link.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
          link.classList.add('text-slate-600', 'dark:text-slate-300');
        }
      });

      const renderFn = this.routes[routeName];
      if (renderFn) {
        renderFn('content-area');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      const sidebar = document.getElementById('sidebar');
      if (sidebar && !sidebar.classList.contains('-translate-x-full') && window.innerWidth < 1024) {
        sidebar.classList.add('-translate-x-full');
      }
    }

    setupTheme() {
      const isDark = localStorage.getItem('erkro_theme') === 'dark';
      if (isDark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');

      const btn = document.getElementById('btn-toggle-theme');
      if (btn) {
        btn.addEventListener('click', () => {
          document.documentElement.classList.toggle('dark');
          localStorage.setItem('erkro_theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
          this.navigate(this.currentRoute, false);
        });
      }
    }

    setupEvents() {
      const toggleSidebarBtn = document.getElementById('btn-toggle-sidebar');
      const sidebar = document.getElementById('sidebar');
      if (toggleSidebarBtn && sidebar) {
        toggleSidebarBtn.addEventListener('click', () => sidebar.classList.toggle('-translate-x-full'));
      }

      document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          this.navigate(link.getAttribute('data-route'));
        });
      });

      const btnBackup = document.getElementById('btn-open-backup');
      if (btnBackup) {
        btnBackup.addEventListener('click', () => {
          const json = JSON.stringify(store.state, null, 2);
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Erkro_CRM_Backup_${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          alert('¡Copia de seguridad descargada exitosamente en formato JSON!');
        });
      }
    }

    openUserModal() {
      openUserModal();
    }

    goToProperties(openModal = false) {
      this.navigate('properties');
      if (openModal) {
        setTimeout(() => {
          if (typeof openPropModal === 'function') openPropModal(null);
        }, 120);
      }
    }

    goToPipeline(openModal = false) {
      this.navigate('pipeline');
      if (openModal) {
        setTimeout(() => {
          if (typeof openDealModal === 'function') openDealModal(null);
        }, 120);
      }
    }
  }

  const app = new AppController();
  window.ErkroApp = app;
  window.router = app; // Soporte global para window.router y window.ErkroApp

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
  } else {
    app.init();
  }

})();
