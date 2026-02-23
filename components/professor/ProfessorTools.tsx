"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FileText, FileDown, Sparkles, BookOpen, Users, BarChart3, 
  TrendingUp, Clock, MessageSquare, Award, Activity, Download,
  Calendar, Target, Zap, Eye
} from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { getSelectedCourseId, getAllCourses, getCourse } from '@/lib/course-management';
import { getSelectedModel } from '@/lib/models';
import {
  getMostAskedQuestions,
  getQuestionFrequency,
  getUniqueStudentCount,
  getEngagementStats,
  getAllCourseStats,
  getPeakHours,
  getQuestionCategories,
  getCourseQuestions,
} from '@/lib/analytics';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface GeneratedQuiz {
  title: string;
  questions: QuizQuestion[];
  courseId: string;
  courseName: string;
  createdAt: Date;
}

export function ProfessorTools() {
  const [activeTab, setActiveTab] = useState<'quiz' | 'analytics' | 'materials' | 'insights'>('analytics');
  const [generating, setGenerating] = useState(false);
  const [quizTopic, setQuizTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  const courseId = selectedCourseId || getSelectedCourseId();
  const model = getSelectedModel();
  const [courses, setCourses] = useState<import('@/types').Course[]>([]);
  const [allCourseStats, setAllCourseStats] = useState<import('@/lib/analytics').EngagementStats[]>([]);

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => {
    getAllCourses().then(setCourses);
    getAllCourseStats().then(setAllCourseStats);
  }, []);

  const loadAnalytics = async () => {
    if (!courseId) {
      setAnalyticsData(null);
      return;
    }

    const course = await getCourse(courseId);
    if (!course) return;

    const [stats, mostAsked, frequency, peakHours, categories, uniqueStudents, allQuestions] = await Promise.all([
      getEngagementStats(courseId, course.name),
      getMostAskedQuestions(courseId, 10),
      getQuestionFrequency(courseId, 30),
      getPeakHours(courseId),
      getQuestionCategories(courseId, 10),
      getUniqueStudentCount(courseId),
      getCourseQuestions(courseId),
    ]);

    setAnalyticsData({
      stats,
      mostAsked,
      frequency,
      peakHours,
      categories,
      uniqueStudents,
      totalQuestions: allQuestions.length,
      course: course,
    });
  };

  const handleGenerateQuiz = async () => {
    if (!courseId) {
      toast({
        title: 'No Course Selected',
        description: 'Please select a course first',
        variant: 'destructive',
      });
      return;
    }

    if (!quizTopic.trim()) {
      toast({
        title: 'Topic Required',
        description: 'Please enter a topic for the quiz',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    try {
      const course = courseId ? await getCourse(courseId) : null;
      const courseFiles = courseId ? await (await import('@/lib/course-management')).getCourseFiles(courseId) : [];
      const fileIds = courseFiles.map(cf => cf.fileId);

      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: quizTopic,
          numQuestions,
          difficulty,
          courseId,
          courseName: course?.name || 'Course',
          fileIds,
          model,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate quiz');
      }

      const data = await response.json();
      setGeneratedQuiz(data.quiz);
      toast({
        title: 'Quiz Generated',
        description: `Successfully generated ${data.quiz.questions.length} questions`,
        variant: 'success',
      });
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate quiz',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleExportAnalytics = () => {
    if (!analyticsData) return;

    const report = `Course Analytics Report: ${analyticsData.course.name}
Generated: ${new Date().toLocaleString()}

=== OVERVIEW ===
Total Questions: ${analyticsData.totalQuestions}
Unique Students: ${analyticsData.uniqueStudents}
Active Days: ${analyticsData.stats.activeDays}
Last Activity: ${analyticsData.stats.lastActivity.toLocaleString()}

=== MOST ASKED QUESTIONS ===
${analyticsData.mostAsked.map((q: any, i: number) => `${i + 1}. [${q.count} times] ${q.question}`).join('\n')}

=== TOP TOPICS ===
${analyticsData.categories.map((c: any, i: number) => `${i + 1}. ${c.category}: ${c.count} mentions`).join('\n')}

=== PEAK HOURS ===
${analyticsData.peakHours.filter((h: any) => h.count > 0).map((h: any) => `${h.hour}:00 - ${h.count} questions`).join('\n')}
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analyticsData.course.name.replace(/\s+/g, '_')}_analytics.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Analytics Exported',
      description: 'Report downloaded successfully',
      variant: 'success',
    });
  };

  const handleExportQuiz = () => {
    if (!generatedQuiz) return;

    const quizText = `Quiz: ${generatedQuiz.title}\nCourse: ${generatedQuiz.courseName}\nGenerated: ${generatedQuiz.createdAt.toLocaleDateString()}\n\n${generatedQuiz.questions.map((q, i) => {
      return `${i + 1}. ${q.question}\n${q.options.map((opt, j) => `   ${String.fromCharCode(65 + j)}. ${opt}`).join('\n')}\n\nCorrect Answer: ${String.fromCharCode(65 + q.correctAnswer)}\n${q.explanation ? `Explanation: ${q.explanation}\n` : ''}`;
    }).join('\n\n')}`;

    const blob = new Blob([quizText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedQuiz.title.replace(/\s+/g, '_')}_quiz.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Quiz Exported',
      description: 'Quiz downloaded successfully',
      variant: 'success',
    });
  };

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'quiz', label: 'Quiz Generator', icon: FileText },
    { id: 'insights', label: 'Insights', icon: Eye },
    { id: 'materials', label: 'Materials', icon: BookOpen },
  ];

  return (
    <div className="space-y-6">
      {/* Course Selector */}
      {courses.length > 0 && (
        <Card className="p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Course for Analytics
          </label>
          <select
            value={courseId || ''}
            onChange={(e) => {
              setSelectedCourseId(e.target.value || null);
            }}
            className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">All Courses</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-[#57068C] text-[#57068C] dark:text-purple-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {!courseId ? (
            <Card className="p-12 text-center">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Select a Course</h3>
              <p className="text-muted-foreground">Choose a course to view detailed analytics</p>
            </Card>
          ) : !analyticsData ? (
            <Card className="p-12 text-center">
              <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <h3 className="text-lg font-semibold mb-2">No Data Yet</h3>
              <p className="text-muted-foreground">Analytics will appear once students start asking questions</p>
            </Card>
          ) : (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Questions</p>
                      <p className="text-3xl font-bold text-[#57068C]">{analyticsData.totalQuestions}</p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-purple-500" />
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Unique Students</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{analyticsData.uniqueStudents}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Active Days</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">{analyticsData.stats.activeDays}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-green-500" />
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Avg Questions/Day</p>
                      <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                        {analyticsData.stats.activeDays > 0 
                          ? Math.round(analyticsData.totalQuestions / analyticsData.stats.activeDays) 
                          : 0}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-500" />
                  </div>
                </Card>
              </div>

              {/* Most Asked Questions */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-[#57068C]" />
                    <h3 className="text-lg font-bold">Most Asked Questions</h3>
                  </div>
                  <Button onClick={handleExportAnalytics} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </div>
                <div className="space-y-3">
                  {analyticsData.mostAsked.length > 0 ? (
                    analyticsData.mostAsked.map((item: any, i: number) => (
                      <div key={i} className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#57068C] text-white flex items-center justify-center font-bold text-sm">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 dark:text-gray-100 mb-1">{item.question}</p>
                          <p className="text-sm text-muted-foreground">Asked {item.count} time{item.count !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No questions tracked yet</p>
                  )}
                </div>
              </Card>

              {/* Question Frequency Chart */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="h-5 w-5 text-[#57068C]" />
                  <h3 className="text-lg font-bold">Question Activity (Last 30 Days)</h3>
                </div>
                <div className="h-64 flex items-end gap-1">
                  {analyticsData.frequency.map((day: any, i: number) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-[#57068C] rounded-t transition-all hover:bg-[#6A0BA8]"
                        style={{ height: `${Math.max((day.count / Math.max(...analyticsData.frequency.map((d: any) => d.count))) * 100, 5)}%` }}
                        title={`${day.date}: ${day.count} questions`}
                      />
                      {i % 5 === 0 && (
                        <span className="text-xs text-muted-foreground mt-1 transform -rotate-45 origin-top-left">
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Peak Hours */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="h-5 w-5 text-[#57068C]" />
                  <h3 className="text-lg font-bold">Peak Activity Hours</h3>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  {analyticsData.peakHours.map((hour: any) => (
                    <div key={hour.hour} className="text-center">
                      <div
                        className="bg-[#57068C] rounded mb-1 transition-all hover:bg-[#6A0BA8]"
                        style={{ height: `${(hour.count / Math.max(...analyticsData.peakHours.map((h: any) => h.count))) * 100}%`, minHeight: '4px' }}
                        title={`${hour.hour}:00 - ${hour.count} questions`}
                      />
                      <span className="text-xs text-muted-foreground">{hour.hour}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          {!courseId ? (
            <>
              {/* All Courses Comparison */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="h-5 w-5 text-[#57068C]" />
                  <h3 className="text-lg font-bold">All Courses Overview</h3>
                </div>
                {courses.length > 0 ? (
                  <div className="space-y-3">
                    {allCourseStats.map((stats) => (
                      <div key={stats.courseId} className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">{stats.courseName}</h4>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedCourseId(stats.courseId)}
                          >
                            View Details
                          </Button>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Questions</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{stats.totalQuestions}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Students</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{stats.uniqueStudents}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Active Days</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{stats.activeDays}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Last Activity</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
                              {stats.lastActivity > new Date(0) 
                                ? stats.lastActivity.toLocaleDateString() 
                                : 'Never'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No courses created yet</p>
                )}
              </Card>
            </>
          ) : !analyticsData ? (
            <Card className="p-12 text-center">
              <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <h3 className="text-lg font-semibold mb-2">No Data Yet</h3>
              <p className="text-muted-foreground">Insights will appear once students start asking questions</p>
            </Card>
          ) : (
            <>
              {/* Top Topics */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="h-5 w-5 text-[#57068C]" />
                  <h3 className="text-lg font-bold">Top Topics & Keywords</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analyticsData.categories.map((cat: any, i: number) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-gradient-to-r from-[#57068C] to-purple-600 text-white rounded-full text-sm font-medium flex items-center gap-2"
                    >
                      {cat.category}
                      <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                        {cat.count}
                      </span>
                    </span>
                  ))}
                </div>
              </Card>

              {/* Engagement Insights */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="h-5 w-5 text-[#57068C]" />
                  <h3 className="text-lg font-bold">Engagement Insights</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Student Participation Rate
                    </p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {analyticsData.uniqueStudents > 0 
                        ? Math.round((analyticsData.totalQuestions / analyticsData.uniqueStudents) * 10) / 10
                        : 0} questions per student
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                      Last Activity
                    </p>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {analyticsData.stats.lastActivity.toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Quiz Generator Tab */}
      {activeTab === 'quiz' && (
        <div className="space-y-6">
          <Card className="p-6 border-2 border-purple-100 dark:border-purple-900/30 bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/20 dark:to-gray-900">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#57068C] to-purple-600 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">AI Quiz Generator</h3>
                <p className="text-sm text-muted-foreground">Generate comprehensive quizzes from your course materials</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quiz Topic
                </label>
                <Input
                  value={quizTopic}
                  onChange={(e) => setQuizTopic(e.target.value)}
                  placeholder="e.g., Chapter 5: Pointers in C++"
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Number of Questions
                  </label>
                  <Input
                    type="number"
                    min="5"
                    max="50"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value) || 10)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <Button
                onClick={handleGenerateQuiz}
                disabled={generating || !quizTopic.trim() || !courseId}
                className="w-full bg-[#57068C] hover:bg-[#6A0BA8] text-white h-12"
              >
                {generating ? (
                  <>
                    <Sparkles className="h-5 w-5 mr-2 animate-pulse" />
                    Generating Quiz...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Quiz
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Generated Quiz Display */}
          {generatedQuiz && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{generatedQuiz.title}</h3>
                  <p className="text-sm text-muted-foreground">{generatedQuiz.courseName}</p>
                </div>
                <Button
                  onClick={handleExportQuiz}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  Export
                </Button>
              </div>

              <div className="space-y-6">
                {generatedQuiz.questions.map((q, i) => (
                  <div key={i} className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      {i + 1}. {q.question}
                    </p>
                    <div className="space-y-2 mb-3">
                      {q.options.map((opt, j) => (
                        <div
                          key={j}
                          className={`p-2 rounded ${
                            j === q.correctAnswer
                              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                              : 'bg-gray-50 dark:bg-gray-800'
                          }`}
                        >
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {String.fromCharCode(65 + j)}. {opt}
                          </span>
                          {j === q.correctAnswer && (
                            <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-semibold">
                              ✓ Correct
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <p className="text-sm text-muted-foreground italic">{q.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Materials Tab */}
      {activeTab === 'materials' && (
        <Card className="p-6">
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Course Materials</h3>
            <p className="text-muted-foreground">Manage your course materials from the file manager</p>
          </div>
        </Card>
      )}
    </div>
  );
}
