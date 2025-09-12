import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Star, MessageSquare, TrendingUp, AlertCircle } from 'lucide-react';

interface FeedbackInsightsChartProps {
  data: {
    averageRating: number;
    totalFeedback: number;
    ratingDistribution: Array<{
      rating: number;
      count: number;
    }>;
    commonIssues: Array<{
      issue: string;
      count: number;
    }>;
  };
}

const RATING_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

export const FeedbackInsightsChart: React.FC<FeedbackInsightsChartProps> = ({ data }) => {
  if (!data || data.totalFeedback === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4" />
            <p>No feedback data available</p>
            <p className="text-sm mt-2">Feedback will appear here once employees complete their check-ins.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 3.5) return 'Good';
    if (rating >= 2.5) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="space-y-6">
      {/* Feedback Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRatingColor(data.averageRating)}`}>
              {data.averageRating}/5
            </div>
            <p className="text-xs text-muted-foreground">
              {getRatingLabel(data.averageRating)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalFeedback}</div>
            <p className="text-xs text-muted-foreground">Completed surveys</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totalFeedback > 0 ? Math.round((data.totalFeedback / (data.totalFeedback + 5)) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Estimated rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.ratingDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} responses`, 'Count']} />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>

            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.ratingDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ rating, count }: any) => `${rating}⭐ (${count})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.ratingDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RATING_COLORS[entry.rating - 1]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Common Issues */}
      {data.commonIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Common Issues Identified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.commonIssues.map((issue, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{issue.issue}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mentioned in feedback {issue.count} time{issue.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {issue.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.averageRating >= 4.0 ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Great job!</strong> Your onboarding program is performing well with an average rating of {data.averageRating}/5.
                </p>
              </div>
            ) : data.averageRating >= 3.0 ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Room for improvement:</strong> Consider addressing the common issues to boost satisfaction.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Action needed:</strong> The onboarding experience needs significant improvements based on feedback.
                </p>
              </div>
            )}

            {data.totalFeedback < 10 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>More data needed:</strong> Encourage more employees to complete feedback surveys for better insights.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};