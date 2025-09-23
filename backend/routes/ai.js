import express from 'express';
import { authorize } from '../middleware/auth.js';
import { getOverviewKPIs } from '../services/insightsService.js';
import { chatUsingLiveInsights } from '../services/openaiService.js';

const router = express.Router();

// Privacy-safe AI: only uses aggregates from insightsService
router.post('/chat', authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { question, projectId, district, taluka, from, to } = req.body || {};
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ success: false, message: 'question is required' });
    }
    const { answer, aggregates, filters } = await chatUsingLiveInsights(question, { projectId, district, taluka, from, to }, getOverviewKPIs);
    res.json({ success: true, answer, aggregates, filters });
  } catch (e) {
    console.error('AI chat error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;


