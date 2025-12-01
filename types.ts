
export enum AidCategory {
  FOOD = 'Food',
  WATER = 'Water',
  MEDICAL = 'Medical Supplies',
  CLOTHING = 'Clothing',
  SHELTER = 'Shelter',
  HYGIENE = 'Hygiene',
  OTHER = 'Other'
}

export enum RequestStatus {
  PENDING = 'Pending',
  PARTIALLY_FULFILLED = 'Partially Fulfilled',
  FULFILLED = 'Fulfilled'
}

export interface AidItem {
  id: string;
  name: string;
  category: AidCategory;
  quantityNeeded: number;
  quantityReceived: number;
  unit: string; // e.g., 'packs', 'liters', 'units'
  keywords?: string[]; // AI-generated keywords/tags
}

export interface AidRequest {
  id: string;
  nic: string; // National Identity Card or unique ID
  fullName: string;
  contactNumber: string;
  extraContactNumber?: string;
  location: string;
  items: AidItem[];
  status: RequestStatus;
  createdAt: number;
  updatedAt: number;
  notes?: string;
}

export interface LocationOption {
  value: string;
  label: string;
}

export interface DashboardStats {
  totalRequests: number;
  fulfilledRequests: number;
  pendingRequests: number;
  topNeededItems: { name: string; count: number }[];
  needsByLocation: { location: string; count: number }[];
  topUrgentRegions: { location: string; count: number }[];
  keywordStats: { name: string; size: number }[];
}