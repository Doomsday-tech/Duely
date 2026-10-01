import fs from 'fs';
import path from 'path';
import { prisma } from './config/db.js';
import { hashPassword } from './utils/password.js';
import { calculateThingExpiry } from './utils/expiry.js';
import { DEFAULT_CATEGORIES } from './modules/auth/auth.service.js';

export async function runSeed() {
  console.log('--- DUELY: Seeding Development Data ---');
  console.log('NOTE: These accounts and dates are for local development/testing only.');

  const uploadDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const createSampleFile = (filename: string, content: string) => {
    const fullPath = path.join(uploadDir, filename);
    if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, content);
    }
    return fullPath;
  };

  const sampleInsurancePath = createSampleFile(
    'car-insurance-policy-2026.pdf',
    '%PDF-1.4\n1 0 obj\n<< /Title (Duely Sample Motor Insurance Policy) /Author (Duely Dev) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF'
  );

  const sampleInvoicePath = createSampleFile(
    'apple-purchase-invoice.pdf',
    '%PDF-1.4\n1 0 obj\n<< /Title (MacBook Pro Tax Invoice) /Author (Apple Store) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF'
  );

  const samplePassportPath = createSampleFile(
    'passport-copy.pdf',
    '%PDF-1.4\n1 0 obj\n<< /Title (Passport Biometric Data Page) /Author (Passport Authority) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF'
  );

  const sampleAgreementPath = createSampleFile(
    'lease-agreement-signed.pdf',
    '%PDF-1.4\n1 0 obj\n<< /Title (Residential Tenancy Agreement) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF'
  );

  const demoEmail = 'demo@duely.local';
  const demoPassword = 'Password123!';
  const demoName = 'Aryan';

  const existingUser = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (existingUser) {
    console.log(`Cleaning existing demo user (${demoEmail})...`);
    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  const passwordHash = await hashPassword(demoPassword);
  const user = await prisma.user.create({
    data: {
      email: demoEmail,
      name: demoName,
      passwordHash,
    },
  });

  console.log(`Created demo user: ${user.email} (id: ${user.id})`);

  const categoriesMap: Record<string, string> = {};
  for (const catName of DEFAULT_CATEGORIES) {
    const cat = await prisma.category.create({
      data: {
        userId: user.id,
        name: catName,
      },
    });
    categoriesMap[catName] = cat.id;
  }

  const today = new Date();
  const addDays = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d;
  };
  const addMonths = (months: number) => {
    const d = new Date(today);
    d.setMonth(d.getMonth() + months);
    return d;
  };
  const addYears = (years: number) => {
    const d = new Date(today);
    d.setFullYear(d.getFullYear() + years);
    return d;
  };

  // 1. Car Insurance (Expires in 6 days) - ATTENTION
  const carExpiry = addDays(6);
  const carCalc = calculateThingExpiry(carExpiry, null, 'ACTIVE', today);
  const carInsurance = await prisma.thing.create({
    data: {
      userId: user.id,
      categoryId: categoriesMap['Insurance'],
      name: 'Car Insurance',
      description: 'HDFC ERGO Comprehensive Motor Insurance for Honda City',
      expiryDate: carExpiry,
      status: carCalc.status,
      notes: 'Third-party & Own Damage policy. Includes zero-depreciation and 24x7 roadside assistance.',
    },
  });

  await prisma.action.create({
    data: {
      userId: user.id,
      thingId: carInsurance.id,
      title: 'Renew car insurance',
      actionUrl: 'https://www.hdfcergo.com/renew',
      notes: 'Check if NCB (No Claim Bonus) of 35% is applied. Compare quotes before paying.',
      completed: false,
    },
  });

  await prisma.document.create({
    data: {
      userId: user.id,
      thingId: carInsurance.id,
      filename: path.basename(sampleInsurancePath),
      originalName: 'car-insurance-2025-2026.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      filePath: sampleInsurancePath,
      documentType: 'POLICY',
      issueDate: addDays(-359),
      expiryDate: carExpiry,
      identifier: 'POL-99281-2025',
      extractedMeta: JSON.stringify({
        documentType: 'POLICY',
        expiryDate: carExpiry.toISOString().split('T')[0],
        identifier: 'POL-99281-2025',
        confidence: 'high',
      }),
    },
  });

  for (const days of [14, 7, 1]) {
    const rDate = new Date(carExpiry);
    rDate.setDate(rDate.getDate() - days);
    await prisma.reminder.create({
      data: {
        userId: user.id,
        thingId: carInsurance.id,
        daysBefore: days,
        remindAt: rDate,
        status: rDate <= today ? 'TRIGGERED' : 'PENDING',
        triggeredAt: rDate <= today ? rDate : null,
      },
    });
  }

  await prisma.renewalHistory.create({
    data: {
      userId: user.id,
      thingId: carInsurance.id,
      previousExpiry: addDays(-359),
      newExpiry: carExpiry,
      renewedAt: addDays(-359),
      cost: 14500,
      notes: '2025 renewal completed with 25% NCB.',
    },
  });

  // 2. Domain (Renews in 12 days) - ATTENTION
  const domainExpiry = addDays(12);
  const domainCalc = calculateThingExpiry(domainExpiry, null, 'ACTIVE', today);
  const domainThing = await prisma.thing.create({
    data: {
      userId: user.id,
      categoryId: categoriesMap['Technology'],
      name: 'duelyapp.dev (Domain)',
      description: 'Primary product domain registered on Porkbun',
      expiryDate: domainExpiry,
      renewalDate: domainExpiry,
      status: domainCalc.status,
      notes: 'DNS managed on Cloudflare. Auto-renew credit card is updated.',
    },
  });

  await prisma.action.create({
    data: {
      userId: user.id,
      thingId: domainThing.id,
      title: 'Review registrar payment method',
      actionUrl: 'https://porkbun.com/account/domains',
      completed: false,
    },
  });

  await prisma.reminder.create({
    data: {
      userId: user.id,
      thingId: domainThing.id,
      daysBefore: 14,
      remindAt: addDays(-2),
      status: 'TRIGGERED',
      triggeredAt: addDays(-2),
    },
  });

  // 3. Laptop Warranty (Expires in 27 days) - ATTENTION
  const laptopExpiry = addDays(27);
  const laptopCalc = calculateThingExpiry(laptopExpiry, null, 'ACTIVE', today);
  const laptopThing = await prisma.thing.create({
    data: {
      userId: user.id,
      categoryId: categoriesMap['Warranties'],
      name: 'MacBook Pro 16-inch Warranty',
      description: 'AppleCare+ 2-year warranty coverage',
      purchaseDate: addDays(-703),
      expiryDate: laptopExpiry,
      status: laptopCalc.status,
      notes: 'Purchased from Apple BKC. Battery health currently at 86%.',
    },
  });

  await prisma.action.create({
    data: {
      userId: user.id,
      thingId: laptopThing.id,
      title: 'Run Apple Diagnostics and battery diagnostics',
      notes: 'If battery drops under 80%, eligible for free AppleCare replacement.',
      completed: false,
    },
  });

  await prisma.document.create({
    data: {
      userId: user.id,
      thingId: laptopThing.id,
      filename: path.basename(sampleInvoicePath),
      originalName: 'apple-invoice-mbp16.pdf',
      mimeType: 'application/pdf',
      size: 1540,
      filePath: sampleInvoicePath,
      documentType: 'INVOICE',
      issueDate: addDays(-703),
      expiryDate: laptopExpiry,
      identifier: 'INV-APL-409192',
      extractedMeta: JSON.stringify({
        documentType: 'INVOICE',
        identifier: 'INV-APL-409192',
        confidence: 'high',
      }),
    },
  });

  // 4. Rent Agreement (Expires in 2 months) - UPCOMING
  const rentExpiry = addMonths(2);
  const rentCalc = calculateThingExpiry(rentExpiry, null, 'ACTIVE', today);
  const rentThing = await prisma.thing.create({
    data: {
      userId: user.id,
      categoryId: categoriesMap['Property'],
      name: 'Apartment Rent Agreement',
      description: '11-Month registered residential rental lease',
      expiryDate: rentExpiry,
      status: rentCalc.status,
      notes: 'Landlord: Vikram Mehta. Security deposit held: 2 months rent.',
    },
  });

  await prisma.action.create({
    data: {
      userId: user.id,
      thingId: rentThing.id,
      title: 'Notify landlord regarding lease renewal / notice period',
      notes: 'Requires 1 month advance notice according to Clause 8.',
      completed: false,
    },
  });

  await prisma.document.create({
    data: {
      userId: user.id,
      thingId: rentThing.id,
      filename: path.basename(sampleAgreementPath),
      originalName: 'registered-rent-agreement.pdf',
      mimeType: 'application/pdf',
      size: 2048,
      filePath: sampleAgreementPath,
      documentType: 'CONTRACT',
      issueDate: addMonths(-9),
      expiryDate: rentExpiry,
    },
  });

  // 5. Passport (11 months) - UPCOMING
  const passportExpiry = addMonths(11);
  const passportCalc = calculateThingExpiry(passportExpiry, null, 'ACTIVE', today);
  const passportThing = await prisma.thing.create({
    data: {
      userId: user.id,
      categoryId: categoriesMap['Documents'],
      name: 'Passport (Republic of India)',
      description: 'Standard 36-page passport',
      expiryDate: passportExpiry,
      status: passportCalc.status,
      notes: 'Most countries require 6 months validity. Schedule reissue appointment at 9 months.',
    },
  });

  await prisma.document.create({
    data: {
      userId: user.id,
      thingId: passportThing.id,
      filename: path.basename(samplePassportPath),
      originalName: 'passport-scanned-copy.pdf',
      mimeType: 'application/pdf',
      size: 1800,
      filePath: samplePassportPath,
      documentType: 'PASSPORT',
      expiryDate: passportExpiry,
      identifier: 'Z8472910',
    },
  });

  // 6. Driving Licence (2 years) - UPCOMING
  const dlExpiry = addYears(2);
  const dlCalc = calculateThingExpiry(dlExpiry, null, 'ACTIVE', today);
  await prisma.thing.create({
    data: {
      userId: user.id,
      categoryId: categoriesMap['Documents'],
      name: 'Driving Licence',
      description: 'Motor vehicle non-transport driving licence',
      expiryDate: dlExpiry,
      status: dlCalc.status,
      notes: 'Smart card issued by RTO MH-02.',
    },
  });

  // 7. Gym Membership (45 days) - UPCOMING
  const gymExpiry = addDays(45);
  const gymCalc = calculateThingExpiry(gymExpiry, null, 'ACTIVE', today);
  await prisma.thing.create({
    data: {
      userId: user.id,
      categoryId: categoriesMap['Memberships'],
      name: 'Cult.Fit Gym Membership',
      description: 'Cult Elite annual membership pass',
      expiryDate: gymExpiry,
      status: gymCalc.status,
      notes: 'Check for renewal flash sale before current validity ends.',
    },
  });

  console.log('--- Development seed completed successfully! ---');
  console.log(`Demo Credentials:`);
  console.log(`Email:    ${demoEmail}`);
  console.log(`Password: ${demoPassword}`);
}

// Auto seed if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeed()
    .catch((err) => {
      console.error('Seed script failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
