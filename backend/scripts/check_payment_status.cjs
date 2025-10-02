const XLSX = require('xlsx');

function checkPaymentStatus() {
  try {
    const filePath = 'd:\\LandRecords for Villages\\DONGARE LAND FINAL AWARD.xlsx';
    
    console.log('=== Checking Payment Status in Dongare Excel ===');
    
    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON starting from row 4 (header row)
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Get headers from row 4 (index 3)
    const headers = rawData[3] || [];
    console.log('\n=== Headers (Row 4) ===');
    headers.forEach((header, index) => {
      if (header) {
        console.log(`Column ${index + 1}: ${header}`);
      }
    });
    
    // Look for payment status related columns
    console.log('\n=== Looking for Payment Status Columns ===');
    const paymentKeywords = ['status', 'paid', 'unpaid', 'pending', 'complete', 'payment', 'अदा', 'भुगतान', 'स्थिती'];
    
    headers.forEach((header, index) => {
      if (header) {
        const headerLower = header.toString().toLowerCase();
        const hasPaymentKeyword = paymentKeywords.some(keyword => 
          headerLower.includes(keyword.toLowerCase())
        );
        
        if (hasPaymentKeyword) {
          console.log(`*** POTENTIAL PAYMENT STATUS COLUMN ***`);
          console.log(`Column ${index + 1}: ${header}`);
        }
      }
    });
    
    // Check all data rows for payment status patterns
    console.log('\n=== Examining Data Rows for Payment Status ===');
    const dataRows = rawData.slice(4); // Skip header rows
    
    // Look at the last few columns which might contain status info
    const lastColumnIndex = headers.length - 1;
    const statusColumns = [lastColumnIndex - 2, lastColumnIndex - 1, lastColumnIndex];
    
    console.log('Checking last 3 columns for status information:');
    statusColumns.forEach(colIndex => {
      if (colIndex >= 0 && headers[colIndex]) {
        console.log(`\nColumn ${colIndex + 1}: ${headers[colIndex]}`);
        
        // Get unique values in this column
        const uniqueValues = new Set();
        dataRows.forEach(row => {
          if (row && row[colIndex]) {
            uniqueValues.add(row[colIndex]);
          }
        });
        
        console.log('Unique values:', Array.from(uniqueValues).slice(0, 10));
      }
    });
    
    // Check for any columns that might contain "paid" or "unpaid" values
    console.log('\n=== Searching for Paid/Unpaid Values ===');
    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      const columnValues = new Set();
      dataRows.forEach(row => {
        if (row && row[colIndex]) {
          const value = row[colIndex].toString().toLowerCase();
          if (value.includes('paid') || value.includes('unpaid') || 
              value.includes('pending') || value.includes('complete') ||
              value.includes('अदा') || value.includes('भुगतान')) {
            columnValues.add(row[colIndex]);
          }
        }
      });
      
      if (columnValues.size > 0) {
        console.log(`Column ${colIndex + 1} (${headers[colIndex]}) contains payment status:`);
        console.log('Values:', Array.from(columnValues));
      }
    }
    
    // Show sample data rows
    console.log('\n=== Sample Data Rows ===');
    dataRows.slice(0, 5).forEach((row, index) => {
      console.log(`Row ${index + 1}:`, row);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPaymentStatus();