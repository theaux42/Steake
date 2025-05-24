// Simple test script to verify login functionality
const fetch = require('node-fetch');

async function testLogin() {
  console.log('Testing login flow...');
  
  try {
    // Test login with admin credentials
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    const data = await response.json();
    console.log('Login response:', {
      status: response.status,
      success: data.success !== false,
      user: data.user?.username,
      error: data.error
    });
    
    // Extract session cookie
    const cookies = response.headers.get('set-cookie');
    console.log('Session cookie set:', !!cookies);
    
    if (cookies) {
      // Test session validation
      const sessionResponse = await fetch('http://localhost:3000/api/auth/session', {
        headers: {
          'Cookie': cookies
        }
      });
      
      const sessionData = await sessionResponse.json();
      console.log('Session validation:', {
        status: sessionResponse.status,
        user: sessionData.user?.username
      });
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testLogin();
