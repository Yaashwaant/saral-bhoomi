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

// @desc    Get landowner record ObjectIds by project from English collection
// @route   GET /api/landowners2-english/:projectId/ids
// @access  Public (for now)
router.get('/:projectId/ids', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format. Must be a valid MongoDB ObjectId.'
      });
    }
    
    // Validate project exists
    const project = await MongoProject.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Query just the ObjectIds for efficiency
    const records = await CompleteEnglishLandownerRecord.find({ 
      project_id: new mongoose.Types.ObjectId(projectId),
      is_active: true 
    })
    .select('_id')
    .sort({ serial_number: 1 });

    // Extract just the ObjectIds as strings
    const landRecordIds = records.map(record => record._id.toString());

    res.status(200).json({
      success: true,
      count: landRecordIds.length,
      project: {
        id: project._id,
        name: project.projectName,
        projectNumber: project.projectNumber,
        code: project.code
      },
      landRecordIds: landRecordIds
    });
  } catch (error) {
    console.error('Error fetching landowner record IDs by project:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching landowner record IDs',
      error: error.message
    });
  }
});

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
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format. Must be a valid MongoDB ObjectId.'
      });
    }
    
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
      .populate('project_id', 'name code projectName projectNumber')
      .sort({ serial_number: 1 });

    // Extract just the ObjectIds for the response
    const landRecordIds = records.map(record => record._id);

    res.status(200).json({
      success: true,
      count: records.length,
      project: {
        id: project._id,
        name: project.projectName,
        projectNumber: project.projectNumber,
        code: project.code
      },
      landRecordIds: landRecordIds,
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
      message: 'Error fetching landowner records',
      error: error.message
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

// @desc    Generate notice for a specific landowner record
// @route   POST /api/landowners2-english/generate-notice
// @access  Private
router.post('/generate-notice', authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { 
      recordId, 
      project_id, 
      survey_number, 
      noticeTemplate = 'enhanced',
      customContent,
      headerContent = ''
    } = req.body;

    let record;
    
    // Find record by ID or by comprehensive uniqueness criteria
    if (recordId) {
      record = await CompleteEnglishLandownerRecord.findById(recordId);
    } else if (project_id && survey_number) {
      // Build comprehensive search query using proper uniqueness criteria
      const searchQuery = {
        project_id: project_id,
        $or: [
          { old_survey_number: survey_number },
          { new_survey_number: survey_number }
        ]
      };
      
      // Add additional uniqueness criteria if provided
      if (req.body.village) {
        searchQuery.village = req.body.village;
      }
      if (req.body.area) {
        searchQuery.acquired_land_area = req.body.area;
      }
      if (req.body.landowner_name) {
        // Use case-insensitive regex for name matching
        searchQuery.$or = [
          { owner_name: { $regex: new RegExp(`^${req.body.landowner_name}$`, 'i') } },
          { landowner_name: { $regex: new RegExp(`^${req.body.landowner_name}$`, 'i') } }
        ];
      }
      
      // Try to find the most specific match first
      record = await CompleteEnglishLandownerRecord.findOne(searchQuery);
      
      // If no exact match found with all criteria, try with just survey number + project + landowner name
      if (!record && req.body.landowner_name) {
        const fallbackQuery = {
          project_id: project_id,
          $or: [
            { old_survey_number: survey_number },
            { new_survey_number: survey_number }
          ],
          $or: [
            { owner_name: { $regex: new RegExp(`^${req.body.landowner_name}$`, 'i') } },
            { landowner_name: { $regex: new RegExp(`^${req.body.landowner_name}$`, 'i') } }
          ]
        };
        record = await CompleteEnglishLandownerRecord.findOne(fallbackQuery);
      }
    }

    if (!record) {
      const searchCriteria = [];
      if (survey_number) searchCriteria.push(`survey number: ${survey_number}`);
      if (req.body.landowner_name) searchCriteria.push(`landowner name: ${req.body.landowner_name}`);
      if (req.body.village) searchCriteria.push(`village: ${req.body.village}`);
      if (req.body.area) searchCriteria.push(`acquired area: ${req.body.area}`);
      
      return res.status(404).json({
        success: false,
        message: `Landowner record not found for project ${project_id} with ${searchCriteria.join(', ')}. Multiple records may exist with the same survey number - please ensure all identifying fields are provided.`
      });
    }

    // Get project details
    const project = await MongoProject.findById(record.project_id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Generate notice number
    const currentYear = new Date().getFullYear();
    const noticeCount = await CompleteEnglishLandownerRecord.countDocuments({
      project_id: record.project_id,
      notice_generated: true
    });
    const noticeNumber = `${project.projectName}/NOTICE/${currentYear}/${String(noticeCount + 1).padStart(4, '0')}`;

    // Generate notice content based on template
    let noticeContent = '';
    
    if (noticeTemplate === 'enhanced') {
      noticeContent = generateEnhancedNoticeContent(record, project, headerContent);
    } else if (noticeTemplate === 'custom' && customContent) {
      noticeContent = generateCustomEnglishNoticeContent(record, project, customContent);
    } else {
      noticeContent = generateStandardEnglishNoticeContent(record, project, headerContent);
    }

    // Update record with notice information
    const updatedRecord = await CompleteEnglishLandownerRecord.findByIdAndUpdate(
      record._id,
      {
        notice_generated: true,
        notice_number: noticeNumber,
        notice_date: new Date(),
        notice_content: noticeContent,
        updated_at: new Date()
      },
      { new: true }
    );

    // Add timeline event (if timeline system exists)
    const timelineEvent = {
      event_type: 'notice_generated',
      description: `Notice generated: ${noticeNumber}`,
      timestamp: new Date(),
      user_id: req.user?.id,
      metadata: {
        notice_number: noticeNumber,
        template_type: noticeTemplate
      }
    };

    res.status(200).json({
      success: true,
      message: 'Notice generated successfully',
      data: {
        record: updatedRecord,
        notice_number: noticeNumber,
        notice_content: noticeContent,
        timeline_event: timelineEvent
      }
    });

  } catch (error) {
    console.error('Error generating notice for English record:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating notice',
      error: error.message
    });
  }
});

// Helper function to generate enhanced notice content with detailed compensation
function generateEnhancedNoticeContent(record, project, headerContent = '') {
  const currentDate = new Date().toLocaleDateString('hi-IN');
  
  return `${headerContent}

नोटीस क्रमांक: ${record.notice_number || 'TBG'}
दिनांक: ${currentDate}

प्रति,
श्री/श्रीमती ${record.owner_name}
गाव: ${record.village}
तालुका: ${record.taluka}
जिल्हा: ${record.district}

विषय: ${project.projectName} - भूमि संपादन मोबदला वितरण नोटीस

महोदय/महोदया,

आपल्याला कळवण्यात येत आहे की, ${project.projectName} या प्रकल्पासाठी आपली खालील जमीन संपादनासाठी निवडण्यात आली आहे:

जमीन तपशील:
सर्वे नंबर: ${record.old_survey_number || record.new_survey_number}
७/१२ नुसार क्षेत्रफळ: ${record.land_area_as_per_7_12} हेक्टर
संपादित क्षेत्रफळ: ${record.acquired_land_area} हेक्टर
जमिनीचा प्रकार: ${record.land_type || 'N/A'}
वर्गीकरण: ${record.land_classification || 'N/A'}

मोबदला तपशील:
मंजूर दर प्रति हेक्टर: ₹${record.approved_rate_per_hectare || 0}
बाजार मूल्य: ₹${record.market_value_as_per_acquired_area || 0}
कलम २६ नुसार भूमि मोबदला: ₹${record.land_compensation_as_per_section_26 || 0}

मालमत्ता मोबदला:
बांधकामे: ₹${record.structures || 0}
फळझाडे: ₹${record.fruit_trees || 0}
वनझाडे: ₹${record.forest_trees || 0}
विहिरी/बोअरवेल: ₹${record.wells_borewells || 0}
एकूण मालमत्ता मोबदला: ₹${record.total_structures_amount || 0}

अंतिम मोबदला गणना:
सोलेशियम रक्कम: ₹${record.solatium_amount || 0}
निर्धारित मोबदला (कलम २६): ₹${record.determined_compensation_26 || 0}
वाढीव मोबदला (२५%): ₹${record.enhanced_compensation_25_percent || 0}
एकूण मोबदला (कलम २६-२७): ₹${record.total_compensation_26_27 || 0}
कपात रक्कम: ₹${record.deduction_amount || 0}
अंतिम देय रक्कम: ₹${record.final_payable_compensation || 0}

वितरण स्थिती: ${record.compensation_distribution_status || 'प्रलंबित'}

कृपया आवश्यक कागदपत्रे घेऊन नजीकच्या कार्यालयात संपर्क साधावा.

आवश्यक कागदपत्रे:
1. जमिनीचा ७/१२ उतारा
2. ओळखपत्राच्या प्रती
3. बँक पासबुकची प्रत
4. मालकी हक्काचे कागदपत्रे
5. इतर संबंधित कागदपत्रे

धन्यवाद,

प्राधिकृत अधिकारी
${project.location?.district || record.district} जिल्हा
`;
}

// Helper function to generate standard notice content for English collection
function generateStandardEnglishNoticeContent(record, project, headerContent = '') {
  const currentDate = new Date().toLocaleDateString('hi-IN');
  
  return `${headerContent}

नोटीस क्रमांक: ${record.notice_number || 'TBG'}
दिनांक: ${currentDate}

प्रति,
श्री/श्रीमती ${record.owner_name}
गाव: ${record.village}
तालुका: ${record.taluka}
जिल्हा: ${record.district}

विषय: ${project.projectName} - भूमि संपादन नोटीस

महोदय/महोदया,

आपल्याला कळवण्यात येत आहे की, ${project.projectName} या प्रकल्पासाठी आपली खालील जमीन संपादनासाठी निवडण्यात आली आहे:

सर्वे नंबर: ${record.old_survey_number || record.new_survey_number}
क्षेत्रफळ: ${record.land_area_as_per_7_12} हेक्टर
संपादित क्षेत्रफळ: ${record.acquired_land_area} हेक्टर
अंतिम मोबदला: ₹${record.final_payable_compensation || 0}

कृपया आवश्यक कागदपत्रे घेऊन नजीकच्या कार्यालयात संपर्क साधावा.

धन्यवाद,

प्राधिकृत अधिकारी
${project.location?.district || record.district} जिल्हा
`;
}

// Helper function to generate custom notice content for English collection
function generateCustomEnglishNoticeContent(record, project, customTemplate) {
  return customTemplate
    .replace(/\{owner_name\}/g, record.owner_name || '')
    .replace(/\{landowner_name\}/g, record.owner_name || '') // Backward compatibility
    .replace(/\{old_survey_number\}/g, record.old_survey_number || '')
    .replace(/\{new_survey_number\}/g, record.new_survey_number || '')
    .replace(/\{survey_number\}/g, record.old_survey_number || record.new_survey_number || '') // Backward compatibility
    .replace(/\{land_area_as_per_7_12\}/g, record.land_area_as_per_7_12 || 0)
    .replace(/\{acquired_land_area\}/g, record.acquired_land_area || 0)
    .replace(/\{area\}/g, record.land_area_as_per_7_12 || 0) // Backward compatibility
    .replace(/\{acquired_area\}/g, record.acquired_land_area || 0) // Backward compatibility
    .replace(/\{final_payable_compensation\}/g, record.final_payable_compensation || 0)
    .replace(/\{compensation\}/g, record.final_payable_compensation || 0) // Backward compatibility
    .replace(/\{land_compensation_as_per_section_26\}/g, record.land_compensation_as_per_section_26 || 0)
    .replace(/\{total_compensation_26_27\}/g, record.total_compensation_26_27 || 0)
    .replace(/\{structures\}/g, record.structures || 0)
    .replace(/\{fruit_trees\}/g, record.fruit_trees || 0)
    .replace(/\{forest_trees\}/g, record.forest_trees || 0)
    .replace(/\{wells_borewells\}/g, record.wells_borewells || 0)
    .replace(/\{solatium_amount\}/g, record.solatium_amount || 0)
    .replace(/\{enhanced_compensation_25_percent\}/g, record.enhanced_compensation_25_percent || 0)
    .replace(/\{deduction_amount\}/g, record.deduction_amount || 0)
    .replace(/\{village\}/g, record.village || '')
    .replace(/\{taluka\}/g, record.taluka || '')
    .replace(/\{district\}/g, record.district || '')
    .replace(/\{land_type\}/g, record.land_type || '')
    .replace(/\{land_classification\}/g, record.land_classification || '')
    .replace(/\{compensation_distribution_status\}/g, record.compensation_distribution_status || '')
    .replace(/\{project_name\}/g, project.projectName || '')
    .replace(/\{current_date\}/g, new Date().toLocaleDateString('hi-IN'));
}

export default router;