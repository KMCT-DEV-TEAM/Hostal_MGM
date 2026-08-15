import 'dotenv/config';
import prisma from '../src/config/db.js';
import bcrypt from 'bcryptjs';


async function main() {
  const adminEmail = 'admin@admin.com';
  const plainPassword = 'admin'; // simple default password

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`Admin user already exists with email: ${adminEmail}`);
    return;
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Admin User',
    },
  });

  console.log(`Admin created successfully!`);
  console.log(`Email: ${adminEmail}`);
  console.log(`Password: ${plainPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
