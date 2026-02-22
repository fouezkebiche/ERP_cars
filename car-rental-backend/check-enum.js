const { Sequelize } = require('sequelize');

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

async function checkEnum() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected');
    
    const [result] = await sequelize.query(`
  SELECT unnest(enum_range(NULL::enum_employees_role)) AS role_value;
`);
    
    console.log('Valid role values in database:');
    result.forEach(r => console.log('  -', r.role_value));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkEnum();