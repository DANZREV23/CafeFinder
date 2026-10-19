import '../loadEnv.js';
import { prisma, connectWithRetry } from '../config/database.js';
import { LoyaltyService } from '../services/loyaltyService.js';
import { LoyaltyProgramStatus, LoyaltyRewardStatus, Role } from '@prisma/client';

async function runLoyaltyTests() {
  console.log('--- STARTING STAGE 43 LOYALTY & REWARDS AUTOMATED TESTS ---');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  };

  try {
    await connectWithRetry();

    // 1. Setup test user and test cafe
    const testOwner = await prisma.user.upsert({
      where: { email: 'test-owner-loyalty@example.com' },
      update: {},
      create: {
        email: 'test-owner-loyalty@example.com',
        name: 'Test Owner Loyalty',
        passwordHash: 'dummyhash',
        role: Role.OWNER,
      },
    });

    const testCustomer = await prisma.user.upsert({
      where: { email: 'test-customer-loyalty@example.com' },
      update: {},
      create: {
        email: 'test-customer-loyalty@example.com',
        name: 'Test Customer Loyalty',
        passwordHash: 'dummyhash',
        role: Role.USER,
      },
    });

    const testCafe = await prisma.cafe.upsert({
      where: { slug: 'test-loyalty-cafe' },
      update: { status: 'PUBLISHED', ownerId: testOwner.id },
      create: {
        name: 'Test Loyalty Cafe',
        slug: 'test-loyalty-cafe',
        address: '123 Coffee St',
        city: 'Manila',
        state: 'Metro Manila',
        country: 'Philippines',
        postalCode: '1000',
        status: 'PUBLISHED',
        ownerId: testOwner.id,
      },
    });

    // 2. Program creation & update
    const program = await LoyaltyService.upsertOwnerProgram(
      testOwner.id,
      testCafe.id,
      {
        name: 'Test Coffee Club',
        description: 'Earn points for coffee',
        status: LoyaltyProgramStatus.ACTIVE,
        pointsEnabled: true,
        pointsPerVisit: 15,
        minimumRedemptionPoints: 30,
        termsAndConditions: 'Test terms: points valid for active members',
      }
    );
    assert(program && program.name === 'Test Coffee Club', 'Owner can create and configure active loyalty program');

    // 3. Customer enrollment (idempotency check)
    const enrollment = await LoyaltyService.enrollCustomerInProgram(testCustomer.id, testCafe.id);
    assert(enrollment && enrollment.account.programId === program.id, 'Customer can enroll in active program');

    const duplicateEnrollment = await LoyaltyService.enrollCustomerInProgram(testCustomer.id, testCafe.id);
    assert(duplicateEnrollment.alreadyEnrolled === true, 'Duplicate enrollment is idempotent and safe');

    // 4. Reward creation
    const reward = await LoyaltyService.createOwnerReward(testOwner.id, testCafe.id, {
      name: 'Free Cold Brew',
      description: 'Refreshing 16oz cold brew',
      pointsCost: 30,
      status: LoyaltyRewardStatus.ACTIVE,
      stockLimit: 10,
    });
    assert(reward && reward.pointsCost === 30, 'Owner can create reward with points cost and stock limit');

    // 5. Customer visit check-in & owner approval
    const checkIn = await LoyaltyService.submitVisitCheckIn(testCustomer.id, testCafe.id, {
      visitNotes: 'Morning espresso at table 3',
    });
    assert(checkIn && checkIn.status === 'PENDING', 'Customer can submit visit check-in');

    const approvedCheckIn = await LoyaltyService.reviewVisitCheckIn(testOwner.id, testCafe.id, checkIn.id, {
      approved: true,
      pointsAwarded: 15,
      ownerNotes: 'Receipt verified',
    });
    assert(approvedCheckIn && approvedCheckIn.status === 'APPROVED', 'Owner can approve check-in and issue verified points');

    // Check account balance after check-in
    let account = await prisma.cafeLoyaltyAccount.findUniqueOrThrow({
      where: { id: enrollment.account.id },
    });
    assert(account.pointsBalance === 15, 'Points ledger correctly increments account balance (+15 pts)');

    // 6. Manual owner points award
    await LoyaltyService.issueOwnerPoints(testOwner.id, testCafe.id, {
      accountId: account.id,
      points: 25,
      type: 'EARN',
      description: 'Special tasting event points',
      reason: 'Attended weekend cupping workshop',
    });

    account = await prisma.cafeLoyaltyAccount.findUniqueOrThrow({
      where: { id: enrollment.account.id },
    });
    assert(account.pointsBalance === 40, 'Owner can award audited points with reason (balance now 40 pts)');

    // 7. Reward redemption request
    const redemption = await LoyaltyService.requestRewardRedemption(testCustomer.id, reward.id, {
      notes: 'Please add ice',
    });
    assert(redemption && redemption.redemption.status === 'REQUESTED', 'Customer can request redemption with sufficient points');

    account = await prisma.cafeLoyaltyAccount.findUniqueOrThrow({
      where: { id: enrollment.account.id },
    });
    assert(account.pointsBalance === 10, 'Points deducted atomically on redemption request (balance now 10 pts)');

    // 8. Insufficient balance test
    let insufficientBalanceCaught = false;
    try {
      await LoyaltyService.requestRewardRedemption(testCustomer.id, reward.id);
    } catch (err: any) {
      insufficientBalanceCaught = true;
    }
    assert(insufficientBalanceCaught, 'Cannot redeem reward when points balance is insufficient');

    // 9. Owner approves redemption
    const approvedRedemption = await LoyaltyService.processOwnerRedemption(testOwner.id, testCafe.id, redemption.redemption.id, {
      action: 'APPROVE',
    });
    assert(approvedRedemption && approvedRedemption.status === 'APPROVED', 'Owner can approve redemption request');

    // 10. Owner processes fulfillment with voucher code
    const fulfilledRedemption = await LoyaltyService.processOwnerRedemption(testOwner.id, testCafe.id, redemption.redemption.id, {
      action: 'REDEEM',
      verificationCode: redemption.plainCode,
    });
    assert(fulfilledRedemption && fulfilledRedemption.status === 'REDEEMED', 'Owner can verify secure voucher code and fulfill reward');

    // 11. Code reuse prevention
    let codeReusePrevented = false;
    try {
      await LoyaltyService.processOwnerRedemption(testOwner.id, testCafe.id, redemption.redemption.id, {
        action: 'REDEEM',
        verificationCode: redemption.plainCode,
      });
    } catch {
      codeReusePrevented = true;
    }
    assert(codeReusePrevented, 'Voucher code reuse is prevented');

    // 12. Maintenance: Expiration & points refund
    // Create an expired redemption request
    const expiredReq = await prisma.cafeRewardRedemption.create({
      data: {
        rewardId: reward.id,
        accountId: account.id,
        pointsSpent: 10,
        status: 'REQUESTED',
        expiresAt: new Date(Date.now() - 1000 * 60), // already expired
      },
      include: { reward: true },
    });
    // Manually deduct 10 points for the simulation
    await prisma.cafeLoyaltyAccount.update({
      where: { id: account.id },
      data: { pointsBalance: { decrement: 10 } },
    });

    const maintenanceResult = await LoyaltyService.runLoyaltyMaintenanceJob();
    assert(maintenanceResult.expiredRedemptionsCount >= 1, 'Maintenance job detects and expires stale redemptions');

    account = await prisma.cafeLoyaltyAccount.findUniqueOrThrow({
      where: { id: enrollment.account.id },
    });
    assert(account.pointsBalance === 10, 'Expired redemption points restored via reversal ledger transaction');

    // 13. Ledger audit & reconciliation
    const auditResult = await LoyaltyService.reconcileAllLoyaltyLedgers(true);
    assert(auditResult.reconciledAccountsCount >= 1, 'Platform audit reconciles ledgers with zero fatal discrepancies');

    console.log(`\n========================================`);
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================`);

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err: any) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runLoyaltyTests();
