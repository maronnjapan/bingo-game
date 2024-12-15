import { pusherServer } from '@/lib/pusher';
import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs'
import path from 'path';
import { db } from '@/lib/db';
const publicDirectory = path.join(process.cwd(), 'public')
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const gameId = searchParams.get('gameId');

    if (!gameId) {
        return NextResponse.json({ error: '誤ったurl' }, { status: 400 });
    }

    const fileData = await db.getById(gameId)

    return NextResponse.json({
        fileData
    });
}

export async function POST(request: NextRequest) {
    try {
        const { number, gameId } = await request.json();

        if (typeof number !== 'number' || number < 1 || number > 75 || !gameId) {
            return NextResponse.json(
                { error: 'Invalid number' },
                { status: 400 }
            );
        }

        await pusherServer.trigger(
            `bingo-game-${gameId}`,
            'new-number',
            {
                number,
                timestamp: new Date().toISOString()
            }
        );

        await db.upsert({ data: number.toString(), id: gameId })


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