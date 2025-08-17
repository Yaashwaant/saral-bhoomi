import express from 'express';
import MongoAward from '../models/mongo/Award.js';

const router = express.Router();

// Create/Upsert Award (single)
router.post('/', async (req, res) => {
  try {
    const { project_id, officer_id, survey_number, award_number, award_date, base_amount, solatium, additional_amounts, total_amount, notes } = req.body;
    if (!survey_number) {
      return res.status(400).json({ success: false, message: 'survey_number required' });
    }
    
    const award = new MongoAward({
      project_id,
      officer_id,
      survey_number,
      award_number: award_number || `AWD-${Date.now()}`,
      award_date: award_date || new Date(),
      base_amount,
      solatium,
      additional_amounts,
      total_amount,
      notes
    });
    
    await award.save();
    res.json({ success: true, data: {
      id: award._id,
      survey_number: award.survey_number,
      project_id: award.project_id,
      officer_id: award.officer_id,
      award_number: award.award_number,
      award_date: award.award_date,
      base_amount: award.base_amount,
      solatium: award.solatium,
      additional_amounts: award.additional_amounts,
      total_amount: award.total_amount,
      award_status: award.award_status,
      notes: award.notes,
      created_at: award.createdAt,
      updated_at: award.updatedAt
    }});
  } catch (e) {
    console.error('Award creation error:', e);
    res.status(500).json({ success: false, message: 'Failed to save Award' });
  }
});

// List Awards by project
router.get('/:projectId', async (req, res) => {
  try {
    const rows = await MongoAward.find({ project_id: req.params.projectId })
      .sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      data: rows.map(award => ({
        id: award._id,
        survey_number: award.survey_number,
        project_id: award.project_id,
        officer_id: award.officer_id,
        award_number: award.award_number,
        award_date: award.award_date,
        base_amount: award.base_amount,
        solatium: award.solatium,
        additional_amounts: award.additional_amounts,
        total_amount: award.total_amount,
        award_status: award.award_status,
        notes: award.notes,
        created_at: award.createdAt,
        updated_at: award.updatedAt
      }))
    });
  } catch (e) {
    console.error('Award fetch error:', e);
    res.status(500).json({ success: false, message: 'Failed to fetch Awards' });
  }
});

export default router;


