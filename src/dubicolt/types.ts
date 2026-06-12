export type UserRole = 'buyer' | 'admin' | 'vendor';

export interface DubicoltUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
}

export interface CompatibleVehicle {
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  engine?: string;
}

export interface ProductPayload {
  title: string;
  sku: string;
  description: string;
  category: string;
  brand: string;
  oemNumber?: string;
  sellingPrice: number;
  imageUrl: string;
  images?: string[];
  compatibleVehicles?: CompatibleVehicle[];
}
