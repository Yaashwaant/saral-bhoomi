import importExcelData from './scripts/import_excel_data.js';

console.log('🚀 Starting Chandrapada import...');

try {
  await importExcelData();
  console.log('✅ Chandrapada import completed successfully!');
} catch (error) {
  console.error('❌ Chandrapada import failed:', error);
  process.exit(1);
}