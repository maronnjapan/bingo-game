import { pusherServer } from "@/lib/pusher";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const { gameId } = await request.json();

    if (!gameId) {
        return NextResponse.json(
            { error: 'Invalid number' },
            { status: 400 }
        );
    }
    await pusherServer.trigger(`bingo-game-${gameId}`, 'bingo-error', {})

    return NextResponse.json({ success: true })
}