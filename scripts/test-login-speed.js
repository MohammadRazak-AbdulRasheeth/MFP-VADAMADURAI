
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth/login';

// Replace with valid credentials from your database or seed data
const CREDENTIALS = {
    username: 'mfp_vadamadurai_admin',
    password: 'mfp_vadamadurai_admin_password'
};

async function testLoginSpeed() {
    console.log(`Starting login speed test...`);
    console.log(`Target: ${API_URL}`);

    try {
        const start = performance.now();
        const response = await axios.post(API_URL, CREDENTIALS);
        const end = performance.now();

        console.log(`✅ Login Successful!`);
        console.log(`⏱️ Total Request Time: ${(end - start).toFixed(2)}ms`);
        console.log(`Response Status: ${response.status}`);
    } catch (error) {
        console.error(`❌ Login Failed!`);
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Message: ${JSON.stringify(error.response.data)}`);
        } else {
            console.error(error.message);
        }
    }
}

testLoginSpeed();
