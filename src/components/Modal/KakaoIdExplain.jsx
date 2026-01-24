import styled, { keyframes } from 'styled-components';
import { X } from 'lucide-react';

const fadeIn = keyframes`
    from {
        opacity: 0;
        transform: scale(0.95) translateY(20px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
`;

const BillingResultContainer = styled.div`
    z-index: 60;
    position: fixed;
    inset: 0;
`;

const WrapperModal = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 60;
    padding: 20px;
`;

const Modal = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: 20px;
    max-height: 85vh;
    padding: 32px 24px 24px;
    height: auto;
    width: 100%;
    max-width: 400px;
    background: white;
    border-radius: 24px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: ${fadeIn} 0.3s ease-out;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
    &::-webkit-scrollbar {
        display: none;
    }
`;

const ModalClose = styled.button`
    cursor: pointer;
    position: absolute;
    top: 16px;
    right: 16px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f2f2f7;
    border: none;
    border-radius: 50%;
    transition: all 0.2s ease;
    color: #8e8e93;
    
    &:hover {
        background: #e5e5ea;
        transform: scale(1.1);
    }
    
    &:active {
        transform: scale(0.95);
    }
`;

const ModalCloseBottmBar = styled.button`
    padding: 16px;
    width: 100%;
    font-size: 16px;
    font-weight: 700;
    background: linear-gradient(135deg, #fee500 0%, #fdd835 100%);
    color: #191f28;
    border: none;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(254, 229, 0, 0.3);
    margin-top: 8px;
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(254, 229, 0, 0.4);
    }
    
    &:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(254, 229, 0, 0.3);
    }
`;

const Img = styled.img`
    width: 100%;
    max-width: 320px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    margin: 8px 0;
`;

const LinkExplain = styled.div`
    color: #191f28;
    font-weight: 700;
    font-size: 18px;
    line-height: 1.6;
    text-align: center;
    margin-bottom: 8px;
    
    strong {
        color: #fee500;
        background: linear-gradient(135deg, #fee500 0%, #fdd835 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
`;

const Explain = styled.p`
    color: #191f28;
    width: 100%;
    margin: 16px 0 0 0;
    font-size: 15px;
    line-height: 1.6;
    font-weight: 500;
    padding: 12px 16px;
    background: #f9fafb;
    border-radius: 12px;
    border-left: 4px solid #fee500;
`;

const Explainfirst = styled(Explain)`
    width: 100%;
`;

const Icon = styled.span`
    font-size: 28px;
    margin: 8px 0;
    display: inline-block;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
`;

const StepNumber = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: #fee500;
    color: #191f28;
    border-radius: 50%;
    font-size: 14px;
    font-weight: 700;
    margin-right: 8px;
    flex-shrink: 0;
`;

const StepContainer = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 8px;
`;

const KakaoIdExplain = ({ setModalOpen }) => {
    return (
        <BillingResultContainer>
            <WrapperModal onClick={() => setModalOpen(false)}>
                <Modal onClick={(e) => e.stopPropagation()}>
                    <ModalClose onClick={() => setModalOpen(false)}>
                        <X size={18} />
                    </ModalClose>
                    
                    <LinkExplain>
                        <strong>카카오 링크란?</strong>
                        <br />
                        <br />
                        카카오링크를 등록하면 카카오톡으로<br />
                        더 쉽게 송금을 받을 수 있어요! 😎
                        <br />
                        <br />
                        아래에서 카카오 링크<br />
                        발급 받는 법을 함께 알아볼까요?
                        <Icon>🏃🏻‍♂️</Icon>
                    </LinkExplain>

                    <StepContainer>
                        <Explainfirst>
                            <StepNumber>1</StepNumber>
                            카카오톡 더보기 상단의 QR코드 아이콘을 눌러주세요
                        </Explainfirst>
                        <Img alt="explain3" src="/images/explain3.jpeg" />
                        
                        <Explain>
                            <StepNumber>2</StepNumber>
                            QR코드 아래 송금코드를 눌러주세요
                        </Explain>
                        <Img alt="explain2" src="/images/explain2.jpeg" />
                        
                        <Explainfirst>
                            <StepNumber>3</StepNumber>
                            송금 코드 복사 아이콘을 눌러서 송금코드를 복사해주세요
                        </Explainfirst>
                        <Img alt="explain" src="/images/explain.jpeg" />
                        
                        <Explain>
                            <StepNumber>4</StepNumber>
                            이제 카카오톡 송금링크를 등록하러 가볼까요?
                            <Icon>👇🏻</Icon>
                        </Explain>
                    </StepContainer>

                    <ModalCloseBottmBar onClick={() => setModalOpen(false)}>
                        링크 입력하러가기
                    </ModalCloseBottmBar>
                </Modal>
            </WrapperModal>
        </BillingResultContainer>
    );
};
export default KakaoIdExplain;
