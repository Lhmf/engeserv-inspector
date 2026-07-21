"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface UserAvatarProps {
  name?: string;
  email?: string;
  src?: string;
  fallback?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showStatus?: boolean;
  status?: "online" | "offline" | "busy" | "away";
}

const sizeClasses = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-12 h-12 text-lg",
  xl: "w-16 h-16 text-xl",
};

const statusSize = {
  xs: "w-1.5 h-1.5",
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
  xl: "w-4 h-4",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getColorFromName(name: string): string {
  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-purple-500",
    "bg-cyan-500",
    "bg-indigo-500",
    "bg-orange-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function UserAvatar({
  name,
  email,
  src,
  fallback,
  size = "md",
  className,
  showStatus = false,
  status = "offline",
}: UserAvatarProps) {
  const initials = name ? getInitials(name) : fallback || "?";
  const bgColor = name ? getColorFromName(name) : "bg-slate-400";

  const statusColors = {
    online: "bg-emerald-500",
    offline: "bg-slate-400",
    busy: "bg-rose-500",
    away: "bg-amber-500",
  };

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      {src ? (
        <Image
          src={src}
          alt={name || "User"}
          width={parseInt(sizeClasses[size].replace("w-", "")) * 4}
          height={parseInt(sizeClasses[size].replace("h-", "")) * 4}
          className={cn("rounded-full object-cover ring-2 ring-white", sizeClasses[size])}
        />
      ) : (
        <div
          className={cn(
            "rounded-full flex items-center justify-center font-medium text-white ring-2 ring-white",
            sizeClasses[size],
            bgColor
          )}
        >
          {initials}
        </div>
      )}

      {showStatus && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-white",
            statusSize[size],
            statusColors[status]
          )}
          aria-label={status}
        />
      )}
    </div>
  );
}

export function UserMenuAvatar({
  name,
  email,
  role,
  src,
  size = "md",
  className,
}: {
  name?: string;
  email?: string;
  role?: string;
  src?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const initials = name ? getInitials(name) : "?";
  const bgColor = name ? getColorFromName(name) : "bg-slate-400";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("rounded-full flex items-center justify-center font-medium text-white", sizeClasses[size], bgColor)}>
        {src ? (
          <Image
            src={src}
            alt={name || "User"}
            width={parseInt(sizeClasses[size].replace("w-", "")) * 4}
            height={parseInt(sizeClasses[size].replace("h-", "")) * 4}
            className="rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 truncate">{name || "Usuário"}</p>
        <p className="text-xs text-slate-500 truncate">{email || ""}</p>
        {role && (
          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
            {role}
          </span>
        )}
      </div>
    </div>
  );
}