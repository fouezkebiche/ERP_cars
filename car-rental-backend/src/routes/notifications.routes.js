const express = require('express');
const router = express.Router();
const { Notification, sequelize } = require('../models');
const { Op } = require('sequelize');
const { authenticateToken } = require('../middleware/auth.middleware');
const { injectCompanyId } = require('../middleware/tenantIsolation.middleware');

// Apply auth & tenant isolation
router.use(authenticateToken);
router.use(injectCompanyId);

// GET /api/notifications?priority=critical&limit=5&unread=true&dismissed=false&type=km_limit_*&data[vehicle_id]=abc123
// Fetches company-specific notifications (filtered/sorted)
router.get('/', async (req, res) => {
  try {
    const { priority, limit = 10, unread = true, dismissed = false, type } = req.query;
    const where = { company_id: req.companyId };
    if (unread) where.is_read = false;
    if (priority) where.priority = priority;
    
    // Existing dismissed handling
    if (dismissed === 'true') {
      where.dismissed = true;
    } else {
      where.dismissed = false;
    }
    
    // FIXED: Filter by type with wildcard support (cast ENUM to TEXT for ILIKE)
    if (type) {
      if (typeof type === 'string' && type.includes('*')) {
        // Wildcard: km_limit_* → LIKE 'km_limit_%' (case-insensitive)
        const pattern = type.replace('*', '%').toLowerCase();
        // Use sequelize.where with CAST to convert ENUM to TEXT for ILIKE
        where[Op.and] = sequelize.where(
          sequelize.cast(sequelize.col('type'), 'TEXT'),
          { [Op.iLike]: pattern }
        );
      } else {
        // Exact match (works with ENUM)
        where.type = type;
      }
    }
    
    // Filter by data (JSONB) - Parse params like data[vehicle_id]=abc123
    const dataFilters = {};
    Object.keys(req.query).forEach(key => {
      if (key.startsWith('data[') && key.endsWith(']')) {
        const dataKey = key.slice(5, -1);  // Extract 'vehicle_id'
        const value = req.query[key];
        dataFilters[dataKey] = value;
      }
    });
    if (Object.keys(dataFilters).length > 0) {
      where.data = {};
      Object.entries(dataFilters).forEach(([key, value]) => {
        where.data[key] = { [Op.eq]: value };
      });
    }
    
    const notifications = await Notification.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      attributes: { exclude: ['updated_at'] },
    });
    res.json({
      success: true,
      data: { notifications },
      meta: { total: notifications.length },
    });
  } catch (error) {
    console.error('💥 Fetch notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error.message });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({ where: { id, company_id: req.companyId } });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    await notification.update({ is_read: true, read_at: new Date() });
    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
});

// PATCH /api/notifications/:id/dismiss
router.patch('/:id/dismiss', async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({ where: { id, company_id: req.companyId } });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    await notification.update({ 
      dismissed: true, 
      dismissed_at: new Date(), 
      is_read: true, 
      read_at: new Date() 
    });
    res.json({ success: true, message: 'Notification dismissed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to dismiss notification' });
  }
});

// PATCH /api/notifications/:id/restore
router.patch('/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({ where: { id, company_id: req.companyId } });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    await notification.update({ 
      dismissed: false, 
      dismissed_at: null 
    });
    res.json({ success: true, message: 'Notification restored' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to restore notification' });
  }
});

module.exports = router;