import express from 'express';
import JMRRecord from '../models/JMRRecord.js';

const router = express.Router();

// Create/Upsert JMR (single)
router.post('/', async (req, res) => {
  try {
    const { project_id, landowner_id, survey_number, measured_area, category, date_of_measurement, notes } = req.body;
    if (!project_id || !landowner_id || !survey_number) {
      return res.status(400).json({ success: false, message: 'project_id, landowner_id, survey_number required' });
    }
    const jmr = await JMRRecord.create({ project_id, landowner_id, survey_number, measured_area, category, date_of_measurement, notes });
    res.json({ success: true, data: jmr });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to save JMR' });
  }
});

// List JMR by project
router.get('/:projectId', async (req, res) => {
  try {
    const rows = await JMRRecord.findAll({ where: { project_id: req.params.projectId }, order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch JMR' });
  }
});

export default router;


