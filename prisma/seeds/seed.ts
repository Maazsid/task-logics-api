import { PrismaClient } from '@prisma/client';
import { Role } from '../../src/constants/roles';

const prisma = new PrismaClient();

const main = async () => {
  await prisma.role.deleteMany({});

  await prisma.$queryRaw`ALTER SEQUENCE roles_id_seq RESTART WITH 1;`;

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

  await prisma.permission.deleteMany({});

  await prisma.$queryRaw`ALTER SEQUENCE permissions_id_seq RESTART WITH 1`;

  await prisma.permission.createMany({
    data: [
      {
        resource: 'User',
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true
      }
    ]
  });
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
