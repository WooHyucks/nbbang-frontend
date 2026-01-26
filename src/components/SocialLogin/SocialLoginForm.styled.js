import styled from 'styled-components';

export const SocialLoginContainer = styled.div.withConfig({
    shouldForwardProp: (prop) => {
        return (
            prop !== 'backgroundColor' &&
            prop !== 'borderColor' &&
            prop !== 'gapSize'
        );
    },
})`
    position: relative;
    margin-top: 10px;
    border-radius: 10px;
    width: 340px;
    height: 45px;
    background: ${(props) => props.backgroundColor || '#03c75a'};
    border: 1px solid ${(props) => props.borderColor || '#E5E7EB'};
    display: flex;
    justify-content: center;
    gap: ${(props) => props.gapSize || '28px'};
    align-items: center;
    cursor: pointer;
`;

export const SocialLoginIcon = styled.img.withConfig({
    shouldForwardProp: (prop) => prop !== 'imgWidth',
})`
    width: ${(props) => props.imgWidth || '25px'};
    position: absolute;
    left: 50px;
`;

export const Button = styled.button.withConfig({
    shouldForwardProp: (prop) => {
        return (
            prop !== 'textColor' &&
            prop !== 'backgroundColor' &&
            prop !== 'borderColor'
        );
    },
})`
    color: ${(props) => props.textColor || 'white'};
    background: ${(props) => props.backgroundColor || '#03c75a'};
    border: 1px solid ${(props) => props.borderColor || '#03c75a'};
    cursor: pointer;
    font-weight: bold;
    font-size: 13px;
`;
