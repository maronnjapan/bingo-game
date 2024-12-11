import { ReactNode, useState } from 'react';

export const Collapse = ({ title, children, hasWon, hasReach }: { title: ReactNode, children: ReactNode, hasWon: boolean, hasReach: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className={`rounded-lg border w-full max-w-md mx-auto  ${hasWon ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'
                } ${hasReach ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-2 flex justify-between items-center bg-gray-50 hover:bg-gray-100 rounded-lg focus:outline-none"
            >
                {title}


                <svg
                    className={`w-4 h-4 text-black transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                        }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>


            <div className={`grid grid-cols-5 gap-1 w-1/2 mx-auto overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-96 py-4' : 'max-h-0'
                }`}>
                {children}
            </div>
        </div>
    );
};