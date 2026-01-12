/**
 * User roles for role-based access control
 */
export type UserRole = 'founder' | 'accountant' | 'viewer';

/**
 * User interface
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Company interface
 */
export interface Company {
  id: string;
  name: string;
  industry: string;
  size: string;
  foundedYear: number;
  website?: string;
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Financial overview data
 */
export interface FinancialOverview {
  cashInBank: number;
  monthlyBurnRate: number;
  runwayMonths: number;
  alerts: Alert[];
  lastUpdated: Date;
}

/**
 * Alert interface
 */
export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  createdAt: Date;
  read: boolean;
}

/**
 * Cash flow data
 */
export interface CashFlowData {
  month: string;
  inflow: number;
  outflow: number;
  netFlow: number;
}

/**
 * Expense category
 */
export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  total: number;
  percentage: number;
}

/**
 * Expense item
 */
export interface Expense {
  id: string;
  vendor: string;
  category: string;
  amount: number;
  date: Date;
  description: string;
  isAnomalous: boolean;
  receiptUrl?: string;
}

/**
 * Runway simulation inputs
 */
export interface RunwaySimulationInput {
  hiringPlan: number;
  marketingSpend: number;
  revenueGrowth: number;
  otherChanges: number;
}

/**
 * Runway simulation result
 */
export interface RunwaySimulationResult {
  newBurnRate: number;
  newRunwayMonths: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

/**
 * Financial insight
 */
export interface FinancialInsight {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  category: string;
  createdAt: Date;
  read: boolean;
}

/**
 * Report data
 */
export interface Report {
  id: string;
  title: string;
  type: 'monthly' | 'quarterly' | 'annual';
  period: string;
  generatedAt: Date;
  status: 'ready' | 'generating' | 'failed';
  downloadUrl?: string;
}

/**
 * Team member
 */
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  lastActive: Date;
  status: 'active' | 'inactive';
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

/**
 * Authentication types
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  companyName: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: Date;
}