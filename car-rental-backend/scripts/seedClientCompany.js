// scripts/seedClientCompany.js
//
// Creates a regular CLIENT company that subscribes to your platform.
//
// Role convention (strict):
//   "owner"  = YOU only. The platform superadmin. Created by createAdminUser.js.
//   "admin"  = highest role inside a client company → redirects to /dashboard
//   "manager", "staff", etc. = other client users → /dashboard
//
// Usage:
//   node scripts/seedClientCompany.js
//
// Override via env:
//   SEED_WILAYA=Oran SEED_COMMUNE=Arzew SEED_EMAIL=admin@arzew.dz \
//   SEED_PLAN=basic SEED_STATUS=trial \
//   node scripts/seedClientCompany.js

require('dotenv').config()

const { sequelize } = require('../src/config/database')
const {
  Company, User, Vehicle, Customer,
  Contract, Payment, Notification,
} = require('../src/models')
const { hashPassword } = require('../src/utils/bcrypt.util')

// ─── Config ───────────────────────────────────────────────────────────────────
const WILAYA         = process.env.SEED_WILAYA      || 'Sétif'
const COMMUNE        = process.env.SEED_COMMUNE     || 'Mazloug'
const ADMIN_EMAIL    = process.env.SEED_EMAIL       || `admin@${COMMUNE.toLowerCase().replace(/[\s']/g, '')}-rent.dz`
const ADMIN_PASSWORD = process.env.SEED_PASSWORD    || 'Client1234!'
const PLAN           = process.env.SEED_PLAN        || 'professional'
const STATUS         = process.env.SEED_STATUS      || 'active'
const WILAYA_CODE    = process.env.SEED_WILAYA_CODE || '19'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand    = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick    = arr => arr[Math.floor(Math.random() * arr.length)]
const daysAgo = n => new Date(Date.now() - n * 86_400_000)
const addDays = (d, n) => new Date(new Date(d).getTime() + n * 86_400_000)

function randomDateBetween(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

let _plate = rand(100, 499)
const nextPlate = () => `${rand(10, 99)}-${String(++_plate).padStart(3, '0')}-${WILAYA_CODE}`

let _license = rand(100_000, 499_999)
const nextLicense = () => `DL${++_license}`

let _contractSeq = rand(1, 50)
const nextContractNo = () =>
  `RENT-${new Date().getFullYear()}-${String(++_contractSeq).padStart(4, '0')}`

function calcTotals(dailyRate, totalDays) {
  const base = parseFloat(dailyRate) * totalDays
  const tax  = base * 0.19
  return { base_amount: base, tax_amount: tax, total_amount: base + tax }
}

// ─── Catalog ──────────────────────────────────────────────────────────────────
const VEHICLES = [
  { brand: 'Toyota',     model: 'Corolla',  year: 2023, daily_rate:  4500, fuel_type: 'petrol',  transmission: 'automatic', seats: 5, category: 'sedan'     },
  { brand: 'Toyota',     model: 'Hilux',    year: 2024, daily_rate:  8500, fuel_type: 'diesel',  transmission: 'manual',    seats: 5, category: 'pickup'    },
  { brand: 'Hyundai',    model: 'Tucson',   year: 2023, daily_rate:  6500, fuel_type: 'petrol',  transmission: 'automatic', seats: 5, category: 'suv'       },
  { brand: 'Hyundai',    model: 'i20',      year: 2024, daily_rate:  3200, fuel_type: 'petrol',  transmission: 'manual',    seats: 5, category: 'hatchback' },
  { brand: 'Renault',    model: 'Clio',     year: 2023, daily_rate:  3000, fuel_type: 'petrol',  transmission: 'manual',    seats: 5, category: 'hatchback' },
  { brand: 'Peugeot',    model: '208',      year: 2024, daily_rate:  3200, fuel_type: 'petrol',  transmission: 'manual',    seats: 5, category: 'hatchback' },
  { brand: 'Kia',        model: 'Sportage', year: 2023, daily_rate:  6800, fuel_type: 'diesel',  transmission: 'automatic', seats: 5, category: 'suv'       },
  { brand: 'Volkswagen', model: 'Passat',   year: 2023, daily_rate:  5500, fuel_type: 'diesel',  transmission: 'automatic', seats: 5, category: 'sedan'     },
  { brand: 'Mercedes',   model: 'C-Class',  year: 2024, daily_rate: 12000, fuel_type: 'petrol',  transmission: 'automatic', seats: 5, category: 'luxury'    },
  { brand: 'Nissan',     model: 'Qashqai',  year: 2023, daily_rate:  6000, fuel_type: 'diesel',  transmission: 'automatic', seats: 5, category: 'suv'       },
]

const FIRST_NAMES = ['Ahmed','Fatima','Mohamed','Amina','Youssef','Samira','Karim','Leila','Omar','Nadia','Bilal','Sara','Hamza','Rania','Tarek']
const LAST_NAMES  = ['Benali','Bouazza','Cherif','Djelloul','Farid','Gharbi','Hamdi','Ibrahim','Khelifa','Larbi','Meziane','Nasri','Ouali','Rahmani','Saadi']
const PAY_METHODS = ['cash', 'card', 'bank_transfer', 'mobile_payment']
const COLORS      = ['White','Black','Silver','Blue','Gray','Red']

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  try {
    await sequelize.authenticate()
    console.log('✅ DB connected\n')

    // Guard against duplicate emails
    const existingUser = await User.findOne({ where: { email: ADMIN_EMAIL } })
    if (existingUser) {
      console.log(`⚠️  User "${ADMIN_EMAIL}" already exists.`)
      console.log('   Set a different SEED_EMAIL or delete the existing record first.')
      return
    }

    const t = await sequelize.transaction()

    try {
      // ── 1. Company ────────────────────────────────────────────────────────────
      console.log(`🏢 Creating client company in ${COMMUNE}, ${WILAYA}…`)
      const mrr = PLAN === 'basic' ? 15_000 : PLAN === 'professional' ? 35_000 : 75_000

      const company = await Company.create({
        name:  `${COMMUNE} Car Rental`,
        email: ADMIN_EMAIL,
        phone: `+213 ${rand(500,799)} ${rand(100,999)} ${rand(100,999)}`,
        address: `${rand(1,200)} Rue de l'Indépendance, ${COMMUNE}, Wilaya de ${WILAYA}, Algérie`,
        tax_id: `TAX-${rand(1_000_000, 9_999_999)}`,
        subscription_plan:         PLAN,
        subscription_status:       STATUS,
        subscription_start_date:   daysAgo(rand(30, 180)),
        trial_ends_at:             STATUS === 'trial' ? addDays(new Date(), 14) : null,
        monthly_recurring_revenue: mrr,
        settings: { defaultDailyKmLimit: 300, defaultOverageRate: 20 },
      }, { transaction: t })

      console.log(`   ✅ Company : ${company.name}  (${company.id})`)
      console.log(`   ✅ Plan    : ${PLAN}  |  Status: ${STATUS}`)
      console.log(`   ✅ Address : ${company.address}`)

      // ── 2. Admin user (NOT owner) ─────────────────────────────────────────────
      // role: 'admin' → goes to /dashboard on login, never to /admin
      // role: 'owner' is reserved exclusively for the platform superadmin (you)
      console.log('\n👤 Creating company admin user…')
      const pwHash = await hashPassword(ADMIN_PASSWORD)

      const adminUser = await User.create({
        full_name:     `${COMMUNE} Admin`,
        email:         ADMIN_EMAIL,
        password_hash: pwHash,
        company_id:    company.id,
        role:          'admin',   // ← NOT 'owner'
        is_active:     true,
      }, { transaction: t })

      console.log(`   ✅ Email   : ${adminUser.email}`)
      console.log(`   ✅ Password: ${ADMIN_PASSWORD}`)
      console.log(`   ✅ Role    : admin  →  will redirect to /dashboard on login`)

      // ── 3. Vehicles ───────────────────────────────────────────────────────────
      console.log('\n🚗 Creating 10 vehicles…')
      const createdVehicles = []

      for (const spec of VEHICLES) {
        const mileage   = rand(8_000, 75_000)
        const lastMaint = mileage - rand(500, 4_500)

        const v = await Vehicle.create({
          company_id:                     company.id,
          brand:                          spec.brand,
          model:                          spec.model,
          year:                           spec.year,
          registration_number:            nextPlate(),
          color:                          pick(COLORS),
          transmission:                   spec.transmission,
          fuel_type:                      spec.fuel_type,
          seats:                          spec.seats,
          daily_rate:                     spec.daily_rate,
          status:                         'available',
          mileage,
          last_maintenance_mileage:       lastMaint,
          next_maintenance_mileage:       lastMaint + 5_000,
          maintenance_interval_km:        5_000,
          maintenance_alert_threshold:    100,
          last_maintenance_alert_mileage: lastMaint,
          purchase_price:                 spec.daily_rate * 365 * 2,
          purchase_date:                  randomDateBetween(daysAgo(730), daysAgo(180)),
          features:                       { category: spec.category },
          notes:                          `Seeded — ${COMMUNE} fleet`,
        }, { transaction: t })

        createdVehicles.push({ ...v.toJSON(), _dailyRate: spec.daily_rate, _category: spec.category })
        console.log(`   ✅ ${spec.brand} ${spec.model} ${spec.year}  [${spec.category}]  — ${v.registration_number}`)
      }

      // ── 4. Customers ──────────────────────────────────────────────────────────
      console.log('\n👥 Creating 15 customers…')
      const createdCustomers = []

      for (let i = 0; i < 15; i++) {
        const fullName     = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`
        const totalRentals = rand(0, 22)

        const c = await Customer.create({
          company_id:             company.id,
          customer_type:          i < 2 ? 'corporate' : 'individual',
          full_name:              fullName,
          email:                  `${fullName.toLowerCase().replace(/\s+/g, '.')}${i}@mail.dz`,
          phone:                  `+213 ${rand(500,799)} ${rand(100,999)} ${rand(100,999)}`,
          address:                `${rand(1,99)} Cité El Amal, ${COMMUNE}, ${WILAYA}`,
          city:                   COMMUNE,
          drivers_license_number: nextLicense(),
          license_expiry_date:    addDays(new Date(), rand(180, 1_800)),
          total_rentals:          totalRentals,
          lifetime_value:         totalRentals * rand(4_000, 14_000),
          apply_tier_discount:    true,
          is_blacklisted:         false,
          created_at:             randomDateBetween(daysAgo(365), daysAgo(30)),
        }, { transaction: t })

        createdCustomers.push(c.toJSON())
      }
      console.log(`   ✅ ${createdCustomers.length} customers created`)

      // ── 5. Contracts + Payments ───────────────────────────────────────────────
      console.log('\n📄 Creating 25 contracts…')
      let contractCount = 0
      let paymentCount  = 0

      for (let i = 0; i < 25; i++) {
        const vehicle   = pick(createdVehicles)
        const customer  = pick(createdCustomers)
        const startDate = daysAgo(rand(1, 88))
        const totalDays = rand(2, 12)
        const endDate   = addDays(startDate, totalDays)
        const isPast    = endDate < new Date()
        const status    = !isPast ? 'active' : pick(['completed','completed','completed','cancelled'])

        const startMileage  = rand(8_000, 70_000)
        const totals        = calcTotals(vehicle._dailyRate, totalDays)
        const contractNo    = nextContractNo()

        let endMileage = null, actualKm = 0, depositReturned = false
        if (status === 'completed') {
          actualKm        = rand(totalDays * 150, totalDays * 380)
          endMileage      = startMileage + actualKm
          depositReturned = true
        }

        const dup = await Contract.findOne({ where: { contract_number: contractNo }, transaction: t })
        if (dup) continue

        const contract = await Contract.create({
          contract_number:     contractNo,
          company_id:          company.id,
          customer_id:         customer.id,
          vehicle_id:          vehicle.id,
          created_by:          adminUser.id,
          start_date:          startDate,
          end_date:            endDate,
          actual_return_date:  status === 'completed' ? endDate : null,
          daily_rate:          vehicle._dailyRate,
          total_days:          totalDays,
          base_amount:         totals.base_amount,
          additional_charges:  0,
          discount_amount:     0,
          tax_amount:          totals.tax_amount,
          total_amount:        totals.total_amount,
          deposit_amount:      vehicle._dailyRate * 2,
          deposit_returned:    depositReturned,
          status,
          start_mileage:       startMileage,
          end_mileage:         endMileage,
          actual_km_driven:    actualKm,
          daily_km_limit:      300,
          total_km_allowed:    300 * totalDays,
          overage_rate_per_km: 20,
          overage_charges:     0,
          notes:               `Seeded — ${COMMUNE}, ${WILAYA}`,
        }, { transaction: t })

        contractCount++

        if (status === 'completed') {
          await Payment.create({
            company_id: company.id, contract_id: contract.id, customer_id: customer.id,
            amount: totals.total_amount, payment_method: pick(PAY_METHODS),
            payment_date: endDate, status: 'completed',
            reference_number: `REF-${rand(100_000,999_999)}`, processed_by: adminUser.id,
          }, { transaction: t })
          paymentCount++
        }

        if (status === 'active') {
          await Payment.create({
            company_id: company.id, contract_id: contract.id, customer_id: customer.id,
            amount: vehicle._dailyRate * 2, payment_method: pick(PAY_METHODS),
            payment_date: startDate, status: 'completed',
            reference_number: `DEP-${rand(100_000,999_999)}`, processed_by: adminUser.id,
          }, { transaction: t })
          paymentCount++
        }
      }

      console.log(`   ✅ ${contractCount} contracts created`)
      console.log(`   ✅ ${paymentCount} payments created`)

      // ── 6. Notifications ──────────────────────────────────────────────────────
      console.log('\n🔔 Creating notifications…')
      await Notification.bulkCreate([
        {
          company_id: company.id, type: 'vehicle_maintenance', priority: 'high',
          title: '⚠️ Maintenance Due — Toyota Hilux',
          message: `The Toyota Hilux in the ${COMMUNE} fleet is due for its 5,000 km service.`,
          data: { wilaya: WILAYA, commune: COMMUNE }, is_read: false, dismissed: false,
        },
        {
          company_id: company.id, type: 'km_limit_warning', priority: 'medium',
          title: '⚠️ KM Limit Warning',
          message: `An active contract has 250 km remaining on its daily limit.`,
          data: { wilaya: WILAYA, commune: COMMUNE }, is_read: false, dismissed: false,
        },
        {
          company_id: company.id, type: 'payment_due', priority: 'high',
          title: '💰 Outstanding Payment',
          message: `A completed contract has an outstanding balance awaiting settlement.`,
          data: { wilaya: WILAYA, commune: COMMUNE }, is_read: false, dismissed: false,
        },
      ], { transaction: t })
      console.log('   ✅ 3 notifications created')

      await t.commit()

      // ── Summary ───────────────────────────────────────────────────────────────
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('  ✅  CLIENT COMPANY SEEDED SUCCESSFULLY')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`  Company  :  ${company.name}`)
      console.log(`  Plan     :  ${PLAN}  (${STATUS})`)
      console.log(`  Address  :  ${company.address}`)
      console.log(`  ID       :  ${company.id}`)
      console.log('──────────────────────────────────────────────────────')
      console.log('  Login → redirects to /dashboard (NOT /admin):')
      console.log(`  Email    :  ${ADMIN_EMAIL}`)
      console.log(`  Password :  ${ADMIN_PASSWORD}`)
      console.log(`  Role     :  admin`)
      console.log('──────────────────────────────────────────────────────')
      console.log('  Super-admin filter test:')
      console.log(`  Wilaya   :  ${WILAYA}`)
      console.log(`  Commune  :  ${COMMUNE}`)
      console.log('  → Log in as YOUR superadmin (owner), open Trending')
      console.log('    Vehicles, pick the wilaya + commune, click Apply.')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('\n  Seed another location:')
      console.log('  SEED_WILAYA=Oran SEED_COMMUNE=Arzew SEED_EMAIL=admin@arzew.dz \\')
      console.log('    node scripts/seedClientCompany.js\n')

    } catch (err) {
      await t.rollback()
      throw err
    }

  } catch (err) {
    console.error('\n💥 Seed failed:', err.message)
    if (process.env.NODE_ENV === 'development') console.error(err.stack)
  } finally {
    await sequelize.close()
    process.exit(0)
  }
}

main()