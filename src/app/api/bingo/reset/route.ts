import { pusherServer } from '@/lib/pusher';
import { players } from '@/utils/players';
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

        // プレイヤーデータのリセット
        players[gameId] = [];

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