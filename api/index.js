const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();

// Sử dụng middleware CORS
app.use(cors());

// Middleware để parse JSON body
app.use(express.json());

// Sử dụng biến môi trường cho chuỗi kết nối MongoDB Atlas
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
    maxPoolSize: 10, // Số lượng kết nối tối đa trong pool
});

let db;

// Kết nối đến MongoDB và tạo connection pool
async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Đã kết nối thành công đến MongoDB");
        db = client.db("showai");
        await db.command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (error) {
        console.error("Lỗi kết nối đến MongoDB:", error);
        process.exit(1);
    }
}

connectToDatabase();

// Hàm lấy dữ liệu show AI từ MongoDB
async function getShowData(searchKeyword = '', tag = '', id = '') {
    const collection = db.collection("data_web_ai");

    let query = {};

    if (id) {
        query._id = new ObjectId(id);
    }

    if (searchKeyword) {
        query.$or = [
            { name: { $regex: searchKeyword, $options: 'i' } },
            { description: { $elemMatch: { $regex: searchKeyword, $options: 'i' } } }
        ];
    }

    if (tag) {
        query.tags = { $elemMatch: { $regex: tag, $options: 'i' } };
    }

    const showData = await collection.find(query).sort({ _id: -1 }).toArray();
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