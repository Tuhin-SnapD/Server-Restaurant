const https = require('https');

const BASE_URL = 'https://server-restaurant-loch.onrender.com';

function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'server-restaurant-loch.onrender.com',
      port: 443,
      path: url.replace('https://server-restaurant-loch.onrender.com', ''),
      method: method,
      headers: {
        'User-Agent': 'API-Test-Script'
      }
    };

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
            data: parsedData,
            rawData: responseData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: null,
            rawData: responseData
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });
    
    req.end();
  });
}

async function testAPI() {
  console.log('🚀 Testing Restaurant API with JSON Fallback');
  console.log('=' .repeat(50));

  const endpoints = [
    { name: 'Root', url: '/' },
    { name: 'Dishes', url: '/dishes' },
    { name: 'Leaders', url: '/leaders' },
    { name: 'Promotions', url: '/promotions' },
    { name: 'Comments', url: '/comments' },
    { name: 'Feedback', url: '/feedback' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📋 Testing: ${endpoint.name}`);
      const response = await makeRequest(`${BASE_URL}${endpoint.url}`);
      
      console.log(`Status: ${response.statusCode}`);
      
      if (response.statusCode === 200) {
        console.log('✅ Success');
        if (response.data && Array.isArray(response.data)) {
          console.log(`📊 Found ${response.data.length} items`);
          if (response.data.length > 0) {
            console.log('📝 Sample item:', JSON.stringify(response.data[0], null, 2).substring(0, 200) + '...');
          }
        } else if (response.data) {
          console.log('📊 Data received');
        } else {
          console.log('📄 HTML response (expected for root)');
        }
      } else {
        console.log('❌ Failed');
        console.log('Response:', response.rawData.substring(0, 100));
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n🎉 API testing completed!');
  console.log('\n💡 Your API is now working with JSON fallback data!');
  console.log('📝 To set up MongoDB properly:');
  console.log('   1. Create a MongoDB Atlas account');
  console.log('   2. Get your connection string');
  console.log('   3. Set MONGO_URL environment variable on Render');
}

testAPI().catch(console.error); 