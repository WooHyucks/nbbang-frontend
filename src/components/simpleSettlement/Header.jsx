import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '@/components/ui/calendar';

const Header = ({
    meetingDate,
    handleMeetingDate,
    calendarOpen,
    setCalendarOpen,
}) => {
    const navigate = useNavigate();

    return (
        <header className="sticky top-0 z-10 bg-white flex justify-between items-center h-[64px] px-4 border-b border-gray-200">
            <img
                onClick={() => navigate(-1)}
                src="/images/beck.png"
                alt="뒤로가기"
                className="w-5 z-10"
            />
            <h1 className="text-lg font-bold">간편 정산</h1>
            <img
                onClick={() => setCalendarOpen(!calendarOpen)}
                src="/images/calendar.png"
                alt="캘린더"
                className="w-8 z-10"
            />
            {calendarOpen && (
                <div className="absolute top-14 right-3 z-10 bg-white border border-gray-200 rounded-md">
                    <Calendar
                        mode="single"
                        selected={meetingDate}
                        onSelect={handleMeetingDate}
                    />
                </div>
            )}
        </header>
    );
};

export default Header;
