import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getBillingResultPage } from '@/api/api';
import LoadingSpinner from '@/components/common/LodingSpinner';
import SlideCheckbox from '@/components/common/SlideCheckBox';
import ToastPopUp from '@/components/common/ToastPopUp';
import { ImageGallery } from '@/components/Modal/ImageModal';
import { sendEventToAmplitude } from '@/utils/amplitude';

const SettlementDetail = ({ label, value, unit }) => (
    <div className="flex items-center justify-between">
        <p className="text-gray-400 font-bold">{label}</p>
        <div className="flex items-center justify-center gap-2">
            <p className="text-gray-500 font-bold">
                {value} {unit}
            </p>
            <img className="w-3" src="/images/right_arrow.png" alt="arrow" />
        </div>
    </div>
);

const SimpleSettlementResultPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const [openToast, setOpenToast] = useState(false);
    const meeting = searchParams.get('simple-meeting');
    const [meetingResultData, setMeetingResultData] = useState(null);
    const [tipCheck, setTipCheck] = useState(false);
    const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent,
        );
    const isApple = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    const handleGetData = async () => {
        try {
            const responseGetData = await getBillingResultPage(meeting);
            setMeetingResultData(responseGetData.data.meeting);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        handleGetData();
        sendEventToAmplitude('view simple settlement result', {
            meeting_id: meeting,
        });
    }, []);

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('ko-KR').format(amount);
    };

    if (!meetingResultData) {
        return <LoadingSpinner />;
    }

    const {
        simple_price,
        simple_member_count,
        simple_member_amount,
        toss_deposit_link,
        tipped_toss_deposit_link,
        simple_tipped_member_amount,
        tipped_deposit_copy_text,
        deposit_copy_text,
        kakao_deposit_link,
        tipped_kakao_deposit_link,
    } = meetingResultData;

    if (
        simple_price === null ||
        simple_member_count === null ||
        simple_member_amount === null
    ) {
        return (
            <div className="text-center text-gray-500">
                정산 금액이 없습니다.
            </div>
        );
    }

    const DepositInformationCopy = async (deposit_copy_text) => {
        console.log(deposit_copy_text);
        await navigator.clipboard.writeText(deposit_copy_text);
        if (isApple) {
            setOpenToast(true);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white max-w-[450px] mx-auto text-center">
            <div className="relative flex flex-col items-center h-screen">
                <img
                    onClick={() => navigate('/')}
                    src="/images/beck.png"
                    alt="뒤로가기"
                    className="w-5 z-10 absolute left-0 m-5"
                />
                <div className="h-full flex items-center">
                    <ul className="font-bold text-gray-700">
                        <li className="text-2xl">
                            <strong className="text-sky-500">총무</strong>님에게
                        </li>
                        <li className="text-2xl">
                            {formatAmount(
                                tipCheck
                                    ? simple_tipped_member_amount
                                    : simple_member_amount,
                            )}
                            원을
                        </li>
                        <li className="text-2xl pb-5">보내주세요</li>
                        {meetingResultData.images ? (
                            <ImageGallery images={meetingResultData.images} />
                        ) : (
                            ''
                        )}
                    </ul>
                </div>
                <div className="w-full px-10">
                    <div className="flex flex-col gap-4 mb-10">
                        <SettlementDetail
                            label="총 사용 금액"
                            value={formatAmount(simple_price)}
                            unit="원"
                        />
                        <SettlementDetail
                            label="총 인원"
                            value={simple_member_count}
                            unit="명"
                        />
                        <SettlementDetail
                            label="정산 금액"
                            value={
                                tipCheck
                                    ? formatAmount(simple_tipped_member_amount)
                                    : formatAmount(simple_member_amount)
                            }
                            unit="원"
                        />
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-gray-400 font-bold">
                                십원단위 올림해서 보내기
                            </span>
                            <SlideCheckbox
                                type="checkbox"
                                checked={tipCheck}
                                onChange={() => {
                                    const newValue = !tipCheck;
                                    setTipCheck(newValue);
                                    sendEventToAmplitude(
                                        'toggle simple settlement tipped mode',
                                        {
                                            meeting_id: meeting,
                                            is_tipped: newValue,
                                        },
                                    );
                                }}
                            />
                        </div>
                        {deposit_copy_text && (
                            <div
                                className="flex items-center justify-between gap-2 py-1"
                                onClick={() => {
                                    DepositInformationCopy(
                                        tipCheck
                                            ? tipped_deposit_copy_text
                                            : deposit_copy_text,
                                    );
                                    sendEventToAmplitude(
                                        'copy simple settlement account info',
                                        {
                                            meeting_id: meeting,
                                            is_tipped: tipCheck,
                                        },
                                    );
                                }}
                            >
                                <span className="text-gray-400 font-bold">
                                    계좌&금액 복사하기
                                </span>
                                <img
                                    className="w-5"
                                    src="/images/copy.png"
                                    alt="copy"
                                />
                            </div>
                        )}
                    </div>
                    {isMobile && (
                        <div className="flex justify-center items-center gap-4 my-10">
                            {simple_member_amount > 0 && kakao_deposit_link && (
                                <a
                                    href={
                                        tipCheck
                                            ? tipped_kakao_deposit_link
                                            : kakao_deposit_link
                                    }
                                    onClick={() => {
                                        sendEventToAmplitude(
                                            'click simple settlement kakao deposit link',
                                            {
                                                meeting_id: meeting,
                                                is_tipped: tipCheck,
                                            },
                                        );
                                    }}
                                    className="w-full flex items-center justify-center gap-2 bg-[#fee502] rounded-2xl pl-5 pr-8 py-4"
                                >
                                    <img
                                        className="w-8"
                                        alt="kakao"
                                        src="/images/kakao 2.png"
                                    />
                                    <span className="whitespace-nowrap font-bold text-sm">
                                        카카오 송금
                                    </span>
                                </a>
                            )}
                            {simple_member_amount > 0 && toss_deposit_link && (
                                <a
                                    href={
                                        tipCheck
                                            ? tipped_toss_deposit_link
                                            : toss_deposit_link
                                    }
                                    onClick={() => {
                                        sendEventToAmplitude(
                                            'click simple settlement toss deposit link',
                                            {
                                                meeting_id: meeting,
                                                is_tipped: tipCheck,
                                            },
                                        );
                                    }}
                                    className="w-full flex items-center justify-center gap-2 bg-[#0050ff] rounded-2xl pl-5 pr-8 py-4"
                                >
                                    <img
                                        className="w-8"
                                        alt="Toss"
                                        src="/images/result_toss.png"
                                    />
                                    <span className="text-white font-bold whitespace-nowrap text-sm">
                                        토스 송금
                                    </span>
                                </a>
                            )}
                        </div>
                    )}
                    {openToast && (
                        <ToastPopUp
                            setToastPopUp={setOpenToast}
                            message={'클립보드에 복사되었어요.'}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SimpleSettlementResultPage;
