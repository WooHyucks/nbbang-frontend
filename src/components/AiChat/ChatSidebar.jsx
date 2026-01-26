import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    X,
    Search,
    Plus,
    Square,
    MessageSquare,
    Plane,
    Calculator,
    Users,
    Pencil,
    Trash2,
    Sparkles,
} from 'lucide-react';
import { getMeetingData, deleteMeetingData } from '../../api/api';
import BillingNameModal from '../Modal/BillingNameModal';
import { Skeleton } from '@/components/ui/skeleton';
import ToastPopUp from '../common/ToastPopUp';

const ChatSidebar = ({
    isOpen,
    onClose,
    onNewChat,
    onSelectAiChat,
    refreshTrigger,
    activeMeetingId,
}) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('전체');
    const [meetings, setMeetings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openMenuModal, setOpenMenuModal] = useState(false);
    const [selectedMeetingId, setSelectedMeetingId] = useState(null);
    const [selectedMeetingName, setSelectedMeetingName] = useState(null);
    const [deletingMeetingId, setDeletingMeetingId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [meetingToDelete, setMeetingToDelete] = useState(null);

    const tabs = ['전체', 'AI', '여행', '간편', '모임'];

    // 미팅 데이터를 채팅 형태로 변환
    const transformMeetingToChat = (meeting) => {
        let type = '모임';
        // meetingType === 'ai' 또는 is_ai === true 체크 (최우선)
        if (
            meeting.meetingType === 'ai' ||
            meeting.is_ai === true ||
            meeting.type === 'AI'
        ) {
            type = 'AI';
        } else if (meeting.is_trip === true || meeting.is_trip === 1) {
            type = '여행';
        } else if (meeting.is_simple === true || meeting.is_simple === 1) {
            type = '간편';
        }

        // 날짜 포맷팅 (YYYY-MM-DD -> YYYY.MM.DD)
        const formatDate = (dateString) => {
            if (!dateString) return '';
            return dateString.replace(/-/g, '.');
        };

        return {
            id: meeting.id,
            title: meeting.name || '모임명 없음',
            date: formatDate(meeting.date || meeting.created_at),
            preview: type === '여행' ? '진행 중...' : '정산 완료',
            type: type,
            meetingId: meeting.id,
            uuid: meeting.uuid,
            isTrip: meeting.is_trip,
            isSimple: meeting.is_simple,
        };
    };

    // 미팅 리스트 가져오기
    const fetchMeetings = async () => {
        setIsLoading(true);
        try {
            const response = await getMeetingData('meeting');
            if (response && response.data) {
                setMeetings(response.data);
            }
        } catch (error) {
            console.error('미팅 리스트 불러오기 실패:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMeetings();
    }, [refreshTrigger]);

    // 미팅 데이터를 채팅 형태로 변환
    const chats = useMemo(() => {
        return meetings.map(transformMeetingToChat);
    }, [meetings]);

    const getTypeIcon = (type) => {
        switch (type) {
            case 'AI':
                return <Sparkles size={18} className="text-[#3182F6]" />;
            case '여행':
                return <Plane size={18} className="text-emerald-600" />;
            case '간편':
                return <Calculator size={18} className="text-orange-600" />;
            case '모임':
                return <Users size={18} className="text-purple-600" />;
            default:
                return <MessageSquare size={18} className="text-[#8B95A1]" />;
        }
    };

    const getTypeBgColor = (type) => {
        switch (type) {
            case 'AI':
                return 'bg-blue-50';
            case '여행':
                return 'bg-emerald-50';
            case '간편':
                return 'bg-orange-50';
            case '모임':
                return 'bg-purple-50';
            default:
                return 'bg-[#F2F4F6]';
        }
    };

    const filteredChats = useMemo(() => {
        let filtered =
            activeTab === '전체'
                ? chats
                : chats.filter((chat) => chat.type === activeTab);

        if (searchQuery) {
            filtered = filtered.filter(
                (chat) =>
                    chat.title
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    (chat.preview &&
                        chat.preview
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())),
            );
        }

        return filtered;
    }, [chats, activeTab, searchQuery]);

    const handleNewChat = () => {
        if (onNewChat) {
            onNewChat();
        }
        onClose();
    };

    const handleChatSelect = (chat) => {
        onClose();

        // 타입별 라우팅 분기
        switch (chat.type) {
            case 'AI':
                // AI 정산을 채팅 컨테이너에 로드
                if (chat.meetingId && onSelectAiChat) {
                    onSelectAiChat(chat.meetingId);
                }
                break;
            case '여행':
                if (chat.meetingId) {
                    navigate(`/trip/${chat.meetingId}/dashboard`);
                }
                break;
            case '간편':
                if (chat.meetingId) {
                    navigate(`/simple-settlement/${chat.meetingId}`);
                }
                break;
            case '모임':
                if (chat.meetingId) {
                    navigate(`/meeting/${chat.meetingId}`);
                }
                break;
            default:
                console.log('채팅 선택:', chat.id);
        }
    };

    const handleEdit = (e, chat) => {
        e.stopPropagation();
        setSelectedMeetingId(chat.meetingId);
        setSelectedMeetingName(chat.title);
        setOpenMenuModal(true);
    };

    const handleDelete = (e, chat) => {
        e.stopPropagation();
        setMeetingToDelete(chat);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!meetingToDelete) return;

        setDeletingMeetingId(meetingToDelete.meetingId);
        setShowDeleteModal(false);

        try {
            await deleteMeetingData(meetingToDelete.meetingId);
            setMeetings(
                meetings.filter((m) => m.id !== meetingToDelete.meetingId),
            );
        } catch (error) {
            console.error('미팅 삭제 실패:', error);
            alert('삭제에 실패했습니다.');
        } finally {
            setDeletingMeetingId(null);
            setMeetingToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setMeetingToDelete(null);
    };

    const handleModalClose = () => {
        setOpenMenuModal(false);
        setSelectedMeetingId(null);
        setSelectedMeetingName(null);
        fetchMeetings(); // 모달 닫을 때 리스트 새로고침
    };

    return (
        <>
            {/* 오버레이 (모바일만) */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* 사이드바 */}
            <div
                className={`h-full w-80 bg-white border-r border-[#E5E8EB] flex-shrink-0 fixed top-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:z-auto ${
                    isOpen
                        ? 'translate-x-0'
                        : '-translate-x-full md:translate-x-0'
                }`}
            >
                <div className="flex flex-col h-full">
                    {/* 상단 헤더 */}
                    <div className="p-4 border-b border-[#E5E8EB]">
                        <div className="md:hidden flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={onClose}
                                    className="md:hidden p-1.5 hover:bg-[#F2F4F6] rounded-xl transition-colors active:scale-95"
                                    aria-label="사이드바 닫기"
                                >
                                    <X size={20} className="text-[#333D4B]" />
                                </button>
                            </div>
                            <button
                                className="p-1.5 hover:bg-[#F2F4F6] rounded-xl transition-colors active:scale-95"
                                aria-label="검색"
                            >
                                <Search size={18} className="text-[#333D4B]" />
                            </button>
                        </div>

                        {/* 검색 바 */}
                        <div className="relative mb-3">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B95A1]"
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="채팅 검색"
                                className="w-full pl-10 pr-4 py-2.5 bg-[#F2F4F6] border border-[#E5E8EB] rounded-[20px] text-sm text-[#191F28] placeholder-[#8B95A1] focus:outline-none focus:ring-2 focus:ring-[#3182F6] focus:border-transparent"
                            />
                        </div>

                        {/* 탭 필터 (가로 스크롤) */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${
                                        activeTab === tab
                                            ? 'bg-[#191F28] text-white'
                                            : 'bg-white text-[#8B95A1] border border-[#F2F4F6] hover:bg-[#F2F4F6]'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 새 채팅 버튼 */}
                    <div className="p-4 border-b border-[#E5E8EB]">
                        <button
                            onClick={handleNewChat}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-[#3182F6] hover:bg-[#1B64DA] text-white rounded-xl transition-all font-medium text-sm active:scale-95"
                        >
                            <div className="flex items-center gap-2">
                                <Plus size={18} />
                                <span>새 채팅</span>
                            </div>
                            <Square size={16} className="ml-auto opacity-60" />
                        </button>
                    </div>

                    {/* 스크롤 가능한 컨텐츠 */}
                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                        {/* 채팅 섹션 */}
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-xs font-semibold text-[#8B95A1] uppercase tracking-wider">
                                    채팅
                                </h2>
                            </div>

                            <div className="space-y-1">
                                {isLoading ? (
                                    // 스켈레톤 UI
                                    Array.from({ length: 5 }).map(
                                        (_, index) => (
                                            <div
                                                key={index}
                                                className="w-full p-3 rounded-[20px] bg-white"
                                            >
                                                <div className="flex items-start gap-3">
                                                    {/* 타입별 아이콘 박스 스켈레톤 */}
                                                    <Skeleton className="w-[54px] h-[54px] rounded-2xl bg-[#F2F4F6]" />
                                                    <div className="flex-1 min-w-0 space-y-2">
                                                        {/* 제목 스켈레톤 */}
                                                        <Skeleton className="h-4 w-3/4 rounded-md bg-[#F2F4F6]" />
                                                        {/* Preview 스켈레톤 */}
                                                        <Skeleton className="h-3 w-1/2 rounded-md bg-[#F2F4F6]" />
                                                        {/* 날짜 스켈레톤 */}
                                                        <Skeleton className="h-3 w-1/3 rounded-md bg-[#F2F4F6]" />
                                                    </div>
                                                </div>
                                            </div>
                                        ),
                                    )
                                ) : filteredChats.length === 0 ? (
                                    <div className="text-center py-8 text-sm text-[#8B95A1]">
                                        {searchQuery
                                            ? '검색 결과가 없습니다'
                                            : '채팅이 없습니다'}
                                    </div>
                                ) : (
                                    filteredChats.map((chat) => (
                                        <div
                                            key={chat.id}
                                            className="w-full relative group"
                                        >
                                            <button
                                                onClick={() =>
                                                    handleChatSelect(chat)
                                                }
                                                className={`w-full text-left p-3 rounded-[20px] hover:bg-[#F2F4F6] transition-all active:scale-[0.98] ${
                                                    activeMeetingId &&
                                                    chat.meetingId ===
                                                        activeMeetingId
                                                        ? 'bg-[#E5E8EB] border-l-4 border-[#3182F6]'
                                                        : ''
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {/* 타입별 아이콘 박스 */}
                                                    <div
                                                        className={`${getTypeBgColor(chat.type)} p-3 rounded-2xl flex-shrink-0`}
                                                    >
                                                        {getTypeIcon(chat.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-sm font-medium text-[#191F28] mb-1 truncate">
                                                            {chat.title}
                                                        </h3>
                                                        <p className="text-xs text-[#8B95A1] truncate">
                                                            {chat.preview}
                                                        </p>
                                                        <p className="text-xs text-[#8B95A1] mt-1">
                                                            {chat.date}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                            {/* 수정/삭제 버튼 (모바일: 항상 표시, 데스크탑: hover 시 표시) */}
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) =>
                                                        handleEdit(e, chat)
                                                    }
                                                    className="p-1.5 hover:bg-[#E5E8EB] active:bg-[#E5E8EB] rounded-lg transition-colors"
                                                    aria-label="수정"
                                                >
                                                    <Pencil
                                                        size={14}
                                                        className="text-[#8B95A1]"
                                                    />
                                                </button>
                                                <button
                                                    onClick={(e) =>
                                                        handleDelete(e, chat)
                                                    }
                                                    disabled={
                                                        deletingMeetingId ===
                                                        chat.meetingId
                                                    }
                                                    className="p-1.5 hover:bg-[#E5E8EB] active:bg-[#E5E8EB] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
                                                    aria-label="삭제"
                                                >
                                                    {deletingMeetingId ===
                                                    chat.meetingId ? (
                                                        <div className="w-[14px] h-[14px] border-2 border-[#8B95A1] border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <Trash2
                                                            size={14}
                                                            className="text-[#8B95A1]"
                                                        />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 모임명 수정 모달 */}
            {openMenuModal && (
                <BillingNameModal
                    setOpenMenuModal={setOpenMenuModal}
                    MainMeetingId={selectedMeetingId}
                    MainMeetingName={selectedMeetingName}
                />
            )}

            {/* 삭제 확인 모달 */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                        <h3 className="text-lg font-semibold text-[#191F28] mb-2">
                            정산 삭제
                        </h3>
                        <p className="text-sm text-[#8B95A1] mb-6">
                            정말 삭제하시겠습니까?
                            <br />
                            삭제된 정산은 복구할 수 없습니다.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={cancelDelete}
                                className="flex-1 px-4 py-2.5 bg-[#F2F4F6] text-[#191F28] rounded-xl font-medium text-sm hover:bg-[#E5E8EB] transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2.5 bg-[#EF4444] text-white rounded-xl font-medium text-sm hover:bg-[#DC2626] transition-colors"
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatSidebar;
