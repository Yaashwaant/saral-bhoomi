// Land Record Models and Interfaces

export interface LandRecord2 {
  _id?: string;
  id?: string;
  अ_क्र?: string; // Serial Number
  खातेदाराचे_नांव?: string; // Owner Name
  जुना_स_नं?: string; // Old Survey Number
  नविन_स_नं?: string; // New Survey Number
  गट_नंबर?: string; // Group Number
  सी_टी_एस_नं?: string; // CTS Number
  Village?: string;
  Taluka?: string;
  District?: string;
  गांव_नमुना_7_12_नुसार_जमिनीचे_क्षेत्र_हे_आर?: number; // Land Area as per 7/12
  संपादित_जमिनीचे_क्षेत्र_चौ_मी_हेक्टर_आर?: number; // Acquired Land Area
  जमिनीचा_प्रकार?: string; // Land Type
  जमिनीचा_प्रकार_शेती_बिनशेती_धारणाधिकार?: string; // Land Classification
  मंजुर_केलेला_दर_प्रति_हेक्टर_रक्कम_रुपये?: number; // Approved Rate per Hectare
  संपादीत_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमुल्य_र_रू?: number; // Market Value
  कलम_26_नुसार_जमिनीचा_मोबदला_9X10?: number; // Land Compensation as per Section 26
  एकुण_रक्कम_14_23?: number; // Total Amount 14-23
  सोलेशियम_दिलासा_रक्कम?: number; // Solatium Amount
  निर्धारित_मोबदला_26?: number; // Determined Compensation 26
  एकूण_रक्कमेवर_25_वाढीव_मोबदला?: number; // Enhanced Compensation 25%
  एकुण_मोबदला_26_27?: number; // Total Compensation 26-27
  हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम_रुपये?: number; // Final Payable Compensation
  मोबदला_वाटप_तपशिल?: string; // Compensation Distribution Details
  project_id?: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  // Additional fields that might be present in the data
  [key: string]: any;
}

export interface LandRecord {
  id?: string;
  survey_number: string;
  landowner_name: string;
  area: number;
  village: string;
  taluka: string;
  district: string;
  contact_phone?: string;
  contact_email?: string;
  is_tribal: boolean;
  rate?: number;
  total_compensation?: number;
  kyc_status: 'pending' | 'approved' | 'rejected';
  payment_status: 'pending' | 'initiated' | 'completed';
  blockchain_verified?: boolean;
  blockchain_status?: 'verified' | 'pending' | 'compromised' | 'not_on_blockchain';
  new_survey_number?: string;
  cts_number?: string;
  serial_number?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'officer' | 'agent' | 'field_officer';
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}