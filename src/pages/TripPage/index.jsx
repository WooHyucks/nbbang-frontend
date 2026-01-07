import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateTripWizard from '../../components/Trip/CreateTripWizard';
import { getMembers } from '../../api/tripApi';
import { useParams } from 'react-router-dom';

const TripPage = () => {
    const navigate = useNavigate();
    const { meetingId } = useParams(); // 기존 모임에서 멤버 가져오는 경우
    const [showCreateModal, setShowCreateModal] = useState(true);
    const [existingMembers, setExistingMembers] = useState([]);

    useEffect(() => {
        // 기존 모임에서 멤버를 가져오는 경우
        if (meetingId) {
            loadExistingMembers();
        }
    }, [meetingId]);

    const loadExistingMembers = async () => {
        try {
            const members = await getMembers(meetingId);
            setExistingMembers(members);
        } catch (error) {
            console.error('멤버 로드 실패:', error);
        }
    };

    const handleTripCreated = (newMeetingId) => {
        // 대시보드로 이동
        navigate(`/trip/${newMeetingId}/dashboard`);
    };

    const handleClose = () => {
        setShowCreateModal(false);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <CreateTripWizard
                isOpen={showCreateModal}
                onClose={handleClose}
                onSuccess={handleTripCreated}
                existingMembers={existingMembers}
            />
        </div>
    );
};

export default TripPage;
