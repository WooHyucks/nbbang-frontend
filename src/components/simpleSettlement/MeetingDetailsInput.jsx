import React, { useState } from 'react';
import BillingInputBox from '../common/BillingInputBox';
import Calculator from '../common/Calculator';
import Bubble from '../common/Bubble';
import ImageUploader from '../common/image/ImageUploader';

const MeetingDetailsInput = ({
    meetingData,
    setMeetingData,
    openModal,
    setOpenModal,
    meetingId,
}) => {
    return (
        <section className="p-6 text-left flex flex-col mt-5 relative">
            <div>
                <h3 className="text-lg font-bold mb-4">
                    모임명을 입력해주세요!
                </h3>
                <BillingInputBox
                    value={meetingData.name}
                    onChange={(e) =>
                        setMeetingData({ ...meetingData, name: e.target.value })
                    }
                />
            </div>
            <div className="mt-20 mb-10">
                <div className="flex gap-3 items-center mb-4 relative">
                    <h3 className="text-lg font-bold">
                        모임에서 사용한 금액은 얼마인가요?
                    </h3>
                    <div className="relative">
                        <Bubble
                            className="absolute top-[-55px] right-0"
                            text="계산기를 사용하면 더욱 편리해요! 👨🏻‍🔬"
                        />
                        <img
                            src="/images/calculator.png"
                            alt="calculator"
                            className="w-7"
                            onClick={() => setOpenModal(true)}
                        />
                    </div>
                </div>
                <BillingInputBox
                    value={meetingData.simple_price}
                    type="number"
                    onChange={(e) =>
                        setMeetingData({
                            ...meetingData,
                            simple_price: e.target.value,
                        })
                    }
                />
            </div>
            {openModal && (
                <Calculator
                    setOpenModal={setOpenModal}
                    setMeetingData={setMeetingData}
                />
            )}
            <ImageUploader meetingId={meetingId} meetingType={true} />
        </section>
    );
};

export default MeetingDetailsInput;
