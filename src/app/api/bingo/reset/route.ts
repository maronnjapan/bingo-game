import { players } from "@/utils/players";
import { NextResponse } from "next/server";
import { Subject } from "rxjs";
class ResetManager {
    private static instance: ResetManager;
    private numberSubject: Subject<boolean>;

    private constructor() {
        this.numberSubject = new Subject<boolean>();
    }

    public static getInstance(): ResetManager {
        if (!ResetManager.instance) {
            ResetManager.instance = new ResetManager();
        }
        return ResetManager.instance;
    }

    public subscribe(callback: (isReset: boolean) => void) {
        return this.numberSubject.subscribe(callback);
    }

    public emit(isReset: boolean) {
        this.numberSubject.next(isReset);
    }
}

export async function GET() {
    const encoder = new TextEncoder();
    const manager = ResetManager.getInstance();
    let closed = false;

    const stream = new ReadableStream({
        start: async (controller) => {
            // 接続開始時のメッセージ
            controller.enqueue(encoder.encode('data: {"connected":true}\n\n'));

            const subscription = manager.subscribe((isReset) => {
                console.log('subscription')
                if (!closed) {
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ isReset })}\n\n`)
                    );
                }
            });

            // エラーハンドリングを追加
            try {
                // keepaliveメッセージを定期的に送信
                while (!closed) {
                    await new Promise(resolve => setTimeout(resolve, 30000));
                    if (!closed) {
                        controller.enqueue(encoder.encode('data: {"ping":true}\n\n'));
                    }
                }
            } catch (error) {
                console.error('Stream error:', error);
            } finally {
                subscription.unsubscribe();
            }
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
export async function POST(request: Request) {
    const { gameId } = await request.json();

    players[gameId] = []

    const manager = ResetManager.getInstance()
    manager.emit(true)


    return NextResponse.json({ success: true });
}