const http = require('http');

async function testPendingRequests() {
  try {
    console.log('🧪 Testing pending requests endpoint...');
    
    // First, let's login to get a token
    const loginData = JSON.stringify({
      emplNo: 'EMP001',
      password: 'secret123' // Adjust if needed
    });
    
    const loginOptions = {
      hostname: '192.168.100.14',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };
    
    const loginResponse = await new Promise((resolve, reject) => {
      const req = http.request(loginOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve({ status: res.statusCode, data: response });
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        });
      });
      
      req.on('error', reject);
      req.write(loginData);
      req.end();
    });
    
    if (loginResponse.status !== 200) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful, token obtained');
    
    // Now test the pending requests endpoint
    const pendingOptions = {
      hostname: '192.168.100.14',
      port: 5000,
      path: '/api/requests/pending',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const pendingResponse = await new Promise((resolve, reject) => {
      const req = http.request(pendingOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve({ status: res.statusCode, data: response });
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        });
      });
      
      req.on('error', reject);
      req.end();
    });
    
    console.log('📊 Pending requests response:');
    console.log('Status:', pendingResponse.status);
    console.log('Data length:', pendingResponse.data.length);
    
    if (pendingResponse.data.length > 0) {
      console.log('\n📋 First request details:');
      const firstRequest = pendingResponse.data[0];
      console.log('ID:', firstRequest.id);
      console.log('Pickup Location:', firstRequest.pickupLocation);
      console.log('Delivery Location:', firstRequest.deliveryLocation);
      console.log('Priority:', firstRequest.priority);
      console.log('Pickup Date:', firstRequest.pickupDate);
      console.log('Created At:', firstRequest.createdAt);
      console.log('My Status:', firstRequest.myStatus);
      console.log('Service Type:', firstRequest.ServiceType);
      console.log('Service Type ID:', firstRequest.serviceTypeId);
      
      console.log('\n🔍 Raw response data:');
      console.log(JSON.stringify(firstRequest, null, 2));
    } else {
      console.log('❌ No pending requests found');
    }
    
  } catch (error) {
    console.error('❌ Error testing pending requests:', error.message);
  }
}

testPendingRequests(); 