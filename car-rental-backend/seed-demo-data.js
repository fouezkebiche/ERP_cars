// seed-demo-data.js - Clear ALL data and reseed from scratch
const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

const DATABASE_URL = process.env.DATABASE_URL;

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false,
});

// Helper functions
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const randomElement = (array) => array[Math.floor(Math.random() * array.length)];

async function resetAndSeed() {
  try {
    console.log('🌱 Starting database reset and seeding...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Get demo company
    const companies = await sequelize.query(`
      SELECT id FROM companies WHERE email = 'demo@example.com' LIMIT 1
    `, { type: sequelize.QueryTypes.SELECT });

    if (!companies || companies.length === 0) {
      console.error('❌ Demo company not found. Run init-db.js first!');
      process.exit(1);
    }

    const companyId = companies[0].id;
    console.log(`✅ Found demo company: ${companyId}`);

    // Get demo user
    const users = await sequelize.query(`
      SELECT id FROM users WHERE email = 'demo@demo.com' LIMIT 1
    `, { type: sequelize.QueryTypes.SELECT });
    const userId = users[0].id;

    // ============================================
    // STEP 1: DELETE ALL OLD SEED DATA
    // ============================================
    console.log('\n🗑️  CLEARING OLD DATA...');
    
    // Delete in correct order (foreign key constraints)
    await sequelize.query(`DELETE FROM notifications WHERE company_id = :companyId`, { replacements: { companyId } });
    console.log('   ✅ Cleared notifications');
    
    await sequelize.query(`DELETE FROM vehicle_costs WHERE vehicle_id IN (SELECT id FROM vehicles WHERE company_id = :companyId)`, { replacements: { companyId } });
    console.log('   ✅ Cleared vehicle costs');
    
    await sequelize.query(`DELETE FROM payments WHERE company_id = :companyId`, { replacements: { companyId } });
    console.log('   ✅ Cleared payments');
    
    await sequelize.query(`DELETE FROM contracts WHERE company_id = :companyId`, { replacements: { companyId } });
    console.log('   ✅ Cleared contracts');
    
    await sequelize.query(`DELETE FROM customers WHERE company_id = :companyId`, { replacements: { companyId } });
    console.log('   ✅ Cleared customers');
    
    await sequelize.query(`DELETE FROM vehicles WHERE company_id = :companyId`, { replacements: { companyId } });
    console.log('   ✅ Cleared vehicles');
    
    await sequelize.query(`DELETE FROM employees WHERE company_id = :companyId`, { replacements: { companyId } });
    console.log('   ✅ Cleared employees');
    
    // Delete employee user accounts (NOT the main demo@demo.com user)
    await sequelize.query(`DELETE FROM users WHERE company_id = :companyId AND email != 'demo@demo.com'`, { replacements: { companyId } });
    console.log('   ✅ Cleared employee users');

    console.log('\n✅ OLD DATA CLEARED!\n');

    // ============================================
    // STEP 2: CREATE NEW SEED DATA
    // ============================================
    
    // 1. CREATE EMPLOYEES
    console.log('👥 Creating employees...');
    
    const employeeRoles = [
      {
        name: 'Sarah Manager',
        email: 'sarah@demo.com',
        userRole: 'manager',          // users.role
        employeeRole: 'manager',      // employees.role
        position: 'Fleet Manager',
        department: 'fleet'
      },
      {
        name: 'John Sales',
        email: 'john@demo.com',
        userRole: 'staff',
        employeeRole: 'sales_agent',
        position: 'Sales Agent',
        department: 'sales'
      },
      {
        name: 'Emily Reception',
        email: 'emily@demo.com',
        userRole: 'staff',
        employeeRole: 'receptionist',
        position: 'Receptionist',
        department: 'customer_service'
      },
      {
        name: 'Mike Fleet',
        email: 'mike@demo.com',
        userRole: 'staff',
        employeeRole: 'fleet_coordinator',
        position: 'Fleet Coordinator',
        department: 'fleet'
      },
      {
        name: 'Lisa Accountant',
        email: 'lisa@demo.com',
        userRole: 'admin',
        employeeRole: 'accountant',
        position: 'Senior Accountant',
        department: 'finance'
      },
    ];

    const employeeIds = [];

    for (const emp of employeeRoles) {
      const passwordHash = await bcrypt.hash('password123', 10);
      
      const userResult = await sequelize.query(`
        INSERT INTO users (id, company_id, full_name, email, password_hash, role, is_active, created_at, updated_at)
        VALUES (gen_random_uuid(), :companyId, :name, :email, :passwordHash, :userRole, true, NOW(), NOW())
        RETURNING id
      `, {
        replacements: { companyId, name: emp.name, email: emp.email, passwordHash, userRole: emp.userRole },
        type: sequelize.QueryTypes.INSERT
      });

      const empUserId = userResult[0][0].id;

      const empResult = await sequelize.query(`
        INSERT INTO employees (
          id, company_id, user_id, full_name, email, phone, position, department, role,
          salary_type, salary, hire_date, status, created_at, updated_at
        )
        VALUES (
          gen_random_uuid(), :companyId, :userId, :name, :email, :phone, :position, :department, :employeeRole,
          'monthly', :salary, :hireDate, 'active', NOW(), NOW()
        )
        RETURNING id
      `, {
        replacements: {
          companyId,
          userId: empUserId,
          name: emp.name,
          email: emp.email,
          phone: `+213 ${randomInt(500, 799)} ${randomInt(100, 999)} ${randomInt(100, 999)}`,
          position: emp.position,
          department: emp.department,
          employeeRole: emp.employeeRole,
          salary: randomInt(40000, 80000),
          hireDate: randomDate(new Date(2023, 0, 1), new Date(2024, 11, 31))
        },
        type: sequelize.QueryTypes.INSERT
      });

      employeeIds.push(empResult[0][0].id);
    }

    console.log(`✅ Created ${employeeIds.length} employees`);

    // 2. CREATE VEHICLES
    console.log('🚗 Creating vehicles...');
    
    const vehicleData = [
      { brand: 'Toyota', model: 'Corolla', year: 2023, dailyRate: 4500 },
      { brand: 'Toyota', model: 'Yaris', year: 2024, dailyRate: 3500 },
      { brand: 'Hyundai', model: 'i20', year: 2023, dailyRate: 3200 },
      { brand: 'Renault', model: 'Clio', year: 2024, dailyRate: 3000 },
      { brand: 'Peugeot', model: '208', year: 2023, dailyRate: 3200 },
      { brand: 'Toyota', model: 'Hilux', year: 2024, dailyRate: 8500 },
      { brand: 'Hyundai', model: 'Tucson', year: 2023, dailyRate: 6500 },
      { brand: 'Kia', model: 'Sportage', year: 2024, dailyRate: 6800 },
      { brand: 'Nissan', model: 'Qashqai', year: 2023, dailyRate: 6000 },
      { brand: 'Ford', model: 'EcoSport', year: 2023, dailyRate: 5500 },
      { brand: 'Mercedes', model: 'C-Class', year: 2024, dailyRate: 12000 },
      { brand: 'BMW', model: '3 Series', year: 2023, dailyRate: 11500 },
      { brand: 'Audi', model: 'A4', year: 2024, dailyRate: 11000 },
      { brand: 'Volkswagen', model: 'Passat', year: 2023, dailyRate: 5500 },
      { brand: 'Seat', model: 'Ibiza', year: 2024, dailyRate: 2800 },
    ];

    const vehicleIds = [];
    const statuses = ['available', 'available', 'available', 'rented', 'available', 'rented', 'available', 'maintenance'];

    for (const v of vehicleData) {
      const regNumber = `${randomInt(10, 99)}-${randomInt(100, 999)}-${randomInt(10, 99)}`;
      const status = randomElement(statuses);
      const mileage = randomInt(5000, 80000);
      const lastMaintenance = mileage - randomInt(1000, 4500);
      
      const result = await sequelize.query(`
        INSERT INTO vehicles (
          id, company_id, brand, model, year, registration_number, color, transmission,
          fuel_type, seats, daily_rate, status, mileage, last_maintenance_mileage,
          next_maintenance_mileage, maintenance_interval_km, maintenance_alert_threshold,
          last_maintenance_alert_mileage, purchase_price, purchase_date, created_at, updated_at
        )
        VALUES (
          gen_random_uuid(), :companyId, :brand, :model, :year, :regNumber, :color, :transmission,
          :fuelType, 5, :dailyRate, :status, :mileage, :lastMaintenance,
          :nextMaintenance, 5000, 100, :lastMaintenance, :purchasePrice, :purchaseDate, NOW(), NOW()
        )
        RETURNING id
      `, {
        replacements: {
          companyId,
          brand: v.brand,
          model: v.model,
          year: v.year,
          regNumber,
          color: randomElement(['White', 'Black', 'Silver', 'Blue', 'Red', 'Gray']),
          transmission: randomElement(['automatic', 'manual']),
          fuelType: randomElement(['diesel', 'petrol']),
          dailyRate: v.dailyRate,
          status,
          mileage,
          lastMaintenance,
          nextMaintenance: lastMaintenance + 5000,
          purchasePrice: v.dailyRate * 365 * 2,
          purchaseDate: randomDate(new Date(2022, 0, 1), new Date(2023, 11, 31))
        },
        type: sequelize.QueryTypes.INSERT
      });

      vehicleIds.push(result[0][0].id);
    }

    console.log(`✅ Created ${vehicleIds.length} vehicles`);

    // 3. CREATE CUSTOMERS
    console.log('👤 Creating customers...');
    
    const firstNames = ['Ahmed', 'Fatima', 'Mohamed', 'Amina', 'Youssef', 'Samira', 'Karim', 'Leila', 'Omar', 'Nadia'];
    const lastNames = ['Benali', 'Bouazza', 'Cherif', 'Djelloul', 'Farid', 'Gharbi', 'Hamdi', 'Ibrahim', 'Khelifa', 'Larbi'];
    
    const customerIds = [];

    for (let i = 0; i < 20; i++) {
      const fullName = `${randomElement(firstNames)} ${randomElement(lastNames)}`;
      const email = fullName.toLowerCase().replace(/\s+/g, '.') + '@example.dz';
      const totalRentals = randomInt(0, 25);
      const lifetimeValue = totalRentals * randomInt(5000, 15000);

      const result = await sequelize.query(`
        INSERT INTO customers (
          id, company_id, customer_type, full_name, email, phone, address, city,
          drivers_license_number, total_rentals, lifetime_value, is_blacklisted,
          apply_tier_discount, created_at, updated_at
        )
        VALUES (
          gen_random_uuid(), :companyId, 'individual', :fullName, :email, :phone, :address, :city,
          :licenseNumber, :totalRentals, :lifetimeValue, false, true, :createdAt, NOW()
        )
        RETURNING id
      `, {
        replacements: {
          companyId,
          fullName,
          email,
          phone: `+213 ${randomInt(500, 799)} ${randomInt(100, 999)} ${randomInt(100, 999)}`,
          address: `${randomInt(1, 999)} Rue de la Liberté`,
          city: randomElement(['Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida']),
          licenseNumber: `DL${randomInt(100000, 999999)}`,
          totalRentals,
          lifetimeValue,
          createdAt: randomDate(new Date(2023, 0, 1), new Date(2025, 11, 31))
        },
        type: sequelize.QueryTypes.INSERT
      });

      customerIds.push(result[0][0].id);
    }

    console.log(`✅ Created ${customerIds.length} customers`);

    // 4. CREATE CONTRACTS
    console.log('📄 Creating contracts...');
    
    for (let i = 0; i < 30; i++) {
      const vehicleId = randomElement(vehicleIds);
      const customerId = randomElement(customerIds);
      const status = randomElement(['active', 'completed', 'completed', 'completed']);
      const contractNumber = `RENT-2026-${String(i + 1).padStart(4, '0')}`;
      
      const startDate = randomDate(new Date(2026, 0, 1), new Date(2026, 1, 10));
      const totalDays = randomInt(3, 14);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + totalDays);
      
      const dailyRate = randomInt(3000, 12000);
      const baseAmount = dailyRate * totalDays;
      const totalAmount = baseAmount * 1.19;
      
      const startMileage = randomInt(10000, 80000);
      let endMileage = null;
      let actualKmDriven = 0;

      if (status === 'completed') {
        actualKmDriven = randomInt(totalDays * 200, totalDays * 400);
        endMileage = startMileage + actualKmDriven;
      }

      await sequelize.query(`
        INSERT INTO contracts (
          id, contract_number, company_id, customer_id, vehicle_id, created_by,
          start_date, end_date, daily_rate, total_days, base_amount, total_amount,
          start_mileage, end_mileage, actual_km_driven, daily_km_limit, status,
          deposit_amount, deposit_returned, created_at, updated_at
        )
        VALUES (
          gen_random_uuid(), :contractNumber, :companyId, :customerId, :vehicleId, :userId,
          :startDate, :endDate, :dailyRate, :totalDays, :baseAmount, :totalAmount,
          :startMileage, :endMileage, :actualKmDriven, 300, :status,
          :depositAmount, :depositReturned, NOW(), NOW()
        )
      `, {
        replacements: {
          contractNumber,
          companyId,
          customerId,
          vehicleId,
          userId,
          startDate,
          endDate,
          dailyRate,
          totalDays,
          baseAmount,
          totalAmount,
          startMileage,
          endMileage,
          actualKmDriven,
          status,
          depositAmount: dailyRate * 2,
          depositReturned: status === 'completed'
        }
      });
    }

    console.log(`✅ Created 30 contracts`);

    // 5. CREATE NOTIFICATIONS
    console.log('🔔 Creating notifications...');
    
    const notifications = [
      {
        type: 'vehicle_maintenance',
        priority: 'high',
        title: '⚠️ Maintenance Due',
        message: 'Toyota Hilux requires maintenance at 78,500 km'
      },
      {
        type: 'km_limit_warning',
        priority: 'medium',
        title: '⚠️ KM Limit Warning',
        message: 'Contract RENT-2026-0015: Vehicle has 250km remaining'
      },
      {
        type: 'payment_due',
        priority: 'high',
        title: '💰 Payment Pending',
        message: 'Outstanding payment of 12,500 DA for Contract RENT-2026-0020'
      }
    ];

    for (const notif of notifications) {
      await sequelize.query(`
        INSERT INTO notifications (
          id, company_id, type, priority, title, message, is_read, created_at, updated_at
        )
        VALUES (
          gen_random_uuid(), :companyId, :type, :priority, :title, :message, false, NOW(), NOW()
        )
      `, {
        replacements: {
          companyId,
          type: notif.type,
          priority: notif.priority,
          title: notif.title,
          message: notif.message
        }
      });
    }

    console.log(`✅ Created ${notifications.length} notifications`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n✅ DATABASE RESET AND SEEDING COMPLETED!\n');
    console.log('📊 Summary:');
    console.log(`   - Employees: ${employeeIds.length}`);
    console.log(`   - Vehicles: ${vehicleIds.length}`);
    console.log(`   - Customers: ${customerIds.length}`);
    console.log(`   - Contracts: 30`);
    console.log(`   - Notifications: ${notifications.length}`);
    console.log('\n🎉 Your demo database is ready!');
    console.log('\n🔑 Login credentials:');
    console.log('   Email: demo@demo.com');
    console.log('   Password: demo123');
    console.log('\n📝 Employee accounts:');
    console.log('   - sarah@demo.com / password123 (Manager)');
    console.log('   - john@demo.com / password123 (Sales Agent)');
    console.log('   - emily@demo.com / password123 (Receptionist)');
    console.log('   - mike@demo.com / password123 (Fleet Coordinator)');
    console.log('   - lisa@demo.com / password123 (Accountant)');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

resetAndSeed()
  .then(() => {
    console.log('\n👋 Complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });