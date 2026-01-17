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
                <div className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-lg p-8 max-w-xs w-full">
                    <div className="mb-3">
                        <svg
                            className="w-12 h-12 text-blue-400 mx-auto"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.3}
                            viewBox="0 0 48 48"
                        >
                            <circle
                                cx="24"
                                cy="24"
                                r="22"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="#e0e7ff"
                                opacity="0.5"
                            />
                            <path
                                d="M24 14v7"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                            <circle cx="24" cy="32" r="1.8" fill="#2563eb" />
                        </svg>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mb-1">
                        데이터를 불러올 수 없습니다.
                    </p>
                    <p className="text-gray-500 text-sm mb-6">
                        잠시 후 다시 시도해주세요.
                    </p>
                    <div className="flex flex-col gap-2 w-full">
                        <button
                            onClick={handleRefresh}
                            className="w-full px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
                        >
                            다시 시도
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold bg-white hover:bg-gray-50 transition"
                        >
                            홈으로 가기
                        </button>
                    </div>
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
