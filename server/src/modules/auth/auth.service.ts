import { prisma } from '../../config/db.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { signToken } from '../../utils/token.js';

export const DEFAULT_CATEGORIES = [
  'Documents',
  'Vehicles',
  'Insurance',
  'Warranties',
  'Subscriptions',
  'Memberships',
  'Property',
  'Education',
  'Finance',
  'Technology',
  'Other',
];

export async function registerUser(email: string, password: string, name: string) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please provide a valid email address.');
  }

  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  if (!cleanName) {
    throw new Error('Please provide your name.');
  }

  const existing = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: cleanEmail,
      name: cleanName,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  // Seed default categories for this user
  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((catName) => ({
      userId: user.id,
      name: catName,
    })),
  });

  const token = signToken({ userId: user.id, email: user.email });

  return { user, token };
}

export async function loginUser(email: string, password: string) {
  const cleanEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!user) {
    throw new Error('Invalid email or password. Please try again.');
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid email or password. Please try again.');
  }

  const token = signToken({ userId: user.id, email: user.email });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
    token,
  };
}
