

export enum UserRole {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
  USER = 'USER'
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  totalSales?: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CarMake {
  id: string;
  name: string;
  logoUrl: string;
}

export interface CarModel {
  id: string;
  makeId: string;
  name: string;
  subModels: string[]; // Simple list of sub-model names
}

export interface Company {
  id: string;
  name: string;
  logoUrl: string;
  color?: string;
}

export enum PlanType {
  CLASS_1 = 'ชั้น 1',
  CLASS_2 = 'ชั้น 2',
  CLASS_2_PLUS = 'ชั้น 2+',
  CLASS_3 = 'ชั้น 3',
  CLASS_3_PLUS = 'ชั้น 3+',
}

export enum PlanStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  REJECTED = 'REJECTED'
}

export interface CoverageDetails {
  // ความรับผิดชอบต่อรถยนต์
  sumInsured: number;      // ทุนประกัน
  deductible: number;      // ค่าเสียหายส่วนแรก
  fireTheft: number;       // รถยนต์สูญหาย/ไฟไหม้
  repairType?: 'MALL' | 'GARAGE'; // ประเภทซ่อม

  // ความรับผิดชอบต่อบุคคลภายนอก
  thirdPartyProperty: number; // ทรัพย์สิน (ต่อครั้ง)
  thirdPartyPerson: number;   // บาดเจ็บ/เสียชีวิต (ต่อคน)
  thirdPartyTime: number;     // บาดเจ็บ/เสียชีวิต (ต่อครั้ง)

  // ความคุ้มครองตามเอกสารแนบท้าย (PA)
  paDriver: number;        // เสียชีวิต (ผู้ขับขี่)
  paPassenger: number;     // เสียชีวิต (ผู้โดยสาร)
  medicalExp: number;      // ค่ารักษาพยาบาล (ต่อคน)
  bailBond: number;        // ประกันตัวผู้ขับขี่ (ต่อครั้ง)

  // เพิ่มเติม
  floodCoverage?: number;  // คุ้มครองน้ำท่วม (Optional)
  emergencyService: boolean;
  otherServices?: string[];
  additionalCoverages?: { name: string; price: number }[]; // ความคุ้มครองเพิ่มเติมแบบระบุราคา (Privileges)
  mainCustomCoverages?: { name: string; value: number }[]; // ความคุ้มครองหลักเพิ่มเติม (Main Coverage Items)
}

// New Interface for Multiple Vehicle Criteria
export interface VehicleCriteria {
  id: string; // Unique ID for UI handling
  carMakeId: string;
  carModelId?: string; // Optional (If undefined = All models of this make)
  subModels?: string[]; // Optional specific sub-models
  yearMin: number;
  yearMax: number;
}

export interface InsurancePlan {
  id: string;
  agentId: string;
  companyId: string;
  planName: string;
  
  // Updated to support multiple vehicle configurations
  applicableCars: VehicleCriteria[];

  type: PlanType;
  price: number;
  
  // CORE FILTERABLE FIELDS (Promoted from details)
  sumInsured: number;
  deductible: number;
  repairType: 'MALL' | 'GARAGE';
  emergencyService: boolean;
  floodCoverage: number;
  searchable_attributes: string; // Combined text for fast search

  details: CoverageDetails; // Keep for detailed view
  status: PlanStatus;
  isHotDeal?: boolean;
  createdAt: string;
}

export interface SearchQuery {
  id: string;
  originalText: string;
  parsedMake?: string;
  parsedModel?: string;
  parsedYear?: string;
  timestamp: string;
  hasResults: boolean;
}

export interface SearchResult {
  make: string;
  model: string;
  year: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
  attachedPlans?: InsurancePlan[]; // Plans associated with this message
  attachedCar?: SearchResult;      // Car context for this message
  options?: string[];              // For Wizard: List of choices (e.g. Models, Years)
  inputType?: 'select-brand' | 'select-model' | 'select-year' | 'text' | 'contact-options'; // What are we asking for?
  isError?: boolean; // New flag for error state
  isAlternativeResult?: boolean; // Flag for alternative/substitute plans
}

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUOTATION_SENT' | 'NEGOTIATING' | 'CLOSED' | 'LOST';

export interface Lead {
  id: string;
  agentId?: string;
  customerName: string;
  contactInfo: string;
  query: string;
  carDetails?: string;
  status: LeadStatus; // Updated status type
  createdAt: string;
  updatedAt?: string; // New field for tracking updates
  notes?: string; // New field for internal notes
  chatHistory?: ChatMessage[];
}

// New Interface for specific filters extracted by AI
export interface InsuranceFilters {
  planType?: string;      // e.g. "ชั้น 1", "ชั้น 2+"
  companyKeyword?: string; // e.g. "วิริยะ", "กรุงเทพ"
  attributes?: string[];   // e.g. ["no_deductible", "emergency_service", "mall_repair"]
  maxPrice?: number;       // Budget constraint
  minSumInsured?: number;  // Minimum sum insured
}

export interface AIProcessResult {
  reply: string;
  carData?: SearchResult;
  filters?: InsuranceFilters; // Added filters
  isComplete: boolean;
  intent: 'GREETING' | 'SEARCHING' | 'COMPLETE' | 'UNKNOWN' | 'CHANGE_FILTER';
  isError?: boolean; // Added error flag
}

export interface KnowledgeBaseItem {
  id: string;
  question: string; // Keyword or Question
  answer: string;   // The answer or info to provide
  category?: string;
}

export interface SystemSetting {
  key: string;
  value: string;
}

export interface ChatLog {
  id: string;
  sessionId: string;
  role: string; // Changed from 'user' | 'ai' to string to support 'AppEngine' etc.
  message: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
  deviceInfo?: string; // Parsed OS/Device
  
  // New Enhanced Fields
  lat?: number;
  lng?: number;
  city?: string;
  region?: string;
  isp?: string;
  referrer?: string;
  
  // NEW: Store rich content like plans/inputs
  metaData?: string; // JSON string
}