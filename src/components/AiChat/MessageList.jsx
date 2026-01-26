import React, { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import MessageBubble from './MessageBubble';
import SummaryCard from './cards/SummaryCard';
import DraftCard from './cards/DraftCard';
import AiLoadingMessage from './AiLoadingMessage';

const MessageList = ({
    messages,
    isLoading,
    user,
    onUserUpdate,
    isModifyMode = false,
}) => {
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    return (
        <div className="w-full">
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                    <Sparkles
                        size={48}
                        className="text-[#3182F6] animate-pulse"
                    />
                    <p className="text-gray-400 text-sm">
                        메시지가 없습니다. 정산을 시작해보세요!
                    </p>
                </div>
            ) : (
                <div
                    className="space-y-3 sm:space-y-4 pt-2"
                    ref={messagesEndRef}
                >
                    {messages.map((message) => {
                        if (message.type === 'summary_card') {
                            return (
                                <SummaryCard
                                    key={message.id}
                                    data={message.data}
                                />
                            );
                        }
                        if (message.type === 'draft_card') {
                            return (
                                <div
                                    key={message.id}
                                    className="flex items-start gap-2 sm:gap-3 w-full justify-start"
                                >
                                    <div className="flex-shrink-0 mt-1">
                                        <Sparkles
                                            size={18}
                                            className="text-[#3182F6]"
                                        />
                                    </div>
                                    <div className="w-full max-w-[90%] sm:max-w-[85%] md:max-w-[75%]">
                                        <DraftCard
                                            aiData={message.aiData}
                                            imageUrls={message.imageUrls}
                                            onConfirm={message.onConfirm}
                                            isViewerMode={message.isViewerMode}
                                            onSettlementCreated={
                                                message.onSettlementCreated
                                            }
                                            uuid={message.uuid}
                                            meetingId={message.meetingId}
                                            user={user}
                                            onUserUpdate={onUserUpdate}
                                        />
                                    </div>
                                </div>
                            );
                        }
                        if (message.type === 'image') {
                            return (
                                <div
                                    key={message.id}
                                    className={`flex items-start gap-2 sm:gap-3 w-full ${
                                        message.sender === 'user'
                                            ? 'justify-end'
                                            : 'justify-start'
                                    }`}
                                >
                                    {message.sender === 'ai' && (
                                        <div className="flex-shrink-0 mt-1">
                                            <Sparkles
                                                size={18}
                                                className="text-[#3182F6]"
                                            />
                                        </div>
                                    )}
                                    <div className="w-full max-w-[90%] sm:max-w-[85%] md:max-w-[75%] flex justify-end">
                                        <div className="bg-white rounded-2xl rounded-br-sm overflow-hidden shadow-sm w-full max-w-full sm:max-w-[400px]">
                                            <img
                                                src={message.imageUrl}
                                                alt="업로드된 이미지"
                                                className="w-full h-auto object-cover"
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        return (
                            <MessageBubble key={message.id} message={message} />
                        );
                    })}
                    {isLoading && (
                        <AiLoadingMessage isModifyMode={isModifyMode} />
                    )}
                    <div ref={messagesEndRef} />
                </div>
            )}
        </div>
    );
};

export default MessageList;
