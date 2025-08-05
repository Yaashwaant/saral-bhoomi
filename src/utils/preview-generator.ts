
import { useAppSettings } from '@/contexts/AppSettingsContext';

/**
 * Generate HTML content for preview based on data and columns
 */
export const generatePreviewHTML = (
  data: any[], 
  moduleName: string,
  title?: string,
  columns?: { key: string, header: string }[],
  locale?: string
): string => {
  if (!data || data.length === 0) {
    return '<div class="p-4 text-center">Aucune donnée disponible pour l\'aperçu</div>';
  }

  const tableHeaders = (columns || Object.keys(data[0]).map(key => ({ key, header: key }))).map(
    col => `<th class="px-4 py-2 bg-gray-100 border-b dark:bg-gray-700 dark:border-gray-600 dark:text-white">${col.header}</th>`
  ).join('');

  const tableRows = data.map(row => {
    const cells = (columns || Object.keys(row).map(key => ({ key, header: key }))).map(
      col => {
        const value = row[col.key] || '';
        // Check if the value is a URL or could be a link
        const isLink = typeof value === 'string' && (
          value.startsWith('http') || 
          value.startsWith('/') || 
          value.includes('@')
        );
        
        if (isLink) {
          if (value.includes('@')) {
            return `<td class="px-4 py-2 border-b dark:border-gray-600"><a href="mailto:${value}" class="text-blue-600 dark:text-blue-400 hover:underline">${value}</a></td>`;
          } else if (value.startsWith('/')) {
            return `<td class="px-4 py-2 border-b dark:border-gray-600"><a href="${value}" class="text-blue-600 dark:text-blue-400 hover:underline">Voir détails</a></td>`;
          } else {
            return `<td class="px-4 py-2 border-b dark:border-gray-600"><a href="${value}" target="_blank" rel="noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">Lien externe</a></td>`;
          }
        }
        
        // For other values, just show them as text
        return `<td class="px-4 py-2 border-b dark:border-gray-600">${value}</td>`;
      }
    ).join('');
    return `<tr>${cells}</tr>`;
  }).join('');
  
  // Navigation buttons for the preview
  const navigationButtons = `
    <div class="mt-6 flex justify-between">
      <button onclick="window.history.back()" class="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded">
        ← Retour
      </button>
      <button onclick="window.print()" class="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded">
        Imprimer
      </button>
    </div>
  `;

  return `
    <div class="p-6 dark:bg-gray-800 dark:text-gray-100">
      <h2 class="text-xl font-bold mb-4">${title || `Aperçu - ${moduleName}`}</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full border-collapse">
          <thead>
            <tr>${tableHeaders}</tr>
          </thead>
          <tbody class="dark:text-gray-300">
            ${tableRows}
          </tbody>
        </table>
      </div>
      <div class="mt-6 text-sm text-gray-500 dark:text-gray-400 text-right">
        <p>Date: ${new Date().toLocaleDateString(locale || 'fr-FR')}</p>
      </div>
      ${navigationButtons}
    </div>
  `;
};
