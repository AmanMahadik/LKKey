import * as XLSX from 'xlsx';

interface ExcelParseResult {
  records: Array<Record<string, any>>;
  errors: string[];
}

// Map RTO prefixes to Indian states
const RTO_STATE_MAP: Record<string, string> = {
  MH: 'Maharashtra',
  DL: 'Delhi',
  KA: 'Karnataka',
  GJ: 'Gujarat',
  TS: 'Telangana',
  TN: 'Tamil Nadu',
  RJ: 'Rajasthan',
  UP: 'Uttar Pradesh',
  MP: 'Madhya Pradesh',
  AP: 'Andhra Pradesh',
  WB: 'West Bengal',
  HR: 'Haryana',
  PB: 'Punjab',
  KL: 'Kerala',
  BR: 'Bihar',
  OD: 'Odisha',
  JH: 'Jharkhand',
  CH: 'Chandigarh',
  UK: 'Uttarakhand',
  HP: 'Himachal Pradesh',
  JK: 'Jammu and Kashmir',
  GA: 'Goa',
  CG: 'Chhattisgarh',
  AS: 'Assam'
};

/**
 * Helper to convert column index to Excel column letter (0 -> A, 1 -> B, 26 -> AA)
 */
function getColumnLetter(colIndex: number): string {
  let letter = '';
  let temp = colIndex;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

/**
 * Parses an Excel file buffer and validates the fields against the dataset's schema.
 * Implements a smart value-based fingerprinting algorithm to automatically detect columns
 * when header rows are missing or misaligned.
 */
export function parseExcelBuffer(buffer: Buffer, schemaFields: string[]): ExcelParseResult {
  const errors: string[] = [];
  const records: Array<Record<string, any>> = [];

  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { records, errors: ['The uploaded workbook contains no sheets.'] };
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Parse sheet as raw 2D array of cells (header: 1)
    const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });

    if (rawRows.length === 0) {
      return { records, errors: ['The uploaded sheet is empty.'] };
    }

    const required = schemaFields.map(f => f.trim().toLowerCase());
    
    // Check if the first row is a header row by matching strings with schema fields
    const firstRow = rawRows[0] || [];
    let isHeaderRow = false;
    const headerMap: Record<number, string> = {}; // maps column index -> schema field

    firstRow.forEach((cell, idx) => {
      if (typeof cell === 'string') {
        const valClean = cell.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
        
        // Match exact or contains
        required.forEach(field => {
          if (valClean === field || valClean.includes(field) || field.includes(valClean)) {
            headerMap[idx] = field;
            isHeaderRow = true;
          }
        });
      }
    });

    let dataStartRow = isHeaderRow ? 1 : 0;
    let rtoColIndex = -1;
    let cityColIndex = -1;
    let stateColIndex = -1;

    if (isHeaderRow) {
      // Find mapped indices from headers
      Object.keys(headerMap).forEach(key => {
        const idx = parseInt(key, 10);
        const field = headerMap[idx];
        if (field === 'rto_code') rtoColIndex = idx;
        if (field === 'city') cityColIndex = idx;
        if (field === 'state') stateColIndex = idx;
      });
    } else {
      // SMART VALUE-BASED DETECTION (For sheets without headers like the Maharashtra RTO Excel)
      console.log('No matching headers found. Triggering value-based column detection...');
      
      const colAnalysis: Record<number, {
        rtoMatchCount: number;
        shortTextCount: number;
        longTextCount: number;
        numberCount: number;
        totalCount: number;
      }> = {};

      // Analyze first 20 rows of data to detect fingerprints
      const scanRowsLimit = Math.min(25, rawRows.length);
      
      for (let r = 0; r < scanRowsLimit; r++) {
        const row = rawRows[r] || [];
        row.forEach((cell, c) => {
          if (!colAnalysis[c]) {
            colAnalysis[c] = { rtoMatchCount: 0, shortTextCount: 0, longTextCount: 0, numberCount: 0, totalCount: 0 };
          }
          
          if (cell !== undefined && cell !== null && cell !== '') {
            colAnalysis[c].totalCount++;
            const strVal = String(cell).trim();
            
            // Check RTO pattern (e.g. MH01, MH-15, DL-1C)
            const rtoRegex = /^[A-Z]{2}-?\d{1,4}[A-Z]*$/i;
            if (rtoRegex.test(strVal)) {
              colAnalysis[c].rtoMatchCount++;
            } else if (typeof cell === 'number') {
              colAnalysis[c].numberCount++;
            } else if (strVal.length > 35) {
              colAnalysis[c].longTextCount++;
            } else if (strVal.length >= 3 && strVal.length <= 35) {
              colAnalysis[c].shortTextCount++;
            }
          }
        });
      }

      // Determine RTO code column (highest matching RTO regex count)
      let maxRto = 0;
      Object.keys(colAnalysis).forEach(colStr => {
        const c = parseInt(colStr, 10);
        if (colAnalysis[c].rtoMatchCount > maxRto) {
          maxRto = colAnalysis[c].rtoMatchCount;
          rtoColIndex = c;
        }
      });

      // Determine City/Region column (highest short text count, not being the RTO column)
      let maxShort = 0;
      Object.keys(colAnalysis).forEach(colStr => {
        const c = parseInt(colStr, 10);
        if (c !== rtoColIndex && colAnalysis[c].shortTextCount > maxShort) {
          maxShort = colAnalysis[c].shortTextCount;
          cityColIndex = c;
        }
      });

      // Determine State column (look for any column containing state names, or we will infer it)
      Object.keys(colAnalysis).forEach(colStr => {
        const c = parseInt(colStr, 10);
        if (c !== rtoColIndex && c !== cityColIndex) {
          // Check if it contains words like Maharashtra, Delhi, etc.
          let hasStateKeyword = false;
          for (let r = 0; r < scanRowsLimit; r++) {
            const val = String(rawRows[r]?.[c] || '');
            if (Object.values(RTO_STATE_MAP).some(st => val.toLowerCase().includes(st.toLowerCase()))) {
              hasStateKeyword = true;
              break;
            }
          }
          if (hasStateKeyword) {
            stateColIndex = c;
          }
        }
      });
    }

    console.log(`Detected mappings -> RTO Col Index: ${rtoColIndex}, City Col Index: ${cityColIndex}, State Col Index: ${stateColIndex}`);

    // Process rows
    for (let r = dataStartRow; r < rawRows.length; r++) {
      const row = rawRows[r];
      const rowNum = r + 1;

      // Skip empty or short rows
      if (!row || row.length === 0 || row.every(cell => cell === '')) {
        continue;
      }

      const rowRecord: Record<string, any> = {};

      // 1. Extract RTO Code
      let rtoVal = '';
      if (rtoColIndex !== -1 && row[rtoColIndex] !== undefined) {
        // Standardize format: convert MH15 to MH-15 if it doesn't contain hyphen
        let rawRto = String(row[rtoColIndex]).trim().toUpperCase();
        if (rawRto) {
          // Insert hyphen if missing e.g. MH15 -> MH-15
          if (/^[A-Z]{2}\d{2}/.test(rawRto)) {
            rawRto = rawRto.slice(0, 2) + '-' + rawRto.slice(2);
          }
          rtoVal = rawRto;
        }
      }

      // 2. Extract City
      let cityVal = '';
      if (cityColIndex !== -1 && row[cityColIndex] !== undefined) {
        cityVal = String(row[cityColIndex]).trim();
      }

      // 3. Extract or Infer State
      let stateVal = '';
      if (stateColIndex !== -1 && row[stateColIndex] !== undefined) {
        stateVal = String(row[stateColIndex]).trim();
      } else if (rtoVal) {
        // Automatically infer state from RTO Code prefix!
        const prefix = rtoVal.slice(0, 2);
        stateVal = RTO_STATE_MAP[prefix] || 'Maharashtra'; // fallback to Maharashtra
      }

      // Write schema fields to record
      if (schemaFields.includes('rto_code')) rowRecord['rto_code'] = rtoVal;
      if (schemaFields.includes('city')) rowRecord['city'] = cityVal;
      if (schemaFields.includes('state')) rowRecord['state'] = stateVal;

      // Validate required fields
      const missingFields: string[] = [];
      if (schemaFields.includes('rto_code') && !rtoVal) missingFields.push('rto_code');
      if (schemaFields.includes('city') && !cityVal) missingFields.push('city');

      if (missingFields.length > 0) {
        errors.push(`Row ${rowNum}: Could not map required fields: ${missingFields.join(', ')}`);
        continue;
      }

      // 4. Capture all other columns as custom properties (e.g. Column_E, Column_F)
      row.forEach((cell, idx) => {
        if (idx !== rtoColIndex && idx !== cityColIndex && idx !== stateColIndex && cell !== undefined && cell !== null && cell !== '') {
          const letter = getColumnLetter(idx);
          const customKey = `Column_${letter}`;
          rowRecord[customKey] = typeof cell === 'string' ? String(cell).trim() : cell;
        }
      });

      records.push(rowRecord);
    }

  } catch (error: any) {
    errors.push(`Excel parsing failed: ${error.message}`);
  }

  return { records, errors };
}
