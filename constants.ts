
import { Company, InsurancePlan, Lead, PlanStatus, PlanType, User, UserRole, CarMake, CarModel, KnowledgeBaseItem } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u1', username: 'admin', role: UserRole.ADMIN, name: 'Super Admin', status: 'ACTIVE' },
  { id: 'u2', username: 'agent', role: UserRole.AGENT, name: 'Agent Smith', totalSales: 150000, status: 'ACTIVE' },
  { id: 'u3', username: 'agent2', role: UserRole.AGENT, name: 'Agent Doe', totalSales: 85000, status: 'ACTIVE' },
];

export const MOCK_COMPANIES: Company[] = [
  { id: 'c1', name: 'วิริยะประกันภัย', logoUrl: 'https://upload.wikimedia.org/wikipedia/th/thumb/1/1a/Viriyah_Insurance_Logo.svg/1200px-Viriyah_Insurance_Logo.svg.png', color: '#F59E0B' },
  { id: 'c2', name: 'กรุงเทพประกันภัย', logoUrl: 'https://upload.wikimedia.org/wikipedia/th/2/23/BKI_LOGO.png', color: '#1E3A8A' },
  { id: 'c3', name: 'เมืองไทยประกันภัย', logoUrl: 'https://www.muangthaiinsurance.com/upload/logo/logo_mti.png', color: '#BE185D' },
];

export const MOCK_MAKES: CarMake[] = [
  { id: 'm1', name: 'Toyota', logoUrl: 'https://global.toyota/pages/global_toyota/mobility/toyota-brand/emblem_ogp_001.png' },
  { id: 'm2', name: 'Honda', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Honda.svg/2560px-Honda.svg.png' },
  { id: 'm3', name: 'Mazda', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Mazda_logo_with_emblem.svg/1024px-Mazda_logo_with_emblem.svg.png' },
  { id: 'm4', name: 'Isuzu', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Isuzu_Motors_Logo.svg/2560px-Isuzu_Motors_Logo.svg.png' },
  { id: 'm5', name: 'Mitsubishi', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Mitsubishi_logo.svg/1024px-Mitsubishi_logo.svg.png' },
  { id: 'm6', name: 'Nissan', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Nissan_2020_logo.svg/1200px-Nissan_2020_logo.svg.png' },
  { id: 'm7', name: 'Ford', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Ford_Motor_Company_Logo.svg/2560px-Ford_Motor_Company_Logo.svg.png' },
  { id: 'm8', name: 'MG', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/MG_Motor_logo.svg/2560px-MG_Motor_logo.svg.png' },
  { id: 'm9', name: 'BMW', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/BMW.svg/2048px-BMW.svg.png' },
  { id: 'm10', name: 'Tesla', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png' }
];

export const MOCK_MODELS: CarModel[] = [
  { id: 'mo1', makeId: 'm1', name: 'Yaris', subModels: ['Entry', 'Sport', 'Sport Premium'] },
  { id: 'mo2', makeId: 'm1', name: 'Vios', subModels: ['Entry', 'Mid', 'High'] },
  { id: 'mo3', makeId: 'm1', name: 'Fortuner', subModels: ['Legender', 'Leader'] },
  { id: 'mo4', makeId: 'm2', name: 'Civic', subModels: ['EL', 'EL+', 'RS'] },
  { id: 'mo5', makeId: 'm2', name: 'City', subModels: ['S', 'V', 'SV', 'RS'] },
  { id: 'mo6', makeId: 'm3', name: 'Mazda2', subModels: ['C', 'S', 'SP'] },
  { id: 'model3', makeId: 'm10', name: 'Model 3', subModels: ['RWD', 'Long Range', 'Performance'] },
  { id: 'dmax', makeId: 'm4', name: 'D-Max', subModels: ['Hi-Lander', 'V-Cross', 'Spark'] },
];

export const MOCK_PLANS: InsurancePlan[] = [
  {
    id: 'p1',
    agentId: 'u1',
    companyId: 'c1',
    planName: 'Viriyah Save Pack',
    applicableCars: [
        { id: 'v1', carMakeId: 'm1', carModelId: 'mo1', yearMin: 2018, yearMax: 2022 },
        { id: 'v2', carMakeId: 'm1', carModelId: 'mo2', yearMin: 2018, yearMax: 2022 }
    ],
    type: PlanType.CLASS_1,
    price: 15500,
    sumInsured: 650000,
    deductible: 0,
    repairType: 'GARAGE',
    emergencyService: true,
    floodCoverage: 100000,
    searchable_attributes: 'viriyah save pack toyota yaris vios ซ่อมอู่ ไม่มีค่าเสียหายส่วนแรก น้ำท่วม',
    details: {
      sumInsured: 650000, deductible: 0, fireTheft: 650000, repairType: 'GARAGE', thirdPartyProperty: 2500000, thirdPartyPerson: 1000000, thirdPartyTime: 10000000, paDriver: 100000, paPassenger: 100000, medicalExp: 100000, bailBond: 200000, emergencyService: true, floodCoverage: 100000, otherServices: [], additionalCoverages: [], mainCustomCoverages: []
    },
    status: PlanStatus.ACTIVE,
    isHotDeal: true,
    createdAt: '2023-10-01T10:00:00Z'
  },
  {
    id: 'p2',
    agentId: 'u2',
    companyId: 'c2',
    planName: 'BKI Special 2+',
    applicableCars: [ { id: 'v3', carMakeId: 'm2', carModelId: 'mo4', yearMin: 2015, yearMax: 2020 } ],
    type: PlanType.CLASS_2_PLUS,
    price: 8900,
    sumInsured: 200000,
    deductible: 0,
    repairType: 'GARAGE',
    emergencyService: false,
    floodCoverage: 0,
    searchable_attributes: 'bki special 2+ honda civic ซ่อมอู่',
    details: {
      sumInsured: 200000, deductible: 0, fireTheft: 200000, repairType: 'GARAGE', thirdPartyProperty: 1000000, thirdPartyPerson: 500000, thirdPartyTime: 10000000, paDriver: 100000, paPassenger: 100000, medicalExp: 50000, bailBond: 200000, emergencyService: false, floodCoverage: 0, otherServices: [], additionalCoverages: [], mainCustomCoverages: []
    },
    status: PlanStatus.ACTIVE,
    createdAt: '2023-10-05T12:00:00Z'
  },
  {
    id: 'p3',
    agentId: 'u2',
    companyId: 'c3',
    planName: 'MTI 3+ Budget',
    applicableCars: [ { id: 'v4', carMakeId: 'm1', carModelId: 'mo1', yearMin: 2010, yearMax: 2024 } ],
    type: PlanType.CLASS_3_PLUS,
    price: 6500,
    sumInsured: 100000,
    deductible: 0,
    repairType: 'GARAGE',
    emergencyService: true,
    floodCoverage: 0,
    searchable_attributes: 'mti 3+ budget ซ่อมอู่ ล้างรถฟรี',
    details: {
      sumInsured: 100000, deductible: 0, fireTheft: 0, repairType: 'GARAGE', thirdPartyProperty: 1000000, thirdPartyPerson: 500000, thirdPartyTime: 10000000, paDriver: 50000, paPassenger: 50000, medicalExp: 50000, bailBond: 100000, emergencyService: true, floodCoverage: 0, otherServices: ['ล้างรถฟรี 1 ครั้ง'], additionalCoverages: [], mainCustomCoverages: []
    },
    status: PlanStatus.ACTIVE,
    createdAt: '2023-10-26T09:00:00Z'
  },
  {
    id: 'p4',
    agentId: 'u1',
    companyId: 'c1',
    planName: 'Viriyah Gold Mazda 2',
    applicableCars: [ { id: 'v6', carMakeId: 'm3', carModelId: 'mo6', yearMin: 2015, yearMax: 2024 } ],
    type: PlanType.CLASS_1,
    price: 18500,
    sumInsured: 450000,
    deductible: 0,
    repairType: 'GARAGE',
    emergencyService: true,
    floodCoverage: 50000,
    searchable_attributes: 'viriyah gold mazda 2 ซ่อมอู่ บริการรถยกฟรี ช่วยเหลือฉุกเฉิน',
    details: {
      sumInsured: 450000, deductible: 0, fireTheft: 450000, repairType: 'GARAGE', thirdPartyProperty: 2500000, thirdPartyPerson: 1000000, thirdPartyTime: 10000000, paDriver: 100000, paPassenger: 100000, medicalExp: 100000, bailBond: 200000, emergencyService: true, floodCoverage: 50000, otherServices: ['บริการรถยกฟรี', 'ช่วยเหลือฉุกเฉิน'], additionalCoverages: [], mainCustomCoverages: []
    },
    status: PlanStatus.ACTIVE,
    isHotDeal: true,
    createdAt: '2023-10-28T09:00:00Z'
  },
  // NEW PLANS TO PROVE RESET WORKED
  {
    id: 'p5_tesla', agentId: 'u1', companyId: 'c1', planName: 'Viriyah EV Care Tesla',
    applicableCars: [ { id: 'v7', carMakeId: 'm10', carModelId: 'model3', yearMin: 2021, yearMax: 2024 } ],
    type: PlanType.CLASS_1,
    price: 25000,
    sumInsured: 1500000,
    deductible: 5000,
    repairType: 'MALL',
    emergencyService: true,
    floodCoverage: 100000,
    searchable_attributes: 'viriyah ev care tesla model 3 ซ่อมห้าง มีค่าเสียหายส่วนแรก',
    details: { sumInsured: 1500000, deductible: 5000, fireTheft: 1500000, repairType: 'MALL', thirdPartyProperty: 5000000, thirdPartyPerson: 2000000, thirdPartyTime: 10000000, paDriver: 200000, paPassenger: 200000, medicalExp: 200000, bailBond: 300000, emergencyService: true, floodCoverage: 100000, otherServices: ['EV Charger Cover'], additionalCoverages: [], mainCustomCoverages: [] },
    status: PlanStatus.ACTIVE, isHotDeal: true, createdAt: '2023-11-01T09:00:00Z'
  },
  {
    id: 'p6_isuzu', agentId: 'u2', companyId: 'c2', planName: 'BKI Pickup Power',
    applicableCars: [ { id: 'v8', carMakeId: 'm4', carModelId: 'dmax', yearMin: 2018, yearMax: 2024 } ],
    type: PlanType.CLASS_1,
    price: 14000,
    sumInsured: 500000, deductible: 0,
    repairType: 'GARAGE',
    emergencyService: true,
    floodCoverage: 50000,
    searchable_attributes: 'bki pickup power isuzu d-max ซ่อมอู่ แบตเตอรี่',
    details: { sumInsured: 500000, deductible: 0, fireTheft: 500000, repairType: 'GARAGE', thirdPartyProperty: 2000000, thirdPartyPerson: 1000000, thirdPartyTime: 10000000, paDriver: 100000, paPassenger: 100000, medicalExp: 100000, bailBond: 200000, emergencyService: true, floodCoverage: 50000, otherServices: ['เคลมแบตเตอรี่'], additionalCoverages: [], mainCustomCoverages: [] },
    status: PlanStatus.ACTIVE,
    createdAt: '2023-11-02T10:00:00Z'
  }
];

export const MOCK_LEADS: Lead[] = [
  {
    id: 'l1',
    customerName: 'สมชาย ใจดี',
    contactInfo: '0812345678',
    query: 'ประกันชั้น 1 Mazda 2 2019',
    carDetails: 'Mazda 2 2019',
    status: 'NEW',
    createdAt: '2023-10-27T08:30:00Z'
  }
];

export const MOCK_KB: KnowledgeBaseItem[] = [
  { id: 'kb1', question: 'ติดต่อ', answer: 'Line ID: @sisinsure, เบอร์โทร: 090-109-8403', category: 'Contact' },
  { id: 'kb2', question: 'เบอร์โทร', answer: '090-109-8403', category: 'Contact' },
  { id: 'kb3', question: 'ไลน์', answer: '@sisinsure', category: 'Contact' },
  { id: 'kb4', question: 'Line', answer: '@sisinsure', category: 'Contact' },
];
