import { prisma } from '../config/database.js';
import { JobResult } from './jobRunnerService.js';

export async function expireTimeSensitiveContent(): Promise<JobResult> {
  const now = new Date();
  const models = ['cafeEvent', 'cafeSpecial', 'cafeAnnouncement'] as const;
  let processedCount = 0;
  for (const modelName of models) {
    const model = (prisma as any)[modelName];
    const expired = await model.findMany({
      where: { status: 'PUBLISHED', endAt: { lt: now } },
      select: { id: true },
      take: 500,
      orderBy: { endAt: 'asc' }
    });
    if (!expired.length) continue;
    const result = await model.updateMany({
      where: { id: { in: expired.map((record: { id: string }) => record.id) }, status: 'PUBLISHED', endAt: { lt: now } },
      data: modelName === 'cafeAnnouncement' ? { status: 'EXPIRED' } : { status: 'EXPIRED', isFeatured: false }
    });
    processedCount += result.count;
  }
  return { processedCount, successCount: processedCount, failureCount: 0 };
}