import React from 'react';

export const Table = ({ children, className = '', style = {} }) => (
    <div className="w-full overflow-auto border border-gray-300 rounded-sm">
        <table className={`w-full caption-bottom text-sm ${className}`} style={style}>
            {children}
        </table>
    </div>
);

export const TableHeader = ({ children, className = '' }) => (
    <thead className={`bg-gray-100 ${className}`}>
        {children}
    </thead>
);

export const TableBody = ({ children, className = '' }) => (
    <tbody className={`bg-white ${className}`}>
        {children}
    </tbody>
);

export const TableRow = ({ children, className = '', ...props }) => (
    <tr
        className={`transition-colors hover:bg-blue-50/50 data-[state=selected]:bg-purple-100 data-[state=selected]:text-purple-900 ${className}`}
        {...props}
    >
        {children}
    </tr>
);

export const TableHead = ({ children, className = '', ...props }) => (
    <th className={`h-10 px-4 text-left align-middle font-medium text-gray-600 border-b border-r border-gray-300 last:border-r-0 bg-gray-50 whitespace-nowrap ${className}`} {...props}>
        {children}
    </th>
);

export const TableCell = ({ children, className = '', ...props }) => (
    <td className={`p-1.5 align-middle border-b border-r border-gray-200 last:border-r-0 text-gray-700 [&:has([role=checkbox])]:pr-0 ${className}`} {...props}>
        {children}
    </td>
);


