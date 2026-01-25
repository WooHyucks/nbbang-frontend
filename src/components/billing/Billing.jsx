import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { GetMeetingNameData, getMemberData } from '../../api/api';
import Lottie from 'lottie-react';
import animationData from '../../assets/animations/check.json';
import BillingKakaoModal from '../Modal/BillingKakaoModal';
import BillingTossModal from '../Modal/BillingTossModal';
import QRCodeModal from '../Modal/QRCodeModal';
import { MessageCircle, Copy, QrCode } from 'lucide-react';
import { sendEventToAmplitude } from '@/utils/amplitude';
import ToastPopUp from '../common/ToastPopUp';

const ResultContainar = styled.div.withConfig({
    shouldForwardProp: (prop) => prop !== 'paymentState',
})`
    display: ${(props) => (props.paymentState ? 'flex' : 'none')};
    margin-top: 24px;
    padding: 0 20px;
    flex-direction: column;
    height: 100%;
    position: relative;
    max-width: 680px;

`;
const BillingContainer = styled.div`
    width: 100%;
`;

const Member = styled.p`
    font-size: 16px;
    margin: 0;
    color: black;
    font-weight: 600;
`;

const Amount = styled.p`
    color: #272626ab;
    font-size: 14px;
    margin: 8px 0 0 0;
    font-weight: 500;
    position: relative;
`;

const LeaderBillingContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
`;

const LeaderAmount = styled(Amount)`
    color: #272626ab;
    font-weight: 500;
    font-size: 14px;
    margin-top: 12px;
`;

const BillingHistory = styled.div`
    display: flex;
    align-items: flex-start;
    margin: 14px 0;
    padding: 22px;
    background: white;
    border-bottom: 1px solid #e8f0fe;
`;

const LeaderBillingMoney = styled.span`
    font-size: 13px;
    color: #3c4043;
    margin-top: 8px;
    display: block;
`;

const BillingTopLineComent = styled.h2`
    text-align: left;
    font-size: 18px;
    font-weight: 800;
    color: #191f28;
    padding-left: 10px;
`;

const Billings = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
`;

const LottieContainer = styled.div`
    width: 40px;
    height: 40px;
    margin-left: 8px;
`;

const TitleContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin-top: 20px;
    margin-bottom: 10px;
    padding: 0 8px;
`;

// 스켈레톤 애니메이션
const shimmer = keyframes`
    0% {
        background-position: -1000px 0;
    }
    100% {
        background-position: 1000px 0;
    }
`;

const SkeletonBox = styled.div`
    background: linear-gradient(90deg, #f0f0f0 0px, #e0e0e0 40px, #f0f0f0 80px);
    background-size: 1000px 100%;
    animation: ${shimmer} 1.5s infinite;
    border-radius: 8px;
`;

const BillingSkeletonCard = styled.div`
    display: flex;
    align-items: flex-start;
    margin: 14px 0;
    padding: 22px;
    background: white;
    border-bottom: 1px solid #e8f0fe;
`;

const SkeletonText = styled(SkeletonBox).withConfig({
    shouldForwardProp: (prop) => prop !== 'height' && prop !== 'width' && prop !== 'marginBottom',
})`
    height: ${(props) => props.height || '16px'};
    width: ${(props) => props.width || '60%'};
    margin-bottom: ${(props) => props.marginBottom || '8px'};
`;

// 계좌번호 마스킹 함수 (앞 5자리 + 나머지 별표)
const maskAccountNumber = (accountNumber) => {
    if (!accountNumber) return '';
    const visiblePart = accountNumber.substring(0, 5);
    const maskedLength = 10 - visiblePart.length;
    const maskedPart = '*'.repeat(Math.max(0, maskedLength));
    return visiblePart + maskedPart;
};

const Billing = ({ payment, meetingName, setMeetingName }) => {
    const { meetingId } = useParams();
    const [members, setMembers] = useState([]);
    const [paymentState, setPaymentState] = useState(false);
    const [kakaoModalOpen, setKakaoModalOpen] = useState(false);
    const [tossModalOpen, setTossModalOpen] = useState(false);
    const [isBillingLoading, setIsBillingLoading] = useState(true);
    const [toastPopUp, setToastPopUp] = useState(false);

    const handleMeetingGetData = async () => {
        try {
            const response = await GetMeetingNameData(meetingId);
            setMeetingName(response.data);
        } catch (error) {
            console.log('Api 데이터 불러오기 실패');
        }
    };

    useEffect(() => {
        if (!kakaoModalOpen && !tossModalOpen) {
            handleMeetingGetData();
        }
    }, [kakaoModalOpen, tossModalOpen]);

    // 카카오 SDK 초기화
    useEffect(() => {
        const initKakao = () => {
            if (window.Kakao) {
                const kakao = window.Kakao;
                if (!kakao.isInitialized()) {
                    const kakaoSdkKey =
                        import.meta.env.VITE_KAKAO_SDK_KEY;
                    // 환경 변수가 있을 때만 초기화
                    if (kakaoSdkKey) {
                        kakao.init(kakaoSdkKey);
                    } else {
                        console.warn('카카오 SDK 키가 설정되지 않았습니다.');
                    }
                }
            }
        };
        if (meetingName) {
            initKakao();
        }
    }, [meetingName]);

    const onOpenDepositModal = (type) => {
        if (type === 'kakao') {
            sendEventToAmplitude('click kakao deposit id register', '');
            setKakaoModalOpen(true);
        } else if (type === 'toss') {
            sendEventToAmplitude('click toss deposit id register', '');
            setTossModalOpen(true);
        }
    };

    const handleKakaoShare = () => {
        if (!window.Kakao || !window.Kakao.isInitialized()) {
            alert('카카오톡 공유 기능을 사용할 수 없습니다.');
            return;
        }

        const imageUrl = `${window.location.origin}/kakao_feed.png`;

        window.Kakao.Link.sendDefault({
            objectType: 'feed',
            content: {
                title: 'Nbbang',
                description: meetingName.is_simple
                    ? `${meetingName.name}의 간편정산결과 입니다.`
                    : `${meetingName.name}의 정산결과 입니다.`,
                imageUrl: imageUrl,
                link: {
                    webUrl: meetingName.share_link,
                    mobileWebUrl: meetingName.share_link,
                },
            },
            buttons: [
                {
                    title: '정산 내역 확인하러가기',
                    link: {
                        webUrl: meetingName.share_link,
                        mobileWebUrl: meetingName.share_link,
                    },
                },
            ],
            installTalk: true,
        });
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(meetingName.share_link);
            setToastPopUp(true);
        } catch (error) {
            console.error('클립보드 복사 실패');
        }
    };

    useEffect(() => {
        setPaymentState(payment.length > 0);
    }, [payment]);

    useEffect(() => {
        const handleGetData = async () => {
            setIsBillingLoading(true);
            try {
                const responseGetData = await getMemberData(meetingId);
                setMembers(responseGetData.data);
            } catch (error) {
                console.log('Api 데이터 불러오기 실패');
            } finally {
                setIsBillingLoading(false);
            }
        };
        handleGetData();
    }, [meetingId, payment]);

    return (
        <>
            {isBillingLoading ? (
                <ResultContainar paymentState={true}>
                    <TitleContainer>
                        <BillingTopLineComent>
                            정산 결과를 확인해 볼까요?
                        </BillingTopLineComent>
                        <LottieContainer>
                            <Lottie
                                animationData={animationData}
                                loop={true}
                                autoplay={true}
                            />
                        </LottieContainer>
                    </TitleContainer>
                    <BillingContainer>
                        {[1, 2, 3, 4].map((i) => (
                            <BillingSkeletonCard key={i}>
                                <div style={{ width: '100%' }}>
                                    <SkeletonText height="18px" width="40%" />
                                    <SkeletonText
                                        height="14px"
                                        width="60%"
                                        marginBottom="12px"
                                    />
                                    {i === 1 && (
                                        <SkeletonText
                                            height="12px"
                                            width="80%"
                                        />
                                    )}
                                </div>
                            </BillingSkeletonCard>
                        ))}
                    </BillingContainer>
                </ResultContainar>
            ) : (
                paymentState && (
                    <ResultContainar paymentState={paymentState}>
                        <TitleContainer>
                            <BillingTopLineComent>
                                정산 결과를 확인해 볼까요?
                            </BillingTopLineComent>
                            <LottieContainer>
                                <Lottie
                                    animationData={animationData}
                                    loop={true}
                                    autoplay={true}
                                />
                            </LottieContainer>
                        </TitleContainer>
                        <BillingContainer>
                            {members.map((data) => (
                                <BillingHistory key={data.id}>
                                    {data.leader ? (
                                        <LeaderBillingContainer>
                                            <Member>총무 {data.name}</Member>
                                            <LeaderAmount>
                                                {data.amount > 0
                                                    ? `보내야 할 돈: ${data.amount.toLocaleString()}원`
                                                    : `받을 돈: ${Math.abs(data.amount).toLocaleString()}원`}
                                            </LeaderAmount>
                                            {members.map((value) =>
                                                value.amount < 0 &&
                                                value.leader === false ? (
                                                    <LeaderBillingMoney
                                                        key={value.id}
                                                    >
                                                        {`${value.name}님 한테 ${Math.abs(value.amount).toLocaleString()}원을 보내주세요`}
                                                    </LeaderBillingMoney>
                                                ) : null,
                                            )}
                                        </LeaderBillingContainer>
                                    ) : (
                                        <Billings>
                                            <Member>{data.name}</Member>
                                            <Amount>
                                                {data.amount >= 0
                                                    ? `총무에게 보내야 할 돈: ${data.amount.toLocaleString()}원`
                                                    : `총무에게 받아야 할 돈: ${Math.abs(data.amount).toLocaleString()}원`}
                                            </Amount>
                                        </Billings>
                                    )}
                                </BillingHistory>
                            ))}
                        </BillingContainer>

                        {/* 입금 정보 및 공유 버튼 */}
                        <div className="mt-8 mb-4">
                            {/* 입금 정보 버튼 */}
                            <div className="space-y-2 mb-4">
                                <button
                                    onClick={() => onOpenDepositModal('kakao')}
                                    className="w-full h-14 bg-[#fee500] text-[#191f28] rounded-2xl font-semibold text-[14px] hover:bg-[#fdd835] transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
                                >
                                    <img
                                        src="/images/kakao.png"
                                        alt="kakao"
                                        className="w-5 h-5"
                                    />
                                    <span>
                                        {meetingName?.kakao_deposit_information
                                            ?.kakao_deposit_id ||
                                        meetingName?.kakaoDepositInformation
                                            ?.kakaoDepositId
                                            ? `카카오페이: ${
                                                  meetingName
                                                      ?.kakao_deposit_information
                                                      ?.kakao_deposit_id ||
                                                  meetingName
                                                      ?.kakaoDepositInformation
                                                      ?.kakaoDepositId
                                              }`
                                            : '카카오페이 계좌 연동'}
                                    </span>
                                </button>
                                <button
                                    onClick={() => onOpenDepositModal('toss')}
                                    className="w-full h-14 bg-[#0452e7fc] text-white rounded-2xl font-semibold text-[14px] flex items-center justify-center gap-2"
                                >
                                    <img
                                        src="/images/result_toss.png"
                                        alt="toss"
                                        className="w-5 h-5"
                                    />
                                    <span>
                                        {meetingName?.toss_deposit_information
                                            ?.account_number &&
                                        meetingName?.toss_deposit_information
                                            ?.bank
                                            ? `${meetingName.toss_deposit_information.bank} ${maskAccountNumber(meetingName.toss_deposit_information.account_number)}`
                                            : '토스 계좌 연동'}
                                    </span>
                                </button>
                            </div>

                            {/* 공유 버튼 */}
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={handleKakaoShare}
                                    className="h-14 bg-white border border-black/[0.06] rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-[#f8f9fa] transition-all active:scale-95 shadow-sm"
                                >
                                    <MessageCircle
                                        size={20}
                                        className="text-[#fee500]"
                                    />
                                    <span className="text-[11px] font-medium text-[#191f28]">
                                        카카오톡
                                    </span>
                                </button>
                                <button
                                    onClick={handleCopyLink}
                                    className="h-14 bg-white border border-black/[0.06] rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-[#f8f9fa] transition-all active:scale-95 shadow-sm"
                                >
                                    <Copy
                                        size={20}
                                        className="text-[#0084ff]"
                                    />
                                    <span className="text-[11px] font-medium text-[#191f28]">
                                        링크 복사
                                    </span>
                                </button>
                                <QRCodeModal
                                    url={meetingName.share_link}
                                    imageSrc="/images/qricon.png"
                                    className="h-14 bg-white border border-black/[0.06] rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-[#f8f9fa] transition-all active:scale-95 shadow-sm cursor-pointer"
                                    title="QR 찍고 바로 정산 페이지 확인하세요"
                                    description="한 번의 스캔으로 정산 끝!"
                                    description2="톡으로 링크 보내기 귀찮을 땐 👆🏼 QR로 바로 공유"
                                >
                                    <button className="h-14 bg-white border border-black/[0.06] rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-[#f8f9fa] transition-all active:scale-95 shadow-sm cursor-pointer">
                                        <QrCode
                                            size={20}
                                            className="text-[#8e8e93]"
                                        />
                                        <span className="text-[11px] font-medium text-[#191f28]">
                                            QR 코드
                                        </span>
                                    </button>
                                </QRCodeModal>
                            </div>
                        </div>

                        {/* 모달 */}
                        {kakaoModalOpen && (
                            <BillingKakaoModal
                                meetingName={meetingName}
                                setKakaoModalOpen={setKakaoModalOpen}
                            />
                        )}
                        {tossModalOpen && (
                            <BillingTossModal
                                meetingName={meetingName}
                                setTossModalOpen={setTossModalOpen}
                            />
                        )}

                        {/* 토스트 팝업 */}
                        {toastPopUp && (
                            <ToastPopUp
                                message="텍스트가 클립보드에 복사되었습니다."
                                setToastPopUp={setToastPopUp}
                            />
                        )}
                    </ResultContainar>
                )
            )}
        </>
    );
};
export default Billing;
