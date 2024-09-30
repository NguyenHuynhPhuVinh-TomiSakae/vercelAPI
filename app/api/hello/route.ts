import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    // Lấy origin từ request headers
    const origin = request.headers.get('origin');

    // Tạo response với dữ liệu
    const response = NextResponse.json({ message: 'huhuhu' });

    // Thêm CORS headers
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
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