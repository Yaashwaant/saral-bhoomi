import DynamicWorkflowService from '../services/dynamicWorkflowService.js';
import LandownerService from '../services/landownerService.js';
import sequelize from '../config/database.js';

/**
 * Test script to demonstrate dynamic workflow service capabilities
 */
async function testDynamicWorkflow() {
  try {
    console.log('🧪 Testing Dynamic Workflow Service...\n');
    
    // Use a real survey number that exists in landowner_records table
    const surveyNumber = '123/1';
    
    // Test 1: Validate workflow completeness
    console.log('📋 Test 1: Validating workflow completeness...');
    const validation = await DynamicWorkflowService.validateWorkflowCompleteness(surveyNumber);
    console.log('Validation Result:', validation);
    console.log('');
    
    // Test 2: Get field suggestions for different contexts
    console.log('💡 Test 2: Getting field suggestions...');
    
    const jmrSuggestions = await DynamicWorkflowService.getFieldSuggestions(surveyNumber, 'jmr');
    console.log('JMR Suggestions:', jmrSuggestions);
    
    const awardSuggestions = await DynamicWorkflowService.getFieldSuggestions(surveyNumber, 'award');
    console.log('Award Suggestions:', awardSuggestions);
    
    const noticeSuggestions = await DynamicWorkflowService.getFieldSuggestions(surveyNumber, 'notice');
    console.log('Notice Suggestions:', noticeSuggestions);
    
    const paymentSuggestions = await DynamicWorkflowService.getFieldSuggestions(surveyNumber, 'payment');
    console.log('Payment Suggestions:', paymentSuggestions);
    console.log('');
    
    // Test 3: Test individual field fetching
    console.log('🔍 Test 3: Testing individual field fetching...');
    
    const landownerName = await LandownerService.getFieldBySurveyNumber(surveyNumber, 'landowner_name');
    console.log(`Landowner Name: ${landownerName}`);
    
    const village = await LandownerService.getFieldBySurveyNumber(surveyNumber, 'village');
    console.log(`Village: ${village}`);
    
    const area = await LandownerService.getFieldBySurveyNumber(surveyNumber, 'area');
    console.log(`Area: ${area}`);
    console.log('');
    
    // Test 4: Test multiple field fetching
    console.log('📊 Test 4: Testing multiple field fetching...');
    
    const multipleFields = await LandownerService.getMultipleFieldsBySurveyNumber(surveyNumber, [
      'landowner_name', 'village', 'taluka', 'district', 'area'
    ]);
    console.log('Multiple Fields:', multipleFields);
    console.log('');
    
    // Test 5: Test missing field filling
    console.log('🔧 Test 5: Testing missing field filling...');
    
    const incompleteData = {
      survey_number: surveyNumber,
      landowner_id: 'OWN-123-001',
      officer_id: 1
    };
    
    const enhancedData = await LandownerService.fillMissingFields(
      incompleteData,
      surveyNumber,
      ['village', 'taluka', 'district']
    );
    console.log('Original Data:', incompleteData);
    console.log('Enhanced Data:', enhancedData);
    console.log('');
    
    // Test 6: Test complete workflow data creation
    console.log('🚀 Test 6: Testing complete workflow data creation...');
    
    const completeWorkflowData = await DynamicWorkflowService.createCompleteWorkflowData(surveyNumber, {
      jmr: { status: 'completed', notes: 'Test JMR' },
      award: { status: 'Draft', notes: 'Test Award' },
      notice: { status: 'draft', notes: 'Test Notice' },
      payment: { status: 'Pending', notes: 'Test Payment' }
    });
    
    console.log('Complete Workflow Data:');
    console.log('- JMR:', {
      survey_number: completeWorkflowData.jmr.survey_number,
      village: completeWorkflowData.jmr.village,
      taluka: completeWorkflowData.jmr.taluka,
      district: completeWorkflowData.jmr.district
    });
    
    console.log('- Award:', {
      survey_number: completeWorkflowData.award.survey_number,
      landowner_name: completeWorkflowData.award.landowner_name,
      village: completeWorkflowData.award.village
    });
    
    console.log('- Notice:', {
      survey_number: completeWorkflowData.notice.survey_number,
      landowner_name: completeWorkflowData.notice.landowner_name
    });
    
    console.log('- Payment:', {
      survey_number: completeWorkflowData.payment.survey_number,
      amount: completeWorkflowData.payment.amount
    });
    
    console.log('\n🎉 All dynamic workflow tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDynamicWorkflow();
}

export default testDynamicWorkflow;
