const https = require('https');

const BASE_URL = 'https://server-restaurant-loch.onrender.com';

// Helper function to make HTTP requests
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'server-restaurant-loch.onrender.com',
      port: 443,
      path: url.replace('https://server-restaurant-loch.onrender.com', ''),
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'API-Test-Script'
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
            rawData: responseData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: responseData
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test endpoints
async function testEndpoints() {
  console.log('🚀 Testing Restaurant API at:', BASE_URL);
  console.log('=' .repeat(60));

  const tests = [
    { name: 'Root endpoint', url: '/', method: 'GET' },
    { name: 'Dishes endpoint', url: '/dishes', method: 'GET' },
    { name: 'Leaders endpoint', url: '/leaders', method: 'GET' },
    { name: 'Promotions endpoint', url: '/promotions', method: 'GET' },
    { name: 'Comments endpoint', url: '/comments', method: 'GET' },
    { name: 'Feedback endpoint', url: '/feedback', method: 'GET' },
    { name: 'Favorites endpoint', url: '/favorites', method: 'GET' },
    { name: 'Users endpoint', url: '/users', method: 'GET' },
  ];

  for (const test of tests) {
    try {
      console.log(`\n📋 Testing: ${test.name}`);
      console.log(`URL: ${BASE_URL}${test.url}`);
      
      const response = await makeRequest(`${BASE_URL}${test.url}`, test.method);
      
      console.log(`Status: ${response.statusCode}`);
      
      if (response.statusCode === 200) {
        console.log('✅ Success');
        if (response.data && typeof response.data === 'object') {
          if (Array.isArray(response.data)) {
            console.log(`📊 Data: Array with ${response.data.length} items`);
            if (response.data.length > 0) {
              console.log('📝 First item:', JSON.stringify(response.data[0], null, 2));
            }
          } else {
            console.log('📊 Data:', JSON.stringify(response.data, null, 2));
          }
        } else {
          console.log('📄 Response:', response.rawData.substring(0, 200) + '...');
        }
      } else if (response.statusCode === 401) {
        console.log('🔒 Authentication required');
      } else if (response.statusCode === 404) {
        console.log('❌ Endpoint not found');
      } else {
        console.log('⚠️ Unexpected status code');
        console.log('Response:', response.rawData);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('-'.repeat(40));
  }

  // Test with authentication (if needed)
  console.log('\n🔐 Testing authentication endpoints...');
  
  const authTests = [
    { name: 'User registration', url: '/users/signup', method: 'POST', data: { username: 'testuser', password: 'testpass' } },
    { name: 'User login', url: '/users/login', method: 'POST', data: { username: 'testuser', password: 'testpass' } }
  ];

  for (const test of authTests) {
    try {
      console.log(`\n📋 Testing: ${test.name}`);
      console.log(`URL: ${BASE_URL}${test.url}`);
      
      const response = await makeRequest(`${BASE_URL}${test.url}`, test.method, test.data);
      
      console.log(`Status: ${response.statusCode}`);
      
      if (response.statusCode === 200 || response.statusCode === 201) {
        console.log('✅ Success');
        console.log('📊 Response:', JSON.stringify(response.data, null, 2));
      } else if (response.statusCode === 400) {
        console.log('⚠️ Bad request (expected for test data)');
      } else if (response.statusCode === 401) {
        console.log('🔒 Authentication failed');
      } else {
        console.log('⚠️ Unexpected status code');
        console.log('Response:', response.rawData);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('-'.repeat(40));
  }

  console.log('\n🎉 API testing completed!');
}

// Run the tests
testEndpoints().catch(console.error); 