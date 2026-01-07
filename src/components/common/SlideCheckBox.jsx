import styled from 'styled-components';

const SlideToggle = styled.label`
    position: relative;
    display: inline-block;
    width: 47px;
    height: 23px;
`;

const Slider = styled.div`
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0px;
    bottom: 0;
    background-color: #ccc;
    -webkit-transition: 0.4s;
    transition: 0.4s;
    border-radius: 34px;

    &:before {
        position: absolute;
        content: '';
        height: 16px;
        width: 16px;
        margin-left: 3px;
        left: 0px;
        bottom: 4px;
        background-color: white;
        transition: 0.4s;
        border-radius: 50%;
    }
`;

const CheckboxInput = styled.input`
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + ${Slider} {
        background-color: #2196f3;
    }

    &:checked + ${Slider}:before {
        -webkit-transform: translateX(25px);
        -ms-transform: translateX(26px);
        transform: translateX(26px);
    }
`;

const SlideCheckbox = ({ type, checked, onChange }) => {
    return (
        <SlideToggle>
            <CheckboxInput type={type} checked={checked} onChange={onChange} />
            <Slider />
        </SlideToggle>
    );
};

export default SlideCheckbox;
