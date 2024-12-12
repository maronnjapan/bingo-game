
// app/api/bingo/reset/route.ts
import { pusherServer } from '@/lib/pusher';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { gameId } = await request.json();

        if (!gameId) {
            return NextResponse.json(
                { error: 'Game ID is required' },
                { status: 400 }
            );
        }

        // リセット通知を送信
        await pusherServer.trigger(
            `bingo-game-${gameId}`,
            'game-reset',
            {
                isReset: true,
                timestamp: new Date().toISOString()
            }
        );

        // 番号チャンネルにもリセット通知を送信
        await pusherServer.trigger(
            'bingo-numbers',
            'game-reset',
            {
                isReset: true,
                timestamp: new Date().toISOString()
            }
        );

        return NextResponse.json({
            success: true,
            message: 'Game reset successfully'
        });
    } catch (error) {
        console.error('Error in game reset:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}