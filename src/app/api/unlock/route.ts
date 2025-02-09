import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const fridgeId = body.fridgeId;
        if (!fridgeId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('nyuhack');
        const collection = db.collection('fridge');
        const result = await collection.updateOne(
            { _id: new ObjectId(fridgeId) },
            { 
                $set: { isLocked : false, updatedAt: new Date()  }

            }
        );
        return NextResponse.json({ success: true, data: result }, { status: 200 });
        
    } catch (error) {
        console.error('Error finding nearby fridges:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

}