
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Admin credentials
const CREDENTIALS = {
    username: 'mfp_vadamadurai_admin',
    password: 'mfp_vadamadurai_admin_password'
};

async function testDashboardSpeed() {
    console.log(`Starting dashboard speed test...`);

    try {
        // 1. Login to get token
        console.log(`Logging in...`);
        const loginRes = await axios.post(`${API_URL}/auth/login`, CREDENTIALS);
        const token = loginRes.data.token;
        console.log(`✅ Login successful. Token obtained.`);

        // 2. Fetch Dashboard Stats
        console.log(`Stubbing dashboard stats request...`);
        const start = performance.now();

        const statsRes = await axios.get(`${API_URL}/dashboard/stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const end = performance.now();
        console.log(`✅ Dashboard Stats Fetched!`);
        console.log(`⏱️ Request Duration: ${(end - start).toFixed(2)}ms`);
        console.log(`Stats Summary:`, {
            members: statsRes.data.totalMembers,
            active: statsRes.data.activeMembers,
            revenue: statsRes.data.totalCollected
        });

    } catch (error) {
        console.error(`❌ Test Failed!`);
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Message: ${JSON.stringify(error.response.data)}`);
        } else {
            console.error(error.message);
        }
    }
}

testDashboardSpeed();
