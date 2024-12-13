'use client'
import { useEffect, useState } from 'react';
import { Collapse } from './Collapse';
import { pusherClient } from '@/lib/pusher';

export interface BingoCell {
    number: number;
    isMarked: boolean;
}


type Player = {
    id: string;
    name: string;
    card: Array<Array<BingoCell>>;
    hasWon: boolean;
    hasReach: boolean;
};

export type BingoCard = BingoCell[][];

export function BingoDashboard({ gameId }: { gameId: string }) {
    const [bingoPlayers, setBingoPlayers] = useState<{ id: string, name: string }[]>([]);
    const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
    const [numbers, setNumbers] = useState<number[]>([]);
    const [currentNumber, setCurrentNumber] = useState<number | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [showName, setShowName] = useState('')

    useEffect(() => {
        // 初期プレイヤーデータの取得
        const fetchInitialPlayers = async () => {
            try {
                const response = await fetch(`/api/bingo/players?gameId=${gameId}`);
                const data = await response.json();
                setPlayers(data.players);
            } catch (error) {
                console.error('Error fetching players:', error);
            }
        };

        fetchInitialPlayers();

        // Pusherチャンネルの購読
        const gameChannel = pusherClient.subscribe(`bingo-game-${gameId}`);
        const numbersChannel = pusherClient.subscribe('bingo-numbers');

        // ビンゴ達成通知のリスニング
        gameChannel.bind('bingo-achieved', (data: { player: { id: string, name: string } }) => {
            setBingoPlayers(prev => [...prev.filter(p => p.id !== data.player.id), data.player]);
            // アラート表示
            alert(`${data.player.name}さんがビンゴになりました！`);
        });

        // プレイヤー更新のリスニング
        gameChannel.bind('players-updated', (data: { players: Player[] }) => {
            setPlayers(data.players);
        });

        // 新しい番号のリスニング
        numbersChannel.bind('new-number', (data: { number: number }) => {
            setNumbers(prev => Array.from(new Set([...prev, data.number])));
            setCurrentNumber(data.number);
            setDrawnNumbers(prev => [...prev, data.number]);
        });

        // ゲームリセットのリスニング
        gameChannel.bind('game-reset', () => {
            setDrawnNumbers([]);
            setNumbers([]);
            setCurrentNumber(null);
            setBingoPlayers([]);
            setPlayers([]);
        });

        return () => {
            gameChannel.unbind_all();
            numbersChannel.unbind_all();
            pusherClient.unsubscribe(`bingo-game-${gameId}`);
            pusherClient.unsubscribe('bingo-numbers');
        };
    }, [gameId]);

    const generateNumber = (): number | null => {
        const availableNumbers = Array.from({ length: 75 }, (_, i) => i + 1)
            .filter(num => !numbers.includes(num));

        if (availableNumbers.length === 0) return null;

        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        return availableNumbers[randomIndex];
    };

    const announceNumber = async (targetNumber?: number): Promise<void> => {
        const number = targetNumber ?? generateNumber();
        if (!number) return;

        try {
            await fetch('/api/bingo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number, gameId })
            });
            setNumbers(prev => Array.from(new Set([...prev, number])));
            setCurrentNumber(number);
            setDrawnNumbers(prev => [...prev, number]);
        } catch (error) {
            console.error('Error announcing number:', error);
        }
    };

    const resetPlayers = async (): Promise<void> => {


        try {
            await fetch('/api/bingo/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameId })
            });

        } catch (error) {
            console.error('Error announcing number:', error);
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
            <div className="text-center space-y-6">
                <h1 className="text-2xl text-black font-bold">ビンゴ管理画面</h1>

                {currentNumber && (
                    <div className="text-4xl font-bold text-blue-600">
                        現在の番号: {currentNumber}
                    </div>
                )}

                <button
                    onClick={() => {
                        announceNumber()
                    }}
                    disabled={numbers.length >= 75}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    番号を出す
                </button>
                <button
                    onClick={async () => {
                        await resetPlayers()
                        setDrawnNumbers([])
                        setNumbers([])
                        setCurrentNumber(null)
                    }}
                    disabled={numbers.length >= 75}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    リセット
                </button>
                <div className='text-black'>
                    <p>ビンゴした人</p>
                    <ul>
                        {bingoPlayers.map(bp => <li>{bp.name}さん</li>)}
                    </ul>
                </div>

                <div className="mt-4">
                    <h2 className="text-xl mb-2 text-black">出た番号一覧:</h2>
                    <div className="grid grid-cols-10 gap-1">
                        {numbers.map((num, index) => (
                            <div key={index} className="bg-gray-100 p-1 text-center rounded text-black">
                                {num}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div>
                <h2 className="text-xl mb-4 text-black">参加者一覧</h2>
                <input className='w-full border my-2 p-2  bg-slate-100 text-black' onChange={(event) => { setShowName(event.target.value) }} placeholder='表示する人'></input>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...players.filter(player => showName.length > 0 ? player.name.includes(showName) : true).filter(player => player.hasReach), ...players.filter(player => showName.length > 0 ? player.name.includes(showName) : true).filter(player => !player.hasReach)].map(player => (

                        <Collapse title={<p className="text-lg font-semibold text-black">{player.name}{player.hasWon && (
                            <span className="text-yellow-600 font-bold">
                                ビンゴ!
                            </span>
                        )}{player.hasReach && (
                            <span className="text-blue-600 font-bold">
                                リーチ
                            </span>
                        )}</p>} hasWon={player.hasWon} hasReach={player.hasReach}>
                            {/* プレイヤーのビンゴカード */}

                            {player.card.map((row, rowIndex) =>
                                row.map((cell, colIndex) => (
                                    <div
                                        key={`${rowIndex}-${colIndex}`}
                                        className={`
                                                    aspect-square flex items-center justify-center
                                                    text-sm border rounded cursor-pointer
                                                    ${cell.isMarked ? 'bg-blue-500 text-white' : 'bg-white'}
                                                    ${drawnNumbers.includes(cell.number) ? 'border-red-500 border-2' : 'border-gray-200 text-black'}
                                                `}
                                        onClick={() => { announceNumber(cell.number) }}
                                    >
                                        {cell.number}
                                    </div>
                                ))
                            )}

                        </Collapse>

                    ))}
                </div>
            </div>
        </div >
    );
}