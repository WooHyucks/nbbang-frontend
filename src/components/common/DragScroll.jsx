import useDragScroll from '@/hooks/useDragScroll';
import { cn } from '@/lib/utils';

function DragScroll({ children, className }) {
    const { scrollRef, isDragging, eventHandlers } = useDragScroll();

    return (
        <div
            ref={scrollRef}
            {...eventHandlers}
            className={cn(
                'w-full flex gap-3 overflow-x-auto scroll-hidden select-none',
                isDragging ? 'cursor-grabbing' : 'cursor-pointer',
                className,
            )}
        >
            {children}
        </div>
    );
}

export default DragScroll;
