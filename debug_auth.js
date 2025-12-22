const request = require('supertest');

// Dynamically import the app
async function debugAuth() {
  const { app } = await import('./dist/app.js');
  
  const validRegistrationData = {
    name: 'New User',
    email: 'newuser@example.com',
    password: 'NewPassword123!',
    phone: '+1234567891',
  };

  try {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(validRegistrationData);

    console.log('Status:', response.status);
    console.log('Response body:', JSON.stringify(response.body, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

debugAuth();