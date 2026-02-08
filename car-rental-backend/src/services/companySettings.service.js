// src/services/companySettings.service.js
const { Company } = require('../models');

const getDefaultDailyKmLimit = async (companyId) => {
  try {
    const company = await Company.findByPk(companyId, {
      attributes: ['settings'],
    });
    if (!company) {
      console.warn(`⚠️ Company ${companyId} not found, using default 300km`);
      return 300;
    }
    const dailyKmLimit = company.settings?.defaultDailyKmLimit;
    if (dailyKmLimit && typeof dailyKmLimit === 'number' && dailyKmLimit >= 50 && dailyKmLimit <= 1000) {
      console.log(`✅ Using company ${companyId} daily KM limit: ${dailyKmLimit}km`);
      return dailyKmLimit;
    }
    console.log(`ℹ️ No valid daily KM limit in settings for company ${companyId}, using default 300km`);
    return 300;
  } catch (error) {
    console.error(`❌ Error fetching daily KM limit for company ${companyId}:`, error);
    return 300;
  }
};

const getDefaultOverageRate = async (companyId) => {
  try {
    const company = await Company.findByPk(companyId, {
      attributes: ['settings'],
    });
    if (!company) {
      console.warn(`⚠️ Company ${companyId} not found, using default 20 DA/km`);
      return 20;
    }
    const overageRate = company.settings?.defaultOverageRate;
    if (overageRate && typeof overageRate === 'number' && overageRate >= 5 && overageRate <= 50) {
      console.log(`✅ Using company ${companyId} overage rate: ${overageRate} DA/km`);
      return overageRate;
    }
    console.log(`ℹ️ No valid overage rate in settings for company ${companyId}, using default 20 DA/km`);
    return 20;
  } catch (error) {
    console.error(`❌ Error fetching overage rate for company ${companyId}:`, error);
    return 20;
  }
};

const getRentalPolicySettings = async (companyId) => {
  try {
    const [dailyKmLimit, overageRate] = await Promise.all([
      getDefaultDailyKmLimit(companyId),
      getDefaultOverageRate(companyId),
    ]);
    return {
      defaultDailyKmLimit: dailyKmLimit,
      defaultOverageRate: overageRate,
    };
  } catch (error) {
    console.error(`❌ Error fetching rental policy settings for company ${companyId}:`, error);
    return {
      defaultDailyKmLimit: 300,
      defaultOverageRate: 20,
    };
  }
};

module.exports = {
  getDefaultDailyKmLimit,
  getDefaultOverageRate,
  getRentalPolicySettings,
};