import { useState, useRef } from 'react';

const useDragScroll = () => {
    const scrollRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const startDrag = (clientX) => {
        if (!scrollRef.current) return;
        setIsDragging(true);
        setStartX(clientX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
    };

    const moveDrag = (clientX) => {
        if (!isDragging || !scrollRef.current) return;
        const x = clientX - scrollRef.current.offsetLeft;
        const walk = x - startX;
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleMouseDown = (e) => startDrag(e.clientX);
    const handleMouseMove = (e) => moveDrag(e.clientX);
    const handleMouseUpOrLeave = () => setIsDragging(false);

    const handleTouchStart = (e) => startDrag(e.touches[0].clientX);
    const handleTouchMove = (e) => moveDrag(e.touches[0].clientX);
    const handleTouchEnd = () => setIsDragging(false);

    const eventHandlers = {
        onMouseDown: handleMouseDown,
        onMouseMove: handleMouseMove,
        onMouseUp: handleMouseUpOrLeave,
        onMouseLeave: handleMouseUpOrLeave,
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
    };

    return { scrollRef, isDragging, eventHandlers };
};

export default useDragScroll;
