import React from 'react';

const TableSkeletonLoader = ({ columns = 6, rows = 5 }) => {
    return (
        <>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b border-gray-50 bg-white">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <td key={colIndex} className="p-4">
                            {colIndex === 0 ? (
                                /* Checkbox skeleton */
                                <div className="w-5 h-5 rounded bg-gray-200 animate-pulse mx-auto" />
                            ) : colIndex === columns - 1 ? (
                                /* Action buttons skeleton */
                                <div className="flex gap-2 justify-center">
                                    <div className="w-7 h-7 rounded-lg bg-gray-200 animate-pulse" />
                                </div>
                            ) : colIndex === columns - 2 ? (
                                /* Status skeleton */
                                <div className="w-24 h-8 rounded-lg bg-gray-200 animate-pulse" />
                            ) : (
                                /* Content skeleton */
                                <div className="flex items-center gap-3">
                                    {colIndex === 1 && <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0" />}
                                    <div className="flex flex-col gap-2 w-full max-w-[150px]">
                                        <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
                                    </div>
                                </div>
                            )}
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
};

export default TableSkeletonLoader;
