// app/api/bingo/players/route.ts
import { players } from '@/utils/players';
import { NextResponse } from 'next/server';

// TODO: 実際のデータストアに置き換える
export type PlayerInfo = {
    [gameId: string]: {
        id: string;
        name: string;
        card: Array<Array<{ number: number; isMarked: boolean }>>;
        hasWon: boolean;
        hasReach: boolean;
    }[];
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
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

// プレイヤーの参加時に呼び出されるAPI
export async function POST(request: Request) {
    const { gameId, player } = await request.json();

    if (!gameId || !player) {
        return NextResponse.json(
            { error: 'Game ID and player data are required' },
            { status: 400 }
        );
    }

    if (!players[gameId]) {
        players[gameId] = [];
    }

    // 既存のプレイヤーの場合は更新
    const existingPlayerIndex = players[gameId].findIndex(p => p.id === player.id);
    if (existingPlayerIndex !== -1) {
        players[gameId][existingPlayerIndex] = player;
    } else {
        // 新規プレイヤーの場合は追加
        players[gameId].push(player);
    }

    return NextResponse.json({ success: true });
}