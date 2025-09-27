import PyPDF2
import sys

try:
    with open('घोळ विवरण पत्र दुरुस्ती.pdf', 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        print(f'PDF has {len(reader.pages)} pages')
        
        # Try to extract text from first few pages
        for i in range(min(3, len(reader.pages))):
            try:
                text = reader.pages[i].extract_text()
                print(f'Page {i+1} text preview: {text[:500] if text else "No text found"}')
            except Exception as e:
                print(f'Error extracting page {i+1}: {e}')
except Exception as e:
    print(f'Error reading PDF: {e}')