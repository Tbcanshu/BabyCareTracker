// Test API

// Since we are running in Node, we need to mock AsyncStorage and fetch.
// Actually, `api.js` imports AsyncStorage from '@react-native-async-storage/async-storage'.
// It's easier to just use standard fetch directly in a test script.

const BASE_URL = 'http://127.0.0.1:8000/api';
let authToken = null;

async function apiCall(endpoint, options = {}) {
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'API request failed');
  }

  return data;
}

async function runTest() {
  try {
    console.log("1. Registering new user...");
    const email = `test${Date.now()}@example.com`;
    let res = await apiCall('/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test User', email, password: 'password123' })
    });
    console.log("Register response:", res);
    
    authToken = res.token;
    
    console.log("\n2. Getting user profile...");
    res = await apiCall('/user');
    console.log("User profile:", res);
    
    console.log("\n3. Creating a baby...");
    res = await apiCall('/babies', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Baby', gender: 'Boy' })
    });
    console.log("Baby response:", res);
    
    const babyId = res.id;

    console.log("\n4. Adding a new baby activity...");
    res = await apiCall('/activities', {
      method: 'POST',
      body: JSON.stringify({ baby_id: babyId, type: 'milk', notes: JSON.stringify({ amount_oz: '4' }) })
    });
    console.log("Activity response:", res);
    
    console.log("\n5. Fetching activities...");
    res = await apiCall(`/activities?baby_id=${babyId}`);
    console.log("Activities response:", res);
    
    console.log("\n6. Logging out...");
    res = await apiCall('/logout', { method: 'POST' });
    console.log("Logout response:", res);
    
    console.log("\n✅ All API tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

runTest();
