import { Skeleton } from '@/components/ui/skeleton';

export const BillingSkeleton = () => {
    return (
        <div className="flex flex-col gap-3 space-y-3 mx-6 py-6 border-b border-gray-100">
            <Skeleton className="h-5 w-[100px] bg-gray-100 rounded-full" />
            <Skeleton className="h-5 w-[200px] bg-gray-100 rounded-full" />
            <Skeleton className="h-5 w-[250px] bg-gray-100 rounded-full" />
        </div>
    );
};

export const PaymentSkeleton = () => {
    return (
        <div className="flex flex-col gap-3 space-y-3 mx-6 py-6 border-b border-gray-100">
            <div className="flex justify-between">
                <Skeleton className="h-4 w-[80px] rounded-xl bg-gray-100" />
                <Skeleton className="h-4 w-[120px] rounded-xl bg-gray-100" />
            </div>
            <div className="flex justify-between">
                <Skeleton className="h-4 w-[100px] rounded-xl bg-gray-100" />
                <Skeleton className="h-4 w-[100px] rounded-xl bg-gray-100" />
            </div>
            <div className="flex gap-4">
                <Skeleton className="h-8 w-[200px] bg-gray-100 rounded-full" />
                <Skeleton className="h-8 w-[200px] bg-gray-100 rounded-full" />
                <Skeleton className="h-8 w-[200px] bg-gray-100 rounded-full" />
                <Skeleton className="h-8 w-[200px] bg-gray-100 rounded-full" />
            </div>
        </div>
    );
};
