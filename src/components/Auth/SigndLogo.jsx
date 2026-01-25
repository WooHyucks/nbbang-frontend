import React from 'react';
import styled from 'styled-components';

const SigndLogoContainer = styled.div`
    margin-top: 100px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

const SigndLogoImg = styled.img`
    width: 90px;
    border-radius: 25px;
`;

const SigndComent = styled.p`
    margin: 25px 0px 15px;
    font-size: 22px;
    font-weight: bold;
`;

const SigndLogo = () => {
    return (
        <SigndLogoContainer>
            <SigndLogoImg
                alt="nbbang"
                src="/images/nbbang.png"
                onClick={() => (window.location.href = '/')}
            />
            <SigndComent>AI 정산, 원클릭 송금</SigndComent>
        </SigndLogoContainer>
    );
};

export default SigndLogo;
