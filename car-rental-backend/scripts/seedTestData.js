// seedTestData.js - Comprehensive Test Data Seeder with Clean Option
// Run: node seedTestData.js
// Run with clean: node seedTestData.js --clean

const axios = require('axios');

// ============================================
// CONFIGURATION
// ============================================
const API_BASE_URL = process.env.API_URL || 'http://127.0.0.1:5000/api';
const CLEAN_MODE = process.argv.includes('--clean');
let ACCESS_TOKEN = '';
let COMPANY_ID = '';

// Store created IDs
const IDS = {
  company: '',
  employees: {},
  vehicles: {},
  customers: {},
  contracts: {},
};

// ============================================
// HELPER FUNCTIONS
// ============================================
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Update auth token
const setAuthToken = (token) => {
  ACCESS_TOKEN = token;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

const log = (step, message) => {
  console.log(`\n✅ [${step}] ${message}`);
};

const logError = (step, error) => {
  console.error(`\n❌ [${step}] Error:`, error.response?.data || error.message);
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================
// CLEANUP FUNCTIONS
// ============================================

async function cleanDatabase() {
  try {
    log('CLEANUP', 'Starting database cleanup...');
    
    // Try to login first to get auth token
    try {
      const loginResponse = await api.post('/auth/login', {
        email: 'ahmed@algierspremium.dz',
        password: 'SecurePass123!',
      });
      setAuthToken(loginResponse.data.data.accessToken);
      console.log('   ✓ Logged in as existing user');
      
      // Get company ID
      const userProfile = await api.get('/auth/me');
      COMPANY_ID = userProfile.data.data.user.company_id;
      console.log(`   ✓ Found company ID: ${COMPANY_ID}`);
      
      // Delete all data in order (reverse of creation)
      console.log('\n   🗑️  Deleting existing data...');
      
      try {
        // Delete payments
        const payments = await api.get('/payments');
        for (const payment of payments.data.data.payments || []) {
          await api.delete(`/payments/${payment.id}`);
          console.log(`      - Deleted payment ${payment.id}`);
        }
      } catch (err) {
        console.log('      ⚠️  Could not delete payments:', err.response?.data?.message || 'Not implemented');
      }
      
      try {
        // Delete contracts
        const contracts = await api.get('/contracts');
        for (const contract of contracts.data.data.contracts || []) {
          await api.delete(`/contracts/${contract.id}`);
          console.log(`      - Deleted contract ${contract.id}`);
        }
      } catch (err) {
        console.log('      ⚠️  Could not delete contracts:', err.response?.data?.message || 'Not implemented');
      }
      
      try {
        // Delete customers
        const customers = await api.get('/customers');
        for (const customer of customers.data.data.customers || []) {
          await api.delete(`/customers/${customer.id}`);
          console.log(`      - Deleted customer ${customer.id}`);
        }
      } catch (err) {
        console.log('      ⚠️  Could not delete customers:', err.response?.data?.message || 'Not implemented');
      }
      
      try {
        // Delete vehicles
        const vehicles = await api.get('/vehicles');
        for (const vehicle of vehicles.data.data.vehicles || []) {
          await api.delete(`/vehicles/${vehicle.id}`);
          console.log(`      - Deleted vehicle ${vehicle.id}`);
        }
      } catch (err) {
        console.log('      ⚠️  Could not delete vehicles:', err.response?.data?.message || 'Not implemented');
      }
      
      try {
        // Delete employees
        const employees = await api.get('/employees');
        for (const employee of employees.data.data.employees || []) {
          await api.delete(`/employees/${employee.id}`);
          console.log(`      - Deleted employee ${employee.id}`);
        }
      } catch (err) {
        console.log('      ⚠️  Could not delete employees:', err.response?.data?.message || 'Not implemented');
      }
      
      console.log('\n   ✓ Cleanup completed');
      
    } catch (loginError) {
      console.log('   ⚠️  No existing data to clean or cannot login');
    }
    
    return true;
  } catch (error) {
    console.log('   ⚠️  Cleanup error (continuing anyway):', error.message);
    return false;
  }
}

// ============================================
// SEEDING FUNCTIONS
// ============================================

async function step1_CreateCompany() {
  try {
    log('STEP 1', 'Creating company...');
    const response = await api.post('/companies', {
      name: 'Algiers Premium Rentals',
      email: 'contact@algierspremium.dz',
      phone: '+213555123456',
      subscription_plan: 'professional',
    });
    
    COMPANY_ID = response.data.data.company.id;
    IDS.company = COMPANY_ID;
    
    console.log(`   Company ID: ${COMPANY_ID}`);
    console.log(`   Name: ${response.data.data.company.name}`);
    return COMPANY_ID;
  } catch (error) {
    if (error.response?.status === 409) {
      // Company already exists - try to find it
      console.log('   ⚠️  Company already exists, attempting to use existing...');
      
      // Try to login with existing credentials
      try {
        const loginResponse = await api.post('/auth/login', {
          email: 'ahmed@algierspremium.dz',
          password: 'SecurePass123!',
        });
        setAuthToken(loginResponse.data.data.accessToken);
        
        const userProfile = await api.get('/auth/me');
        COMPANY_ID = userProfile.data.data.user.company_id;
        IDS.company = COMPANY_ID;
        
        console.log(`   ✓ Using existing company ID: ${COMPANY_ID}`);
        return COMPANY_ID;
      } catch (loginError) {
        console.log('\n   ❌ Company exists but cannot login!');
        console.log('   💡 Solution: Run with --clean flag to delete existing data:');
        console.log('      node seedTestData.js --clean');
        throw new Error('Company exists but cannot authenticate');
      }
    }
    logError('STEP 1', error);
    throw error;
  }
}

async function step2_RegisterOwner() {
  try {
    log('STEP 2', 'Registering owner user...');
    const response = await api.post('/auth/register', {
      full_name: 'Ahmed Benali',
      email: 'ahmed@algierspremium.dz',
      password: 'SecurePass123!',
      company_id: COMPANY_ID,
      role: 'owner',
    });
    
    console.log(`   User: ${response.data.data.user.full_name}`);
    console.log(`   Email: ${response.data.data.user.email}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409 || error.response?.status === 400) {
      console.log('   ⚠️  Owner already exists, skipping...');
      return null;
    }
    logError('STEP 2', error);
    throw error;
  }
}

async function step3_Login() {
  try {
    log('STEP 3', 'Logging in as owner...');
    const response = await api.post('/auth/login', {
      email: 'ahmed@algierspremium.dz',
      password: 'SecurePass123!',
    });
    
    const token = response.data.data.accessToken;
    setAuthToken(token);
    
    console.log(`   Access Token: ${token.substring(0, 30)}...`);
    return token;
  } catch (error) {
    logError('STEP 3', error);
    throw error;
  }
}

async function step4_CreateEmployees() {
  try {
    log('STEP 4', 'Creating employees...');
    
    const employees = [
      {
        key: 'manager',
        data: {
          full_name: 'Fatima Zerouali',
          email: 'fatima@algierspremium.dz',
          phone: '+213661234567',
          password: 'Manager123!',
          role: 'manager',
          department: 'operations',
          position: 'Operations Manager',
          salary_type: 'monthly',
          salary: 80000,
          hire_date: '2024-01-15',
        },
      },
      {
        key: 'sales_agent',
        data: {
          full_name: 'Karim Messaoudi',
          email: 'karim@algierspremium.dz',
          phone: '+213771234567',
          password: 'Sales123!',
          role: 'sales_agent',
          department: 'sales',
          position: 'Senior Sales Agent',
          salary_type: 'fixed_plus_commission',
          salary: 50000,
          commission_rate: 5,
          hire_date: '2024-02-01',
        },
      },
      {
        key: 'fleet_coordinator',
        data: {
          full_name: 'Youcef Hamdi',
          email: 'youcef@algierspremium.dz',
          phone: '+213551234567',
          password: 'Fleet123!',
          role: 'fleet_coordinator',
          department: 'fleet',
          position: 'Fleet Manager',
          salary_type: 'monthly',
          salary: 65000,
          hire_date: '2024-01-20',
        },
      },
    ];

    for (const emp of employees) {
      try {
        const response = await api.post('/employees', emp.data);
        IDS.employees[emp.key] = response.data.data.employee.id;
        console.log(`   ✓ Created: ${emp.data.full_name} (${emp.data.role})`);
      } catch (err) {
        if (err.response?.status === 409) {
          console.log(`   ⚠️  Employee ${emp.data.full_name} already exists, skipping...`);
        } else {
          console.log(`   ⚠️  Could not create ${emp.data.full_name}:`, err.response?.data?.message);
        }
      }
      await wait(200);
    }
    
    return IDS.employees;
  } catch (error) {
    logError('STEP 4', error);
    console.log('   ⚠️  Continuing despite errors...');
    return IDS.employees;
  }
}

async function step5_CreateVehicles() {
  try {
    log('STEP 5', 'Creating vehicles...');
    
    const vehicles = [
      {
        key: 'clio',
        data: {
          brand: 'Renault',
          model: 'Clio 4',
          year: 2023,
          registration_number: '16-45678-23',
          color: 'White',
          transmission: 'manual',
          fuel_type: 'petrol',
          seats: 5,
          daily_rate: 3500,
          mileage: 15000,
          last_maintenance_mileage: 10000,
          maintenance_interval_km: 5000,
          maintenance_alert_threshold: 100,
          purchase_price: 2500000,
          purchase_date: '2023-06-15',
          vin: 'VF1RJ0G0H64123456',
        },
      },
      {
        key: 'peugeot',
        data: {
          brand: 'Peugeot',
          model: '208',
          year: 2022,
          registration_number: '16-12345-22',
          color: 'Blue',
          transmission: 'automatic',
          fuel_type: 'diesel',
          seats: 5,
          daily_rate: 4000,
          mileage: 52000,
          last_maintenance_mileage: 45000,
          maintenance_interval_km: 5000,
          maintenance_alert_threshold: 100,
          purchase_price: 2800000,
          purchase_date: '2022-03-20',
        },
      },
      {
        key: 'tiguan',
        data: {
          brand: 'Volkswagen',
          model: 'Tiguan',
          year: 2024,
          registration_number: '16-98765-24',
          color: 'Black',
          transmission: 'automatic',
          fuel_type: 'hybrid',
          seats: 7,
          daily_rate: 8500,
          mileage: 5000,
          last_maintenance_mileage: 0,
          maintenance_interval_km: 10000,
          purchase_price: 5500000,
          purchase_date: '2024-01-10',
        },
      },
      {
        key: 'i10',
        data: {
          brand: 'Hyundai',
          model: 'i10',
          year: 2021,
          registration_number: '16-55555-21',
          color: 'Red',
          transmission: 'manual',
          fuel_type: 'petrol',
          seats: 4,
          daily_rate: 2800,
          mileage: 74500,
          last_maintenance_mileage: 70000,
          maintenance_interval_km: 5000,
          purchase_date: '2021-05-12',
        },
      },
    ];

    for (const veh of vehicles) {
      try {
        const response = await api.post('/vehicles', veh.data);
        IDS.vehicles[veh.key] = response.data.data.vehicle.id;
        console.log(`   ✓ Created: ${veh.data.brand} ${veh.data.model} (${veh.data.registration_number})`);
      } catch (err) {
        if (err.response?.status === 409) {
          console.log(`   ⚠️  Vehicle ${veh.data.registration_number} already exists, skipping...`);
        } else {
          console.log(`   ⚠️  Could not create ${veh.data.brand} ${veh.data.model}:`, err.response?.data?.message);
        }
      }
      await wait(200);
    }
    
    return IDS.vehicles;
  } catch (error) {
    logError('STEP 5', error);
    console.log('   ⚠️  Continuing despite errors...');
    return IDS.vehicles;
  }
}

async function step6_CreateCustomers() {
  try {
    log('STEP 6', 'Creating customers (all loyalty tiers)...');
    
    const customers = [
      {
        key: 'new',
        data: {
          customer_type: 'individual',
          full_name: 'Sara Bouzid',
          email: 'sara.bouzid@gmail.com',
          phone: '+213770123456',
          address: '12 Rue Didouche Mourad, Algiers',
          city: 'Algiers',
          date_of_birth: '1995-08-15',
          drivers_license_number: 'DZ123456789',
          license_expiry_date: '2027-08-15',
          emergency_contact_name: 'Amina Bouzid',
          emergency_contact_phone: '+213661111111',
        },
      },
      {
        key: 'bronze',
        data: {
          customer_type: 'individual',
          full_name: 'Mohamed Larbi',
          email: 'm.larbi@yahoo.com',
          phone: '+213551234567',
          address: '45 Avenue Mohamed V, Oran',
          city: 'Oran',
          date_of_birth: '1988-03-22',
          drivers_license_number: 'DZ987654321',
          license_expiry_date: '2026-03-22',
          total_rentals: 2,
          lifetime_value: 28000,
        },
      },
      {
        key: 'silver',
        data: {
          customer_type: 'individual',
          full_name: 'Leila Mansouri',
          email: 'leila.m@outlook.com',
          phone: '+213771234567',
          address: '78 Boulevard de la République, Constantine',
          city: 'Constantine',
          date_of_birth: '1992-11-05',
          drivers_license_number: 'DZ555666777',
          license_expiry_date: '2028-11-05',
          total_rentals: 7,
          lifetime_value: 125000,
        },
      },
      {
        key: 'gold',
        data: {
          customer_type: 'corporate',
          full_name: 'Rachid Boukhari',
          company_name: 'TechStart Algeria',
          email: 'rachid@techstart.dz',
          phone: '+213661234567',
          address: 'Zone Industrielle, Rouiba',
          city: 'Algiers',
          drivers_license_number: 'DZ111222333',
          license_expiry_date: '2029-01-10',
          total_rentals: 15,
          lifetime_value: 385000,
        },
      },
      {
        key: 'platinum',
        data: {
          customer_type: 'corporate',
          full_name: 'Amina Belkacem',
          company_name: 'Sonatrach Transport Division',
          email: 'a.belkacem@sonatrach.dz',
          phone: '+213551111222',
          address: 'Hydra, Algiers',
          city: 'Algiers',
          total_rentals: 25,
          lifetime_value: 980000,
        },
      },
    ];

    for (const cust of customers) {
      try {
        const response = await api.post('/customers', cust.data);
        IDS.customers[cust.key] = response.data.data.customer.id;
        console.log(`   ✓ Created: ${cust.data.full_name} (${cust.key.toUpperCase()} tier - ${cust.data.total_rentals || 0} rentals)`);
      } catch (err) {
        if (err.response?.status === 409) {
          console.log(`   ⚠️  Customer ${cust.data.full_name} already exists, skipping...`);
        } else {
          console.log(`   ⚠️  Could not create ${cust.data.full_name}:`, err.response?.data?.message);
        }
      }
      await wait(200);
    }
    
    return IDS.customers;
  } catch (error) {
    logError('STEP 6', error);
    console.log('   ⚠️  Continuing despite errors...');
    return IDS.customers;
  }
}

async function step7_CreateContracts() {
  try {
    log('STEP 7', 'Creating contracts...');
    
    // Check if we have the required IDs
    if (Object.keys(IDS.customers).length === 0 || Object.keys(IDS.vehicles).length === 0) {
      console.log('   ⚠️  Missing customers or vehicles, fetching from API...');
      
      try {
        const customersResp = await api.get('/customers');
        const vehiclesResp = await api.get('/vehicles');
        
        const customers = customersResp.data.data.customers || [];
        const vehicles = vehiclesResp.data.data.vehicles || [];
        
        if (customers.length >= 3 && vehicles.length >= 3) {
          IDS.customers.new = customers[0].id;
          IDS.customers.silver = customers[2]?.id || customers[1].id;
          IDS.customers.platinum = customers[4]?.id || customers[2]?.id || customers[1].id;
          
          IDS.vehicles.clio = vehicles[0].id;
          IDS.vehicles.peugeot = vehicles[1].id;
          IDS.vehicles.tiguan = vehicles[2].id;
          
          console.log('   ✓ Loaded existing customers and vehicles');
        } else {
          console.log('   ⚠️  Not enough existing data, skipping contracts');
          return IDS.contracts;
        }
      } catch (err) {
        console.log('   ⚠️  Could not load existing data, skipping contracts');
        return IDS.contracts;
      }
    }
    
    const contracts = [
      {
        key: 'contract1_new',
        data: {
          customer_id: IDS.customers.new,
          vehicle_id: IDS.vehicles.clio,
          start_date: '2026-02-10T08:00:00Z',
          end_date: '2026-02-14T18:00:00Z',
          start_mileage: 15000,
          daily_rate: 3500,
          deposit_amount: 10000,
          payment_status: 'pending',
          notes: 'First rental - NEW customer tier (300km/day)',
        },
      },
      {
        key: 'contract2_silver',
        data: {
          customer_id: IDS.customers.silver,
          vehicle_id: IDS.vehicles.peugeot,
          start_date: '2026-02-08T09:00:00Z',
          end_date: '2026-02-15T17:00:00Z',
          start_mileage: 52000,
          daily_rate: 4000,
          deposit_amount: 15000,
          payment_status: 'pending',
          notes: 'SILVER tier customer - 350km/day (300 + 50 bonus)',
        },
      },
      {
        key: 'contract3_platinum',
        data: {
          customer_id: IDS.customers.platinum,
          vehicle_id: IDS.vehicles.tiguan,
          start_date: '2026-02-07T10:00:00Z',
          end_date: '2026-02-20T16:00:00Z',
          start_mileage: 5000,
          daily_rate: 8500,
          discount_amount: 15000,
          deposit_amount: 30000,
          payment_status: 'pending',
          notes: 'VIP PLATINUM customer - 450km/day (300 + 150 bonus)',
        },
      },
    ];

    for (const cont of contracts) {
      try {
        const response = await api.post('/contracts', cont.data);
        IDS.contracts[cont.key] = response.data.data.contract.id;
        const contract = response.data.data.contract;
        console.log(`   ✓ Created: ${contract.contract_number || cont.key}`);
        console.log(`      Customer tier: ${cont.key.split('_')[1].toUpperCase()}`);
        console.log(`      Total KM allowed: ${contract.total_km_allowed || 'N/A'}km`);
        console.log(`      Daily rate: ${contract.daily_rate} DA`);
      } catch (err) {
        console.log(`   ⚠️  Could not create ${cont.key}:`, err.response?.data?.message);
      }
      await wait(300);
    }
    
    return IDS.contracts;
  } catch (error) {
    logError('STEP 7', error);
    console.log('   ⚠️  Continuing despite errors...');
    return IDS.contracts;
  }
}

async function step8_AddVehicleCosts() {
  try {
    log('STEP 8', 'Adding vehicle costs...');
    
    if (!IDS.vehicles.peugeot || !IDS.vehicles.clio) {
      console.log('   ⚠️  Vehicle IDs not available, skipping costs');
      return false;
    }
    
    try {
      await api.post(`/vehicles/${IDS.vehicles.peugeot}/costs`, {
        cost_type: 'maintenance',
        amount: 12000,
        incurred_date: '2026-02-05',
        description: 'Full service: oil change, filters, brake pads',
      });
      console.log(`   ✓ Added maintenance cost for Peugeot 208: 12,000 DA`);
    } catch (err) {
      console.log('   ⚠️  Could not add Peugeot cost:', err.response?.data?.message);
    }
    
    await wait(200);
    
    try {
      await api.post(`/vehicles/${IDS.vehicles.clio}/costs`, {
        cost_type: 'fuel',
        amount: 4500,
        incurred_date: '2026-02-06',
        description: 'Full tank refill',
      });
      console.log(`   ✓ Added fuel cost for Renault Clio: 4,500 DA`);
    } catch (err) {
      console.log('   ⚠️  Could not add Clio cost:', err.response?.data?.message);
    }
    
    return true;
  } catch (error) {
    logError('STEP 8', error);
    console.log('   ⚠️  Continuing despite errors...');
    return false;
  }
}

async function step9_CompleteMaintenance() {
  try {
    log('STEP 9', 'Completing maintenance service...');
    
    if (!IDS.vehicles.peugeot) {
      console.log('   ⚠️  Peugeot ID not available, skipping maintenance');
      return null;
    }
    
    const response = await api.post(`/vehicles/${IDS.vehicles.peugeot}/maintenance/complete`, {
      mileage: 52000,
      service_type: 'full_service',
      cost: 12000,
      description: 'Changed oil, air filter, cabin filter, spark plugs',
      performed_date: '2026-02-05',
      parts_replaced: ['Engine oil', 'Oil filter', 'Air filter', 'Spark plugs'],
      technician_name: 'Bilal Garage Services',
      service_center: 'Garage Belkacem, Bab Ezzouar',
    });
    
    console.log(`   ✓ Maintenance completed for Peugeot 208`);
    console.log(`      Service: Full service at 52,000km`);
    console.log(`      Next maintenance: ${response.data.data.vehicle.next_maintenance_mileage}km`);
    
    return response.data;
  } catch (error) {
    logError('STEP 9', error);
    console.log('   ⚠️  Continuing despite errors...');
    return null;
  }
}

async function step10_CompleteContracts() {
  try {
    log('STEP 10', 'Completing contracts (testing overage)...');
    
    if (!IDS.contracts.contract1_new && !IDS.contracts.contract2_silver) {
      console.log('   ⚠️  No contracts to complete (skipping this step)');
      return null;
    }
    
    if (IDS.contracts.contract1_new) {
      try {
        console.log('\n   📋 Completing Contract 1 (NEW customer - no overage)...');
        const contract1 = await api.post(`/contracts/${IDS.contracts.contract1_new}/complete-with-mileage`, {
          end_mileage: 16400,
          actual_return_date: '2026-02-14T18:00:00Z',
          notes: 'Returned on time, vehicle in good condition',
        });
        console.log(`   ✓ Contract 1 completed:`);
        console.log(`      KM driven: ${contract1.data.data.mileage_summary?.km_driven || 'N/A'}km`);
        console.log(`      KM allowed: ${contract1.data.data.mileage_summary?.total_km_allowed || 'N/A'}km`);
        console.log(`      Overage: ${contract1.data.data.mileage_summary?.km_overage || 0}km (No charge)`);
      } catch (err) {
        console.log('   ⚠️  Could not complete Contract 1:', err.response?.data?.message || err.message);
      }
    }
    
    await wait(500);
    
    if (IDS.contracts.contract2_silver) {
      try {
        console.log('\n   📋 Completing Contract 2 (SILVER customer - with overage)...');
        const contract2 = await api.post(`/contracts/${IDS.contracts.contract2_silver}/complete-with-mileage`, {
          end_mileage: 55000,
          actual_return_date: '2026-02-15T20:30:00Z',
          notes: 'Customer exceeded KM limit',
        });
        console.log(`   ✓ Contract 2 completed:`);
        console.log(`      KM driven: ${contract2.data.data.mileage_summary?.km_driven || 'N/A'}km`);
        console.log(`      KM allowed: ${contract2.data.data.mileage_summary?.total_km_allowed || 'N/A'}km`);
        console.log(`      Overage: ${contract2.data.data.mileage_summary?.km_overage || 0}km`);
        if (contract2.data.data.overage_details) {
          console.log(`      Base charge: ${contract2.data.data.overage_details.base_overage_charges} DA`);
          console.log(`      SILVER discount (${contract2.data.data.overage_details.discount_percentage}%): -${contract2.data.data.overage_details.discount_amount} DA`);
          console.log(`      Final charge: ${contract2.data.data.overage_details.final_overage_charges} DA`);
        }
      } catch (err) {
        console.log('   ⚠️  Could not complete Contract 2:', err.response?.data?.message || err.message);
      }
    }
    
    return true;
  } catch (error) {
    logError('STEP 10', error);
    console.log('   ⚠️  Continuing despite errors...');
    return null;
  }
}

async function step11_RecordPayments() {
  try {
    log('STEP 11', 'Recording payments...');
    
    if (!IDS.contracts.contract1_new && !IDS.contracts.contract2_silver) {
      console.log('   ⚠️  No contracts available for payments (skipping)');
      return null;
    }
    
    if (IDS.contracts.contract1_new) {
      try {
        await api.post('/payments', {
          contract_id: IDS.contracts.contract1_new,
          amount: 17500,
          payment_method: 'card',
          reference_number: 'CARD-20260214-001',
          notes: 'Full payment via CIB card',
        });
        console.log(`   ✓ Payment recorded for Contract 1: 17,500 DA (Card)`);
      } catch (err) {
        console.log('   ⚠️  Could not record payment 1:', err.response?.data?.message || err.message);
      }
    }
    
    await wait(200);
    
    if (IDS.contracts.contract2_silver) {
      try {
        await api.post('/payments', {
          contract_id: IDS.contracts.contract2_silver,
          amount: 20000,
          payment_method: 'cash',
          notes: 'Deposit + partial payment',
        });
        console.log(`   ✓ Payment recorded for Contract 2: 20,000 DA (Cash)`);
      } catch (err) {
        console.log('   ⚠️  Could not record payment 2:', err.response?.data?.message || err.message);
      }
    }
    
    return true;
  } catch (error) {
    logError('STEP 11', error);
    console.log('   ⚠️  Continuing despite errors...');
    return null;
  }
}

async function step12_MarkAttendance() {
  try {
    log('STEP 12', 'Marking employee attendance...');
    
    if (!IDS.employees.sales_agent) {
      console.log('   ⚠️  Sales agent ID not available, skipping attendance');
      return null;
    }
    
    try {
      await api.post('/attendance/check-in', {
        employee_id: IDS.employees.sales_agent,
        check_in_time: '2026-02-07T08:15:00Z',
        location: {
          lat: 36.7538,
          lng: 3.0588,
          address: 'Office, Algiers',
        },
      });
      console.log(`   ✓ Karim (Sales Agent) checked in at 08:15`);
      
      await wait(200);
      
      await api.post('/attendance/check-out', {
        employee_id: IDS.employees.sales_agent,
        check_out_time: '2026-02-07T17:30:00Z',
      });
      console.log(`   ✓ Karim checked out at 17:30`);
    } catch (err) {
      console.log('   ⚠️  Could not mark attendance:', err.response?.data?.message);
    }
    
    return true;
  } catch (error) {
    logError('STEP 12', error);
    console.log('   ⚠️  Continuing despite errors...');
    return null;
  }
}

async function step13_ShowSummary() {
  try {
    log('STEP 13', 'Fetching summary data...');
    
    try {
      const dashboard = await api.get('/analytics/dashboard?period=month');
      console.log('\n   📊 DASHBOARD SUMMARY:');
      console.log(`      Total Revenue: ${dashboard.data.data.revenue.total.toLocaleString()} DA`);
      console.log(`      Active Rentals: ${dashboard.data.data.fleet.active_rentals}`);
      console.log(`      Fleet Utilization: ${dashboard.data.data.fleet.average_utilization.toFixed(1)}%`);
      console.log(`      Total Customers: ${dashboard.data.data.customers.total}`);
    } catch (err) {
      console.log('   ⚠️  Could not fetch dashboard:', err.response?.data?.message);
    }
    
    try {
      const maintenance = await api.get('/vehicles/maintenance/due');
      console.log(`\n   🔧 MAINTENANCE ALERTS:`);
      console.log(`      Critical Overdue: ${maintenance.data.data.summary.critical_overdue}`);
      console.log(`      Overdue: ${maintenance.data.data.summary.overdue}`);
      console.log(`      Upcoming: ${maintenance.data.data.summary.upcoming}`);
    } catch (err) {
      console.log('   ⚠️  Could not fetch maintenance:', err.response?.data?.message);
    }
    
    try {
      const notifications = await api.get('/notifications?dismissed=false&limit=5');
      console.log(`\n   🔔 RECENT NOTIFICATIONS: ${notifications.data.data.notifications.length}`);
      notifications.data.data.notifications.slice(0, 3).forEach(n => {
        console.log(`      - [${n.priority.toUpperCase()}] ${n.title}`);
      });
    } catch (err) {
      console.log('   ⚠️  Could not fetch notifications:', err.response?.data?.message);
    }
    
    return true;
  } catch (error) {
    logError('STEP 13', error);
    console.log('   ⚠️  Continuing despite errors...');
    return null;
  }
}

// ============================================
// MAIN EXECUTION
// ============================================
async function runSeeder() {
  console.log('\n🚀 ========================================');
  console.log('🚀 CAR RENTAL TEST DATA SEEDER');
  console.log('🚀 ========================================\n');
  
  if (CLEAN_MODE) {
    console.log('🗑️  CLEAN MODE ENABLED - Will delete existing data first\n');
    await cleanDatabase();
  }
  
  try {
    await step1_CreateCompany();
    await step2_RegisterOwner();
    await step3_Login();
    await step4_CreateEmployees();
    await step5_CreateVehicles();
    await step6_CreateCustomers();
    await step7_CreateContracts();
    await step8_AddVehicleCosts();
    await step9_CompleteMaintenance();
    await step10_CompleteContracts();
    await step11_RecordPayments();
    await step12_MarkAttendance();
    await step13_ShowSummary();
    
    console.log('\n✅ ========================================');
    console.log('✅ SEEDING COMPLETED SUCCESSFULLY!');
    console.log('✅ ========================================\n');
    
    console.log('📋 SAVED IDS:');
    console.log(JSON.stringify(IDS, null, 2));
    
    console.log('\n🔑 LOGIN CREDENTIALS:');
    console.log('   Owner: ahmed@algierspremium.dz / SecurePass123!');
    console.log('   Manager: fatima@algierspremium.dz / Manager123!');
    console.log('   Sales Agent: karim@algierspremium.dz / Sales123!');
    console.log('   Fleet Manager: youcef@algierspremium.dz / Fleet123!');
    
    console.log('\n🧪 SUGGESTED TESTS:');
    console.log('   GET /api/analytics/dashboard?period=month');
    console.log('   GET /api/analytics/revenue?compare=true');
    console.log('   GET /api/vehicles/maintenance/due');
    console.log('   GET /api/notifications?priority=high&dismissed=false');
    console.log('   GET /api/customers/{customer_id}/tier-info');
    console.log('   GET /api/reports/executive?startDate=2026-02-01&endDate=2026-02-28');
    
  } catch (error) {
    console.error('\n❌ ========================================');
    console.error('❌ SEEDING FAILED!');
    console.error('❌ ========================================\n');
    console.error(error);
    console.log('\n💡 TIP: If data already exists, try running with --clean flag:');
    console.log('   node seedTestData.js --clean\n');
    process.exit(1);
  }
}

// Run the seeder
runSeeder();