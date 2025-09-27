import express from 'express';
import Web3 from 'web3';
import { authMiddleware, authorize } from '../middleware/auth.js';
import LandRecordArtifact from '../../contracts/artifacts/contracts/LandRecord.sol/LandRecord.json' with { type: 'json' };

const router = express.Router();
const LandRecordABI = LandRecordArtifact.abi;

const web3 = new Web3(process.env.POLYGON_RPC_URL || 'https://polygon-amoy.drpc.org');
const landRecord = new web3.eth.Contract(LandRecordABI, process.env.LAND_RECORD_CONTRACT_ADDRESS);

// PUT /api/landRecords/:id/authorised
router.put('/:id/authorised', authorize(['officer','admin']), async (req,res)=>{
  const {id} = req.params;
  const {field, oldVal, newVal} = req.body;

  try {
    // 1. send blockchain tx
    const tx = await landRecord.methods
          .authorisedUpdate(web3.utils.keccak256(id), field, oldVal, newVal)
          .send({from: process.env.OFFICER_ADDRESS, gas:100000});

    // 2. update Mongo so UI sees new value immediately
    const db = req.app.locals.db;
    await db.collection('landRecords').updateOne(
        {_id:id},
        {$set:{[field]:newVal, lastAuthorisedChange:new Date()}}
    );

    res.json({success:true, txHash:tx.transactionHash});
  } catch(e){ 
    console.error(e); 
    res.status(500).json({success:false, message:e.message}); 
  }
});

export default router;