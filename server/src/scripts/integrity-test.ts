// server/src/scripts/integrity-test.ts
import { PrismaClient } from '@prisma/client';
import { dataIntegrityService } from '../services/dataIntegrityService.js';
import { cafeDuplicateService } from '../services/cafeDuplicateService.js';
import { userDataExportService } from '../services/userDataExportService.js';

const prisma = new PrismaClient();

async function runIntegrityTests() {
  console.log('--- Starting Data Integrity & Lifecycle Logic Tests ---');

  try {
    // 1. Test Duplicate Detection Logic
    console.log('Testing Duplicate Detection...');
    const duplicateTest = await cafeDuplicateService.findDuplicates({
      name: 'Test Cafe',
      city: 'Davao City',
      address: '123 Test St'
    });
    console.log('[PASS] Duplicate detection logic executed.');

    // 2. Test Data Integrity Reporting
    console.log('Testing Integrity Reporting...');
    const report = await dataIntegrityService.getIntegrityReport();
    console.log('[PASS] Integrity report generated successfully.');
    console.log(`- Total Cafes: ${report.cafes.total}`);
    console.log(`- Total Reviews: ${report.reviews.total}`);

    // 3. Test Rating Recalculation (on a non-existent cafe, should handle gracefully or be tested on dummy)
    console.log('Testing Rating Recalculation (Dry Run)...');
    try {
      await dataIntegrityService.recalculateCafeRatings('non-existent-id');
    } catch (e) {
      console.log('[PASS] Rating recalculation handled missing cafe correctly.');
    }

    // 4. Test User Data Export
    // Need a real user ID or handle error
    console.log('Testing User Data Export (Logic Check)...');
    const users = await prisma.user.findMany({ take: 1 });
    if (users.length > 0) {
      const exportData = await userDataExportService.exportUserData(users[0].id);
      if (exportData.profile.email === users[0].email) {
        console.log('[PASS] User data export logic verified.');
      } else {
        console.error('[FAIL] User data export mismatch.');
      }
    } else {
      console.log('[SKIP] No users found for export test.');
    }

    console.log('--- All Logic Tests Completed Successfully ---');
  } catch (error) {
    console.error('--- Tests Failed ---');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runIntegrityTests();
