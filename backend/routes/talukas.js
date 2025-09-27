import express from 'express';
const router = express.Router();

// Get MongoDB connection from app
let db;
router.use((req, res, next) => {
  db = req.app.locals.db;
  next();
});

// GET /api/talukas - Get all unique talukas, optionally filtered by district
router.get('/', async (req, res) => {
  try {
    const { district } = req.query;
    let filter = {};
    
    if (district) {
      filter.district = district;
    }

    const talukas = await db.collection('talukas').find(filter).toArray();
    
    // If no talukas collection exists, get unique talukas from JMR records
    if (talukas.length === 0) {
      let jmrFilter = {};
      if (district) {
        jmrFilter.district = district;
      }
      
      const uniqueTalukas = await db.collection('jmr_records').distinct('taluka', jmrFilter);
      const talukaList = uniqueTalukas.filter(t => t).map(name => ({ name, district }));
      res.json(talukaList);
    } else {
      res.json(talukas);
    }
  } catch (error) {
    console.error('Error fetching talukas:', error);
    res.status(500).json({ error: 'Failed to fetch talukas from MongoDB' });
  }
});

// POST /api/talukas - Create new taluka
router.post('/', async (req, res) => {
  try {
    const { name, district } = req.body;
    
    if (!name || !district) {
      return res.status(400).json({ error: 'Taluka name and district are required' });
    }

    const newTaluka = {
      name,
      district,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('talukas').insertOne(newTaluka);
    const createdTaluka = await db.collection('talukas').findOne({ _id: result.insertedId });
    
    res.status(201).json(createdTaluka);
  } catch (error) {
    console.error('Error creating taluka:', error);
    res.status(500).json({ error: 'Failed to create taluka in MongoDB' });
  }
});

export default router;