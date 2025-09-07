// verify-migration.js
const { PrismaClient: SqlitePrisma } = require('./prisma/generated/sqlite-client');
const { PrismaClient: PostgresPrisma } = require('@prisma/client');

const sqliteClient = new SqlitePrisma();
const postgresClient = new PostgresPrisma();

async function verifyMigration() {
  try {
    console.log('🔍 Verifying migration...\n');

    // Check record counts
    const tables = ['school', 'user', 'uploadedFile', 'practiceClone', 'analysisQuestion'];
    
    for (const table of tables) {
      const sqliteCount = await sqliteClient[table].count();
      const postgresCount = await postgresClient[table].count();
      
      const status = sqliteCount === postgresCount ? '✅' : '❌';
      console.log(`${status} ${table}: SQLite ${sqliteCount} → PostgreSQL ${postgresCount}`);
    }

    // Check specific data samples
    console.log('\n📊 Sample Data Check:');
    
    const pgSchools = await postgresClient.school.findMany({ take: 3 });
    console.log(`Schools: ${pgSchools.map(s => s.name).join(', ')}`);
    
    const pgUsers = await postgresClient.user.findMany({ take: 3 });
    console.log(`Users: ${pgUsers.map(u => `${u.name} (${u.role})`).join(', ')}`);

    console.log('\n✅ Verification completed!');
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await sqliteClient.$disconnect();
    await postgresClient.$disconnect();
  }
}

verifyMigration();