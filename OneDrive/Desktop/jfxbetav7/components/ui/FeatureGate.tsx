import React from 'react';
import { UserProfile } from '../../types';
import { APP_CONSTANTS, PLAN_FEATURES } from "../../lib/constants";

import { Lock } from 'lucide-react';
import { Card } from "./Card";
import { Button } from "./Button";


interface FeatureGateProps {
  feature: keyof typeof PLAN_FEATURES[typeof APP_CONSTANTS.PLANS.FREE];
  userProfile: UserProfile | null | undefined;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  variant?: 'inline' | 'block' | 'card';
  title?: string;
  description?: string;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  userProfile,
  children,
  fallback,
  variant = 'block',
  title = 'Feature Locked',
  description = 'This feature is available on higher tier plans.',
}) => {
  const currentPlan = userProfile?.plan || APP_CONSTANTS.PLANS.FREE;
  const hasAccess = PLAN_FEATURES[currentPlan as keyof typeof PLAN_FEATURES]?.[feature] ?? false;

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (variant === 'card') {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
        <div className="p-3 rounded-full bg-amber-500/10 text-amber-500 mb-4">
          <Lock size={24} />
        </div>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-zinc-500 mb-6 max-w-xs">{description}</p>
        <Button variant="primary" size="sm">
          Upgrade to Unlock
        </Button>
      </Card>
    );
  }

  if (variant === 'inline') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-widest border border-amber-500/20">
        <Lock size={10} /> PRO
      </span>
    );
  }

  return (
    <div className="relative group overflow-hidden rounded-xl border border-dashed border-zinc-700/50 p-6 flex flex-col items-center justify-center text-center opacity-60">
      <Lock size={20} className="text-amber-500 mb-2" />
      <p className="text-xs font-bold uppercase tracking-widest opacity-40">{title}</p>
    </div>
  );
};
