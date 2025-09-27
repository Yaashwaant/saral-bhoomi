import pdfplumber
import re
import json

def extract_pdf_structure(pdf_path):
    """Extract text and table structure from PDF to identify required fields"""
    
    fields_found = set()
    table_headers = []
    all_text = []
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            print(f"PDF has {len(pdf.pages)} pages")
            
            for page_num, page in enumerate(pdf.pages, 1):
                print(f"\n--- Page {page_num} ---")
                
                # Extract text
                text = page.extract_text()
                if text:
                    all_text.append(text)
                    print("Text content:")
                    print(text[:500] + "..." if len(text) > 500 else text)
                
                # Extract tables
                tables = page.extract_tables()
                if tables:
                    print(f"\nFound {len(tables)} tables on page {page_num}")
                    for table_num, table in enumerate(tables, 1):
                        print(f"\nTable {table_num}:")
                        if table and len(table) > 0:
                            # First row is likely headers
                            headers = table[0] if table[0] else []
                            print("Headers:", headers)
                            table_headers.extend([h for h in headers if h and h.strip()])
                            
                            # Show first few rows
                            for row_num, row in enumerate(table[:5], 1):
                                print(f"Row {row_num}: {row}")
                
                # Look for form fields or labels
                # Common Marathi/Hindi field patterns
                field_patterns = [
                    r'सर्वे\s*नंबर|Survey\s*No|Survey\s*Number',
                    r'मालक|Owner|मालकाचे\s*नाव',
                    r'क्षेत्रफळ|Area|एकर|Hectare',
                    r'जिल्हा|District',
                    r'तालुका|Taluka',
                    r'गाव|Village',
                    r'प्रकल्प|Project',
                    r'अधिकारी|Officer',
                    r'दिनांक|Date|तारीख',
                    r'वर्गीकरण|Classification',
                    r'प्रकार|Type',
                    r'स्थिती|Status',
                    r'टिप्पणी|Remarks|शेरा',
                    r'मापन|Measurement',
                    r'आदिवासी|Tribal',
                    r'जमीन|Land',
                    r'श्रेणी|Category',
                    r'संरचना|Structure',
                    r'झाड|Tree',
                    r'विहीर|Well',
                    r'मूल्य|Value',
                    r'एकूण|Total',
                    r'मंजूरी|Approval',
                    r'कागदपत्र|Document'
                ]
                
                if text:
                    for pattern in field_patterns:
                        matches = re.findall(pattern, text, re.IGNORECASE)
                        if matches:
                            fields_found.update(matches)
    
    except Exception as e:
        print(f"Error processing PDF: {e}")
        return None
    
    # Analyze findings
    result = {
        'total_pages': len(pdf.pages) if 'pdf' in locals() else 0,
        'table_headers': list(set(table_headers)),
        'identified_fields': list(fields_found),
        'full_text_sample': all_text[0][:1000] if all_text else "",
        'recommendations': []
    }
    
    # Generate recommendations based on findings
    current_jmr_fields = [
        'survey_number', 'owner_id', 'project_id', 'officer_id', 
        'measurement_date', 'measured_area', 'land_type', 
        'tribal_classification', 'village', 'taluka', 'district', 
        'category', 'remarks', 'status'
    ]
    
    # Check for missing fields based on PDF content
    pdf_suggests_fields = []
    
    if any('संरचना' in field or 'Structure' in field for field in fields_found):
        pdf_suggests_fields.extend(['structure_details', 'total_structure_value'])
    
    if any('झाड' in field or 'Tree' in field for field in fields_found):
        pdf_suggests_fields.extend(['tree_details', 'total_tree_value'])
    
    if any('विहीर' in field or 'Well' in field for field in fields_found):
        pdf_suggests_fields.extend(['well_details', 'total_well_value'])
    
    if any('मंजूरी' in field or 'Approval' in field for field in fields_found):
        pdf_suggests_fields.extend(['approved_by', 'approved_at', 'rejection_reason'])
    
    if any('कागदपत्र' in field or 'Document' in field for field in fields_found):
        pdf_suggests_fields.append('documents')
    
    result['pdf_suggested_fields'] = pdf_suggests_fields
    result['current_jmr_fields'] = current_jmr_fields
    
    return result

if __name__ == "__main__":
    pdf_path = r"d:\Desk_backup\bhoomi saral mvp\ABC\new_saral_bhoomi\saral-bhoomi\घोळ विवरण पत्र दुरुस्ती.pdf"
    
    print("Analyzing PDF structure...")
    result = extract_pdf_structure(pdf_path)
    
    if result:
        print("\n" + "="*50)
        print("ANALYSIS RESULTS")
        print("="*50)
        
        print(f"\nTotal Pages: {result['total_pages']}")
        
        print(f"\nTable Headers Found: {len(result['table_headers'])}")
        for header in result['table_headers']:
            print(f"  - {header}")
        
        print(f"\nIdentified Field Patterns: {len(result['identified_fields'])}")
        for field in result['identified_fields']:
            print(f"  - {field}")
        
        print(f"\nPDF Suggested Additional Fields: {len(result['pdf_suggested_fields'])}")
        for field in result['pdf_suggested_fields']:
            print(f"  - {field}")
        
        print(f"\nCurrent JMR Fields: {len(result['current_jmr_fields'])}")
        for field in result['current_jmr_fields']:
            print(f"  - {field}")
        
        # Save results to JSON for further analysis
        with open('pdf_analysis_results.json', 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        print(f"\nDetailed results saved to: pdf_analysis_results.json")
    else:
        print("Failed to analyze PDF")