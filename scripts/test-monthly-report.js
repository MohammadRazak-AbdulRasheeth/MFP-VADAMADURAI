
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Admin credentials
const CREDENTIALS = {
    username: 'mfp_vadamadurai_admin',
    password: 'mfp_vadamadurai_admin_password'
};

async function testReport() {
    console.log(`Starting Monthly Report test...`);

    try {
        // 1. Login
        console.log(`Logging in...`);
        const loginRes = await axios.post(`${API_URL}/auth/login`, CREDENTIALS);
        const token = loginRes.data.token;

        // 2. Fetch Report
        console.log(`Fetching monthly growth report...`);
        const res = await axios.get(`${API_URL}/reports/monthly_growth`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`✅ Report Fetched Successfully!`);
        console.log(`Data Length: ${res.data.length}`);
        if (res.data.length > 0) {
            console.log(`Sample Data (First Month):`, JSON.stringify(res.data[0], null, 2));
        } else {
            console.log(`⚠️ Report came back empty (might be no data yet).`);
        }

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

testReport();
