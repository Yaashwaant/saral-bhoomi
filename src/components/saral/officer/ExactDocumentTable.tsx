import React from "react";

/**
 * ExactDocumentTable
 * - Reproduces the multi-row Marathi table header exactly as in the provided screenshot.
 * - Contains the same single-row sample data shown in the screenshot (Devanagari numerals).
 *
 * Tailwind CSS classes are used for quick styling. Remove/convert if not using Tailwind.
 */

interface JMRRecord {
  _id?: string;
  serialNo?: string;
  survey_number?: string;
  sub_division_number?: string;
  classification?: string;
  area?: number;
  land_record_number?: string;
  sampadit_bhumapan_gat?: string;
  sampadit_hectare?: number;
  sampadit_are?: number;
  owner_name?: string;
  structure_details_note?: string;
  well_details_note?: string;
  tree_details_note?: string;
  remarks?: string;
  project?: string;
  district?: string;
  taluka?: string;
  village?: string;
  measurement_date?: string;
  status?: string;
}

type Props = {
  records?: JMRRecord[];
};

const ExactDocumentTable: React.FC<Props> = ({ records = [] }) => {
  console.log('ExactDocumentTable rendering with records:', records);
  console.log('Records type:', typeof records);
  console.log('Is array:', Array.isArray(records));
  
  // Ensure records is always an array
  const safeRecords = Array.isArray(records) ? records : [];
  console.log('Safe records length:', safeRecords.length);

  return (
    <div className="p-4 bg-white rounded-md shadow-sm">
      <div className="overflow-x-auto">
        <table
          className="min-w-full border-collapse table-fixed text-[11px] leading-tight"
          style={{ fontFamily: '"Noto Sans Devanagari", "Mangal", sans-serif' }}
        >
          <thead>
            {/* First header row: merged groups */}
            <tr>
              <th
                className="border border-gray-700 px-2 py-2 text-center align-middle"
                rowSpan={2}
                style={{ width: 48 }}
              >
                अ.क्र
              </th>

              <th
                className="border border-gray-700 px-2 py-2 text-center"
                colSpan={3}
                style={{ minWidth: 260 }}
              >
                आकारवंत प्रमाणे
              </th>

              <th
                className="border border-gray-700 px-2 py-2 text-center"
                rowSpan={2}
                style={{ width: 56 }}
              >
                ७/१२
              </th>

              <th
                className="border border-gray-700 px-2 py-2 text-center"
                colSpan={3}
                style={{ minWidth: 260 }}
              >
                संपादित क्षेत्र
              </th>

              <th
                className="border border-gray-700 px-2 py-2 text-center"
                rowSpan={2}
                style={{ minWidth: 180 }}
              >
                खातेदाराचे नाव
              </th>

              <th
                className="border border-gray-700 px-2 py-2 text-center"
                colSpan={4}
                style={{ minWidth: 240 }}
              >
                तपशील
              </th>
            </tr>

            {/* Second header row: exact sub-column labels */}
            <tr>
              {/* Subcolumns under 'आकारवंत प्रमाणे' */}
              <th className="border border-gray-700 px-2 py-1 text-center">भुमापन गट क्र.</th>
              <th className="border border-gray-700 px-2 py-1 text-center">जमिनीचा प्रकार</th>
              <th className="border border-gray-700 px-2 py-1 text-center">क्षेत्र हे. आर. मध्ये</th>

              {/* '७/१२' has rowspan above - no cell here */}

              {/* Subcolumns under 'संपादित क्षेत्र' */}
              <th className="border border-gray-700 px-2 py-1 text-center">भुमापन गट क्र.</th>
              <th className="border border-gray-700 px-2 py-1 text-center">इक्क हेक्टर</th>
              <th className="border border-gray-700 px-2 py-1 text-center">इक्व आर</th>

              {/* खातेदाराचे नाव had rowspan above */}

              {/* Subcolumns under 'तपशील' */}
              <th className="border border-gray-700 px-2 py-1 text-center">बांधकाम</th>
              <th className="border border-gray-700 px-2 py-1 text-center">विहीर/ कंपनीका</th>
              <th className="border border-gray-700 px-2 py-1 text-center">झाडे</th>
              <th className="border border-gray-700 px-2 py-1 text-center">शेरा</th>
            </tr>
          </thead>

          <tbody>
            {safeRecords.length === 0 ? (
              <tr>
                <td colSpan={12} className="border border-gray-700 px-2 py-8 text-center text-gray-500">
                  कोणतीही नोंदी सापडली नाहीत
                </td>
              </tr>
            ) : (
              safeRecords.map((record, index) => (
                <tr key={record._id || index} className="odd:bg-white even:bg-gray-50">
                  <td className="border border-gray-700 px-2 py-2 text-center">{record.serialNo || index + 1}</td>

                  {/* आकारवंत प्रमाणे subcols */}
                  <td className="border border-gray-700 px-2 py-2 text-center">{record.survey_number || '-'}</td>
                  <td className="border border-gray-700 px-2 py-2 text-center">{record.classification || '-'}</td>
                  <td className="border border-gray-700 px-2 py-2 text-center">{record.area ? `${record.area}` : '-'}</td>

                  {/* ७/१२ column */}
                  <td className="border border-gray-700 px-2 py-2 text-center">{record.land_record_number || '-'}</td>

                  {/* संपादित क्षेत्र subcols */}
                  <td className="border border-gray-700 px-2 py-2 text-center">{record.sampadit_bhumapan_gat || '-'}</td>
                  <td className="border border-gray-700 px-2 py-2 text-center">{record.sampadit_hectare ? `${record.sampadit_hectare}` : '-'}</td>
                  <td className="border border-gray-700 px-2 py-2 text-center">{record.sampadit_are ? `${record.sampadit_are}` : '-'}</td>

                  {/* खातेदाराचे नाव */}
                  <td className="border border-gray-700 px-2 py-2 text-center">{record.owner_name || '-'}</td>

                  {/* तपशील subcols */}
                  <td className="border border-gray-700 px-2 py-2 text-center">{record.structure_details_note || '-'}</td>
                  <td className="border border-gray-700 px-2 py-2 text-center">{record.well_details_note || '-'}</td>
                  <td className="border border-gray-700 px-2 py-2 text-center">{record.tree_details_note || '-'}</td>
                  <td className="border border-gray-700 px-2 py-2 text-center">{record.remarks || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExactDocumentTable;