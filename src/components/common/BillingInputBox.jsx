import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const InputWrapper = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
`;

const Input = styled.input`
    width: 100%;
    padding: 8px 36px 8px 0;
    border: none;
    border-radius: 0px;
    border-bottom: 2px solid #0066ff;
    outline: none;
    font-size: 14px;

    &::placeholder {
        color: #aeb5bc;
    }
`;

const BillingInputBox = ({ type, name, value, onChange, placeholder }) => {
    const [isDelete, setIsDelete] = useState(false);

    useEffect(() => {
        if (isDelete) {
            onChange({ target: { name, value: '' } });
            setIsDelete(false);
        }
    }, [isDelete, name, onChange]);

    return (
        <InputWrapper>
            <Input
                type={type}
                name={name}
                value={value || ''}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete="off"
                maxLength="22"
            />
            <span
                className="absolute right-0 font-bold text-gray-500"
                onClick={() => setIsDelete(true)}
            >
                X
            </span>
        </InputWrapper>
    );
};

export default BillingInputBox;
