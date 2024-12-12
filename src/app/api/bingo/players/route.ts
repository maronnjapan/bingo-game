export type PlayerInfo = {
    id: string;
    name: string;
    card: Array<Array<{ number: number; isMarked: boolean }>>;
    hasWon: boolean;
    hasReach: boolean;
};

import { pusherServer } from '@/lib/pusher';
// app/api/bingo/players/route.ts
import { NextRequest, NextResponse } from 'next/server';

// インメモリストレージは残しつつ、更新をPusherで通知
const players: { [gameId: string]: PlayerInfo[] } = {};

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const gameId = searchParams.get('gameId');

    if (!gameId) {
        return NextResponse.json(
            { error: 'Game ID is required' },
            { status: 400 }
        );
    }

    return NextResponse.json({
        players: players[gameId] || []
    });
}

export async function POST(request: NextRequest) {
    try {
        const { gameId, player } = await request.json();

        if (!gameId || !player) {
            return NextResponse.json(
                { error: 'Game ID and player data are required' },
                { status: 400 }
            );
        }

        // プレイヤーデータの更新
        if (!players[gameId]) {
            players[gameId] = [];
        }

        const existingPlayerIndex = players[gameId].findIndex(p => p.id === player.id);
        if (existingPlayerIndex !== -1) {
            players[gameId][existingPlayerIndex] = player;
        } else {
            players[gameId].push(player);
        }

        // Pusherで更新を通知
        await pusherServer.trigger(
            `bingo-game-${gameId}`,
            'players-updated',
            {
                players: players[gameId],
                updatedPlayer: player,
                timestamp: new Date().toISOString()
            }
        );

        return NextResponse.json({
            success: true,
            message: 'Player data updated successfully'
        });
    } catch (error) {
        console.error('Error updating player:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}