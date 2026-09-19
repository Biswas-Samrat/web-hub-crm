const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getClients,
  createClient,
  getClient,
  updateClient,
  updateStatus,
  updateFollowUp,
  addActivity,
  updateDemo,
  updateProject,
  convertToProject,
  archiveClient,
  deleteClient,
  exportCSV,
  importCSV,
} = require('../controllers/clientController');

// All routes require authentication
router.use(protect);

// Export/Import (before :id routes to avoid conflicts)
router.get('/export/csv', exportCSV);
router.post('/import/csv', importCSV);

// CRUD
router.get('/', getClients);
router.post('/', createClient);
router.get('/:id', getClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

// Sub-resources
router.patch('/:id/status', updateStatus);
router.patch('/:id/follow-up', updateFollowUp);
router.patch('/:id/archive', archiveClient);
router.post('/:id/activities', addActivity);
router.patch('/:id/demo', updateDemo);
router.patch('/:id/project', updateProject);
router.post('/:id/convert', convertToProject);

module.exports = router;
