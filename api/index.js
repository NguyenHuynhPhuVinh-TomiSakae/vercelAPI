const express = require('express');
const cors = require('cors');
const app = express();

// Sử dụng middleware CORS
app.use(cors());

// Route cho API
app.get('/api', (req, res) => {
    res.json({ message: 'Xin chào thuật thuật!' });
});

// Xuất module app thay vì sử dụng app.listen()
module.exports = app;