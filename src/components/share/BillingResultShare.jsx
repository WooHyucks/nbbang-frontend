import styled from 'styled-components';
import React from 'react';
import { useState } from 'react';
import ToastPopUp from '../common/ToastPopUp';

const ShareButton = styled.div`
    display: 'flex';
    justify-content: center;
    align-items: center;
`;

const Button = styled.button`
    width: 200px;
    font-size: 13px;
    height: 35px;
    border: none;
    background-color: #3182f6;
    border-radius: 12px;
    color: white;
    cursor: pointer;
    margin: 30px 0 35px 0;
`;

const ShareIcon = styled.img`
    margin-top: 4px;
    width: 50px;
    cursor: pointer;
`;

const CopyIcon = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    gap: 12px;
    img {
        width: 40px;
        cursor: pointer;
    }
`;

const BillingResultShare = ({ meetingName }) => {
    const [toastPopUp, setToastPopUp] = useState(false);

    const getApiDataCopy = async () => {
        try {
            // 캐시 무효화를 위한 타임스탬프 추가
            const separator = meetingName.share_link.includes('?') ? '&' : '?';
            const shareLinkWithCacheBust = `${meetingName.share_link}${separator}v=${Date.now()}`;
            await navigator.clipboard.writeText(shareLinkWithCacheBust);
            setToastPopUp(true);
        } catch (error) {
            console.error('클립보드 복사 실패');
        }
    };

    return (
        <ShareButton>
            <CopyIcon onClick={getApiDataCopy}>
                <img src={'/images/copy.png'} alt="copy" />
            </CopyIcon>
            {toastPopUp && (
                <ToastPopUp
                    message="텍스트가 클립보드에 복사되었습니다."
                    setToastPopUp={setToastPopUp}
                />
            )}
        </ShareButton>
    );
};

export default BillingResultShare;
