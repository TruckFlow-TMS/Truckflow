import {
  Load, LoadStatus, Driver, DriverStatus, Equipment, EquipmentStatus,
  Customer, Invoice, InvoiceStatus, Role, User, AuditLogEntry, Accessorial, LoadDocument,
} from '../types/tms';
import {
  SEED_LOADS, SEED_DRIVERS, SEED_EQUIPMENT, SEED_CUSTOMERS,
  SEED_INVOICES, SEED_ROLES, SEED_USERS, SEED_AUDIT_LOGS,
} from './mockData';

const K = {
  LOADS: 'nune_tms_loads', DRIVERS: 'nune_tms_drivers', EQUIPMENT: 'nune_tms_equipment',
  CUSTOMERS: 'nune_tms_customers', INVOICES: 'nune_tms_invoices', ROLES: 'nune_tms_roles',
  USERS: 'nune_tms_users', AUDIT: 'nune_tms_audit', TOKEN: 'nune_tms_jwt_token',
};

class MockStore {
  private loads: Load[] = [];
  private drivers: Driver[] = [];
  private equipment: Equipment[] = [];
  private customers: Customer[] = [];
  private invoices: Invoice[] = [];
  private roles: Role[] = [];
  private users: User[] = [];
  private auditLogs: AuditLogEntry[] = [];

  public simulatedLatencyMs = 80;
  public simulateErrors = false;
  private listeners: Set<() => void> = new Set();

  constructor() { this.init(); }

  private init() {
    this.loads = this.fromStorage(K.LOADS, SEED_LOADS);
    this.drivers = this.fromStorage(K.DRIVERS, SEED_DRIVERS);
    this.equipment = this.fromStorage(K.EQUIPMENT, SEED_EQUIPMENT);
    this.customers = this.fromStorage(K.CUSTOMERS, SEED_CUSTOMERS);
    this.invoices = this.fromStorage(K.INVOICES, SEED_INVOICES);
    this.roles = this.fromStorage(K.ROLES, SEED_ROLES);
    this.users = this.fromStorage(K.USERS, SEED_USERS);
    this.auditLogs = this.fromStorage(K.AUDIT, SEED_AUDIT_LOGS);
  }

  private fromStorage<T>(key: string, seed: T): T {
    try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : seed; } catch { return seed; }
  }

  private save(key: string, data: unknown) {
    try { localStorage.setItem(key, JSON.stringify(data)); this.notify(); } catch (e) { console.error(e); }
  }

  public subscribe(cb: () => void) { this.listeners.add(cb); return () => this.listeners.delete(cb); }
  private notify() { this.listeners.forEach(cb => cb()); }

  private async sim() {
    if (this.simulatedLatencyMs > 0) await new Promise(r => setTimeout(r, this.simulatedLatencyMs));
    if (this.simulateErrors) throw new Error('[Simulated Error] Server 500');
  }

  private uid(prefix = 'id') { return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9999)}`; }

  public audit(actor: User, action: string, entityType: string, entityId: string, details: string) {
    const entry: AuditLogEntry = {
      id: this.uid('log'), tenantId: actor.tenantId, timestamp: new Date().toISOString(),
      actorName: actor.name, actorEmail: actor.email, action, entityType, entityId, details,
      ipAddress: '192.168.1.100',
    };
    this.auditLogs = [entry, ...this.auditLogs.slice(0, 499)];
    this.save(K.AUDIT, this.auditLogs);
  }

  // ─── GETTERS ───────────────────────────────────────────────────────────────
  async getLoads(): Promise<Load[]> { await this.sim(); return [...this.loads]; }
  async getDrivers(): Promise<Driver[]> { await this.sim(); return [...this.drivers]; }
  async getEquipment(): Promise<Equipment[]> { await this.sim(); return [...this.equipment]; }
  async getCustomers(): Promise<Customer[]> { await this.sim(); return [...this.customers]; }
  async getBrokers(): Promise<Customer[]> { return this.getCustomers(); } // alias
  async getInvoices(): Promise<Invoice[]> { await this.sim(); return [...this.invoices]; }
  async getRoles(): Promise<Role[]> { await this.sim(); return [...this.roles]; }
  async getUsers(): Promise<User[]> { await this.sim(); return [...this.users]; }
  async getAuditLogs(): Promise<AuditLogEntry[]> { await this.sim(); return [...this.auditLogs]; }

  // ─── USER CRUD ──────────────────────────────────────────────────────────────
  async createUser(data: Partial<User> & { password?: string }, actor: User): Promise<User> {
    await this.sim();
    if (!actor.isOwner && actor.roleName !== 'Admin') throw new Error('Unauthorized: Admin only.');
    const exists = this.users.find(u => u.username === data.username || u.email === data.email);
    if (exists) throw new Error(`Username or email already exists.`);
    const matchedRole = this.roles.find(r => r.name === data.roleName) || this.roles[1];
    const user: User = {
      id: this.uid('usr'), tenantId: actor.tenantId, email: data.email || '',
      username: data.username || '', name: data.name || data.username || '',
      roleName: data.roleName || 'Dispatcher/User', roles: [matchedRole],
      isOwner: data.roleName === 'Admin', isActive: true,
      expirationDate: data.expirationDate || null, phone: data.phone,
      createdAt: new Date().toISOString(),
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    };
    this.users.push(user);
    this.save(K.USERS, this.users);
    this.audit(actor, 'users.create', 'User', user.id, `Created user ${user.username} (${user.roleName})`);
    return user;
  }

  async updateUser(userId: string, data: Partial<User>, actor: User): Promise<User> {
    await this.sim();
    if (!actor.isOwner && actor.roleName !== 'Admin') throw new Error('Unauthorized: Admin only.');
    const idx = this.users.findIndex(u => u.id === userId);
    if (idx < 0) throw new Error('User not found');
    const matchedRole = data.roleName ? (this.roles.find(r => r.name === data.roleName) || this.users[idx].roles[0]) : this.users[idx].roles[0];
    this.users[idx] = { ...this.users[idx], ...data, roles: [matchedRole] };
    this.save(K.USERS, this.users);
    this.audit(actor, 'users.update', 'User', userId, `Updated user ${this.users[idx].username}`);
    return { ...this.users[idx] };
  }

  async deleteUser(userId: string, actor: User): Promise<void> {
    await this.sim();
    if (!actor.isOwner && actor.roleName !== 'Admin') throw new Error('Unauthorized: Admin only.');
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    if (userId === actor.id) throw new Error('Cannot delete your own account.');
    this.users = this.users.filter(u => u.id !== userId);
    this.save(K.USERS, this.users);
    this.audit(actor, 'users.delete', 'User', userId, `Deleted user ${user.username}`);
  }

  async renewUserExpiration(userId: string, newDate: string, actor: User): Promise<User> {
    await this.sim();
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    user.expirationDate = newDate; user.isActive = true;
    this.save(K.USERS, this.users);
    this.audit(actor, 'users.renew', 'User', userId, `Renewed ${user.username} expiry to ${newDate}`);
    return { ...user };
  }

  async declineUserAccess(userId: string, actor: User): Promise<User> {
    await this.sim();
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    user.isActive = false;
    this.save(K.USERS, this.users);
    this.audit(actor, 'users.decline', 'User', userId, `Revoked access for ${user.username}`);
    return { ...user };
  }

  // ─── LOAD CRUD ──────────────────────────────────────────────────────────────
  async createLoad(data: Omit<Load, 'id' | 'createdAt' | 'updatedAt' | 'documents' | 'accessorials' | 'loadNumber'>, actor: User): Promise<Load> {
    await this.sim();
    const count = this.loads.length + 87;
    const load: Load = {
      ...data, id: this.uid('ld'),
      loadNumber: `NE-2026-${String(count).padStart(3, '0')}`,
      documents: [], accessorials: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    this.loads = [load, ...this.loads];
    this.save(K.LOADS, this.loads);
    this.audit(actor, 'loads.create', 'Load', load.id, `Created ${load.loadNumber} (${load.brokerName})`);
    return load;
  }

  async updateLoad(loadId: string, data: Partial<Load>, actor: User): Promise<Load> {
    await this.sim();
    const idx = this.loads.findIndex(l => l.id === loadId);
    if (idx < 0) throw new Error('Load not found');
    this.loads[idx] = { ...this.loads[idx], ...data, updatedAt: new Date().toISOString() };
    this.save(K.LOADS, this.loads);
    this.audit(actor, 'loads.update', 'Load', loadId, `Updated ${this.loads[idx].loadNumber}`);
    return { ...this.loads[idx] };
  }

  async deleteLoad(loadId: string, actor: User): Promise<void> {
    await this.sim();
    const load = this.loads.find(l => l.id === loadId);
    if (!load) throw new Error('Load not found');
    if (['IN_TRANSIT', 'INVOICED', 'PAID'].includes(load.status)) {
      throw new Error(`Cannot delete load in ${load.status} status.`);
    }
    this.loads = this.loads.filter(l => l.id !== loadId);
    this.save(K.LOADS, this.loads);
    this.audit(actor, 'loads.delete', 'Load', loadId, `Deleted ${load.loadNumber}`);
  }

  async updateLoadStatus(loadId: string, status: LoadStatus, actor: User): Promise<Load> {
    return this.updateLoad(loadId, { status }, actor);
  }

  async assignDriverAndEquipment(loadId: string, driverId: string, truckId: string, trailerId: string, actor: User): Promise<Load> {
    await this.sim();
    const load = this.loads.find(l => l.id === loadId);
    if (!load) throw new Error('Load not found');
    const driver = this.drivers.find(d => d.id === driverId);
    const truck = this.equipment.find(e => e.id === truckId);
    const trailer = this.equipment.find(e => e.id === trailerId);
    if (!driver) throw new Error('Driver not found');
    if (new Date(driver.cdlExpiration) < new Date()) throw new Error(`Driver CDL expired (${driver.cdlExpiration}). Cannot assign.`);
    load.driverId = driver.id; load.driverName = driver.name;
    if (truck) { load.truckId = truck.id; load.truckNumber = truck.unitNumber; }
    if (trailer) { load.trailerId = trailer.id; load.trailerNumber = trailer.unitNumber; }
    if (load.status === 'OPEN') load.status = 'DISPATCHED';
    load.updatedAt = new Date().toISOString();
    this.save(K.LOADS, this.loads);
    this.audit(actor, 'loads.assign', 'Load', loadId, `Assigned ${load.loadNumber} to ${driver.name}`);
    return { ...load };
  }

  async updateStopTimestamps(loadId: string, stopId: string, arrivedAt?: string, departedAt?: string, actor?: User): Promise<Load> {
    await this.sim();
    const load = this.loads.find(l => l.id === loadId);
    if (!load) throw new Error('Load not found');
    const stop = load.stops.find(s => s.id === stopId);
    if (!stop) throw new Error('Stop not found');
    if (arrivedAt) stop.arrivedAt = arrivedAt;
    if (departedAt) stop.departedAt = departedAt;
    load.updatedAt = new Date().toISOString();
    this.save(K.LOADS, this.loads);
    return { ...load };
  }

  async addAccessorial(loadId: string, acc: Omit<Accessorial, 'id' | 'loadId'>, actor: User): Promise<Load> {
    await this.sim();
    const load = this.loads.find(l => l.id === loadId);
    if (!load) throw new Error('Load not found');
    load.accessorials.push({ ...acc, id: this.uid('acc'), loadId });
    load.updatedAt = new Date().toISOString();
    this.save(K.LOADS, this.loads);
    return { ...load };
  }

  async uploadDocument(loadId: string, doc: Omit<LoadDocument, 'id' | 'loadId' | 'uploadedAt' | 'superseded'>, actor: User): Promise<Load> {
    await this.sim();
    const load = this.loads.find(l => l.id === loadId);
    if (!load) throw new Error('Load not found');
    load.documents.push({ ...doc, id: this.uid('doc'), loadId, uploadedAt: new Date().toISOString(), superseded: false });
    load.updatedAt = new Date().toISOString();
    this.save(K.LOADS, this.loads);
    return { ...load };
  }

  // ─── DRIVER CRUD ────────────────────────────────────────────────────────────
  async createDriver(data: Omit<Driver, 'id' | 'tenantId' | 'createdAt'>, actor: User): Promise<Driver> {
    await this.sim();
    const driver: Driver = { ...data, id: this.uid('drv'), tenantId: actor.tenantId, createdAt: new Date().toISOString() };
    this.drivers.push(driver);
    this.save(K.DRIVERS, this.drivers);
    this.audit(actor, 'drivers.create', 'Driver', driver.id, `Created driver ${driver.name}`);
    return driver;
  }

  async updateDriver(driverId: string, data: Partial<Driver>, actor: User): Promise<Driver> {
    await this.sim();
    const idx = this.drivers.findIndex(d => d.id === driverId);
    if (idx < 0) throw new Error('Driver not found');
    this.drivers[idx] = { ...this.drivers[idx], ...data };
    this.save(K.DRIVERS, this.drivers);
    this.audit(actor, 'drivers.update', 'Driver', driverId, `Updated driver ${this.drivers[idx].name}`);
    return { ...this.drivers[idx] };
  }

  async deleteDriver(driverId: string, actor: User): Promise<void> {
    await this.sim();
    const driver = this.drivers.find(d => d.id === driverId);
    if (!driver) throw new Error('Driver not found');
    const activeLoad = this.loads.find(l => l.driverId === driverId && ['DISPATCHED', 'IN_TRANSIT'].includes(l.status));
    if (activeLoad) throw new Error(`Driver has active load ${activeLoad.loadNumber}. Cannot delete.`);
    this.drivers = this.drivers.filter(d => d.id !== driverId);
    this.save(K.DRIVERS, this.drivers);
    this.audit(actor, 'drivers.delete', 'Driver', driverId, `Deleted driver ${driver.name}`);
  }

  // ─── EQUIPMENT CRUD ─────────────────────────────────────────────────────────
  async createEquipment(data: Omit<Equipment, 'id' | 'tenantId' | 'createdAt'>, actor: User): Promise<Equipment> {
    await this.sim();
    const unit: Equipment = { ...data, id: this.uid('eq'), tenantId: actor.tenantId, createdAt: new Date().toISOString() };
    this.equipment.push(unit);
    this.save(K.EQUIPMENT, this.equipment);
    this.audit(actor, 'fleet.create', 'Equipment', unit.id, `Added ${unit.type} ${unit.unitNumber}`);
    return unit;
  }

  async updateEquipment(equipId: string, data: Partial<Equipment>, actor: User): Promise<Equipment> {
    await this.sim();
    const idx = this.equipment.findIndex(e => e.id === equipId);
    if (idx < 0) throw new Error('Equipment not found');
    this.equipment[idx] = { ...this.equipment[idx], ...data };
    this.save(K.EQUIPMENT, this.equipment);
    this.audit(actor, 'fleet.update', 'Equipment', equipId, `Updated ${this.equipment[idx].unitNumber}`);
    return { ...this.equipment[idx] };
  }

  async deleteEquipment(equipId: string, actor: User): Promise<void> {
    await this.sim();
    const unit = this.equipment.find(e => e.id === equipId);
    if (!unit) throw new Error('Equipment not found');
    const activeLoad = this.loads.find(l => (l.truckId === equipId || l.trailerId === equipId) && ['DISPATCHED', 'IN_TRANSIT'].includes(l.status));
    if (activeLoad) throw new Error(`${unit.unitNumber} is on active load ${activeLoad.loadNumber}.`);
    this.equipment = this.equipment.filter(e => e.id !== equipId);
    this.save(K.EQUIPMENT, this.equipment);
    this.audit(actor, 'fleet.delete', 'Equipment', equipId, `Deleted ${unit.unitNumber}`);
  }

  // ─── CUSTOMER CRUD ──────────────────────────────────────────────────────────
  async createCustomer(data: Omit<Customer, 'id' | 'tenantId' | 'createdAt'>, actor: User): Promise<Customer> {
    await this.sim();
    const customer: Customer = { ...data, id: this.uid('cust'), tenantId: actor.tenantId, createdAt: new Date().toISOString() };
    this.customers.push(customer);
    this.save(K.CUSTOMERS, this.customers);
    this.audit(actor, 'customers.create', 'Customer', customer.id, `Created customer ${customer.name}`);
    return customer;
  }

  async updateCustomer(custId: string, data: Partial<Customer>, actor: User): Promise<Customer> {
    await this.sim();
    const idx = this.customers.findIndex(c => c.id === custId);
    if (idx < 0) throw new Error('Customer not found');
    this.customers[idx] = { ...this.customers[idx], ...data };
    this.save(K.CUSTOMERS, this.customers);
    this.audit(actor, 'customers.update', 'Customer', custId, `Updated ${this.customers[idx].name}`);
    return { ...this.customers[idx] };
  }

  async deleteCustomer(custId: string, actor: User): Promise<void> {
    await this.sim();
    const cust = this.customers.find(c => c.id === custId);
    if (!cust) throw new Error('Customer not found');
    const hasLoads = this.loads.some(l => l.brokerId === custId && ['OPEN', 'DISPATCHED', 'IN_TRANSIT'].includes(l.status));
    if (hasLoads) throw new Error(`${cust.name} has active loads. Cannot delete.`);
    this.customers = this.customers.filter(c => c.id !== custId);
    this.save(K.CUSTOMERS, this.customers);
    this.audit(actor, 'customers.delete', 'Customer', custId, `Deleted ${cust.name}`);
  }

  // ─── INVOICE CRUD ───────────────────────────────────────────────────────────
  async generateInvoice(loadId: string, actor: User): Promise<Invoice> {
    await this.sim();
    const load = this.loads.find(l => l.id === loadId);
    if (!load) throw new Error('Load not found');
    if (load.status !== 'DELIVERED') throw new Error('Invoice can only be generated for DELIVERED loads.');
    const accessTotal = load.accessorials.filter(a => a.approved && !a.waived).reduce((s, a) => s + a.billableAmountMinor, 0);
    const total = load.rateMinor + accessTotal;
    const driverPay = Math.round(total * 0.74);
    const invNum = `INV-${load.loadNumber.replace('NE-', '')}`;
    const inv: Invoice = {
      id: this.uid('inv'), tenantId: load.tenantId, invoiceNumber: invNum,
      loadId: load.id, loadNumber: load.loadNumber,
      customerId: load.brokerId, customerName: load.brokerName,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0],
      subtotalMinor: load.rateMinor, accessorialsMinor: accessTotal, totalMinor: total,
      status: 'ISSUED', driverPayMinor: driverPay, driverSettlementStatus: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    load.status = 'INVOICED'; load.updatedAt = new Date().toISOString();
    this.invoices = [inv, ...this.invoices];
    this.save(K.INVOICES, this.invoices);
    this.save(K.LOADS, this.loads);
    this.audit(actor, 'invoices.create', 'Invoice', inv.id, `Generated ${invNum} for ${load.brokerName}`);
    return inv;
  }

  async createInvoice(data: Omit<Invoice, 'id' | 'tenantId' | 'createdAt'>, actor: User): Promise<Invoice> {
    await this.sim();
    const inv: Invoice = { ...data, id: this.uid('inv'), tenantId: actor.tenantId, createdAt: new Date().toISOString() };
    this.invoices = [inv, ...this.invoices];
    this.save(K.INVOICES, this.invoices);
    this.audit(actor, 'invoices.create', 'Invoice', inv.id, `Manual invoice ${inv.invoiceNumber}`);
    return inv;
  }

  async updateInvoice(invoiceId: string, data: Partial<Invoice>, actor: User): Promise<Invoice> {
    await this.sim();
    const idx = this.invoices.findIndex(i => i.id === invoiceId);
    if (idx < 0) throw new Error('Invoice not found');
    if (this.invoices[idx].status === 'VOID') throw new Error('Cannot edit voided invoice.');
    this.invoices[idx] = { ...this.invoices[idx], ...data };
    this.save(K.INVOICES, this.invoices);
    this.audit(actor, 'invoices.update', 'Invoice', invoiceId, `Updated ${this.invoices[idx].invoiceNumber}`);
    return { ...this.invoices[idx] };
  }

  async deleteInvoice(invoiceId: string, actor: User): Promise<void> {
    await this.sim();
    const inv = this.invoices.find(i => i.id === invoiceId);
    if (!inv) throw new Error('Invoice not found');
    if (['PAID', 'ADVANCED'].includes(inv.status)) throw new Error(`Cannot delete ${inv.status} invoice.`);
    this.invoices = this.invoices.filter(i => i.id !== invoiceId);
    this.save(K.INVOICES, this.invoices);
    this.audit(actor, 'invoices.delete', 'Invoice', invoiceId, `Deleted ${inv.invoiceNumber}`);
  }

  async voidInvoice(invoiceId: string, actor: User): Promise<Invoice> {
    return this.updateInvoice(invoiceId, { status: 'VOID' }, actor);
  }

  async markInvoicePaid(invoiceId: string, actor: User): Promise<Invoice> {
    await this.sim();
    const inv = this.invoices.find(i => i.id === invoiceId);
    if (!inv) throw new Error('Invoice not found');
    inv.status = 'PAID'; inv.paidAmountMinor = inv.totalMinor;
    if (inv.loadId) {
      const load = this.loads.find(l => l.id === inv.loadId);
      if (load) { load.status = 'PAID'; load.updatedAt = new Date().toISOString(); this.save(K.LOADS, this.loads); }
    }
    this.save(K.INVOICES, this.invoices);
    this.audit(actor, 'invoices.paid', 'Invoice', invoiceId, `Marked ${inv.invoiceNumber} as PAID`);
    return { ...inv };
  }

  async submitToFactoring(invoiceId: string, actor: User): Promise<Invoice> {
    await this.sim();
    const inv = this.invoices.find(i => i.id === invoiceId);
    if (!inv) throw new Error('Invoice not found');
    inv.status = 'SUBMITTED_TO_FACTORING'; inv.factoringStatus = 'ADVANCED';
    inv.advanceAmountMinor = Math.round(inv.totalMinor * 0.95);
    inv.factoringFeeMinor = Math.round(inv.totalMinor * 0.02);
    inv.reserveAmountMinor = Math.round(inv.totalMinor * 0.03);
    this.save(K.INVOICES, this.invoices);
    return { ...inv };
  }

  // ─── ROLE CRUD ──────────────────────────────────────────────────────────────
  async createOrUpdateRole(role: Role, actor: User): Promise<Role> {
    await this.sim();
    const idx = this.roles.findIndex(r => r.id === role.id);
    if (idx >= 0) this.roles[idx] = role; else this.roles.push(role);
    this.save(K.ROLES, this.roles);
    this.audit(actor, 'roles.update', 'Role', role.id, `${idx >= 0 ? 'Updated' : 'Created'} role ${role.name}`);
    return role;
  }

  async deleteRole(roleId: string, actor: User): Promise<void> {
    await this.sim();
    const r = this.roles.find(x => x.id === roleId);
    if (!r) throw new Error('Role not found');
    if (r.isSystemOwner) throw new Error('Cannot delete system owner role');
    this.roles = this.roles.filter(x => x.id !== roleId);
    this.save(K.ROLES, this.roles);
    this.audit(actor, 'roles.delete', 'Role', roleId, `Deleted role ${r.name}`);
  }

  resetToDefaults() {
    Object.values(K).forEach(k => localStorage.removeItem(k));
    this.init();
    this.notify();
  }
}

export const mockStore = new MockStore();
