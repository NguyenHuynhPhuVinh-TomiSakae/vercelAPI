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
            show.description.some(desc => desc.toLowerCase().includes(searchKeyword.toLowerCase()))
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

// Route để thêm một show AI mới
app.post('/api/showai', async (req, res) => {
    try {
        const filePath = path.join(process.cwd(), 'ShowAI.json');
        const data = await fs.readFile(filePath, 'utf8');
        let showData = JSON.parse(data);

        const newShow = req.body;
        newShow.id = Math.max(...showData.map(show => show.id)) + 1;

        showData.push(newShow);

        await fs.writeFile(filePath, JSON.stringify(showData, null, 2));

        res.status(201).json(newShow);
    } catch (error) {
        console.error('Lỗi khi thêm show AI mới:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Route để cập nhật một show AI
app.put('/api/showai/:id', async (req, res) => {
    try {
        const filePath = path.join(process.cwd(), 'ShowAI.json');
        const data = await fs.readFile(filePath, 'utf8');
        let showData = JSON.parse(data);

        const id = parseInt(req.params.id);
        const updatedShow = req.body;

        const index = showData.findIndex(show => show.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Không tìm thấy show AI' });
        }

        showData[index] = { ...showData[index], ...updatedShow };

        await fs.writeFile(filePath, JSON.stringify(showData, null, 2));

        res.json(showData[index]);
    } catch (error) {
        console.error('Lỗi khi cập nhật show AI:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Route để xóa một show AI
app.delete('/api/showai/:id', async (req, res) => {
    try {
        const filePath = path.join(process.cwd(), 'ShowAI.json');
        const data = await fs.readFile(filePath, 'utf8');
        let showData = JSON.parse(data);

        const id = parseInt(req.params.id);

        const index = showData.findIndex(show => show.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Không tìm thấy show AI' });
        }

        showData.splice(index, 1);

        await fs.writeFile(filePath, JSON.stringify(showData, null, 2));

        res.json({ message: 'Đã xóa show AI thành công' });
    } catch (error) {
        console.error('Lỗi khi xóa show AI:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Xuất module app thay vì sử dụng app.listen()
module.exports = app;