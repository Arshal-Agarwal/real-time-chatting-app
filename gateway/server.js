const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());

// Enable CORS to allow cookies and frontend communication
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend origin
  credentials: true
}));

// Proxy utility with proper cookie handling
const proxyRequest = async (req, res, target) => {
  try {
    const url = `${target}${req.url}`;
    console.log(`Proxying request to: ${url}`);

    const fetchOptions = {
      method: req.method,
      headers: {
        ...req.headers,
        host: new URL(target).host,
        cookie: req.headers.cookie || '' // forward cookies
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body)
    };

    const response = await fetch(url, fetchOptions);

    // Set status
    res.status(response.status);

    // Forward all headers, especially Set-Cookie properly
    const rawHeaders = response.headers.raw();
    for (const [header, value] of Object.entries(rawHeaders)) {
      if (header.toLowerCase() === 'set-cookie') {
        res.setHeader('Set-Cookie', value); // value is already an array
      } else {
        res.setHeader(header, value);
      }
    }

    const responseBody = await response.text();
    res.send(responseBody);

  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).send('Proxy Error');
  }
};

// Proxy to microservices
app.use('/users', (req, res) => proxyRequest(req, res, 'http://users:5001'));
app.use('/friends', (req, res) => proxyRequest(req, res, 'http://friends:5002'));
app.use('/messages', (req, res) => proxyRequest(req, res, 'http://messages:5003'));

// Health check
app.get('/', (req, res) => {
  res.send('Gateway is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Gateway is running on port ${PORT}`);
});
