'use client';

import React, { useEffect, useState } from 'react';

interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  gradientFrom?: string;
  gradientTo?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  displayValue?: string;
}

export default function ProgressRing({
  value,
  max,
  size = 160,
  strokeWidth = 12,
  gradientFrom = '#3b82f6',
  gradientTo = '#6366f1',
  trackColor = '#e5e7eb',
  label,
  sublabel,
  displayValue,
}: ProgressRingProps) {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = max > 0 ? Math.min(value / max, 1) : 0;
  const strokeDashoffset = circumference - animatedPercent * circumference;

  // Unique ID for gradient (supports multiple rings on same page)
  const gradientId = `ring-gradient-${gradientFrom.replace('#', '')}-${gradientTo.replace('#', '')}`;

  useEffect(() => {
    // Animate the ring filling
    const timer = setTimeout(() => {
      setAnimatedPercent(percent);
    }, 100);
    return () => clearTimeout(timer);
  }, [percent]);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={gradientFrom} />
              <stop offset="100%" stopColor={gradientTo} />
            </linearGradient>
            {/* Glow filter */}
            <filter id={`${gradientId}-glow`}>
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
            className="dark:opacity-20 opacity-40"
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            filter={`url(#${gradientId}-glow)`}
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
            {displayValue ?? value}
          </span>
          {label && (
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
              {label}
            </span>
          )}
        </div>
      </div>
      {sublabel && (
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-3">
          {sublabel}
        </span>
      )}
    </div>
  );
}
