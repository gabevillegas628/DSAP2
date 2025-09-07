const { PrismaClient: SqlitePrisma } = require('./prisma/generated/sqlite-client');
const { PrismaClient: PostgresPrisma } = require('@prisma/client');

const fs = require('fs');

// Old SQLite client
const sqliteClient = new SqlitePrisma();

// New PostgreSQL client
const postgresClient = new PostgresPrisma();

// Add this before the migration to debug:
async function debugIds() {
  console.log('=== SQLite Schools ===');
  const sqliteSchools = await sqliteClient.school.findMany({ select: { id: true, name: true } });
  console.log(sqliteSchools);

  console.log('=== PostgreSQL Schools ===');
  const postgresSchools = await postgresClient.school.findMany({ select: { id: true, name: true } });
  console.log(postgresSchools);

  console.log('=== SQLite Users with schoolId ===');
  const usersWithSchools = await sqliteClient.user.findMany({ 
    where: { schoolId: { not: null } },
    select: { email: true, schoolId: true, role: true }
  });
  console.log(usersWithSchools);
}


async function migrateData() {
  try {
    console.log('🔄 Starting database migration...');

    // 1. Clear existing data (optional, be careful!)
    console.log('🧹 Clearing existing data...');
    await postgresClient.user.deleteMany({});
    await postgresClient.school.deleteMany({});

    // 2. Migrate Schools FIRST and create ID mapping
    console.log('📚 Migrating schools...');
    const schools = await sqliteClient.school.findMany();
    const schoolIdMapping = new Map(); // oldId -> newId
    
    for (const school of schools) {
      const { id: oldId, ...schoolData } = school;
      const newSchool = await postgresClient.school.create({ data: schoolData });
      schoolIdMapping.set(oldId, newSchool.id);
      console.log(`✅ School: ${school.name} (${oldId} -> ${newSchool.id})`);
    }

    // 3. Migrate Users with corrected schoolId references
    console.log('👥 Migrating users...');
    const users = await sqliteClient.user.findMany();
    
    for (const user of users) {
      const { id: oldUserId, schoolId: oldSchoolId, ...userData } = user;
      
      // Translate old schoolId to new schoolId
      let newSchoolId = null;
      if (oldSchoolId !== null) {
        newSchoolId = schoolIdMapping.get(oldSchoolId);
        if (!newSchoolId) {
          console.warn(`⚠️ Warning: No mapping found for schoolId ${oldSchoolId} for user ${user.email}`);
          continue; // Skip this user or set schoolId to null
        }
      }
      
      try {
        const newUser = await postgresClient.user.create({ 
          data: {
            ...userData,
            schoolId: newSchoolId
          }
        });
        console.log(`✅ User: ${user.email} (${user.role}) - schoolId: ${oldSchoolId} -> ${newSchoolId}`);
      } catch (error) {
        console.error(`❌ Failed to create user ${user.email}:`, error.message);
      }
    }

    // 4. Continue with other tables using similar ID mapping...
    
    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrateData();