import React from 'react';
import styled from 'styled-components';

const LogoContainer = styled.div``;

const LogoImg = styled.img`
    width: 90px;
    border-radius: 25px;
`;

const Logo = () => {
    return (
        <LogoContainer>
            <LogoImg
                alt="nbbang"
                src="/images/nbbang.png"
                onClick={() => (window.location.href = '/')}
            />
        </LogoContainer>
    );
};

export default Logo;
