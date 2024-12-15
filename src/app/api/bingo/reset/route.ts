import { pusherServer } from '@/lib/pusher';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const { gameId } = await request.json();

        if (!gameId) {
            return NextResponse.json(
                { error: 'Game ID is required' },
                { status: 400 }
            );
        }

        await db.delete(gameId)

        // 複数のチャンネルにリセット通知
        await Promise.all([
            // ゲーム状態のリセット
            pusherServer.trigger(
                `bingo-game-${gameId}`,
                'game-reset',
                {
                    isReset: true,
                    timestamp: new Date().toISOString()
                }
            ),
            // プレイヤー情報のリセット
            pusherServer.trigger(
                `bingo-game-${gameId}`,
                'players-reset',
                {
                    isReset: true,
                    timestamp: new Date().toISOString()
                }
            ),
            // 番号のリセット
            pusherServer.trigger(
                'bingo-numbers',
                'game-reset',
                {
                    isReset: true,
                    timestamp: new Date().toISOString()
                }
            )
        ]);

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