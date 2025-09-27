import React from "react";

/**
 * ExactDocumentTable
 * - Reproduces the multi-row Marathi table header exactly as in the provided screenshot.
 * - Contains the same single-row sample data shown in the screenshot (Devanagari numerals).
 *
 * Tailwind CSS classes are used for quick styling. Remove/convert if not using Tailwind.
 */

type Props = {};

// Single sample row (numbers follow the screenshot bottom line)
const sampleRow = {
  a_kr: "१", // अ.क्र
  // आकारवंत प्रमाणे
  aakarvant_bhumapan_gat: "२", // भुमापन गट क्र.
  aakarvant_jaminicha_prakar: "३", // जमिनीचा प्रकार
  aakarvant_kshetra_he_ar_madhye: "४", // क्षेत्र हे. आर. मध्ये

  // ७/१२
  satbara_bhumapan_gat: "५", // ७/१२ -> (भुमापन गट क्र.)

  // संपादित क्षेत्र
  sampadit_bhumapan_gat: "", // भुमापन गट क्र.
  sampadit_ek_hektar: "६", // इक्क हेक्टर
  sampadit_ek_ar: "", // इक्व आर

  // खातेदाराचे नाव
  khatedar_naw: "७",

  // तपशील
  tapshil_bandhkam: "८", // बांधकाम
  tapshil_vihir_company: "९", // विहीर/कंपनीका
  tapshil_zhade: "१०", // झाडे
  tapshil_shera: "११", // शेरा
};

const ExactDocumentTable: React.FC<Props> = () => {
  const row = sampleRow;

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
            {/* single sample row identical to screenshot bottom numbers */}
            <tr className="odd:bg-white even:bg-gray-50">
              <td className="border border-gray-700 px-2 py-2 text-center">{row.a_kr}</td>

              {/* आकारवंत प्रमाणे subcols */}
              <td className="border border-gray-700 px-2 py-2 text-center">{row.aakarvant_bhumapan_gat}</td>
              <td className="border border-gray-700 px-2 py-2 text-center">{row.aakarvant_jaminicha_prakar}</td>
              <td className="border border-gray-700 px-2 py-2 text-center">{row.aakarvant_kshetra_he_ar_madhye}</td>

              {/* ७/१२ column */}
              <td className="border border-gray-700 px-2 py-2 text-center">{row.satbara_bhumapan_gat}</td>

              {/* संपादित क्षेत्र subcols */}
              <td className="border border-gray-700 px-2 py-2 text-center">{row.sampadit_bhumapan_gat}</td>
              <td className="border border-gray-700 px-2 py-2 text-center">{row.sampadit_ek_hektar}</td>
              <td className="border border-gray-700 px-2 py-2 text-center">{row.sampadit_ek_ar}</td>

              {/* खातेदाराचे नाव */}
              <td className="border border-gray-700 px-2 py-2 text-center">{row.khatedar_naw}</td>

              {/* तपशील subcols */}
              <td className="border border-gray-700 px-2 py-2 text-center">{row.tapshil_bandhkam}</td>
              <td className="border border-gray-700 px-2 py-2 text-center">{row.tapshil_vihir_company}</td>
              <td className="border border-gray-700 px-2 py-2 text-center">{row.tapshil_zhade}</td>
              <td className="border border-gray-700 px-2 py-2 text-center">{row.tapshil_shera}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExactDocumentTable;