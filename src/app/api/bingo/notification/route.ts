import { NextResponse } from 'next/server';
import { Subject } from 'rxjs';

type WinnerPayload = {
    player: { id: string, name: string };
    gameId: string;
};

const winnerSubjects = new Map<string, Subject<WinnerPayload>>();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: { gameId: string } }
) {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    if (!gameId) {
        return NextResponse.json({ error: '誤ったurl' }, { status: 400 });
    }

    if (!winnerSubjects.has(gameId)) {
        winnerSubjects.set(gameId, new Subject<WinnerPayload>());
    }

    const encoder = new TextEncoder();
    let closed = false;

    const stream = new ReadableStream({
        start: async (controller) => {
            const push = (data: WinnerPayload) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            const subscription = winnerSubjects.get(gameId)!.subscribe((payload) => {
                if (!closed) {
                    push(payload);
                }
            });

            // Keep-alive ping to maintain connection
            const pingInterval = setInterval(() => {
                if (!closed) {
                    controller.enqueue(encoder.encode(`: ping\n\n`));
                }
            }, 30000);

            // Wait until the connection is closed
            while (!closed) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            clearInterval(pingInterval);
            subscription.unsubscribe();
        },
        cancel() {
            closed = true;
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
        },
    });
}

export async function POST(
    request: Request,
    { params }: { params: { gameId: string } }
) {
    const payload = await request.json() as WinnerPayload;

    console.log(payload)
    if (!payload.gameId || !payload.player.id || !payload.player.name) {
        return NextResponse.json({ error: '不正なペイロード' }, { status: 400 });
    }

    if (!winnerSubjects.has(payload.gameId)) {
        winnerSubjects.set(payload.gameId, new Subject<WinnerPayload>());
    }

    winnerSubjects.get(payload.gameId)!.next(payload);
    return NextResponse.json({ success: true });
}