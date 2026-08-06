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
export type CdlEndorsement = 'HAZMAT' | 'TANKER';
export type DriverDocumentType = 'DRIVER_ID' | 'MEDICAL_CARD';

export interface DriverDocument {
  type: DriverDocumentType;
  name: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface Driver {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  /** Nine digits, no separators. */
  socialSecurityNumber: string;
  employmentType: EmploymentType;
  /** Owner operators only — both optional, since a new O/O may not have filed yet. */
  businessName?: string;
  einNumber?: string;
  assignedTruckId?: string;
  assignedTruckNumber?: string;
  cdlNumber: string;
  cdlClass?: string;
  cdlEndorsements?: CdlEndorsement[];
  documents?: DriverDocument[];
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
  /**
   * Truck ↔ trailer pairing. One-to-one, because a tractor pulls one trailer at
   * a time and a trailer sits behind one tractor. Stored on BOTH units so either
   * side can be read without scanning the fleet; mockStore owns the reciprocity
   * (setting one side always writes the other and breaks any prior pairing).
   */
  linkedEquipmentId?: string;
  notes?: string;
  createdAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Customer / Broker
// ─────────────────────────────────────────────────────────────────────────────
/** How an account settles. */
export type PaymentOption = 'CHECK' | 'DEPOSIT' | 'FACTORING';

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  mcNumber?: string;
  dotNumber?: string;
  /** Optional: plenty of broker accounts are set up from a load tender alone,
   *  with nothing but a company name and a DOT number to go on. */
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  billingAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  paymentOption?: PaymentOption;
  creditLimitMinor?: number;
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

// ─────────────────────────────────────────────────────────────────────────────
// Driver Payroll & Settlement
// ─────────────────────────────────────────────────────────────────────────────
export interface PayrollAddition {
  id: string;
  description: string;
  amountMinor: number;
}

export interface PayrollDeduction {
  id: string;
  description: string;
  amountMinor: number;
}

export interface DriverPayrollRecord {
  id: string;
  tenantId: string;
  payrollNumber: string;
  driverId: string;
  driverName: string;
  driverPayType: DriverPayType;
  driverPayRateValue: number;
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
  loadIds: string[];
  totalMiles: number;
  totalGrossRateMinor: number;
  basePayMinor: number;
  additions: PayrollAddition[];
  deductions: PayrollDeduction[];
  netPayMinor: number;
  status: 'DRAFT' | 'PROCESSED' | 'PAID';
  notes?: string;
  createdAt: string;
}
