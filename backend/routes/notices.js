import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import MongoLandownerRecord from '../models/mongo/LandownerRecord.js';
import MongoProject from '../models/mongo/Project.js';
import MongoUser from '../models/mongo/User.js';
import { authorize } from '../middleware/auth.js';
import { getCloudinary } from '../services/cloudinaryService.js';
// SMS support is optional; only load Twilio when explicitly enabled

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for notice header upload (in-memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.docx', '.doc', '.pdf'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Only DOCX, DOC, and PDF files are allowed'));
    }
  }
});

// @desc    Generate notices for project landowners
// @route   POST /api/notices/generate/:projectId
// @access  Public (temporarily)
router.post('/generate/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { 
      noticeTemplate, 
      headerContent, 
      customContent,
      targetRecords, // Optional: specific record IDs to generate notices for
      overwrite = false 
    } = req.body;

    // Validate project exists
    const project = await MongoProject.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Build query for landowner records
    let filter = { project_id: projectId };
    if (targetRecords && targetRecords.length > 0) {
      filter._id = { $in: targetRecords };
    }
    
    // If not overwriting, only target records without notices
    if (!overwrite) {
      filter.notice_generated = { $ne: true };
    }

    const records = await MongoLandownerRecord.find(filter);

    if (records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No eligible records found for notice generation'
      });
    }

    const generatedNotices = [];
    const errors = [];
    let noticeCounter = 1;

    // Generate notices for each record
    for (const record of records) {
      try {
        const noticeNumber = `${project.projectName}/NOTICE/${new Date().getFullYear()}/${String(noticeCounter).padStart(4, '0')}`;
        const noticeDate = new Date();

        // Generate notice content based on template
        let noticeContent = '';
        
        if (noticeTemplate === 'standard') {
          noticeContent = generateStandardNoticeContent(record, project, headerContent);
        } else if (noticeTemplate === 'custom' && customContent) {
          noticeContent = generateCustomNoticeContent(record, project, customContent);
        } else {
          noticeContent = generateDefaultNoticeContent(record, project);
        }

        // Update the record with notice information
        await record.updateOne({
          notice_generated: true,
          notice_number: noticeNumber,
          notice_date: noticeDate,
          notice_content: noticeContent
        });

        generatedNotices.push({
          recordId: record._id,
          landownerName: record.landowner_name,
          surveyNumber: record.survey_number,
          noticeNumber,
          noticeDate,
          village: record.village
        });

        noticeCounter++;
      } catch (error) {
        errors.push({
          recordId: record._id,
          landownerName: record.landowner_name,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully generated ${generatedNotices.length} notices`,
      data: {
        projectId,
        generatedNotices,
        noticesGenerated: generatedNotices.length,
        noticesFailed: errors.length,
        errors
      }
    });

  } catch (error) {
    console.error('Generate notices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating notices'
    });
  }
});

// @desc    Get notices for a project
// @route   GET /api/notices/project/:projectId
// @access  Public (temporarily)
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      village, 
      noticeGenerated = true 
    } = req.query;

    // Build filter
    const filter = { 
      project_id: projectId,
      notice_generated: noticeGenerated === 'true'
    };
    if (village) filter.village = village;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const records = await MongoLandownerRecord.find(filter).skip(offset).limit(parseInt(limit)).sort({ notice_date: -1 });

    const total = await MongoLandownerRecord.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: records.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: records
    });

  } catch (error) {
    console.error('Get project notices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notices'
    });
  }
});

// @desc    Get individual notice
// @route   GET /api/notices/:recordId
// @access  Public (temporarily)
router.get('/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;

    const record = await MongoLandownerRecord.findById(recordId, {
      project: 1,
      assigned_agent: 1,
      notice_number: 1,
      notice_date: 1,
      notice_content: 1,
      landowner_name: 1,
      survey_number: 1,
      area: 1,
      compensation: 1,
      village: 1,
      taluka: 1,
      district: 1
    });

    if (!record || !record.notice_generated) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        noticeNumber: record.notice_number,
        noticeDate: record.notice_date,
        noticeContent: record.notice_content,
        landownerName: record.landowner_name,
        surveyNumber: record.survey_number,
        area: record.area,
        compensation: record.compensation,
        village: record.village,
        taluka: record.taluka,
        district: record.district,
        project: record.project,
        assignedAgent: record.assigned_agent
      }
    });

  } catch (error) {
    console.error('Get notice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notice'
    });
  }
});

// @desc    Upload notice header template
// @route   POST /api/notices/upload-header
// @access  Public (temporarily)
router.post('/upload-header', upload.single('headerFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a header file'
      });
    }

    const { version = '1.0', description = '' } = req.body;

    const originalName = req.file.originalname || 'header';
    const fileExt = path.extname(originalName).toLowerCase();
    const safeName = `${Date.now()}-${originalName}`.replace(/[^a-zA-Z0-9._-]/g, '_');
    const mimeType = req.file.mimetype || 'application/octet-stream';

    let finalFileUrl = null;

    // Try Cloudinary first
    try {
      const cloudinary = getCloudinary();
      const base64 = req.file.buffer.toString('base64');
      const dataUri = `data:${mimeType};base64,${base64}`;
      const uploadRes = await cloudinary.uploader.upload(dataUri, {
        public_id: `saral_bhoomi/notices/headers/${safeName}`,
        resource_type: 'auto',
        folder: `saral_bhoomi/notices/headers`
      });
      finalFileUrl = uploadRes.secure_url || uploadRes.url;
    } catch (e) {
      console.warn('Cloudinary header upload failed, falling back to local:', e && (e.message || e));
    }

    // Fallback to local filesystem
    if (!finalFileUrl) {
      const uploadDir = path.join(__dirname, '../uploads/notices');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const absPath = path.join(uploadDir, safeName);
      fs.writeFileSync(absPath, req.file.buffer);
      const publicPath = `/uploads/notices/${encodeURIComponent(safeName)}`;
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      finalFileUrl = `${baseUrl}${publicPath}`;
    }

    const headerInfo = {
      fileName: originalName,
      url: finalFileUrl,
      version,
      description,
      uploadedAt: new Date(),
      uploadedBy: req.user?.id || '674e23a1b8e8c9e8c9e8c9e8',
      isActive: true
    };

    res.status(200).json({
      success: true,
      message: 'Header template uploaded successfully',
      data: headerInfo
    });

  } catch (error) {
    console.error('Upload header error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading header'
    });
  }
});

// @desc    Get notice statistics for project
// @route   GET /api/notices/stats/:projectId
// @access  Public (temporarily)
router.get('/stats/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const records = await MongoLandownerRecord.find({ project_id: projectId });

    const stats = {
      totalRecords: records.length,
      noticesGenerated: records.filter(r => r.notice_generated).length,
      noticesPending: records.filter(r => !r.notice_generated).length
    };

    // Group by village
    const villageMap = {};
    records.forEach(record => {
      const village = record.village;
      if (!villageMap[village]) {
        villageMap[village] = {
          totalRecords: 0,
          noticesGenerated: 0
        };
      }
      villageMap[village].totalRecords++;
      if (record.notice_generated) {
        villageMap[village].noticesGenerated++;
      }
    });

    const villageStats = Object.entries(villageMap)
      .map(([village, stats]) => ({
        _id: village,
        ...stats
      }))
      .sort((a, b) => b.totalRecords - a.totalRecords);

    res.status(200).json({
      success: true,
      data: {
        overview: stats || {
          totalRecords: 0,
          noticesGenerated: 0,
          noticesPending: 0
        },
        byVillage: villageStats
      }
    });

  } catch (error) {
    console.error('Get notice stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notice statistics'
    });
  }
});

// @desc    Save a custom notice (HTML) and optionally update a landowner record
// @route   POST /api/notices/save-custom
// @access  Public (temporarily)
router.post('/save-custom', async (req, res) => {
  try {
    const { projectId, landownerId, noticeNumber, noticeDate, noticeContent } = req.body || {};

    if (!projectId || !noticeContent) {
      return res.status(400).json({ success: false, message: 'projectId and noticeContent are required' });
    }

    // Ensure uploads directory exists
    const uploadDir = path.join(__dirname, '../uploads/notices');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Wrap content in minimal HTML if it does not look like a full HTML document
    const isFullHtml = /<html[\s\S]*<\/html>/i.test(noticeContent);
    const html = isFullHtml
      ? noticeContent
      : `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>\n<title>${(noticeNumber || 'notice')}</title>\n<style>body{font-family:Arial,'Noto Sans',sans-serif;line-height:1.5;color:#111}table{border-collapse:collapse;width:100%}table,th,td{border:1px solid #555}th,td{padding:6px 8px;text-align:left}</style>\n</head>\n<body>${noticeContent}</body>\n</html>`;

    const fileSafeNotice = (noticeNumber || `notice-${Date.now()}`).toString().replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${fileSafeNotice}.html`;
    const absPath = path.join(uploadDir, fileName);
    fs.writeFileSync(absPath, html, 'utf8');

    const publicPath = `/uploads/notices/${encodeURIComponent(fileName)}`;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const finalUrl = `${baseUrl}${publicPath}`;

    // Optionally update an existing landowner record
    if (landownerId) {
      try {
        const record = await MongoLandownerRecord.findById(landownerId);
        if (record) {
          await record.updateOne({
            notice_generated: true,
            notice_number: noticeNumber || record.notice_number || `NOTICE-${Date.now()}`,
            notice_date: noticeDate ? new Date(noticeDate) : new Date(),
            notice_content: html
          });
        }
      } catch (e) {
        // Log but do not fail the request
        console.warn('Failed to update landowner record for custom notice:', e && (e.message || e));
      }
    }

    return res.status(200).json({ success: true, message: 'Notice saved', data: { url: finalUrl, fileName } });
  } catch (error) {
    console.error('Save custom notice error:', error);
    return res.status(500).json({ success: false, message: 'Server error while saving notice' });
  }
});

// @desc    Send notice link via SMS (Twilio)
// @route   POST /api/notices/send-sms
// @access  Public (temporarily)
router.post('/send-sms', async (req, res) => {
  try {
    const ENABLE_SMS = String(process.env.ENABLE_SMS || '').toLowerCase() === 'true';
    if (!ENABLE_SMS) {
      return res.status(501).json({ success: false, message: 'SMS disabled. Set ENABLE_SMS=true and install twilio to enable.' });
    }

    const { toNumbers = [], body, link } = req.body || {};
    if (!Array.isArray(toNumbers) || toNumbers.length === 0) {
      return res.status(400).json({ success: false, message: 'toNumbers array is required' });
    }
    const msg = `${body || 'सूचना'} ${link ? `\n${link}` : ''}`.trim();

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKey = process.env.TWILIO_API_KEY_SID;
    const apiSecret = process.env.TWILIO_API_KEY_SECRET;
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

    if (!accountSid || !apiKey || !apiSecret || !messagingServiceSid) {
      return res.status(500).json({ success: false, message: 'Twilio env vars missing' });
    }

    // Lazy import Twilio to avoid hard dependency when SMS is disabled
    let client;
    try {
      const twilio = (await import('twilio')).default;
      client = twilio(apiKey, apiSecret, { accountSid });
    } catch (e) {
      return res.status(501).json({ success: false, message: "Twilio SDK not installed. Run 'npm i twilio' in backend and restart." });
    }
    const results = [];
    for (const raw of toNumbers) {
      const to = String(raw).trim();
      if (!to) continue;
      try {
        const resp = await client.messages.create({ to, body: msg, messagingServiceSid });
        results.push({ to, sid: resp.sid, status: resp.status });
      } catch (e) {
        results.push({ to, error: e && (e.message || String(e)) });
      }
    }
    return res.status(200).json({ success: true, data: { results } });
  } catch (error) {
    console.error('Send SMS error:', error);
    return res.status(500).json({ success: false, message: 'Server error while sending SMS' });
  }
});

// Helper function to generate standard notice content
function generateStandardNoticeContent(record, project, headerContent = '') {
  const currentDate = new Date().toLocaleDateString('hi-IN');
  
  return `${headerContent}

नोटीस क्रमांक: ${record.notice_number || 'TBG'}
दिनांक: ${currentDate}

प्रति,
श्री/श्रीमती ${record.landowner_name}
गाव: ${record.village}
तालुका: ${record.taluka}
जिल्हा: ${record.district}

विषय: ${project.projectName} - भूमि संपादन नोटीस

महोदय/महोदया,

आपल्याला कळवण्यात येत आहे की, ${project.projectName} या प्रकल्पासाठी आपली खालील जमीन संपादनासाठी निवडण्यात आली आहे:

सर्वे नंबर: ${record.survey_number}
क्षेत्रफळ: ${record.area}
संपादित क्षेत्रफळ: ${record.acquired_area}
मोबदला: ₹${record.compensation}

कृपया आवश्यक कागदपत्रे घेऊन नजीकच्या कार्यालयात संपर्क साधावा.

आवश्यक कागदपत्रे:
1. जमिनीचा ७/१२ उतारा
2. ओळखपत्राच्या प्रती
3. बँक पासबुकची प्रत
4. इतर संबंधित कागदपत्रे

धन्यवाद,

प्राधिकृत अधिकारी
${project.location?.district || ''} जिल्हा
`;
}

// Helper function to generate custom notice content
function generateCustomNoticeContent(record, project, customTemplate) {
  return customTemplate
    .replace(/\{landowner_name\}/g, record.landowner_name)
    .replace(/\{survey_number\}/g, record.survey_number)
    .replace(/\{area\}/g, record.area)
    .replace(/\{acquired_area\}/g, record.acquired_area)
    .replace(/\{compensation\}/g, record.compensation)
    .replace(/\{village\}/g, record.village)
    .replace(/\{taluka\}/g, record.taluka)
    .replace(/\{district\}/g, record.district)
    .replace(/\{project_name\}/g, project.projectName)
    .replace(/\{pmis_code\}/g, project.pmisCode)
    .replace(/\{current_date\}/g, new Date().toLocaleDateString('hi-IN'));
}

// Helper function to generate default notice content
function generateDefaultNoticeContent(record, project) {
  return generateStandardNoticeContent(record, project);
}

export default router;