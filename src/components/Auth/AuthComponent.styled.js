import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';

export const NavBar = styled(motion.div)`
    position: sticky;
    top: 0;
    height: 56px;
    border-bottom: 1px solid #e5e7eb;
    background-color: #ffffff;
    z-index: 10;
    display: flex;
    justify-content: center;
    align-items: center;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
`;

export const NavComent = styled(motion.span)`
    margin-bottom: 0px;
    font-weight: 700;
    font-size: 17px;
    color: #191f28;
    letter-spacing: -0.3px;
`;

export const NavIcon = styled(motion.img)`
    width: 20px;
`;

export const SigndContainer = styled(motion.div)`
    position: relative;
`;

export const SigndBox = styled(motion.div)``;

export const Form = styled(motion.form)``;

export const Input = styled(motion.input)`
    outline: none;
    position: absolute;
    left: 0px;
    top: 0px;
    width: 100%;
    padding: 12px 40px 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    height: 48px;
    font-size: 15px;
    font-weight: 500;
    background: #ffffff;
    transition: all 0.2s ease;
    color: #191f28;

    &:focus {
        border-color: #3182f6;
        box-shadow: 0 0 0 3px rgba(49, 130, 246, 0.1);
    }

    &::placeholder {
        color: #9ca3af;
        font-weight: 400;
    }

    @media (max-width: 768px) {
        font-size: 15px;
    }
`;

export const InputBox = styled(motion.div)`
    position: relative;
    width: 100%;
    margin-top: 20px;
    height: 48px;
    display: inline-block;
    background-color: transparent;
`;

export const SignInButton = styled(motion.button)`
    color: white;
    margin: 20px 0px;
    border: none;
    font-size: 16px;
    width: 100%;
    font-weight: 700;
    height: 52px;
    border-radius: 12px;
    transition: all 0.2s ease;
    letter-spacing: -0.3px;

    &:not(:disabled) {
        background: linear-gradient(135deg, #3182f6 0%, #1d4ed8 100%);
        color: white;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(49, 130, 246, 0.3);

        &:hover {
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(49, 130, 246, 0.4);
        }

        &:active {
            transform: translateY(0);
            box-shadow: 0 2px 8px rgba(49, 130, 246, 0.3);
        }
    }

    &:disabled {
        background: #e5e7eb;
        color: #9ca3af;
        cursor: not-allowed;
        box-shadow: none;
    }
`;

export const SigndTopLine = styled(motion.div)`
    margin-top: 30px;
    display: flex;
    justify-content: center;
    margin-bottom: 15px;
`;

export const SigndLine = styled(motion.div)`
    border-top: 1px solid silver;
    width: 135px;
    margin-top: 10px;
    @media (max-width: 768px) {
        width: 150px;
    }
`;

export const SigndLineComent = styled(motion.span)`
    margin: 0 10px;
    font-size: 14px;
    color: silver;
    font-weight: 800;
`;

export const PlatformSignd = styled(motion.div)`
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
`;

export const Valid = styled(motion.div)`
    color: #ef4444;
    font-weight: 600;
    margin: 8px 0px 0px 4px;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 4px;

    &::before {
        content: '⚠';
        font-size: 14px;
    }
`;

export const SignUpLink = styled(motion.div)`
    font-size: 0.75rem;
    font-weight: 700;
    line-height: 1rem;
    margin: 15px;
`;

export const AgreementContainer = styled(motion.div)`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin: 16px 0;
    font-size: 14px;
    gap: 8px;
    font-weight: 500;
    color: #4b5563;
    line-height: 1.5;

    @media (max-width: 400px) {
        font-size: 13px;
    }
`;

export const AgreementChenckBox = styled(motion.input)`
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #3182f6;
    margin-right: 4px;
    flex-shrink: 0;
`;

export const LinkStyle = styled(motion(Link))`
    color: #3182f6;
    margin: 0;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color 0.2s ease;

    &:hover {
        color: #2563eb;
    }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const AuthenticationTitleContainer = styled(motion.div)`
    text-align: left;
    margin-top: 40px;
    margin-bottom: 32px;
`;

export const AuthenticationTitle = styled(motion.p)`
    font-size: 24px;
    font-weight: 800;
    margin: 8px 0px;
    color: #191f28;
    letter-spacing: -0.5px;
    line-height: 1.3;
    animation: ${fadeIn} 0.6s;
`;

export const AuthenticationSubtitle = styled(motion.p)`
    font-size: 15px;
    font-weight: 500;
    color: #6b7280;
    margin: 8px 0px 0px 0px;
    animation: ${fadeIn} 0.6s;
    line-height: 1.5;
`;

export const ResetButton = styled(motion.span)`
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-weight: 600;
    cursor: pointer;
    color: #9ca3af;
    font-size: 18px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;
    z-index: 1;

    &:hover {
        background: #f3f4f6;
        color: #6b7280;
    }
`;

export const AuthRequestContainer = styled(motion.div)`
    position: relative;
    width: 100%;
    margin-top: 32px;
`;
