// Test script to verify JWT authentication
const testJWTAuth = async () => {
  const baseURL = 'http://localhost:3000';
  
  console.log('🧪 Testing JWT Authentication System\n');

  try {
    // Test 1: Try to access session without token
    console.log('1. Testing session without token...');
    let response = await fetch(`${baseURL}/api/auth/session`);
    console.log(`   Status: ${response.status} - ${response.status === 401 ? '✅ Correctly unauthorized' : '❌ Should be unauthorized'}\n`);

    // Test 2: Login with credentials
    console.log('2. Testing login...');
    response = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      }),
    });

    if (response.ok) {
      const loginData = await response.json();
      console.log(`   ✅ Login successful for user: ${loginData.user.username}`);
      
      // Extract JWT token from cookie
      const setCookieHeader = response.headers.get('set-cookie');
      const tokenMatch = setCookieHeader?.match(/steake-token=([^;]+)/);
      const jwtToken = tokenMatch ? tokenMatch[1] : null;
      
      if (jwtToken) {
        console.log(`   ✅ JWT token received: ${jwtToken.substring(0, 50)}...`);
        
        // Test 3: Access session with JWT token
        console.log('\n3. Testing session with JWT token...');
        response = await fetch(`${baseURL}/api/auth/session`, {
          headers: {
            'Cookie': `steake-token=${jwtToken}`
          }
        });
        
        if (response.ok) {
          const sessionData = await response.json();
          console.log(`   ✅ Session valid for user: ${sessionData.user.username}`);
          console.log(`   ✅ User balance: $${sessionData.user.balance}`);
          console.log(`   ✅ Admin status: ${sessionData.user.isAdmin ? 'Yes' : 'No'}`);
        } else {
          console.log(`   ❌ Session check failed: ${response.status}`);
        }

        // Test 4: Logout
        console.log('\n4. Testing logout...');
        response = await fetch(`${baseURL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Cookie': `steake-token=${jwtToken}`
          }
        });
        
        if (response.ok) {
          console.log('   ✅ Logout successful');
          
          // Test 5: Try to access session after logout
          console.log('\n5. Testing session after logout...');
          const setCookieAfterLogout = response.headers.get('set-cookie');
          const clearedToken = setCookieAfterLogout?.includes('steake-token=;');
          
          if (clearedToken) {
            console.log('   ✅ JWT token cleared on logout');
          } else {
            console.log('   ❌ JWT token not properly cleared');
          }
        } else {
          console.log(`   ❌ Logout failed: ${response.status}`);
        }
      } else {
        console.log('   ❌ No JWT token received in login response');
      }
    } else {
      const errorData = await response.json();
      console.log(`   ❌ Login failed: ${errorData.error}`);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }

  console.log('\n🏁 JWT Authentication tests completed');
};

// Run the test
testJWTAuth();
