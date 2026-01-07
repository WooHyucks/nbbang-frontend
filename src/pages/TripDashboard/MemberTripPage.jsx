import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMeetingResultQuery } from '../../hooks/useTripQueries';
import TripDashboardLayout from '../../components/Trip/TripDashboardLayout';

const MemberTripPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data, isLoading, error, refetch } = useMeetingResultQuery(id);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">로딩 중...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">
                        데이터를 불러올 수 없습니다.
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-xl"
                    >
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    const members = data.members_status.map((m) => ({
        id: m.id || m.member_id || 0,
        name: m.name || m.member_name || '',
    }));

    const viewMode = 'MANAGER';

    const countryCode =
        data.meeting_info?.country_code || data.trip?.country_code;
    const baseExchangeRate =
        data.meeting_info?.base_exchange_rate || data.trip?.base_exchange_rate;
    const currency = data.meeting_info?.currency;

    return (
        <TripDashboardLayout
            data={data}
            viewMode={viewMode}
            onRefresh={refetch}
            showAddExpenseButton={true}
            meetingId={id}
            members={members}
            countryCode={countryCode}
            countryCurrency={
                currency || (countryCode === 'KR' ? 'KRW' : undefined)
            }
            baseExchangeRate={baseExchangeRate}
        />
    );
};

export default MemberTripPage;
