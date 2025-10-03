import express from 'express';
import mongoose from 'mongoose';
import CompleteEnglishLandownerRecord from '../models/mongo/CompleteEnglishLandownerRecord.js';
import MongoProject from '../models/mongo/Project.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Generate comprehensive notice for English Complete collection
// @route   POST /api/landowners-english-complete/generate-notice
// @access  Private
router.post('/generate-notice', authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { 
      recordId, 
      project_id, 
      survey_number, 
      landowner_name,
      noticeTemplate = 'enhanced',
      customContent,
      headerContent = ''
    } = req.body;

    // Validate required parameters
    if (!recordId && (!project_id || !survey_number)) {
      return res.status(400).json({
        success: false,
        message: 'Either recordId or both project_id and survey_number are required'
      });
    }

    // Validate notice template
    const validTemplates = ['enhanced', 'standard', 'custom'];
    if (!validTemplates.includes(noticeTemplate)) {
      return res.status(400).json({
        success: false,
        message: `Invalid notice template. Valid templates are: ${validTemplates.join(', ')}`
      });
    }

    // Validate custom content for custom template
    if (noticeTemplate === 'custom' && !customContent) {
      return res.status(400).json({
        success: false,
        message: 'Custom content is required when using custom template'
      });
    }

    let record;
    
    // Find record by ID or by project_id + survey_number
    if (recordId) {
      record = await CompleteEnglishLandownerRecord.findById(recordId);
      if (!record) {
        return res.status(404).json({
          success: false,
          message: `Landowner record not found with ID: ${recordId}`
        });
      }
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
      if (landowner_name) {
        // Use case-insensitive regex for name matching
        // Escape special regex characters in the landowner name
        const escapedLandownerName = landowner_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        console.log('DEBUG: Searching for landowner name with escaped regex:', escapedLandownerName);
        console.log('DEBUG: Original landowner name:', landowner_name);
        searchQuery.$or = [
          { owner_name: { $regex: `^${escapedLandownerName}$`, $options: 'i' } },
          { landowner_name: { $regex: `^${escapedLandownerName}$`, $options: 'i' } }
        ];
      }
      
      // Try to find the most specific match first
      console.log('DEBUG: Search query:', JSON.stringify(searchQuery, null, 2));
      record = await CompleteEnglishLandownerRecord.findOne(searchQuery);
      
      // If no exact match found with all criteria, try with just survey number + project + landowner name
      if (!record && landowner_name) {
        // Escape special regex characters in the landowner name
        const escapedLandownerName = landowner_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const fallbackQuery = {
          project_id: project_id,
          $or: [
            { old_survey_number: survey_number },
            { new_survey_number: survey_number }
          ],
          $or: [
            { owner_name: { $regex: `^${escapedLandownerName}$`, $options: 'i' } },
            { landowner_name: { $regex: `^${escapedLandownerName}$`, $options: 'i' } }
          ]
        };
        record = await CompleteEnglishLandownerRecord.findOne(fallbackQuery);
      }
      
      // If still no match, return comprehensive error message
      if (!record) {
        const searchCriteria = [];
        if (survey_number) searchCriteria.push(`survey number: ${survey_number}`);
        if (landowner_name) searchCriteria.push(`landowner name: ${landowner_name}`);
        if (req.body.village) searchCriteria.push(`village: ${req.body.village}`);
        if (req.body.area) searchCriteria.push(`acquired area: ${req.body.area}`);
        
        return res.status(404).json({
          success: false,
          message: `Landowner record not found for project ${project_id} with ${searchCriteria.join(', ')}. Multiple records may exist with the same survey number - please ensure all identifying fields are provided.`
        });
      }
    }

    // Validate record has required fields for notice generation
    const requiredFields = ['owner_name', 'village', 'taluka', 'district'];
    const missingFields = requiredFields.filter(field => !record[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields in record: ${missingFields.join(', ')}`
      });
    }

    // Get project details
    const project = await MongoProject.findById(record.project_id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project not found with ID: ${record.project_id}`
      });
    }

    // Generate notice number
    let noticeNumber;
    try {
      const currentYear = new Date().getFullYear();
      const noticeCount = await CompleteEnglishLandownerRecord.countDocuments({
        project_id: record.project_id,
        notice_generated: true
      });
      noticeNumber = `${project.projectName}/NOTICE/${currentYear}/${String(noticeCount + 1).padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating notice number:', error);
      noticeNumber = `${project.projectName}/NOTICE/${new Date().getFullYear()}/TEMP`;
    }

    // Generate notice content based on template
    let noticeContent = '';
    
    try {
      if (noticeTemplate === 'enhanced') {
        noticeContent = generateComprehensiveEnhancedNotice(record, project, headerContent);
      } else if (noticeTemplate === 'custom' && customContent) {
        noticeContent = generateCustomComprehensiveNotice(record, project, customContent);
      } else {
        noticeContent = generateStandardComprehensiveNotice(record, project, headerContent);
      }
      
      if (!noticeContent || noticeContent.trim() === '') {
        return res.status(500).json({
          success: false,
          message: 'Failed to generate notice content'
        });
      }
    } catch (error) {
      console.error('Error generating notice content:', error);
      return res.status(500).json({
        success: false,
        message: 'Error generating notice content',
        error: error.message
      });
    }

    // Update record with notice information
    let updatedRecord;
    try {
      updatedRecord = await CompleteEnglishLandownerRecord.findByIdAndUpdate(
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
      
      if (!updatedRecord) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update record with notice information'
        });
      }
    } catch (error) {
      console.error('Error updating record with notice information:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating record with notice information',
        error: error.message
      });
    }

    // Add timeline event (if timeline system exists)
    const timelineEvent = {
      event_type: 'notice_generated',
      description: `Notice generated: ${noticeNumber}`,
      timestamp: new Date(),
      user_id: req.user?.id,
      metadata: {
        notice_number: noticeNumber,
        template_type: noticeTemplate,
        collection: 'english_complete'
      }
    };

    res.status(200).json({
      success: true,
      message: 'Notice generated successfully from English Complete collection',
      data: {
        record: updatedRecord,
        notice_number: noticeNumber,
        notice_content: noticeContent,
        timeline_event: timelineEvent
      }
    });

  } catch (error) {
    console.error('Error generating notice for English Complete record:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating notice',
      error: error.message
    });
  }
});

// Comprehensive enhanced notice generation with proper field mapping
function generateComprehensiveEnhancedNotice(record, project, headerContent = '') {
  try {
    // Validate required parameters
    if (!record || !project) {
      throw new Error('Record and project are required for notice generation');
    }

    const currentDate = new Date().toLocaleDateString('hi-IN');
    
    // Map English Complete fields to notice template variables with validation
    const noticeData = {
      notice_number: record.notice_number || 'TBG',
      current_date: currentDate,
      owner_name: record.owner_name || record.landowner_name || '',
      village: record.village || '',
      taluka: record.taluka || '',
      district: record.district || '',
      project_name: project.projectName || '',
      survey_number: record.old_survey_number || record.new_survey_number || '',
      land_area_as_per_7_12: record.land_area_as_per_7_12 || 0,
      acquired_land_area: record.acquired_land_area || 0,
      land_type: record.land_type || 'N/A',
      land_classification: record.land_classification || 'N/A',
      approved_rate_per_hectare: record.approved_rate_per_hectare || 0,
      market_value_as_per_acquired_area: record.market_value_as_per_acquired_area || 0,
      land_compensation_as_per_section_26: record.land_compensation_as_per_section_26 || 0,
      structures: record.structures || 0,
      fruit_trees: record.fruit_trees || 0,
      forest_trees: record.forest_trees || 0,
      wells_borewells: record.wells_borewells || 0,
      total_structures_amount: record.total_structures_amount || 0,
      solatium_amount: record.solatium_amount || 0,
      determined_compensation_26: record.determined_compensation_26 || 0,
      enhanced_compensation_25_percent: record.enhanced_compensation_25_percent || 0,
      total_compensation_26_27: record.total_compensation_26_27 || 0,
      deduction_amount: record.deduction_amount || 0,
      final_payable_compensation: record.final_payable_compensation || 0,
      compensation_distribution_status: record.compensation_distribution_status || 'प्रलंबित'
    };

    // Validate critical fields
    if (!noticeData.owner_name || !noticeData.village || !noticeData.survey_number) {
      throw new Error('Missing critical fields: owner_name, village, or survey_number');
    }

  return `${headerContent}

नोटीस क्रमांक: ${noticeData.notice_number}
दिनांक: ${noticeData.current_date}

प्रति,
श्री/श्रीमती ${noticeData.owner_name}
गाव: ${noticeData.village}
तालुका: ${noticeData.taluka}
जिल्हा: ${noticeData.district}

विषय: ${noticeData.project_name} - भूमि संपादन मोबदला वितरण नोटीस

महोदय/महोदया,

आपल्याला कळवण्यात येत आहे की, ${noticeData.project_name} या प्रकल्पासाठी आपली खालील जमीन संपादनासाठी निवडण्यात आली आहे:

जमीन तपशील:
सर्वे नंबर: ${noticeData.survey_number}
७/१२ नुसार क्षेत्रफळ: ${noticeData.land_area_as_per_7_12} हेक्टर
संपादित क्षेत्रफळ: ${noticeData.acquired_land_area} हेक्टर
जमिनीचा प्रकार: ${noticeData.land_type}
वर्गीकरण: ${noticeData.land_classification}

मोबदला तपशील:
मंजूर दर प्रति हेक्टर: ₹${noticeData.approved_rate_per_hectare}
बाजार मूल्य: ₹${noticeData.market_value_as_per_acquired_area}
कलम २६ नुसार भूमि मोबदला: ₹${noticeData.land_compensation_as_per_section_26}

मालमत्ता मोबदला:
बांधकामे: ₹${noticeData.structures}
फळझाडे: ₹${noticeData.fruit_trees}
वनझाडे: ₹${noticeData.forest_trees}
विहिरी/बोअरवेल: ₹${noticeData.wells_borewells}
एकूण मालमत्ता मोबदला: ₹${noticeData.total_structures_amount}

अंतिम मोबदला गणना:
सोलेशियम रक्कम: ₹${noticeData.solatium_amount}
निर्धारित मोबदला (कलम २६): ₹${noticeData.determined_compensation_26}
वाढीव मोबदला (२५%): ₹${noticeData.enhanced_compensation_25_percent}
एकूण मोबदला (कलम २६-२७): ₹${noticeData.total_compensation_26_27}
कपात रक्कम: ₹${noticeData.deduction_amount}
अंतिम देय रक्कम: ₹${noticeData.final_payable_compensation}

वितरण स्थिती: ${noticeData.compensation_distribution_status}

कृपया आवश्यक कागदपत्रे घेऊन नजीकच्या कार्यालयात संपर्क साधावा.

आवश्यक कागदपत्रे:
1. जमिनीचा ७/१२ उतारा
2. ओळखपत्राच्या प्रती
3. बँक पासबुकची प्रत
4. मालकी हक्काचे कागदपत्रे
5. इतर संबंधित कागदपत्रे

धन्यवाद,

प्राधिकृत अधिकारी
${noticeData.district} जिल्हा
`;
  } catch (error) {
    console.error('Error in generateStandardComprehensiveNotice:', error);
    throw new Error(`Failed to generate standard notice: ${error.message}`);
  }
}

// Custom comprehensive notice generation with template replacement
function generateCustomComprehensiveNotice(record, project, customTemplate) {
  try {
    // Validate required parameters
    if (!record || !project) {
      throw new Error('Record and project are required for notice generation');
    }

    if (!customTemplate || typeof customTemplate !== 'string') {
      throw new Error('Valid custom template is required');
    }

    // Map English Complete fields to template variables
    const noticeData = {
      owner_name: record.owner_name || record.landowner_name || '',
      landowner_name: record.owner_name || record.landowner_name || '', // Backward compatibility
      old_survey_number: record.old_survey_number || '',
      new_survey_number: record.new_survey_number || '',
      survey_number: record.old_survey_number || record.new_survey_number || '', // Backward compatibility
      land_area_as_per_7_12: record.land_area_as_per_7_12 || 0,
      acquired_land_area: record.acquired_land_area || 0,
      area: record.land_area_as_per_7_12 || 0, // Backward compatibility
      acquired_area: record.acquired_land_area || 0, // Backward compatibility
      final_payable_compensation: record.final_payable_compensation || 0,
      compensation: record.final_payable_compensation || 0, // Backward compatibility
      land_compensation_as_per_section_26: record.land_compensation_as_per_section_26 || 0,
      total_compensation_26_27: record.total_compensation_26_27 || 0,
      structures: record.structures || 0,
      fruit_trees: record.fruit_trees || 0,
      forest_trees: record.forest_trees || 0,
      wells_borewells: record.wells_borewells || 0,
      solatium_amount: record.solatium_amount || 0,
      enhanced_compensation_25_percent: record.enhanced_compensation_25_percent || 0,
      deduction_amount: record.deduction_amount || 0,
      village: record.village || '',
      taluka: record.taluka || '',
      district: record.district || '',
      land_type: record.land_type || '',
      land_classification: record.land_classification || '',
      compensation_distribution_status: record.compensation_distribution_status || '',
      project_name: project.projectName || '',
      current_date: new Date().toLocaleDateString('hi-IN')
    };

    // Validate critical fields
    if (!noticeData.owner_name || !noticeData.village || !noticeData.survey_number) {
      throw new Error('Missing critical fields: owner_name, village, or survey_number');
    }

    return customTemplate
      .replace(/\{owner_name\}/g, noticeData.owner_name)
      .replace(/\{landowner_name\}/g, noticeData.landowner_name)
      .replace(/\{old_survey_number\}/g, noticeData.old_survey_number)
      .replace(/\{new_survey_number\}/g, noticeData.new_survey_number)
      .replace(/\{survey_number\}/g, noticeData.survey_number)
      .replace(/\{land_area_as_per_7_12\}/g, noticeData.land_area_as_per_7_12)
      .replace(/\{acquired_land_area\}/g, noticeData.acquired_land_area)
      .replace(/\{area\}/g, noticeData.area)
      .replace(/\{acquired_area\}/g, noticeData.acquired_area)
      .replace(/\{final_payable_compensation\}/g, noticeData.final_payable_compensation)
      .replace(/\{compensation\}/g, noticeData.compensation)
      .replace(/\{land_compensation_as_per_section_26\}/g, noticeData.land_compensation_as_per_section_26)
      .replace(/\{total_compensation_26_27\}/g, noticeData.total_compensation_26_27)
      .replace(/\{structures\}/g, noticeData.structures)
      .replace(/\{fruit_trees\}/g, noticeData.fruit_trees)
      .replace(/\{forest_trees\}/g, noticeData.forest_trees)
      .replace(/\{wells_borewells\}/g, noticeData.wells_borewells)
      .replace(/\{solatium_amount\}/g, noticeData.solatium_amount)
      .replace(/\{enhanced_compensation_25_percent\}/g, noticeData.enhanced_compensation_25_percent)
      .replace(/\{deduction_amount\}/g, noticeData.deduction_amount)
      .replace(/\{village\}/g, noticeData.village)
      .replace(/\{taluka\}/g, noticeData.taluka)
      .replace(/\{district\}/g, noticeData.district)
      .replace(/\{land_type\}/g, noticeData.land_type)
      .replace(/\{land_classification\}/g, noticeData.land_classification)
      .replace(/\{compensation_distribution_status\}/g, noticeData.compensation_distribution_status)
      .replace(/\{project_name\}/g, noticeData.project_name)
      .replace(/\{current_date\}/g, noticeData.current_date);
  } catch (error) {
    console.error('Error in generateCustomComprehensiveNotice:', error);
    throw new Error(`Failed to generate custom notice: ${error.message}`);
  }
}

export default router;