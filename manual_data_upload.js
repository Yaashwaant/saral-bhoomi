// Manual data upload based on the CSV content
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';

// Extracted data from the CSV file
const landownerData = [
    {
        serial_number: 1,
        landowner_name: 'जनार्दन लक्ष्मण म्हात्रे',
        old_survey_number: '357',
        survey_number: '67',
        group_number: '67/4/अ',
        cts_number: '232',
        total_area: 0.1310,
        acquired_area: 0.0022,
        land_type: 'शेती',
        land_classification: 'शेती/वर्ग -1',
        approved_rate: 98600000,
        market_value: 216920,
        final_amount: 542300
    },
    {
        serial_number: 2,
        landowner_name: 'देवयानी दयानंद म्हात्रे',
        old_survey_number: '357',
        survey_number: '67',
        group_number: '67/3/ब',
        cts_number: '238',
        total_area: 0.0450,
        acquired_area: 0.0051,
        land_type: 'शेती',
        land_classification: 'शेती/वर्ग -1',
        approved_rate: 98600000,
        market_value: 502860,
        final_amount: 1257150
    },
    {
        serial_number: 3,
        landowner_name: 'देवयानी दयानंद म्हात्रे',
        old_survey_number: '357',
        survey_number: '67',
        group_number: '67/3/ब',
        cts_number: '338',
        total_area: 0.0450,
        acquired_area: 0.0067,
        land_type: 'शेती',
        land_classification: 'शेती/वर्ग -1',
        approved_rate: 98600000,
        market_value: 660620,
        final_amount: 1651550
    },
    {
        serial_number: 4,
        landowner_name: 'विदयाधर रामकृष्ण पाटील',
        old_survey_number: '357',
        survey_number: '67',
        group_number: '67/2',
        cts_number: '339',
        total_area: 0.2150,
        acquired_area: 0.0026,
        land_type: 'शेती',
        land_classification: 'शेती/वर्ग -1',
        approved_rate: 98600000,
        market_value: 256360,
        final_amount: 640900
    },
    {
        serial_number: 5,
        landowner_name: 'विदयाधर रामकृष्ण पाटील',
        old_survey_number: '357',
        survey_number: '67',
        group_number: '67/2',
        cts_number: '254',
        total_area: 0.2150,
        acquired_area: 0.0138,
        land_type: 'शेती',
        land_classification: 'शेती/वर्ग -1',
        approved_rate: 98600000,
        market_value: 1360680,
        final_amount: 3401700
    },
    {
        serial_number: 6,
        landowner_name: 'विदयाधर रामकृष्ण पाटील',
        old_survey_number: '357',
        survey_number: '67',
        group_number: '67/2',
        cts_number: '253',
        total_area: 0.2150,
        acquired_area: 0.0012,
        land_type: 'शेती',
        land_classification: 'शेती/वर्ग -1',
        approved_rate: 98600000,
        market_value: 118320,
        final_amount: 295800
    },
    {
        serial_number: 7,
        landowner_name: 'धनंजय खंडु म्हात्रे',
        old_survey_number: '357/4',
        survey_number: '67',
        group_number: '67/4/ब',
        cts_number: '240',
        total_area: 0.2350,
        acquired_area: 0.0139,
        land_type: 'शेती',
        land_classification: 'शेती/वर्ग -1',
        approved_rate: 98600000,
        market_value: 1370540,
        final_amount: 3426350
    },
    {
        serial_number: 8,
        landowner_name: 'दिपक यशवंत म्हात्रे, मनोज रघुनाथ भोईर, भिमाबाई यशवंत म्हात्रे',
        old_survey_number: '350',
        survey_number: '66',
        group_number: '66/1/अ',
        cts_number: '336',
        total_area: 0.0750,
        acquired_area: 0.0137,
        land_type: 'शेती',
        land_classification: 'शेती/वर्ग -1',
        approved_rate: 98600000,
        market_value: 1350820,
        final_amount: 3377050
    },
    {
        serial_number: 9,
        landowner_name: 'दिपक यशवंत म्हात्रे, मनोज रघुनाथ भोईर, भिमाबाई यशवंत म्हात्रे',
        old_survey_number: '350',
        survey_number: '66',
        group_number: '66/1/अ',
        cts_number: '334',
        total_area: 0.0750,
        acquired_area: 0.0017,
        land_type: 'शेती',
        land_classification: 'शेती/वर्ग -1',
        approved_rate: 98600000,
        market_value: 167620,
        final_amount: 419050
    },
    {
        serial_number: 10,
        landowner_name: 'दिपक यशवंत म्हात्रे, मनोज रघुनाथ भोईर, भिमाबाई यशवंत म्हात्रे',
        old_survey_number: '350',
        survey_number: '66',
        group_number: '66/1/अ',
        cts_number: '331',
        total_area: 0.0750,
        acquired_area: 0.0012,
        land_type: 'शेती',
        land_classification: 'शेती/वर्ग -1',
        approved_rate: 98600000,
        market_value: 118320,
        final_amount: 295800
    },
    // Adding a few more key records
    {
        serial_number: 11,
        landowner_name: 'दिपक यशवंत म्हात्रे, मनोज रघुनाथ भोईर, भिमाबाई यशवंत म्हात्रे',
        old_survey_number: '350',
        survey_number: '66',
        group_number: '66/1/अ',
        cts_number: '330',
        total_area: 0.0750,
        acquired_area: 0.0041,
        land_type: 'शेती',
        land_classification: 'शेती/वर्ग -1',
        approved_rate: 98600000,
        market_value: 404260,
        final_amount: 1010650
    },
    {
        serial_number: 12,
        landowner_name: 'पार्वती मनसुखलाल शुक्ल',
        old_survey_number: '351',
        survey_number: '65',
        group_number: '',
        cts_number: '320',
        total_area: 0.0237,
        acquired_area: 0.0045,
        land_type: 'शेती',
        land_classification: 'शेती/वर्ग -1',
        approved_rate: 98600000,
        market_value: 443700,
        final_amount: 1109250
    }
];

async function uploadManualData() {
    try {
        console.log('🚀 Manual Data Upload for Chandrapada Railway Project');
        console.log('====================================================');
        
        console.log(`📊 Uploading ${landownerData.length} landowner records...`);
        
        let successful = 0;
        let failed = 0;
        const errors = [];
        
        for (let i = 0; i < landownerData.length; i++) {
            const record = landownerData[i];
            
            // Convert to API format
            const landownerRecord = {
                project_id: 'demo-project',
                survey_number: `${record.survey_number}/${record.serial_number}`,
                landowner_name: record.landowner_name,
                area: record.total_area,
                acquired_area: record.acquired_area,
                rate: record.approved_rate,
                total_compensation: record.market_value,
                final_amount: record.final_amount,
                village: 'चंद्रपाडा',
                taluka: 'वसई',
                district: 'पालघर',
                land_type: record.land_type,
                old_survey_number: record.old_survey_number,
                group_number: record.group_number,
                cts_number: record.cts_number,
                serial_number: record.serial_number,
                kyc_status: 'pending',
                payment_status: 'pending',
                is_active: true
            };
            
            console.log(`🔄 Processing ${i + 1}/${landownerData.length}: ${record.landowner_name}`);
            
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
                    console.log(`✅ Survey: ${landownerRecord.survey_number} - ₹${landownerRecord.final_amount.toLocaleString()}`);
                } else {
                    const errorData = await response.text();
                    failed++;
                    errors.push(`${record.landowner_name}: ${errorData}`);
                    console.log(`❌ Failed: ${record.landowner_name.substring(0, 30)}...`);
                }
                
                // Small delay to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (error) {
                failed++;
                errors.push(`${record.landowner_name}: ${error.message}`);
                console.log(`❌ Error: ${record.landowner_name.substring(0, 30)}... - ${error.message}`);
            }
        }
        
        console.log('\n🎉 Upload Completed!');
        console.log('====================');
        console.log(`✅ Successful: ${successful}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📊 Total: ${landownerData.length}`);
        
        if (successful > 0) {
            console.log('\n💰 Total Compensation Summary:');
            const totalCompensation = landownerData.reduce((sum, record) => sum + record.final_amount, 0);
            console.log(`💸 Total Final Amount: ₹${totalCompensation.toLocaleString()}`);
            
            console.log('\n💡 Records have been uploaded to the database!');
            console.log('🔄 Please refresh your Land Records Manager to see the new data');
            
            // Now sync to blockchain
            console.log('\n🔗 Creating blockchain entries...');
            const blockchainResponse = await fetch(`${API_BASE_URL}/blockchain/bulk-sync-all-surveys`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer demo-jwt-token',
                    'x-demo-role': 'officer'
                },
                body: JSON.stringify({
                    officer_id: 'demo-officer',
                    project_id: 'demo-project'
                })
            });
            
            if (blockchainResponse.ok) {
                const blockchainResult = await blockchainResponse.json();
                console.log(`✅ Blockchain sync completed: ${blockchainResult.data?.successful || 0} records synced`);
            } else {
                console.log('⚠️ Blockchain sync failed, but data is in database');
            }
        }
        
        if (errors.length > 0 && errors.length <= 3) {
            console.log('\n⚠️ Errors:');
            errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error.substring(0, 100)}...`);
            });
        }
        
    } catch (error) {
        console.error('❌ Upload failed:', error.message);
    }
}

uploadManualData().catch(console.error);