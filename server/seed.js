const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // Check if director already exists
    const existingDirector = await prisma.user.findUnique({
      where: { email: 'god@heaven.com' }
    });

    if (existingDirector) {
      console.log('👤 Director account already exists with email: god@heaven.com');
      console.log('🔄 Updating password...');
      
      // Update existing director with new password
      const hashedPassword = await bcrypt.hash('zerocool', 10);
      
      const updatedDirector = await prisma.user.update({
        where: { email: 'god@heaven.com' },
        data: {
          password: hashedPassword,
          role: 'director',
          status: 'approved',
          name: 'System Administrator'
        }
      });
      
      console.log('✅ Director account updated successfully');
      console.log(`📧 Email: ${updatedDirector.email}`);
      console.log(`👑 Role: ${updatedDirector.role}`);
      console.log(`✔️ Status: ${updatedDirector.status}`);
      
    } else {
      // Create new director account
      console.log('🔐 Hashing password...');
      const hashedPassword = await bcrypt.hash('zerocool', 10);

      console.log('👤 Creating director account...');
      const director = await prisma.user.create({
        data: {
          email: 'god@heaven.com',
          password: hashedPassword,
          name: 'System Administrator',
          role: 'director',
          status: 'approved', // Directors should be pre-approved
          schoolId: null // Directors don't belong to schools
        }
      });

      console.log('✅ Director account created successfully!');
      console.log(`📧 Email: ${director.email}`);
      console.log(`👑 Role: ${director.role}`);
      console.log(`✔️ Status: ${director.status}`);
      console.log(`🆔 User ID: ${director.id}`);
    }

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Email: god@heaven.com');
    console.log('   Password: zerocool');
    
  } catch (error) {
    console.error('❌ Error during seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('💥 Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('🔌 Disconnecting from database...');
    await prisma.$disconnect();
  });