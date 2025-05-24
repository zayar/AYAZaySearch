const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// Basic search endpoint
router.post('/search', searchController.search);

// Generate answer endpoint
router.post('/answer', searchController.generateAnswer);

// Combined search with answer endpoint
router.post('/search-with-answer', searchController.searchWithAnswer);

// Autocomplete endpoint
router.post('/autocomplete', searchController.autocomplete);

module.exports = router; 