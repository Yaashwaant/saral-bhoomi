const fs = require('fs');
const csv = require('csv-parser');

// Test the normalizeRow function
const normalizeRow = (row = {}) => {
  const r = { ...row };
  
  // Primary identification fields
  r['landowner_name'] = r['खातेदाराचे_नांव'] || r['ownerName'] || r['landownerName'] || r['name'] || '';
  r['survey_number'] = r['नविन_स.नं.'] || r['सर्वे_नं'] || r['स.नं./हि.नं./ग.नं.'] || r['Survey'] || r['surveyNumber'] || r['survey_no'] || r['survey'] || '';
  r['old_survey_number'] = r['जुना_स.नं.'] || r['old_survey_number'] || '';
  r['group_number'] = r['गट_नंबर'] || r['group_number'] || '';
  r['cts_number'] = r['सी.टी.एस._नंबर'] || r['cts_number'] || '';
  
  // Area fields
  r['area'] = r['गांव_नमुना_7/12_नुसार_जमिनीचे_क्षेत्र'] || r['क्षेत्र'] || r['नमुना_7_12_नुसार_जमिनीचे_क्षेत्र'] || r['Area'] || r['area'] || '';
  r['acquired_area'] = r['संपादित_जमिनीचे_क्षेत्र'] || r['संपादित_क्षेत्र'] || r['AcquiredArea'] || r['acquiredArea'] || r['acquired_area'] || '';
  
  // Land type fields
  r['land_type'] = r['जमिनीचा_प्रकार'] || r['land_type'] || '';
  r['land_type_classification'] = r['जमिनीचा_प्रकार_शेती_बिनशेती_धारणाधिकार'] || r['land_type_classification'] || '';
  
  // Financial fields
  r['rate'] = r['मंजुर_केलेला_दर'] || r['दर'] || r['Rate'] || r['rate'] || '';
  r['market_value'] = r['संपादीत_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमुल्य'] || r['market_value'] || '';
  r['compensation_section_26'] = r['कलम_26_नुसार_जमिनीचा_मोबदला'] || r['compensation_section_26'] || '';
  
  // Structures and improvements
  r['structures_count'] = r['बांधकामे_संख्या'] || r['structures_count'] || '0';
  r['structures_amount'] = r['बांधकामे_रक्कम'] || r['structures_amount'] || '0';
  r['forest_trees_count'] = r['वनझाडे_संख्या'] || r['forest_trees_count'] || '0';
  r['forest_trees_amount'] = r['वनझाडे_रक्कम'] || r['forest_trees_amount'] || '0';
  r['fruit_trees_count'] = r['फळझाडे_संख्या'] || r['fruit_trees_count'] || '0';
  r['fruit_trees_amount'] = r['फळझाडे_रक्कम'] || r['fruit_trees_amount'] || '0';
  r['wells_count'] = r['विहिरी_बोअरवेल_संख्या'] || r['wells_count'] || '0';
  r['wells_amount'] = r['विहिरी_बोअरवेल_रक्कम'] || r['wells_amount'] || '0';
  
  // Compensation calculations
  r['total_improvements_amount'] = r['एकुण_रक्कम'] || r['total_improvements_amount'] || '0';
  r['solatium'] = r['100_प्रतिशत_सोलेशियम'] || r['सोलेशियम_100'] || r['Solatium'] || r['solatium'] || '';
  r['final_compensation'] = r['निर्धारित_मोबदला'] || r['final_compensation'] || '';
  r['additional_compensation'] = r['वाढीव_मोबदला'] || r['additional_compensation'] || '';
  r['total_final_amount'] = r['एकुण_मोबदला'] || r['total_final_amount'] || '';
  r['deduction_amount'] = r['वजावट_रक्कम'] || r['deduction_amount'] || '';
  r['final_amount_to_pay'] = r['हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम'] || r['final_amount_to_pay'] || '';
  
  // Legacy fields for backward compatibility
  r['structure_trees_wells_amount'] = r['एकुण_रक्कम'] || r['संरचना_झाडे_विहिरी_रक्कम'] || r['structuresAmount'] || r['structures_amount'] || '0';
  r['total_compensation'] = r['कलम_26_नुसार_जमिनीचा_मोबदला'] || r['एकूण_मोबदला'] || r['एकुण_मोबदला'] || r['TotalAmount'] || r['totalCompensation'] || r['total_compensation'] || '';
  r['final_amount'] = r['हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम'] || r['अंतिम_रक्कम'] || r['FinalAmount'] || r['finalCompensation'] || '';
  
  // Location fields
  r['village'] = r['गांव'] || r['गाव'] || r['village'] || '';
  r['taluka'] = r['तालुका'] || r['तहसील'] || r['Tehsil'] || r['taluka'] || '';
  r['district'] = r['जिल्हा'] || r['District'] || r['district'] || '';
  
  // Additional information
  r['remarks'] = r['शेरा'] || r['remarks'] || '';
  
  // Contact fields (Marathi ↔ English)
  r['contact_phone'] = r['phone'] || r['मोबाईल'] || r['फोन'] || '';
  r['contact_email'] = r['email'] || r['ईमेल'] || '';
  r['contact_address'] = r['address'] || r['पत्ता'] || '';
  
  // Bank fields (Marathi ↔ English)
  r['bank_account_number'] = r['accountNumber'] || r['खाते_क्रमांक'] || '';
  r['bank_ifsc_code'] = r['ifscCode'] || r['IFSC'] || r['आयएफएससी'] || '';
  r['bank_name'] = r['bankName'] || r['बँक_नाव'] || '';
  r['bank_branch_name'] = r['branchName'] || r['शाखा'] || '';
  r['bank_account_holder_name'] = r['accountHolderName'] || r['खातेदाराचे_नांव'] || r['खातेधारक_नाव'] || '';
  
  // Tribal fields: STRICTLY decide from Marathi column 'आदिवासी'
  const rawTribal = r['आदिवासी'];
  const truthyVals = ['होय','true','1','yes','y'];
  const falsyVals = ['नाही','false','0','no','n'];
  let isTribal = false;
  if (typeof rawTribal === 'string') {
    const v = rawTribal.trim().toLowerCase();
    isTribal = truthyVals.includes(v) ? true : (falsyVals.includes(v) ? false : false);
  } else if (typeof rawTribal === 'boolean') {
    isTribal = rawTribal;
  } else if (typeof rawTribal === 'number') {
    isTribal = rawTribal === 1;
  }
  r['is_tribal'] = isTribal;
  // Correct mapping: certificate from 'आदिवासी_प्रमाणपत्र_क्रमांक'; lag from 'आदिवासी_लाग'/'लागू'
  r['tribal_certificate_no'] = r['tribalCertificateNo'] || r['आदिवासी_прमाणपत्र_क्रमांक'] || r['आदिवासी_प्रमाणपत्र_क्रमांक'] || r['tribalCertNo'] || '';
  r['tribal_lag'] = r['tribalLag'] || r['आदिवासी_लाग'] || r['लागू'] || '';
  
  // Trim canonical fields if present
  [
    'landowner_name','survey_number','old_survey_number','group_number','cts_number','area','acquired_area','land_type','land_type_classification',
    'rate','market_value','compensation_section_26','structures_count','structures_amount','forest_trees_count','forest_trees_amount',
    'fruit_trees_count','fruit_trees_amount','wells_count','wells_amount','total_improvements_amount','solatium','final_compensation',
    'additional_compensation','total_final_amount','deduction_amount','final_amount_to_pay','structure_trees_wells_amount',
    'total_compensation','final_amount','village','taluka','district','remarks',
    'contact_phone','contact_email','contact_address','bank_account_number','bank_ifsc_code','bank_name','bank_branch_name','bank_account_holder_name',
    'tribal_certificate_no','tribal_lag'
  ].forEach((k) => { if (r[k] !== undefined && r[k] !== null) r[k] = String(r[k]).trim(); });
  return r;
};

// Test CSV parsing
const records = [];
let rowNumber = 0;

fs.createReadStream('../sample_parishisht_k.csv')
  .pipe(csv())
  .on('data', (row) => {
    rowNumber++;
    console.log(`\n--- Row ${rowNumber} ---`);
    console.log('Raw row keys:', Object.keys(row));
    console.log('Raw row values:', Object.values(row).slice(0, 5)); // First 5 values
    
    const normalizedRow = normalizeRow(row);
    console.log('Normalized landowner_name:', normalizedRow.landowner_name);
    console.log('Normalized survey_number:', normalizedRow.survey_number);
    
    // Check if row should be processed
    if (!normalizedRow.landowner_name && !normalizedRow.survey_number) {
      console.log('❌ Skipping row - no landowner_name or survey_number');
      return;
    }
    
    console.log('✅ Row will be processed');
    records.push(normalizedRow);
  })
  .on('end', () => {
    console.log(`\n📊 Total records processed: ${records.length}`);
    console.log('First record:', records[0]);
  });
