import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load env
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/saral_bhoomi';

// Helper to get DB name from URI
function getDbName(connectionString) {
  try {
    const afterSlash = connectionString.split('/').pop();
    return (afterSlash || 'saral_bhoomi').split('?')[0];
  } catch {
    return 'saral_bhoomi';
  }
}

const dbName = getDbName(uri);

const documents = [
  {
    'अ.क्र': 1,
    'आकारबंद प्रमाणे': 'परिशिष्ट 16 (सोळा) नुसार',
    '7/12.': 'गाव नमुना 7/12 संदर्भ',
    'संपादित क्षेत्र': 'राष्ट्रीय महामार्ग अधिग्रहण',
    'खातेदाराचे नाव': 'रामचंद्र पाटील',
    'तपशिल': 'प्रकल्पासाठी जमीन संपादन',
    'भूमापन गट क्र.': '112/1A',
    'जमिनीचा प्रकार': 'शेती',
    'क्षेत्र हे.आर मध्ये': '1 हे 20 आर',
    '3 अ हेक्टर': 1.0,
    '3 ब आर': 20,
    '3 क': 0,
    'बांधकाम': 'पक्के घर',
    'विहिर / कुपनलिका': 'विहिर',
    'झाडे': 'आंबा-5, चिंच-2',
    'शेरा': 'मोजणी पत्रक तयार'
  },
  {
    'अ.क्र': 2,
    'आकारबंद प्रमाणे': 'परिशिष्ट 16 (सोळा) नुसार',
    '7/12.': 'गाव नमुना 7/12 संदर्भ',
    'संपादित क्षेत्र': 'राज्य महामार्ग विस्तार',
    'खातेदाराचे नाव': 'सुनिता देशमुख',
    'तपशिल': 'रस्ता रुंदीकरण',
    'भूमापन गट क्र.': '89/3B',
    'जमिनीचा प्रकार': 'निवासी',
    'क्षेत्र हे.आर मध्ये': '0 हे 75 आर',
    '3 अ हेक्टर': 0.75,
    '3 ब आर': 75,
    '3 क': 0,
    'बांधकाम': 'शेड',
    'विहिर / कुपनलिका': 'कुपनलिका',
    'झाडे': 'नारळ-3',
    'शेरा': 'परिसरात कोणतीही अडचण नाही'
  },
  {
    'अ.क्र': 3,
    'आकारबंद प्रमाणे': 'परिशिष्ट 16 (सोळा) नुसार',
    '7/12.': 'गाव नमुना 7/12 संदर्भ',
    'संपादित क्षेत्र': 'वांद्रवण बंदर प्रकल्प',
    'खातेदाराचे नाव': 'विजय मोरे',
    'तपशिल': 'प्रकल्पासाठी अधिग्रहण',
    'भूमापन गट क्र.': '101/7C',
    'जमिनीचा प्रकार': 'बांझ',
    'क्षेत्र हे.आर मध्ये': '2 हे 10 आर',
    '3 अ हेक्टर': 2.1,
    '3 ब आर': 10,
    '3 क': 0,
    'बांधकाम': 'नाही',
    'विहिर / कुपनलिका': 'नाही',
    'झाडे': 'बाभूळ-10',
    'शेरा': 'स्थळ तपासणी पूर्ण'
  }
];

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection('jmrrecords');

    const delRes = await col.deleteMany({});
    const insRes = await col.insertMany(documents);

    console.log(`Database: ${dbName}`);
    console.log(`Cleared ${delRes.deletedCount} existing documents from jmrrecords.`);
    console.log(`Inserted ${insRes.insertedCount} new documents into jmrrecords.`);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run();