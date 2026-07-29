// ─────────────────────────────────────────────────────────────────────────────
// Permission System
// ─────────────────────────────────────────────────────────────────────────────
export type PermissionKey =
  | 'loads.view' | 'loads.create' | 'loads.edit' | 'loads.delete'
  | 'loads.assign' | 'loads.dispatch' | 'loads.view_rates'
  | 'accessorials.approve'
  | 'invoices.issue' | 'invoices.void'
  | 'factoring.submit'
  | 'settlements.approve' | 'settlements.pay'
  | 'drivers.manage'
  | 'fleet.manage'
  | 'customers.manage'
  | 'roles.manage'
  | 'users.manage'
  | 'tenant.settings'
  | 'audit.view';

export type PermissionScope = 'all' | 'own' | 'assigned';

export interface PermissionGrant {
  key: PermissionKey;
  scope: PermissionScope;
}

export interface Role {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  isSystemOwner: boolean;
  createdFromTemplate?: string;
  permissions: PermissionGrant[];
}

// ─────────────────────────────────────────────────────────────────────────────
// User
// ─────────────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  username: string;
  roleName: 'Admin' | 'Dispatcher/User' | string;
  avatarUrl?: string;
  roles: Role[];
  isOwner: boolean;
  isActive: boolean;
  expirationDate?: string | null;
  createdAt?: string;
  phone?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Load / Dispatch
// ─────────────────────────────────────────────────────────────────────────────
export type LoadStatus =
  | 'OPEN' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'DELIVERED_POD'
  | 'INVOICED' | 'PAID' | 'CANCELLED' | 'ON_HOLD';

export interface LoadStop {
  id: string;
  sequence: number;
  type: 'PICKUP' | 'DELIVERY';
  facilityName: string;
  city: string;
  state: string;
  zip: string;
  address: string;
  appointmentWindowStart: string;
  appointmentWindowEnd: string;
  arrivedAt?: string;
  departedAt?: string;
}

export interface Accessorial {
  id: string;
  loadId: string;
  type: 'DETENTION' | 'LAYOVER' | 'TONU' | 'LUMPER' | 'FUEL_SURCHARGE' | 'HAZMAT' | 'OTHER';
  description: string;
  billableAmountMinor: number;
  payableAmountMinor: number;
  approved: boolean;
  waived: boolean;
}

export interface LoadDocument {
  id: string;
  loadId: string;
  type: 'RATE_CONFIRMATION' | 'BOL' | 'POD' | 'RECEIPT' | 'WEIGHT_TICKET' | 'INVOICE_PDF';
  name: string;
  version: number;
  uploadedAt: string;
  uploadedBy: string;
  fileUrl: string;
  superseded: boolean;
}

export interface Load {
  id: string;
  tenantId: string;
  loadNumber: string;
  status: LoadStatus;

  // Customer / Broker
  brokerId: string;
  brokerName: string;
  brokerReference: string;

  // Rate info
  rateMinor: number;         // flat rate in cents
  perMileRateMinor?: number; // cents per mile
  fuelSurchargeMinor?: number;
  currency: string;

  // Driver & Fleet
  driverId?: string;
  driverName?: string;
  truckId?: string;
  truckNumber?: string;
  trailerId?: string;
  trailerNumber?: string;

  // Route summary (derived from stops but stored for quick display)
  originCity?: string;
  originState?: string;
  destCity?: string;
  destState?: string;
  pickupDate?: string;
  deliveryDate?: string;

  stops: LoadStop[];
  accessorials: Accessorial[];
  documents: LoadDocument[];

  loadedMiles: number;
  deadheadMiles: number;

  notes?: string;
  holdReason?: string;
  cancellationReason?: string;

  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Driver
// ─────────────────────────────────────────────────────────────────────────────
export type DriverPayType = 'PER_MILE' | 'FLAT_PERCENT' | 'PER_HOUR';
export type DriverStatus = 'AVAILABLE' | 'ON_LOAD' | 'INACTIVE';
export type EmploymentType = 'COMPANY_DRIVER' | 'OWNER_OPERATOR';

export interface Driver {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  employmentType: EmploymentType;
  assignedTruckId?: string;
  assignedTruckNumber?: string;
  cdlNumber: string;
  cdlClass?: string;
  cdlExpiration: string;
  medicalCardExpiration: string;
  status: DriverStatus;
  payRateType: DriverPayType;
  payRateMinor: number;   // cents per mile OR percentage * 100 OR cents per hour
  notes?: string;
  createdAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Equipment (Trucks & Trailers)
// ─────────────────────────────────────────────────────────────────────────────
export type EquipmentType = 'TRUCK' | 'TRAILER';
export type EquipmentStatus = 'ACTIVE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';

export interface Equipment {
  id: string;
  tenantId: string;
  unitNumber: string;
  type: EquipmentType;
  vin: string;
  makeModel: string;
  year: number;
  licensePlate?: string;
  odometerMiles?: number;
  inspectionDueDate: string;
  status: EquipmentStatus;
  assignedDriverId?: string;
  assignedDriverName?: string;
  notes?: string;
  createdAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Customer / Broker
// ─────────────────────────────────────────────────────────────────────────────
export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  mcNumber?: string;
  dotNumber?: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  billingAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  paymentTermsDays: number;
  creditLimitMinor: number;
  averageDaysToPay?: number;
  rating?: number;
  isActive: boolean;
  notes?: string;
  createdAt?: string;
}

// Keep Broker as alias for backward compatibility
export type Broker = Customer;

// ─────────────────────────────────────────────────────────────────────────────
// Invoice
// ─────────────────────────────────────────────────────────────────────────────
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'SUBMITTED_TO_FACTORING' | 'ADVANCED' | 'PAID' | 'OVERDUE' | 'DISPUTED' | 'VOID';

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  loadId?: string;
  loadNumber?: string;
  customerId?: string;
  customerName: string;
  issueDate: string;
  dueDate: string;
  subtotalMinor: number;
  accessorialsMinor: number;
  totalMinor: number;
  status: InvoiceStatus;

  // Driver settlement
  driverPayMinor?: number;
  driverSettlementStatus?: 'PENDING' | 'PAID';

  // Factoring
  factoringStatus?: 'PENDING' | 'ADVANCED' | 'RELEASED' | 'RECOURSE_REJECTED';
  advanceAmountMinor?: number;
  factoringFeeMinor?: number;
  reserveAmountMinor?: number;
  paidAmountMinor?: number;

  notes?: string;
  createdAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit Log
// ─────────────────────────────────────────────────────────────────────────────
export interface AuditLogEntry {
  id: string;
  tenantId: string;
  timestamp: string;
  actorName: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress: string;
}
