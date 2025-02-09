import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
    const body = await request.json();
    const userId = body.userId;
    const itemId = body.itemId;

    if (!userId || !itemId) {
        return NextResponse.json({ success: false, error: 'Missing required fields' });
    }

    const client = await clientPromise;
    const db = client.db('nyuhack');
    const itemsCollection = db.collection('items');
    const userCollection = db.collection('User');

    // First, check if the item exists and has quantity > 0
    const item = await itemsCollection.findOne({ _id: new ObjectId(itemId), quantity: { $gt: 0 } });

    if (!item) {
        return NextResponse.json({ success: false, error: 'Item not found or quantity cannot be reduced' });
    }

    // If item exists and has quantity > 0, proceed with the update
    const itemResult = await itemsCollection.updateOne(
        { _id: new ObjectId(itemId) },
        { 
            $inc: { quantity: -1 },
            $set: { updatedAt: new Date() }
        }
    );

    if (itemResult.modifiedCount === 0) {
        return NextResponse.json({ success: false, error: 'Failed to update item quantity' }, { status: 400 });
    }

    // Update user's unlocks
    const userResult = await userCollection.updateOne(
        { _id: new ObjectId(userId) },
        { 
            $inc: { unlocks: 1 },
            $set: { updatedAt: new Date() }
        }
    );

    if (userResult.modifiedCount === 0) {
        // If user update fails, you might want to revert the item quantity change
        await itemsCollection.updateOne(
            { _id: new ObjectId(itemId) },
            { $inc: { quantity: 1 } }
        );
        return NextResponse.json({ success: false, error: 'Failed to update user unlocks' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: { itemResult, userResult } }, { status: 200 });
}
