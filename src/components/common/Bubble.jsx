import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const Bubble = ({ text, className }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={(cn('my-2 max-w-[75%]'), className)}
        >
            <div className="relative text-sm bg-main-blue px-4 text-white py-2 rounded-lg shadow-base border border-gray-300  whitespace-nowrap before:content-[''] before:absolute before:bottom-[-14px] before:right-0 before:-translate-x-1/2 before:border-8 before:border-transparent before:border-t-main-blue">
                {text}
            </div>
        </motion.div>
    );
};

export default Bubble;
