import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { username, password } = await request.json();

    // Đảm bảo rằng USERNAME và PASSWORD được đặt trong biến môi trường của Vercel
    if (username === process.env.USERNAME && password === process.env.PASSWORD) {
        return NextResponse.json({ success: true });
    } else {
        return NextResponse.json({ success: false, error: 'Sai tên đăng nhập hoặc mật khẩu' }, { status: 401 });
    }
}