// scripts/createAdminUser.js
// Quick helper to create a PLATFORM SUPERADMIN user for logging into the app.
//
// Usage (from backend folder):
//   node scripts/createAdminUser.js
//
// It will:
// - Find the first existing company OR create a new one
// - Create a User with role "owner" (superadmin) for that company
// - Print the email/password you can use to log in via /login

require('dotenv').config()

const { sequelize } = require('../src/config/database')
const { Company, User } = require('../src/models')
const { hashPassword } = require('../src/utils/bcrypt.util')

async function main() {
  try {
    await sequelize.authenticate()
    console.log('✅ DB connection OK')

    // 1) Find or create a company to attach the admin to
    let company = await Company.findOne()

    if (!company) {
      console.log('ℹ️ No companies found. Creating a default company...')
      company = await Company.create({
        name: 'Default Car Rental',
        email: process.env.ADMIN_COMPANY_EMAIL || 'default-company@example.com',
        subscription_plan: 'professional',
        subscription_status: 'active',
        monthly_recurring_revenue: 0,
      })
      console.log('✅ Created company:', company.name, company.id)
    } else {
      console.log('ℹ️ Using existing company:', company.name, company.id)
    }

    // 2) Superadmin credentials (you can override via env)
    const adminEmail =
      process.env.SUPERADMIN_EMAIL || process.env.ADMIN_EMAIL || 'superadmin@platform.local'
    const adminPassword =
      process.env.SUPERADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'SuperAdmin123!'

    // 3) Check if user already exists
    let user = await User.findOne({ where: { email: adminEmail } })
    if (user) {
      console.log('⚠️ Admin user already exists with this email.')
      console.log('   Email   :', adminEmail)
      console.log('   Company :', user.company_id)
      return
    }

    // 4) Create superadmin user
    const password_hash = await hashPassword(adminPassword)

    user = await User.create({
      full_name: 'Platform Superadmin',
      email: adminEmail,
      password_hash,
      company_id: company.id,
      role: 'owner', // owner has full permissions and passes admin routes
      is_active: true,
    })

    console.log('✅ Superadmin user created successfully!')
    console.log('   Email   :', adminEmail)
    console.log('   Password:', adminPassword)
    console.log('   Role    :', user.role)
    console.log('   Company :', company.name, `(${company.id})`)
  } catch (err) {
    console.error('💥 Failed to create admin user:', err)
  } finally {
    await sequelize.close()
    process.exit(0)
  }
}

main()

