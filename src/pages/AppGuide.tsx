import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Wallet, PieChart, Target, TrendingUp, Bot, Receipt, Calendar, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LanguageProvider, useLanguage } from '@/hooks/use-language';
import { LanguageSelector } from '@/components/LanguageSelector';
import { getTranslation } from '@/utils/translations';

const AppGuideContent = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const t = (key: string) => getTranslation(language, key);

  const features = [
    {
      icon: Wallet,
      title: t('features.dashboard.title'),
      purpose: t('features.dashboard.purpose'),
      description: t('features.dashboard.description'),
      howTo: t('features.dashboard.howTo'),
      whyItMatters: t('features.dashboard.whyItMatters')
    },
    {
      icon: Receipt,
      title: t('features.expenses.title'),
      purpose: t('features.expenses.purpose'),
      description: t('features.expenses.description'),
      howTo: t('features.expenses.howTo'),
      whyItMatters: t('features.expenses.whyItMatters')
    },
    {
      icon: PieChart,
      title: "Analytics & Insights",
      purpose: "Transform data into wisdom",
      description: "Advanced analytics reveal spending patterns, group similar expenses, and provide actionable insights about your financial behavior.",
      howTo: [
        "Review smart expense groups to find patterns",
        "Analyze top individual expenses for big wins",
        "Compare monthly spending trends",
        "Get alerts about unusual spending behavior"
      ],
      whyItMatters: "Raw data is useless without context. Analytics help you spot trends, identify problems, and discover opportunities to save money or optimize spending."
    },
    {
      icon: Target,
      title: "Budget Management",
      purpose: "Set boundaries and stay on track",
      description: "Create category-based budgets to control spending and achieve financial goals. Get alerts when you're approaching limits.",
      howTo: [
        "Set monthly budgets for each spending category",
        "Monitor progress with visual indicators",
        "Receive notifications when approaching limits",
        "Review budget vs actual spending regularly"
      ],
      whyItMatters: "Budgets aren't restrictions—they're permission to spend on what matters most. They prevent lifestyle inflation and ensure you're allocating money according to your priorities."
    },
    {
      icon: TrendingUp,
      title: "Financial Goals",
      purpose: "Turn dreams into plans",
      description: "Set specific financial targets with deadlines and track progress. Whether saving for vacation or building an emergency fund.",
      howTo: [
        "Create goals with specific amounts and deadlines",
        "Track progress with visual progress bars",
        "Get motivated with achievement milestones",
        "Adjust goals as circumstances change"
      ],
      whyItMatters: "Goals without deadlines are just wishes. Specific, measurable goals with tracking create accountability and motivation to make financial progress."
    },
    {
      icon: Bot,
      title: "Finny AI Assistant",
      purpose: "Your personal financial advisor",
      description: "AI-powered assistant that understands your financial situation and provides personalized advice, insights, and helps with expense management.",
      howTo: [
        "Ask questions about your spending patterns",
        "Get personalized financial advice",
        "Receive proactive insights and alerts",
        "Use natural language to add expenses quickly"
      ],
      whyItMatters: "Having a financial advisor in your pocket means getting instant, personalized guidance based on your actual data, not generic advice."
    },
    {
      icon: Calendar,
      title: "Monthly Summaries",
      purpose: "Learn from your financial history",
      description: "Review past months' financial performance to identify trends, celebrate progress, and plan improvements.",
      howTo: [
        "Review monthly expense summaries",
        "Compare performance across months",
        "Identify seasonal spending patterns",
        "Export data for tax preparation"
      ],
      whyItMatters: "Financial success comes from learning from the past. Monthly reviews help you understand what works, what doesn't, and how to improve."
    },
    {
      icon: Settings,
      title: "Personalization",
      purpose: "Make the app work for you",
      description: "Customize currency, income dates, themes, and other settings to match your lifestyle and preferences.",
      howTo: [
        "Set your preferred currency and format",
        "Configure income date to match your pay schedule",
        "Choose themes for comfortable viewing",
        "Manage notification preferences"
      ],
      whyItMatters: "Personal finance is personal. Customizing the app to your situation makes it more relevant and increases the likelihood you'll use it consistently."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate(-1)}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground">{t('subtitle')}</p>
              </div>
            </div>
            <LanguageSelector />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Introduction */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {t('welcomeTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {t('welcomeDescription')}
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="space-y-6">
          {features.map((feature, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl">{feature.title}</h3>
                    <p className="text-sm text-primary font-medium">{feature.purpose}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-foreground">How to use it:</h4>
                    <ul className="space-y-1">
                      {Array.isArray(feature.howTo) ? feature.howTo.map((item, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 flex-shrink-0" />
                          {item}
                        </li>
                      )) : (
                        <li className="text-sm text-muted-foreground flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 flex-shrink-0" />
                          {feature.howTo}
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-foreground">Why it matters:</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 p-3 rounded-lg">
                      {feature.whyItMatters}
                    </p>
                  </div>
                </div>

                {index < features.length - 1 && (
                  <Separator className="mt-6" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <Card className="mt-8 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50">
          <CardContent className="p-6 text-center">
            <div className="space-y-2">
              <h3 className="font-semibold text-green-800 dark:text-green-200">{t('footerTitle')}</h3>
              <p className="text-sm text-green-700 dark:text-green-300 max-w-2xl mx-auto">
                {t('footerDescription')}
              </p>
              <Button 
                onClick={() => navigate('/app/dashboard')}
                className="mt-4 bg-green-600 hover:bg-green-700"
              >
                {t('startButton')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function AppGuide() {
  return (
    <LanguageProvider>
      <AppGuideContent />
    </LanguageProvider>
  );
}
