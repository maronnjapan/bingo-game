import { NextResponse } from 'next/server';
import { Subject } from 'rxjs';

// シングルトンパターンでSubjectを管理
class BingoNumberManager {
    private static instance: BingoNumberManager;
    private numberSubject: Subject<number>;

    private constructor() {
        this.numberSubject = new Subject<number>();
    }

    public static getInstance(): BingoNumberManager {
        if (!BingoNumberManager.instance) {
            BingoNumberManager.instance = new BingoNumberManager();
        }
        return BingoNumberManager.instance;
    }

    public subscribe(callback: (number: number) => void) {
        return this.numberSubject.subscribe(callback);
    }

    public emit(number: number) {
        this.numberSubject.next(number);
    }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    const encoder = new TextEncoder();
    const manager = BingoNumberManager.getInstance();
    let closed = false;

    const stream = new ReadableStream({
        start: async (controller) => {
            // 接続開始時のメッセージ
            controller.enqueue(encoder.encode('data: {"connected":true}\n\n'));

            const subscription = manager.subscribe((number) => {
                console.log('subscription')
                if (!closed) {
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ number })}\n\n`)
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
    try {
        const { number } = await request.json();
        if (typeof number !== 'number' || number < 1 || number > 75) {
            return NextResponse.json(
                { error: 'Invalid number' },
                { status: 400 }
            );
        }

        const manager = BingoNumberManager.getInstance();
        manager.emit(number);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('POST error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}