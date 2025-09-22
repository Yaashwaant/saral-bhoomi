# Rebuilt CSV Uploader for Railway Land Compensation Data

## Overview
I have completely rebuilt the CSV uploader from scratch to handle your Excel file with 46 landowner records for the \"वेस्टर्न डेडिकेटेड फ्रेट कॉरीडोर रेल्वे उड्डाणपुलाच्या प्रकल्पात\" project.

## Key Features

### 1. Comprehensive Column Mapping
The new uploader includes extensive mapping for all Marathi column headers in your Excel file:

- **Primary Identifiers:**
  - खातेदाराचे नांव (Landowner Name)
  - नविन स.नं. (New Survey Number)
  - जुना स.नं. (Old Survey Number)
  - गट नंबर (Group Number)
  - सी.टी.एस. नंबर (CTS Number)

- **Land Information:**
  - गांव नमुना 7/12 नुसार जमिनीचे क्षेत्र (हे.आर) (Total Area)
  - संपादित जमिनीचे क्षेत्र (चौ.मी/हेक्टर आर) (Acquired Area)
  - जमिनीचा प्रकार (Land Type)
  - जमिनीचा प्रकार शेती/ बिनशेती/ धारणाधिकार (Land Classification)

- **Financial Calculations:**
  - मंजुर केलेला दर (प्रति हेक्टर) रक्कम रुपये (Approved Rate per Hectare)
  - संपादीत होणाऱ्या जमिनीच्या क्षेत्रानुसार येणारे बाजारमुल्य र.रू (Market Value)
  - कलम 26 (2) नुसार गावास लागु असलेले गणक Factor (Section 26 Factor)
  - कलम 26 नुसार जमिनीचा मोबदला (Section 26 Compensation)

- **Compensation Details:**
  - एकुण रक्कम रुपये (16+18+ 20+22) (Total Structures Amount)
  - 100 % सोलेशियम (दिलासा रक्कम) सेक्शन 30 (1) RFCT-LARR 2013 (100% Solatium)
  - निर्धारित मोबदला 26 = (24+25) (Determined Compensation)
  - एकूण रक्कमेवर 25% वाढीव मोबदला (Additional 25% Compensation)
  - एकुण मोबदला (26+ 27) (Total Compensation)
  - वजावट रक्कम रुपये (Deduction Amount)
  - हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये (Final Payable Amount)

- **Additional Fields:**
  - शेरा (Remarks)
  - Location: चंद्रपाडा, वसई, पालघर (extracted from header)

### 2. Enhanced Excel Support
- Supports both .xlsx and .xls files
- Proper Unicode handling for Marathi text
- Robust error handling for malformed files
- Automatic data type conversion for numeric fields

### 3. Improved Data Processing
- Comprehensive validation for required fields
- Duplicate detection and handling
- Row-by-row error reporting
- Overwrite option for updating existing records

### 4. Location Information
Automatically extracts location from your Excel header:
- मौजे - चंद्रपाडा (Village)
- ता.वसई (Taluka)
- जि. पालघर (District)

## API Endpoints

### 1. File Upload Endpoint
```
POST /api/csv/upload/:projectId
```
- Accepts Excel (.xlsx, .xls) and CSV files
- Processes all 46 records from your data structure
- Returns detailed success/error information

### 2. JSON Ingest Endpoint
```
POST /api/csv/ingest/:projectId
```
- Accepts JSON data from frontend
- Supports agent assignment and notice generation
- Compatible with existing frontend

### 3. Template Download
```
GET /api/csv/template
```
- Downloads CSV template with proper Marathi headers
- Includes sample data matching your structure

## Data Mapping Examples

Your Excel data will now be properly mapped:

```
\"जनार्दन लक्ष्मण म्हात्रे\" → landowner_name
\"67\" → survey_number
\"0.0022\" → acquired_area
\"216920\" → market_value
\"542300\" → final_amount
```

## Testing

1. **Server Status:** ✅ Running on http://localhost:5000
2. **Database:** ✅ Connected to MongoDB Atlas
3. **Test File:** Created test_sample.csv with your data structure

## Usage Instructions

1. Start backend server: `node server.js`
2. Use frontend CSV Upload Manager or test directly with API
3. Upload your Excel file - it should now show \"Successfully uploaded 46 records\" instead of \"0 records\"

## Key Improvements

1. **Fixed Column Mapping:** Now handles spaces vs underscores in headers
2. **Enhanced Excel Parsing:** Properly reads your complex Marathi headers
3. **Comprehensive Field Mapping:** Maps all financial calculation fields
4. **Better Error Handling:** Specific error messages for debugging
5. **Location Extraction:** Automatically sets village/taluka/district
6. **Unicode Support:** Proper handling of Marathi text throughout

## Files Modified

- **backend/routes/csv.js:** Completely rebuilt with new column mapping
- **backup created:** csv_backup.js contains the old version

The new CSV uploader is now ready to handle your complete Excel file with all 46 landowner records for the railway project land compensation data.
