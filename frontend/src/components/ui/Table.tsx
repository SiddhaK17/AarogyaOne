import React from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data available.',
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-slate-400 font-medium">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/80">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/70">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 ${
                  col.className || ''
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              className="hover:bg-slate-50/50 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-5 py-4 text-slate-700 font-medium ${
                    col.className || ''
                  }`}
                >
                  {col.render
                    ? col.render(row)
                    : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
