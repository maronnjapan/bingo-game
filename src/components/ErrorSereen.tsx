import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const ErrorScreen = () => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-lg shadow-2xl p-8 transform hover:scale-105 transition-transform duration-300">
                    {/* Error Icon with Animation */}
                    <div className="flex justify-center mb-8">
                        <div className="animate-bounce">
                            <AlertTriangle className="w-32 h-32 text-red-500" />
                        </div>
                    </div>

                    {/* Error Message */}
                    <div className="text-center space-y-6">
                        <h1 className="text-5xl font-bold text-gray-800 mb-4">
                            <span className="inline-block animate-pulse">!</span> エラーが発生しました
                        </h1>

                        <p className="text-gray-600 text-xl mb-8">
                            申し訳ありません。予期せぬエラーが発生しました。
                        </p>

                        {/* Error Details */}
                        <div className="bg-red-50 rounded-lg p-6">
                            <p className="text-red-600 font-mono text-lg">
                                Error Code: 500 | Internal Server Error
                            </p>
                        </div>
                    </div>
                </div>

                {/* Additional Help Text */}
                <p className="text-center text-gray-500 mt-8 text-lg">
                    問題が解決しない場合は、
                    <a href="#" className="text-red-500 hover:text-red-600 underline">
                        サポートチーム
                    </a>
                    までお問い合わせください。
                </p>
            </div>
        </div>
    );
};
