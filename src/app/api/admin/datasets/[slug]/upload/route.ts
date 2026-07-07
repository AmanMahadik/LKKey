import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/services/db';
import { Dataset } from '@/models/Dataset';
import { RecordModel } from '@/models/Record';
import { UploadLog } from '@/models/UploadLog';
import { parseExcelBuffer } from '@/services/excelParser';
import { validateAdminSecret } from '@/utils/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectToDatabase();
    
    // Check auth
    if (!validateAdminSecret(req.headers)) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
    }

    const { slug } = await params;

    // Find the dataset
    const dataset = await Dataset.findOne({ slug });
    if (!dataset) {
      return NextResponse.json({ error: `Dataset with slug "${slug}" not found` }, { status: 404 });
    }

    // Parse formData
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const uploadedBy = (formData.get('uploadedBy') as string) || 'Admin';

    if (!file) {
      return NextResponse.json({ error: 'No Excel file provided under "file" field' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse and validate Excel records
    const { records, errors: validationErrors } = parseExcelBuffer(buffer, dataset.schemaFields);

    if (records.length === 0) {
      return NextResponse.json({
        error: 'No valid records found in Excel sheet.',
        details: validationErrors
      }, { status: 400 });
    }

    // Prepare Mongoose bulk upsert operations
    const operations = records.map((recordData) => {
      const query: Record<string, any> = { datasetId: dataset._id };
      
      // Build unique query filter based on uniqueKeys or schemaFields fallback
      const keyFields = dataset.uniqueKeys && dataset.uniqueKeys.length > 0
        ? dataset.uniqueKeys
        : dataset.schemaFields;

      keyFields.forEach((field) => {
        if (recordData[field] !== undefined) {
          query[`data.${field}`] = recordData[field];
        }
      });

      return {
        updateOne: {
          filter: query,
          update: {
            $set: {
              datasetId: dataset._id,
              data: recordData,
            }
          },
          upsert: true
        }
      };
    });

    // Execute bulk write
    const bulkResult = await RecordModel.bulkWrite(operations);

    // rowsInserted = newly upserted documents
    const rowsInserted = bulkResult.upsertedCount;
    // rowsUpdated = existing documents modified or matched
    const rowsUpdated = bulkResult.modifiedCount;
    const rowsFailed = validationErrors.length;

    // Create upload log
    const uploadLog = await UploadLog.create({
      datasetId: dataset._id,
      fileName: file.name,
      rowsInserted,
      rowsFailed,
      uploadedBy,
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalRows: records.length + rowsFailed,
        inserted: rowsInserted,
        updated: rowsUpdated,
        failed: rowsFailed,
      },
      errors: validationErrors,
      log: uploadLog
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
