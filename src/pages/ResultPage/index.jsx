import { useLocation } from 'react-router-dom';
import { getBillingResultPage } from '../../api/api';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Copy,
    CheckCircle2,
    Users,
    Receipt,
    Sparkles,
    ArrowRight,
} from 'lucide-react';
import ToastPopUp from '@/components/common/ToastPopUp';
import { ImageGallery } from '@/components/Modal/ImageModal';
import {
    PaymentSkeleton,
    BillingSkeleton,
} from '../../components/result/Skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import Lottie from 'lottie-react';
import animationTime from '../../assets/animations/time.json';
import animationMoney from '../../assets/animations/money.json';
import { sendEventToAmplitude } from '@/utils/amplitude';
import UserPromptBubble from '@/components/common/UserPromptBubble';

const SkeletonCount = 3;

function SharePage() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const meeting = searchParams.get('meeting');
    const navigate = useNavigate();
    const [apiRequestFailed, setApiRequestFailed] = useState(false);
    const [billingRequestFailed, setBillingRequestFailed] = useState(false);
    const [openToast, setOpenToast] = useState(false);
    const [members, setMembers] = useState([]);
    const [payments, setPayments] = useState([]);
    const [meetings, setMeetings] = useState([]);
    const [roundUpByMember, setRoundUpByMember] = useState({});
    const [copiedAccount, setCopiedAccount] = useState(false);
    const [loading, setLoading] = useState(true);
    const [countdown, setCountdown] = useState(3);

    const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent,
        );

    const isApple = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    useEffect(() => {
        const handleGetData = async (retryCount = 0) => {
            try {
                const responseGetData = await getBillingResultPage(meeting);
                if (responseGetData.status === 200) {
                    setMembers(responseGetData.data.members);
                    setPayments(responseGetData.data.payments);
                    setMeetings(responseGetData.data.meeting);
                    sendEventToAmplitude('view result page', '');
                } else if (responseGetData.status === 204) {
                    setBillingRequestFailed(true);
                }
            } catch (error) {
                if (
                    members.length === 0 &&
                    payments.length === 0 &&
                    retryCount < 3
                ) {
                    setTimeout(() => handleGetData(retryCount + 1), 1000);
                }

                if (error.response && error.response.status === 404) {
                    setApiRequestFailed(true);
                }
            }
            setLoading(false);
        };

        handleGetData();
    }, [meeting]);

    useEffect(() => {
        if (apiRequestFailed) {
            setCountdown(3);
            const countdownInterval = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(countdownInterval);
                        navigate('/');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            const navigateTimer = setTimeout(() => {
                clearInterval(countdownInterval);
                navigate('/');
            }, 3000);

            return () => {
                clearInterval(countdownInterval);
                clearTimeout(navigateTimer);
            };
        }
    }, [apiRequestFailed, navigate]);

    const handleCopyAccount = async (account) => {
        await navigator.clipboard.writeText(account);
        setCopiedAccount(true);
        setOpenToast(true);
        setTimeout(() => setCopiedAccount(false), 2000);
    };

    const toggleRoundUp = (memberId) => {
        setRoundUpByMember((prev) => ({
            ...prev,
            [memberId]: !prev[memberId],
        }));
        setMembers((prevMembers) =>
            prevMembers.map((member) =>
                member.id === memberId
                    ? { ...member, tip_check: !member.tip_check }
                    : member,
            ),
        );
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('ko-KR').format(Math.abs(amount));
    };

    const roundUpAmount = (amount) => {
        return Math.ceil(amount / 10) * 10;
    };

    const getDisplayAmount = (amount, memberId) => {
        // 멤버가 보내야 할 돈(amount >= 0)일 때만 올림 적용
        if (amount >= 0 && roundUpByMember[memberId]) {
            return roundUpAmount(amount);
        }
        return Math.abs(amount);
    };

    const getRecipientsForLeader = () => {
        const leader = members.find((m) => m.leader);
        if (!leader) return [];

        // 총무가 받아야 할 돈(amount < 0)일 때: 총무에게 돈을 보내야 하는 멤버들 (amount < 0인 멤버들)
        if (leader.amount < 0) {
            return members
                .filter((m) => !m.leader && m.amount < 0)
                .map((m) => ({
                    name: m.name,
                    amount: Math.abs(m.amount),
                }));
        }

        // 총무가 보내야 할 돈(amount > 0)일 때: 총무가 멤버들에게 보내야 할 돈
        if (leader.amount > 0) {
            return members
                .filter((m) => !m.leader && m.amount < 0)
                .map((m) => ({
                    name: m.name,
                    amount: Math.abs(m.amount),
                }));
        }

        return [];
    };

    const getFirstImage = () => {
        if (meetings?.images && meetings.images.length > 0) {
            const s3BucketUrl =
                import.meta.env.VITE_S3_BUCKET_URL ||
                'https://nbbang-receipt-images.s3.ap-northeast-2.amazonaws.com';
            return `${s3BucketUrl}/${meetings.images[0]}`;
        }
        return 'https://images.unsplash.com/photo-1543248939-4296e1fea89b?w=800';
    };

    if (apiRequestFailed) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm text-center"
                >
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lottie
                            animationData={animationTime}
                            loop={true}
                            autoplay={true}
                            className="w-10 h-10"
                        />
                    </div>
                    <h3 className="text-xl text-slate-900 mb-2">
                        삭제된 정산내역입니다
                    </h3>
                    <p className="text-slate-600 mb-6">
                        해당 정산내역이 삭제되었거나
                        <br />
                        존재하지 않습니다
                    </p>
                    <p className="text-sm text-blue-600 mb-4">
                        {countdown}초 후 메인 페이지로 이동합니다
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/30"
                    >
                        홈으로 돌아가기
                    </button>
                </motion.div>
            </div>
        );
    }

    if (billingRequestFailed) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm text-center"
                >
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lottie
                            animationData={animationMoney}
                            loop={true}
                            autoplay={true}
                            className="w-10 h-10"
                        />
                    </div>
                    <h3 className="text-xl text-slate-900 mb-2">
                        정산 내역이 없습니다
                    </h3>
                    <p className="text-slate-600 mb-6">
                        아직 정산내역이 추가되지 않았어요
                        <br />
                        새로운 정산을 시작해보세요!
                    </p>
                    <Link
                        to="/signd"
                        className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/30"
                    >
                        정산 시작하기
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
            <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 pb-20 md:pb-12">
                {/* Header Section */}
                {loading ? (
                    <div className="flex justify-center mb-6">
                        <Skeleton className="w-[500px] h-[300px] bg-gray-100 rounded-3xl" />
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl shadow-lg shadow-blue-100/50 overflow-hidden mb-6"
                    >
                        <div className="relative h-48 md:h-56 overflow-hidden">
                            <div className=" w-full h-[300px] flex items-center justify-center bg-[#1740e8]">
                                <img
                                    src="/images/result_top_img.png"
                                    alt="Meeting"
                                    className="absolute top-0 left-1/2 -translate-x-1/2 scale-75 w-[300px] h-[200px]"
                                />
                            </div>

                            {/* 텍스트 배경 디자인 개선 : 블러+그라데이션+라운드+투명도 */}
                            <div className="absolute bottom-0 left-0 right-0 px-0 pb-0">
                                <div
                                    className="rounded-xl shadow-lg mx-1 mb-1"
                                    style={{
                                        background:
                                            'linear-gradient(90deg, rgba(16,44,93,0.04) 45%, rgba(41,85,180,0.03) 100%)',
                                        backdropFilter: 'blur(0.5px)',
                                        WebkitBackdropFilter: 'blur(0.5px)',
                                        boxShadow:
                                            '0 8px 32px 0 rgba(16,44,93,0.03)',
                                    }}
                                >
                                    <div className="px-5 py-1.5 text-white font-bold">
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="flex items-center gap-2"
                                        >
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                                            <span className="text-sm tracking-wide">
                                                {meetings?.date?.replace(
                                                    /(\d{4})-(\d{2})-(\d{2})/,
                                                    '$1년 $2월 $3일',
                                                ) || ''}
                                            </span>
                                        </motion.div>
                                        <h1 className="mt-0.5 text-lg md:text-xl text-left flex items-center gap-3 font-bold drop-shadow-sm">
                                            {meetings?.name ||
                                                '모임명을 설정해주세요'}
                                            의 정산결과
                                            <Sparkles className="w-6 h-6 text-yellow-400" />
                                        </h1>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {meetings?.images && meetings.images.length > 0 && (
                    <div className="p-4">
                        <ImageGallery images={meetings.images} />
                    </div>
                )}

                {/* 사용자 요청사항 말풍선 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="mb-6"
                >
                    <UserPromptBubble userPrompt={meetings?.userPrompt || meetings?.prompt} />
                </motion.div>

                {/* Billing Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6"
                >
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <Users className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg text-slate-800">멤버별 정산</h2>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: SkeletonCount }).map(
                                (_, index) => (
                                    <BillingSkeleton key={index} />
                                ),
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* 총무 카드 */}
                            {(() => {
                                const leader = members.find((m) => m.leader);
                                if (!leader) return null;

                                return (
                                    <motion.div
                                        key={leader.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="bg-white rounded-xl shadow-sm border border-slate-200/60 hover:shadow-md hover:border-slate-300/60 transition-all duration-300 overflow-hidden"
                                    >
                                        <div className="p-5">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30">
                                                        {leader.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-slate-900 font-semibold">
                                                                {leader.name}
                                                            </span>
                                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
                                                                총무
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p
                                                        className={`text-lg font-bold ${
                                                            leader.amount > 0
                                                                ? 'text-red-600'
                                                                : leader.amount <
                                                                    0
                                                                  ? 'text-blue-600'
                                                                  : 'text-slate-600'
                                                        }`}
                                                    >
                                                        {leader.amount < 0 &&
                                                            '+'}
                                                        {formatAmount(
                                                            Math.abs(
                                                                leader.amount,
                                                            ),
                                                        )}
                                                        원
                                                    </p>
                                                    {leader.amount !== 0 && (
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            {leader.amount > 0
                                                                ? '보낼 금액'
                                                                : '받을 금액'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 총무가 받아야 할 돈일 때: 총무에게 돈을 보내야 하는 멤버들 표시 */}
                                            {leader.amount < 0 &&
                                                getRecipientsForLeader()
                                                    .length > 0 && (
                                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                                        <div className="space-y-2">
                                                            {getRecipientsForLeader().map(
                                                                (
                                                                    recipient,
                                                                    i,
                                                                ) => (
                                                                    <p
                                                                        key={i}
                                                                        className="text-sm text-slate-700 text-left"
                                                                    >
                                                                        <span className="font-medium text-blue-600">
                                                                            {
                                                                                recipient.name
                                                                            }
                                                                        </span>
                                                                        님한테{' '}
                                                                        <span className="font-semibold text-blue-600">
                                                                            {formatAmount(
                                                                                recipient.amount,
                                                                            )}
                                                                        </span>
                                                                        원을
                                                                        보내주세요
                                                                    </p>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                            {/* 총무가 보내야 할 돈일 때: 총무가 멤버들에게 보내야 할 돈 표시 */}
                                            {leader.amount > 0 &&
                                                getRecipientsForLeader()
                                                    .length > 0 && (
                                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                                        <div className="space-y-2">
                                                            {getRecipientsForLeader().map(
                                                                (
                                                                    recipient,
                                                                    i,
                                                                ) => (
                                                                    <p
                                                                        key={i}
                                                                        className="text-sm text-slate-700 text-left"
                                                                    >
                                                                        <span className="font-medium text-blue-600">
                                                                            {
                                                                                recipient.name
                                                                            }
                                                                        </span>
                                                                        님에게{' '}
                                                                        <span className="font-semibold text-blue-600">
                                                                            {formatAmount(
                                                                                recipient.amount,
                                                                            )}
                                                                        </span>
                                                                        원을
                                                                        보내주세요
                                                                    </p>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                        </div>
                                    </motion.div>
                                );
                            })()}

                            {/* 멤버 카드들 */}
                            {members
                                .filter((member) => !member.leader)
                                .map((member, index) => {
                                    const isLeader = member.leader;
                                    // 멤버가 총무에게 보내야 할 돈일 때만 올림/송금 표시
                                    const showRoundUp =
                                        !isLeader && member.amount >= 0;
                                    const showRemittance =
                                        !isLeader && member.amount >= 0;
                                    const displayAmount = getDisplayAmount(
                                        member.amount,
                                        member.id,
                                    );

                                    return (
                                        <motion.div
                                            key={member.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{
                                                delay: 0.1 + index * 0.05,
                                            }}
                                            className="bg-white rounded-xl shadow-sm border border-slate-200/60 hover:shadow-md hover:border-slate-300/60 transition-all duration-300 overflow-hidden"
                                        >
                                            <div className="p-5">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                                                isLeader
                                                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                                                                    : 'bg-slate-100 text-slate-700'
                                                            }`}
                                                        >
                                                            {member.name.charAt(
                                                                0,
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-slate-900 font-semibold">
                                                                    {
                                                                        member.name
                                                                    }
                                                                </span>
                                                                {isLeader && (
                                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
                                                                        총무
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {isLeader &&
                                                                member.deposit_copy_text && (
                                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                                        {
                                                                            member.deposit_copy_text
                                                                        }
                                                                    </p>
                                                                )}
                                                        </div>
                                                    </div>

                                                    <div className="text-right">
                                                        <p
                                                            className={`text-lg font-bold ${
                                                                isLeader
                                                                    ? member.amount >
                                                                      0
                                                                        ? 'text-red-600'
                                                                        : member.amount <
                                                                            0
                                                                          ? 'text-blue-600'
                                                                          : 'text-slate-600'
                                                                    : member.amount >=
                                                                        0
                                                                      ? 'text-red-600'
                                                                      : 'text-blue-600'
                                                            }`}
                                                        >
                                                            {((isLeader &&
                                                                member.amount <
                                                                    0) ||
                                                                (!isLeader &&
                                                                    member.amount <
                                                                        0)) &&
                                                                '+'}
                                                            {formatAmount(
                                                                displayAmount,
                                                            )}
                                                            원
                                                        </p>
                                                        {member.amount !==
                                                            0 && (
                                                            <p className="text-xs text-slate-400 mt-0.5">
                                                                {isLeader
                                                                    ? member.amount >
                                                                      0
                                                                        ? '보낼 금액'
                                                                        : '받을 금액'
                                                                    : member.amount >=
                                                                        0
                                                                      ? '보낼 금액'
                                                                      : '받을 금액'}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Round Up Toggle */}
                                                {showRoundUp && (
                                                    <div className="mt-4">
                                                        <label className="flex items-center justify-between cursor-pointer group">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                                                                    <span className="text-sm">
                                                                        💰
                                                                    </span>
                                                                </div>
                                                                <div className="text-left">
                                                                    <p className="text-sm text-slate-700">
                                                                        십원
                                                                        단위
                                                                        올림
                                                                    </p>
                                                                    {roundUpByMember[
                                                                        member
                                                                            .id
                                                                    ] && (
                                                                        <p className="text-xs text-amber-600">
                                                                            {formatAmount(
                                                                                member.amount,
                                                                            )}
                                                                            원 →{' '}
                                                                            {formatAmount(
                                                                                roundUpAmount(
                                                                                    member.amount,
                                                                                ),
                                                                            )}
                                                                            원
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() =>
                                                                    toggleRoundUp(
                                                                        member.id,
                                                                    )
                                                                }
                                                                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                                                                    roundUpByMember[
                                                                        member
                                                                            .id
                                                                    ]
                                                                        ? 'bg-amber-500'
                                                                        : 'bg-slate-200'
                                                                }`}
                                                            >
                                                                <motion.div
                                                                    animate={{
                                                                        x: roundUpByMember[
                                                                            member
                                                                                .id
                                                                        ]
                                                                            ? 24
                                                                            : 2,
                                                                    }}
                                                                    transition={{
                                                                        type: 'spring',
                                                                        stiffness: 500,
                                                                        damping: 30,
                                                                    }}
                                                                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                                                                />
                                                            </button>
                                                        </label>
                                                    </div>
                                                )}

                                                {/* Mobile Remittance Buttons */}
                                                {showRemittance && isMobile && (
                                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                                        <p className="text-xs text-slate-600 mb-2 flex items-center gap-1">
                                                            <span className="w-1 h-1 bg-red-500 rounded-full" />
                                                            바로 송금하기
                                                        </p>
                                                        <div className="flex gap-2">
                                                            {member.tip_check
                                                                ? member.tipped_kakao_deposit_link && (
                                                                      <motion.a
                                                                          href={
                                                                              member.tipped_kakao_deposit_link
                                                                          }
                                                                          whileTap={{
                                                                              scale: 0.95,
                                                                          }}
                                                                          className="flex-1 flex items-center justify-center gap-2 bg-[#FEE500] hover:bg-[#FEE500]/90 text-slate-900 px-4 py-3 rounded-xl transition-all shadow-sm hover:shadow-md"
                                                                      >
                                                                          <img
                                                                              src="/images/kakao 2.png"
                                                                              alt="kakao"
                                                                              className="w-5 h-5  flex items-center justify-center text-[#FEE500] text-xs font-bold"
                                                                          />

                                                                          <span className="text-sm font-semibold">
                                                                              카카오송금
                                                                          </span>
                                                                      </motion.a>
                                                                  )
                                                                : member.kakao_deposit_link && (
                                                                      <motion.a
                                                                          href={
                                                                              member.kakao_deposit_link
                                                                          }
                                                                          whileTap={{
                                                                              scale: 0.95,
                                                                          }}
                                                                          className="flex-1 flex items-center justify-center gap-2 bg-[#FEE500] hover:bg-[#FEE500]/90 text-slate-900 px-4 py-3 rounded-xl transition-all shadow-sm hover:shadow-md"
                                                                      >
                                                                          <img
                                                                              className="w-5 h-5  flex items-center justify-center text-[#FEE500] text-xs font-bold"
                                                                              src="/images/kakao 2.png"
                                                                              alt="kakao"
                                                                          />
                                                                          <span className="text-sm font-semibold">
                                                                              카카오송금
                                                                          </span>
                                                                      </motion.a>
                                                                  )}

                                                            {member.tip_check
                                                                ? member.tipped_toss_deposit_link && (
                                                                      <motion.a
                                                                          href={
                                                                              member.tipped_toss_deposit_link
                                                                          }
                                                                          whileTap={{
                                                                              scale: 0.95,
                                                                          }}
                                                                          className="flex-1 flex items-center justify-center gap-2 bg-[#0050FF] hover:bg-[#0050FF]/90 text-white px-4 py-3 rounded-xl transition-all shadow-sm hover:shadow-md"
                                                                      >
                                                                          <img
                                                                              className="w-5 h-5  flex items-center justify-center text-[#0050FF] text-xs font-bold"
                                                                              src="/images/result_toss.png"
                                                                              alt="toss"
                                                                          />
                                                                          <span className="text-sm font-semibold">
                                                                              토스송금
                                                                          </span>
                                                                      </motion.a>
                                                                  )
                                                                : member.toss_deposit_link && (
                                                                      <motion.a
                                                                          href={
                                                                              member.toss_deposit_link
                                                                          }
                                                                          whileTap={{
                                                                              scale: 0.95,
                                                                          }}
                                                                          className="flex-1 flex items-center justify-center gap-2 bg-[#0050FF] hover:bg-[#0050FF]/90 text-white px-4 py-3 rounded-xl transition-all shadow-sm hover:shadow-md"
                                                                      >
                                                                          <img
                                                                              className="w-5 h-5  flex items-center justify-center text-[#0050FF] text-xs font-bold"
                                                                              src="/images/result_toss.png"
                                                                              alt="toss"
                                                                          />
                                                                          <span className="text-sm font-semibold">
                                                                              토스송금
                                                                          </span>
                                                                      </motion.a>
                                                                  )}

                                                            {member.deposit_copy_text && (
                                                                <motion.button
                                                                    whileTap={{
                                                                        scale: 0.95,
                                                                    }}
                                                                    onClick={() =>
                                                                        handleCopyAccount(
                                                                            member.deposit_copy_text,
                                                                        )
                                                                    }
                                                                    className="flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-xl transition-all shadow-sm"
                                                                >
                                                                    {copiedAccount ? (
                                                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                                                    ) : (
                                                                        <Copy className="w-5 h-5" />
                                                                    )}
                                                                </motion.button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                        </div>
                    )}
                </motion.div>

                {/* Payment History */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex items-center justify-between mb-4 px-1">
                        <div className="flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg text-slate-800">
                                결제 내역
                            </h2>
                        </div>
                        <span className="text-sm text-slate-500">
                            {payments.length}건
                        </span>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: SkeletonCount }).map(
                                (_, index) => (
                                    <PaymentSkeleton key={index} />
                                ),
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {payments.map((payment, index) => (
                                <motion.div
                                    key={payment.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        delay: 0.2 + index * 0.05,
                                    }}
                                    className="bg-white rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-lg hover:border-slate-300/60 transition-all duration-300 overflow-hidden"
                                >
                                    <div className="w-full p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h3 className="text-lg text-left font-medium text-slate-900 mb-2 leading-tight">
                                                    {payment.place}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                                        결제자
                                                    </span>
                                                    <span className="text-sm font-semibold text-slate-700">
                                                        {payment.pay_member}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-end justify-between">
                                            <div className="text-left">
                                                <p className="text-xs text-slate-500 mb-1">
                                                    총 결제 금액
                                                </p>
                                                <p className="text-xl font-semibold text-slate-900">
                                                    {formatAmount(
                                                        payment.price,
                                                    )}
                                                    <span className="text-lg font-semibold">
                                                        원
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-500 mb-1">
                                                    1인당
                                                </p>
                                                <p className="text-lg font-bold text-blue-600">
                                                    {formatAmount(
                                                        payment.split_price,
                                                    )}
                                                    <span className="text-base font-semibold">
                                                        원
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <motion.div
                                        initial={{
                                            height: 0,
                                            opacity: 0,
                                        }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        transition={{ duration: 0.2 }}
                                        className="border-t border-slate-200 bg-gradient-to-br from-blue-50/40 via-slate-50/30 to-transparent"
                                    >
                                        <div className="p-5 pt-4">
                                            <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">
                                                참여 멤버
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {(
                                                    payment.attend_member || []
                                                ).map((member, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-3 py-1.5 bg-white border border-blue-200 text-blue-700 text-sm font-medium rounded-lg shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
                                                    >
                                                        {member}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* CTA Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-6 mb-12 text-center"
                >
                    <motion.a
                        href="/"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            sendEventToAmplitude('click start new nbbang', '');
                        }}
                        className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-8 py-4 rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all"
                    >
                        <Sparkles className="w-5 h-5" />
                        <span>새로운 N빵 시작하기</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.a>

                    <p className="mt-4 text-sm text-slate-500">
                        친구들과 함께하는 쉬운 정산, N빵
                    </p>
                </motion.div>
            </div>

            {openToast && (
                <ToastPopUp
                    setToastPopUp={setOpenToast}
                    message={'클립보드에 복사되었어요.'}
                />
            )}
        </div>
    );
}

export default SharePage;
