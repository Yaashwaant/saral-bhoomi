const fs = require('fs');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testCSVUpload() {
  try {
    // Read the sample CSV file
    const csvContent = fs.readFileSync('../sample_parishisht_k.csv', 'utf8');
    
    // Create form data
    const form = new FormData();
    form.append('file', csvContent, {
      filename: 'sample_parishisht_k.csv',
      contentType: 'text/csv'
    });
    form.append('project_id', '68b833f8c2e6f8a446510454'); // Use the project ID from the response
    
    // Upload CSV
    const response = await fetch('http://localhost:5000/api/csv/upload/68b833f8c2e6f8a446510454', {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders(),
        'Authorization': 'Bearer demo-jwt-token',
        'x-demo-role': 'officer'
      }
    });
    
    const result = await response.json();
    console.log('Upload Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ CSV upload successful!');
      console.log(`📊 Uploaded ${result.count} records`);
    } else {
      console.log('❌ CSV upload failed:', result.message);
      if (result.errors) {
        console.log('Errors:', result.errors);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing CSV upload:', error);
  }
}

testCSVUpload();
