// Direct landowner records upload using the landowners API
import fetch from 'node-fetch';
import fs from 'fs';
import csv from 'csv-parser';

const API_BASE_URL = 'http://localhost:5000/api';
const CSV_FILE_PATH = 'd:\\Desk_backup\\bhoomi saral mvp\\new_saral_bhoomi\\saral-bhoomi\\Chandrapada New 20.01.23-.csv';

// Parse CSV and extract landowner data
function parseCSVData(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                // Skip header rows and empty rows
                if (data['अ.क्र'] && data['अ.क्र'] !== 'अ.क्र' && data['अ.क्र'].trim() !== '') {
                    const serialNo = parseInt(data['अ.क्र'] || '0');
                    if (serialNo > 0 && serialNo <= 77) { // Valid serial numbers
                        results.push(data);
                    }
                }
            })
            .on('end', () => {
                console.log(`📄 Parsed ${results.length} records from CSV`);
                resolve(results);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

// Convert CSV data to landowner record format
function convertToLandownerRecord(csvRow, projectId) {
    const serialNo = csvRow['अ.क्र'] || '';
    const landownerName = csvRow['खातेदाराचे नांव'] || '';
    const oldSurveyNo = csvRow['जुना स.नं.'] || '';
    const newSurveyNo = csvRow['नविन स.नं.'] || '';
    const groupNumber = csvRow['गट नंबर'] || '';
    const ctsNumber = csvRow['सी.टी.एस. नंबर'] || '';
    const totalArea = parseFloat(csvRow['गांव नमुना 7/12 नुसार जमिनीचे क्षेत्र (हे.आर)'] || '0');
    const acquiredArea = parseFloat(csvRow['संपादित जमिनीचे क्षेत्र (चौ.मी/हेक्टर आर)'] || '0');
    const landType = csvRow['जमिनीचा प्रकार'] || '';
    const landClassification = csvRow['जमिनीचा प्रकार शेती/ बिनशेती/ धारणाधिकार'] || '';
    const approvedRate = parseFloat(csvRow['मंजुर केलेला दर (प्रति हेक्टर) रक्कम रुपये'] || '0');
    const marketValue = parseFloat(csvRow['संपादीत होणाऱ्या जमिनीच्या क्षेत्रानुसार येणारे बाजारमुल्य र.रू'] || '0');
    const finalAmount = parseFloat(csvRow['हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये (अ.क्र. 28 वजा 29)'] || '0');
    
    return {
        project_id: projectId,
        survey_number: newSurveyNo || oldSurveyNo || `SN${serialNo}`,
        landowner_name: landownerName,
        area: totalArea,
        acquired_area: acquiredArea,
        rate: approvedRate,
        total_compensation: marketValue,
        final_amount: finalAmount,
        village: 'चंद्रपाडा',
        taluka: 'वसई',
        district: 'पालघर',
        land_type: landType,
        land_classification: landClassification,
        old_survey_number: oldSurveyNo,
        group_number: groupNumber,
        cts_number: ctsNumber,
        serial_number: parseInt(serialNo),
        kyc_status: 'pending',
        payment_status: 'pending',
        is_active: true
    };
}

async function uploadLandownerRecords() {
    try {
        console.log('🚀 Direct Landowner Records Upload');
        console.log('==================================');
        
        // Step 1: Parse CSV data
        console.log('📄 Parsing CSV file...');
        const csvData = await parseCSVData(CSV_FILE_PATH);
        
        if (csvData.length === 0) {
            throw new Error('No valid data found in CSV file');
        }
        
        console.log(`✅ Found ${csvData.length} valid records`);
        
        // Step 2: Use demo project ID
        const projectId = 'demo-project';
        
        // Step 3: Convert and upload each record
        console.log('\n📤 Uploading records to database...');
        let successful = 0;
        let failed = 0;
        const errors = [];
        
        for (let i = 0; i < csvData.length; i++) {
            const csvRow = csvData[i];
            const landownerRecord = convertToLandownerRecord(csvRow, projectId);
            
            console.log(`🔄 Processing ${i + 1}/${csvData.length}: ${landownerRecord.landowner_name}`);
            
            try {
                const response = await fetch(`${API_BASE_URL}/landowners`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer demo-jwt-token',
                        'x-demo-role': 'officer'
                    },
                    body: JSON.stringify(landownerRecord)
                });
                
                if (response.ok) {
                    successful++;
                    console.log(`✅ ${landownerRecord.landowner_name} - Survey: ${landownerRecord.survey_number}`);
                } else {
                    const errorData = await response.text();
                    failed++;
                    errors.push(`${landownerRecord.landowner_name}: ${errorData}`);
                    console.log(`❌ Failed: ${landownerRecord.landowner_name}`);
                }
                
                // Small delay to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                failed++;
                errors.push(`${landownerRecord.landowner_name}: ${error.message}`);
                console.log(`❌ Error: ${landownerRecord.landowner_name} - ${error.message}`);
            }
        }
        
        console.log('\n🎉 Upload Completed!');
        console.log('====================');
        console.log(`✅ Successful: ${successful}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📊 Total: ${csvData.length}`);
        
        if (errors.length > 0 && errors.length <= 5) {
            console.log('\n⚠️ Errors:');
            errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        } else if (errors.length > 5) {
            console.log(`\n⚠️ ${errors.length} errors occurred (showing first 3):`);
            errors.slice(0, 3).forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        }
        
        if (successful > 0) {
            console.log('\n💡 Records have been uploaded to the database!');
            console.log('🔄 Please refresh your Land Records Manager to see the new data');
        }
        
    } catch (error) {
        console.error('❌ Upload failed:', error.message);
    }
}

uploadLandownerRecords().catch(console.error);