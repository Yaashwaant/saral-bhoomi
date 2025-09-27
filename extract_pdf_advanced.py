import pdfplumber
import re
import json
from PIL import Image
import io

def extract_pdf_advanced(pdf_path):
    """Advanced PDF analysis with multiple extraction methods"""
    
    results = {
        'pages_analyzed': 0,
        'text_extraction_method': [],
        'form_fields_detected': [],
        'table_structure': [],
        'visual_elements': [],
        'recommendations': []
    }
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            results['pages_analyzed'] = len(pdf.pages)
            print(f"Analyzing {len(pdf.pages)} pages...")
            
            for page_num, page in enumerate(pdf.pages, 1):
                print(f"\n--- Analyzing Page {page_num} ---")
                
                # Method 1: Direct text extraction
                text = page.extract_text()
                if text and text.strip():
                    results['text_extraction_method'].append(f"Page {page_num}: Direct text extraction successful")
                    print(f"Direct text found: {len(text)} characters")
                    
                    # Look for common form field indicators
                    field_indicators = [
                        r'सर्वे\s*नं\.?|Survey\s*No\.?',
                        r'मालकाचे\s*नाव|Owner\s*Name',
                        r'क्षेत्रफळ|Area',
                        r'जिल्हा|District',
                        r'तालुका|Taluka', 
                        r'गाव|Village',
                        r'प्रकल्प|Project',
                        r'अधिकारी|Officer',
                        r'दिनांक|Date',
                        r'वर्गीकरण|Classification',
                        r'प्रकार|Type',
                        r'स्थिती|Status',
                        r'टिप्पणी|Remarks',
                        r'मापन|Measurement',
                        r'आदिवासी|Tribal',
                        r'जमीन|Land',
                        r'श्रेणी|Category'
                    ]
                    
                    for indicator in field_indicators:
                        if re.search(indicator, text, re.IGNORECASE):
                            results['form_fields_detected'].append(indicator)
                else:
                    results['text_extraction_method'].append(f"Page {page_num}: No direct text found")
                
                # Method 2: Table extraction
                tables = page.extract_tables()
                if tables:
                    print(f"Found {len(tables)} tables")
                    for i, table in enumerate(tables):
                        if table and len(table) > 0:
                            # Analyze table structure
                            non_empty_rows = [row for row in table if any(cell and str(cell).strip() for cell in row)]
                            if non_empty_rows:
                                results['table_structure'].append({
                                    'page': page_num,
                                    'table': i+1,
                                    'rows': len(non_empty_rows),
                                    'columns': len(table[0]) if table[0] else 0,
                                    'sample_data': non_empty_rows[:3]  # First 3 rows as sample
                                })
                
                # Method 3: Check for form elements
                # Look for lines, rectangles that might indicate form fields
                lines = page.lines
                rects = page.rects
                
                if lines:
                    results['visual_elements'].append(f"Page {page_num}: {len(lines)} lines detected")
                if rects:
                    results['visual_elements'].append(f"Page {page_num}: {len(rects)} rectangles detected")
                
                # Method 4: Character-level analysis
                chars = page.chars
                if chars:
                    # Group characters by font and size to identify potential labels
                    font_groups = {}
                    for char in chars:
                        font_key = f"{char.get('fontname', 'unknown')}_{char.get('size', 0)}"
                        if font_key not in font_groups:
                            font_groups[font_key] = []
                        font_groups[font_key].append(char.get('text', ''))
                    
                    # Look for repeated patterns that might be field labels
                    for font_key, chars_list in font_groups.items():
                        text_content = ''.join(chars_list)
                        if len(text_content) > 10:  # Only analyze substantial text
                            # Check for Marathi/Hindi field patterns
                            marathi_patterns = [
                                'सर्वे', 'मालक', 'क्षेत्रफळ', 'जिल्हा', 'तालुका', 'गाव',
                                'प्रकल्प', 'अधिकारी', 'दिनांक', 'वर्गीकरण', 'प्रकार',
                                'स्थिती', 'टिप्पणी', 'मापन', 'आदिवासी', 'जमीन', 'श्रेणी'
                            ]
                            
                            for pattern in marathi_patterns:
                                if pattern in text_content:
                                    results['form_fields_detected'].append(f"{pattern} (Font: {font_key})")
    
    except Exception as e:
        print(f"Error during advanced analysis: {e}")
        results['error'] = str(e)
    
    # Generate recommendations based on analysis
    current_fields = [
        'survey_number', 'owner_id', 'project_id', 'officer_id', 
        'measurement_date', 'measured_area', 'land_type', 
        'tribal_classification', 'village', 'taluka', 'district', 
        'category', 'remarks', 'status'
    ]
    
    # Based on typical JMR forms, suggest additional fields that might be missing
    typical_jmr_fields = [
        'sub_division_number',  # उप विभाग क्रमांक
        'owner_name',           # मालकाचे नाव  
        'father_name',          # वडिलांचे नाव
        'survey_sub_number',    # सर्वे उप क्रमांक
        'plot_area',           # भूखंडाचे क्षेत्रफळ
        'compensation_amount', # नुकसान भरपाई रक्कम
        'structure_compensation', # संरचना नुकसान भरपाई
        'tree_compensation',   # झाडे नुकसान भरपाई
        'well_compensation',   # विहीर नुकसान भरपाई
        'total_compensation',  # एकूण नुकसान भरपाई
        'acquisition_date',    # संपादन दिनांक
        'possession_date',     # ताबा दिनांक
        'reference_number',    # संदर्भ क्रमांक
        'file_number',         # फाइल क्रमांक
        'revenue_village',     # महसूल गाव
        'survey_settlement',   # सर्वे सेटलमेंट
        'land_classification', # जमीन वर्गीकरण
        'irrigation_type',     # सिंचन प्रकार
        'crop_type',          # पीक प्रकार
        'boundary_north',     # उत्तर सीमा
        'boundary_south',     # दक्षिण सीमा  
        'boundary_east',      # पूर्व सीमा
        'boundary_west',      # पश्चिम सीमा
        'witness_1',          # साक्षीदार १
        'witness_2',          # साक्षीदार २
        'surveyor_name',      # सर्वेक्षक नाव
        'verification_date',  # पडताळणी दिनांक
        'approval_authority', # मंजूरी अधिकारी
        'gazette_notification', # राजपत्र अधिसूचना
        'land_record_number', # जमीन रेकॉर्ड क्रमांक
        'mutation_number',    # नामांतरण क्रमांक
        'khata_number',       # खाता क्रमांक
        'khasra_number'       # खसरा क्रमांक
    ]
    
    missing_fields = [field for field in typical_jmr_fields if field not in current_fields]
    
    results['recommendations'] = [
        f"Current JMR form has {len(current_fields)} fields",
        f"Typical JMR forms may require up to {len(typical_jmr_fields)} fields",
        f"Consider adding these potentially missing fields: {missing_fields[:10]}",  # Show first 10
        "Review the PDF manually to identify specific field requirements",
        "Consider adding structure, tree, and well detail sections if not present"
    ]
    
    results['suggested_additional_fields'] = missing_fields
    results['current_fields'] = current_fields
    
    return results

if __name__ == "__main__":
    pdf_path = r"d:\Desk_backup\bhoomi saral mvp\ABC\new_saral_bhoomi\saral-bhoomi\घोळ विवरण पत्र दुरुस्ती.pdf"
    
    print("Performing advanced PDF analysis...")
    results = extract_pdf_advanced(pdf_path)
    
    print("\n" + "="*60)
    print("ADVANCED ANALYSIS RESULTS")
    print("="*60)
    
    print(f"\nPages Analyzed: {results['pages_analyzed']}")
    
    print(f"\nText Extraction Results:")
    for method in results['text_extraction_method']:
        print(f"  - {method}")
    
    print(f"\nForm Fields Detected: {len(results['form_fields_detected'])}")
    for field in set(results['form_fields_detected']):  # Remove duplicates
        print(f"  - {field}")
    
    print(f"\nTable Structure:")
    for table in results['table_structure']:
        print(f"  - Page {table['page']}, Table {table['table']}: {table['rows']} rows x {table['columns']} columns")
    
    print(f"\nVisual Elements:")
    for element in results['visual_elements']:
        print(f"  - {element}")
    
    print(f"\nRecommendations:")
    for rec in results['recommendations']:
        print(f"  - {rec}")
    
    print(f"\nSuggested Additional Fields ({len(results['suggested_additional_fields'])}):")
    for field in results['suggested_additional_fields'][:15]:  # Show first 15
        print(f"  - {field}")
    
    # Save detailed results
    with open('pdf_advanced_analysis.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\nDetailed results saved to: pdf_advanced_analysis.json")