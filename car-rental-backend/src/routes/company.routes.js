// src/routes/company.routes.js
const express = require('express');
const router = express.Router();

const { createCompany } = require('../controllers/company.controller');

// Public: Create company for signup (no auth)
router.post('/', createCompany);

module.exports = router;