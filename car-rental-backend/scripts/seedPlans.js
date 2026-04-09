// scripts/seedPlans.js
// Seed test subscription plans into PlatformSettings

const { sequelize, PlatformSettings } = require('../src/models');

async function seedPlans() {
  try {
    console.log('🌱 Starting to seed subscription plans...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Find or create platform settings row
    let settings = await PlatformSettings.findByPk(1);
    if (!settings) {
      settings = await PlatformSettings.create({ id: 1, settings: {} });
      console.log('✅ Created platform settings row');
    }

    // Test subscription plans
    const testPlans = [
      {
        id: "plan_basic",
        name: "Basic",
        description: "Perfect for small rental agencies just getting started",
        priceMonthly: 5000,
        maxVehicles: 20,
        maxUsers: 1,
        features: [
          "Up to 20 vehicles",
          "Basic reporting dashboard",
          "Email support",
          "Mobile app access",
          "Customer management",
          "Contract tracking"
        ]
      },
      {
        id: "plan_professional", 
        name: "Professional",
        description: "Ideal for growing agencies with multiple locations",
        priceMonthly: 15000,
        maxVehicles: 100,
        maxUsers: 5,
        features: [
          "Up to 100 vehicles",
          "Advanced analytics & reporting",
          "Priority email & chat support",
          "Multi-branch support",
          "Up to 5 user accounts",
          "Mobile app access",
          "Custom reports",
          "API access",
          "Vehicle maintenance tracking",
          "Customer CRM"
        ]
      },
      {
        id: "plan_enterprise",
        name: "Enterprise", 
        description: "Complete solution for large rental operations",
        priceMonthly: 45000,
        maxVehicles: -1, // unlimited
        maxUsers: -1, // unlimited
        features: [
          "Unlimited vehicles",
          "Unlimited user accounts",
          "Advanced analytics & reporting",
          "Dedicated account manager",
          "Phone support (24/7)",
          "Multi-branch support",
          "Custom integrations",
          "API access",
          "White-label options",
          "Vehicle maintenance tracking",
          "Customer CRM",
          "Advanced workflow automation",
          "Custom training sessions",
          "Priority feature requests"
        ]
      }
    ];

    // Update settings with test plans
    await settings.update({
      settings: {
        ...settings.settings,
        plans: testPlans
      }
    });

    console.log('✅ Successfully seeded subscription plans:');
    testPlans.forEach(plan => {
      console.log(`   - ${plan.name}: ${plan.priceMonthly === 0 ? 'Free' : plan.priceMonthly.toLocaleString('fr-DZ') + ' DZD/mo'} (${plan.maxVehicles === -1 ? 'Unlimited' : plan.maxVehicles} vehicles)`);
    });

    console.log('\n🎉 Plan seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding plans:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔐 Database connection closed');
  }
}

// Run the seed
if (require.main === module) {
  seedPlans();
}

module.exports = { seedPlans };
