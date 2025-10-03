import axios from 'axios';

async function testNoticeGeneration() {
  try {
    const response = await axios.post(
      'http://localhost:5000/api/landowners-english-complete/generate-notice',
      {
        project_id: '68da854996a3d559f5005b5c',
        survey_number: '67',
        landowner_name: 'जनार्दन लक्ष्मण म्हात्रे'
      },
      {
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN',
          'Content-Type': 'application/json; charset=utf-8'
        }
      }
    );
    
    console.log('Success:', response.data);
  } catch (error) {
    console.log('Error:', error.response?.data || error.message);
  }
}

testNoticeGeneration();