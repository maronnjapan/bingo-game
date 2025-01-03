'use client'
import { useEffect, useState } from 'react';
import { Collapse } from './Collapse';
import { pusherClient } from '@/lib/pusher';
import { SpineMachine } from '../../_components/SpineMachine';

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


const defaultValues = [62, 1, 16, 54, 38, 5, 7, 13, 8];
export function BingoDashboard({ gameId }: { gameId: string }) {
    const [bingoPlayers, setBingoPlayers] = useState<{ id: string, name: string }[]>([]);
    const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
    const [numbers, setNumbers] = useState<number[]>([]);
    const [currentNumber, setCurrentNumber] = useState<number | null>(null);
    const [isNotificationError, setIsNotificationError] = useState(true)
    const [isLoading, setIsLoading] = useState(false)


    useEffect(() => {
        const fetchInitialNumber = async () => {
            try {
                const response = await fetch(`/api/bingo?gameId=${gameId}`);
                const data: { fileData: string[] } = await response.json();
                setNumbers(data.fileData.map(num => Number(num)));
            } catch (error) {
                console.error('Error fetching players:', error);
            }
        };

        fetchInitialNumber();
    }, [])
    useEffect(() => {

        // Pusherチャンネルの購読
        const gameChannel = pusherClient.subscribe(`bingo-game-${gameId}`);

        // ビンゴ達成通知のリスニング
        // gameChannel.bind('bingo-achieved', (data: { player: { id: string, name: string } }) => {
        //     setBingoPlayers(prev => [...prev.filter(p => p.id !== data.player.id), data.player]);
        //     // アラート表示
        //     alert(`${data.player.name}さんがビンゴになりました！`);
        // });

        // // プレイヤー更新のリスニング
        // gameChannel.bind('players-updated', (data: { players: Player[] }) => {
        //     setPlayers(data.players);
        // });


        // 新しい番号のリスニング
        // numbersChannel.bind('new-number', (data: { number: number }) => {
        //     if (isShowError) {
        //         setIsShowError(false)
        //     }
        //     setTimeout(() => {
        //         setNumbers(prev => Array.from(new Set([...prev, data.number])));
        //     }, 3500);
        //     setCurrentNumber(data.number);
        //     setDrawnNumbers(prev => [...prev, data.number]);
        // });

        // ゲームリセットのリスニング
        gameChannel.bind('game-reset', () => {
            setDrawnNumbers([]);
            setNumbers([]);
            setCurrentNumber(null);
            setBingoPlayers([]);
            // setPlayers([]);
        });

        return () => {
            gameChannel.unbind_all();
            pusherClient.unsubscribe(`bingo-game-${gameId}`);
            pusherClient.unsubscribe('bingo-numbers');
            pusherClient.unsubscribe('bingo-error')
        };
    }, [gameId]);

    const generateNumber = (): number | null => {
        const availableNumbers = Array.from({ length: 75 }, (_, i) => i + 1)
            .filter(num => !numbers.includes(num));

        if (availableNumbers.length === 0) return null;

        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        return availableNumbers[randomIndex];
    };

    const notificationError = async () => {
        try {
            setIsLoading(true)
            await fetch('/api/bingo/error', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameId })
            })
        } finally {
            setTimeout(() => {
                setIsLoading(false)
            }, 2000);
        }
    }

    const announceNumber = async (targetNumber?: number): Promise<void> => {
        const number = targetNumber ?? generateNumber();
        if (!number) return;

        try {
            setIsLoading(true)
            await fetch('/api/bingo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number, gameId })
            });
            setTimeout(() => {
                setNumbers(prev => Array.from(new Set([...prev, number])));
                setIsLoading(false)
            }, 3500);
            setCurrentNumber(number);
            setDrawnNumbers(prev => [...prev, number]);
        } catch (error) {
            console.error('Error announcing number:', error);
        } finally {
            setTimeout(() => {
                setIsLoading(false)
            }, 3500);
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
                    // <div className="text-4xl font-bold text-blue-600">
                    //     現在の番号: {currentNumber}
                    // </div>
                    <SpineMachine finalNumber={currentNumber}></SpineMachine>
                )}

                {/* <button
                    onClick={() => {
                        announceNumber()
                    }}
                    disabled={numbers.length >= 75 || numbers.length < defaultValues.length}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    番号を出す
                </button>
                <button
                    onClick={async () => {
                        announceNumber(defaultValues[numbers.length])
                    }}
                    disabled={numbers.length >= defaultValues.length}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    マッチポンプ番号を出す
                </button> */}
                <button
                    onClick={async () => {
                        if (numbers.length === 11 && isNotificationError) {
                            setIsNotificationError(false)
                            return await notificationError()
                        }
                        await announceNumber(numbers.length < defaultValues.length ? defaultValues[numbers.length] : undefined)
                    }}
                    disabled={numbers.length >= 75 || isLoading}
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
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    リセット
                </button>


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
        </div>
    );
}