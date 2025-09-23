import { connectMongoDBAtlas } from './config/mongodb-atlas.js';
import MongoUser from './models/mongo/User.js';
import MongoProject from './models/mongo/Project.js';
import MongoLandownerRecord from './models/mongo/LandownerRecord.js';
import MongoJMRRecord from './models/mongo/JMRRecord.js';
import MongoAward from './models/mongo/Award.js';
import MongoNotice from './models/mongo/Notice.js';
import MongoPayment from './models/mongo/Payment.js';
import MongoBlockchainLedger from './models/mongo/BlockchainLedger.js';
import bcrypt from 'bcryptjs';

// Import Sequelize models for data extraction
import { User, Project, LandownerRecord, JMRRecord, Award, Notice, Payment, BlockchainLedger } from './models/index.js';
import sequelize from './config/database.js';

async function migrateToMongoDB() {
  try {
    console.log('🔄 Starting PostgreSQL to MongoDB migration...\n');
    
    // Step 1: Connect to MongoDB Atlas
    console.log('☁️ Connecting to MongoDB Atlas...');
    const mongoConnected = await connectMongoDBAtlas();
    if (!mongoConnected) {
      console.error('❌ Failed to connect to MongoDB Atlas');
      return;
    }
    console.log('✅ Connected to MongoDB Atlas\n');
    
    // Step 2: Connect to PostgreSQL
    console.log('🐘 Connecting to PostgreSQL...');
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL\n');
    
    // Step 3: Clear existing MongoDB data
    console.log('🧹 Clearing existing MongoDB data...');
    await MongoUser.deleteMany({});
    await MongoProject.deleteMany({});
    await MongoLandownerRecord.deleteMany({});
    await MongoJMRRecord.deleteMany({});
    await MongoAward.deleteMany({});
    await MongoNotice.deleteMany({});
    await MongoPayment.deleteMany({});
    await MongoBlockchainLedger.deleteMany({});
    console.log('✅ MongoDB data cleared\n');
    
    // Step 4: Migrate Users
    console.log('👤 Migrating Users...');
    const users = await User.findAll();
    for (const user of users) {
      const mongoUser = new MongoUser({
        name: user.name || user.username || 'Unknown User',
        email: user.email,
        password: user.password || await bcrypt.hash('default123', 12),
        role: user.role || 'officer',
        department: user.department || 'General Department',
        phone: user.phone || '+91-0000000000',
        is_active: user.is_active !== false,
        last_login: user.last_login,
        profile_picture: user.profile_picture
      });
      await mongoUser.save();
      console.log(`   ✅ Migrated user: ${mongoUser.name} (${mongoUser.email})`);
    }
    console.log(`✅ Migrated ${users.length} users\n`);
    
    // Step 5: Migrate Projects
    console.log('🏗️ Migrating Projects...');
    const projects = await Project.findAll();
    for (const project of projects) {
      // Handle project type mapping
      let projectType = 'other';
      if (project.type) {
        const validTypes = ['road', 'railway', 'irrigation', 'industrial', 'residential', 'other'];
        if (validTypes.includes(project.type.toLowerCase())) {
          projectType = project.type.toLowerCase();
        } else {
          // Map invalid types to valid ones
          const typeMapping = {
            'greenfield': 'industrial',
            'brownfield': 'industrial',
            'infrastructure': 'road',
            'development': 'residential'
          };
          projectType = typeMapping[project.type.toLowerCase()] || 'other';
        }
      }
      
      // Handle createdBy - convert numeric ID to string or set to null
      let createdById = null;
      if (project.createdBy) {
        if (typeof project.createdBy === 'number') {
          // For numeric IDs, we'll need to find the corresponding MongoDB user
          // For now, set to null and handle later
          createdById = null;
        } else {
          createdById = project.createdBy;
        }
      }
      
      const mongoProject = new MongoProject({
        projectName: project.projectName || project.name || 'Unknown Project',
        schemeName: project.schemeName || 'General Scheme',
        landRequired: project.landRequired || project.totalLand || 0,
        landAvailable: project.landAvailable || 0,
        landToBeAcquired: project.landToBeAcquired || project.remainingLand || 0,
        type: projectType,
        district: project.district || 'Unknown District',
        taluka: project.taluka || 'Unknown Taluka',
        villages: project.villages || ['Unknown Village'],
        estimatedCost: project.estimatedCost || project.cost || 0,
        allocatedBudget: project.allocatedBudget || project.budget || 0,
        startDate: project.startDate || new Date(),
        expectedCompletion: project.expectedCompletion || new Date(),
        status: project.status || 'planning',
        createdBy: createdById,
        description: project.description || 'No description available',
        progress: project.progress || 0
      });
      await mongoProject.save();
      console.log(`   ✅ Migrated project: ${mongoProject.projectName} (Type: ${projectType})`);
    }
    console.log(`✅ Migrated ${projects.length} projects\n`);
    
    // Step 6: Migrate Landowner Records
    console.log('👥 Migrating Landowner Records...');
    const landowners = await LandownerRecord.findAll();
    for (const landowner of landowners) {
      const mongoLandowner = new MongoLandownerRecord({
        survey_number: landowner.survey_number || `MIGRATED-${Date.now()}`,
        landowner_name: landowner.landowner_name || landowner.name || 'Unknown Landowner',
        area: landowner.area || 0,
        acquired_area: landowner.acquired_area || 0,
        rate: landowner.rate || 0,
        structure_trees_wells_amount: landowner.structure_trees_wells_amount || 0,
        total_compensation: landowner.total_compensation || 0,
        solatium: landowner.solatium || 0,
        final_amount: landowner.final_amount || 0,
        village: landowner.village || 'Unknown Village',
        taluka: landowner.taluka || 'Unknown Taluka',
        district: landowner.district || 'Unknown District',
        contact_phone: landowner.contact_phone || landowner.phone || '',
        contact_email: landowner.contact_email || landowner.email || '',
        contact_address: landowner.contact_address || landowner.address || '',
        is_tribal: landowner.is_tribal || false,
        tribal_certificate_no: landowner.tribal_certificate_no || '',
        tribal_lag: landowner.tribal_lag || '',
        bank_account_number: landowner.bank_account_number || '',
        bank_ifsc_code: landowner.bank_ifsc_code || '',
        bank_name: landowner.bank_name || '',
        bank_branch_name: landowner.bank_branch_name || '',
        bank_account_holder_name: landowner.bank_account_holder_name || '',
        kyc_status: landowner.kyc_status || 'pending',
        payment_status: landowner.payment_status || 'pending',
        notice_generated: landowner.notice_generated || false,
        notice_number: landowner.notice_number || '',
        notice_date: landowner.notice_date || null,
        notice_content: landowner.notice_content || '',
        kyc_completed_at: landowner.kyc_completed_at || null,
        kyc_completed_by: landowner.kyc_completed_by || '',
        payment_initiated_at: landowner.payment_initiated_at || null,
        payment_completed_at: landowner.payment_completed_at || null,
        bank_reference: landowner.bank_reference || '',
        assigned_agent: landowner.assigned_agent || '',
        assigned_at: landowner.assigned_at || null,
        documents: landowner.documents || [],
        notes: landowner.notes || '',
        is_active: landowner.is_active !== false,
        created_by: landowner.created_by || landowner.userId || null
      });
      await mongoLandowner.save();
      console.log(`   ✅ Migrated landowner: ${mongoLandowner.landowner_name} (${mongoLandowner.survey_number})`);
    }
    console.log(`✅ Migrated ${landowners.length} landowner records\n`);
    
    // Step 7: Migrate JMR Records
    console.log('📋 Migrating JMR Records...');
    const jmrRecords = await JMRRecord.findAll();
    for (const jmr of jmrRecords) {
      // Handle enum value mapping for JMR
      let landType = 'agricultural';
      if (jmr.land_type) {
        const typeMapping = {
          'Agricultural': 'agricultural',
          'Residential': 'residential',
          'Commercial': 'commercial',
          'Industrial': 'industrial',
          'Forest': 'forest'
        };
        landType = typeMapping[jmr.land_type] || 'agricultural';
      }
      
      let category = 'general';
      if (jmr.category) {
        const categoryMapping = {
          'Residential': 'general',
          'SC': 'sc',
          'ST': 'st',
          'OBC': 'obc'
        };
        category = categoryMapping[jmr.category] || 'general';
      }
      
      let status = 'draft';
      if (jmr.status) {
        const statusMapping = {
          'completed': 'approved',
          'pending': 'draft',
          'approved': 'approved',
          'rejected': 'rejected'
        };
        status = statusMapping[jmr.status] || 'draft';
      }
      
      const mongoJMR = new MongoJMRRecord({
        survey_number: jmr.survey_number || `MIGRATED-JMR-${Date.now()}`,
        project_id: null, // Will be linked later
        officer_id: null, // Will be linked later
        measurement_date: jmr.measurement_date || new Date(),
        measured_area: jmr.measured_area || 0,
        land_type: landType,
        tribal_classification: jmr.tribal_classification || 'non-tribal',
        category: category,
        structure_details: jmr.structure_details || [],
        tree_details: jmr.tree_details || [],
        well_details: jmr.well_details || [],
        total_structure_value: jmr.total_structure_value || 0,
        total_tree_value: jmr.total_tree_value || 0,
        total_well_value: jmr.total_well_value || 0,
        remarks: jmr.remarks || '',
        status: status,
        approved_by: jmr.approved_by || null,
        approved_at: jmr.approved_at || null,
        rejection_reason: jmr.rejection_reason || '',
        documents: jmr.documents || [],
        is_active: jmr.is_active !== false
      });
      await mongoJMR.save();
      console.log(`   ✅ Migrated JMR: ${mongoJMR.survey_number}`);
    }
    console.log(`✅ Migrated ${jmrRecords.length} JMR records\n`);
    
    // Step 8: Migrate Awards
    console.log('🏆 Migrating Awards...');
    const awards = await Award.findAll();
    for (const award of awards) {
      // Handle enum value mapping for Awards
      let landType = 'agricultural';
      if (award.land_type) {
        const typeMapping = {
          'Agricultural': 'agricultural',
          'Residential': 'residential',
          'Commercial': 'commercial',
          'Industrial': 'industrial',
          'Forest': 'forest'
        };
        landType = typeMapping[award.land_type] || 'agricultural';
      }
      
      let category = 'general';
      if (award.category) {
        const categoryMapping = {
          'Residential': 'general',
          'SC': 'sc',
          'ST': 'st',
          'OBC': 'obc'
        };
        category = categoryMapping[award.category] || 'general';
      }
      
      const mongoAward = new MongoAward({
        survey_number: award.survey_number || `MIGRATED-AWARD-${Date.now()}`,
        project_id: null, // Will be linked later
        officer_id: null, // Will be linked later
        award_date: award.award_date || new Date(),
        award_number: award.award_number || `AWD-${Date.now()}`,
        measured_area: award.measured_area || 0,
        land_type: landType,
        tribal_classification: award.tribal_classification || 'non-tribal',
        category: category,
        base_amount: award.base_amount || 0,
        solatium_amount: award.solatium_amount || 0,
        interest_amount: award.interest_amount || 0,
        total_amount: award.total_amount || 0,
        award_status: award.award_status || 'draft',
        challenge_details: award.challenge_details || {},
        documents: award.documents || [],
        remarks: award.remarks || '',
        is_active: award.is_active !== false
      });
      await mongoAward.save();
      console.log(`   ✅ Migrated Award: ${mongoAward.award_number}`);
    }
    console.log(`✅ Migrated ${awards.length} awards\n`);
    
    // Step 9: Migrate Notices
    console.log('📢 Migrating Notices...');
    const notices = await Notice.findAll();
    for (const notice of notices) {
      // Handle enum value mapping for Notices
      let noticeType = 'acquisition';
      if (notice.notice_type) {
        const typeMapping = {
          'Acquisition': 'acquisition',
          'Possession': 'possession',
          'Eviction': 'eviction'
        };
        noticeType = typeMapping[notice.notice_type] || 'acquisition';
      }
      
      let landType = 'agricultural';
      if (notice.land_type) {
        const typeMapping = {
          'Agricultural': 'agricultural',
          'Residential': 'residential',
          'Commercial': 'commercial',
          'Industrial': 'industrial',
          'Forest': 'forest'
        };
        landType = typeMapping[notice.land_type] || 'agricultural';
      }
      
      const mongoNotice = new MongoNotice({
        survey_number: notice.survey_number || `MIGRATED-NOTICE-${Date.now()}`,
        project_id: null, // Will be linked later
        officer_id: null, // Will be linked later
        notice_type: noticeType,
        notice_date: notice.notice_date || new Date(),
        notice_number: notice.notice_number || `NOT-${Date.now()}`,
        amount: notice.amount || 0,
        land_type: landType,
        notice_content: notice.notice_content || 'Notice content',
        delivery_method: notice.delivery_method || 'hand_delivery',
        delivery_date: notice.delivery_date || null,
        delivery_status: notice.delivery_status || 'pending',
        delivery_proof: notice.delivery_proof || {},
        response_received: notice.response_received || false,
        response_date: notice.response_date || null,
        response_content: notice.response_content || '',
        notice_status: notice.notice_status || 'draft',
        expiry_date: notice.expiry_date || null,
        documents: notice.documents || [],
        remarks: notice.remarks || '',
        is_active: notice.is_active !== false
      });
      await mongoNotice.save();
      console.log(`   ✅ Migrated Notice: ${mongoNotice.notice_number}`);
    }
    console.log(`✅ Migrated ${notices.length} notices\n`);
    
    // Step 10: Migrate Payments
    console.log('💰 Migrating Payments...');
    const payments = await Payment.findAll();
    for (const payment of payments) {
      // Handle enum value mapping for Payments
      let paymentMethod = 'rtgs';
      if (payment.payment_method) {
        const methodMapping = {
          'RTGS': 'rtgs',
          'NEFT': 'neft',
          'Cheque': 'cheque',
          'Cash': 'cash'
        };
        paymentMethod = methodMapping[payment.payment_method] || 'rtgs';
      }
      
      let landType = 'agricultural';
      if (payment.land_type) {
        const typeMapping = {
          'Agricultural': 'agricultural',
          'Residential': 'residential',
          'Commercial': 'commercial',
          'Industrial': 'industrial',
          'Forest': 'forest'
        };
        landType = typeMapping[payment.land_type] || 'agricultural';
      }
      
      const mongoPayment = new MongoPayment({
        survey_number: payment.survey_number || `MIGRATED-PAYMENT-${Date.now()}`,
        project_id: null, // Will be linked later
        officer_id: null, // Will be linked later
        payment_type: payment.payment_type || 'compensation',
        payment_date: payment.payment_date || new Date(),
        payment_number: payment.payment_number || `PAY-${Date.now()}`,
        amount: payment.amount || 0,
        land_type: landType,
        payment_method: paymentMethod,
        bank_details: payment.bank_details || {},
        transaction_reference: payment.transaction_reference || '',
        payment_status: payment.payment_status || 'pending',
        failure_reason: payment.failure_reason || '',
        reversal_reason: payment.reversal_reason || '',
        documents: payment.documents || [],
        remarks: payment.remarks || '',
        is_active: payment.is_active !== false
      });
      await mongoPayment.save();
      console.log(`   ✅ Migrated Payment: ${mongoPayment.payment_number}`);
    }
    console.log(`✅ Migrated ${payments.length} payments\n`);
    
    // Step 11: Migrate Blockchain Ledger
    console.log('⛓️ Migrating Blockchain Ledger...');
    const blockchainRecords = await BlockchainLedger.findAll();
    for (const record of blockchainRecords) {
      const mongoBlockchain = new MongoBlockchainLedger({
        block_id: record.block_id || `BLOCK-${Date.now()}`,
        project_id: null, // Will be linked later
        officer_id: null, // Will be linked later
        transaction_type: record.transaction_type || 'status_update',
        survey_number: record.survey_number || `MIGRATED-${Date.now()}`,
        previous_hash: record.previous_hash || '0',
        current_hash: record.current_hash || '0',
        timestamp: record.timestamp || new Date(),
        data: record.data || {},
        nonce: record.nonce || 0,
        difficulty: record.difficulty || 4,
        is_valid: record.is_valid !== false,
        validation_errors: record.validation_errors || [],
        mined_by: record.mined_by || null,
        mined_at: record.mined_at || null,
        block_status: record.block_status || 'pending'
      });
      await mongoBlockchain.save();
      console.log(`   ✅ Migrated Blockchain: ${mongoBlockchain.block_id}`);
    }
    console.log(`✅ Migrated ${blockchainRecords.length} blockchain records\n`);
    
    // Step 12: Migration Summary
    console.log('📊 Migration Summary:');
    console.log(`   👤 Users: ${await MongoUser.countDocuments()}`);
    console.log(`   🏗️ Projects: ${await MongoProject.countDocuments()}`);
    console.log(`   👥 Landowner Records: ${await MongoLandownerRecord.countDocuments()}`);
    console.log(`   📋 JMR Records: ${await MongoJMRRecord.countDocuments()}`);
    console.log(`   🏆 Awards: ${await MongoAward.countDocuments()}`);
    console.log(`   📢 Notices: ${await MongoNotice.countDocuments()}`);
    console.log(`   💰 Payments: ${await MongoPayment.countDocuments()}`);
    console.log(`   ⛓️ Blockchain Records: ${await MongoBlockchainLedger.countDocuments()}`);
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('🚀 Your application is now ready to use MongoDB Atlas!');
    
    // Step 13: Close connections
    await sequelize.close();
    console.log('✅ PostgreSQL connection closed');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrateToMongoDB();
