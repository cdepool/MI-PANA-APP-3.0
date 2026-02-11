const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Configuración de Bancamiga
const BANCAMIGA_HOST = 'https://adminp2p.sitca-ve.com';

// Ruta de diagnóstico de IP
app.get('/proxy-ip-test', async (req, res) => {
    try {
        const response = await axios.get('https://api.ipify.org?format=json');
        res.json({ proxy_ip: response.data.ip });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.all('*', async (req, res) => {
    const { path, method, headers, body } = req;

    // Limpiar headers sensibles que pueden confundir al servidor de destino
    const cleanHeaders = { ...headers };
    delete cleanHeaders.host;
    delete cleanHeaders.connection;

    console.log(`[Proxy] ${new Date().toISOString()} - Forwarding ${method} ${path}`);

    try {
        const response = await axios({
            url: `${BANCAMIGA_HOST}${path}`,
            method,
            headers: {
                ...cleanHeaders,
                'Host': 'adminp2p.sitca-ve.com',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Referer': 'https://adminp2p.sitca-ve.com/',
                'Origin': 'https://adminp2p.sitca-ve.com'
            },
            data: body,
            timeout: 15000,
            validateStatus: () => true
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        const data = error.response?.data || { error: error.message };

        console.error(`[Proxy] Error: ${status}`, data);
        res.status(status).json(data);
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Bancamiga Proxy Relay running on port ${PORT}`);
});
