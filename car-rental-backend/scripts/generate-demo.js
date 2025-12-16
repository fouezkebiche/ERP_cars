const { sequelize, Company, User, Vehicle, Customer, Contract, Payment, VehicleCost, Employee } = require('../src/models');

async function generateDemoData() {
  try {
    console.log('🌱 Starting database seed...');

    // Sync database (create tables)
    await sequelize.sync({ force: true });
    console.log('✅ Database synced');

    // ============================================
    // 1. CREATE COMPANIES
    // ============================================
    const companies = await Company.bulkCreate([
      {
        name: 'Elite Rentals',
        email: 'admin@eliterentals.com',
        phone: '+213 555 1111',
        address: '123 Business Street, Algiers',
        tax_id: 'TAX-ELITE-001',
        subscription_plan: 'professional',
        subscription_status: 'active',
        subscription_start_date: new Date('2024-01-01'),
        subscription_end_date: new Date('2025-12-31'),
        monthly_recurring_revenue: 15000,
      },
      {
        name: 'Speed Motors',
        email: 'admin@speedmotors.com',
        phone: '+213 555 2222',
        address: '456 Car Avenue, Oran',
        tax_id: 'TAX-SPEED-002',
        subscription_plan: 'basic',
        subscription_status: 'active',
        subscription_start_date: new Date('2024-06-01'),
        subscription_end_date: new Date('2025-05-31'),
        monthly_recurring_revenue: 5000,
      },
    ]);
    console.log(`✅ Created ${companies.length} companies`);

    // ============================================
    // 2. CREATE USERS (One at a time for hooks to work)
    // ============================================
    const user1 = await User.create({
      company_id: companies[0].id,
      full_name: 'Ahmed Manager',
      email: 'ahmed@eliterentals.com',
      password: 'password123',
      role: 'owner',
      is_active: true,
    });

    const user2 = await User.create({
      company_id: companies[0].id,
      full_name: 'Sarah Staff',
      email: 'sarah@eliterentals.com',
      password: 'password123',
      role: 'staff',
      is_active: true,
    });

    const user3 = await User.create({
      company_id: companies[1].id,
      full_name: 'Karim Owner',
      email: 'karim@speedmotors.com',
      password: 'password123',
      role: 'owner',
      is_active: true,
    });

    const users = [user1, user2, user3];
    console.log(`✅ Created ${users.length} users`);

    // ============================================
    // 3. CREATE CUSTOMERS
    // ============================================
    const customers = await Customer.bulkCreate([
      {
        company_id: companies[0].id,
        customer_type: 'individual',
        full_name: 'Mohamed Ali',
        email: 'mohamed@email.com',
        phone: '+213 666 1111',
        address: '789 Customer Street, Algiers',
        drivers_license_number: 'DL-123456',
        license_expiry_date: '2027-06-15',
        total_rentals: 0,
        lifetime_value: 0,
      },
      {
        company_id: companies[0].id,
        customer_type: 'individual',
        full_name: 'Fatima Saadi',
        email: 'fatima@email.com',
        phone: '+213 666 2222',
        address: '321 Residential Area, Algiers',
        drivers_license_number: 'DL-789012',
        license_expiry_date: '2026-12-20',
        total_rentals: 0,
        lifetime_value: 0,
      },
      {
        company_id: companies[0].id,
        customer_type: 'corporate',
        full_name: 'Ali Bouteflika',
        company_name: 'Tech Solutions Algeria',
        email: 'ali@techsolutions.dz',
        phone: '+213 666 3333',
        address: 'Business Park, Algiers',
        drivers_license_number: 'DL-345678',
        license_expiry_date: '2028-03-10',
        total_rentals: 0,
        lifetime_value: 0,
      },
    ]);
    console.log(`✅ Created ${customers.length} customers`);

    // ============================================
    // 4. CREATE VEHICLES
    // ============================================
    const vehicles = await Vehicle.bulkCreate([
      {
        company_id: companies[0].id,
        brand: 'Toyota',
        model: 'Corolla',
        year: 2023,
        registration_number: 'ABC-123-45',
        color: 'White',
        transmission: 'automatic',
        fuel_type: 'petrol',
        seats: 5,
        daily_rate: 25000,
        status: 'available',
        mileage: 15000,
        purchase_price: 3500000,
        purchase_date: '2023-01-15',
        features: { gps: true, ac: true, bluetooth: true },
      },
      {
        company_id: companies[0].id,
        brand: 'Hyundai',
        model: 'i30',
        year: 2023,
        registration_number: 'DEF-456-78',
        color: 'Silver',
        transmission: 'manual',
        fuel_type: 'diesel',
        seats: 5,
        daily_rate: 21000,
        status: 'rented',
        mileage: 22000,
        purchase_price: 2800000,
        purchase_date: '2023-03-20',
        features: { ac: true, bluetooth: true },
      },
      {
        company_id: companies[0].id,
        brand: 'BMW',
        model: '320',
        year: 2022,
        registration_number: 'GHI-789-01',
        color: 'Black',
        transmission: 'automatic',
        fuel_type: 'petrol',
        seats: 5,
        daily_rate: 35000,
        status: 'available',
        mileage: 35000,
        purchase_price: 6500000,
        purchase_date: '2022-06-10',
        features: { gps: true, ac: true, bluetooth: true, leather_seats: true },
      },
      {
        company_id: companies[1].id,
        brand: 'Renault',
        model: 'Clio',
        year: 2024,
        registration_number: 'JKL-101-11',
        color: 'Red',
        transmission: 'manual',
        fuel_type: 'petrol',
        seats: 5,
        daily_rate: 18000,
        status: 'available',
        mileage: 5000,
        purchase_price: 2200000,
        purchase_date: '2024-01-01',
        features: { ac: true },
      },
    ]);
    console.log(`✅ Created ${vehicles.length} vehicles`);

    // ============================================
    // 5. CREATE CONTRACTS
    // ============================================
    const contracts = await Contract.bulkCreate([
      {
        contract_number: 'RENT-2025-0001',
        company_id: companies[0].id,
        customer_id: customers[0].id,
        vehicle_id: vehicles[0].id,
        created_by: users[0].id,
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-01-08'),
        actual_return_date: new Date('2025-01-08'),
        daily_rate: 25000,
        total_days: 7,
        base_amount: 175000,
        additional_charges: 15000,
        discount_amount: 0,
        tax_amount: 36100,
        total_amount: 226100,
        start_mileage: 15000,
        end_mileage: 15800,
        mileage_limit: 1000,
        status: 'completed',
        extras: { gps: true, insurance: 'full' },
        deposit_amount: 50000,
        deposit_returned: true,
      },
      {
        contract_number: 'RENT-2025-0002',
        company_id: companies[0].id,
        customer_id: customers[1].id,
        vehicle_id: vehicles[1].id,
        created_by: users[0].id,
        start_date: new Date('2025-01-10'),
        end_date: new Date('2025-01-17'),
        daily_rate: 21000,
        total_days: 7,
        base_amount: 147000,
        additional_charges: 5000,
        discount_amount: 0,
        tax_amount: 28880,
        total_amount: 180880,
        start_mileage: 22000,
        mileage_limit: 800,
        status: 'active',
        extras: { insurance: 'basic' },
        deposit_amount: 30000,
        deposit_returned: false,
      },
      {
        contract_number: 'RENT-2024-0150',
        company_id: companies[0].id,
        customer_id: customers[2].id,
        vehicle_id: vehicles[2].id,
        created_by: users[0].id,
        start_date: new Date('2024-12-20'),
        end_date: new Date('2024-12-27'),
        actual_return_date: new Date('2024-12-27'),
        daily_rate: 35000,
        total_days: 7,
        base_amount: 245000,
        additional_charges: 20000,
        discount_amount: 10000,
        tax_amount: 48450,
        total_amount: 303450,
        start_mileage: 34000,
        end_mileage: 34650,
        mileage_limit: 1000,
        status: 'completed',
        extras: { gps: true, insurance: 'premium' },
        deposit_amount: 60000,
        deposit_returned: true,
      },
    ]);
    console.log(`✅ Created ${contracts.length} contracts`);

    // ============================================
    // 6. CREATE PAYMENTS
    // ============================================
    const payments = await Payment.bulkCreate([
      {
        company_id: companies[0].id,
        contract_id: contracts[0].id,
        customer_id: customers[0].id,
        amount: 226100,
        payment_method: 'card',
        payment_date: new Date('2025-01-08'),
        status: 'completed',
      },
      {
        company_id: companies[0].id,
        contract_id: contracts[1].id,
        customer_id: customers[1].id,
        amount: 90000,
        payment_method: 'cash',
        payment_date: new Date('2025-01-10'),
        status: 'completed',
      },
      {
        company_id: companies[0].id,
        contract_id: contracts[2].id,
        customer_id: customers[2].id,
        amount: 303450,
        payment_method: 'bank_transfer',
        payment_date: new Date('2024-12-27'),
        status: 'completed',
      },
    ]);
    console.log(`✅ Created ${payments.length} payments`);

    // ============================================
    // 7. CREATE VEHICLE COSTS
    // ============================================
    const vehicleCosts = await VehicleCost.bulkCreate([
      {
        vehicle_id: vehicles[0].id,
        cost_type: 'maintenance',
        amount: 20000,
        incurred_date: new Date('2024-11-15'),
        description: 'Oil change + filters',
      },
      {
        vehicle_id: vehicles[1].id,
        cost_type: 'insurance',
        amount: 50000,
        incurred_date: new Date('2024-12-01'),
        description: 'Annual insurance premium',
      },
      {
        vehicle_id: vehicles[2].id,
        cost_type: 'repair',
        amount: 80000,
        incurred_date: new Date('2025-01-05'),
        description: 'Brake replacement',
      },
    ]);
    console.log(`✅ Created ${vehicleCosts.length} vehicle costs`);

    // ============================================
    // 8. CREATE EMPLOYEES
    // ============================================
    const employees = await Employee.bulkCreate([
      {
        company_id: companies[0].id,
        full_name: 'Nadia Receptionist',
        email: 'nadia@eliterentals.com',
        phone: '+213 777 1111',
        position: 'Receptionist',
        salary: 60000,
        hire_date: new Date('2023-05-01'),
      },
      {
        company_id: companies[0].id,
        full_name: 'Youssef Mechanic',
        email: 'youssef@eliterentals.com',
        phone: '+213 777 2222',
        position: 'Mechanic',
        salary: 80000,
        hire_date: new Date('2023-07-15'),
      },
      {
        company_id: companies[1].id,
        full_name: 'Samir Sales',
        email: 'samir@speedmotors.com',
        phone: '+213 777 3333',
        position: 'Sales Manager',
        salary: 120000,
        hire_date: new Date('2024-02-01'),
      },
    ]);
    console.log(`✅ Created ${employees.length} employees`);

    console.log('\n🎉 Demo data generation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Companies: ${companies.length}`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Customers: ${customers.length}`);
    console.log(`   - Vehicles: ${vehicles.length}`);
    console.log(`   - Contracts: ${contracts.length}`);
    console.log(`   - Payments: ${payments.length}`);
    console.log(`   - Vehicle Costs: ${vehicleCosts.length}`);
    console.log(`   - Employees: ${employees.length}`);
    console.log('\n✅ You can now start the server with: npm start');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating demo data:', error);
    process.exit(1);
  }
}

generateDemoData();