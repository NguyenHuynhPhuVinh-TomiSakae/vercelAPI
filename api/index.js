const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();

// Sử dụng middleware CORS
app.use(cors());

// Middleware để parse JSON body
app.use(express.json());

// Chuỗi kết nối MongoDB Atlas
const uri = "mongodb+srv://tomisakae:tomisakae0000@showai.tpwxx.mongodb.net/?retryWrites=true&w=majority&appName=ShowAI";
const client = new MongoClient(uri);

// Kết nối đến MongoDB
async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Đã kết nối thành công đến MongoDB");
    } catch (error) {
        console.error("Lỗi kết nối đến MongoDB:", error);
    }
}

connectToDatabase();

// Hàm lấy dữ liệu show AI từ MongoDB
async function getShowData(searchKeyword = '', tag = '', id = '') {
    const database = client.db("showai");
    const collection = database.collection("data_web_ai");

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