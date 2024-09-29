const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();

// Sử dụng middleware CORS
app.use(cors());

// Middleware để parse JSON body
app.use(express.json());

// Đọc dữ liệu từ file JSON và lọc theo từ khóa tìm kiếm, tag và id
async function getShowData(searchKeyword = '', tag = '', id = '') {
    const filePath = path.join(process.cwd(), 'ShowAI.json');
    const data = await fs.readFile(filePath, 'utf8');
    let showData = JSON.parse(data);

    if (id) {
        showData = showData.filter(show => show.id.toString() === id);
    }

    if (searchKeyword) {
        showData = showData.filter(show =>
            show.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            show.description.toLowerCase().includes(searchKeyword.toLowerCase())
        );
    }

    if (tag) {
        showData = showData.filter(show =>
            show.tags && show.tags.some(t => t.toLowerCase() === tag.toLowerCase())
        );
    }

    // Sắp xếp showData theo id từ cao đến thấp
    showData.sort((a, b) => b.id - a.id);

    return showData;
}

// Route để lấy thông tin show AI với tính năng tìm kiếm, lọc theo tag và id
app.get('/api/showai', async (req, res) => {
    try {
        const searchKeyword = req.query.q || '';
        const tag = req.query.tag || '';
        const id = req.query.id || '';
        const showData = await getShowData(searchKeyword, tag, id);
        res.json(showData);
    } catch (error) {
        console.error('Lỗi khi đọc dữ liệu show AI:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Xuất module app thay vì sử dụng app.listen()
module.exports = app;