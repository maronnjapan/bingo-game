import React, { useState, useEffect, useCallback } from 'react';

export const SpineMachine = ({ finalNumber = 42, duration = 3000 }) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [currentNumber, setCurrentNumber] = useState('00');
    const [drumRotation, setDrumRotation] = useState(0);
    const [ballPosition, setBallPosition] = useState({ x: 100, y: 120 });
    const [showBall, setShowBall] = useState(false);

    const spin = useCallback(() => {
        setIsSpinning(true);
        setShowBall(false);
        setBallPosition({ x: 100, y: 120 });
    }, []);

    useEffect(() => {
        spin()
    }, [finalNumber])

    useEffect(() => {
        if (!isSpinning) return;

        let startTime: number | null = null;
        let animationFrame: number | null = null;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const progressRatio = Math.min(progress / duration, 1);

            const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
            const currentSpeed = easeOut(1 - progressRatio);
            const rotationIncrement = currentSpeed * 30;

            setDrumRotation(prev => (prev + rotationIncrement) % 360);

            if (progress > duration - 1000) {
                setShowBall(true);

                const fallProgress = (progress - (duration - 1000)) / 1000;

                // 自然な落下曲線を計算
                const startX = 155;
                const startY = 160;
                const endX = 100;
                const endY = 270;

                // 重力加速度を考慮した落下
                const x = startX + (endX - startX) * fallProgress;
                const y = startY + (endY - startY) * (fallProgress * fallProgress);

                setBallPosition({ x, y });

                if (progress > duration - 500) {
                    setCurrentNumber(String(finalNumber).padStart(2, '0'));
                }
            } else if (progress % (16 / currentSpeed) < 16) {
                setCurrentNumber(String(Math.floor(Math.random() * 100)).padStart(2, '0'));
            }

            if (progress < duration) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setIsSpinning(false);
                setCurrentNumber(String(finalNumber).padStart(2, '0'));
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
        };
    }, [isSpinning, duration, finalNumber]);

    return (
        <div className="flex flex-col items-center justify-center " style={{ marginBottom: 0, marginTop: 0 }}>
            <div className="relative w-44 h-64">
                <svg viewBox="0 0 200 300" className="w-full h-full">
                    {/* ベース */}
                    <rect x="40" y="200" width="120" height="80" fill="#2A4365" rx="5" />
                    <rect x="45" y="205" width="110" height="70" fill="#3B82F6" rx="3" />

                    {/* メインドラム */}
                    <g transform="translate(100 120)">
                        <g transform={`rotate(${drumRotation})`}>
                            <circle cx="0" cy="0" r="60" fill="#1E40AF" />
                            <circle cx="0" cy="0" r="55" fill="#2563EB" />
                            {/* 内部の仕切り */}
                            {[...Array(12)].map((_, i) => (
                                <g key={i} transform={`rotate(${i * 30})`}>
                                    <line
                                        x1="0"
                                        y1="-55"
                                        x2="0"
                                        y2="-35"
                                        stroke="#fff"
                                        strokeWidth="3"
                                        className={isSpinning ? 'opacity-50' : 'opacity-100'}
                                    />
                                </g>
                            ))}
                        </g>
                    </g>

                    {/* 出口の穴 */}
                    <g transform="translate(155, 160)">
                        {/* 穴の外枠 */}
                        <circle cx="0" cy="0" r="8" fill="#1E3A8A" />
                        {/* 穴の内側（奥行き表現） */}
                        <circle cx="0" cy="0" r="6" fill="#152C61" />
                    </g>

                    {/* 受け皿 */}
                    <path
                        d="M70,260 C70,250 130,250 130,260 L130,270 C130,280 70,280 70,270 Z"
                        fill="#2A4365"
                        stroke="#1E3A8A"
                        strokeWidth="1"
                    />

                    {/* ガラスドーム */}
                    <path
                        d="M40,120 A60,60 0 0,1 160,120 L160,200 L40,200 Z"
                        fill="rgba(255,255,255,0.1)"
                        stroke="#A3BFFA"
                        strokeWidth="2"
                    />

                    {/* 落下中のビンゴボール */}
                    {showBall && (
                        <g transform={`translate(${ballPosition.x} ${ballPosition.y})`}>
                            <circle r="6" fill="white" stroke="#2563EB" strokeWidth="1">
                                <animate
                                    attributeName="r"
                                    values="6;5.5;6"
                                    dur="0.5s"
                                    repeatCount="indefinite"
                                />
                            </circle>
                            <text
                                textAnchor="middle"
                                dy="3"
                                fontSize="8"
                                fill="#2563EB"
                                fontWeight="bold"
                            >
                                {currentNumber}
                            </text>
                        </g>
                    )}
                </svg>

                {/* 出てきた玉の最終表示 */}
                {showBall && ballPosition.y > 260 && (
                    <div className="absolute bottom-6 left-0 w-full flex justify-center">
                        <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg border-2 border-blue-600 animate-bounce">
                            <span className="font-mono font-bold text-xl text-blue-600">
                                {currentNumber}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

