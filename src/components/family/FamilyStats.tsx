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
    <Card className="group hover:shadow-lg hover:border-primary/30 transition-all duration-300 backdrop-blur-sm border-muted overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
            <p className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              {value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
            trend === 'up' ? 'bg-gradient-to-br from-green-500/20 to-green-600/10 text-green-600 shadow-lg shadow-green-500/20' :
            trend === 'down' ? 'bg-gradient-to-br from-red-500/20 to-red-600/10 text-red-600 shadow-lg shadow-red-500/20' :
            'bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-lg shadow-primary/20'
          }`}>
            <Icon className="h-6 w-6" />
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
