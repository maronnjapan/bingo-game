'use client'
import { useState, useEffect, useCallback } from 'react';
import { BingoCard, BingoCell } from '../admin/_components/BingoDashboard';
import { PlayerInfo } from '@/app/api/bingo/players/route';
import { pusherClient } from '@/lib/pusher';
import { SpineMachine } from './SpineMachine';
const generateCard = (): BingoCard => {
    // 各列の数字の範囲を定義
    const ranges = [
        { min: 1, max: 15 },    // B列
        { min: 16, max: 30 },   // I列
        { min: 31, max: 45 },   // N列
        { min: 46, max: 60 },   // G列
        { min: 61, max: 75 }    // O列
    ];

    // 指定された範囲からランダムな数字を生成する関数
    const getRandomNumberInRange = (min: number, max: number, usedNumbers: Set<number>): number => {
        let number;
        do {
            number = Math.floor(Math.random() * (max - min + 1)) + min;
        } while (usedNumbers.has(number));
        usedNumbers.add(number);
        return number;
    };

    // 使用済みの数字を管理するSet
    const usedNumbers = new Set<number>();

    // 列ごとに数字を生成（5x5の転置行列を作成）
    const columns = ranges.map(range =>
        Array(5).fill(null).map(() => ({
            number: getRandomNumberInRange(range.min, range.max, usedNumbers),
            isMarked: false
        }))
    );

    // 転置して行ベースの配列に変換
    return Array(5).fill(null).map((_, rowIndex) =>
        Array(5).fill(null).map((_, colIndex) => columns[colIndex][rowIndex])
    );
};

export function BingoBoard({ gameId }: { gameId: string }) {
    const [numbers, setNumbers] = useState<number[]>([]);
    const [bingoCard, setBingoCard] = useState<BingoCard>(generateCard());
    const [currentNumber, setCurrentNumber] = useState<number | null>(null);
    const [player, setPlayer] = useState<{ id: string, name?: string, hasBingo: boolean }>({ id: Math.random().toString(32).substring(2), name: undefined, hasBingo: false });
    const [isNameEntered, setIsNameEntered] = useState<boolean>(false);
    const [hasWon, setHasWon] = useState<boolean>(false);


    // const handleNameSubmit = (e: React.FormEvent) => {
    //     e.preventDefault();

    //     if (player?.name?.trim()) {
    //         setIsNameEntered(true);
    //     }
    // };

    // const toggleMark = useCallback((newCard: number, player?: { id: string, name?: string, hasBingo: boolean }) => {
    //     const cards = bingoCard.map(bc =>
    //         bc.map(c => ({
    //             isMarked: c.number === newCard ? true : c.isMarked,
    //             number: c.number
    //         }))
    //     );

    //     // カードの状態を更新
    //     setBingoCard(cards);

    //     const fetchData: PlayerInfo = {
    //         id: player?.id ?? '',
    //         card: cards,
    //         hasWon: checkBingo(cards),
    //         hasReach: checkReach(cards),
    //         name: player?.name ?? ''
    //     }
    //     fetch('/api/bingo/players', {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify({
    //             player: fetchData,
    //             gameId: gameId
    //         })
    //     }).then(() => {

    //     }).catch(() => {
    //         alert('エラーが発生しました');
    //     });

    //     // ビンゴをチェック
    //     if (checkBingo(cards) && !player?.hasBingo) {
    //         fetch('/api/bingo/notification', {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({
    //                 player,
    //                 gameId: gameId
    //             })
    //         }).then(() => {
    //             setHasWon(true);
    //         }).catch(() => {
    //             alert('エラーが発生しました');
    //         });
    //     }

    //     // 出た番号の更新
    //     setNumbers(prev => [...prev, newCard]);
    // }, [bingoCard])


    useEffect(() => {
        const gameChannel = pusherClient.subscribe(`bingo-game-${gameId}`);
        const numbersChannel = pusherClient.subscribe('bingo-numbers');

        // 新しい番号のリスニング
        numbersChannel.bind('new-number', (data: { number: number }) => {
            setCurrentNumber(data.number)
            setTimeout(() => {
                setNumbers(prev => [...prev, data.number]);

            }, 3500);

        });

        // ゲームリセットのリスニング
        gameChannel.bind('game-reset', () => {
            setNumbers([]);
            setBingoCard(generateCard());
            setCurrentNumber(null);
            setHasWon(false);
        });

        // コンポーネントのクリーンアップ
        return () => {
            gameChannel.unbind_all();
            numbersChannel.unbind_all();
            pusherClient.unsubscribe(`bingo-game-${gameId}`);
            pusherClient.unsubscribe('bingo-numbers');
        };
    }, [gameId, isNameEntered, player]);

    useEffect(() => {
        const fetchInitialNumber = async () => {
            try {
                const response = await fetch(`/api/bingo?gameId=${gameId}`);
                const data: { fileData: string[] } = await response.json();
                console.log(data.fileData)
                setNumbers(data.fileData.map(num => Number(num)));
            } catch (error) {
                console.error('Error fetching players:', error);
            }
        };

        fetchInitialNumber();
    }, [])

    return (
        <div className="max-w-xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
            <div className="text-center space-y-6">
                <h1 className="text-2xl font-bold text-black">ビンゴゲーム</h1>

                {currentNumber && (
                    // <div className="text-4xl font-bold text-blue-600">
                    //     現在の番号: {currentNumber}
                    // </div>
                    <SpineMachine finalNumber={currentNumber}></SpineMachine>
                )}

                {/* {hasWon ? (
                            <div className="mt-4 p-4 bg-yellow-100 text-yellow-800 rounded-lg">
                                ビンゴ達成！
                            </div>
                        ) : <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
                            {bingoCard.map((row, rowIndex) => (
                                row.map((cell, colIndex) => (
                                    <div
                                        key={`${rowIndex}-${colIndex}`}
                                        className={`
aspect-square flex items-center justify-center
border-2 border-gray-300 rounded  text-black
${cell.isMarked ? 'bg-blue-500 text-white' : 'bg-white'}
${numbers.includes(cell.number) ? 'border-red-500 border-2' : ''}
transition-colors duration-200
`}
                                    >
                                        {cell.number}
                                    </div>
                                ))
                            ))}
                        </div>} */}


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


const checkBingo = (card: BingoCell[][]): boolean => {
    // 横列チェック
    const horizontalBingo = card.some(row =>
        row.every(cell => cell.isMarked)
    );

    // 縦列チェック
    const verticalBingo = Array(5).fill(null).some((_, i) =>
        card.every(row => row[i].isMarked)
    );

    // 斜めチェック（左上から右下）
    const diagonalBingo1 = card.every((row, i) =>
        row[i].isMarked
    );

    // 斜めチェック（右上から左下）
    const diagonalBingo2 = card.every((row, i) =>
        row[4 - i].isMarked
    );

    return horizontalBingo || verticalBingo || diagonalBingo1 || diagonalBingo2;
};

const checkReach = (card: BingoCell[][]): boolean => {
    // 横列チェック
    const horizontalBingo = card.some(row =>
        row.filter(cell => cell.isMarked).length === 4
    );

    // 縦列チェック
    const verticalBingo = Array(5).fill(null).some((_, i) =>
        card.filter(row => row[i].isMarked).length === 4
    );

    // 斜めチェック（左上から右下）
    const diagonalBingo1 = card.filter((row, i) =>
        row[i].isMarked
    ).length === 4

    // 斜めチェック（右上から左下）
    const diagonalBingo2 = card.filter((row, i) =>
        row[4 - i].isMarked
    ).length === 4

    return horizontalBingo || verticalBingo || diagonalBingo1 || diagonalBingo2;
};