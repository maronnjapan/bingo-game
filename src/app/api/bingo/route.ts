import { pusherServer } from '@/lib/pusher';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { number } = await request.json();

        if (typeof number !== 'number' || number < 1 || number > 75) {
            return NextResponse.json(
                { error: 'Invalid number' },
                { status: 400 }
            );
        }

        await pusherServer.trigger(
            'bingo-numbers',
            'new-number',
            {
                number,
                timestamp: new Date().toISOString()
            }
        );

        return NextResponse.json({
            success: true,
            message: 'Number announced successfully',
            number
        });
    } catch (error) {
        console.error('Error in number announcement:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}