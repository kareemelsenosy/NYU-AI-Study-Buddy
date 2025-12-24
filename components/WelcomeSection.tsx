"use client";

import { Upload, MessageSquare, Sparkles, FileText, Zap, Target, ArrowRight, GraduationCap, Brain, BookOpen, Users, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, UserRole } from '@/types';

interface WelcomeSectionProps {
  user?: User | null;
  role?: UserRole | null;
  onGetStarted?: () => void;
  onViewAnalytics?: () => void;
}

export function WelcomeSection({ user, role, onGetStarted, onViewAnalytics }: WelcomeSectionProps) {
  // Only show role-specific content if user is signed in AND has a role selected
  // If no user is signed in, always show default welcome
  const isProfessor = user !== null && role === 'professor';
  const isStudent = user !== null && role === 'student';

  // Student Welcome
  if (isStudent) {
    return (
      <div className="w-full max-w-5xl mx-auto px-6 py-12 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#57068C] to-purple-600 shadow-2xl shadow-purple-500/30 mb-2">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              Your AI-Powered
              <span className="block text-[#57068C] dark:text-purple-400">Study Assistant</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Select a course and get instant, intelligent answers from your course materials. Powered by advanced AI to help you succeed at NYU.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              onClick={onGetStarted} 
              size="lg"
              className="h-14 px-8 text-base bg-[#57068C] hover:bg-[#6A0BA8] text-white rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:-translate-y-0.5"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Select Course
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('go-to-chat'));
                }
              }}
              className="h-14 px-8 text-base border-2 border-gray-200 dark:border-gray-700 hover:border-[#57068C] dark:hover:border-purple-500 rounded-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Start Chatting
            </Button>
            {/* No analytics button for students - this is student welcome section */}
          </div>
        </div>

        {/* How It Works */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 via-transparent to-blue-100/50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-3xl" />
          <Card className="relative p-8 md:p-10 border-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-3xl shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#57068C] to-purple-600 flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">How It Works</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { num: 1, title: 'Select Course', desc: 'Choose from courses created by your professors with uploaded materials.' },
                { num: 2, title: 'Ask Questions', desc: 'Type any question about your course materials naturally.' },
                { num: 3, title: 'Get Answers', desc: 'Receive accurate, cited answers from your course materials.' },
              ].map((step) => (
                <div key={step.num} className="group">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl font-bold text-[#57068C] group-hover:bg-[#57068C] group-hover:text-white transition-all duration-300">
                      {step.num}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{step.title}</h3>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed pl-16">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: BookOpen, title: 'Course Selection', desc: 'Access materials from multiple courses' },
            { icon: Zap, title: 'Instant Answers', desc: 'Get responses in seconds' },
            { icon: Brain, title: 'Smart Memory', desc: 'Remembers your learning style' },
            { icon: GraduationCap, title: 'NYU Focused', desc: 'Tailored for academic success' },
          ].map((feature, i) => (
            <Card 
              key={i} 
              className="p-6 border-0 bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl group"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center mb-4 group-hover:bg-[#57068C] transition-colors duration-300">
                <feature.icon className="h-6 w-6 text-[#57068C] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{feature.desc}</p>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center py-8">
          <Card className="inline-flex items-center gap-6 px-8 py-6 border-0 bg-gradient-to-r from-[#57068C] to-purple-600 text-white rounded-2xl shadow-xl shadow-purple-500/30">
            <div className="text-left">
              <h3 className="text-xl font-semibold mb-1">Ready to ace your courses?</h3>
              <p className="text-purple-200">Select a course and start learning smarter</p>
            </div>
            <Button 
              onClick={onGetStarted}
              variant="secondary"
              className="h-12 px-6 bg-white hover:bg-gray-100 text-[#57068C] rounded-xl font-semibold shadow-lg"
            >
              Get Started
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Professor Welcome
  if (isProfessor) {
    return (
      <div className="w-full max-w-5xl mx-auto px-6 py-12 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#57068C] to-purple-600 shadow-2xl shadow-purple-500/30 mb-2">
            <Users className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              Professor
              <span className="block text-[#57068C] dark:text-purple-400">Dashboard</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Create courses, upload materials, generate quizzes, and track student engagement. Everything you need to support your students.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              onClick={onGetStarted} 
              size="lg"
              className="h-14 px-8 text-base bg-[#57068C] hover:bg-[#6A0BA8] text-white rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:-translate-y-0.5"
            >
              <Upload className="h-5 w-5 mr-2" />
              Create Course
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={onViewAnalytics}
              className="h-14 px-8 text-base border-2 border-gray-200 dark:border-gray-700 hover:border-[#57068C] dark:hover:border-purple-500 rounded-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              View Analytics
            </Button>
          </div>
        </div>

        {/* How It Works */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 via-transparent to-blue-100/50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-3xl" />
          <Card className="relative p-8 md:p-10 border-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-3xl shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#57068C] to-purple-600 flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">How It Works</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { num: 1, title: 'Create Course', desc: 'Name your course and add a description. You can create multiple courses.' },
                { num: 2, title: 'Upload Materials', desc: 'Upload PDFs, slides, documents for each course. Organize by course.' },
                { num: 3, title: 'Track & Analyze', desc: 'Monitor student questions, generate quizzes, and view engagement analytics.' },
              ].map((step) => (
                <div key={step.num} className="group">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl font-bold text-[#57068C] group-hover:bg-[#57068C] group-hover:text-white transition-all duration-300">
                      {step.num}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{step.title}</h3>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed pl-16">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: BookOpen, title: 'Course Management', desc: 'Create and organize multiple courses' },
            { icon: FileText, title: 'Material Upload', desc: 'Upload files for each course separately' },
            { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Track student engagement and questions' },
            { icon: Sparkles, title: 'Quiz Generator', desc: 'AI-powered quiz creation from materials' },
          ].map((feature, i) => (
            <Card 
              key={i} 
              className="p-6 border-0 bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl group"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center mb-4 group-hover:bg-[#57068C] transition-colors duration-300">
                <feature.icon className="h-6 w-6 text-[#57068C] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{feature.desc}</p>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center py-8">
          <Card className="inline-flex items-center gap-6 px-8 py-6 border-0 bg-gradient-to-r from-[#57068C] to-purple-600 text-white rounded-2xl shadow-xl shadow-purple-500/30">
            <div className="text-left">
              <h3 className="text-xl font-semibold mb-1">Ready to create your first course?</h3>
              <p className="text-purple-200">Upload materials and make them available to your students</p>
            </div>
            <Button 
              onClick={onGetStarted}
              variant="secondary"
              className="h-12 px-6 bg-white hover:bg-gray-100 text-[#57068C] rounded-xl font-semibold shadow-lg"
            >
              Get Started
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Default Welcome (not signed in)
  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-12 space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#57068C] to-purple-600 shadow-2xl shadow-purple-500/30 mb-2">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Your AI-Powered
            <span className="block text-[#57068C] dark:text-purple-400">Study Assistant</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            For Students: Select courses and get instant answers. For Professors: Create courses and track engagement.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button 
            onClick={onGetStarted} 
            size="lg"
            className="h-14 px-8 text-base bg-[#57068C] hover:bg-[#6A0BA8] text-white rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:-translate-y-0.5"
          >
            Get Started
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>

      {/* How It Works */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 via-transparent to-blue-100/50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-3xl" />
        <Card className="relative p-8 md:p-10 border-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-3xl shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#57068C] to-purple-600 flex items-center justify-center">
              <Target className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">How It Works</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <GraduationCap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">For Students</h3>
              </div>
              <ol className="space-y-3 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#57068C]">1.</span>
                  <span>Select a course created by your professor</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#57068C]">2.</span>
                  <span>Ask questions about the course materials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#57068C]">3.</span>
                  <span>Get instant, accurate answers with citations</span>
                </li>
              </ol>
            </div>
            
            <div className="p-6 bg-purple-50 dark:bg-purple-950/20 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">For Professors</h3>
              </div>
              <ol className="space-y-3 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#57068C]">1.</span>
                  <span>Create courses and name them</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#57068C]">2.</span>
                  <span>Upload materials for each course</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#57068C]">3.</span>
                  <span>Track engagement and generate quizzes</span>
                </li>
              </ol>
            </div>
          </div>
        </Card>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { icon: FileText, title: 'Multi-Format', desc: 'PDF, PPTX, DOCX, XLSX, and TXT files' },
          { icon: Zap, title: 'Instant Answers', desc: 'Get responses in seconds' },
          { icon: Brain, title: 'Smart Memory', desc: 'Remembers your learning style' },
          { icon: GraduationCap, title: 'NYU Focused', desc: 'Tailored for academic success' },
        ].map((feature, i) => (
          <Card 
            key={i} 
            className="p-6 border-0 bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl group"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center mb-4 group-hover:bg-[#57068C] transition-colors duration-300">
              <feature.icon className="h-6 w-6 text-[#57068C] group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{feature.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{feature.desc}</p>
          </Card>
        ))}
      </div>

      {/* CTA Section */}
      <div className="text-center py-8">
        <Card className="inline-flex items-center gap-6 px-8 py-6 border-0 bg-gradient-to-r from-[#57068C] to-purple-600 text-white rounded-2xl shadow-xl shadow-purple-500/30">
          <div className="text-left">
            <h3 className="text-xl font-semibold mb-1">Ready to get started?</h3>
            <p className="text-purple-200">Sign up as a student or professor to begin</p>
          </div>
          <Button 
            onClick={onGetStarted}
            variant="secondary"
            className="h-12 px-6 bg-white hover:bg-gray-100 text-[#57068C] rounded-xl font-semibold shadow-lg"
          >
            Get Started
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Card>
      </div>
    </div>
  );
}
