/**
 * Erkro CRM Inmobiliario - Bundle Universal
 * Funciona de manera autónoma en:
 * 1. Doble clic local (protocolo file://)
 * 2. GitHub Pages (https://)
 * 3. Hostinger (https://)
 */

(function () {
  'use strict';

  // ==========================================
  // 1. UTILIDADES Y FORMATEADORES
  // ==========================================
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

    calculateYoYGrowth(current, previous) {
      if (!previous || previous === 0) {
        if (current > 0) return { percentage: 100, isPositive: true, formatted: '+100%' };
        return { percentage: 0, isPositive: true, formatted: '0%' };
      }
      const change = ((current - previous) / previous) * 100;
      const isPositive = change >= 0;
      return {
        percentage: change,
        isPositive,
        formatted: (isPositive ? '+' : '') + change.toFixed(1) + '%'
      };
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

  // ==========================================
  // 2. EXPORTACIÓN Y RESPALDO
  // ==========================================
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

  // ==========================================
  // 3. DATOS DEMO INICIALES
  // ==========================================
  const INITIAL_DEMO = {
    settings: {
      agencyName: "Inmobiliaria Erkro",
      currency: "COP",
      annualGoal2026: 5500000000,
      annualGoal2025: 3800000000,
      defaultCommissionRate: 3.0,
      targetYoYGrowth: 25.0
    },
    agents: [
      {
        id: "ag_1",
        name: "Carlos Mendoza",
        email: "carlos.mendoza@erkro.com",
        phone: "+57 312 450 8891",
        role: "Director Comercial",
        avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
        target: 2000000000,
        commissionRate: 3.5
      },
      {
        id: "ag_2",
        name: "Valentina Restrepo",
        email: "valentina.r@erkro.com",
        phone: "+57 320 892 1144",
        role: "Especialista Residencial Luxury",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        target: 1800000000,
        commissionRate: 3.0
      },
      {
        id: "ag_3",
        name: "Andrés Felipe Silva",
        email: "andres.silva@erkro.com",
        phone: "+57 315 778 9900",
        role: "Asesor Inmuebles Comerciales",
        avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
        target: 1700000000,
        commissionRate: 3.0
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
        agentId: "ag_2"
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
        agentId: "ag_1"
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
        agentId: "ag_2"
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
        agentId: "ag_3"
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
        agentId: "ag_1"
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
        notes: "Gerente de tecnología. Pago de contado + crédito aprobado.",
        status: "Calificado",
        assignedAgentId: "ag_2"
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
        assignedAgentId: "ag_1"
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
        assignedAgentId: "ag_2"
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
        notes: "Arquitecta. Crédito Bancolombia preaprobado.",
        status: "Nuevo Lead",
        assignedAgentId: "ag_1"
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
        assignedAgentId: "ag_3"
      }
    ],
    deals: [
      // Vivas 2026
      {
        id: "deal_1",
        title: "Venta Apto Luxury El Poblado",
        contactId: "cnt_1",
        propertyId: "prop_1",
        agentId: "ag_2",
        stage: "visita_agendada",
        amount: 850000000,
        expectedCloseDate: "2026-11-20",
        priority: "Alta",
        notes: "Cliente muy entusiasmado tras ver brochure."
      },
      {
        id: "deal_2",
        title: "Venta Casa Campestre Llanogrande",
        contactId: "cnt_2",
        propertyId: "prop_2",
        agentId: "ag_1",
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
        agentId: "ag_2",
        stage: "promesa",
        amount: 1200000000,
        expectedCloseDate: "2026-10-30",
        priority: "Alta",
        notes: "Redacción de promesa en Notaría 45."
      },
      {
        id: "deal_4",
        title: "Interés Local Centro Empresarial",
        contactId: "cnt_5",
        propertyId: "prop_4",
        agentId: "ag_3",
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
        agentId: "ag_1",
        stage: "prospecto",
        amount: 520000000,
        expectedCloseDate: "2026-12-28",
        priority: "Media",
        notes: "Enviar catálogo por WhatsApp."
      },

      // VENTAS GANADAS EN 2026
      {
        id: "deal_c_26_1",
        title: "Venta Apartamento San Lucas",
        agentId: "ag_2",
        stage: "ganada",
        amount: 720000000,
        closeDate: "2026-01-28",
        propertyType: "Apartamento"
      },
      {
        id: "deal_c_26_2",
        title: "Venta Casa Campestre El Retiro",
        agentId: "ag_1",
        stage: "ganada",
        amount: 1450000000,
        closeDate: "2026-02-24",
        propertyType: "Casa Campestre"
      },
      {
        id: "deal_c_26_3",
        title: "Venta Oficina Corporativa Chicó",
        agentId: "ag_3",
        stage: "ganada",
        amount: 680000000,
        closeDate: "2026-03-19",
        propertyType: "Oficina"
      },
      {
        id: "deal_c_26_4",
        title: "Venta Apartamento Envigado",
        agentId: "ag_2",
        stage: "ganada",
        amount: 510000000,
        closeDate: "2026-04-30",
        propertyType: "Apartamento"
      },
      {
        id: "deal_c_26_5",
        title: "Venta Lote Parcelación La Ceja",
        agentId: "ag_1",
        stage: "ganada",
        amount: 430000000,
        closeDate: "2026-06-15",
        propertyType: "Lote / Terreno"
      },
      {
        id: "deal_c_26_6",
        title: "Venta Penthouse Santa Bárbara",
        agentId: "ag_2",
        stage: "ganada",
        amount: 1100000000,
        closeDate: "2026-08-14",
        propertyType: "Penthouse"
      },

      // VENTAS HISTÓRICAS EN 2025 (Año Anterior para YoY)
      // Total 2025: 3.480.000.000 vs 2026: 4.890.000.000 -> ¡Crecimiento de +40.5%!
      {
        id: "deal_c_25_1",
        title: "Venta Apto Poblado (2025)",
        agentId: "ag_2",
        stage: "ganada",
        amount: 480000000,
        closeDate: "2025-01-20",
        propertyType: "Apartamento"
      },
      {
        id: "deal_c_25_2",
        title: "Venta Casa San Lucas (2025)",
        agentId: "ag_1",
        stage: "ganada",
        amount: 850000000,
        closeDate: "2025-02-18",
        propertyType: "Casa Campestre"
      },
      {
        id: "deal_c_25_3",
        title: "Venta Local Chapinero (2025)",
        agentId: "ag_3",
        stage: "ganada",
        amount: 320000000,
        closeDate: "2025-03-25",
        propertyType: "Local Comercial"
      },
      {
        id: "deal_c_25_4",
        title: "Venta Apto Sabaneta (2025)",
        agentId: "ag_1",
        stage: "ganada",
        amount: 390000000,
        closeDate: "2025-05-12",
        propertyType: "Apartamento"
      },
      {
        id: "deal_c_25_5",
        title: "Venta Lote Guarne (2025)",
        agentId: "ag_3",
        stage: "ganada",
        amount: 290000000,
        closeDate: "2025-07-29",
        propertyType: "Lote / Terreno"
      },
      {
        id: "deal_c_25_6",
        title: "Venta Penthouse Cedritos (2025)",
        agentId: "ag_2",
        stage: "ganada",
        amount: 650000000,
        closeDate: "2025-09-17",
        propertyType: "Penthouse"
      },
      {
        id: "deal_c_25_7",
        title: "Venta Apto Laureles (2025)",
        agentId: "ag_1",
        stage: "ganada",
        amount: 500000000,
        closeDate: "2025-11-20",
        propertyType: "Apartamento"
      }
    ],
    visits: [
      {
        id: "vis_1",
        propertyId: "prop_1",
        contactId: "cnt_1",
        agentId: "ag_2",
        date: "2026-10-10",
        time: "10:30",
        status: "Programada",
        notes: "Llevar catálogo impreso y verificar parqueaderos.",
        feedback: ""
      },
      {
        id: "vis_2",
        propertyId: "prop_2",
        contactId: "cnt_2",
        agentId: "ag_1",
        date: "2026-09-28",
        time: "15:00",
        status: "Realizada",
        notes: "Visita familiar.",
        feedback: "Les encantó la piscina y el diseño. Pidieron margen de descuento para ofertar."
      },
      {
        id: "vis_3",
        propertyId: "prop_3",
        contactId: "cnt_3",
        agentId: "ag_2",
        date: "2026-09-10",
        time: "11:00",
        status: "Realizada",
        notes: "Inspección técnica.",
        feedback: "Aprobada por el perito. Procedieron a elaborar promesa."
      }
    ]
  };

  // ==========================================
  // 4. ALMACÉN Y ESTADO REACTIVO (STORE)
  // ==========================================
  const STORAGE_KEY = 'erkro_crm_storage_v1';

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
        } else {
          this.state = JSON.parse(JSON.stringify(INITIAL_DEMO));
          this.save();
        }
      } catch (e) {
        this.state = JSON.parse(JSON.stringify(INITIAL_DEMO));
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
      this.state = JSON.parse(JSON.stringify(INITIAL_DEMO));
      this.save();
    }

    loadBackup(data) {
      if (!data || !data.properties || !data.deals) throw new Error('Estructura inválida');
      this.state = data;
      this.save();
    }

    getSettings() { return this.state.settings || INITIAL_DEMO.settings; }
    getAgents() { return this.state.agents || []; }
    getAgent(id) { return this.getAgents().find(a => a.id === id) || null; }
    getProperties() { return this.state.properties || []; }
    getProperty(id) { return this.getProperties().find(p => p.id === id) || null; }
    getContacts() { return this.state.contacts || []; }
    getContact(id) { return this.getContacts().find(c => c.id === id) || null; }
    getDeals() { return this.state.deals || []; }
    getDeal(id) { return this.getDeals().find(d => d.id === id) || null; }
    getVisits() { return this.state.visits || []; }

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

    getAvailableYears() {
      const years = new Set([2024, 2025, 2026]);
      this.getDeals().forEach(d => {
        const dateStr = d.closeDate || d.createdAt;
        if (dateStr) {
          const y = new Date(dateStr).getFullYear();
          if (!isNaN(y)) years.add(y);
        }
      });
      return Array.from(years).sort((a, b) => b - a);
    }

    getYoYMetrics(currentYear = 2026, previousYear = 2025) {
      const deals = this.getDeals();
      const settings = this.getSettings();
      const closedDeals = deals.filter(d => d.stage === 'ganada');

      const currentYearDeals = closedDeals.filter(d => {
        const dateStr = d.closeDate || d.createdAt;
        return dateStr && new Date(dateStr).getFullYear() === Number(currentYear);
      });

      const previousYearDeals = closedDeals.filter(d => {
        const dateStr = d.closeDate || d.createdAt;
        return dateStr && new Date(dateStr).getFullYear() === Number(previousYear);
      });

      const currentSales = currentYearDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      const previousSales = previousYearDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      const salesGrowth = previousSales > 0 ? ((currentSales - previousSales) / previousSales) * 100 : (currentSales > 0 ? 100 : 0);

      const currentUnits = currentYearDeals.length;
      const previousUnits = previousYearDeals.length;
      const unitsGrowth = previousUnits > 0 ? ((currentUnits - previousUnits) / previousUnits) * 100 : 0;

      const currentTicket = currentUnits > 0 ? currentSales / currentUnits : 0;
      const previousTicket = previousUnits > 0 ? previousSales / previousUnits : 0;
      const ticketGrowth = previousTicket > 0 ? ((currentTicket - previousTicket) / previousTicket) * 100 : 0;

      const currentCommissions = currentYearDeals.reduce((sum, d) => sum + (Number(d.commissionExpected) || (d.amount * 0.03)), 0);
      const previousCommissions = previousYearDeals.reduce((sum, d) => sum + (Number(d.commissionExpected) || (d.amount * 0.03)), 0);
      const commissionsGrowth = previousCommissions > 0 ? ((currentCommissions - previousCommissions) / previousCommissions) * 100 : 0;

      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const monthlyComparison = monthNames.map((name, index) => {
        const curr = currentYearDeals
          .filter(d => new Date(d.closeDate || d.createdAt).getMonth() === index)
          .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
        const prev = previousYearDeals
          .filter(d => new Date(d.closeDate || d.createdAt).getMonth() === index)
          .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
        const diff = curr - prev;
        const pct = prev > 0 ? ((curr - prev) / prev) * 100 : (curr > 0 ? 100 : 0);
        return { monthIndex: index, monthName: name, currentYearAmount: curr, previousYearAmount: prev, difference: diff, growthPct: pct };
      });

      const activeStages = [
        { key: 'prospecto', label: 'Prospecto Nuevo', color: '#94a3b8' },
        { key: 'calificado', label: 'Calificado', color: '#60a5fa' },
        { key: 'visita_agendada', label: 'Visita Agendada', color: '#818cf8' },
        { key: 'negociacion', label: 'En Negociación', color: '#f59e0b' },
        { key: 'promesa', label: 'Promesa de Venta', color: '#10b981' },
        { key: 'ganada', label: 'Cerrada / Ganada', color: '#059669' }
      ];

      const pipelineFunnel = activeStages.map(st => {
        const stageDeals = deals.filter(d => d.stage === st.key);
        return { ...st, count: stageDeals.length, totalAmount: stageDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0) };
      });

      const pipelineActiveVolume = deals
        .filter(d => !['ganada', 'perdida'].includes(d.stage))
        .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

      const typeDistribution = {};
      const properties = this.getProperties();
      currentYearDeals.forEach(d => {
        let t = d.propertyType;
        if (!t && d.propertyId) {
          const prop = properties.find(p => p.id === d.propertyId);
          if (prop) t = prop.type;
        }
        t = t || 'Apartamento';
        typeDistribution[t] = (typeDistribution[t] || 0) + Number(d.amount);
      });

      const agentRankings = this.getAgents().map(ag => {
        const agDeals = currentYearDeals.filter(d => d.agentId === ag.id);
        const totalSales = agDeals.reduce((sum, d) => sum + Number(d.amount), 0);
        return {
          ...ag,
          totalSales,
          units: agDeals.length,
          commissions: agDeals.reduce((sum, d) => sum + (Number(d.commissionExpected) || (d.amount * 0.03)), 0),
          targetPercent: ag.target > 0 ? (totalSales / ag.target) * 100 : 0
        };
      }).sort((a, b) => b.totalSales - a.totalSales);

      const annualGoal = Number(settings[`annualGoal${currentYear}`] || settings.annualGoal2026 || 5500000000);
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

  const store = new CRMStore();
  window.CRM_STORE = store;

  // ==========================================
  // 5. IMPORTAR / EXPORTAR MÓDULOS DE VISTAS
  // ==========================================
  // Conectamos las funciones de rendering ya implementadas en js/components/*
  // y proporcionamos soporte para que funcionen con o sin ES modules.
  window.ErkroCRM = {
    store,
    formatters: Formatters,
    export: ExportUtils
  };

})();
