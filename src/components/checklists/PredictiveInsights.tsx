import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Target,
  Calendar,
  Users,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface Prediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  timeframe: string;
}

interface Insight {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'performance' | 'efficiency' | 'quality' | 'risk';
  actionable: boolean;
  recommendedAction?: string;
}

interface ForecastData {
  period: string;
  actual?: number;
  predicted: number;
  confidence: number;
}

const mockPredictions: Prediction[] = [
  {
    metric: 'Completion Rate',
    currentValue: 87.3,
    predictedValue: 91.2,
    confidence: 85,
    trend: 'up',
    timeframe: 'Next 30 days'
  },
  {
    metric: 'Quality Score',
    currentValue: 84.1,
    predictedValue: 82.8,
    confidence: 78,
    trend: 'down',
    timeframe: 'Next 30 days'
  },
  {
    metric: 'Team Efficiency',
    currentValue: 76.5,
    predictedValue: 79.3,
    confidence: 92,
    trend: 'up',
    timeframe: 'Next 30 days'
  },
  {
    metric: 'Critical Issues',
    currentValue: 3.2,
    predictedValue: 2.8,
    confidence: 71,
    trend: 'down',
    timeframe: 'Next 30 days'
  }
];

const mockInsights: Insight[] = [
  {
    id: '1',
    title: 'Peak Performance Window Identified',
    description: 'Team shows 23% higher completion rates between 10 AM - 2 PM',
    impact: 'high',
    category: 'performance',
    actionable: true,
    recommendedAction: 'Schedule critical checklists during peak hours'
  },
  {
    id: '2',
    title: 'Quality Score Decline Pattern',
    description: 'Friday afternoon scores are consistently 15% lower than average',
    impact: 'medium',
    category: 'quality',
    actionable: true,
    recommendedAction: 'Implement Friday quality checkpoints'
  },
  {
    id: '3',
    title: 'Training Opportunity Detected',
    description: 'Sales team shows potential for 12% improvement with targeted training',
    impact: 'high',
    category: 'efficiency',
    actionable: true,
    recommendedAction: 'Design specialized training program'
  },
  {
    id: '4',
    title: 'Risk Pattern in Compliance Tasks',
    description: 'Compliance checklists show increasing delay patterns',
    impact: 'high',
    category: 'risk',
    actionable: true,
    recommendedAction: 'Implement automated compliance reminders'
  }
];

const mockForecastData: ForecastData[] = [
  { period: 'Week -4', actual: 82.1, predicted: 82.1, confidence: 100 },
  { period: 'Week -3', actual: 84.3, predicted: 84.3, confidence: 100 },
  { period: 'Week -2', actual: 86.7, predicted: 86.7, confidence: 100 },
  { period: 'Week -1', actual: 87.3, predicted: 87.3, confidence: 100 },
  { period: 'This Week', actual: 89.1, predicted: 89.1, confidence: 100 },
  { period: 'Week +1', predicted: 90.2, confidence: 92 },
  { period: 'Week +2', predicted: 91.1, confidence: 87 },
  { period: 'Week +3', predicted: 91.8, confidence: 82 },
  { period: 'Week +4', predicted: 92.3, confidence: 76 }
];

const PredictiveInsights: React.FC = () => {
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      case 'stable':
        return <Target className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      case 'low': return 'text-success';
    }
  };

  const getImpactBadge = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'outline';
      case 'low': return 'secondary';
    }
  };

  const getCategoryIcon = (category: 'performance' | 'efficiency' | 'quality' | 'risk') => {
    switch (category) {
      case 'performance':
        return <TrendingUp className="h-4 w-4" />;
      case 'efficiency':
        return <Zap className="h-4 w-4" />;
      case 'quality':
        return <Target className="h-4 w-4" />;
      case 'risk':
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Predictive Insights</h2>
          <p className="text-muted-foreground">AI-powered predictions and actionable recommendations</p>
        </div>
      </div>

      {/* Predictions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockPredictions.map((prediction, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{prediction.metric}</span>
                  {getTrendIcon(prediction.trend)}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{prediction.currentValue}%</span>
                    <span className="text-sm text-muted-foreground">current</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg font-semibold text-primary">{prediction.predictedValue}%</span>
                    <span className="text-sm text-muted-foreground">predicted</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Confidence</span>
                    <span>{prediction.confidence}%</span>
                  </div>
                  <Progress value={prediction.confidence} className="h-2" />
                </div>
                <p className="text-xs text-muted-foreground">{prediction.timeframe}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Performance Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockForecastData}>
                <defs>
                  <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="predictedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="period" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#actualGradient)"
                  strokeWidth={2}
                  connectNulls={false}
                />
                <Area
                  type="monotone"
                  dataKey="predicted"
                  stroke="hsl(var(--secondary))"
                  strokeDasharray="5 5"
                  fillOpacity={1}
                  fill="url(#predictedGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded"></div>
              <span>Historical Data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-secondary rounded border-2 border-secondary" style={{ 
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, hsl(var(--background)) 2px, hsl(var(--background)) 4px)' 
              }}></div>
              <span>Predicted Trend</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Generated Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockInsights.map((insight) => (
              <div key={insight.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(insight.category)}
                    <h3 className="font-semibold">{insight.title}</h3>
                  </div>
                  <Badge variant={getImpactBadge(insight.impact)}>
                    {insight.impact.toUpperCase()} IMPACT
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
                {insight.actionable && insight.recommendedAction && (
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-sm">
                      <span className="font-medium text-primary">Recommended Action:</span> {insight.recommendedAction}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictiveInsights;