import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
    try {
        const client = await clientPromise;
        const db = client.db('nyuhack');
        const collection = db.collection('items');
        const body = await request.json();
        // Validate required fields
        const name = body.name;
        const fridgeId = body.fridgeId;
        const quantity = parseInt(body.quantity);
        const userId = body.userId || '';
        const photo = body.photo;
        if (!fridgeId || !quantity || !userId || !photo || !name) {
            return NextResponse.json({ success: false, error: 'Missing required fields' });
        }
        // Optional fields
        const description = body.description || '';
        const category = body.category || '';
        const newItem = {
            name: name,
            fridgeId: fridgeId,
            quantity: quantity,
            userId: userId,
            photo: photo,
            description: description,
            category: category,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        var result = await collection.insertOne(newItem);

        result = await db.collection("User").updateOne(
            { email: body.email },
            {
                $inc: { contributions: 1 },
                $set: { updatedAt: new Date() }
            }
        );
        return NextResponse.json({ success: true, data: result }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error }, { status: 500 });
    }
}