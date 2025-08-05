# 📋 CSV Upload Guide for SARAL Bhoomi

## 🎯 **Available Sample Files**

### 1. **Basic Template** (`sample_landowner_data.csv`)
- Contains essential required columns
- 10 sample landowner records
- Perfect for testing the system

### 2. **Detailed Template** (`landowner_template_detailed.csv`)
- Contains all required columns plus additional fields
- Includes bank details, contact information
- More comprehensive for real-world use

## 📊 **Required Column Headers (Marathi)**

| Column Name | English Translation | Description | Required |
|-------------|-------------------|-------------|----------|
| `खातेदाराचे_नांव` | Landowner Name | Full name of the landowner | ✅ |
| `सर्वे_नं` | Survey Number | Survey number of the land | ✅ |
| `क्षेत्र` | Area | Total area in hectares | ✅ |
| `संपादित_क्षेत्र` | Acquired Area | Area being acquired | ✅ |
| `दर` | Rate | Rate per hectare | ✅ |
| `संरचना_झाडे_विहिरी_रक्कम` | Structures Amount | Compensation for structures/trees/wells | ✅ |
| `एकूण_मोबदला` | Total Compensation | Total compensation amount | ✅ |
| `सोलेशियम_100` | Solatium | 100% solatium amount | ✅ |
| `अंतिम_रक्कम` | Final Amount | Final compensation amount | ✅ |
| `village` | Village | Village name | ✅ |
| `taluka` | Taluka | Taluka name | ✅ |
| `district` | District | District name | ✅ |

## 🚀 **How to Upload**

### **Step 1: Login to the System**
1. Go to `http://localhost:5173/saral/login`
2. Use demo credentials:
   - **Admin**: `admin@saral.gov.in` / `admin`
   - **Officer**: `officer@saral.gov.in` / `officer`
   - **Agent**: `agent@saral.gov.in` / `agent`

### **Step 2: Navigate to Notice Generator**
1. After login, go to the dashboard
2. Click on "Notice Generator" or "Enhanced Notice Generator"
3. Select your project

### **Step 3: Upload CSV File**
1. Click on "फाईल अपलोड करा" (File Upload)
2. Drag and drop your CSV file or click to browse
3. Supported formats: `.csv`, `.xlsx`
4. Maximum size: 10MB

### **Step 4: Validate and Process**
1. The system will automatically validate the file
2. Check for any validation errors
3. Map CSV columns to template variables if needed
4. Click "प्रक्रिया करा" (Process) to generate notices

## ⚠️ **Common Issues and Solutions**

### **Issue 1: Missing Required Headers**
**Error**: "Missing required headers: खातेदाराचे_नांव, सर्वे_नं..."
**Solution**: Ensure your CSV has all required column headers exactly as shown above

### **Issue 2: Invalid Data Format**
**Error**: "Invalid data in column..."
**Solution**: 
- Numbers should be in decimal format (e.g., 2.50, not 2,50)
- Currency amounts should not have commas
- Survey numbers can be text or numbers

### **Issue 3: File Encoding Issues**
**Error**: "Unable to read file"
**Solution**: 
- Save CSV file with UTF-8 encoding
- Use the provided sample files as templates

## 📝 **Data Format Guidelines**

### **Area Fields** (`क्षेत्र`, `संपादित_क्षेत्र`)
- Format: Decimal numbers (e.g., 2.50, 1.75)
- Unit: Hectares
- Example: `2.50` (2 hectares 50 ares)

### **Amount Fields** (`दर`, `संरचना_झाडे_विहिरी_रक्कम`, etc.)
- Format: Numbers without commas
- Unit: Indian Rupees (₹)
- Example: `15000`, `425000`

### **Survey Numbers** (`सर्वे_नं`)
- Can be text or numbers
- Examples: `123`, `A-45`, `12/3`

### **Location Fields** (`village`, `taluka`, `district`)
- Use consistent spelling
- Avoid special characters
- Examples: `उंबरपाडा`, `नांदेड`

## 🔧 **Creating Your Own CSV File**

1. **Use Excel or Google Sheets**
2. **Copy the header row** from the sample files
3. **Add your data** following the format guidelines
4. **Save as CSV** with UTF-8 encoding
5. **Test with a small dataset** first

## 📞 **Support**

If you encounter any issues:
1. Check the validation errors carefully
2. Compare your file with the sample files
3. Ensure all required columns are present
4. Verify data formats match the guidelines

## 🎉 **Success Indicators**

When your upload is successful, you should see:
- ✅ Green checkmark in validation
- ✅ Correct record count
- ✅ No error messages
- ✅ Option to proceed with notice generation

---

**Note**: The system supports both Marathi and English column headers, but Marathi headers are recommended for better localization support. 