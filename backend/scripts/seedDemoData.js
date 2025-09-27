import { User, Project, JMRRecord, Award, Notice, Payment, BlockchainLedger } from '../models/index.js';
import sequelize from '../config/database.js';
import DynamicWorkflowService from '../services/dynamicWorkflowService.js';

/**
 * Comprehensive Demo Data Seeding Script
 * Creates demo data for all models with proper validation
 */
async function seedDemoData() {
  try {
    console.log('🚀 Starting Comprehensive Demo Data Seeding...\n');

    // Step 1: Get or create required users
    console.log('👥 Step 1: Setting up users...');
    
    // Check if admin user exists, if not create one
    let admin = await User.findOne({ where: { role: 'admin' } });
    if (!admin) {
      console.log('Creating admin user...');
      admin = await User.create({
        name: 'Admin User',
        email: 'admin@saral.gov.in',
        password: 'admin123',
        role: 'admin',
        department: 'Administration',
        phone: '9876543210',
        language: 'marathi'
      });
      console.log(`✅ Admin user created: ${admin.name}`);
    } else {
      console.log(`✅ Admin user found: ${admin.name}`);
    }
    
    const officer = await User.findOne({ where: { role: 'officer' } });
    const agent = await User.findOne({ where: { role: 'agent' } });

    if (!officer || !agent) {
      console.log('❌ Required officer and agent users not found.');
      return;
    }

    console.log(`✅ Found users: ${admin.name}, ${officer.name}, ${agent.name}\n`);

    // Step 2: Create demo project with all required fields
    console.log('📋 Step 2: Creating demo project...');
    
    // Check if project already exists
    let project = await Project.findOne({ where: { projectNumber: 'PMIS-2024-DEMO-001' } });
    if (!project) {
      project = await Project.create({
        projectName: 'Demo Land Acquisition Project - Phase 1',
        projectNumber: 'PMIS-2024-DEMO-001',
        schemeName: 'National Highway Development Scheme',
        landRequired: 25.50,
        landAvailable: 20.00,
        landToBeAcquired: 5.50,
        type: 'greenfield',
        district: 'Pune',
        taluka: 'Haveli',
        villages: ['Hadapsar', 'Kharadi', 'Viman Nagar'],
        estimatedCost: 15000000.00,
        allocatedBudget: 20000000.00,
        startDate: new Date('2024-01-01'),
        expectedCompletion: new Date('2025-12-31'),
        description: 'Demo project for testing land acquisition workflow',
        createdBy: admin.id,
        assignedOfficers: [officer.id],
        assignedAgents: [agent.id]
      });
      console.log(`✅ Project created: ${project.projectName} (ID: ${project.id})\n`);
    } else {
      console.log(`✅ Project already exists: ${project.projectName} (ID: ${project.id})\n`);
    }

    // Step 3: Create demo JMR Record
    console.log('📏 Step 3: Creating demo JMR Record...');
    
    // Check if JMR already exists
    let jmr = await JMRRecord.findOne({ where: { survey_number: 'SY-2024-DEMO-001' } });
    if (!jmr) {
      // Create basic JMR data - let the dynamic service fill missing fields
      const basicJMRData = {
        survey_number: 'SY-2024-DEMO-001',
        project_id: project.id,
        landowner_id: 'OWN-DEMO-001',
        officer_id: officer.id,
        status: 'completed',
        notes: 'Demo JMR for testing workflow'
      };
      
      // Enhance with dynamic data from landowner_records
      const enhancedJMRData = await DynamicWorkflowService.enhanceJMRRecord(basicJMRData);
      
      jmr = await JMRRecord.create(enhancedJMRData);
      console.log(`✅ JMR Record created: Survey ${jmr.survey_number} (ID: ${jmr.id})\n`);
    } else {
      console.log(`✅ JMR Record already exists: Survey ${jmr.survey_number} (ID: ${jmr.id})\n`);
    }

    // Step 4: Create demo Award
    console.log('🏆 Step 4: Creating demo Award...');
    
    // Check if Award already exists
    let award = await Award.findOne({ where: { award_id: 'AWD-DEMO-001' } });
    if (!award) {
      // Create basic Award data - let the dynamic service fill missing fields
      const basicAwardData = {
        award_id: 'AWD-DEMO-001',
        survey_number: jmr.survey_number,
        project_id: project.id,
        landowner_id: jmr.landowner_id,
        award_number: 'AWD-2024-001',
        award_date: new Date(),
        status: 'Draft',
        officer_id: officer.id,
        unit: 'Hectares',
        jmr_reference: jmr.survey_number,
        base_amount: 500000.00,
        solatium: 100000.00,
        additional_amounts: {
          'tree_compensation': 25000.00,
          'structure_compensation': 75000.00
        },
        total_amount: 700000.00,
        notes: 'Demo award for testing workflow'
      };
      
      // Enhance with dynamic data from JMR and landowner_records
      const enhancedAwardData = await DynamicWorkflowService.enhanceAward(basicAwardData, jmr);
      
      award = await Award.create(enhancedAwardData);
      console.log(`✅ Award created: ${award.award_id} (ID: ${award.id})\n`);
    } else {
      console.log(`✅ Award already exists: ${award.award_id} (ID: ${award.id})\n`);
    }

    // Step 5: Create demo Notice
    console.log('📢 Step 5: Creating demo Notice...');
    
    // Check if Notice already exists
    let notice = await Notice.findOne({ where: { notice_id: 'NOT-DEMO-001' } });
    if (!notice) {
      // Create basic Notice data - let the dynamic service fill missing fields
      const basicNoticeData = {
        notice_id: 'NOT-DEMO-001',
        survey_number: jmr.survey_number,
        project_id: project.id,
        notice_date: new Date(),
        objection_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        notice_type: 'Acquisition',
        description: 'Demo notice for testing workflow',
        status: 'draft',
        officer_id: officer.id
      };
      
      // Enhance with dynamic data from JMR, Award, and landowner_records
      const enhancedNoticeData = await DynamicWorkflowService.enhanceNotice(basicNoticeData, jmr, award);
      
      notice = await Notice.create(enhancedNoticeData);
      console.log(`✅ Notice created: ${notice.notice_id} (ID: ${notice.id})\n`);
    } else {
      console.log(`✅ Notice already exists: ${notice.notice_id} (ID: ${notice.id})\n`);
    }

    // Step 6: Create demo Payment
    console.log('💳 Step 6: Creating demo Payment...');
    
    // Check if Payment already exists
    let payment = await Payment.findOne({ where: { payment_id: 'PAY-DEMO-001' } });
    if (!payment) {
      // Create basic Payment data - let the dynamic service fill missing fields
      const basicPaymentData = {
        payment_id: 'PAY-DEMO-001',
        survey_number: jmr.survey_number,
        notice_id: notice.notice_id,
        project_id: project.id,
        reason_if_pending: 'Awaiting final approval',
        payment_date: new Date(),
        status: 'Pending',
        officer_id: officer.id,
        notes: 'Demo payment for testing workflow'
      };
      
      // Enhance with dynamic data from Notice and landowner_records
      const enhancedPaymentData = await DynamicWorkflowService.enhancePayment(basicPaymentData, notice);
      
      payment = await Payment.create(enhancedPaymentData);
      console.log(`✅ Payment created: ${payment.payment_id} (ID: ${payment.id})\n`);
    } else {
      console.log(`✅ Payment already exists: ${payment.payment_id} (ID: ${payment.id})\n`);
    }

    // Step 7: Create demo Blockchain Ledger entries
    console.log('🔗 Step 7: Creating demo Blockchain Ledger entries...');
    const blockchainEntries = [];
    
    // JMR Entry
    const jmrEntry = await BlockchainLedger.create({
      block_id: 'BLK-JMR-' + Date.now() + '-001',
      survey_number: jmr.survey_number,
      event_type: 'JMR_Measurement_Uploaded',
      timestamp: jmr.createdAt,
      previous_hash: '0'.repeat(64),
      current_hash: 'demo_hash_jmr_' + Date.now(),
      nonce: 1,
      officer_id: officer.id,
      project_id: project.id,
      metadata: {
        'jmr_id': jmr.id,
        'measured_area': jmr.measured_area,
        'land_type': jmr.land_type
      }
    });
    blockchainEntries.push(jmrEntry);

    // Award Entry
    const awardEntry = await BlockchainLedger.create({
      block_id: 'BLK-AWARD-' + Date.now() + '-002',
      survey_number: jmr.survey_number,
      event_type: 'Award_Declared',
      timestamp: award.createdAt,
      previous_hash: jmrEntry.current_hash,
      current_hash: 'demo_hash_award_' + Date.now(),
      nonce: 2,
      officer_id: officer.id,
      project_id: project.id,
      metadata: {
        'award_id': award.id,
        'total_amount': award.total_amount
      }
    });
    blockchainEntries.push(awardEntry);

    // Notice Entry
    const noticeEntry = await BlockchainLedger.create({
      block_id: 'BLK-NOTICE-' + Date.now() + '-003',
      survey_number: jmr.survey_number,
      event_type: 'Notice_Generated',
      timestamp: notice.createdAt,
      previous_hash: awardEntry.current_hash,
      current_hash: 'demo_hash_notice_' + Date.now(),
      nonce: 3,
      officer_id: officer.id,
      project_id: project.id,
      metadata: {
        'notice_id': notice.id,
        'amount': notice.amount
      }
    });
    blockchainEntries.push(noticeEntry);

    // Payment Entry
    const paymentEntry = await BlockchainLedger.create({
      block_id: 'BLK-PAYMENT-' + Date.now() + '-004',
      survey_number: jmr.survey_number,
      event_type: 'Payment_Slip_Created',
      timestamp: payment.createdAt,
      previous_hash: noticeEntry.current_hash,
      current_hash: 'demo_hash_payment_' + Date.now(),
      nonce: 4,
      officer_id: officer.id,
      project_id: project.id,
      metadata: {
        'payment_id': payment.id,
        'amount': payment.amount
      }
    });
    blockchainEntries.push(paymentEntry);

    console.log(`✅ Blockchain entries created: ${blockchainEntries.length} entries\n`);

    // Step 8: Display Summary
    console.log('📊 DEMO DATA SEEDING SUMMARY');
    console.log('=' .repeat(50));
    console.log(`Project: ${project.projectName}`);
    console.log(`Survey Number: ${jmr.survey_number}`);
    console.log(`Landowner: ${jmr.landowner_name}`);
    console.log(`JMR Status: ${jmr.status}`);
    console.log(`Award Status: ${award.status}`);
    console.log(`Notice Status: ${notice.status}`);
    console.log(`Payment Status: ${payment.status}`);
    console.log(`Total Amount: ₹${award.total_amount.toLocaleString()}`);
    console.log(`Blockchain Entries: ${blockchainEntries.length}`);
    console.log(`\n🎉 Demo data seeding completed successfully!`);

    // Step 9: Test database queries
    console.log('\n🔍 Step 9: Testing database queries...');
    
    // Test JMR query
    const jmrCount = await JMRRecord.count();
    console.log(`✅ JMR Records count: ${jmrCount}`);
    
    // Test Award query
    const awardCount = await Award.count();
    console.log(`✅ Awards count: ${awardCount}`);
    
    // Test Notice query
    const noticeCount = await Notice.count();
    console.log(`✅ Notices count: ${noticeCount}`);
    
    // Test Payment query
    const paymentCount = await Payment.count();
    console.log(`✅ Payments count: ${paymentCount}`);
    
    // Test Blockchain query
    const blockchainCount = await BlockchainLedger.count();
    console.log(`✅ Blockchain entries count: ${blockchainCount}`);

    console.log('\n🎯 All database queries working correctly!');

  } catch (error) {
    console.error('❌ Demo data seeding failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the seeding function
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDemoData();
}

export default seedDemoData;
