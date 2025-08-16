import { 
  User, 
  Project, 
  JMRRecord, 
  Notice, 
  Payment, 
  BlockchainLedger, 
  Officer 
} from '../models/index.js';
import sequelize from '../config/database.js';
import blockchainService from '../services/blockchainService.js';

const seedBlockchainDemo = async () => {
  try {
    console.log('🚀 Starting blockchain demo data seeding...');

    // Create demo projects
    const projects = await Project.bulkCreate([
      {
        name: 'NH-44 Highway Expansion',
        description: 'National Highway 44 expansion project covering 50 km stretch',
        status: 'active',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2026-12-31'),
        budget: 500000000,
        createdBy: 1
      },
      {
        name: 'Metro Rail Phase 2',
        description: 'Metro rail extension project connecting suburban areas',
        status: 'active',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2027-06-30'),
        budget: 800000000,
        createdBy: 1
      },
      {
        name: 'Smart City Infrastructure',
        description: 'Smart city development with modern infrastructure',
        status: 'planning',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2028-12-31'),
        budget: 1200000000,
        createdBy: 1
      }
    ]);

    console.log(`✅ Created ${projects.length} demo projects`);

    // Create demo officers
    const officers = await Officer.bulkCreate([
      {
        officer_id: 'OFF-001',
        name: 'Rajesh Kumar',
        designation: 'Field_Officer',
        district: 'Mumbai',
        taluka: 'Andheri',
        email: 'rajesh.kumar@gov.in',
        phone: '9876543210',
        department: 'Land_Acquisition',
        is_active: true
      },
      {
        officer_id: 'OFF-002',
        name: 'Priya Sharma',
        designation: 'Tehsildar',
        district: 'Mumbai',
        taluka: 'Bandra',
        email: 'priya.sharma@gov.in',
        phone: '9876543211',
        department: 'Land_Acquisition',
        is_active: true
      },
      {
        officer_id: 'OFF-003',
        name: 'Amit Patel',
        designation: 'Deputy_Collector',
        district: 'Mumbai',
        taluka: 'Worli',
        email: 'amit.patel@gov.in',
        phone: '9876543212',
        department: 'Land_Acquisition',
        is_active: true
      }
    ]);

    console.log(`✅ Created ${officers.length} demo officers`);

    // Create demo JMR records
    const jmrRecords = await JMRRecord.bulkCreate([
      {
        survey_number: 'SY-2024-HWY-001',
        project_id: projects[0].id,
        landowner_id: 'OWN-FARMER-001',
        officer_id: officers[0].id,
        measured_area: 5.5,
        land_type: 'Agricultural',
        tribal_classification: false,
        category: 'Farmland',
        village: 'Village Greenfield',
        taluka: 'Taluka North',
        district: 'District North',
        date_of_measurement: new Date('2024-07-15'),
        status: 'approved',
        notes: 'Agricultural land for highway expansion'
      },
      {
        survey_number: 'SY-2024-HWY-002',
        project_id: projects[0].id,
        landowner_id: 'OWN-BUSINESS-001',
        officer_id: officers[0].id,
        measured_area: 2.0,
        land_type: 'Non-Agricultural',
        tribal_classification: false,
        category: 'Commercial',
        village: 'Village Commercial',
        taluka: 'Taluka North',
        district: 'District North',
        date_of_measurement: new Date('2024-07-16'),
        status: 'approved',
        notes: 'Commercial property for highway project'
      },
      {
        survey_number: 'SY-2024-METRO-001',
        project_id: projects[1].id,
        landowner_id: 'OWN-RESIDENTIAL-001',
        officer_id: officers[1].id,
        measured_area: 1.5,
        land_type: 'Non-Agricultural',
        tribal_classification: false,
        category: 'Residential',
        village: 'Village Metro',
        taluka: 'Taluka Central',
        district: 'District Central',
        date_of_measurement: new Date('2024-07-17'),
        status: 'approved',
        notes: 'Residential property for metro project'
      },
      {
        survey_number: 'SY-2024-SMART-001',
        project_id: projects[2].id,
        landowner_id: 'OWN-TRIBAL-001',
        officer_id: officers[2].id,
        measured_area: 8.0,
        land_type: 'Agricultural',
        tribal_classification: true,
        category: 'Tribal Land',
        village: 'Village Tribal',
        taluka: 'Taluka South',
        district: 'District South',
        date_of_measurement: new Date('2024-07-18'),
        status: 'pending',
        notes: 'Tribal agricultural land for smart city'
      }
    ]);

    console.log(`✅ Created ${jmrRecords.length} demo JMR records`);

    // Create demo notices
    const notices = await Notice.bulkCreate([
      {
        notice_id: 'NOTICE-2024-001',
        survey_number: 'SY-2024-HWY-001',
        landowner_name: 'Ramesh Kumar',
        amount: 850000,
        notice_date: new Date('2024-07-20'),
        status: 'sent',
        officer_id: officers[0].id,
        project_id: projects[0].id,
        village: 'Village Greenfield',
        taluka: 'Taluka North',
        district: 'District North',
        land_type: 'Agricultural',
        tribal_classification: false,
        notice_type: 'acquisition',
        description: 'Land acquisition notice for NH-44 highway expansion'
      },
      {
        notice_id: 'NOTICE-2024-002',
        survey_number: 'SY-2024-HWY-002',
        landowner_name: 'Business Corp Ltd',
        amount: 5000000,
        notice_date: new Date('2024-07-21'),
        status: 'sent',
        officer_id: officers[0].id,
        project_id: projects[0].id,
        village: 'Village Commercial',
        taluka: 'Taluka North',
        district: 'District North',
        land_type: 'Non-Agricultural',
        tribal_classification: false,
        notice_type: 'acquisition',
        description: 'Commercial property acquisition for highway project'
      }
    ]);

    console.log(`✅ Created ${notices.length} demo notices`);

    // Create demo payments
    const payments = await Payment.bulkCreate([
      {
        payment_id: 'PAY-2024-001',
        survey_number: 'SY-2024-HWY-001',
        notice_id: 'NOTICE-2024-001',
        amount: 850000,
        status: 'Success',
        officer_id: officers[0].id,
        project_id: projects[0].id,
        payment_date: new Date('2024-08-15'),
        payment_method: 'RTGS',
        utr_number: 'UTR123456789',
        notes: 'Compensation payment completed successfully'
      },
      {
        payment_id: 'PAY-2024-002',
        survey_number: 'SY-2024-HWY-002',
        notice_id: 'NOTICE-2024-002',
        amount: 5000000,
        status: 'Pending',
        reason_if_pending: 'Bank verification in progress',
        officer_id: officers[0].id,
        project_id: projects[0].id,
        payment_method: 'RTGS',
        notes: 'Payment pending bank verification'
      }
    ]);

    console.log(`✅ Created ${payments.length} demo payments`);

    // Create blockchain ledger entries for all events
    console.log('🔗 Creating blockchain ledger entries...');

    const blockchainEntries = [];

    // JMR Measurement events
    for (const jmr of jmrRecords) {
      const blockData = {
        surveyNumber: jmr.survey_number,
        eventType: 'JMR_Measurement_Uploaded',
        officerId: jmr.officer_id,
        projectId: jmr.project_id,
        metadata: {
          measured_area: jmr.measured_area,
          land_type: jmr.land_type,
          tribal_classification: jmr.tribal_classification,
          village: jmr.village,
          taluka: jmr.taluka,
          district: jmr.district,
          jmr_id: jmr.id
        },
        remarks: `JMR measurement uploaded for survey ${jmr.survey_number}. Area: ${jmr.measured_area} acres, Type: ${jmr.land_type}, Village: ${jmr.village}, Taluka: ${jmr.taluka}, District: ${jmr.district}`
      };

      const blockchainBlock = await blockchainService.createBlock(blockData);
      blockchainEntries.push(blockchainBlock);
    }

    // Notice Generated events
    for (const notice of notices) {
      const blockData = {
        surveyNumber: notice.survey_number,
        eventType: 'Notice_Generated',
        officerId: notice.officer_id,
        projectId: notice.project_id,
        metadata: {
          notice_id: notice.notice_id,
          amount: notice.amount,
          landowner_name: notice.landowner_name,
          notice_type: notice.notice_type
        },
        remarks: `Notice generated for survey ${notice.survey_number}. Amount: ₹${notice.amount}, Landowner: ${notice.landowner_name}`
      };

      const blockchainBlock = await blockchainService.createBlock(blockData);
      blockchainEntries.push(blockchainBlock);
    }

    // Payment events
    for (const payment of payments) {
      const eventType = payment.status === 'Success' ? 'Payment_Released' : 'Payment_Pending';
      const blockData = {
        surveyNumber: payment.survey_number,
        eventType: eventType,
        officerId: payment.officer_id,
        projectId: payment.project_id,
        metadata: {
          payment_id: payment.payment_id,
          amount: payment.amount,
          status: payment.status,
          utr_number: payment.utr_number,
          reason_if_pending: payment.reason_if_pending
        },
        remarks: payment.status === 'Success' 
          ? `Payment released for survey ${payment.survey_number}. Amount: ₹${payment.amount}, UTR: ${payment.utr_number}`
          : `Payment pending for survey ${payment.survey_number}. Amount: ₹${payment.amount}, Reason: ${payment.reason_if_pending}`
      };

      const blockchainBlock = await blockchainService.createBlock(blockData);
      blockchainEntries.push(blockchainBlock);
    }

    // Save all blockchain entries to database
    await BlockchainLedger.bulkCreate(blockchainEntries);

    console.log(`✅ Created ${blockchainEntries.length} blockchain ledger entries`);

    // Create some additional demo events for timeline
    const additionalEvents = [
      {
        surveyNumber: 'SY-2024-HWY-001',
        eventType: 'Award_Declared',
        officerId: officers[0].id,
        projectId: projects[0].id,
        metadata: {
          award_amount: 850000,
          award_date: new Date('2024-07-25')
        },
        remarks: 'Land acquisition award declared for survey SY-2024-HWY-001. Award amount: ₹8,50,000'
      },
      {
        surveyNumber: 'SY-2024-HWY-001',
        eventType: 'Compensated',
        officerId: officers[0].id,
        projectId: projects[0].id,
        metadata: {
          compensation_amount: 850000,
          compensation_date: new Date('2024-08-15'),
          payment_method: 'RTGS'
        },
        remarks: 'Compensation completed for survey SY-2024-HWY-001. Amount: ₹8,50,000 via RTGS'
      },
      {
        surveyNumber: 'SY-2024-HWY-001',
        eventType: 'Ownership_Updated',
        officerId: officers[0].id,
        projectId: projects[0].id,
        metadata: {
          previous_owner: 'Ramesh Kumar',
          new_owner: 'GOVT-HIGHWAY-DEPT-2024',
          transfer_date: new Date('2024-08-20')
        },
        remarks: 'Ownership transferred from Ramesh Kumar to Government Highway Department for survey SY-2024-HWY-001'
      }
    ];

    for (const event of additionalEvents) {
      const blockchainBlock = await blockchainService.createBlock(event);
      await BlockchainLedger.create(blockchainBlock);
    }

    console.log(`✅ Created ${additionalEvents.length} additional blockchain events`);

    // Create some compromised entries for demo purposes
    const compromisedEntry = await blockchainService.createBlock({
      surveyNumber: 'SY-2024-DEMO-COMPROMISED',
      eventType: 'JMR_Measurement_Uploaded',
      officerId: officers[0].id,
      projectId: projects[0].id,
      metadata: {
        measured_area: 10.0,
        land_type: 'Agricultural',
        village: 'Demo Village',
        taluka: 'Demo Taluka',
        district: 'Demo District'
      },
      remarks: 'Demo compromised entry for testing blockchain integrity'
    });

    // Manually tamper with the hash to simulate compromise
    compromisedEntry.current_hash = 'tampered_hash_value';
    compromisedEntry.is_valid = false;

    await BlockchainLedger.create(compromisedEntry);

    console.log('✅ Created demo compromised entry for testing');

    console.log('\n🎉 Blockchain demo data seeding completed successfully!');
    console.log('\n📊 Demo Data Summary:');
    console.log(`   Projects: ${projects.length}`);
    console.log(`   Officers: ${officers.length}`);
    console.log(`   JMR Records: ${jmrRecords.length}`);
    console.log(`   Notices: ${notices.length}`);
    console.log(`   Payments: ${payments.length}`);
    console.log(`   Blockchain Entries: ${blockchainEntries.length + additionalEvents.length + 1}`);
    console.log('\n🔍 You can now test:');
    console.log('   1. Blockchain Dashboard - View all entries and statistics');
    console.log('   2. Property History Timeline - Search for SY-2024-HWY-001');
    console.log('   3. JMR Blockchain Form - Create new entries');
    console.log('   4. Blockchain Integrity Verification - Test compromised entry');

  } catch (error) {
    console.error('❌ Failed to seed blockchain demo data:', error);
    throw error;
  }
};

// Run the seeding if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedBlockchainDemo()
    .then(() => {
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export default seedBlockchainDemo;
