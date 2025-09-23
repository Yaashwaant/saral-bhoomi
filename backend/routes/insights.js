import express from 'express';
import { authorize } from '../middleware/auth.js';
import { getOverviewKPIs } from '../services/insightsService.js';

const router = express.Router();

// All insights require officer/admin and return only aggregates
router.get('/overview-kpis', authorize(['officer', 'admin']), async (req, res) => {
  try {
    const filters = {
      projectId: req.query.projectId,
      district: req.query.district,
      taluka: req.query.taluka,
      village: req.query.village,
      from: req.query.from,
      to: req.query.to,
      paymentStatus: req.query.paymentStatus,
      isTribal: req.query.isTribal === 'true' ? true : req.query.isTribal === 'false' ? false : undefined
    };
    const data = await getOverviewKPIs(filters);
    res.json({ success: true, data });
  } catch (e) {
    console.error('Insights overview-kpis error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;


