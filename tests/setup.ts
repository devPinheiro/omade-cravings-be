import { 
  testSequelize, 
  initializeTestDatabase, 
  closeTestDatabase, 
  cleanTestDatabase 
} from '../src/config/testDatabase';

beforeAll(async () => {
  try {
    // Initialize in-memory SQLite test database
    await initializeTestDatabase();
    console.log('✅ Test database initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize test database:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    // Close test database connection
    await closeTestDatabase();
    console.log('✅ Test database connection closed');
  } catch (error) {
    console.error('⚠️ Cleanup warning:', error);
  }
});

beforeEach(async () => {
  try {
    // Clean all tables before each test
    await cleanTestDatabase();
  } catch (error) {
    console.error('⚠️ Failed to clean test database:', error);
    throw error;
  }
});