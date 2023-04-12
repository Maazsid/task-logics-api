import { PrismaClient } from '@prisma/client';
import { RoleEnum } from '../constants/rolesEnum';


const prisma = new PrismaClient();

const main = async () => {
  await prisma.role.deleteMany({});

  await prisma.$queryRaw`ALTER SEQUENCE roles_id_seq RESTART WITH 1;`;

  await prisma.role.createMany({
    data: [
      {
        roleName: RoleEnum.User
      },
      {
        roleName: RoleEnum.Admin
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

  await prisma.rolePermission.deleteMany({});

  await prisma.$queryRaw`ALTER SEQUENCE role_permissions_id_seq RESTART WITH 1`;

  await prisma.rolePermission.createMany({
    data: [
      {
        roleId: 1,
        permissionId: 1
      }
    ]
  });
};

main()
  .then(async () => {
    console.error('Seeding completed successfully!');
    await prisma.$disconnect();
  })
  .catch(async () => {
    await prisma.$disconnect();
    process.exit(1);
  });
