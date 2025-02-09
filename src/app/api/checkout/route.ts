import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {

        const body = await request.json();
        const userId = body.userId;
        const fridgeId = body.fridgeId;
        const itemId = body.itemId;
        const client = await clientPromise;
        const db = client.db('nyuhack');
        const collection = db.collection('items');


        if (!userId || !fridgeId || !itemId) {
            return NextResponse.json({ success: false, error: 'Missing required fields' });
        }
        var result = await collection.updateOne(
            { _id: new ObjectId(itemId) },
            { 
                $inc: { quantity: -1 },
                $set: { updatedAt: new Date() }
            }
        );


        result = db.collection("User").updateOne(
            { _id: new ObjectId(userId) },
            { 
                $inc: { unlocks : 1 },
                $set: { updatedAt: new Date() }
    
            }
        );
        if (result.modifiedCount === 0) {
            return NextResponse.json({ success: false, error: 'Item not found or quantity cannot be reduced' });
        }

        return NextResponse.json({ success: true, data: result }, { status: 200 });
    }