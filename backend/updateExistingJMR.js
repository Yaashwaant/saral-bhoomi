import sequelize from './config/database.js';

async function updateExistingJMR() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');
    
    // Update the existing JMR record with landowner name
    const result = await sequelize.query(
      'UPDATE jmr_records SET landowner_name = :landownerName WHERE survey_number = :surveyNumber',
      { 
        replacements: { 
          landownerName: 'राजेश पाटील',
          surveyNumber: 'SY-2024-DEMO-001'
        },
        type: sequelize.QueryTypes.UPDATE 
      }
    );
    
    console.log('✅ Updated existing JMR record with landowner name');
    
    // Verify the update
    const jmr = await sequelize.query(
      'SELECT * FROM jmr_records WHERE survey_number = :surveyNumber',
      { 
        replacements: { surveyNumber: 'SY-2024-DEMO-001' },
        type: sequelize.QueryTypes.SELECT 
      }
    );
    
    if (jmr.length > 0) {
      console.log('\nUpdated JMR Record:');
      console.log(`Survey Number: ${jmr[0].survey_number}`);
      console.log(`Landowner Name: ${jmr[0].landowner_name}`);
      console.log(`Landowner ID: ${jmr[0].landowner_id}`);
      console.log(`Village: ${jmr[0].village}`);
      console.log(`Status: ${jmr[0].status}`);
    }
    
    await sequelize.close();
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

updateExistingJMR();
