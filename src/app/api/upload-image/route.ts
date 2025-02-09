import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const base64Image = body.image;
        const imgbbApiKey = process.env.IMGBB_API_KEY;

        if (!base64Image) {
            return NextResponse.json({ success: false, error: 'No image provided' });
        }

        if (!imgbbApiKey) {
            return NextResponse.json({ success: false, error: 'ImgBB API key not configured' });
        }

        // Create form data for ImgBB API
        const formData = new FormData();
        formData.append('key', imgbbApiKey);
        formData.append('image', base64Image);

        // Upload to ImgBB
        const response = await fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!data.success) {
            return NextResponse.json({ success: false, error: 'Failed to upload image' });
        }

        return NextResponse.json({ 
            success: true, 
            url: data.data.url,
            display_url: data.data.display_url,
            delete_url: data.data.delete_url
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' });
    }
} 