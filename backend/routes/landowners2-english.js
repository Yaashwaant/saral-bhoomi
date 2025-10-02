import express from 'express';
import mongoose from 'mongoose';
import CompleteEnglishLandownerRecord from '../models/mongo/CompleteEnglishLandownerRecord.js';
import MongoProject from '../models/mongo/Project.js';
import MongoUser from '../models/mongo/User.js';
import { authorize } from '../middleware/auth.js';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';

const router = express.Router();

// Configure multer for CSV uploads
const upload = multer({ dest: 'uploads/' });

// @desc    Get all landowner records from English collection
// @route   GET /api/landowners2-english/list
// @access  Public (for now)
router.get('/list', async (req, res) => {
  try {
    console.log('English API: Fetching all landowner records...');
    const records = await CompleteEnglishLandownerRecord.find({ is_active: true })
      .populate('created_by', 'name email')
      .populate('project_id', 'name code')
      .sort({ serial_number: 1 });
    console.log(`English API: Found ${records.length} records`);

    res.status(200).json({
      success: true,
      count: records.length,
      records: records.map(record => {
        const plain = record.toObject({ getters: true });
        const createdBy = plain.created_by;
        const project = plain.project_id;
        return {
          id: record._id,
          ...plain,
          created_by: createdBy ? {
            id: createdBy._id,
            name: createdBy.name,
            email: createdBy.email
          } : null,
          project_id: project ? {
            id: project._id,
            name: project.name,
            code: project.code
          } : null
        };
      })
    });
  } catch (error) {
    console.error('Error fetching English landowner records:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error fetching landowner records',
      error: error.message
    });
  }
});

// @desc    Get landowner records by project from English collection
// @route   GET /api/landowners2-english/:projectId
// @access  Public (for now)
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Validate project exists
    const project = await MongoProject.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Query with ObjectId project_id
    const records = await CompleteEnglishLandownerRecord.find({ 
      project_id: new mongoose.Types.ObjectId(projectId),
      is_active: true 
    })
      .populate('created_by', 'name email')
      .populate('project_id', 'name code')
      .sort({ serial_number: 1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records.map(record => {
        const plain = record.toObject({ getters: true });
        const createdBy = plain.created_by;
        const project = plain.project_id;
        return {
          id: record._id,
          ...plain,
          created_by: createdBy ? {
            id: createdBy._id,
            name: createdBy.name,
            email: createdBy.email
          } : null,
          project_id: project ? {
            id: project._id,
            name: project.name,
            code: project.code
          } : null
        };
      })
    });
  } catch (error) {
    console.error('Error fetching English landowner records by project:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching landowner records'
    });
  }
});

// @desc    Create new landowner record in English collection
// @route   POST /api/landowners2-english
// @access  Private
router.post('/', authorize(['officer', 'admin']), async (req, res) => {
  try {
    const {
      serial_number,
      owner_name,
      old_survey_number,
      new_survey_number,
      group_number,
      cts_number,
      village,
      taluka,
      district,
      land_area_as_per_7_12,
      acquired_land_area,
      land_type,
      land_classification,
      approved_rate_per_hectare,
      market_value_as_per_acquired_area,
      factor_as_per_section_26_2,
      land_compensation_as_per_section_26,
      structures,
      forest_trees,
      fruit_trees,
      wells_borewells,
      total_structures_amount,
      total_amount_14_23,
      solatium_amount,
      determined_compensation_26,
      enhanced_compensation_25_percent,
      total_compensation_26_27,
      deduction_amount,
      final_payable_compensation,
      remarks,
      compensation_distribution_status,
      project_id,
      created_by
    } = req.body;

    // Validate required fields
    if (!serial_number || !owner_name || !village || !taluka || !district) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: serial_number, owner_name, village, taluka, district'
      });
    }

    // Use default project ID if not provided (ROB project)
    const finalProjectId = project_id || '68da6edf579af093415f639e';

    // Check if serial number already exists for this project
    const existingRecord = await CompleteEnglishLandownerRecord.findOne({ 
      serial_number,
      project_id: finalProjectId 
    });
    
    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: 'Serial number already exists for this project'
      });
    }

    // Validate project exists
    const project = await MongoProject.findById(finalProjectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Create new landowner record with English field names
    const newRecord = new CompleteEnglishLandownerRecord({
      serial_number,
      owner_name,
      old_survey_number,
      new_survey_number,
      group_number,
      cts_number,
      village,
      taluka,
      district,
      land_area_as_per_7_12: parseFloat(land_area_as_per_7_12) || 0,
      acquired_land_area: parseFloat(acquired_land_area) || 0,
      land_type,
      land_classification,
      approved_rate_per_hectare: parseFloat(approved_rate_per_hectare) || 0,
      market_value_as_per_acquired_area: parseFloat(market_value_as_per_acquired_area) || 0,
      factor_as_per_section_26_2: parseFloat(factor_as_per_section_26_2) || 1,
      land_compensation_as_per_section_26: parseFloat(land_compensation_as_per_section_26) || 0,
      structures: parseFloat(structures) || 0,
      forest_trees: parseFloat(forest_trees) || 0,
      fruit_trees: parseFloat(fruit_trees) || 0,
      wells_borewells: parseFloat(wells_borewells) || 0,
      total_structures_amount: parseFloat(total_structures_amount) || 0,
      total_amount_14_23: parseFloat(total_amount_14_23) || 0,
      solatium_amount: parseFloat(solatium_amount) || 0,
      determined_compensation_26: parseFloat(determined_compensation_26) || 0,
      enhanced_compensation_25_percent: parseFloat(enhanced_compensation_25_percent) || 0,
      total_compensation_26_27: parseFloat(total_compensation_26_27) || 0,
      deduction_amount: parseFloat(deduction_amount) || 0,
      final_payable_compensation: parseFloat(final_payable_compensation) || 0,
      remarks: remarks || '',
      compensation_distribution_status: compensation_distribution_status || 'PENDING',
      project_id: finalProjectId,
      created_by: created_by || req.user?.id,
      is_active: true
    });

    await newRecord.save();

    // Populate references for response
    await newRecord.populate('created_by', 'name email');
    await newRecord.populate('project_id', 'name code');

    res.status(201).json({
      success: true,
      message: 'Landowner record created successfully',
      data: newRecord
    });
  } catch (error) {
    console.error('Error creating English landowner record:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating landowner record',
      error: error.message
    });
  }
});

// @desc    Update landowner record in English collection
// @route   PUT /api/landowners2-english/:id
// @access  Private
router.put('/:id', authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.created_at;
    delete updateData.created_by;
    
    // Add updated timestamp
    updateData.updated_at = new Date();

    const updatedRecord = await CompleteEnglishLandownerRecord.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('created_by', 'name email')
      .populate('project_id', 'name code');

    if (!updatedRecord) {
      return res.status(404).json({
        success: false,
        message: 'Landowner record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Landowner record updated successfully',
      data: updatedRecord
    });
  } catch (error) {
    console.error('Error updating English landowner record:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating landowner record',
      error: error.message
    });
  }
});

// @desc    Delete landowner record (soft delete)
// @route   DELETE /api/landowners2-english/:id
// @access  Private
router.delete('/:id', authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const updatedRecord = await CompleteEnglishLandownerRecord.findByIdAndUpdate(
      id,
      { is_active: false, updated_at: new Date() },
      { new: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({
        success: false,
        message: 'Landowner record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Landowner record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting English landowner record:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting landowner record'
    });
  }
});

// @desc    Search landowner records
// @route   GET /api/landowners2-english/search
// @access  Public (for now)
router.get('/search', async (req, res) => {
  try {
    const { 
      owner_name, 
      village, 
      taluka, 
      district, 
      serial_number,
      project_id,
      compensation_status 
    } = req.query;

    // Build search query
    const searchQuery = { is_active: true };

    if (owner_name) {
      searchQuery.owner_name = { $regex: owner_name, $options: 'i' };
    }

    if (village) {
      searchQuery.village = { $regex: village, $options: 'i' };
    }

    if (taluka) {
      searchQuery.taluka = { $regex: taluka, $options: 'i' };
    }

    if (district) {
      searchQuery.district = { $regex: district, $options: 'i' };
    }

    if (serial_number) {
      searchQuery.serial_number = isNaN(serial_number) ? 
        { $regex: serial_number, $options: 'i' } : 
        serial_number;
    }

    if (project_id) {
      searchQuery.project_id = new mongoose.Types.ObjectId(project_id);
    }

    if (compensation_status) {
      searchQuery.compensation_distribution_status = compensation_status;
    }

    const records = await CompleteEnglishLandownerRecord.find(searchQuery)
      .populate('created_by', 'name email')
      .populate('project_id', 'name code')
      .sort({ serial_number: 1 })
      .limit(100); // Limit results for performance

    res.status(200).json({
      success: true,
      count: records.length,
      data: records.map(record => {
        const plain = record.toObject({ getters: true });
        const createdBy = plain.created_by;
        const project = plain.project_id;
        return {
          id: record._id,
          ...plain,
          created_by: createdBy ? {
            id: createdBy._id,
            name: createdBy.name,
            email: createdBy.email
          } : null,
          project_id: project ? {
            id: project._id,
            name: project.name,
            code: project.code
          } : null
        };
      })
    });
  } catch (error) {
    console.error('Error searching English landowner records:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching landowner records'
    });
  }
});

// @desc    Get statistics for English landowner records
// @route   GET /api/landowners2-english/stats
// @access  Public (for now)
router.get('/stats', async (req, res) => {
  try {
    const { project_id } = req.query;
    
    const matchStage = { is_active: true };
    if (project_id) {
      matchStage.project_id = new mongoose.Types.ObjectId(project_id);
    }

    const stats = await CompleteEnglishLandownerRecord.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalCompensation: { $sum: '$final_payable_compensation' },
          avgCompensation: { $avg: '$final_payable_compensation' },
          paidRecords: {
            $sum: {
              $cond: [{ $eq: ['$compensation_distribution_status', 'PAID'] }, 1, 0]
            }
          },
          pendingRecords: {
            $sum: {
              $cond: [{ $eq: ['$compensation_distribution_status', 'PENDING'] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || {
        totalRecords: 0,
        totalCompensation: 0,
        avgCompensation: 0,
        paidRecords: 0,
        pendingRecords: 0
      }
    });
  } catch (error) {
    console.error('Error fetching English landowner stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
});

export default router;