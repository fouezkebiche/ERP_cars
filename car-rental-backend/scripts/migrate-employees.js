// scripts/migrate-employees.js
/**
 * Migration script to update Employee table with new RBAC fields
 * Run this ONCE after updating your Employee model
 */

const { sequelize, Employee } = require('../src/models');

async function migrateEmployees() {
  try {
    console.log('🔄 Starting employee table migration...');

    // Sync the Employee model (will add new columns)
    await Employee.sync({ alter: true });

    console.log('✅ Employee table updated successfully');

    // Optional: Update existing employees with default values
    const employees = await Employee.findAll();
    
    if (employees.length > 0) {
      console.log(`📝 Updating ${employees.length} existing employees...`);

      for (const employee of employees) {
        const updates = {};

        // Set default role if not set
        if (!employee.role) {
          updates.role = 'receptionist';
        }

        // Set default department if not set
        if (!employee.department) {
          updates.department = 'operations';
        }

        // Initialize custom_permissions if not set
        if (!employee.custom_permissions) {
          updates.custom_permissions = {};
        }

        // Initialize work_schedule if not set
        if (!employee.work_schedule) {
          updates.work_schedule = {
            monday: { start: '09:00', end: '17:00' },
            tuesday: { start: '09:00', end: '17:00' },
            wednesday: { start: '09:00', end: '17:00' },
            thursday: { start: '09:00', end: '17:00' },
            friday: { start: '09:00', end: '17:00' },
          };
        }

        // Initialize performance tracking
        if (employee.total_contracts_created === null) {
          updates.total_contracts_created = 0;
        }
        if (employee.total_revenue_generated === null) {
          updates.total_revenue_generated = 0;
        }

        // Update if there are changes
        if (Object.keys(updates).length > 0) {
          await employee.update(updates);
        }
      }

      console.log('✅ All existing employees updated');
    }

    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateEmployees();