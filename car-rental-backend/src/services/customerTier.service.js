// src/services/customerTier.service.js
/**
 * Customer Tier System for Loyalty-Based Pricing
 * Determines overage rates and benefits based on customer rental history
 */

const CUSTOMER_TIERS = {
  NEW: {
    name: 'New Customer',
    min_rentals: 0,
    max_rentals: 0,
    overage_rate: 20, // 20 DA per km
    benefits: [],
    discount_percentage: 0,
  },
  BRONZE: {
    name: 'Bronze',
    min_rentals: 1,
    max_rentals: 4,
    overage_rate: 18, // 18 DA per km
    benefits: [
      '10% discount on overage charges',
      'Priority customer support',
    ],
    discount_percentage: 5,
  },
  SILVER: {
    name: 'Silver',
    min_rentals: 5,
    max_rentals: 9,
    overage_rate: 15, // 15 DA per km
    benefits: [
      '25% discount on overage charges',
      'Free vehicle upgrade (subject to availability)',
      'Priority booking',
      'Extended daily km limit (+50km)',
    ],
    discount_percentage: 10,
    km_bonus: 50, // Extra 50km per day
  },
  GOLD: {
    name: 'Gold',
    min_rentals: 10,
    max_rentals: 19,
    overage_rate: 12, // 12 DA per km
    benefits: [
      '40% discount on overage charges',
      'Free premium vehicle upgrade',
      'Priority booking & support',
      'Extended daily km limit (+100km)',
      'Waived deposit on select vehicles',
    ],
    discount_percentage: 15,
    km_bonus: 100,
  },
  PLATINUM: {
    name: 'Platinum',
    min_rentals: 20,
    max_rentals: Infinity,
    overage_rate: 10, // 10 DA per km
    benefits: [
      '50% discount on overage charges',
      'Complimentary luxury upgrades',
      'VIP priority service',
      'Extended daily km limit (+150km)',
      'Free insurance upgrades',
      'Dedicated account manager',
      'Special corporate rates',
    ],
    discount_percentage: 20,
    km_bonus: 150,
  },
};

/**
 * Determine customer tier based on rental history
 * @param {number} totalRentals - Number of completed rentals
 * @returns {Object} Tier information
 */
const getCustomerTier = (totalRentals) => {
  for (const [tierKey, tierData] of Object.entries(CUSTOMER_TIERS)) {
    if (totalRentals >= tierData.min_rentals && totalRentals <= tierData.max_rentals) {
      return {
        tier: tierKey,
        ...tierData,
      };
    }
  }
  
  return { tier: 'NEW', ...CUSTOMER_TIERS.NEW };
};

/**
 * Calculate overage rate for customer
 * @param {Object} customer - Customer object (may have apply_tier_discount)
 * @param {number} baseRate - Base overage rate (optional)
 * @returns {number} Overage rate in DZD per km
 */
const calculateOverageRate = (customer, baseRate = null) => {
  const applyTier = customer.apply_tier_discount !== false;
  if (!applyTier) {
    return baseRate ?? CUSTOMER_TIERS.NEW.overage_rate;
  }
  const tier = getCustomerTier(customer.total_rentals || 0);
  return baseRate || tier.overage_rate;
};

/**
 * Calculate total km allowed with tier bonuses
 * @param {number} baseDailyLimit - Base daily km limit (e.g., 300)
 * @param {number} totalDays - Number of rental days
 * @param {number} totalRentals - Customer's total rentals
 * @param {Object} [options] - { applyTierBonus: boolean } default true
 * @returns {Object} Allowed km breakdown
 */
const calculateAllowedKm = (baseDailyLimit, totalDays, totalRentals, options = {}) => {
  const applyTierBonus = options.applyTierBonus !== false;
  const tier = getCustomerTier(totalRentals);
  
  const baseKmPerDay = baseDailyLimit;
  const bonusKmPerDay = applyTierBonus ? (tier.km_bonus || 0) : 0;
  const totalDailyLimit = baseKmPerDay + bonusKmPerDay;
  
  const totalAllowed = totalDailyLimit * totalDays;
  
  return {
    base_daily_limit: baseKmPerDay,
    bonus_km_per_day: bonusKmPerDay,
    total_daily_limit: totalDailyLimit,
    total_days: totalDays,
    total_km_allowed: totalAllowed,
    tier: tier.tier,
    tier_name: tier.name,
  };
};

/**
 * Calculate overage charges with tier discount
 * @param {number} kmOverage - Kilometers over limit
 * @param {number} overageRate - Rate per km
 * @param {number} totalRentals - Customer's total rentals
 * @param {Object} [options] - { applyTierDiscount: boolean } default true
 * @returns {Object} Overage breakdown
 */
const calculateOverageCharges = (kmOverage, overageRate, totalRentals, options = {}) => {
  if (kmOverage <= 0) {
    return {
      km_overage: 0,
      base_overage_charges: 0,
      discount_amount: 0,
      final_overage_charges: 0,
      tier: 'N/A',
    };
  }
  
  const applyTierDiscount = options.applyTierDiscount !== false;
  const tier = getCustomerTier(totalRentals);
  
  const baseCharges = kmOverage * overageRate;
  const discountPercentage = applyTierDiscount ? (tier.discount_percentage || 0) : 0;
  const discountAmount = (baseCharges * discountPercentage) / 100;
  const finalCharges = baseCharges - discountAmount;
  
  return {
    km_overage: kmOverage,
    overage_rate: overageRate,
    base_overage_charges: baseCharges,
    discount_percentage: discountPercentage,
    discount_amount: discountAmount,
    final_overage_charges: finalCharges,
    tier: tier.tier,
    tier_name: tier.name,
    savings: discountAmount,
  };
};

/**
 * Get tier progress (how many more rentals to next tier)
 * @param {number} totalRentals - Current total rentals
 * @returns {Object} Progress information
 */
const getTierProgress = (totalRentals) => {
  const currentTier = getCustomerTier(totalRentals);
  
  // Find next tier
  const tierOrder = ['NEW', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
  const currentIndex = tierOrder.indexOf(currentTier.tier);
  
  if (currentIndex === tierOrder.length - 1) {
    // Already at highest tier
    return {
      current_tier: currentTier.tier,
      current_tier_name: currentTier.name,
      next_tier: null,
      rentals_to_next_tier: 0,
      is_max_tier: true,
    };
  }
  
  const nextTierKey = tierOrder[currentIndex + 1];
  const nextTier = CUSTOMER_TIERS[nextTierKey];
  
  const rentalsToNextTier = nextTier.min_rentals - totalRentals;
  
  return {
    current_tier: currentTier.tier,
    current_tier_name: currentTier.name,
    current_rentals: totalRentals,
    next_tier: nextTierKey,
    next_tier_name: nextTier.name,
    rentals_to_next_tier: rentalsToNextTier,
    progress_percentage: Math.min(100, (totalRentals / nextTier.min_rentals) * 100),
    is_max_tier: false,
  };
};

/**
 * Get complete customer tier info with all benefits
 * @param {Object} customer - Customer object (may have apply_tier_discount)
 * @returns {Object} Complete tier information
 */
const getCustomerTierInfo = (customer) => {
  const totalRentals = customer.total_rentals || 0;
  const tier = getCustomerTier(totalRentals);
  const progress = getTierProgress(totalRentals);
  const apply_tier_discount = customer.apply_tier_discount !== false;
  
  return {
    customer_id: customer.id,
    customer_name: customer.full_name,
    total_rentals: totalRentals,
    lifetime_value: parseFloat(customer.lifetime_value || 0),
    apply_tier_discount: !!apply_tier_discount,
    ...tier,
    progress,
  };
};

module.exports = {
  CUSTOMER_TIERS,
  getCustomerTier,
  calculateOverageRate,
  calculateAllowedKm,
  calculateOverageCharges,
  getTierProgress,
  getCustomerTierInfo,
};