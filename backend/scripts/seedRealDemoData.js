import { User, Project, JMRRecord, Award, Notice, Payment, BlockchainLedger } from '../models/index.js';
import sequelize from '../config/database.js';
import DynamicWorkflowService from '../services/dynamicWorkflowService.js';

/**
 * Comprehensive script to seed demo data using real survey numbers
 * from the landowner_records table with dynamic workflow enhancement
 */
async function seedRealDemoData() {
  try {
    console.log('🌱 Starting Real Demo Data Seeding...\n');

    // Step 1: Get available survey numbers from landowner_records
    console.log('📋 Step 1: Getting available survey numbers...');
    const surveyNumbers = await sequelize.query(
      'SELECT "सर्वे_नं" as survey_number FROM landowner_records LIMIT 10',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (surveyNumbers.length === 0) {
      console.log('❌ No survey numbers found in landowner_records table');
      return;
    }
    
    console.log(`✅ Found ${surveyNumbers.length} survey numbers:`, surveyNumbers.map(s => s.survey_number));
    console.log('');

    // Step 2: Ensure admin user exists
    console.log('👤 Step 2: Ensuring admin user exists...');
    let admin = await User.findOne({ where: { name: 'admin' } });
    if (!admin) {
      admin = await User.create({
        name: 'admin',
        email: 'admin@saralbhoomi.gov.in',
        password: 'admin123',
        role: 'admin',
        department: 'System Administration',
        phone: '9876543210',
        language: 'english',
        isActive: true
      });
      console.log(`✅ Admin user created: ${admin.name} (ID: ${admin.id})`);
    } else {
      console.log(`✅ Admin user already exists: ${admin.name} (ID: ${admin.id})`);
    }
    console.log('');

    // Step 3: Ensure demo project exists
    console.log('🏗️ Step 3: Ensuring demo project exists...');
    let project = await Project.findOne({ where: { pmisCode: 'DEMO-2024-001' } });
    if (!project) {
      project = await Project.create({
        projectName: 'Demo Land Acquisition Project 2024',
        pmisCode: 'DEMO-2024-001',
        schemeName: 'Demo Land Acquisition Scheme',
        landRequired: 10.0,
        landAvailable: 5.0,
        landToBeAcquired: 5.0,
        type: 'greenfield',
        description: 'Demo project for testing land acquisition workflow',
        district: 'Nagpur',
        taluka: 'Nagpur',
        villages: ['Demo Village 1', 'Demo Village 2'],
        estimatedCost: 10000000,
        allocatedBudget: 10000000,
        currency: 'INR',
        startDate: new Date('2024-01-01'),
        expectedCompletion: new Date('2024-12-31'),
        createdBy: admin.id
      });
      console.log(`✅ Project created: ${project.projectName} (ID: ${project.id})`);
    } else {
      console.log(`✅ Project already exists: ${project.projectName} (ID: ${project.id})`);
    }
    console.log('');

    // Step 4: Create demo data for each survey number
    console.log('📊 Step 4: Creating demo data for each survey number...');
    
    for (let i = 0; i < Math.min(surveyNumbers.length, 5); i++) { // Limit to 5 for demo
      const surveyNumber = surveyNumbers[i].survey_number;
      console.log(`\n🔄 Processing survey: ${surveyNumber}`);
      
      try {
        // Create JMR Record
        let jmr = await JMRRecord.findOne({ where: { survey_number: surveyNumber } });
        if (!jmr) {
          const basicJMRData = {
            survey_number: surveyNumber,
            project_id: project.id,
            landowner_id: `OWN-${surveyNumber.replace(/[^a-zA-Z0-9]/g, '')}-${i + 1}`,
            officer_id: admin.id,
            status: 'completed',
            notes: `Demo JMR for survey ${surveyNumber}`
          };
          
          const enhancedJMRData = await DynamicWorkflowService.enhanceJMRRecord(basicJMRData);
          
          jmr = await JMRRecord.create(enhancedJMRData);
          console.log(`  ✅ JMR Record created: Survey ${jmr.survey_number} (ID: ${jmr.id})`);
        } else {
          console.log(`  ✅ JMR Record already exists: Survey ${jmr.survey_number} (ID: ${jmr.id})`);
        }

        // Create Award
        let award = await Award.findOne({ where: { survey_number: surveyNumber } });
        if (!award) {
          const basicAwardData = {
            award_id: `AWD-${surveyNumber.replace(/[^a-zA-Z0-9]/g, '')}-${i + 1}`,
            survey_number: surveyNumber,
            project_id: project.id,
            landowner_id: jmr.landowner_id,
            award_number: `AWD-2024-${String(i + 1).padStart(3, '0')}`,
            award_date: new Date(),
            status: 'Draft',
            officer_id: admin.id,
            unit: 'Hectares',
            jmr_reference: jmr.survey_number,
            base_amount: 500000.00 + (i * 100000),
            solatium: 200000.00 + (i * 50000),
            additional_amounts: {},
            total_amount: 700000.00 + (i * 150000),
            notes: `Demo award for survey ${surveyNumber}`,
            // Add required fields from JMR record
            measured_area: 2.5, // Default measured area
            land_type: 'Agricultural',
            tribal_classification: false,
            category: 'Residential'
          };
          
          const enhancedAwardData = await DynamicWorkflowService.enhanceAward(basicAwardData, jmr);
          
          award = await Award.create(enhancedAwardData);
          console.log(`  ✅ Award created: ${award.award_id} (ID: ${award.id})`);
        } else {
          console.log(`  ✅ Award already exists: ${award.award_id} (ID: ${award.id})`);
        }

        // Create Notice
        let notice = await Notice.findOne({ where: { survey_number: surveyNumber } });
        if (!notice) {
          const basicNoticeData = {
            notice_id: `NOT-${surveyNumber.replace(/[^a-zA-Z0-9]/g, '')}-${i + 1}`,
            survey_number: surveyNumber,
            project_id: project.id,
            notice_date: new Date(),
            objection_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            notice_type: 'acquisition',
            description: `Demo notice for survey ${surveyNumber}`,
            status: 'draft',
            officer_id: admin.id,
            // Add required fields
            amount: award.total_amount,
            land_type: 'Agricultural'
          };
          
          const enhancedNoticeData = await DynamicWorkflowService.enhanceNotice(basicNoticeData, jmr, award);
          
          notice = await Notice.create(enhancedNoticeData);
          console.log(`  ✅ Notice created: ${notice.notice_id} (ID: ${notice.id})`);
        } else {
          console.log(`  ✅ Notice already exists: ${notice.notice_id} (ID: ${notice.id})`);
        }

        // Create Payment
        let payment = await Payment.findOne({ where: { survey_number: surveyNumber } });
        if (!payment) {
          const basicPaymentData = {
            payment_id: `PAY-${surveyNumber.replace(/[^a-zA-Z0-9]/g, '')}-${i + 1}`,
            survey_number: surveyNumber,
            notice_id: notice.notice_id,
            project_id: project.id,
            reason_if_pending: 'Awaiting final approval',
            payment_date: new Date(),
            status: 'Pending',
            officer_id: admin.id,
            notes: `Demo payment for survey ${surveyNumber}`
          };
          
          const enhancedPaymentData = await DynamicWorkflowService.enhancePayment(basicPaymentData, notice);
          
          payment = await Payment.create(enhancedPaymentData);
          console.log(`  ✅ Payment created: ${payment.payment_id} (ID: ${payment.id})`);
        } else {
          console.log(`  ✅ Payment already exists: ${payment.payment_id} (ID: ${payment.id})`);
        }

        // Create Blockchain Ledger entries
        const blockchainEntries = [];
        
        // JMR Entry
        const jmrEntry = await BlockchainLedger.create({
          block_id: `BLK-JMR-${Date.now()}-${i + 1}`,
          survey_number: surveyNumber,
          event_type: 'JMR_Measurement_Uploaded',
          timestamp: jmr.createdAt,
          previous_hash: '0'.repeat(64),
          current_hash: `demo_hash_jmr_${surveyNumber}_${Date.now()}`,
          nonce: 1,
          officer_id: admin.id,
          project_id: project.id,
          metadata: {
            'jmr_id': jmr.id,
            'survey_number': surveyNumber
          }
        });
        blockchainEntries.push(jmrEntry);

        // Award Entry
        const awardEntry = await BlockchainLedger.create({
          block_id: `BLK-AWD-${Date.now()}-${i + 1}`,
          survey_number: surveyNumber,
          event_type: 'Award_Generated',
          timestamp: award.createdAt,
          previous_hash: jmrEntry.current_hash,
          current_hash: `demo_hash_award_${surveyNumber}_${Date.now()}`,
          nonce: 1,
          officer_id: admin.id,
          project_id: project.id,
          metadata: {
            'award_id': award.id,
            'total_amount': award.total_amount
          }
        });
        blockchainEntries.push(awardEntry);

        // Notice Entry
        const noticeEntry = await BlockchainLedger.create({
          block_id: `BLK-NOT-${Date.now()}-${i + 1}`,
          survey_number: surveyNumber,
          event_type: 'Notice_Generated',
          timestamp: notice.createdAt,
          previous_hash: awardEntry.current_hash,
          current_hash: `demo_hash_notice_${surveyNumber}_${Date.now()}`,
          nonce: 1,
          officer_id: admin.id,
          project_id: project.id,
          metadata: {
            'notice_id': notice.id,
            'notice_type': notice.notice_type
          }
        });
        blockchainEntries.push(noticeEntry);

        // Payment Entry
        const paymentEntry = await BlockchainLedger.create({
          block_id: `BLK-PAY-${Date.now()}-${i + 1}`,
          survey_number: surveyNumber,
          event_type: 'Payment_Initiated',
          timestamp: payment.createdAt,
          previous_hash: noticeEntry.current_hash,
          current_hash: `demo_hash_payment_${surveyNumber}_${Date.now()}`,
          nonce: 1,
          officer_id: admin.id,
          project_id: project.id,
          metadata: {
            'payment_id': payment.id,
            'status': payment.status
          }
        });
        blockchainEntries.push(paymentEntry);

        console.log(`  ✅ Blockchain entries created: ${blockchainEntries.length} entries`);
        
      } catch (error) {
        console.error(`  ❌ Error processing survey ${surveyNumber}:`, error.message);
      }
    }

    console.log('\n🎉 Real Demo Data Seeding Completed Successfully!');
    console.log(`📊 Created demo data for ${Math.min(surveyNumbers.length, 5)} survey numbers`);
    console.log('🔗 All records are linked with blockchain entries for transparency');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedRealDemoData();
}

export default seedRealDemoData;
