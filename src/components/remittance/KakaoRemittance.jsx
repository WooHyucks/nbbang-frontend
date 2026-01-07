import React, { useState } from 'react';
import BillingKakaoModal from '../Modal/BillingKakaoModal';
import { sendEventToAmplitude } from '@/utils/amplitude';

const KakaoRemittance = ({
    meetingName,
    kakaoModalOpen,
    setKakaoModalOpen,
}) => {
    const handleClick = () => {
        sendEventToAmplitude('click kakao deposit id register', '');
        setKakaoModalOpen(true);
    };

    return (
        <div
            className="mt-7.5 relative w-[180px] h-[63px] bg-[#ffeb3c] border border-[papayawhip] rounded-[10px]"
            onClick={handleClick}
        >
            <img
                className="absolute w-[25px] top-[8px] left-[20px]"
                alt="kakao"
                src="/images/kakao.png"
            />
            <button className="pl-2 text-xs w-[170px] h-[37px] bg-[#ffeb3c] border border-[#ffeb3c] text-black rounded-[10px] font-semibold cursor-pointer">
                카카오 입금 아이디
            </button>
            {meetingName &&
            meetingName.kakao_deposit_information &&
            meetingName.kakao_deposit_information.kakao_deposit_id !== null ? (
                <p className="m-0 text-xs">
                    {meetingName.kakao_deposit_information.kakao_deposit_id}
                </p>
            ) : (
                <p className="font-bold text-xs">등록하기</p>
            )}
            {kakaoModalOpen && (
                <BillingKakaoModal
                    meetingName={meetingName}
                    setKakaoModalOpen={setKakaoModalOpen}
                />
            )}
        </div>
    );
};

export default KakaoRemittance;
