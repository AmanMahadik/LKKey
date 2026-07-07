import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/services/db';
import { Dataset } from '@/models/Dataset';
import { RecordModel } from '@/models/Record';
import { ApiKey } from '@/models/ApiKey';
import { validateAdminSecret } from '@/utils/auth';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // Check auth
    if (!validateAdminSecret(req.headers)) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
    }

    const dbState = mongoose.connection.readyState;
    const dbStatusMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const datasetCount = await Dataset.countDocuments();
    const recordCount = await RecordModel.countDocuments();
    const apiKeyCount = await ApiKey.countDocuments();

    return NextResponse.json({
      success: true,
      status: 'healthy',
      database: {
        state: dbStatusMap[dbState] || 'unknown',
        connectionString: process.env.MONGODB_URI ? 'Configured (Masked)' : 'Missing',
      },
      stats: {
        datasets: datasetCount,
        records: recordCount,
        apiKeys: apiKeyCount,
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        port: process.env.PORT || '3000',
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      status: 'unhealthy',
      error: error.message
    }, { status: 500 });
  }
}
