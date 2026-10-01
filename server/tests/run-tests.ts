import {
  calculateThingExpiry,
  getCalendarDaysDiff,
  formatDaysRemaining,
} from '../src/utils/expiry.js';
import {
  registerUser,
  loginUser,
} from '../src/modules/auth/auth.service.js';
import {
  createThing,
  getThingDetail,
  updateThing,
  renewThing,
  listUserThings,
  deleteThing,
} from '../src/modules/things/things.service.js';
import {
  addReminderToThing,
  listUserReminders,
  updateReminder,
} from '../src/modules/reminders/reminders.service.js';
import {
  createAction,
  updateAction,
} from '../src/modules/actions/actions.service.js';
import { prisma } from '../src/config/db.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName} ${details ? `(${details})` : ''}`);
  }
}

async function runAllTests() {
  console.log('\n=============================================');
  console.log('  DUELY: Comprehensive Backend & Edge Cases Test Suite');
  console.log('=============================================\n');

  // --- UNIT TESTS: Expiry Calculations & Edge Cases ---
  console.log('[1] Expiry & Urgency Unit Tests & Date Edge Cases:');

  const refDate = new Date('2026-10-01T12:00:00Z');

  // Edge case: Expiry Today
  const todayDate = new Date('2026-10-01T08:00:00Z');
  const todayCalc = calculateThingExpiry(todayDate, null, 'ACTIVE', refDate);
  assert(todayCalc.daysRemaining === 0, 'Expiry Today calculates daysRemaining === 0');
  assert(todayCalc.status === 'URGENT', 'Expiry Today has status URGENT');
  assert(todayCalc.humanRemaining === 'Due today', 'Expiry Today formats as "Due today"');

  // Edge case: Expiry Tomorrow
  const tomorrowDate = new Date('2026-10-02T19:00:00Z');
  const tomorrowCalc = calculateThingExpiry(tomorrowDate, null, 'ACTIVE', refDate);
  assert(tomorrowCalc.daysRemaining === 1, 'Expiry Tomorrow calculates daysRemaining === 1');
  assert(tomorrowCalc.status === 'URGENT', 'Expiry Tomorrow has status URGENT');
  assert(tomorrowCalc.humanRemaining === 'Tomorrow', 'Expiry Tomorrow formats as "Tomorrow"');

  // Edge case: Already Expired (Yesterday)
  const yesterdayDate = new Date('2026-09-30T10:00:00Z');
  const yesterdayCalc = calculateThingExpiry(yesterdayDate, null, 'ACTIVE', refDate);
  assert(yesterdayCalc.daysRemaining === -1, 'Expired Yesterday calculates daysRemaining === -1');
  assert(yesterdayCalc.status === 'OVERDUE', 'Expired Yesterday has status OVERDUE');
  assert(yesterdayCalc.isOverdue === true, 'isOverdue is true');

  // Edge case: Overdue by multiple days
  const overdueDate = new Date('2026-09-25T00:00:00Z');
  const overdueCalc = calculateThingExpiry(overdueDate, null, 'ACTIVE', refDate);
  assert(overdueCalc.daysRemaining === -6, 'Overdue by 6 days');
  assert(overdueCalc.humanRemaining === 'Overdue by 6 days', 'Human label displays overdue count');

  // Edge case: Due Soon (14 days)
  const dueSoonDate = new Date('2026-10-15T00:00:00Z');
  const dueSoonCalc = calculateThingExpiry(dueSoonDate, null, 'ACTIVE', refDate);
  assert(dueSoonCalc.status === 'DUE_SOON', '14 days remaining categorized as DUE_SOON');
  assert(dueSoonCalc.isDueSoon === true, 'isDueSoon is true');

  // Edge case: Upcoming months
  const monthsAhead = new Date('2026-12-01T00:00:00Z');
  const upcomingCalc = calculateThingExpiry(monthsAhead, null, 'ACTIVE', refDate);
  assert(upcomingCalc.status === 'ACTIVE', '60 days ahead is ACTIVE');
  assert(upcomingCalc.humanRemaining.includes('months') || upcomingCalc.humanRemaining.includes('month'), 'Formats as months');

  // Edge case: Renewed status
  const renewedCalc = calculateThingExpiry(todayDate, null, 'RENEWED', refDate);
  assert(renewedCalc.status === 'RENEWED', 'Explicit RENEWED status takes precedence');

  // Timezone / UTC hour variations within the same calendar day
  const earlyMorning = new Date('2026-10-05T01:00:00Z');
  const lateNightRef = new Date('2026-10-01T23:59:59Z');
  const diffDays = getCalendarDaysDiff(earlyMorning, lateNightRef);
  assert(diffDays === 4, 'Calendar day diff handles cross-hour timezone differences consistently');

  // --- INTEGRATION TESTS: User Auth, Multi-tenancy, Isolation ---
  console.log('\n[2] User Registration, Authentication & Tenant Isolation:');

  const testEmail1 = `tester1_${Date.now()}@duely.local`;
  const testEmail2 = `tester2_${Date.now()}@duely.local`;

  // Registration
  const user1 = await registerUser(testEmail1, 'SecurePass123!', 'Alice Tester');
  assert(!!user1.token, 'User 1 registered and received JWT token');
  assert(user1.user.email === testEmail1, 'User 1 email matches');

  const user2 = await registerUser(testEmail2, 'SecurePass456!', 'Bob Tester');
  assert(!!user2.token, 'User 2 registered successfully');

  // Duplicate registration rejection
  let duplicateRejected = false;
  try {
    await registerUser(testEmail1, 'OtherPass123!', 'Alice Copy');
  } catch (err: any) {
    duplicateRejected = true;
  }
  assert(duplicateRejected, 'Duplicate email registration rejected');

  // Login
  const loginSuccess = await loginUser(testEmail1, 'SecurePass123!');
  assert(!!loginSuccess.token, 'Login successful with correct password');

  let loginFailed = false;
  try {
    await loginUser(testEmail1, 'WrongPassword!');
  } catch {
    loginFailed = true;
  }
  assert(loginFailed, 'Login with incorrect password safely rejected');

  // --- INTEGRATION TESTS: Thing Creation, Reminders, Actions ---
  console.log('\n[3] Thing Creation, Actions, Reminders:');

  const thing1 = await createThing(user1.user.id, {
    name: 'Home Fire Insurance',
    categoryName: 'Insurance',
    expiryDate: new Date('2026-11-15T00:00:00Z').toISOString(),
    notes: 'Premium paid annually via credit card.',
    reminders: [30, 14, 7],
    initialAction: {
      title: 'Pay annual insurance premium',
      actionUrl: 'https://insurance.example.com',
    },
  });

  assert(thing1.name === 'Home Fire Insurance', 'Thing created with specified name');
  assert(thing1.reminders.length === 3, 'Multiple reminders created (30, 14, 7 days)');
  assert(thing1.actions.length === 1, 'Initial action created');
  assert(thing1.actions[0].title === 'Pay annual insurance premium', 'Action title matches');

  // Editing a thing
  const updatedThing = await updateThing(thing1.id, user1.user.id, {
    notes: 'Updated notes with policy number POL-7729',
  });
  assert(updatedThing.notes?.includes('POL-7729') === true, 'Thing updated successfully');

  // User 2 cannot access User 1's Thing (Multi-tenant isolation)
  let unauthorizedReadFailed = false;
  try {
    await getThingDetail(thing1.id, user2.user.id);
  } catch {
    unauthorizedReadFailed = true;
  }
  assert(unauthorizedReadFailed, 'Tenant isolation: User 2 cannot read User 1 item');

  // Action toggle
  const actionId = thing1.actions[0].id;
  const toggledAction = await updateAction(actionId, user1.user.id, { completed: true });
  assert(toggledAction.completed === true, 'Action marked as completed');

  // --- INTEGRATION TESTS: Renewal Lifecycle & Renewal History ---
  console.log('\n[4] Renewal Flow and Historical Archive:');

  const newExpiryDate = new Date('2027-11-15T00:00:00Z').toISOString();
  const renewedThing = await renewThing(thing1.id, user1.user.id, {
    newExpiryDate,
    cost: 12000,
    notes: 'Renewed for another year with 10% loyalty discount.',
  });

  assert(
    new Date(renewedThing.expiryDate!).toISOString().startsWith('2027-11-15'),
    'Expiry date advanced to new cycle'
  );
  assert(renewedThing.renewalHistory.length === 1, 'Renewal history entry archived');
  assert(renewedThing.renewalHistory[0].cost === 12000, 'Renewal history captured cost');

  // Clean up test records
  await deleteThing(thing1.id, user1.user.id);
  await prisma.user.delete({ where: { id: user1.user.id } });
  await prisma.user.delete({ where: { id: user2.user.id } });

  console.log('\n=============================================');
  console.log(`  RESULTS: ${passedTests} passed, ${failedTests} failed (Total: ${totalTests})`);
  console.log('=============================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAllTests()
  .catch((err) => {
    console.error('Test suite failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
