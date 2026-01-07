import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const Calculator = ({ setOpenModal, setMeetingData }) => {
    const [input, setInput] = useState('');
    const [result, setResult] = useState('');

    const handleClick = (value) => {
        if (value === '=') {
            try {
                setResult(eval(input).toString());
            } catch {
                setResult('Error');
            }
        } else if (value === 'C') {
            setInput('');
            setResult('');
        } else if (value === '←') {
            setInput((prev) => prev.slice(0, -1));
        } else {
            setInput((prev) => prev + value);
        }
    };

    const handleSetMeetingPlace = () => {
        if (result) {
            setMeetingData((prev) => ({ ...prev, simple_price: result }));
            setOpenModal(false);
        }
    };

    return (
        <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed z-10 inset-x-0 bottom-0 left-0 w-full bg-white border rounded-t-3xl p-5 max-w-[420px] mx-auto"
        >
            <div className="flex flex-col items-end text-right space-y-2 pb-2">
                <div className="text-gray-500 text-lg">{input || '0'}</div>
            </div>
            {result ? (
                <div className="flex justify-between">
                    <button
                        onClick={handleSetMeetingPlace}
                        className="text-xs p-2 rounded-lg text-white bg-main-blue"
                    >
                        사용금액 자동 기입
                    </button>
                    <div className="text-2xl font-bold">{result}</div>
                </div>
            ) : (
                ''
            )}

            <div className="grid grid-cols-4 gap-2 mt-4">
                {[
                    '7',
                    '8',
                    '9',
                    'C',
                    '4',
                    '5',
                    '6',
                    '/',
                    '1',
                    '2',
                    '3',
                    '*',
                    '0',
                    '.',
                    '-',
                    '+',
                    '=',
                ].map((item) => (
                    <Button
                        key={item}
                        onClick={() => handleClick(item)}
                        className={`h-14 text-xl font-semibold rounded-xl ${
                            item === '='
                                ? 'col-span-2 bg-blue-500 text-white'
                                : item === '.'
                                  ? 'bg-gray-100' // 점 버튼 디자인
                                  : 'bg-gray-100'
                        }`}
                    >
                        {item}
                    </Button>
                ))}
                <Button
                    onClick={() => handleClick('←')}
                    className="h-14 text-xl font-semibold rounded-xl bg-yellow-500 text-white col-span-2"
                >
                    ←
                </Button>
                <span
                    className="absolute top-2 left-4 text-2xl"
                    onClick={() => setOpenModal(false)}
                >
                    x
                </span>
            </div>
        </motion.div>
    );
};

export default Calculator;
