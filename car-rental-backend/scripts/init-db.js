// scripts/init-db.js
const { sequelize } = require('../src/config/database');
const { Company, User } = require('../src/models');
const bcrypt = require('bcryptjs');

async function initDatabase() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected!');

    console.log('🔄 Creating tables...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Tables created!');
    
    console.log('🏢 Creating demo company...');
    const [company, companyCreated] = await Company.findOrCreate({
      where: { email: 'demo@example.com' },
      defaults: {
        name: 'Demo Car Rental Company',
        email: 'demo@example.com',
        phone: '+213-555-0000',
        subscription_plan: 'professional',
        subscription_status: 'active',
      }
    });
    console.log(companyCreated ? '✅ Demo company created!' : 'ℹ️  Demo company already exists');

    console.log('👤 Creating demo user...');
    const passwordHash = await bcrypt.hash('demo123', 12);
    const [user, userCreated] = await User.findOrCreate({
      where: { email: 'demo@demo.com' },
      defaults: {
        company_id: company.id,
        full_name: 'Demo Admin',
        email: 'demo@demo.com',
        password_hash: passwordHash,
        role: 'owner',
        is_active: true,
      }
    });
    console.log(userCreated ? '✅ Demo user created!' : 'ℹ️  Demo user already exists');

    console.log('\n🎉 Database initialized successfully!');
    console.log('📧 Login Email: demo@demo.com');
    console.log('🔑 Password: demo123');
    console.log(`🏢 Company: ${company.name}\n`);
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

initDatabase();