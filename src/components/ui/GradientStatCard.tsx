'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface GradientStatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  gradient: 'blue' | 'emerald' | 'purple' | 'orange' | 'red' | 'cyan' | 'amber';
  trend?: {
    value: string;
    positive: boolean;
  };
}

const GRADIENT_THEMES = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent dark:from-blue-500/20 dark:via-blue-500/5',
    iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
    iconShadow: 'shadow-blue-500/30',
    border: 'border-blue-100 dark:border-blue-900/40',
    text: 'text-blue-600 dark:text-blue-400',
    bar: 'bg-gradient-to-r from-blue-500 to-blue-400',
  },
  emerald: {
    bg: 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/20 dark:via-emerald-500/5',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    iconShadow: 'shadow-emerald-500/30',
    border: 'border-emerald-100 dark:border-emerald-900/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    bar: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent dark:from-purple-500/20 dark:via-purple-500/5',
    iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
    iconShadow: 'shadow-purple-500/30',
    border: 'border-purple-100 dark:border-purple-900/40',
    text: 'text-purple-600 dark:text-purple-400',
    bar: 'bg-gradient-to-r from-purple-500 to-purple-400',
  },
  orange: {
    bg: 'bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent dark:from-orange-500/20 dark:via-orange-500/5',
    iconBg: 'bg-gradient-to-br from-orange-500 to-orange-600',
    iconShadow: 'shadow-orange-500/30',
    border: 'border-orange-100 dark:border-orange-900/40',
    text: 'text-orange-600 dark:text-orange-400',
    bar: 'bg-gradient-to-r from-orange-500 to-orange-400',
  },
  red: {
    bg: 'bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent dark:from-red-500/20 dark:via-red-500/5',
    iconBg: 'bg-gradient-to-br from-red-500 to-red-600',
    iconShadow: 'shadow-red-500/30',
    border: 'border-red-100 dark:border-red-900/40',
    text: 'text-red-600 dark:text-red-400',
    bar: 'bg-gradient-to-r from-red-500 to-red-400',
  },
  cyan: {
    bg: 'bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent dark:from-cyan-500/20 dark:via-cyan-500/5',
    iconBg: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
    iconShadow: 'shadow-cyan-500/30',
    border: 'border-cyan-100 dark:border-cyan-900/40',
    text: 'text-cyan-600 dark:text-cyan-400',
    bar: 'bg-gradient-to-r from-cyan-500 to-cyan-400',
  },
  amber: {
    bg: 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/20 dark:via-amber-500/5',
    iconBg: 'bg-gradient-to-br from-amber-500 to-amber-600',
    iconShadow: 'shadow-amber-500/30',
    border: 'border-amber-100 dark:border-amber-900/40',
    text: 'text-amber-600 dark:text-amber-400',
    bar: 'bg-gradient-to-r from-amber-500 to-amber-400',
  },
};

export default function GradientStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  trend,
}: GradientStatCardProps) {
  const theme = GRADIENT_THEMES[gradient];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${theme.border} ${theme.bg} p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group`}
    >
      {/* Decorative gradient orb */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-2xl group-hover:opacity-30 transition-opacity"
        style={{
          background: `radial-gradient(circle, ${
            gradient === 'blue' ? '#3b82f6' :
            gradient === 'emerald' ? '#10b981' :
            gradient === 'purple' ? '#8b5cf6' :
            gradient === 'orange' ? '#f97316' :
            gradient === 'red' ? '#ef4444' :
            gradient === 'cyan' ? '#06b6d4' :
            '#f59e0b'
          }, transparent)`
        }}
      />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
            {title}
          </p>
          <p className="text-3xl font-black text-slate-900 dark:text-white truncate leading-none">
            {value}
          </p>
          <div className="flex items-center mt-3 space-x-2">
            {trend && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                trend.positive 
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
              }`}>
                {trend.positive ? '↑' : '↓'} {trend.value}
              </span>
            )}
            <p className={`text-xs font-bold ${theme.text}`}>
              {subtitle}
            </p>
          </div>
        </div>

        <div className={`flex-shrink-0 p-3 rounded-2xl ${theme.iconBg} shadow-lg ${theme.iconShadow} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* Bottom accent bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className={`h-full ${theme.bar}`} />
      </div>
    </div>
  );
}
