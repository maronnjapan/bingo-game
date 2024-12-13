import { pusherServer } from '@/lib/pusher';
import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs'
import path from 'path';
const publicDirectory = path.join(process.cwd(), 'public')
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const gameId = searchParams.get('gameId');

    if (!gameId) {
        return NextResponse.json({ error: '誤ったurl' }, { status: 400 });
    }

    const filePath = `${publicDirectory}/${gameId}/data.json`
    const isExist = fs.existsSync(filePath)

    let fileData: { [gameId: string]: string[] } = {}
    if (isExist) {
        const fileStr = fs.readFileSync(filePath, { encoding: 'utf-8' }).toString()
        if (fileStr) {
            fileData = JSON.parse(fileStr)
        }
    }

    return NextResponse.json({
        fileData
    });
}

export async function POST(request: NextRequest) {
    try {
        const { number, gameId } = await request.json();

        if (typeof number !== 'number' || number < 1 || number > 75) {
            return NextResponse.json(
                { error: 'Invalid number' },
                { status: 400 }
            );
        }

        await pusherServer.trigger(
            'bingo-numbers',
            'new-number',
            {
                number,
                timestamp: new Date().toISOString()
            }
        );

        const filePath = `${publicDirectory}/${gameId}/data.json`
        const isExist = fs.existsSync(filePath)

        if (isExist) {
            const fileStr = fs.readFileSync(filePath, { encoding: 'utf-8' }).toString()
            const fileData = JSON.parse(fileStr)
            fileData[gameId] = [...(fileData[gameId] ?? []), number]
            fs.writeFileSync(filePath, JSON.stringify(fileData))
        } else {
            const fileData = { [gameId]: [number] }
            fs.mkdirSync(`${publicDirectory}/${gameId}`)
            fs.writeFileSync(filePath, JSON.stringify(fileData))
        }


        return NextResponse.json({
            success: true,
            message: 'Number announced successfully',
            number
        });
    } catch (error) {
        console.error('Error in number announcement:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}