const fs = require('fs');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testExcelUpload() {
  try {
    // Test with the sample CSV first
    const formData = new FormData();
    formData.append('csvFile', fs.createReadStream('../sample_parishisht_k.csv'));
    formData.append('overwrite', 'true');

    console.log('Testing CSV upload...');
    const response = await fetch('http://localhost:5000/api/csv/upload/68b833f8c2e6f8a446510454', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testExcelUpload();
