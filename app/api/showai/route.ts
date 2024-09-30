import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// Thay thế bằng URL kết nối MongoDB Atlas của bạn
const uri = "mongodb+srv://tomisakae:tomisakae0000@showai.tpwxx.mongodb.net/?retryWrites=true&w=majority&appName=ShowAI";
const client = new MongoClient(uri);

export async function GET(request: Request) {
    const origin = request.headers.get('origin');

    try {
        // Kết nối đến MongoDB Atlas
        await client.connect();
        const database = client.db('showai');
        const collection = database.collection('data_web_ai');

        // Thực hiện truy vấn (ví dụ: lấy tất cả documents)
        const documents = await collection.find({}).toArray();

        // Tạo response với dữ liệu từ MongoDB
        const response = NextResponse.json(documents);

        // Thêm CORS headers
        response.headers.set('Access-Control-Allow-Origin', origin || '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        return response;
    } catch (error) {
        console.error('Lỗi khi truy vấn MongoDB:', error);
        return NextResponse.json({ error: 'Đã xảy ra lỗi khi truy vấn dữ liệu' }, { status: 500 });
    } finally {
        // Đóng kết nối
        await client.close();
    }
}

// Xử lý OPTIONS request cho preflight
export async function OPTIONS(request: Request) {
    const origin = request.headers.get('origin');

    const response = new NextResponse(null, { status: 204 });

    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');

    return response;
}