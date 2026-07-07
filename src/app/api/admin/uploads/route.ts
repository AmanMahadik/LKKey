import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/services/db';
import { UploadLog } from '@/models/UploadLog';
import { Dataset } from '@/models/Dataset';
import { validateAdminSecret } from '@/utils/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // Check auth
    if (!validateAdminSecret(req.headers)) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
    }

    // Retrieve last 50 upload logs
    const logs = await UploadLog.find({})
      .populate({
        path: 'datasetId',
        model: Dataset,
        select: 'name slug'
      })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
