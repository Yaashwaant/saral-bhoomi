import express from 'express';
const router = express.Router();

// Get MongoDB connection from app
let db;
router.use((req, res, next) => {
  db = req.app.locals.db;
  next();
});

// GET /api/districts - Get all unique districts
router.get('/', async (req, res) => {
  try {
    const districts = await db.collection('districts').find({}).toArray();
    
    // If no districts collection exists, get unique districts from JMR records
    if (districts.length === 0) {
      const uniqueDistricts = await db.collection('jmr_records').distinct('district');
      const districtList = uniqueDistricts.filter(d => d).map(name => ({ name }));
      res.json(districtList);
    } else {
      res.json(districts);
    }
  } catch (error) {
    console.error('Error fetching districts:', error);
    res.status(500).json({ error: 'Failed to fetch districts from MongoDB' });
  }
});

// POST /api/districts - Create new district
router.post('/', async (req, res) => {
  try {
    const { name, state = 'Maharashtra' } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'District name is required' });
    }

    const newDistrict = {
      name,
      state,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('districts').insertOne(newDistrict);
    const createdDistrict = await db.collection('districts').findOne({ _id: result.insertedId });
    
    res.status(201).json(createdDistrict);
  } catch (error) {
    console.error('Error creating district:', error);
    res.status(500).json({ error: 'Failed to create district in MongoDB' });
  }
});

export default router;