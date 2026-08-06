import { Role, User, Load, Driver, Equipment, Customer, Invoice, AuditLogEntry } from '../types/tms';

const fourDaysFromNow = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const tenDaysFromNow = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const sixDaysFromNow = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

// ─────────────────────────────────────────────────────────────────────────────
// Relative demo dates
//
// The dashboard's revenue/profit cards bucket loads into this week, this month
// and this year, so the seed history is anchored to whenever the demo is run —
// hardcoded dates would drift out of every bucket within a month.
// ─────────────────────────────────────────────────────────────────────────────
const NOW = new Date();

/**
 * Format from local calendar fields — toISOString() would render local midnight
 * in UTC and slide the date back a day for anyone east of Greenwich.
 */
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Parse a YYYY-MM-DD string as a local calendar day. */
const parseYmd = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const addDays = (s: string, days: number) => {
  const d = parseYmd(s);
  d.setDate(d.getDate() + days);
  return ymd(d);
};

/** Monday of the current calendar week. */
const startOfWeek = (): Date => {
  const d = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // getDay(): Sunday = 0
  return d;
};

/** A day inside the current week, offset from Monday. */
const thisWeek = (mondayOffset: number): string => {
  const d = startOfWeek();
  d.setDate(d.getDate() + mondayOffset);
  return ymd(d);
};

/** A day in the current calendar month (usually before this week started). */
const thisMonth = (dayOfMonth: number): string =>
  ymd(new Date(NOW.getFullYear(), NOW.getMonth(), dayOfMonth));

/** A day in an earlier month of the current year. */
const monthsBack = (months: number, dayOfMonth: number): string =>
  ymd(new Date(NOW.getFullYear(), NOW.getMonth() - months, dayOfMonth));

const today = ymd(new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate()));

export const SEED_ROLES: Role[] = [
  {
    id: 'role-admin',
    tenantId: 'tenant-nune-express',
    name: 'Admin',
    description: 'Full system access across all modules.',
    isSystemOwner: true,
    permissions: [
      { key: 'loads.view', scope: 'all' }, { key: 'loads.create', scope: 'all' },
      { key: 'loads.edit', scope: 'all' }, { key: 'loads.delete', scope: 'all' },
      { key: 'loads.assign', scope: 'all' }, { key: 'loads.dispatch', scope: 'all' },
      { key: 'loads.view_rates', scope: 'all' }, { key: 'accessorials.approve', scope: 'all' },
      { key: 'invoices.issue', scope: 'all' }, { key: 'invoices.void', scope: 'all' },
      { key: 'factoring.submit', scope: 'all' }, { key: 'settlements.approve', scope: 'all' },
      { key: 'settlements.pay', scope: 'all' }, { key: 'drivers.manage', scope: 'all' },
      { key: 'fleet.manage', scope: 'all' }, { key: 'customers.manage', scope: 'all' },
      { key: 'roles.manage', scope: 'all' }, { key: 'users.manage', scope: 'all' },
      { key: 'tenant.settings', scope: 'all' }, { key: 'audit.view', scope: 'all' },
    ],
  },
  {
    id: 'role-dispatcher',
    tenantId: 'tenant-nune-express',
    name: 'Dispatcher/User',
    description: 'Manages loads, assignments, and dispatch operations.',
    isSystemOwner: false,
    permissions: [
      { key: 'loads.view', scope: 'all' }, { key: 'loads.create', scope: 'all' },
      { key: 'loads.edit', scope: 'all' }, { key: 'loads.assign', scope: 'all' },
      { key: 'loads.dispatch', scope: 'all' }, { key: 'loads.view_rates', scope: 'all' },
      { key: 'drivers.manage', scope: 'all' }, { key: 'fleet.manage', scope: 'all' },
      { key: 'customers.manage', scope: 'all' },
    ],
  },
];

export const SEED_USERS: User[] = [
  {
    id: 'usr-1', tenantId: 'tenant-nune-express',
    name: 'Nune Harutyunyan', email: 'admin@nuneexpress.com', username: 'admin',
    roleName: 'Admin', roles: [SEED_ROLES[0]], isOwner: true, isActive: true,
    expirationDate: null, phone: '(312) 555-0100',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'usr-2', tenantId: 'tenant-nune-express',
    name: 'Marcus Vance', email: 'marcus@nuneexpress.com', username: 'marcus',
    roleName: 'Dispatcher/User', roles: [SEED_ROLES[1]], isOwner: false, isActive: true,
    expirationDate: null, phone: '(312) 555-0182',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    createdAt: '2025-03-15T00:00:00Z',
  },
  {
    id: 'usr-3', tenantId: 'tenant-nune-express',
    name: 'Sarah Kowalski', email: 'sarah.k@nuneexpress.com', username: 'sarah',
    roleName: 'Dispatcher/User', roles: [SEED_ROLES[1]], isOwner: false, isActive: true,
    expirationDate: sixDaysFromNow, phone: '(312) 555-0291',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: '2025-06-01T00:00:00Z',
  },
  {
    id: 'usr-4', tenantId: 'tenant-nune-express',
    name: 'David Miller', email: 'david.miller@nuneexpress.com', username: 'dmiller',
    roleName: 'Dispatcher/User', roles: [SEED_ROLES[1]], isOwner: false, isActive: true,
    expirationDate: fourDaysFromNow, phone: '(312) 555-0149',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    createdAt: '2025-09-10T00:00:00Z',
  },
];

export const SEED_DRIVERS: Driver[] = [
  {
    id: 'drv-101', tenantId: 'tenant-nune-express',
    name: 'David Miller', email: 'dmiller@nuneexpress.com', phone: '(312) 555-0149',
    address: '1420 W. Division St, Chicago, IL', socialSecurityNumber: '412550188',
    employmentType: 'COMPANY_DRIVER',
    assignedTruckId: 'eq-1', assignedTruckNumber: 'TK-101',
    cdlNumber: 'IL-98402948', cdlClass: 'A', cdlExpiration: '2027-11-15',
    medicalCardExpiration: '2026-08-10', status: 'ON_LOAD',
    payRateType: 'PER_MILE', payRateMinor: 68, createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'drv-102', tenantId: 'tenant-nune-express',
    name: 'Alexei Kowalski', email: 'alexei.k@nuneexpress.com', phone: '(312) 555-0182',
    address: '8820 S. Cicero Ave, Chicago, IL', socialSecurityNumber: '327904471',
    employmentType: 'OWNER_OPERATOR', businessName: 'Kowalski Transport LLC', einNumber: '84-3920174',
    assignedTruckId: 'eq-2', assignedTruckNumber: 'TK-204',
    cdlNumber: 'IN-44910283', cdlClass: 'A', cdlExpiration: '2028-04-20',
    medicalCardExpiration: '2027-01-15', status: 'AVAILABLE',
    payRateType: 'FLAT_PERCENT', payRateMinor: 82, createdAt: '2024-02-20T00:00:00Z',
  },
  {
    id: 'drv-103', tenantId: 'tenant-nune-express',
    name: 'Roberto Santos', email: 'rsantos@nuneexpress.com', phone: '(773) 555-0344',
    address: '3310 N. Pulaski Rd, Chicago, IL', socialSecurityNumber: '556201933',
    employmentType: 'COMPANY_DRIVER',
    assignedTruckId: 'eq-3', assignedTruckNumber: 'TK-306',
    cdlNumber: 'IL-77201849', cdlClass: 'A', cdlExpiration: '2026-07-30',
    medicalCardExpiration: '2027-03-22', status: 'ON_LOAD',
    payRateType: 'PER_MILE', payRateMinor: 65, createdAt: '2024-04-01T00:00:00Z',
  },
  {
    id: 'drv-104', tenantId: 'tenant-nune-express',
    name: 'James Thompson', email: 'jthompson@nuneexpress.com', phone: '(312) 555-0478',
    address: '5590 W. Irving Park Rd, Chicago, IL', socialSecurityNumber: '281447605',
    employmentType: 'COMPANY_DRIVER',
    cdlNumber: 'IL-33128477', cdlClass: 'A', cdlExpiration: '2027-06-01',
    medicalCardExpiration: '2026-09-30', status: 'AVAILABLE',
    payRateType: 'PER_MILE', payRateMinor: 70, createdAt: '2024-06-15T00:00:00Z',
  },
  {
    id: 'drv-105', tenantId: 'tenant-nune-express',
    name: 'Kim Nguyen', email: 'knguyen@nuneexpress.com', phone: '(847) 555-0591',
    address: '2280 Dempster St, Evanston, IL', socialSecurityNumber: '739118240',
    employmentType: 'OWNER_OPERATOR', businessName: 'K.N. Freight Services', einNumber: '87-1104558',
    cdlNumber: 'IL-55849201', cdlClass: 'A', cdlExpiration: '2028-12-10',
    medicalCardExpiration: '2027-11-05', status: 'INACTIVE',
    payRateType: 'FLAT_PERCENT', payRateMinor: 85, notes: 'On medical leave.',
    createdAt: '2024-08-01T00:00:00Z',
  },
];

export const SEED_EQUIPMENT: Equipment[] = [
  {
    id: 'eq-1', tenantId: 'tenant-nune-express', unitNumber: 'TK-101', type: 'TRUCK',
    vin: '1XKDDB9X2MD840291', makeModel: '2023 Kenworth T680', year: 2023,
    licensePlate: 'IL-TM2941', odometerMiles: 142050, inspectionDueDate: '2026-12-15',
    status: 'ACTIVE', assignedDriverId: 'drv-101', assignedDriverName: 'David Miller',
    linkedEquipmentId: 'eq-5', createdAt: '2023-05-01T00:00:00Z',
  },
  {
    id: 'eq-2', tenantId: 'tenant-nune-express', unitNumber: 'TK-204', type: 'TRUCK',
    vin: '3AKJHHDR9KS019284', makeModel: '2022 Freightliner Cascadia', year: 2022,
    licensePlate: 'IN-BT7720', odometerMiles: 218400, inspectionDueDate: '2026-09-01',
    status: 'ACTIVE', assignedDriverId: 'drv-102', assignedDriverName: 'Alexei Kowalski',
    linkedEquipmentId: 'eq-6', createdAt: '2022-09-15T00:00:00Z',
  },
  {
    id: 'eq-3', tenantId: 'tenant-nune-express', unitNumber: 'TK-306', type: 'TRUCK',
    vin: '4V4NC9EH7NN904183', makeModel: '2024 Volvo VNL860', year: 2024,
    licensePlate: 'IL-VN3904', odometerMiles: 58300, inspectionDueDate: '2027-03-01',
    status: 'ACTIVE', assignedDriverId: 'drv-103', assignedDriverName: 'Roberto Santos',
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'eq-4', tenantId: 'tenant-nune-express', unitNumber: 'TK-412', type: 'TRUCK',
    vin: '1FUJHHDR3NLBD0291', makeModel: '2021 Peterbilt 579', year: 2021,
    licensePlate: 'IL-PB1842', odometerMiles: 331200, inspectionDueDate: '2026-08-15',
    status: 'MAINTENANCE', notes: 'Engine overhaul in progress.',
    createdAt: '2021-06-20T00:00:00Z',
  },
  {
    id: 'eq-5', tenantId: 'tenant-nune-express', unitNumber: 'TR-501', type: 'TRAILER',
    vin: '1GRAA0621GJ109834', makeModel: '2022 Great Dane Everest', year: 2022,
    licensePlate: 'IL-GD5019', inspectionDueDate: '2026-11-30',
    status: 'ACTIVE', linkedEquipmentId: 'eq-1', createdAt: '2022-03-10T00:00:00Z',
  },
  {
    id: 'eq-6', tenantId: 'tenant-nune-express', unitNumber: 'TR-502', type: 'TRAILER',
    vin: '1JJV532D8NL280192', makeModel: '2023 Wabash DuraPlate', year: 2023,
    licensePlate: 'IL-WB2830', inspectionDueDate: '2027-01-20',
    status: 'ACTIVE', linkedEquipmentId: 'eq-2', createdAt: '2023-01-15T00:00:00Z',
  },
  {
    id: 'eq-7', tenantId: 'tenant-nune-express', unitNumber: 'TR-503', type: 'TRAILER',
    vin: '1RNF53A22LR039201', makeModel: '2020 Strick Van', year: 2020,
    licensePlate: 'IL-SK3092', inspectionDueDate: '2026-06-30',
    status: 'OUT_OF_SERVICE', notes: 'Failed DOT inspection. Awaiting repairs.',
    createdAt: '2020-11-01T00:00:00Z',
  },
];

export const SEED_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1', tenantId: 'tenant-nune-express', name: 'C.H. Robinson Worldwide',
    mcNumber: 'MC-142857', dotNumber: '384821', contactPerson: 'Tom Harkness', contactEmail: 'freight@chrobinson.com',
    contactPhone: '(800) 323-7587', billingAddress: '14701 Charlson Rd', city: 'Eden Prairie',
    state: 'MN', zip: '55347', paymentOption: 'FACTORING', creditLimitMinor: 10000000,
    averageDaysToPay: 24, rating: 4.8, isActive: true, createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cust-2', tenantId: 'tenant-nune-express', name: 'Echo Global Logistics',
    mcNumber: 'MC-710981', dotNumber: '2005393', contactPerson: 'Diane Russo', contactEmail: 'ops@echo.com',
    contactPhone: '(800) 354-7993', billingAddress: '600 W. Chicago Ave', city: 'Chicago',
    state: 'IL', zip: '60654', paymentOption: 'DEPOSIT', creditLimitMinor: 5000000,
    averageDaysToPay: 18, rating: 4.5, isActive: true, createdAt: '2024-02-15T00:00:00Z',
  },
  {
    id: 'cust-3', tenantId: 'tenant-nune-express', name: 'XPO Logistics',
    mcNumber: 'MC-305038', dotNumber: '1259969', contactPerson: 'Greg Fowler', contactEmail: 'carrier@xpo.com',
    contactPhone: '(844) 742-5976', billingAddress: '5 American Ln', city: 'Greenwich',
    state: 'CT', zip: '06831', paymentOption: 'CHECK', creditLimitMinor: 15000000,
    averageDaysToPay: 38, rating: 4.1, isActive: true, createdAt: '2024-03-01T00:00:00Z',
  },
  {
    id: 'cust-4', tenantId: 'tenant-nune-express', name: 'Coyote Logistics',
    mcNumber: 'MC-419380', dotNumber: '2136495', contactPerson: 'Lisa Tran', contactEmail: 'freight@coyote.com',
    contactPhone: '(877) 268-9683', billingAddress: '2545 W Diversey Pkwy', city: 'Chicago',
    state: 'IL', zip: '60647', paymentOption: 'FACTORING', creditLimitMinor: 7500000,
    averageDaysToPay: 27, rating: 4.3, isActive: true, createdAt: '2024-04-10T00:00:00Z',
  },
  {
    id: 'cust-5', tenantId: 'tenant-nune-express', name: 'Transplace Inc.',
    mcNumber: 'MC-882011', dotNumber: '1698306', contactPerson: 'Mark Reid', contactEmail: 'ops@transplace.com',
    contactPhone: '(512) 374-4840', billingAddress: '15305 N Dallas Pkwy', city: 'Addison',
    state: 'TX', zip: '75001', paymentOption: 'CHECK', creditLimitMinor: 3000000,
    isActive: false, notes: 'Account on hold pending credit review.', createdAt: '2023-11-01T00:00:00Z',
  },
];

export const SEED_LOADS: Load[] = [
  {
    id: 'ld-1001', tenantId: 'tenant-nune-express', loadNumber: 'NE-2026-084',
    status: 'IN_TRANSIT', brokerId: 'cust-1', brokerName: 'C.H. Robinson Worldwide',
    brokerReference: 'CHR-994029', rateMinor: 385000, currency: 'USD',
    driverId: 'drv-101', driverName: 'David Miller', truckId: 'eq-1', truckNumber: 'TK-101',
    trailerId: 'eq-5', trailerNumber: 'TR-501',
    originCity: 'Chicago', originState: 'IL', destCity: 'Atlanta', destState: 'GA',
    pickupDate: '2026-07-28', deliveryDate: '2026-07-29',
    loadedMiles: 920, deadheadMiles: 45,
    stops: [
      { id: 'stp-1', sequence: 1, type: 'PICKUP', facilityName: 'General Mills Logistics',
        address: '1000 Mills Way', city: 'Chicago', state: 'IL', zip: '60601',
        appointmentWindowStart: '2026-07-28T08:00:00Z', appointmentWindowEnd: '2026-07-28T11:00:00Z',
        arrivedAt: '2026-07-28T08:15:00Z', departedAt: '2026-07-28T10:30:00Z' },
      { id: 'stp-2', sequence: 2, type: 'DELIVERY', facilityName: 'Kroger Distribution Center',
        address: '4500 Commerce Pkwy', city: 'Atlanta', state: 'GA', zip: '30301',
        appointmentWindowStart: '2026-07-29T14:00:00Z', appointmentWindowEnd: '2026-07-29T17:00:00Z' },
    ],
    accessorials: [], documents: [], createdAt: '2026-07-27T12:00:00Z', updatedAt: '2026-07-28T10:35:00Z',
  },
  {
    id: 'ld-1002', tenantId: 'tenant-nune-express', loadNumber: 'NE-2026-085',
    status: 'DISPATCHED', brokerId: 'cust-2', brokerName: 'Echo Global Logistics',
    brokerReference: 'ECHO-774421', rateMinor: 290000, currency: 'USD',
    driverId: 'drv-103', driverName: 'Roberto Santos', truckId: 'eq-3', truckNumber: 'TK-306',
    originCity: 'Indianapolis', originState: 'IN', destCity: 'Nashville', destState: 'TN',
    pickupDate: '2026-07-29', deliveryDate: '2026-07-29',
    loadedMiles: 285, deadheadMiles: 32,
    stops: [
      { id: 'stp-3', sequence: 1, type: 'PICKUP', facilityName: 'Subaru of Indiana',
        address: '5500 Subaru Dr', city: 'Lafayette', state: 'IN', zip: '47905',
        appointmentWindowStart: '2026-07-29T06:00:00Z', appointmentWindowEnd: '2026-07-29T09:00:00Z' },
      { id: 'stp-4', sequence: 2, type: 'DELIVERY', facilityName: 'AutoZone DC',
        address: '123 AutoZone Dr', city: 'Memphis', state: 'TN', zip: '38101',
        appointmentWindowStart: '2026-07-29T18:00:00Z', appointmentWindowEnd: '2026-07-29T21:00:00Z' },
    ],
    accessorials: [], documents: [], createdAt: '2026-07-28T07:00:00Z', updatedAt: '2026-07-28T09:00:00Z',
  },
  {
    id: 'ld-1003', tenantId: 'tenant-nune-express', loadNumber: 'NE-2026-086',
    status: 'OPEN', brokerId: 'cust-3', brokerName: 'XPO Logistics',
    brokerReference: 'XPO-330912', rateMinor: 450000, currency: 'USD',
    originCity: 'Chicago', originState: 'IL', destCity: 'Dallas', destState: 'TX',
    pickupDate: '2026-07-30', deliveryDate: '2026-07-31',
    loadedMiles: 924, deadheadMiles: 0,
    stops: [
      { id: 'stp-5', sequence: 1, type: 'PICKUP', facilityName: 'Amazon Fulfillment MDW4',
        address: '250 Emerald Dr', city: 'Joliet', state: 'IL', zip: '60433',
        appointmentWindowStart: '2026-07-30T07:00:00Z', appointmentWindowEnd: '2026-07-30T10:00:00Z' },
      { id: 'stp-6', sequence: 2, type: 'DELIVERY', facilityName: 'IKEA Distribution DFW',
        address: '6100 Park Vista Cir', city: 'Fort Worth', state: 'TX', zip: '76244',
        appointmentWindowStart: '2026-07-31T10:00:00Z', appointmentWindowEnd: '2026-07-31T14:00:00Z' },
    ],
    accessorials: [], documents: [], createdAt: '2026-07-28T08:00:00Z', updatedAt: '2026-07-28T08:00:00Z',
  },
  {
    id: 'ld-1004', tenantId: 'tenant-nune-express', loadNumber: 'NE-2026-083',
    status: 'DELIVERED', brokerId: 'cust-4', brokerName: 'Coyote Logistics',
    brokerReference: 'COY-558293', rateMinor: 320000, currency: 'USD',
    driverId: 'drv-102', driverName: 'Alexei Kowalski', truckId: 'eq-2', truckNumber: 'TK-204',
    originCity: 'Detroit', originState: 'MI', destCity: 'Cleveland', destState: 'OH',
    pickupDate: '2026-07-26', deliveryDate: '2026-07-27',
    loadedMiles: 169, deadheadMiles: 12,
    stops: [
      { id: 'stp-7', sequence: 1, type: 'PICKUP', facilityName: 'Ford Motor Warehouse',
        address: '20000 Rotunda Dr', city: 'Dearborn', state: 'MI', zip: '48124',
        appointmentWindowStart: '2026-07-26T08:00:00Z', appointmentWindowEnd: '2026-07-26T11:00:00Z',
        arrivedAt: '2026-07-26T08:05:00Z', departedAt: '2026-07-26T10:20:00Z' },
      { id: 'stp-8', sequence: 2, type: 'DELIVERY', facilityName: 'Sherwin-Williams HQ',
        address: '101 W. Prospect Ave', city: 'Cleveland', state: 'OH', zip: '44115',
        appointmentWindowStart: '2026-07-27T13:00:00Z', appointmentWindowEnd: '2026-07-27T16:00:00Z',
        arrivedAt: '2026-07-27T13:30:00Z', departedAt: '2026-07-27T15:45:00Z' },
    ],
    accessorials: [
      { id: 'acc-1', loadId: 'ld-1004', type: 'DETENTION', description: '2hr detention at pickup',
        billableAmountMinor: 30000, payableAmountMinor: 15000, approved: true, waived: false },
    ],
    documents: [], createdAt: '2026-07-25T10:00:00Z', updatedAt: '2026-07-27T16:00:00Z',
  },
  {
    id: 'ld-1005', tenantId: 'tenant-nune-express', loadNumber: 'NE-2026-082',
    status: 'INVOICED', brokerId: 'cust-1', brokerName: 'C.H. Robinson Worldwide',
    brokerReference: 'CHR-881104', rateMinor: 520000, currency: 'USD',
    driverId: 'drv-101', driverName: 'David Miller', truckId: 'eq-1', truckNumber: 'TK-101',
    originCity: 'Chicago', originState: 'IL', destCity: 'New York', destState: 'NY',
    pickupDate: '2026-07-22', deliveryDate: '2026-07-23',
    loadedMiles: 790, deadheadMiles: 28,
    stops: [
      { id: 'stp-9', sequence: 1, type: 'PICKUP', facilityName: 'Kellogg Distribution Center',
        address: '2400 Distribution Dr', city: 'Chicago', state: 'IL', zip: '60638',
        appointmentWindowStart: '2026-07-22T06:00:00Z', appointmentWindowEnd: '2026-07-22T09:00:00Z',
        arrivedAt: '2026-07-22T06:30:00Z', departedAt: '2026-07-22T08:45:00Z' },
      { id: 'stp-10', sequence: 2, type: 'DELIVERY', facilityName: 'Target NYC Fulfillment',
        address: '500 Atrium Dr', city: 'Newark', state: 'NJ', zip: '07114',
        appointmentWindowStart: '2026-07-23T08:00:00Z', appointmentWindowEnd: '2026-07-23T12:00:00Z',
        arrivedAt: '2026-07-23T08:20:00Z', departedAt: '2026-07-23T11:10:00Z' },
    ],
    accessorials: [], documents: [], createdAt: '2026-07-21T14:00:00Z', updatedAt: '2026-07-23T12:00:00Z',
  },
  {
    id: 'ld-1006', tenantId: 'tenant-nune-express', loadNumber: 'NE-2026-081',
    status: 'PAID', brokerId: 'cust-2', brokerName: 'Echo Global Logistics',
    brokerReference: 'ECHO-669341', rateMinor: 275000, currency: 'USD',
    driverId: 'drv-102', driverName: 'Alexei Kowalski', truckId: 'eq-2', truckNumber: 'TK-204',
    originCity: 'Milwaukee', originState: 'WI', destCity: 'Columbus', destState: 'OH',
    pickupDate: '2026-07-18', deliveryDate: '2026-07-19',
    loadedMiles: 360, deadheadMiles: 18,
    stops: [
      { id: 'stp-11', sequence: 1, type: 'PICKUP', facilityName: 'Harley-Davidson Warehouse',
        address: '3700 W Juneau Ave', city: 'Milwaukee', state: 'WI', zip: '53208',
        appointmentWindowStart: '2026-07-18T07:00:00Z', appointmentWindowEnd: '2026-07-18T10:00:00Z',
        arrivedAt: '2026-07-18T07:15:00Z', departedAt: '2026-07-18T09:30:00Z' },
      { id: 'stp-12', sequence: 2, type: 'DELIVERY', facilityName: 'Big Lots Distribution',
        address: '4900 E Dublin-Granville Rd', city: 'Columbus', state: 'OH', zip: '43081',
        appointmentWindowStart: '2026-07-19T09:00:00Z', appointmentWindowEnd: '2026-07-19T12:00:00Z',
        arrivedAt: '2026-07-19T09:10:00Z', departedAt: '2026-07-19T11:45:00Z' },
    ],
    accessorials: [], documents: [], createdAt: '2026-07-17T12:00:00Z', updatedAt: '2026-07-19T12:00:00Z',
  },

  // ── Settled history, spread across this week / this month / earlier this year
  // so the dashboard's revenue & profit cards show a different figure per period.
  ...([
    {
      id: 'ld-2001', loadNumber: 'NE-2026-090', status: 'PAID' as const, date: thisWeek(0),
      brokerId: 'cust-1', brokerName: 'C.H. Robinson Worldwide', brokerReference: 'CHR-101884',
      rateMinor: 420000, driverId: 'drv-101', driverName: 'David Miller',
      truckId: 'eq-1', truckNumber: 'TK-101',
      originCity: 'Chicago', originState: 'IL', destCity: 'Kansas City', destState: 'MO',
      loadedMiles: 510, deadheadMiles: 22,
      pickupFacility: 'Conagra Brands DC', deliveryFacility: 'Hy-Vee Distribution',
    },
    {
      id: 'ld-2002', loadNumber: 'NE-2026-091', status: 'DELIVERED' as const, date: today,
      brokerId: 'cust-4', brokerName: 'Coyote Logistics', brokerReference: 'COY-772014',
      rateMinor: 360000, driverId: 'drv-102', driverName: 'Alexei Kowalski',
      truckId: 'eq-2', truckNumber: 'TK-204',
      originCity: 'Detroit', originState: 'MI', destCity: 'Indianapolis', destState: 'IN',
      loadedMiles: 290, deadheadMiles: 15,
      pickupFacility: 'GM Components Holdings', deliveryFacility: 'Rolls-Royce Indy Plant',
    },
    {
      id: 'ld-2003', loadNumber: 'NE-2026-089', status: 'PAID' as const, date: thisMonth(1),
      brokerId: 'cust-3', brokerName: 'XPO Logistics', brokerReference: 'XPO-448120',
      rateMinor: 515000, driverId: 'drv-103', driverName: 'Roberto Santos',
      truckId: 'eq-3', truckNumber: 'TK-306',
      originCity: 'Dallas', originState: 'TX', destCity: 'Phoenix', destState: 'AZ',
      loadedMiles: 1065, deadheadMiles: 40,
      pickupFacility: 'Frito-Lay Plano DC', deliveryFacility: 'Sprouts Farmers Market DC',
    },
    {
      id: 'ld-2004', loadNumber: 'NE-2026-070', status: 'PAID' as const, date: monthsBack(1, 12),
      brokerId: 'cust-2', brokerName: 'Echo Global Logistics', brokerReference: 'ECHO-330187',
      rateMinor: 640000, driverId: 'drv-101', driverName: 'David Miller',
      truckId: 'eq-1', truckNumber: 'TK-101',
      originCity: 'Seattle', originState: 'WA', destCity: 'Denver', destState: 'CO',
      loadedMiles: 1320, deadheadMiles: 60,
      pickupFacility: 'Boeing Everett Supply', deliveryFacility: 'King Soopers DC',
    },
    {
      id: 'ld-2005', loadNumber: 'NE-2026-055', status: 'PAID' as const, date: monthsBack(3, 8),
      brokerId: 'cust-1', brokerName: 'C.H. Robinson Worldwide', brokerReference: 'CHR-660934',
      rateMinor: 295000, driverId: 'drv-102', driverName: 'Alexei Kowalski',
      truckId: 'eq-2', truckNumber: 'TK-204',
      originCity: 'Atlanta', originState: 'GA', destCity: 'Orlando', destState: 'FL',
      loadedMiles: 440, deadheadMiles: 18,
      pickupFacility: 'Home Depot Atlanta RDC', deliveryFacility: 'Publix Orlando DC',
    },
    {
      id: 'ld-2006', loadNumber: 'NE-2026-032', status: 'PAID' as const, date: monthsBack(6, 20),
      brokerId: 'cust-4', brokerName: 'Coyote Logistics', brokerReference: 'COY-118472',
      rateMinor: 810000, driverId: 'drv-103', driverName: 'Roberto Santos',
      truckId: 'eq-3', truckNumber: 'TK-306',
      originCity: 'Los Angeles', originState: 'CA', destCity: 'Chicago', destState: 'IL',
      loadedMiles: 2015, deadheadMiles: 75,
      pickupFacility: 'Port of LA Cross-dock', deliveryFacility: 'Walgreens Chicago DC',
    },
  ].map<Load>((h, i) => ({
    id: h.id,
    tenantId: 'tenant-nune-express',
    loadNumber: h.loadNumber,
    status: h.status,
    brokerId: h.brokerId,
    brokerName: h.brokerName,
    brokerReference: h.brokerReference,
    rateMinor: h.rateMinor,
    currency: 'USD',
    driverId: h.driverId,
    driverName: h.driverName,
    truckId: h.truckId,
    truckNumber: h.truckNumber,
    originCity: h.originCity,
    originState: h.originState,
    destCity: h.destCity,
    destState: h.destState,
    pickupDate: h.date,
    deliveryDate: h.date,
    loadedMiles: h.loadedMiles,
    deadheadMiles: h.deadheadMiles,
    stops: [
      {
        id: `stp-h${i}-1`, sequence: 1, type: 'PICKUP', facilityName: h.pickupFacility,
        address: '1 Logistics Way', city: h.originCity, state: h.originState, zip: '00000',
        appointmentWindowStart: `${h.date}T08:00:00Z`, appointmentWindowEnd: `${h.date}T11:00:00Z`,
        arrivedAt: `${h.date}T08:10:00Z`, departedAt: `${h.date}T10:15:00Z`,
      },
      {
        id: `stp-h${i}-2`, sequence: 2, type: 'DELIVERY', facilityName: h.deliveryFacility,
        address: '1 Receiving Dock', city: h.destCity, state: h.destState, zip: '00000',
        appointmentWindowStart: `${h.date}T14:00:00Z`, appointmentWindowEnd: `${h.date}T17:00:00Z`,
        arrivedAt: `${h.date}T14:20:00Z`, departedAt: `${h.date}T16:05:00Z`,
      },
    ],
    accessorials: [],
    documents: [],
    createdAt: `${h.date}T07:00:00Z`,
    updatedAt: `${h.date}T17:00:00Z`,
  }))),
];

export const SEED_INVOICES: Invoice[] = [
  {
    id: 'inv-1001', tenantId: 'tenant-nune-express', invoiceNumber: 'INV-2026-051',
    loadId: 'ld-1005', loadNumber: 'NE-2026-082',
    customerId: 'cust-1', customerName: 'C.H. Robinson Worldwide',
    issueDate: '2026-07-23', dueDate: '2026-08-22',
    subtotalMinor: 520000, accessorialsMinor: 0, totalMinor: 520000,
    status: 'ISSUED', driverPayMinor: 384800, driverSettlementStatus: 'PENDING',
    createdAt: '2026-07-23T14:00:00Z',
  },
  {
    id: 'inv-1002', tenantId: 'tenant-nune-express', invoiceNumber: 'INV-2026-050',
    loadId: 'ld-1006', loadNumber: 'NE-2026-081',
    customerId: 'cust-2', customerName: 'Echo Global Logistics',
    issueDate: '2026-07-19', dueDate: '2026-08-09',
    subtotalMinor: 275000, accessorialsMinor: 0, totalMinor: 275000,
    status: 'PAID', paidAmountMinor: 275000,
    driverPayMinor: 225500, driverSettlementStatus: 'PAID',
    createdAt: '2026-07-19T14:00:00Z',
  },
  {
    id: 'inv-1003', tenantId: 'tenant-nune-express', invoiceNumber: 'INV-2026-049',
    customerId: 'cust-3', customerName: 'XPO Logistics',
    issueDate: '2026-07-10', dueDate: '2026-07-25',
    subtotalMinor: 390000, accessorialsMinor: 15000, totalMinor: 405000,
    status: 'OVERDUE', driverPayMinor: 332100, driverSettlementStatus: 'PENDING',
    createdAt: '2026-07-10T09:00:00Z',
  },

  // Settlements for the history loads above — driver pay at 72% of the linehaul
  // and a 3% factoring fee are what the dashboard's profit card nets out.
  ...([
    { load: 'ld-2001', num: 'NE-2026-090', inv: 'INV-2026-090', cust: 'cust-1', custName: 'C.H. Robinson Worldwide', rate: 420000, date: thisWeek(0), paid: true },
    { load: 'ld-2002', num: 'NE-2026-091', inv: 'INV-2026-091', cust: 'cust-4', custName: 'Coyote Logistics', rate: 360000, date: today, paid: false },
    { load: 'ld-2003', num: 'NE-2026-089', inv: 'INV-2026-089', cust: 'cust-3', custName: 'XPO Logistics', rate: 515000, date: thisMonth(1), paid: true },
    { load: 'ld-2004', num: 'NE-2026-070', inv: 'INV-2026-070', cust: 'cust-2', custName: 'Echo Global Logistics', rate: 640000, date: monthsBack(1, 12), paid: true },
    { load: 'ld-2005', num: 'NE-2026-055', inv: 'INV-2026-055', cust: 'cust-1', custName: 'C.H. Robinson Worldwide', rate: 295000, date: monthsBack(3, 8), paid: true },
    { load: 'ld-2006', num: 'NE-2026-032', inv: 'INV-2026-032', cust: 'cust-4', custName: 'Coyote Logistics', rate: 810000, date: monthsBack(6, 20), paid: true },
  ].map<Invoice>((s) => ({
    id: s.inv.toLowerCase(),
    tenantId: 'tenant-nune-express',
    invoiceNumber: s.inv,
    loadId: s.load,
    loadNumber: s.num,
    customerId: s.cust,
    customerName: s.custName,
    issueDate: s.date,
    dueDate: addDays(s.date, 30),
    subtotalMinor: s.rate,
    accessorialsMinor: 0,
    totalMinor: s.rate,
    status: s.paid ? 'PAID' : 'ISSUED',
    paidAmountMinor: s.paid ? s.rate : undefined,
    driverPayMinor: Math.round(s.rate * 0.72),
    driverSettlementStatus: s.paid ? 'PAID' : 'PENDING',
    factoringFeeMinor: Math.round(s.rate * 0.03),
    createdAt: `${s.date}T18:00:00Z`,
  }))),
];

export const SEED_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-1', tenantId: 'tenant-nune-express', timestamp: new Date(Date.now() - 3600000).toISOString(),
    actorName: 'Nune Harutyunyan', actorEmail: 'admin@nuneexpress.com',
    action: 'loads.create', entityType: 'Load', entityId: 'ld-1003',
    details: 'Created load NE-2026-086 (XPO Logistics)', ipAddress: '192.168.1.100',
  },
  {
    id: 'log-2', tenantId: 'tenant-nune-express', timestamp: new Date(Date.now() - 7200000).toISOString(),
    actorName: 'Marcus Vance', actorEmail: 'marcus@nuneexpress.com',
    action: 'loads.assign', entityType: 'Load', entityId: 'ld-1002',
    details: 'Assigned NE-2026-085 to Roberto Santos (TK-306)', ipAddress: '192.168.1.101',
  },
];
