import styled, { keyframes } from 'styled-components';
import { useEffect, useState } from 'react';

const slideUp = keyframes`
  from {
    transform: translate(-50%, 100%);
  }
  to {
    transform: translate(-50%, -50%);
  }
`;

const slideDown = keyframes`
  from {
    transform: translate(-50%, -50%);
    opacity: 1;
  }
  to {
    transform: translate(-50%, 100%);
    opacity: 0;
  }
`;

const PopUpContainer = styled.div`
    position: fixed;
    top: 95%;
    left: 50%;
    padding: 7px;
    min-width: 250px;
    text-align: center;
    z-index: 3;
    background: #686482;
    color: #fff;
    border-radius: 8px;
    transform: translate(-50%, -50%);
    animation: ${({ isLeaving }) => (isLeaving ? slideDown : slideUp)} 0.5s ease
        forwards;
`;

const PopUpMessage = styled.span`
    font-size: 14px;
    color: white;
`;

const ToastPopUp = ({ message, setToastPopUp }) => {
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLeaving(true);
            setTimeout(() => {
                setToastPopUp(false);
            }, 500);
        }, 1700);
        return () => {
            clearTimeout(timer);
        };
    }, [setToastPopUp]);

    return (
        <PopUpContainer isLeaving={isLeaving} {...{ isLeaving: undefined }}>
            <PopUpMessage>{message}</PopUpMessage>
        </PopUpContainer>
    );
};

export default ToastPopUp;
