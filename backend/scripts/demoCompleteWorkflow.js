import { User, Project, JMRRecord, Award, Notice, Payment, BlockchainLedger } from '../models/index.js';
import { sequelize } from '../config/database.js';
import workflowService from '../services/workflowService.js';
import { generateHashFromCloudinaryUrl } from '../services/cloudinaryService.js';

/**
 * Complete Workflow Demo Script
 * Demonstrates the entire land records workflow from JMR to Payment with Cloudinary integration
 */
async function demoCompleteWorkflow() {
  try {
    console.log('🚀 Starting Complete Workflow Demo...\n');

    // Step 1: Create demo project
    console.log('📋 Step 1: Creating demo project...');
    const project = await Project.create({
      name: 'Demo Land Acquisition Project',
      description: 'Complete workflow demonstration project',
      status: 'Active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      budget: 10000000, // 1 crore
      location: 'Demo District, Demo State',
      createdBy: 1
    });
    console.log(`✅ Project created: ${project.name} (ID: ${project.id})\n`);

    // Step 2: Create demo officer
    console.log('👤 Step 2: Creating demo officer...');
    const officer = await User.create({
      name: 'Demo Workflow Officer',
      email: 'workflow.officer@saral.gov.in',
      phone: '+91-9876543210',
      role: 'officer',
      department: 'Land Acquisition',
      district: 'Demo District',
      taluka: 'Demo Taluka',
      isActive: true,
      password: 'demo123' // In production, this should be hashed
    });
    console.log(`✅ Officer created: ${officer.name} (ID: ${officer.id})\n`);

    // Step 3: Create JMR Record
    console.log('📏 Step 3: Creating JMR Record...');
    const jmrData = {
      survey_number: 'SY-2024-WORKFLOW-001',
      project_id: project.id,
      landowner_id: 'OWN-WORKFLOW-001',
      measured_area: '5.5',
      land_type: 'Agricultural',
      tribal_classification: false,
      category: 'Residential',
      village: 'Demo Village',
      taluka: 'Demo Taluka',
      district: 'Demo District',
      officer_id: officer.id,
      notes: 'Demo JMR for complete workflow testing'
    };

    const jmr = await JMRRecord.create(jmrData);
    console.log(`✅ JMR Record created: Survey ${jmr.survey_number} (ID: ${jmr.id})\n`);

    // Step 4: Process JMR to Award
    console.log('🏆 Step 4: Processing JMR to Award...');
    const awardData = {
      survey_number: jmr.survey_number,
      project_id: project.id,
      landowner_id: jmr.landowner_id,
      landowner_name: 'Demo Landowner',
      award_number: 'AWD-WORKFLOW-001',
      award_date: new Date(),
      base_amount: 500000,
      solatium: 100000,
      additional_amounts: {
        'tree_compensation': 25000,
        'structure_compensation': 75000
      },
      village: jmr.village,
      taluka: jmr.taluka,
      district: jmr.district,
      land_type: jmr.land_type,
      tribal_classification: jmr.tribal_classification,
      category: jmr.category,
      measured_area: jmr.measured_area,
      notes: 'Demo award for complete workflow testing'
    };

    const awardResult = await workflowService.processJMRToAward(awardData, officer.id);
    console.log(`✅ Award created: ${awardResult.award.award_id}\n`);

    // Step 5: Process Award to Notice
    console.log('📢 Step 5: Processing Award to Notice...');
    const noticeData = {
      survey_number: jmr.survey_number,
      project_id: project.id,
      landowner_name: awardData.landowner_name,
      amount: awardResult.award.total_amount,
      notice_date: new Date(),
      village: jmr.village,
      taluka: jmr.taluka,
      district: jmr.district,
      land_type: jmr.land_type,
      tribal_classification: jmr.tribal_classification,
      objection_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      notice_type: 'Acquisition',
      description: 'Demo notice for complete workflow testing'
    };

    const noticeResult = await workflowService.processAwardToNotice(noticeData, officer.id);
    console.log(`✅ Notice created: ${noticeResult.notice.notice_id}\n`);

    // Step 6: Simulate Document Upload (Notice to Documents)
    console.log('📄 Step 6: Simulating Document Upload...');
    const documentData = {
      survey_number: jmr.survey_number,
      description: 'Demo documents uploaded for workflow testing',
      attachments: [
        {
          cloudinary_url: 'https://res.cloudinary.com/demo/image/upload/v1234567890/saral-bhoomi/workflow/documents/demo-doc-1.pdf',
          public_id: 'saral-bhoomi/workflow/documents/demo-doc-1',
          original_filename: 'demo-document-1.pdf',
          file_size: 1024000,
          mimetype: 'application/pdf',
          document_hash: await generateHashFromCloudinaryUrl(
            'https://res.cloudinary.com/demo/image/upload/v1234567890/saral-bhoomi/workflow/documents/demo-doc-1.pdf',
            `${jmr.survey_number}-demo-document-1.pdf-1024000`
          ),
          upload_timestamp: new Date().toISOString()
        },
        {
          cloudinary_url: 'https://res.cloudinary.com/demo/image/upload/v1234567890/saral-bhoomi/workflow/documents/demo-doc-2.jpg',
          public_id: 'saral-bhoomi/workflow/documents/demo-doc-2',
          original_filename: 'demo-document-2.jpg',
          file_size: 512000,
          mimetype: 'image/jpeg',
          document_hash: await generateHashFromCloudinaryUrl(
            'https://res.cloudinary.com/demo/image/upload/v1234567890/saral-bhoomi/workflow/documents/demo-doc-2.jpg',
            `${jmr.survey_number}-demo-document-2.jpg-512000`
          ),
          upload_timestamp: new Date().toISOString()
        }
      ]
    };

    const documentResult = await workflowService.processNoticeToDocumentUpload(documentData, officer.id);
    console.log(`✅ Documents uploaded: ${documentResult.data.attachments.length} files`);
    console.log(`📋 Document hash: ${documentResult.document_hash}\n`);

    // Step 7: Process Notice to Payment Slip
    console.log('💳 Step 7: Processing Notice to Payment Slip...');
    const paymentData = {
      survey_number: jmr.survey_number,
      project_id: project.id,
      amount: noticeResult.notice.amount,
      reason_if_pending: 'Awaiting final approval',
      payment_date: new Date(),
      payment_method: 'Bank Transfer',
      bank_details: {
        'account_number': '1234567890',
        'ifsc_code': 'DEMO0001234',
        'bank_name': 'Demo Bank'
      },
      notes: 'Demo payment slip for complete workflow testing'
    };

    const paymentResult = await workflowService.processNoticeToPaymentSlip(paymentData, officer.id);
    console.log(`✅ Payment slip created: ${paymentResult.payment.payment_id}\n`);

    // Step 8: Process Payment Release
    console.log('💰 Step 8: Processing Payment Release...');
    const releaseData = {
      survey_number: jmr.survey_number,
      utr_number: 'UTR' + Date.now() + Math.floor(Math.random() * 1000),
      notes: 'Demo payment released successfully for workflow testing'
    };

    const releaseResult = await workflowService.processPaymentRelease(releaseData, officer.id);
    console.log(`✅ Payment released: UTR ${releaseData.utr_number}\n`);

    // Step 9: Display Complete Workflow Status
    console.log('📊 Step 9: Complete Workflow Status...');
    const workflowStatus = await workflowService.getWorkflowStatus(jmr.survey_number);
    
    console.log(`\n🏁 COMPLETE WORKFLOW STATUS FOR SURVEY: ${workflowStatus.survey_number}`);
    console.log('=' .repeat(60));
    
    console.log(`📏 JMR Status: ${workflowStatus.workflow.jmr?.status || 'Not Started'}`);
    console.log(`🏆 Award Status: ${workflowStatus.workflow.award?.status || 'Not Started'}`);
    console.log(`📢 Notice Status: ${workflowStatus.workflow.notice?.status || 'Not Started'}`);
    console.log(`💳 Payment Status: ${workflowStatus.workflow.payment?.status || 'Not Started'}`);
    
    console.log(`\n🔗 Blockchain Events: ${workflowStatus.blockchain_entries.length}`);
    workflowStatus.blockchain_entries.forEach((entry, index) => {
      console.log(`  ${index + 1}. ${entry.event_type} - ${new Date(entry.timestamp).toLocaleString()} - Valid: ${entry.is_valid}`);
    });

    // Step 10: Verify Blockchain Integrity
    console.log('\n🔍 Step 10: Verifying Blockchain Integrity...');
    const blockchainEntries = await BlockchainLedger.findAll({
      where: { survey_number: jmr.survey_number },
      order: [['timestamp', 'ASC']]
    });

    let isValid = true;
    let previousHash = '0'.repeat(64);

    for (const entry of blockchainEntries) {
      const calculatedHash = entry.calculateHash();
      if (calculatedHash !== entry.current_hash) {
        console.log(`❌ Invalid hash for entry ${entry.id}: ${entry.event_type}`);
        isValid = false;
      } else {
        console.log(`✅ Valid hash for entry ${entry.id}: ${entry.event_type}`);
      }
      previousHash = entry.current_hash;
    }

    console.log(`\n🔐 Blockchain Integrity: ${isValid ? '✅ VALID' : '❌ COMPROMISED'}`);

    // Step 11: Summary
    console.log('\n📋 WORKFLOW DEMO SUMMARY');
    console.log('=' .repeat(40));
    console.log(`Project: ${project.name}`);
    console.log(`Survey Number: ${jmr.survey_number}`);
    console.log(`Officer: ${officer.name}`);
    console.log(`Total Amount: ₹${awardResult.award.total_amount.toLocaleString()}`);
    console.log(`Documents Uploaded: ${documentData.attachments.length}`);
    console.log(`Blockchain Entries: ${blockchainEntries.length}`);
    console.log(`Final Status: COMPLETED ✅`);

    console.log('\n🎉 Complete Workflow Demo finished successfully!');
    console.log('All stages from JMR to Payment have been processed with blockchain integration.');
    console.log('Documents are stored on Cloudinary with blockchain-verified hashes.');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  demoCompleteWorkflow();
}

export default demoCompleteWorkflow;
