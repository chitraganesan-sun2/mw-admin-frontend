import React from "react";

const PostSkeleton = ({ size = 3 }: { size?: number }) => {
    return (
        <div className="w-full flex flex-col gap-6 divide-y divide-gray-200">
            {[...Array(size)].map((_, index) => (
                <div key={index} className="block w-full relative animate-pulse py-2">
                    <div className="px-2 py-1 md:px-0">
                        <div className="flex items-center gap-2 md:gap-3 w-full p-2">
                            <div className="w-[40px] h-[40px] bg-gray-300 rounded-full flex-shrink-0" />
                            
                            <div className="flex-1">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                                        {/* Name */}
                                        <div className="h-4 w-32 bg-gray-300 rounded" />
                                        <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-gray-300" />
                                        {/* Tag and Time */}
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-20 bg-gray-300 rounded" />
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                            <div className="h-4 w-24 bg-gray-300 rounded" />
                                        </div>
                                    </div>
                                    {/* Menu */}
                                    <div className="h-6 w-6 bg-gray-300 rounded" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Post Content */}
                    <div className="mt-2 md:mt-3 lg:mt-0 lg:!pl-[50px]">
                        {/* Text Content */}
                        <div className="p-2 md:px-0">
                            <div className="h-4 w-full bg-gray-300 rounded mb-2" />
                            <div className="h-4 w-3/4 bg-gray-300 rounded" />
                        </div>

                        {/* Image */}
                        <div className="mt-2 md:mt-3 w-full h-[240px] md:h-[360px] bg-gray-300 rounded-xl" />

                        {/* Actions */}
                        <div className="p-2 md:pr-4 md:px-0 mt-2 md:mt-3">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-6">
                                    <div className="h-6 w-16 bg-gray-300 rounded" />
                                    <div className="h-6 w-16 bg-gray-300 rounded" />
                                </div>
                                <div className="h-6 w-6 bg-gray-300 rounded" />
                            </div>
                        </div>
                        <div className="h-8 w-full bg-gray-300 rounded mt-2" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PostSkeleton;