import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

// Thay thế bằng URL kết nối MongoDB Atlas của bạn
const uri = process.env.MONGODB_URI;
if (!uri) {
    throw new Error('MONGODB_URI is not defined in the environment variables');
}
let clientPromise: Promise<MongoClient>;

const options = {
    maxPoolSize: 10, // Số lượng kết nối tối đa trong pool
    minPoolSize: 5,  // Số lượng kết nối tối thiểu trong pool
    connectTimeoutMS: 5000, // Thời gian timeout khi kết nối
    socketTimeoutMS: 30000, // Thời gian timeout cho các hoạt động socket
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

declare global {
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
    // Trong môi trường development, sử dụng biến global để tránh tạo nhiều kết nối
    if (!global._mongoClientPromise) {
        global._mongoClientPromise = new MongoClient(uri, options).connect();
    }
    clientPromise = global._mongoClientPromise;
} else {
    // Trong production, tạo một client promise mới
    clientPromise = new MongoClient(uri, options).connect();
}

export async function GET(request: Request) {
    const origin = request.headers.get('origin');
    const { searchParams } = new URL(request.url);

    // Lấy các tham số tìm kiếm từ URL
    const searchKeyword = searchParams.get('q') || '';
    const tag = searchParams.get('tag') || '';
    const id = searchParams.get('id') || '';
    const page = searchParams.get('page');
    const itemsPerPage = 9;
    const random = searchParams.get('random');
    const star = searchParams.get('star');

    try {
        const client = await clientPromise;
        const database = client.db('showai');
        const collection = database.collection('data_web_ai');

        // Tạo query object
        const query: Record<string, unknown> = {};

        if (id) {
            query.id = id;
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

        if (star) {
            const starIds = star.split(',').map(id => id.trim());
            query.id = { $in: starIds };
        }

        let documents;
        let totalItems;
        let totalPages;

        if (random) {
            // Nếu có tham số random, lấy ngẫu nhiên số lượng bản ghi theo giá trị random
            const randomCount = parseInt(random, 10);
            documents = await collection.aggregate([
                { $match: query },
                { $sample: { size: randomCount } }
            ]).toArray();
            totalItems = documents.length;
            totalPages = 1;
        } else if (page) {
            // Nếu có tham số page, thực hiện phân trang
            const pageNumber = parseInt(page, 10);
            totalItems = await collection.countDocuments(query);
            totalPages = Math.ceil(totalItems / itemsPerPage);
            documents = await collection.find(query)
                .sort({ _id: -1 })
                .skip((pageNumber - 1) * itemsPerPage)
                .limit(itemsPerPage)
                .toArray();
        } else {
            // Nếu không có tham số page hoặc random, lấy toàn bộ dữ liệu
            documents = await collection.find(query).sort({ _id: -1 }).toArray();
            totalItems = documents.length;
            totalPages = 1;
        }

        // Tổng hợp toàn bộ tag
        const allTags = await collection.distinct('tags');

        // Tạo response với dữ liệu từ MongoDB, thông tin phân trang và danh sách tag
        const response = NextResponse.json({
            data: documents,
            pagination: page ? {
                currentPage: page ? parseInt(page, 10) : 1,
                totalPages: totalPages,
                totalItems: totalItems,
                itemsPerPage: itemsPerPage
            } : null,
            tags: allTags
        });

        // Thêm CORS headers
        response.headers.set('Access-Control-Allow-Origin', origin || '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        return response;
    } catch (error) {
        console.error('Lỗi khi truy vấn MongoDB:', error);
        return NextResponse.json({ error: 'Đã xảy ra lỗi khi truy vấn dữ liệu' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const origin = request.headers.get('origin');
    const data = await request.json();

    try {
        const client = await clientPromise;
        const database = client.db('showai');
        const collection = database.collection('data_web_ai');

        const result = await collection.insertOne(data);

        const response = NextResponse.json({ success: true, id: result.insertedId });
        response.headers.set('Access-Control-Allow-Origin', origin || '*');
        return response;
    } catch (error) {
        console.error('Lỗi khi thêm dữ liệu:', error);
        return NextResponse.json({ error: 'Đã xảy ra lỗi khi thêm dữ liệu' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const origin = request.headers.get('origin');
    const { _id, id, ...updateData } = await request.json();

    try {
        const client = await clientPromise;
        const database = client.db('showai');
        const collection = database.collection('data_web_ai');

        let query;
        if (_id) {
            query = { _id: new ObjectId(_id) };
        } else if (id) {
            query = { id: id };
        } else {
            throw new Error('No valid ID provided for update');
        }

        const result = await collection.updateOne(query, { $set: updateData });

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'No document found with the provided ID' }, { status: 404 });
        }

        const response = NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
        response.headers.set('Access-Control-Allow-Origin', origin || '*');
        return response;
    } catch (error) {
        console.error('Lỗi khi cập nhật dữ liệu:', error);
        return NextResponse.json({ error: 'Đã xảy ra lỗi khi cập nhật dữ liệu' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const origin = request.headers.get('origin');
    const { id } = await request.json();

    try {
        const client = await clientPromise;
        const database = client.db('showai');
        const collection = database.collection('data_web_ai');

        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        const response = NextResponse.json({ success: true, deletedCount: result.deletedCount });
        response.headers.set('Access-Control-Allow-Origin', origin || '*');
        return response;
    } catch (error) {
        console.error('Lỗi khi xóa dữ liệu:', error);
        return NextResponse.json({ error: 'Đã xảy ra lỗi khi xóa dữ liệu' }, { status: 500 });
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

// Thêm hàm này vào cuối file
export async function closeMongoConnection() {
    const client = await clientPromise;
    if (client) {
        await client.close();
    }
}