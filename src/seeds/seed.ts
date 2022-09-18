import { PrismaClient } from '@prisma/client';
import { Role } from '../constants/roles';

const prisma = new PrismaClient();

const main = async () => {
  await prisma.role.deleteMany({});

  await prisma.role.createMany({
    data: [
      {
        roleName: Role.User
      },
      {
        roleName: Role.Admin
      }
    ]
  });
  return;
};

main()
  .then(async () => {
    console.error('Seeding completed successfully!');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    await prisma.$disconnect();
    process.exit(1);
  });
