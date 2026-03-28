// scripts/seedLocationCompany.js
//
// Creates a brand-new company whose address contains a real Algerian
// wilaya + commune so the trending-vehicles location filter can be tested.
//
// It then seeds:
//   • 1 owner user
//   • 10 vehicles (mixed brands / categories)
//   • 15 customers  (with realistic rental history)
//   • 25 contracts  (mix of active / completed, spread over last 90 days)
//   • payments for every completed contract
//   • 3 sample notifications
//
// Usage (from the backend folder):
//   node scripts/seedLocationCompany.js
//
// Override defaults via env vars:
//   SEED_WILAYA=Sétif   SEED_COMMUNE=Mazloug   SEED_EMAIL=test@company.dz
//   node scripts/seedLocationCompany.js

require('dotenv').config()

const { sequelize }  = require('../src/config/database')
const {
  Company, User, Vehicle, Customer,
  Contract, Payment, Notification,
} = require('../src/models')
const { hashPassword } = require('../src/utils/bcrypt.util')
const { Op }         = require('sequelize')

// ─── Config (override via env) ────────────────────────────────────────────────
const WILAYA  = process.env.SEED_WILAYA  || 'Sétif'
const COMMUNE = process.env.SEED_COMMUNE || 'Mazloug'
const COMPANY_EMAIL   = process.env.SEED_EMAIL    || `owner@${COMMUNE.toLowerCase().replace(/\s+/g, '')}.dz`
const OWNER_PASSWORD  = process.env.SEED_PASSWORD || 'Test1234!'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand      = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick      = arr => arr[Math.floor(Math.random() * arr.length)]
const daysAgo   = n => new Date(Date.now() - n * 86400000)
const addDays   = (d, n) => new Date(new Date(d).getTime() + n * 86400000)

function randomDateBetween(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// ─── Seed data definitions ────────────────────────────────────────────────────
const VEHICLE_CATALOG = [
  { brand: 'Toyota',    model: 'Corolla',  year: 2023, daily_rate: 4500, fuel_type: 'petrol',  transmission: 'automatic', seats: 5, category: 'sedan'     },
  { brand: 'Toyota',    model: 'Hilux',    year: 2024, daily_rate: 8500, fuel_type: 'diesel',  transmission: 'manual',    seats: 5, category: 'pickup'    },
  { brand: 'Hyundai',   model: 'Tucson',   year: 2023, daily_rate: 6500, fuel_type: 'petrol',  transmission: 'automatic', seats: 5, category: 'suv'       },
  { brand: 'Hyundai',   model: 'i20',      year: 2024, daily_rate: 3200, fuel_type: 'petrol',  transmission: 'manual',    seats: 5, category: 'hatchback' },
  { brand: 'Renault',   model: 'Clio',     year: 2023, daily_rate: 3000, fuel_type: 'petrol',  transmission: 'manual',    seats: 5, category: 'hatchback' },
  { brand: 'Peugeot',   model: '208',      year: 2024, daily_rate: 3200, fuel_type: 'petrol',  transmission: 'manual',    seats: 5, category: 'hatchback' },
  { brand: 'Kia',       model: 'Sportage', year: 2023, daily_rate: 6800, fuel_type: 'diesel',  transmission: 'automatic', seats: 5, category: 'suv'       },
  { brand: 'Volkswagen',model: 'Passat',   year: 2023, daily_rate: 5500, fuel_type: 'diesel',  transmission: 'automatic', seats: 5, category: 'sedan'     },
  { brand: 'Mercedes',  model: 'C-Class',  year: 2024, daily_rate:12000, fuel_type: 'petrol',  transmission: 'automatic', seats: 5, category: 'luxury'    },
  { brand: 'Nissan',    model: 'Qashqai',  year: 2023, daily_rate: 6000, fuel_type: 'diesel',  transmission: 'automatic', seats: 5, category: 'suv'       },
]

const FIRST_NAMES = ['Ahmed','Fatima','Mohamed','Amina','Youssef','Samira','Karim','Leila','Omar','Nadia','Bilal','Sara','Hamza','Rania','Tarek']
const LAST_NAMES  = ['Benali','Bouazza','Cherif','Djelloul','Farid','Gharbi','Hamdi','Ibrahim','Khelifa','Larbi','Meziane','Nasri','Ouali','Rahmani','Saadi']
const CITIES      = [COMMUNE, WILAYA, `${COMMUNE} Centre`, `Hay El Badr - ${COMMUNE}`]
const PAY_METHODS = ['cash','card','bank_transfer','mobile_payment']
const COLORS      = ['White','Black','Silver','Blue','Gray','Red']

// Plate format used in Algeria: 12-345-16 (serial - numbers - wilaya code)
// We'll use wilaya code 19 for Sétif as default; adjust if you change wilaya.
const WILAYA_CODE = process.env.SEED_WILAYA_CODE || '19'
let plateCounter  = rand(100, 499)
const nextPlate   = () => `${rand(10,99)}-${String(++plateCounter).padStart(3,'0')}-${WILAYA_CODE}`

let licenseCounter = rand(100000, 499999)
const nextLicense  = () => `DL${String(++licenseCounter)}`

let contractYear = new Date().getFullYear()
let contractSeq  = rand(1, 50)
const nextContractNo = () =>
  `RENT-${contractYear}-${String(++contractSeq).padStart(4,'0')}`

// ─── Financial helpers ────────────────────────────────────────────────────────
function calcTotals(dailyRate, totalDays, additionalCharges = 0, discountAmount = 0) {
  const dr          = parseFloat(dailyRate)
  const base        = dr * totalDays
  const subtotal    = base + parseFloat(additionalCharges) - parseFloat(discountAmount)
  const tax         = subtotal * 0.19
  const total       = subtotal + tax
  return { base_amount: base, tax_amount: tax, total_amount: total }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  try {
    await sequelize.authenticate()
    console.log('✅ DB connection OK\n')

    // ── Guard: don't create duplicates ───────────────────────────────────────
    const existing = await Company.findOne({ where: { email: COMPANY_EMAIL } })
    if (existing) {
      console.log(`⚠️  A company with email "${COMPANY_EMAIL}" already exists (${existing.id}).`)
      console.log('   Delete it first or set a different SEED_EMAIL env var.')
      return
    }

    const t = await sequelize.transaction()

    try {
      // ── 1. Company ─────────────────────────────────────────────────────────
      console.log(`🏢 Creating company in ${COMMUNE}, ${WILAYA}…`)
      const company = await Company.create({
        name: `${COMMUNE} Auto Rental`,
        email: COMPANY_EMAIL,
        phone: `+213 ${rand(500,799)} ${rand(100,999)} ${rand(100,999)}`,
        // Address contains both wilaya and commune for ILIKE matching in the API
        address: `${rand(1,200)} Rue de l'Indépendance, ${COMMUNE}, Wilaya de ${WILAYA}`,
        subscription_plan:   'professional',
        subscription_status: 'active',
        monthly_recurring_revenue: 75000,
        settings: {
          defaultDailyKmLimit: 300,
          defaultOverageRate:  20,
        },
      }, { transaction: t })
      console.log(`   ✅ Company: ${company.name}  (${company.id})`)

      // ── 2. Owner user ───────────────────────────────────────────────────────
      console.log('👤 Creating owner user…')
      const pwHash = await hashPassword(OWNER_PASSWORD)
      const owner  = await User.create({
        full_name:     `${COMMUNE} Admin`,
        email:         COMPANY_EMAIL,
        password_hash: pwHash,
        company_id:    company.id,
        role:          'owner',
        is_active:     true,
      }, { transaction: t })
      console.log(`   ✅ Owner: ${owner.email}  /  password: ${OWNER_PASSWORD}`)

      // ── 3. Vehicles ─────────────────────────────────────────────────────────
      console.log('🚗 Creating 10 vehicles…')
      const vehicles = []
      for (const spec of VEHICLE_CATALOG) {
        const mileage    = rand(8000, 75000)
        const lastMaint  = mileage - rand(500, 4500)
        const v = await Vehicle.create({
          company_id:                  company.id,
          brand:                       spec.brand,
          model:                       spec.model,
          year:                        spec.year,
          registration_number:         nextPlate(),
          color:                       pick(COLORS),
          transmission:                spec.transmission,
          fuel_type:                   spec.fuel_type,
          seats:                       spec.seats,
          daily_rate:                  spec.daily_rate,
          status:                      'available',
          mileage,
          last_maintenance_mileage:    lastMaint,
          next_maintenance_mileage:    lastMaint + 5000,
          maintenance_interval_km:     5000,
          maintenance_alert_threshold: 100,
          last_maintenance_alert_mileage: lastMaint,
          purchase_price:              spec.daily_rate * 365 * 2,
          purchase_date:               randomDateBetween(daysAgo(730), daysAgo(180)),
          // Store category in features JSON so vehicle.category field works
          features: { category: spec.category },
        }, { transaction: t })
        vehicles.push({ ...v.toJSON(), _category: spec.category, _dailyRate: spec.daily_rate })
      }
      console.log(`   ✅ ${vehicles.length} vehicles created`)

      // ── 4. Customers ────────────────────────────────────────────────────────
      console.log('👥 Creating 15 customers…')
      const customers = []
      for (let i = 0; i < 15; i++) {
        const fullName     = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`
        const totalRentals = rand(0, 20)
        const lifetimeVal  = totalRentals * rand(5000, 14000)
        const c = await Customer.create({
          company_id:              company.id,
          customer_type:           rand(0,4) === 0 ? 'corporate' : 'individual',
          full_name:               fullName,
          email:                   `${fullName.toLowerCase().replace(/\s+/g,'.')}${i}@mail.dz`,
          phone:                   `+213 ${rand(500,799)} ${rand(100,999)} ${rand(100,999)}`,
          address:                 `${rand(1,99)} Cité ${pick(['El Badr','El Wiam','El Feth','El Amal'])}, ${pick(CITIES)}`,
          city:                    COMMUNE,
          drivers_license_number:  nextLicense(),
          license_expiry_date:     addDays(new Date(), rand(180, 1800)),
          total_rentals:           totalRentals,
          lifetime_value:          lifetimeVal,
          apply_tier_discount:     true,
          is_blacklisted:          false,
          created_at:              randomDateBetween(daysAgo(365), daysAgo(30)),
        }, { transaction: t })
        customers.push(c.toJSON())
      }
      console.log(`   ✅ ${customers.length} customers created`)

      // ── 5. Contracts + Payments ─────────────────────────────────────────────
      console.log('📄 Creating 25 contracts…')
      let contractCount = 0
      let paymentCount  = 0

      for (let i = 0; i < 25; i++) {
        const vehicle     = pick(vehicles)
        const customer    = pick(customers)
        const daysBack    = rand(1, 88)           // started within the last 90 days
        const startDate   = daysAgo(daysBack)
        const totalDays   = rand(2, 12)
        const endDate     = addDays(startDate, totalDays)
        const isPast      = endDate < new Date()
        const status      = isPast ? pick(['completed','completed','completed','cancelled']) : 'active'
        const startMileage = rand(8000, 70000)
        const dailyRate    = vehicle._dailyRate
        const totals       = calcTotals(dailyRate, totalDays)
        const contractNo   = nextContractNo()

        let endMileage     = null
        let actualKm       = 0
        let depositReturned = false

        if (status === 'completed') {
          actualKm       = rand(totalDays * 150, totalDays * 380)
          endMileage     = startMileage + actualKm
          depositReturned = true
        }

        // Check for duplicate contract number (very unlikely but safe)
        const dupCheck = await Contract.findOne({
          where: { contract_number: contractNo },
          transaction: t,
        })
        if (dupCheck) continue

        const contract = await Contract.create({
          contract_number:     contractNo,
          company_id:          company.id,
          customer_id:         customer.id,
          vehicle_id:          vehicle.id,
          created_by:          owner.id,
          start_date:          startDate,
          end_date:            endDate,
          actual_return_date:  status === 'completed' ? endDate : null,
          daily_rate:          dailyRate,
          total_days:          totalDays,
          base_amount:         totals.base_amount,
          additional_charges:  0,
          discount_amount:     0,
          tax_amount:          totals.tax_amount,
          total_amount:        totals.total_amount,
          deposit_amount:      dailyRate * 2,
          deposit_returned:    depositReturned,
          status,
          start_mileage:       startMileage,
          end_mileage:         endMileage,
          actual_km_driven:    actualKm,
          daily_km_limit:      300,
          total_km_allowed:    300 * totalDays,
          overage_rate_per_km: 20,
          overage_charges:     0,
          notes:               `Seeded contract — ${COMMUNE}, ${WILAYA}`,
        }, { transaction: t })
        contractCount++

        // Payment for completed contracts
        if (status === 'completed') {
          await Payment.create({
            company_id:     company.id,
            contract_id:    contract.id,
            customer_id:    customer.id,
            amount:         totals.total_amount,
            payment_method: pick(PAY_METHODS),
            payment_date:   endDate,
            status:         'completed',
            reference_number: `REF-${rand(100000, 999999)}`,
            processed_by:   owner.id,
          }, { transaction: t })
          paymentCount++
        }

        // Partial deposit payment for active contracts
        if (status === 'active') {
          await Payment.create({
            company_id:     company.id,
            contract_id:    contract.id,
            customer_id:    customer.id,
            amount:         dailyRate * 2,          // deposit only
            payment_method: pick(PAY_METHODS),
            payment_date:   startDate,
            status:         'completed',
            reference_number: `DEP-${rand(100000, 999999)}`,
            processed_by:   owner.id,
          }, { transaction: t })
          paymentCount++
        }
      }
      console.log(`   ✅ ${contractCount} contracts, ${paymentCount} payments created`)

      // ── 6. Notifications ────────────────────────────────────────────────────
      console.log('🔔 Creating sample notifications…')
      await Notification.bulkCreate([
        {
          company_id: company.id,
          type:       'vehicle_maintenance',
          priority:   'high',
          title:      '⚠️ Maintenance Due',
          message:    `Toyota Hilux in ${COMMUNE} fleet requires service at next 5,000 km interval.`,
          data:       { location: COMMUNE, wilaya: WILAYA },
          is_read:    false,
          dismissed:  false,
        },
        {
          company_id: company.id,
          type:       'km_limit_warning',
          priority:   'medium',
          title:      '⚠️ KM Limit Warning',
          message:    `An active contract in ${COMMUNE} has 250 km remaining on its daily limit.`,
          data:       { location: COMMUNE, wilaya: WILAYA },
          is_read:    false,
          dismissed:  false,
        },
        {
          company_id: company.id,
          type:       'payment_due',
          priority:   'high',
          title:      '💰 Payment Pending',
          message:    `Outstanding balance on a recent contract from ${COMMUNE} branch.`,
          data:       { location: COMMUNE, wilaya: WILAYA },
          is_read:    false,
          dismissed:  false,
        },
      ], { transaction: t })
      console.log('   ✅ 3 notifications created')

      await t.commit()

      // ── Summary ─────────────────────────────────────────────────────────────
      console.log('\n🎉 Seed complete!\n')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('  Company  :', company.name)
      console.log('  Address  :', company.address)
      console.log('  ID       :', company.id)
      console.log('  Login    :', COMPANY_EMAIL)
      console.log('  Password :', OWNER_PASSWORD)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('\n📍 Location filter test:')
      console.log(`  Wilaya  → "${WILAYA}"`)
      console.log(`  Commune → "${COMMUNE}"`)
      console.log('\n  Open the Trending Vehicles page, select the wilaya and')
      console.log(`  commune above, click Apply — you should see this company's`)
      console.log('  vehicles appear in the rankings.\n')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('  To seed a different location, run:')
      console.log('  SEED_WILAYA=Oran SEED_COMMUNE=Arzew SEED_EMAIL=test@arzew.dz \\')
      console.log('    node scripts/seedLocationCompany.js')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

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