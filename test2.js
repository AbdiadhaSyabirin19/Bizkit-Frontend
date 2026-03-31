import axios from 'axios';

async function test() {
    try {
        const res = await axios.post('http://localhost:1000/api/auth/login', {
            username: 'admin',
            password: 'password'
        });
        const token = res.data.data.token;

        const sale = await axios.get('http://localhost:1000/api/sales/28', {
            headers: { Authorization: `Bearer ${token}` }
        }).catch(e => { console.error("Sale 28 Error:", e.response?.status, e.response?.data || e.message) });

        if (sale) console.log("Sale 28:", sale.data.data?.invoice_number);

        const pay = await axios.get('http://localhost:1000/api/sales/28/payments', {
            headers: { Authorization: `Bearer ${token}` }
        }).catch(e => { console.error("Pay 28 Error:", e.response?.status, e.response?.data || e.message) });

        if (pay) console.log("Pay 28 Data:", pay.data.data);

        const sale27 = await axios.get('http://localhost:1000/api/sales/27/payments', {
            headers: { Authorization: `Bearer ${token}` }
        }).catch(e => { console.error("Pay 27 Error:", e.response?.status, e.response?.data || e.message) });

        if (sale27) console.log("Pay 27 Data:", sale27.data.data);

    } catch (err) {
        console.log("Login Error", err.response?.data || err.message);
    }
}
test();
