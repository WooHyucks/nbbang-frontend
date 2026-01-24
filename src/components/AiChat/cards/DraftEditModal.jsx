import React, { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { axiosData } from '../../../api/api';
import ToastPopUp from '../../common/ToastPopUp';

// 참여자 추가 모달 컴포넌트
const AddMemberModal = ({ isOpen, onClose, onAdd, existingMembers }) => {
    const [memberName, setMemberName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setMemberName('');
            setError('');
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmedName = memberName.trim();

        if (!trimmedName) {
            setError('이름을 입력해주세요.');
            return;
        }

        if (existingMembers.includes(trimmedName)) {
            setError('이미 추가된 참여자입니다.');
            return;
        }

        onAdd(trimmedName);
        setMemberName('');
        setError('');
        onClose();
    };

    const handleClose = () => {
        setMemberName('');
        setError('');
        onClose();
    };

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
                    onClick={handleClose}
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-md mx-auto shadow-2xl"
                    >
                        {/* 핸들 바 (모바일) */}
                        <div className="sm:hidden pt-3 pb-2">
                            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto" />
                        </div>

                        {/* 헤더 */}
                        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                                    참여자 추가
                                </h3>
                                <button
                                    onClick={handleClose}
                                    className="flex-shrink-0 p-2.5 -mr-2 text-gray-400 md:hover:text-gray-600 rounded-lg md:hover:bg-gray-50 active:bg-gray-50 transition-colors active:scale-95 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    aria-label="닫기"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* 내용 */}
                        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    이름
                                </label>
                                <input
                                    type="text"
                                    value={memberName}
                                    onChange={(e) => {
                                        setMemberName(e.target.value);
                                        setError('');
                                    }}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3182F6] focus:border-transparent text-base"
                                    placeholder="참여자 이름을 입력하세요"
                                    autoFocus
                                />
                                {error && (
                                    <p className="mt-2 text-sm text-red-500">{error}</p>
                                )}
                            </div>

                            {/* 버튼 */}
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl md:hover:bg-gray-200 active:bg-gray-200 transition-colors font-medium active:scale-95 touch-manipulation min-h-[44px]"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-[#3182F6] text-white rounded-xl md:hover:bg-[#1E6FFF] active:bg-[#1E6FFF] transition-colors font-medium active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px]"
                                    disabled={!memberName.trim()}
                                >
                                    추가하기
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const DraftEditModal = ({ aiData, onClose, onSave, meetingId: propMeetingId }) => {
    const { id: urlMeetingId } = useParams();
    const meetingId = propMeetingId || urlMeetingId;
    const [formData, setFormData] = useState({
        meeting_name: '',
        date: '',
        members: [],
        items: [],
    });
    const [isSaving, setIsSaving] = useState(false);
    const [toastPopUp, setToastPopUp] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [newItem, setNewItem] = useState({
        name: '',
        price: 0,
        attendees: [],
        payer: '',
    });
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

    useEffect(() => {
        if (aiData) {
            setFormData({
                meeting_name: aiData.meeting_name || '',
                date: aiData.date || '',
                members: [...(aiData.members || [])],
                items: (aiData.items || []).map((item) => ({
                    name: item.name || '',
                    price: item.price || 0,
                    attendees: [...(item.attendees || [])],
                    payer: item.payer || item.pay_member || item.paid_by || (aiData.members?.[0] || '나'),
                })),
            });
        }
    }, [aiData]);

    // 멤버 추가
    const handleAddMember = (memberName) => {
        setFormData((prev) => ({
            ...prev,
            members: [...prev.members, memberName],
        }));
    };

    // 멤버 삭제
    const handleRemoveMember = (index) => {
        setFormData((prev) => {
            const removedMember = prev.members[index];
            return {
                ...prev,
                members: prev.members.filter((_, i) => i !== index),
                items: prev.items.map((item) => ({
                    ...item,
                    attendees: item.attendees.filter(
                        (attendee) => attendee !== removedMember
                    ),
                    // payer가 삭제된 멤버면 첫 번째 멤버로 변경 (또는 null)
                    payer: item.payer === removedMember 
                        ? (prev.members.filter((_, i) => i !== index)[0] || null)
                        : item.payer,
                })),
            };
        });
    };

    // 항목 추가 시 안내 모달만 표시 (실제 항목 추가는 제한)
    const handleAddItem = () => {
        // 모달을 열기 전에 기본값 설정
        setNewItem({
            name: '',
            price: 0,
            // 기본값: 현재 참여자 전원이 함께 먹은 것으로 간주하여 모두 체크
            attendees: [...(formData.members || [])],
            payer: formData.members[0] || '나',
        });
        setShowAddItemModal(true);
    };

    const handleToggleNewItemAttendee = (memberName) => {
        setNewItem((prev) => {
            const exists = prev.attendees.includes(memberName);
            return {
                ...prev,
                attendees: exists
                    ? prev.attendees.filter((m) => m !== memberName)
                    : [...prev.attendees, memberName],
            };
        });
    };

    const handleConfirmAddItem = () => {
        if (!newItem.name.trim()) {
            setToastMessage('항목 이름을 입력해주세요.');
            setToastType('warning');
            setToastPopUp(true);
            return;
        }
        if (!newItem.payer) {
            setToastMessage('결제자를 선택해주세요.');
            setToastType('warning');
            setToastPopUp(true);
            return;
        }
        if (!newItem.attendees || newItem.attendees.length === 0) {
            setToastMessage('참여자를 한 명 이상 선택해주세요.');
            setToastType('warning');
            setToastPopUp(true);
            return;
        }

        setFormData((prev) => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    name: newItem.name.trim(),
                    price: Math.max(0, Number(newItem.price) || 0),
                    attendees: newItem.attendees,
                    payer: newItem.payer,
                },
            ],
        }));

        setShowAddItemModal(false);
    };

    // 항목 삭제
    const handleRemoveItem = (index) => {
        setFormData((prev) => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }));
    };

    // 항목 필드 업데이트
    const handleItemChange = (index, field, value) => {
        setFormData((prev) => ({
            ...prev,
            items: prev.items.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            ),
        }));
    };

    // 항목 참여자 토글
    const handleToggleAttendee = (itemIndex, memberName) => {
        setFormData((prev) => ({
            ...prev,
            items: prev.items.map((item, i) => {
                if (i === itemIndex) {
                    const attendees = item.attendees || [];
                    const isAttending = attendees.includes(memberName);
                    return {
                        ...item,
                        attendees: isAttending
                            ? attendees.filter((a) => a !== memberName)
                            : [...attendees, memberName],
                    };
                }
                return item;
            }),
        }));
    };

    // 저장
    const handleSave = () => {
        // 유효성 검사
        if (!formData.meeting_name.trim()) {
            setToastMessage('모임 이름을 입력해주세요.');
            setToastType('warning');
            setToastPopUp(true);
            return;
        }

        if (formData.members.length === 0) {
            setToastMessage('최소 1명의 멤버를 추가해주세요.');
            setToastType('warning');
            setToastPopUp(true);
            return;
        }

        if (formData.items.length === 0) {
            setToastMessage('최소 1개의 항목을 추가해주세요.');
            setToastType('warning');
            setToastPopUp(true);
            return;
        }

        // 빈 항목 제거 및 유효성 검사
        const validItems = formData.items
            .filter((item) => item.name.trim() && item.attendees.length > 0 && item.payer)
            .map((item) => ({
                name: item.name.trim(),
                price: Math.max(0, item.price || 0),
                attendees: item.attendees,
                payer: item.payer,
            }));

        if (validItems.length === 0) {
            setToastMessage('유효한 항목이 없습니다. 각 항목에는 이름, 참여자, 결제자가 필요합니다.');
            setToastType('warning');
            setToastPopUp(true);
            return;
        }

        // payer 유효성 검사
        const invalidPayerItems = validItems.filter(
            (item) => !formData.members.includes(item.payer)
        );
        if (invalidPayerItems.length > 0) {
            setToastMessage('결제자가 멤버 목록에 없는 항목이 있습니다.');
            setToastType('warning');
            setToastPopUp(true);
            return;
        }

        // API 호출 또는 onSave 콜백
        if (meetingId) {
            // API 호출
            handleSaveToApi({
                name: formData.meeting_name.trim(),
                date: formData.date,
                members: formData.members,
                items: validItems,
            });
        } else {
            // meetingId가 없으면 기존 onSave 콜백 사용
            onSave({
                ...formData,
                items: validItems,
            });
        }
    };

    // API 호출 함수
    const handleSaveToApi = async (payload) => {
        setIsSaving(true);
        try {
            const response = await axiosData().put(`/meeting/${meetingId}/ai`, payload);
            
            // 성공 시
            if (response.status === 200) {
                // onSave 콜백 호출 (부모 컴포넌트에서 처리)
                onSave({
                    meeting_name: payload.name,
                    date: payload.date,
                    members: payload.members,
                    items: payload.items,
                });
                
                // 페이지 새로고침하여 최신 데이터 로드
                window.location.reload();
            }
        } catch (error) {
            console.error('정산 수정 실패:', error);
            setToastMessage('정산 수정에 실패했습니다. 다시 시도해주세요.');
            setToastType('error');
            setToastPopUp(true);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
        <AnimatePresence mode="wait">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            >
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative bg-white rounded-t-[32px] sm:rounded-[32px] w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
                >
                    {/* 핸들 바 (모바일) */}
                    <div className="sm:hidden pt-3 pb-2">
                        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto" />
                    </div>

                    {/* 헤더 */}
                    <div className="sticky top-0 bg-white border-b border-gray-100 px-4 sm:px-6 pt-4 sm:pt-6 pb-4 flex items-center justify-between flex-shrink-0 z-10">
                        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 flex-1 min-w-0 pr-2">
                            정산 결과 수정하기
                        </h2>
                        <button
                            onClick={onClose}
                            className="flex-shrink-0 p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50 transition-colors active:scale-95"
                            aria-label="닫기"
                        >
                            <X size={20} />
                        </button>
                    </div>

                {/* 내용 */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5 sm:space-y-6">
                    {/* 모임 이름 */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2.5">
                            모임 이름
                        </label>
                        <input
                            type="text"
                            value={formData.meeting_name}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    meeting_name: e.target.value,
                                }))
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3182F6] focus:border-transparent text-base"
                            placeholder="모임 이름을 입력하세요"
                        />
                    </div>

                    {/* 날짜 */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2.5">
                            날짜
                        </label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    date: e.target.value,
                                }))
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3182F6] focus:border-transparent text-base"
                        />
                    </div>

                    {/* 멤버 */}
                    <div>
                        <div className="flex items-center justify-between mb-2.5">
                            <label className="block text-sm font-semibold text-gray-900">
                                참여자
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsAddMemberModalOpen(true)}
                                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-[#3182F6] md:hover:bg-blue-50 active:bg-blue-50 rounded-xl transition-colors active:scale-95 touch-manipulation min-h-[44px]"
                            >
                                <Plus size={18} />
                                추가
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                            {formData.members.map((member, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-2 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl md:hover:bg-gray-100 transition-colors"
                                >
                                    <span className="text-sm font-medium text-gray-900">
                                        {member}
                                    </span>
                                    <button
                                        onClick={() => handleRemoveMember(index)}
                                        className="p-1.5 -mr-1 text-gray-400 md:hover:text-red-500 active:text-red-500 rounded-lg transition-colors active:scale-95 touch-manipulation min-w-[32px] min-h-[32px] flex items-center justify-center"
                                        aria-label="멤버 삭제"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 항목 */}
                    <div>
                        <div className="flex items-center justify-between mb-2.5">
                            <label className="block text-sm font-semibold text-gray-900">
                                항목
                            </label>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-[#3182F6] md:hover:bg-blue-50 active:bg-blue-50 rounded-xl transition-colors active:scale-95 touch-manipulation min-h-[44px]"
                            >
                                <Plus size={18} />
                                추가
                            </button>
                        </div>
                        <div className="space-y-4">
                            {formData.items.map((item, itemIndex) => (
                                <div
                                    key={itemIndex}
                                    className="group relative bg-white border border-gray-200 rounded-2xl md:hover:border-[#3182F6]/30 md:hover:shadow-md transition-all duration-200 overflow-hidden"
                                >
                                    {/* 카드 헤더 */}
                                    <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                                <input
                                                    type="text"
                                                    value={item.name}
                                                    onChange={(e) =>
                                                        handleItemChange(
                                                            itemIndex,
                                                            'name',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full px-0 py-1.5 border-0 border-b-2 border-transparent focus:border-[#3182F6] focus:outline-none text-base font-semibold text-gray-900 placeholder:text-gray-400 transition-colors bg-transparent"
                                                    placeholder="항목 이름을 입력하세요"
                                                />
                                            </div>
                                            <button
                                                onClick={() =>
                                                    handleRemoveItem(itemIndex)
                                                }
                                                className="flex-shrink-0 p-2 -mt-1 -mr-1 text-gray-400 md:hover:text-red-500 md:hover:bg-red-50 active:text-red-500 active:bg-red-50 rounded-lg transition-all active:scale-95 touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
                                                aria-label="항목 삭제"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* 카드 본문 */}
                                    <div className="px-4 py-4 space-y-4">
                                        {/* 금액 입력 */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                                금액
                                            </label>
                                            <div className="relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                                                    ₩
                                                </div>
                                                <input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={(e) =>
                                                        handleItemChange(
                                                            itemIndex,
                                                            'price',
                                                            parseInt(e.target.value) || ""
                                                        )
                                                    }
                                                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3182F6] focus:border-transparent focus:bg-white text-base font-semibold text-gray-900 transition-all"
                                                    placeholder="0"
                                                />
                                                {item.price > 0 && (
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                                        {item.price.toLocaleString()}원
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* 결제자 선택 */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                                💸 결제자
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={item.payer || ''}
                                                    onChange={(e) =>
                                                        handleItemChange(
                                                            itemIndex,
                                                            'payer',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3182F6] focus:border-transparent focus:bg-white text-sm font-medium text-gray-900 appearance-none cursor-pointer transition-all"
                                                >
                                                    {formData.members.length > 0 ? (
                                                        formData.members.map((member) => (
                                                            <option key={member} value={member}>
                                                                {member}
                                                            </option>
                                                        ))
                                                    ) : (
                                                        <option value="">멤버를 먼저 추가해주세요</option>
                                                    )}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 참여자 선택 */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                                👥 함께 먹은 사람
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {formData.members.map((member) => {
                                                    const isSelected =
                                                        item.attendees.includes(
                                                            member
                                                        );
                                                    return (
                                                        <button
                                                            key={member}
                                                            onClick={() =>
                                                                handleToggleAttendee(
                                                                    itemIndex,
                                                                    member
                                                                )
                                                            }
                                                            className={`relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 ${
                                                                isSelected
                                                                    ? 'bg-[#3182F6] text-white shadow-sm shadow-[#3182F6]/20'
                                                                    : 'bg-gray-50 text-gray-700 md:hover:bg-gray-100 border border-gray-200'
                                                            }`}
                                                        >
                                                            {isSelected && (
                                                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                                                                    <svg className="w-3 h-3 text-[#3182F6]" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                </span>
                                                            )}
                                                            {member}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 푸터 */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 sm:px-6 pt-4 pb-4 sm:pb-6 flex gap-2.5 flex-shrink-0">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="flex-1 px-4 py-3.5 bg-gray-100 text-gray-700 rounded-xl md:hover:bg-gray-200 active:bg-gray-200 transition-colors font-semibold active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px]"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 px-4 py-3.5 bg-[#3182F6] text-white rounded-xl md:hover:bg-[#1E6FFF] active:bg-[#1E6FFF] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-sm touch-manipulation min-h-[44px]"
                    >
                        {isSaving ? '저장 중...' : '저장하고 정산하기'}
                    </button>
                </div>
            </motion.div>

            {/* 참여자 추가 모달 */}
            <AddMemberModal
                isOpen={isAddMemberModalOpen}
                onClose={() => setIsAddMemberModalOpen(false)}
                onAdd={handleAddMember}
                existingMembers={formData.members}
            />
        </motion.div>
        </AnimatePresence>
        {/* 토스트 팝업 */}
        {toastPopUp && (
            <ToastPopUp
                message={toastMessage}
                setToastPopUp={setToastPopUp}
                type={toastType}
            />
        )}

        {/* 항목 추가 모달 */}
        {showAddItemModal && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
                <div
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    onClick={() => setShowAddItemModal(false)}
                />
                <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-[fadeIn_0.2s_ease-out]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">항목 추가</h3>
                        <button
                            onClick={() => setShowAddItemModal(false)}
                            className="p-2.5 rounded-full md:hover:bg-gray-100 active:bg-gray-100 transition-colors active:scale-95 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >
                            <X size={18} className="text-gray-500" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-1">항목 이름</label>
                            <input
                                type="text"
                                value={newItem.name}
                                onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3182F6] focus:border-transparent text-sm"
                                placeholder="예: 삼겹살"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-1">금액</label>
                            <input
                                type="number"
                                min="0"
                                value={newItem.price}
                                onChange={(e) => setNewItem((prev) => ({ ...prev, price: e.target.value }))}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3182F6] focus:border-transparent text-sm"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-1">결제자</label>
                            <select
                                value={newItem.payer}
                                onChange={(e) => setNewItem((prev) => ({ ...prev, payer: e.target.value }))}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3182F6] focus:border-transparent text-sm"
                            >
                                {(formData.members || []).map((m) => (
                                    <option key={m} value={m}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-1">참여자</label>
                            <div className="flex flex-wrap gap-2">
                                {(formData.members || []).map((member) => {
                                    const selected = newItem.attendees.includes(member);
                                    return (
                                        <button
                                            key={member}
                                            onClick={() => handleToggleNewItemAttendee(member)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all active:scale-95 ${
                                                selected
                                                    ? 'bg-[#3182F6] text-white border-[#3182F6]'
                                                    : 'bg-gray-50 text-gray-700 border-gray-200 md:hover:bg-gray-100'
                                            }`}
                                        >
                                            {member}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="mt-2 text-xs text-gray-500">참여자를 한 명 이상 선택해주세요.</p>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <button
                            onClick={() => setShowAddItemModal(false)}
                            className="px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold md:hover:bg-gray-200 active:bg-gray-200 active:scale-95 transition-all touch-manipulation min-h-[44px]"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleConfirmAddItem}
                            className="px-4 py-2.5 rounded-lg bg-[#3182F6] text-white text-sm font-semibold md:hover:bg-[#1E6FFF] active:bg-[#1E6FFF] active:scale-95 transition-all touch-manipulation min-h-[44px]"
                        >
                            추가
                        </button>
                    </div>
                </div>
            </div>
        )}
    </>
    );
};

export default DraftEditModal;

