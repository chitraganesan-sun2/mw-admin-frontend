const CommentSkeleton = ({ size = 3 }: { size?: number }) => {
    return (
        <div className="flex flex-col gap-3">
            {[...Array(size)].map((_, index) => (
                <div key={index} className="animate-pulse">
                    <div className="flex gap-2 md:gap-3 w-full py-1">
                        <div className="w-[32px] h-[32px] bg-gray-300 rounded-full flex-shrink-0" />
                        <div className="flex-1">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex flex-col md:flex-row md:items-center gap-2">
                                    {/* Name */}
                                    <div className="h-3 w-24 bg-gray-300 rounded" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                    {/* Tag and Time */}
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-16 bg-gray-300 rounded" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                        <div className="h-3 w-20 bg-gray-300 rounded" />
                                    </div>
                                </div>
                                <div className="h-6 w-6 bg-gray-300 rounded" />
                            </div>
                            <div className="flex flex-col gap-2 mt-2">
                                <div className="h-2 w-full bg-gray-300 rounded" />
                                <div className="h-2 w-16 bg-gray-300 rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CommentSkeleton;