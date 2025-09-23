import express from 'express';
import MongoJMRRecord from '../models/mongo/JMRRecord.js';

const router = express.Router();

// Create/Upsert JMR (single)
router.post('/', async (req, res) => {
  try {
    const { project_id, officer_id, survey_number, measured_area, category, measurement_date, notes } = req.body;
    if (!survey_number) {
      return res.status(400).json({ success: false, message: 'survey_number required' });
    }
    
    const jmr = new MongoJMRRecord({
      project_id,
      officer_id,
      survey_number,
      measured_area,
      category,
      measurement_date: measurement_date || new Date(),
      notes
    });
    
    await jmr.save();
    res.json({ success: true, data: {
      id: jmr._id,
      survey_number: jmr.survey_number,
      project_id: jmr.project_id,
      officer_id: jmr.officer_id,
      measured_area: jmr.measured_area,
      category: jmr.category,
      measurement_date: jmr.measurement_date,
      notes: jmr.notes,
      status: jmr.status,
      created_at: jmr.createdAt,
      updated_at: jmr.updatedAt
    }});
  } catch (e) {
    console.error('JMR creation error:', e);
    res.status(500).json({ success: false, message: 'Failed to save JMR' });
  }
});

// List JMR by project
router.get('/:projectId', async (req, res) => {
  try {
    const rows = await MongoJMRRecord.find({ project_id: req.params.projectId })
      .sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      data: rows.map(jmr => ({
        id: jmr._id,
        survey_number: jmr.survey_number,
        project_id: jmr.project_id,
        officer_id: jmr.officer_id,
        measured_area: jmr.measured_area,
        category: jmr.category,
        measurement_date: jmr.measurement_date,
        notes: jmr.notes,
        status: jmr.status,
        created_at: jmr.createdAt,
        updated_at: jmr.updatedAt
      }))
    });
  } catch (e) {
    console.error('JMR fetch error:', e);
    res.status(500).json({ success: false, message: 'Failed to fetch JMR' });
  }
});

export default router;


