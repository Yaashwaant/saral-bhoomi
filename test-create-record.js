import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

async function testCreateRecord() {
  try {
    const projectId = '68da6edf579af093415f639e'; // Palghar DFCC Project
    
    const newRecord = {
      अ_क्र: '12345',
      खातेदाराचे_नांव: 'टेस्ट खातेदार',
      जुना_स_नं: 'OLD123',
      नविन_स_नं: 'NEW123',
      गट_नंबर: 'GAT456',
      सी_टी_एस_नं: 'CTS789',
      Village: 'टेस्ट गाव',
      Taluka: 'टेस्ट तालुका',
      District: 'पालघर',
      गांव_नमुना_7_12_नुसार_जमिनीचे_क्षेत्र_हे_आर: 100,
      संपादित_जमिनीचे_क्षेत्र_चौ_मी_हेक्टर_आर: 50,
      जमिनीचा_प्रकार: 'शेती',
      जमिनीचा_प्रकार_शेती_बिनशेती_धारणाधिकार: 'शेती',
      मंजुर_केलेला_दर_प्रति_हेक्टर_रक्कम_रुपये: 50000,
      संपादीत_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमुल्य_र_रू: 2500000,
      कलम_26_2_नुसार_गावास_लागु_असलेले_गणक_Factor_अ_क्र_5_X_8: 1,
      कलम_26_नुसार_जमिनीचा_मोबदला_9X10: 0,
      बांधकामे: 0,
      वनझाडे: 0,
      फळझाडे: 0,
      विहिरी_बोअरवेल: 0,
      एकुण_रक्कम_रुपये_16_18_20_22: 0,
      एकुण_रक्कम_14_23: 0,
      सोलेशियम_दिलासा_रक्कम: 0,
      निर्धारित_मोबदला_26: 0,
      एकूण_रक्कमेवर_25_वाढीव_मोबदला: 0,
      एकुण_मोबदला_26_27: 0,
      वजावट_रक्कम_रुपये: 0,
      हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम_रुपये: 0,
      शेरा: 'टेस्ट रेकॉर्ड',
      मोबदला_वाटप_तपशिल: 'टेस्ट मोबदला',
      project_id: projectId
    };
    
    console.log(`🔄 Testing POST endpoint: ${API_BASE_URL}/api/landowners2`);
    console.log('📤 Sending data:', JSON.stringify(newRecord, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}/api/landowners2`, newRecord, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer demo-jwt-token',
        'x-demo-role': 'officer'
      }
    });
    
    console.log('✅ Record created successfully!');
    console.log('📊 Response:', response.data);
    
  } catch (error) {
    console.error('❌ Error creating record:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testCreateRecord();