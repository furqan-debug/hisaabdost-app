import { Card, CardContent } from '@/components/ui/card';
import { Users, TrendingUp, Calendar, Activity } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
}

function StatCard({ title, value, icon: Icon, description, trend }: StatCardProps) {
  return (
    <Card className="group hover:shadow-md hover:border-primary/50 transition-all duration-200 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5 flex-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold">
              {value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={`p-2.5 rounded-lg transition-all ${
            trend === 'up' ? 'bg-green-500/10 text-green-600' :
            trend === 'down' ? 'bg-red-500/10 text-red-600' :
            'bg-primary/10 text-primary'
          }`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface FamilyStatsProps {
  memberCount: number;
  familyName: string;
  createdAt: string;
}

export function FamilyStats({ memberCount, familyName, createdAt }: FamilyStatsProps) {
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Family Name"
        value={familyName}
        icon={Users}
        description="Active family"
      />
      <StatCard
        title="Total Members"
        value={memberCount}
        icon={Users}
        description={`${memberCount} active ${memberCount === 1 ? 'member' : 'members'}`}
      />
      <StatCard
        title="Days Active"
        value={daysSinceCreation}
        icon={Calendar}
        description={`Since ${new Date(createdAt).toLocaleDateString()}`}
      />
      <StatCard
        title="Activity"
        value="Active"
        icon={Activity}
        description="All systems operational"
        trend="up"
      />
    </div>
  );
}
