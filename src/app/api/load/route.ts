import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
    try {
        const { latitude, longitude } = await request.json();
        if (!latitude || !longitude) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('nyuhack');
        const collection = db.collection('fridge');

        // Ensure the index exists

        const nearbyFridges = await collection.aggregate([
            {
                '$geoNear': {
                    'near': {
                        'type': 'Point',
                        'coordinates': [
                            longitude,
                            latitude
                        ]
                    },
                    'distanceField': 'distance',
                    'maxDistance': 3000
                }
            }
        ]).toArray();

        
        const fridgeIds = nearbyFridges.map(fridge => JSON.parse(JSON.stringify(fridge._id)));
        const products = await db.collection("items").find({ fridgeId: { $in:  fridgeIds }, quantity: {$gt: 0}}).toArray();
        const fridgesWithProducts = nearbyFridges.map(fridge => {
            const fridgeProducts = products.filter(product => 
                product.fridgeId.toString() === fridge._id.toString()
            );
            return {
                ...fridge,
                items: fridgeProducts
            };
        });

        return NextResponse.json(fridgesWithProducts);
    } catch (error) {
        console.error('Error finding nearby fridges:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

}
