import { useQuery } from '@tanstack/react-query';
import { getPublicTripResult, getTripSettlementResult } from '../api/tripApi';

/**
 * 공개용 Trip Query (UUID 기반, 인증 불필요)
 */
export const usePublicTripQuery = (uuid) => {
    return useQuery({
        queryKey: ['public-trip', uuid],
        queryFn: () => getPublicTripResult(uuid),
        enabled: !!uuid,
        refetchInterval: 3000, // 3초마다 폴링
    });
};

/**
 * 멤버용 Trip Query (meetingId 기반, 인증 필요)
 */
export const useMeetingResultQuery = (meetingId) => {
    return useQuery({
        queryKey: ['trip-result', meetingId],
        queryFn: () => getTripSettlementResult(meetingId),
        enabled: !!meetingId,
        refetchInterval: 3000, // 3초마다 폴링
    });
};
