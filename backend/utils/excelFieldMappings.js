/**
 * Field mappings for the new Marathi Excel format (ACTUAL PARISHISHT-K FORMAT)
 * Maps new Excel column names to database field names
 */

export const NEW_EXCEL_FIELD_MAPPINGS = {
  // Basic identification fields
  'अ.क्र': 'serial_number',
  'खातेदाराचे नांव': 'landowner_name',
  'जुना स.नं.': 'old_survey_number',
  'नविन स.नं.': 'new_survey_number', 
  'गट नंबर': 'group_number',
  'सी.टी.एस. नंबर': 'cts_number',
  
  // Area fields (CORRECTED FROM ACTUAL FILE)
  'गांव नमुना 7/12 नुसार जमिनीचे क्षेत्र (हे.आर)': 'total_area_village_record',
  'संपादित जमिनीचे क्षेत्र (चौ.मी/हेक्टर आर)': 'acquired_area_sqm_hectare',
  
  // Land type (CORRECTED)
  'जमिनीचा प्रकार': 'land_category',
  'जमिनीचा प्रकार शेती/ बिनशेती/ धारणाधिकार': 'land_type_classification',
  
  // Rate and compensation fields (CORRECTED)
  'मंजुर केलेला दर (प्रति हेक्टर) रक्कम रुपये': 'approved_rate_per_hectare',
  'संपादीत होणाऱ्या जमिनीच्या क्षेत्रानुसार येणारे बाजारमुल्य र.रू': 'market_value_acquired_area',
  'कलम 26 (2) नुसार गावास लागु असलेले गणक Factor (अ.क्र. 5 X 8)': 'section_26_2_factor',
  'कलम 26 नुसार जमिनीचा मोबदला (9X10)': 'section_26_compensation',
  
  // Structure compensation fields (WITH ACTUAL COLUMN NAMES)
  'बांधकामे': 'buildings_count',
  'संख्या': 'buildings_count', // Alternative name
  'रक्कम रुपये': 'buildings_amount',
  'वनझाडे': 'forest_trees_count',
  'झाडांची संख्या': 'forest_trees_count', // Alternative name
  'झाडांची रक्कम रु.': 'forest_trees_amount',
  'फळझाडे': 'fruit_trees_count', 
  'झाडांची संख्या.1': 'fruit_trees_count', // Alternative name
  'झाडांची रक्कम रु..1': 'fruit_trees_amount',
  'विहिरी/बोअरवेल': 'wells_borewells_count',
  'एकुण रक्कम रुपये (16+18+ 20+22)': 'total_structures_amount',
  
  // Final compensation calculations (CORRECTED BASED ON ACTUAL FORMAT)
  'एकुण रक्कम (14+23)': 'total_compensation_amount',
  '100 %  सोलेशियम (दिलासा रक्कम) सेक्शन 30 (1)  RFCT-LARR 2013 अनुसूचि 1 अ.नं. 5': 'solatium_100_percent',
  'निर्धारित मोबदला 26 = (24+25)': 'determined_compensation',
  'एकूण रक्कमेवर  25%  वाढीव मोबदला': 'additional_25_percent_compensation',
  'एकुण मोबदला (26+ 27)': 'total_final_compensation',
  'वजावट रक्कम रुपये': 'deduction_amount',
  'हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये (अ.क्र. 28 वजा 29)': 'final_payable_amount',
  'शेरा': 'remarks',
  
  // Additional fields found in actual data
  'शेती': 'agricultural_type',
  'शेती/वर्ग -1': 'agricultural_classification',
  'मोबदला वाटप तपशिल': 'payment_status'
};

/**
 * Legacy field mappings (for backward compatibility)
 */
export const LEGACY_FIELD_MAPPINGS = {
  'खातेदाराचे_नांव': 'landowner_name',
  'ownerName': 'landowner_name',
  'landownerName': 'landowner_name',
  'name': 'landowner_name',
  
  'सर्वे_नं': 'survey_number',
  'स.नं./हि.नं./ग.नं.': 'survey_number',
  'Survey': 'survey_number',
  'surveyNumber': 'survey_number',
  'survey_no': 'survey_number',
  'survey': 'survey_number',
  
  'क्षेत्र': 'area',
  'नमुना_7_12_नुसार_जमिनीचे_क्षेत्र': 'area',
  'Area': 'area',
  'area': 'area',
  
  'संपादित_क्षेत्र': 'acquired_area',
  'संपादित_जमिनीचे_क्षेत्र': 'acquired_area',
  'AcquiredArea': 'acquired_area',
  'acquiredArea': 'acquired_area',
  'acquired_area': 'acquired_area',
  
  'दर': 'rate',
  'मंजुर_केलेला_दर': 'rate',
  'Rate': 'rate',
  'rate': 'rate',
  
  'संरचना_झाडे_विहिरी_रक्कम': 'structure_trees_wells_amount',
  'structuresAmount': 'structure_trees_wells_amount',
  'structures_amount': 'structure_trees_wells_amount',
  
  'एकूण_मोबदला': 'total_compensation',
  'एकुण_मोबदला': 'total_compensation',
  'TotalAmount': 'total_compensation',
  'totalCompensation': 'total_compensation',
  'total_compensation': 'total_compensation',
  
  'सोलेशियम_100': 'solatium',
  'Solatium': 'solatium',
  'solatium': 'solatium',
  
  'अंतिम_रक्कम': 'final_amount',
  'FinalAmount': 'final_amount',
  'finalCompensation': 'final_amount',
  
  'village': 'village',
  'गांव': 'village',
  'गाव': 'village',
  
  'taluka': 'taluka',
  'तालुका': 'taluka',
  'तहसील': 'taluka',
  'Tehsil': 'taluka',
  
  'district': 'district',
  'जिल्हा': 'district',
  'District': 'district',
  
  'phone': 'contact_phone',
  'मोबाईल': 'contact_phone',
  'फोन': 'contact_phone',
  
  'email': 'contact_email',
  'ईमेल': 'contact_email',
  
  'address': 'contact_address',
  'पत्ता': 'contact_address'
};

/**
 * Maps new Excel fields to legacy system fields for backward compatibility
 */
export const NEW_TO_LEGACY_MAPPING = {
  // Use new survey number as primary survey number
  'new_survey_number': 'survey_number',
  'नविन स.नं.': 'survey_number',
  
  // Map new area field to legacy area
  'total_area_village_record': 'area',
  'गांव नमुना 7/12 नुसार जमिनीचे क्षेत्र (हे.आर)': 'area',
  
  // Map new acquired area to legacy
  'acquired_area_sqm_hectare': 'acquired_area', 
  'संपादित जमिनीचे क्षेत्र (चौ.मी/हेक्टर आर)': 'acquired_area',
  
  // Map new rate field to legacy
  'approved_rate_per_hectare': 'rate',
  'मंजुर केलेला दर (प्रति हेक्टर) रक्कम रुपये': 'rate',
  
  // Map final compensation fields
  'final_payable_amount': 'final_amount',
  'हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये (अ.क्र. 28 वजा 29)': 'final_amount',
  
  'total_compensation_amount': 'total_compensation',
  'एकुण रक्कम (14+23)': 'total_compensation',
  
  'solatium_100_percent': 'solatium',
  '100 %  सोलेशियम (दिलासा रक्कम) सेक्शन 30 (1)  RFCT-LARR 2013 अनुसूचि 1 अ.नं. 5': 'solatium',
  
  'total_structures_amount': 'structure_trees_wells_amount',
  'एकुण रक्कम रुपये (16+18+ 20+22)': 'structure_trees_wells_amount'
};

/**
 * Field mappings for Parikshit 16 format (16-column format)
 * Maps Parikshit 16 Excel column names to database field names
 */
export const PARIKSHIT_16_FIELD_MAPPINGS = {
  // Basic identification fields
  'अ.क्र': 'serial_number',
  'खातेदाराचे नांव': 'landowner_name',
  'स.नं./हि.नं./ग.नं.': 'survey_number',
  'क्षेत्र (हेक्टर)': 'area_hectares',
  'जमिनीचा प्रकार': 'land_type',
  'मंजूर दर (रु/हे)': 'approved_rate_per_hectare',
  'बाजारमूल्य': 'market_value',
  'सोलेशियम 100%': 'solatium_100_percent',
  'एकूण मोबदला': 'total_compensation',
  'बांधकामे रक्कम': 'buildings_amount',
  'झाडे रक्कम': 'trees_amount',
  'विहिरी रक्कम': 'wells_amount',
  'एकूण रक्कम': 'total_structures_amount',
  'एकूण अदा करण्यायोग्य रक्कम': 'final_payable_amount',
  'बँक खाते क्रमांक': 'bank_account_number',
  'IFSC कोड': 'bank_ifsc_code'
};

/**
 * Enhanced normalize function that handles both old and new formats
 */
export const normalizeRowEnhanced = (row = {}) => {
  const r = { ...row };
  
  // First try Parikshit 16 format mappings
  Object.keys(PARIKSHIT_16_FIELD_MAPPINGS).forEach(newField => {
    if (r[newField] !== undefined && r[newField] !== null && r[newField] !== '') {
      const mappedField = PARIKSHIT_16_FIELD_MAPPINGS[newField];
      r[mappedField] = r[newField];
    }
  });
  
  // Then try new Excel format mappings
  Object.keys(NEW_EXCEL_FIELD_MAPPINGS).forEach(newField => {
    if (r[newField] !== undefined && r[newField] !== null && r[newField] !== '') {
      const mappedField = NEW_EXCEL_FIELD_MAPPINGS[newField];
      r[mappedField] = r[newField];
    }
  });
  
  // Then apply new-to-legacy mappings
  Object.keys(NEW_TO_LEGACY_MAPPING).forEach(newField => {
    if (r[newField] !== undefined && r[newField] !== null && r[newField] !== '') {
      const legacyField = NEW_TO_LEGACY_MAPPING[newField];
      r[legacyField] = r[newField];
    }
  });
  
  // Finally apply legacy mappings for backward compatibility
  Object.keys(LEGACY_FIELD_MAPPINGS).forEach(oldField => {
    if (r[oldField] !== undefined && r[oldField] !== null && r[oldField] !== '') {
      const standardField = LEGACY_FIELD_MAPPINGS[oldField];
      r[standardField] = r[oldField];
    }
  });
  
  // Ensure landowner name is properly mapped
  r['landowner_name'] = r['landowner_name'] || r['खातेदाराचे नांव'] || r['खातेदाराचे_नांव'] || r['ownerName'] || r['landownerName'] || r['name'] || '';
  
  // Ensure survey number (prefer new over old)
  r['survey_number'] = r['survey_number'] || r['नविन स.नं.'] || r['जुना स.नं.'] || r['स.नं./हि.नं./ग.नं.'] || r['सर्वे_नं'] || r['Survey'] || r['surveyNumber'] || r['survey_no'] || r['survey'] || '';
  
  // Area mappings with new format priority
  r['area'] = r['area'] || r['total_area_village_record'] || r['क्षेत्र'] || r['नमुना_7_12_नुसार_जमिनीचे_क्षेत्र'] || r['Area'] || '';
  
  r['acquired_area'] = r['acquired_area'] || r['acquired_area_sqm_hectare'] || r['संपादित_क्षेत्र'] || r['संपादित_जमिनीचे_क्षेत्र'] || r['AcquiredArea'] || r['acquiredArea'] || '';
  
  // Rate with new format priority
  r['rate'] = r['rate'] || r['approved_rate_per_hectare'] || r['दर'] || r['मंजुर_केलेला_दर'] || r['Rate'] || '';
  
  // Compensation amounts with new format priority
  r['total_compensation'] = r['total_compensation'] || r['total_compensation_amount'] || r['एकूण_मोबदला'] || r['एकुण_मोबदला'] || r['TotalAmount'] || r['totalCompensation'] || '';
  
  r['solatium'] = r['solatium'] || r['solatium_100_percent'] || r['सोलेशियम_100'] || r['Solatium'] || '';
  
  r['final_amount'] = r['final_amount'] || r['final_payable_amount'] || r['अंतिम_रक्कम'] || r['FinalAmount'] || r['finalCompensation'] || '';
  
  r['structure_trees_wells_amount'] = r['structure_trees_wells_amount'] || r['total_structures_amount'] || r['संरचना_झाडे_विहिरी_रक्कम'] || r['structuresAmount'] || r['structures_amount'] || '0';
  
  // Location fields
  r['village'] = r['village'] || r['गांव'] || r['गाव'] || '';
  r['taluka'] = r['taluka'] || r['तालुका'] || r['तहसील'] || r['Tehsil'] || '';
  r['district'] = r['district'] || r['जिल्हा'] || r['District'] || '';
  
  // Contact fields
  r['contact_phone'] = r['contact_phone'] || r['phone'] || r['मोबाईल'] || r['फोन'] || '';
  r['contact_email'] = r['contact_email'] || r['email'] || r['ईमेल'] || '';
  r['contact_address'] = r['contact_address'] || r['address'] || r['पत्ता'] || '';
  
  // Additional new format fields
  r['old_survey_number'] = r['old_survey_number'] || r['जुना स.नं.'] || '';
  r['group_number'] = r['group_number'] || r['गट नंबर'] || '';
  r['cts_number'] = r['cts_number'] || r['सी.टी.एस. नंबर'] || '';
  r['land_type_classification'] = r['land_type_classification'] || r['जमिनीचा प्रकार शेती/ बिनशेती/ धारणाधिकार'] || '';
  
  // Payment status mapping (Marathi -> internal)
  r['payment_status'] = r['payment_status'] || r['मोबदला वाटप तपशिल'] || '';

  // Normalize payment_status values (e.g., 'paid'/'unpaid' -> 'completed'/'pending')
  if (typeof r['payment_status'] === 'string') {
    const ps = r['payment_status'].trim().toLowerCase();
    if (ps === 'paid') {
      r['payment_status'] = 'completed';
    } else if (ps === 'unpaid') {
      r['payment_status'] = 'pending';
    }
  }
  
  return r;
};
