interface SkeletonCardProps {
    className?: string;
}

export function SkeletonCard({ className = '' }: SkeletonCardProps) {
    return (
        <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`}>
            <div className="h-full w-full bg-gray-300 rounded-xl opacity-50"></div>
        </div>
    );
}
