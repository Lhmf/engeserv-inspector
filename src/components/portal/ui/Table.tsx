"use client";

import { HTMLAttributes, forwardRef } from "react";

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  variant?: "default" | "striped" | "bordered";
  size?: "sm" | "md";
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ variant = "default", size = "md", className = "", children, ...props }, ref) => {
    const variants = {
      default: "",
      striped: "",
      bordered: "",
    };

    const sizes = {
      sm: "text-xs",
      md: "text-sm",
    };

    return (
      <div className="overflow-x-auto">
        <table
          ref={ref}
          className={`w-full ${sizes[size]} ${className}`}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  }
);

Table.displayName = "Table";

export interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {}

export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className = "", children, ...props }, ref) => (
    <thead
      ref={ref}
      className={`bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 ${className}`}
      {...props}
    >
      {children}
    </thead>
  )
);

TableHeader.displayName = "TableHeader";

export interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {}

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className = "", children, ...props }, ref) => (
    <tbody
      ref={ref}
      className={`divide-y divide-slate-200 dark:divide-slate-700 ${className}`}
      {...props}
    >
      {children}
    </tbody>
  )
);

TableBody.displayName = "TableBody";

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  hover?: boolean;
  clickable?: boolean;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ hover = true, clickable = false, className = "", children, ...props }, ref) => (
    <tr
      ref={ref}
      className={`
        ${hover ? "hover:bg-slate-50 dark:hover:bg-slate-800/50" : ""}
        ${clickable ? "cursor-pointer" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </tr>
  )
);

TableRow.displayName = "TableRow";

export interface TableHeadProps extends HTMLAttributes<HTMLTableCellElement> {
  width?: string;
}

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ width, className = "", children, ...props }, ref) => (
    <th
      ref={ref}
      scope="col"
      style={{ width }}
      className={`px-4 py-3 text-left font-medium text-slate-500 ${className}`}
      {...props}
    >
      {children}
    </th>
  )
);

TableHead.displayName = "TableHead";

export interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  width?: string;
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ width, className = "", children, ...props }, ref) => (
    <td
      ref={ref}
      style={{ width }}
      className={`px-4 py-3 text-slate-600 dark:text-slate-300 ${className}`}
      {...props}
    >
      {children}
    </td>
  )
);

TableCell.displayName = "TableCell";