"use client";

import { HTMLAttributes, forwardRef } from "react";

export interface LoadingProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "dots" | "pulse";
  text?: string;
  fullScreen?: boolean;
}

export const Loading = forwardRef<HTMLDivElement, LoadingProps>(
  (
    {
      size = "md",
      variant = "spinner",
      text,
      fullScreen = false,
      className = "",
      ...props
    },
    ref
  ) => {
    const sizes = {
      sm: "h-6 w-6",
      md: "h-8 w-8",
      lg: "h-12 w-12",
    };

    const containerStyles = fullScreen
      ? "fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
      : "flex items-center justify-center";

    if (variant === "spinner") {
      return (
        <div
          ref={ref}
          className={`${containerStyles} ${className}`}
          {...props}
          role="status"
          aria-live="polite"
          aria-label={text || "Carregando"}
        >
          <div className="relative">
            <svg className={`${sizes[size]} animate-spin text-navy`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {text && (
              <span className="sr-only">{text}</span>
            )}
          </div>
        </div>
      );
    }

    if (variant === "dots") {
      return (
        <div
          ref={ref}
          className={`${containerStyles} ${className}`}
          {...props}
          role="status"
          aria-live="polite"
          aria-label={text || "Carregando"}
        >
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full bg-navy animate-bounce`} style={{ animationDelay: "0ms" }} aria-hidden="true" />
            <span className={`w-2 h-2 rounded-full bg-navy animate-bounce`} style={{ animationDelay: "150ms" }} aria-hidden="true" />
            <span className={`w-2 h-2 rounded-full bg-navy animate-bounce`} style={{ animationDelay: "300ms" }} aria-hidden="true" />
          </div>
          {text && <span className="sr-only">{text}</span>}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={`${containerStyles} ${className}`}
        {...props}
        role="status"
        aria-live="polite"
        aria-label={text || "Carregando"}
      >
        <div className={`${sizes[size]} rounded-full border-4 border-slate-200 border-t-navy animate-spin`} aria-hidden="true" />
        {text && <span className="sr-only">{text}</span>}
      </div>
    );
  }
);

Loading.displayName = "Loading";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string;
  height?: string;
  lines?: number;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = "text",
      width,
      height,
      lines = 1,
      className = "",
      ...props
    },
    ref
  ) => {
    const baseStyles = "animate-pulse bg-slate-200 dark:bg-slate-700 rounded";

    if (variant === "circular") {
      return (
        <div
          ref={ref}
          className={`${baseStyles} rounded-full ${className}`}
          style={{ width: width || "2.5rem", height: height || "2.5rem" }}
          {...props}
          aria-hidden="true"
        />
      );
    }

    if (variant === "rectangular") {
      return (
        <div
          ref={ref}
          className={`${baseStyles} ${className}`}
          style={{ width: width || "100%", height: height || "1rem" }}
          {...props}
          aria-hidden="true"
        />
      );
    }

    return (
      <div ref={ref} className={className} {...props} aria-hidden="true">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseStyles} mb-2 ${i === lines - 1 ? "w-3/4" : "w-full"}`}
            style={{ height: "1rem" }}
          />
        ))}
      </div>
    );
  }
);

Skeleton.displayName = "Skeleton";

export const PageSkeleton = () => (
  <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6" aria-hidden="true">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton variant="rectangular" width="30%" height="1.5rem" />
        <Skeleton variant="rectangular" width="40%" height="1rem" />
      </div>
      <Skeleton variant="circular" width="3rem" height="3rem" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <Skeleton variant="rectangular" width="20%" height="0.75rem" />
          <Skeleton variant="rectangular" width="100%" height="2.5rem" className="mt-2" />
        </div>
      ))}
    </div>
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <Skeleton variant="rectangular" width="30%" height="1rem" className="mb-4" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-200 dark:border-slate-700 p-5">
            <Skeleton variant="rectangular" width="25%" height="0.75rem" />
            <Skeleton variant="rectangular" width="100%" height="2rem" className="mt-2" />
            <Skeleton variant="rectangular" width="60%" height="0.75rem" className="mt-2" />
          </div>
        ))}
      </div>
    </div>
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <Skeleton variant="rectangular" width="30%" height="1rem" className="mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <Skeleton variant="rectangular" width="40%" height="1rem" />
            <Skeleton variant="rectangular" width="60%" height="0.875rem" className="mt-2" />
            <Skeleton variant="rectangular" width="30%" height="0.75rem" className="mt-2" />
          </div>
        ))}
      </div>
    </div>
  </div>
);