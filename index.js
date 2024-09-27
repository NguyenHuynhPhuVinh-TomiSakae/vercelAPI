const express = require('express');
const app = express();
const port = 3000;

// Route cho API
app.get('/api', (req, res) => {
    res.json({ message: 'Xin chào thuật thuật!' });
});

app.listen(port, () => {
    console.log(`API is running at http://localhost:${port}`);
});