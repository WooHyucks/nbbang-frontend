import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { PutMemberNameData } from '../../api/api';
import useOnClickOutside from '../../hooks/useOnClickOutside';
import { motion, AnimatePresence } from 'framer-motion';

const BillingMemberFixContainer = styled.div`
    z-index: 10;
    position: absolute;
`;

const WrapperModal = styled(motion.div)`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
`;

const Modal = styled(motion.div)`
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 40px;
    align-items: center;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const ModalClose = styled.span`
    position: absolute;
    top: 0px;
    right: 12px;
    font-size: 24px;
    color: #8b95a1;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
        color: #4e5968;
    }
`;

const MemberNameFixInput = styled(motion.input)`
    padding: 10px;
    border: none;
    outline: none;
    font-size: 14px;

    &::placeholder {
        color: #aeb5bc;
    }
`;

const MemberNameFixInputBox = styled(motion.div)`
    width: 100%;
    margin-bottom: 12px;
    border: 1px solid #e5e8eb;
    border-radius: 6px;
    transition: all 0.2s;

    &:focus-within {
        border-color: #3182f6;
        box-shadow: 0 0 0 3px rgba(49, 130, 246, 0.1);
    }
`;

const MemberFix = styled(motion.button)`
    width: 100%;
    height: 36px;
    margin-top: 6px;
    border: none;
    border-radius: 6px;
    background: #3182f6;
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
        background: #1b64da;
    }

    &:disabled {
        background: #f2f4f6;
        color: #aeb5bc;
        cursor: not-allowed;
    }
`;

const LeaderCheck = styled(motion.input)`
    margin-right: 6px;
    accent-color: #3182f6;
`;

const Label = styled(motion.div)`
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    font-size: 13px;
    color: #4e5968;
`;

const Leader = styled.span`
    font-weight: 500;
`;

const BillingMemberFix = ({
    id,
    name,
    meetingId,
    setOpenModal,
    handleGetData,
    leader,
}) => {
    const ref = useRef();

    const [selectedleader, setSelectedleader] = useState(false);
    const [notAllow, setNotAllow] = useState(true);
    const [formData, setFormData] = useState({
        name: name,
        leader: selectedleader,
    });

    const modalVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
    };

    const contentVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.3,
                staggerChildren: 0.1,
            },
        },
        exit: { opacity: 0, y: -20 },
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.2 },
        },
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handlePutData = async (e) => {
        e.preventDefault();
        if (leader === true) {
            formData.leader = true;
        } else {
            formData.leader = selectedleader;
        }
        try {
            const response = await PutMemberNameData(meetingId, id, formData);
            if (response.status === 200) {
                setFormData({ name: '' });
                setOpenModal(false);
                handleGetData();
            }
        } catch (error) {
            console.log('Api 데이터 수정 실패');
        }
    };

    useEffect(() => {
        if (formData.name.length > 0) {
            setNotAllow(false);
            return;
        }
        setNotAllow(true);
    }, [formData.name]);

    useOnClickOutside(ref, () => {
        setOpenModal(false);
    });

    return (
        <BillingMemberFixContainer>
            <AnimatePresence>
                <WrapperModal
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <Modal
                        ref={ref}
                        initial={{ scale: 0.5, opacity: 0, y: 50 }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                            y: 0,
                            transition: {
                                type: 'spring',
                                stiffness: 300,
                                damping: 25,
                            },
                        }}
                    >
                        <ModalClose onClick={() => setOpenModal(false)}>
                            ×
                        </ModalClose>
                        <form onSubmit={handlePutData}>
                            <MemberNameFixInputBox
                                initial={{ x: -20, opacity: 0 }}
                                animate={{
                                    x: 0,
                                    opacity: 1,
                                    transition: { delay: 0.2 },
                                }}
                            >
                                <MemberNameFixInput
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    placeholder="이름을 입력해주세요"
                                    onChange={handleInputChange}
                                    autoComplete="off"
                                    onTouchStart={(e) => e.preventDefault()}
                                    onTouchMove={(e) => e.preventDefault()}
                                />
                            </MemberNameFixInputBox>
                            <Label
                                initial={{ x: -20, opacity: 0 }}
                                animate={{
                                    x: 0,
                                    opacity: 1,
                                    transition: { delay: 0.3 },
                                }}
                            >
                                <LeaderCheck
                                    type="checkbox"
                                    checked={selectedleader}
                                    onChange={(e) =>
                                        setSelectedleader(e.target.checked)
                                    }
                                />
                                <Leader>총무로 변경하기</Leader>
                            </Label>
                            <MemberFix
                                type="submit"
                                disabled={notAllow}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{
                                    x: 0,
                                    opacity: 1,
                                    transition: { delay: 0.4 },
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                저장하기
                            </MemberFix>
                        </form>
                    </Modal>
                </WrapperModal>
            </AnimatePresence>
        </BillingMemberFixContainer>
    );
};

export default BillingMemberFix;
