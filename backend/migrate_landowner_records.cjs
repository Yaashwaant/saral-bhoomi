const { MongoClient } = require('mongodb');

async function migrateLandownerRecords() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('saral_bhoomi');
    const collection = db.collection('landownerrecords');
    
    console.log('Starting migration of landowner records...');
    
    // Get all records with old Marathi field structure
    const oldRecords = await collection.find({
      'सर्वे_नं': { $exists: true }
    }).toArray();
    
    console.log(`Found ${oldRecords.length} records with old structure`);
    
    for (const record of oldRecords) {
      console.log(`Migrating record ${record._id}...`);
      
      // Create new record with normalized field structure
      const newRecord = {
        project_id: record.projectId || record.project_id,
        landowner_name: record['खातेदाराचे_नांव'] || record.landowner_name,
        survey_number: record['सर्वे_नं'] || record.survey_number,
        old_survey_number: record['जुना_स.नं.'] || record.old_survey_number || '',
        group_number: record['गट_नंबर'] || record.group_number || '',
        cts_number: record['सी.टी.एस._नंबर'] || record.cts_number || '',
        
        // Land details
        area: parseFloat(record['क्षेत्र'] || record.area || 0),
        acquired_area: parseFloat(record['संपादित_क्षेत्र'] || record.acquired_area || 0),
        land_type: record['जमिनीचा_प्रकार'] || record.land_type || '',
        land_type_classification: record['जमिनीचा_प्रकार_शेती_बिनशेती_धारणाधिकार'] || record.land_type_classification || '',
        
        // Financial details
        rate: parseFloat(record['दर'] || record.rate || 0),
        market_value: parseFloat(record['संपादीत_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमुल्य'] || record.market_value || 0),
        compensation_section_26: parseFloat(record['कलम_26_नुसार_जमिनीचा_मोबदला'] || record.compensation_section_26 || 0),
        
        // Structures and improvements
        structures_count: parseInt(record['बांधकामे_संख्या'] || record.structures_count || 0),
        structures_amount: parseFloat(record['बांधकामे_रक्कम'] || record.structures_amount || 0),
        forest_trees_count: parseInt(record['वनझाडे_संख्या'] || record.forest_trees_count || 0),
        forest_trees_amount: parseFloat(record['वनझाडे_रक्कम'] || record.forest_trees_amount || 0),
        fruit_trees_count: parseInt(record['फळझाडे_संख्या'] || record.fruit_trees_count || 0),
        fruit_trees_amount: parseFloat(record['फळझाडे_रक्कम'] || record.fruit_trees_amount || 0),
        wells_count: parseInt(record['विहिरी_बोअरवेल_संख्या'] || record.wells_count || 0),
        wells_amount: parseFloat(record['विहिरी_बोअरवेल_रक्कम'] || record.wells_amount || 0),
        
        // Compensation calculations
        total_improvements_amount: parseFloat(record['एकुण_रक्कम'] || record.total_improvements_amount || 0),
        solatium: parseFloat(record['सोलेशियम_100'] || record['100_प्रतिशत_सोलेशियम'] || record.solatium || 0),
        final_compensation: parseFloat(record['निर्धारित_मोबदला'] || record.final_compensation || 0),
        additional_compensation: parseFloat(record['वाढीव_मोबदला'] || record.additional_compensation || 0),
        total_final_amount: parseFloat(record['एकुण_मोबदला'] || record.total_final_amount || 0),
        deduction_amount: parseFloat(record['वजावट_रक्कम'] || record.deduction_amount || 0),
        final_amount_to_pay: parseFloat(record['हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम'] || record.final_amount_to_pay || 0),
        
        // Location information
        village: record.village || '',
        taluka: record.taluka || 'NA',
        district: record.district || 'NA',
        
        // Additional information
        remarks: record['शेरा'] || record.remarks || '',
        
        // Legacy fields for backward compatibility
        structure_trees_wells_amount: parseFloat(record['संरचना_झाडे_विहिरी_रक्कम'] || record.structure_trees_wells_amount || 0),
        total_compensation: parseFloat(record['एकूण_मोबदला'] || record.total_compensation || 0),
        final_amount: parseFloat(record['अंतिम_रक्कम'] || record.final_amount || 0),
        
        // Contact information
        contact_phone: record.contact_phone || '',
        contact_email: record.contact_email || '',
        contact_address: record.contact_address || '',
        
        // Banking information
        bank_account_number: record.bank_account_number || '',
        bank_ifsc_code: record.bank_ifsc_code || '',
        bank_name: record.bank_name || '',
        bank_branch_name: record.bank_branch_name || '',
        bank_account_holder_name: record.bank_account_holder_name || record['खातेदाराचे_नांव'] || record.landowner_name,
        
        // Tribal classification
        is_tribal: !!record.is_tribal,
        tribal_certificate_no: record.tribal_certificate_no || '',
        tribal_lag: record.tribal_lag || '',
        
        // System fields
        createdBy: record.createdBy || 1,
        created_at: record.createdAt || new Date(),
        updated_at: record.updatedAt || new Date(),
        
        // Additional fields from old structure
        noticeGenerated: record.noticeGenerated || false,
        kycStatus: record.kycStatus || 'pending',
        paymentStatus: record.paymentStatus || 'pending',
        isActive: record.isActive !== false,
        assignedAgent: record.assignedAgent,
        assignedAt: record.assignedAt,
        documents: record.documents || []
      };
      
      // Replace the old record with the new one
      await collection.replaceOne(
        { _id: record._id },
        newRecord
      );
      
      console.log(`✓ Migrated record ${record._id}`);
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await client.close();
  }
}

migrateLandownerRecords();
