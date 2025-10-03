import express from 'express';
import { authorize } from '../middleware/auth.js';
import CompleteEnglishLandownerRecord from '../models/mongo/CompleteEnglishLandownerRecord.js';

const router = express.Router();

// Return dropdown options for district/taluka/village based on current selection
// GET /api/filters/locations?projectId=&district=&taluka=
router.get('/locations', authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { projectId, district, taluka } = req.query;
    const baseQuery = {};
    if (projectId) baseQuery.project_id = projectId;
    if (district) baseQuery.district = district;
    if (taluka) baseQuery.taluka = taluka;

    // Distinct values with optional filters applied
    const [districts, talukas, villages] = await Promise.all([
      CompleteEnglishLandownerRecord.distinct('district', projectId ? { project_id: projectId } : {}),
      CompleteEnglishLandownerRecord.distinct('taluka', projectId || district ? { project_id: projectId, ...(district ? { district } : {}) } : {}),
      CompleteEnglishLandownerRecord.distinct('village', baseQuery)
    ]);

    const clean = (arr) => (arr || []).filter(Boolean).map(String).sort((a, b) => a.localeCompare(b));

    res.json({
      success: true,
      data: {
        districts: clean(districts),
        talukas: clean(talukas),
        villages: clean(villages)
      }
    });
  } catch (e) {
    console.error('filters/locations error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;


