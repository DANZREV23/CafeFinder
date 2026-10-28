import '../loadEnv.js';
import { prisma, connectWithRetry } from '../config/database.js';
import { userDataExportService } from '../services/userDataExportService.js';

async function runIntegrityTest() {
  await connectWithRetry();
  const users = await prisma.user.findMany({ take: 1 });
  if (users.length > 0) {
    const exportData = await userDataExportService.exportUserData(users[0].id);
    if (exportData.profile?.email === users[0].email || exportData.user?.email === users[0].email) {
      console.log('✅ User data export integrity verified');
    }
  }
}

runIntegrityTest()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error('Integrity test error:', err);
    process.exit(1);
  });
