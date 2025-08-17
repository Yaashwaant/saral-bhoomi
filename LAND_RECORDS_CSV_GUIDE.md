# Land Records CSV Upload Guide

## 📁 Sample File
The file `sample_land_records.csv` contains 10 sample land records that you can use to test the Land Records Management system.

## 🗂️ CSV Structure

### Required Fields (marked with * in the form)
- **survey_number*** - Unique survey number (e.g., SN001, SN002)
- **landowner_name*** - Name of the landowner
- **area*** - Total land area in hectares
- **village*** - Village name
- **taluka*** - Taluka name  
- **district*** - District name

### Optional Fields
- **acquired_area** - Area to be acquired in hectares
- **rate** - Rate per hectare in rupees
- **structure_trees_wells_amount** - Value of structures, trees, wells
- **total_compensation** - Total compensation amount
- **solatium** - Solatium amount (usually 10% of compensation)
- **final_amount** - Final total amount
- **contact_phone** - Landowner's phone number
- **contact_email** - Landowner's email address
- **contact_address** - Landowner's address
- **is_tribal** - Boolean (true/false) for tribal classification
- **tribal_certificate_no** - Tribal certificate number (if applicable)
- **tribal_lag** - Tribal LAG number (if applicable)
- **bank_account_number** - Bank account number
- **bank_ifsc_code** - Bank IFSC code
- **bank_name** - Bank name
- **bank_branch_name** - Bank branch name
- **bank_account_holder_name** - Account holder name
- **assigned_agent** - Name of assigned field agent
- **notes** - Additional notes or description

## 📊 Sample Data Includes

### Land Types
- Agricultural land with irrigation
- Land with mango orchard
- Tribal land with forest cover
- Land near highway
- Land with well and pump
- Small agricultural plots
- Land with coconut trees
- Land with natural water sources
- Land with seasonal crops
- Land with good soil quality

### Tribal Classification
- **Non-Tribal**: 8 records (SN001, SN002, SN004, SN005, SN006, SN007, SN009, SN010)
- **Tribal**: 2 records (SN003, SN008) with certificate numbers TC001/TC002 and LAG001/LAG002

### Geographic Distribution
- **Village**: उंबरपाडा (Umbarpada)
- **Taluka**: दहाणू (Dahanu)
- **District**: पालघर (Palghar)

## 🚀 How to Use

### 1. Download Template
- Go to "Land Records Management" tab
- Click "Download Template" button
- This will download the CSV template with headers

### 2. Prepare Your Data
- Use the sample file as a reference
- Fill in your actual land records data
- Ensure required fields are completed
- Use proper formatting for numbers and dates

### 3. Upload CSV
- Select your project
- Go to "CSV Upload" tab
- Click "Choose File" and select your CSV
- Click "Upload CSV" button

### 4. Verify Upload
- Check the "Land Records" table below
- Verify all records are displayed correctly
- Check that data appears in "Notice Generator" tab

## ⚠️ Important Notes

### Data Validation
- Survey numbers must be unique
- Area values should be positive numbers
- Phone numbers should include country code (+91)
- Email addresses should be valid format
- Boolean fields (is_tribal) should be true/false

### File Format
- Use CSV format (.csv extension)
- Include header row with field names
- Use commas as separators
- Enclose text fields with quotes if they contain commas
- Use UTF-8 encoding for Marathi text

### Field Mappings
The system automatically maps these fields:
- `survey_number` → Survey Number
- `landowner_name` → Landowner Name  
- `area` → Total Area
- `village` → Village
- `taluka` → Taluka
- `district` → District

## 🔄 Data Flow

1. **Upload** → CSV processed and stored in database
2. **Land Records Tab** → View and manage uploaded records
3. **Notice Generator Tab** → Use land records for notice generation
4. **JMR/Award Tabs** → Link land records to measurements and awards
5. **Payment Processing** → Track compensation and payment status

## 📞 Support

If you encounter any issues:
1. Check the console for error messages
2. Verify CSV format matches the template
3. Ensure all required fields are filled
4. Check that survey numbers are unique

## 📋 Example Row
```csv
SN001,रामराव पाटील,2.5,2.0,500000,150000,1400000,140000,1540000,उंबरपाडा,दहाणू,पालघर,+91 9876543210,ram.patil@email.com,"उंबरपाडा, दहाणू, पालघर",false,,,1234567890,SBIN0001234,State Bank of India,दहाणू ब्रांच,रामराव पाटील,राजेश पाटील,Agricultural land with good irrigation
```

This sample file is ready to use and will help you understand the expected data format for successful land records uploads.
