import React from 'react';
import BillingTossModal from '../modal/BillingTossModal';
import { sendEventToAmplitude } from '@/utils/amplitude';

// 계좌번호 마스킹 함수 (앞 5자리 + 나머지 별표)
const maskAccountNumber = (accountNumber) => {
    if (!accountNumber) return '';
    // 서버에서 보낸 앞 5자리
    const visiblePart = accountNumber.substring(0, 5);
    // 일반적인 계좌번호 길이(10-14자리)를 기준으로 나머지 별표 생성
    // 실제 계좌번호 길이를 알 수 없으므로, 10자리 기준으로 마스킹
    const maskedLength = 10 - visiblePart.length;
    const maskedPart = '*'.repeat(Math.max(0, maskedLength));
    return visiblePart + maskedPart;
};

const TossRemittance = ({ meetingName, tossModalOpen, setTossModalOpen }) => {
    const handleClick = () => {
        sendEventToAmplitude('click toss deposit id register', '');
        setTossModalOpen(true);
    };

    return (
        <div
            onClick={handleClick}
            className="bg-[#1849fd] border border-[#1849fd] relative w-[180px] h-[63px] rounded-[10px]"
        >
            <img
                className="absolute w-[45px] top-[8px] left-[20px]"
                alt="toss"
                src="/images/Toss.png"
            />
            <button className="pl-7 text-xs w-[170px] h-[37px] bg-[#1849fd] border border-[#1849fd] text-white rounded-[10px] font-semibold cursor-pointer">
                토스 입금 계좌
            </button>
            {meetingName &&
            meetingName.toss_deposit_information &&
            meetingName.toss_deposit_information.bank !== '' ? (
                <div className="flex gap-1 justify-center items-center">
                    <p className="text-xs text-white font-bold">
                        {meetingName.toss_deposit_information.bank}
                    </p>
                    <p className="text-xs text-white">
                        {maskAccountNumber(
                            meetingName.toss_deposit_information.account_number,
                        )}
                    </p>
                </div>
            ) : (
                <p className="font-bold text-xs text-white">등록하기</p>
            )}
            {tossModalOpen && (
                <BillingTossModal
                    setTossModalOpen={setTossModalOpen}
                    meetingName={meetingName}
                />
            )}
        </div>
    );
};

export default TossRemittance;
