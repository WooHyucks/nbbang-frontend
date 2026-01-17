import React from 'react';

const SimpleSettlementResult = ({ meetingData }) => {
    const price =
        meetingData?.simple_member_amount == null
            ? 0
            : meetingData?.simple_member_amount;
    const formattedAmount = new Intl.NumberFormat('ko-KR').format(price);

    return (
        <section>
            <div className="px-6">
                <div className="mt-10 flex flex-col justify-center items-start text-left gap-2 border-b border-gray-200 pl-5 py-5">
                    <span className="font-medium text-base">
                        인 당 : {formattedAmount ? formattedAmount : 0}원
                    </span>
                    <span className="font-medium text-gray-500">
                        총무님 한테 {formattedAmount ? formattedAmount : 0}원을
                        보내주세요
                    </span>
                </div>
            </div>
        </section>
    );
};

export default SimpleSettlementResult;
