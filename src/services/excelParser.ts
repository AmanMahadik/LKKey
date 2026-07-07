import * as XLSX from 'xlsx';

interface ExcelParseResult {
  records: Array<Record<string, any>>;
  errors: string[];
}

/**
 * Parses an Excel file buffer and validates the fields against the dataset's schema.
 * Dynamically captures both the required schemaFields and any additional columns.
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
    
    // Parse sheet to JSON array of objects
    const rows = XLSX.utils.sheet_to_json<any>(worksheet);

    if (rows.length === 0) {
      return { records, errors: ['The uploaded sheet contains no data rows.'] };
    }

    const required = schemaFields.map(f => f.trim());

    rows.forEach((row, index) => {
      const rowNum = index + 2; // 1-indexed plus header row offset
      
      if (!row || Object.keys(row).length === 0) {
        return; // skip empty rows
      }

      const missing: string[] = [];
      const rowRecord: Record<string, any> = {};

      // Validate required fields
      required.forEach(field => {
        const val = row[field];
        if (val === undefined || val === null || val === '') {
          missing.push(field);
        } else {
          rowRecord[field] = String(val).trim();
        }
      });

      if (missing.length > 0) {
        errors.push(`Row ${rowNum}: Missing required fields: ${missing.join(', ')}`);
      } else {
        // Capture arbitrary extra fields as well
        Object.keys(row).forEach(key => {
          if (!required.includes(key)) {
            const val = row[key];
            if (val !== undefined && val !== null && val !== '') {
              rowRecord[key] = typeof val === 'string' ? val.trim() : val;
            }
          }
        });
        records.push(rowRecord);
      }
    });

  } catch (error: any) {
    errors.push(`Excel parsing failed: ${error.message}`);
  }

  return { records, errors };
}
