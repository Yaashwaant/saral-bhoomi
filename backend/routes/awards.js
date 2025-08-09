import express from 'express';
import Award from '../models/Award.js';

const router = express.Router();

// Create/Upsert Award (single)
router.post('/', async (req, res) => {
  try {
    const { project_id, landowner_id, award_number, award_date, base_amount, solatium, additional_amounts, total_amount, notes } = req.body;
    if (!project_id || !landowner_id) {
      return res.status(400).json({ success: false, message: 'project_id and landowner_id required' });
    }
    const award = await Award.create({ project_id, landowner_id, award_number, award_date, base_amount, solatium, additional_amounts, total_amount, notes });
    res.json({ success: true, data: award });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to save Award' });
  }
});

// List Awards by project
router.get('/:projectId', async (req, res) => {
  try {
    const rows = await Award.findAll({ where: { project_id: req.params.projectId }, order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch Awards' });
  }
});

export default router;


