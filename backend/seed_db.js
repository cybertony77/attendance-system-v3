const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');

// Load environment variables from env.config
const fs = require('fs');
const path = require('path');

function loadEnvConfig() {
  try {
    const envPath = path.join(__dirname, '..', 'env.config');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const index = trimmed.indexOf('=');
        if (index !== -1) {
          const key = trimmed.substring(0, index).trim();
          let value = trimmed.substring(index + 1).trim();
          value = value.replace(/^"|"$/g, ''); // strip quotes
          envVars[key] = value;
        }
      }
    });

    return envVars;
  } catch (error) {
    console.log('⚠️  Could not read env.config, using process.env as fallback');
    return {};
  }
}

const envConfig = loadEnvConfig();
const MONGO_URI =
  envConfig.MONGO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/topphysics';
const DB_NAME =
  envConfig.DB_NAME || process.env.DB_NAME || 'topphysics';

console.log('🔗 Using Mongo URI:', MONGO_URI);

function createWeeksArray() {
  const weeks = [];
  for (let i = 1; i <= 20; i++) {
    weeks.push({
      week: i,
      attended: false,
      lastAttendance: null,
      lastAttendanceCenter: null,
      hwDone: false,
      paidSession: false,
      quizDegree: null,
      message_state: false
    });
  }
  return weeks;
}

async function ensureCollectionsExist(db) {
  console.log('🔍 Checking if collections exist...');
  
  // Get list of existing collections
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map(col => col.name);
  
  // Check and create students collection if it doesn't exist
  if (!collectionNames.includes('students')) {
    console.log('📚 Creating students collection...');
    await db.createCollection('students');
    console.log('✅ Students collection created');
  } else {
    console.log('✅ Students collection already exists');
  }
  
  // Check and create assistants collection if it doesn't exist
  if (!collectionNames.includes('assistants')) {
    console.log('👥 Creating assistants collection...');
    await db.createCollection('assistants');
    console.log('✅ Assistants collection created');
  } else {
    console.log('✅ Assistants collection already exists');
  }
  
  // Check and create history collection if it doesn't exist
  if (!collectionNames.includes('history')) {
    console.log('📖 Creating history collection...');
    await db.createCollection('history');
    console.log('✅ History collection created');
  } else {
    console.log('✅ History collection already exists');
  }
}

async function seedDatabase() {
  let client;
  try {
    client = await MongoClient.connect(MONGO_URI);
    const db = client.db(DB_NAME);
    
    // Ensure collections exist before proceeding
    await ensureCollectionsExist(db);
    
    console.log('🗑️ Clearing existing data...');
    await db.collection('students').deleteMany({});
    await db.collection('assistants').deleteMany({});
    await db.collection('history').deleteMany({});
    
    console.log('✅ Database cleared');
    
    // Create assistants with unique passwords
    const assistants = [
      {
        id: 'admin',
        name: 'Admin',
        phone: faker.phone.number(),
        role: 'admin',
        password: await bcrypt.hash('admin', 10)
      },
      {
        id: 'tony',
        name: 'Tony Joseph',
        phone: faker.phone.number(),
        role: 'admin',
        password: await bcrypt.hash('tony', 10)
      },
      {
        id: 'assistant1',
        name: 'Assistant 1',
        phone: faker.phone.number(),
        role: 'assistant',
        password: await bcrypt.hash('admin', 10)
      },
      {
        id: 'assistant2',
        name: 'Assistant 2',
        phone: faker.phone.number(),
        role: 'assistant',
        password: await bcrypt.hash('admin', 10)
      }
    ];
    
    console.log('👥 Creating assistants...');
    await db.collection('assistants').insertMany(assistants);
    console.log(`✅ Created ${assistants.length} assistants`);
    
    const students = [];
    const centers = [
      'Egypt Center',
      'Kayan Center', 
      'Hany Pierre Center',
      'Tabark Center',
      'EAY Center',
      'St. Mark Church'
    ];
    const grades = ['1st secondary', '2nd secondary', '3rd secondary'];
    
    for (let i = 1; i <= 80; i++) {
      const center = centers[Math.floor(Math.random() * centers.length)];
      const weeks = createWeeksArray();
      
      students.push({
        id: i,
        name: faker.person.fullName(),
        age: Math.floor(Math.random() * 6) + 10,
        grade: grades[Math.floor(Math.random() * grades.length)],
        school: faker.company.name() + ' School',
        phone: faker.phone.number(),
        parentsPhone: faker.phone.number(),
        main_center: center,
        weeks: weeks
      });
    }
    
    console.log('👨‍🎓 Creating students...');
    await db.collection('students').insertMany(students);
    console.log(`✅ Created ${students.length} students`);
    

    
    console.log('🎉 Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`- ${assistants.length} assistants created (no center field)`);
    console.log(`- ${students.length} students created with weeks array structure`);
    console.log('- History collection cleared (no initial records)');
    console.log('\n🔑 Demo Login Credentials:');
    console.log('Admin ID: admin, Password: admin');
    console.log('Tony ID: tony, Password: tony');
    console.log('Assistant 1 ID: assistant1, Password: admin');
    console.log('Assistant 2 ID: assistant2, Password: admin');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    if (client) await client.close();
  }
}

seedDatabase();
