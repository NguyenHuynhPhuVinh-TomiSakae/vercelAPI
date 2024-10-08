import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

// Thay thế bằng URL kết nối MongoDB Atlas của bạn
const uri = process.env.MONGODB_URI;
if (!uri) {
    throw new Error('MONGODB_URI is not defined in the environment variables');
}
const client = new MongoClient(uri);

export async function GET(request: Request) {
    const origin = request.headers.get('origin');
    const { searchParams } = new URL(request.url);

    // Lấy các tham số tìm kiếm từ URL
    const searchKeyword = searchParams.get('q') || '';
    const tag = searchParams.get('tag') || '';
    const id = searchParams.get('id') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const itemsPerPage = 9;

    try {
        // Kết nối đến MongoDB Atlas
        await client.connect();
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

        // Thực hiện truy vấn với query đã tạo và phân trang
        const totalItems = await collection.countDocuments(query);
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const documents = await collection.find(query)
            .sort({ _id: -1 })
            .skip((page - 1) * itemsPerPage)
            .limit(itemsPerPage)
            .toArray();

        // Tổng hợp toàn bộ tag
        const allTags = await collection.distinct('tags');

        // Tạo response với dữ liệu từ MongoDB, thông tin phân trang và danh sách tag
        const response = NextResponse.json({
            data: documents,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalItems,
                itemsPerPage: itemsPerPage
            },
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
    } finally {
        // Đóng kết nối
        await client.close();
    }
}

export async function POST(request: Request) {
    const origin = request.headers.get('origin');
    const data = await request.json();

    try {
        await client.connect();
        const database = client.db('showai');
        const collection = database.collection('data_web_ai');

        const result = await collection.insertOne(data);

        const response = NextResponse.json({ success: true, id: result.insertedId });
        response.headers.set('Access-Control-Allow-Origin', origin || '*');
        return response;
    } catch (error) {
        console.error('Lỗi khi thêm dữ liệu:', error);
        return NextResponse.json({ error: 'Đã xảy ra lỗi khi thêm dữ liệu' }, { status: 500 });
    } finally {
        await client.close();
    }
}

export async function PUT(request: Request) {
    const origin = request.headers.get('origin');
    const { id, ...updateData } = await request.json();

    try {
        await client.connect();
        const database = client.db('showai');
        const collection = database.collection('data_web_ai');

        const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });

        const response = NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
        response.headers.set('Access-Control-Allow-Origin', origin || '*');
        return response;
    } catch (error) {
        console.error('Lỗi khi cập nhật dữ liệu:', error);
        return NextResponse.json({ error: 'Đã xảy ra lỗi khi cập nhật dữ liệu' }, { status: 500 });
    } finally {
        await client.close();
    }
}

export async function DELETE(request: Request) {
    const origin = request.headers.get('origin');
    const { id } = await request.json();

    try {
        await client.connect();
        const database = client.db('showai');
        const collection = database.collection('data_web_ai');

        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        const response = NextResponse.json({ success: true, deletedCount: result.deletedCount });
        response.headers.set('Access-Control-Allow-Origin', origin || '*');
        return response;
    } catch (error) {
        console.error('Lỗi khi xóa dữ liệu:', error);
        return NextResponse.json({ error: 'Đã xảy ra lỗi khi xóa dữ liệu' }, { status: 500 });
    } finally {
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