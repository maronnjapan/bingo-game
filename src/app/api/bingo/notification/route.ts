import { pusherServer } from '@/lib/pusher';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const gameId = searchParams.get('gameId');

    if (!gameId) {
        return NextResponse.json({ error: '誤ったurl' }, { status: 400 });
    }

    try {
        // Pusherのチャンネル情報を取得
        const channelInfo = await pusherServer.get({
            path: `/channels/bingo-game-${gameId}`,
            params: {}
        });

        return NextResponse.json({
            channel: channelInfo,
            gameId
        });
    } catch (error) {
        console.error('Error fetching channel info:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json();
        const { player, gameId } = payload;

        if (!gameId || !player.id || !player.name) {
            return NextResponse.json({ error: '不正なペイロード' }, { status: 400 });
        }

        await pusherServer.trigger(
            `bingo-game-${gameId}`,
            'bingo-achieved',
            { player }
        );

        return NextResponse.json({
            success: true,
            message: 'Bingo notification sent successfully'
        });
    } catch (error) {
        console.error('Error in bingo notification:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}