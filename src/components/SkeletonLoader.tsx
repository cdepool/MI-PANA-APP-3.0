import React from 'react';

// ============================================
// SKELETON LOADER COMPONENTS
// ============================================

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
    <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
);

// ============================================
// TABLE SKELETON
// ============================================

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
    rows = 5,
    columns = 5
}) => (
    <div className="w-full">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex gap-4">
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-20" />
            ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-50">
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="px-6 py-4 flex items-center gap-4">
                    {/* Avatar */}
                    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />

                    {/* Content columns */}
                    <div className="flex-1 flex gap-4">
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-3 w-40" />
                            <Skeleton className="h-3 w-36" />
                        </div>
                        <div className="w-24">
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                        <div className="w-24">
                            <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                        <div className="w-20 flex gap-2">
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <Skeleton className="h-8 w-8 rounded-lg" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// ============================================
// CARD SKELETON
// ============================================

interface CardSkeletonProps {
    count?: number;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ count = 4 }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="w-6 h-6 rounded-lg" />
                </div>
                <Skeleton className="h-8 w-20 mb-1" />
                <Skeleton className="h-3 w-16" />
            </div>
        ))}
    </div>
);

// ============================================
// LIST SKELETON
// ============================================

interface ListSkeletonProps {
    items?: number;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({ items = 5 }) => (
    <div className="space-y-2">
        {Array.from({ length: items }).map((_, i) => (
            <div key={i} className="p-3 rounded-lg border border-gray-100 bg-gray-50">
                <div className="flex justify-between items-start mb-1">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-3 w-40 mb-1" />
                <Skeleton className="h-2 w-28" />
            </div>
        ))}
    </div>
);

// ============================================
// APPROVAL CARD SKELETON
// ============================================

export const ApprovalCardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
    <div className="grid gap-4">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                        <Skeleton className="h-3 w-48 mb-3" />

                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                        <Skeleton className="h-10 w-24 rounded-lg" />
                        <Skeleton className="h-10 w-24 rounded-lg" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export default {
    Skeleton,
    TableSkeleton,
    CardSkeleton,
    ListSkeleton,
    ApprovalCardSkeleton
};
