"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, FileDown, MessageSquareText, Users, Clock, Hash, Layers, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { getSelectedCourseId, getCourse, getCoursesByProfessor } from '@/lib/course-management';
import { getCourseAnalytics, getMostAskedQuestions, getQuestionActivity, getPeakActivityHours, getTopTopics } from '@/lib/analytics';
// @ts-ignore - recharts has type issues with Next.js
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { format } from 'date-fns';

interface ProfessorAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfessorAnalytics({ isOpen, onClose }: ProfessorAnalyticsProps) {
  const [analytics, setAnalytics] = useState<{ totalQuestions: number; uniqueStudents: number; activeDays: number; avgQuestionsPerDay: number } | null>(null);
  const [mostAskedQuestions, setMostAskedQuestions] = useState<Array<{ question: string; count: number }>>([]);
  const [questionActivity, setQuestionActivity] = useState<Array<{ date: string; count: number }>>([]);
  const [peakActivityHours, setPeakActivityHours] = useState<Array<{ hour: number; count: number }>>([]);
  const [topTopics, setTopTopics] = useState<Array<{ topic: string; count: number }>>([]);
  const [allCourses, setAllCourses] = useState<import('@/types').Course[]>([]);
  const [currentCourse, setCurrentCourse] = useState<import('@/types').Course | null>(null);
  const [selectedCourseForAnalytics, setSelectedCourseForAnalytics] = useState<string | null>(getSelectedCourseId());

  const currentCourseId = selectedCourseForAnalytics || getSelectedCourseId();

  const loadAnalytics = useCallback(async () => {
    const { getCurrentUser } = await import('@/lib/user-auth');
    const user = getCurrentUser();
    const courses = user ? await getCoursesByProfessor(user.id) : [];
    setAllCourses(courses);
    if (currentCourseId) {
      const course = await getCourse(currentCourseId);
      setCurrentCourse(course);
      const [analyticsData, asked, activity, hours, topics] = await Promise.all([
        getCourseAnalytics(currentCourseId),
        getMostAskedQuestions(currentCourseId, 15),
        getQuestionActivity(currentCourseId, 30),
        getPeakActivityHours(currentCourseId),
        getTopTopics(currentCourseId, 15),
      ]);
      setAnalytics(analyticsData);
      setMostAskedQuestions(asked);
      setQuestionActivity(activity);
      setPeakActivityHours(hours);
      setTopTopics(topics);
    } else {
      setCurrentCourse(null);
      setAnalytics(null);
      setMostAskedQuestions([]);
      setQuestionActivity([]);
      setPeakActivityHours([]);
      setTopTopics([]);
    }
  }, [currentCourseId]);

  useEffect(() => {
    if (isOpen) {
      loadAnalytics();
      const handleAnalyticsChange = () => loadAnalytics();
      window.addEventListener('analytics-change', handleAnalyticsChange);
      window.addEventListener('course-change', handleAnalyticsChange);
      window.addEventListener('selected-course-change', handleAnalyticsChange);
      return () => {
        window.removeEventListener('analytics-change', handleAnalyticsChange);
        window.removeEventListener('course-change', handleAnalyticsChange);
        window.removeEventListener('selected-course-change', handleAnalyticsChange);
      };
    }
  }, [isOpen, loadAnalytics]);

  const downloadAnalyticsReport = () => {
    if (!analytics || !currentCourse) {
      return;
    }

    let report = `Analytics Report for Course: ${currentCourse.name}\n`;
    report += `Generated On: ${new Date().toLocaleString()}\n\n`;

    report += '--- Overview ---\n';
    report += `Total Questions Asked: ${analytics.totalQuestions}\n`;
    report += `Unique Students: ${analytics.uniqueStudents}\n`;
    report += `Active Days: ${analytics.activeDays}\n`;
    report += `Average Questions per Day: ${analytics.avgQuestionsPerDay.toFixed(2)}\n\n`;

    report += '--- Most Asked Questions ---\n';
    if (mostAskedQuestions.length > 0) {
      mostAskedQuestions.forEach((q, i) => {
        report += `${i + 1}. "${q.question}" (Asked ${q.count} times)\n`;
      });
    } else {
      report += 'No questions asked yet.\n';
    }
    report += '\n';

    report += '--- Question Activity (Last 30 Days) ---\n';
    if (questionActivity.length > 0) {
      questionActivity.forEach(data => {
        report += `${data.date}: ${data.count} questions\n`;
      });
    } else {
      report += 'No activity in the last 30 days.\n';
    }
    report += '\n';

    report += '--- Peak Activity Hours ---\n';
    if (peakActivityHours.length > 0) {
      peakActivityHours.forEach(data => {
        report += `Hour ${data.hour}: ${data.count} questions\n`;
      });
    } else {
      report += 'No peak activity data.\n';
    }
    report += '\n';

    report += '--- Top Topics/Keywords ---\n';
    if (topTopics.length > 0) {
      topTopics.forEach((topic, i) => {
        report += `${i + 1}. ${topic.topic} (Count: ${topic.count})\n`;
      });
    } else {
      report += 'No topics identified yet.\n';
    }
    report += '\n';

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentCourse.name.replace(/[^a-z0-9]/gi, '_')}_Analytics_Report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const COLORS = ['#57068C', '#7c3aed', '#a855f7', '#c084fc', '#e9d5ff', '#f3e8ff'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="relative w-full max-w-7xl max-h-[95vh] overflow-hidden bg-white dark:bg-gray-900 shadow-2xl rounded-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#57068C] to-purple-600 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Course Analytics</h2>
              <p className="text-sm text-muted-foreground">Comprehensive insights and engagement metrics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedCourseForAnalytics || ''}
              onChange={(e) => setSelectedCourseForAnalytics(e.target.value)}
              className="w-[220px] h-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#57068C]"
            >
              <option value="">Select Course</option>
              {allCourses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
            {analytics && currentCourse && (
              <Button
                onClick={downloadAnalyticsReport}
                variant="outline"
                className="rounded-xl"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!currentCourseId ? (
            <div className="text-center py-20">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">No Course Selected</h3>
              <p className="text-muted-foreground">Please select a course to view analytics.</p>
            </div>
          ) : !analytics || analytics.totalQuestions === 0 ? (
            <div className="text-center py-20">
              <MessageSquareText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">No Data Available</h3>
              <p className="text-muted-foreground">Students haven&apos;t asked questions yet. Data will appear once students start engaging with your course.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Questions</p>
                    <MessageSquareText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-purple-900 dark:text-purple-100">{analytics.totalQuestions}</h3>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">All time</p>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Unique Students</p>
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-blue-900 dark:text-blue-100">{analytics.uniqueStudents}</h3>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Active learners</p>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Active Days</p>
                    <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-green-900 dark:text-green-100">{analytics.activeDays}</h3>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">Days with activity</p>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 border-orange-200 dark:border-orange-800">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Avg Questions/Day</p>
                    <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-orange-900 dark:text-orange-100">{analytics.avgQuestionsPerDay.toFixed(1)}</h3>
                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">Daily average</p>
                </Card>
              </div>

              {/* Activity Chart */}
              <Card className="p-6 shadow-lg">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#57068C]" /> Question Activity Over Time
                </h3>
                <p className="text-sm text-muted-foreground mb-6">Last 30 days of student engagement</p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={questionActivity}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#57068C" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#57068C" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(dateStr) => format(new Date(dateStr), 'MMM d')}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        labelFormatter={(dateStr) => format(new Date(dateStr), 'MMMM d, yyyy')}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#57068C" 
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorCount)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Peak Activity Hours */}
                <Card className="p-6 shadow-lg">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#57068C]" /> Peak Activity Hours
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">When students are most active</p>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={peakActivityHours}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                        <XAxis 
                          dataKey="hour" 
                          tickFormatter={(hour) => `${hour}:00`}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          labelFormatter={(hour) => `${hour}:00 - ${hour}:59`}
                        />
                        <Bar dataKey="count" fill="#57068C" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Top Topics Pie Chart */}
                <Card className="p-6 shadow-lg">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-[#57068C]" /> Top Topics Distribution
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">Most discussed topics</p>
                  <div className="h-80">
                    {topTopics.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={topTopics.slice(0, 6)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry: any) => `${entry.topic} (${(entry.percent * 100).toFixed(0)}%)`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {topTopics.slice(0, 6).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              borderColor: 'hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No topic data available
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Most Asked Questions */}
              <Card className="p-6 shadow-lg">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Hash className="h-5 w-5 text-[#57068C]" /> Most Frequently Asked Questions
                </h3>
                <p className="text-sm text-muted-foreground mb-6">Top questions from your students</p>
                {mostAskedQuestions.length > 0 ? (
                  <div className="space-y-3">
                    {mostAskedQuestions.map((q, i) => (
                      <div 
                        key={i} 
                        className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#57068C] text-white flex items-center justify-center font-bold text-sm">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">{q.question}</p>
                          <p className="text-xs text-muted-foreground">Asked {q.count} time{q.count !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                            {q.count}x
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No questions recorded yet</p>
                )}
              </Card>

              {/* All Topics */}
              <Card className="p-6 shadow-lg">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-[#57068C]" /> All Topics & Keywords
                </h3>
                <p className="text-sm text-muted-foreground mb-6">Topics students are asking about</p>
                {topTopics.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {topTopics.map((topic, i) => (
                      <span 
                        key={i} 
                        className="px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium border border-purple-200 dark:border-purple-800"
                      >
                        {topic.topic} <span className="text-xs opacity-75">({topic.count})</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No topics identified yet</p>
                )}
              </Card>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

