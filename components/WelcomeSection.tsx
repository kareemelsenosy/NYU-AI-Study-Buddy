"use client";

import { BookOpen, Upload, MessageSquare, Sparkles, FileText, Zap, Target, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WelcomeSectionProps {
  onGetStarted?: () => void;
}

export function WelcomeSection({ onGetStarted }: WelcomeSectionProps) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 animate-in fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-purple-600 shadow-lg mb-4">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
          Welcome to NYU AI Study Buddy
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your intelligent academic assistant powered by AI. Get instant answers, explanations, and study support for all your NYU courses.
        </p>
      </div>

      {/* How It Works */}
      <Card className="p-8 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Target className="h-6 w-6 text-purple-700" />
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-semibold text-lg">Upload Materials</h3>
            </div>
            <p className="text-muted-foreground ml-13">
              Upload your course materials (PDFs, slides, documents) to give the AI context about your courses.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-semibold text-lg">Ask Questions</h3>
            </div>
            <p className="text-muted-foreground ml-13">
              Ask any question about your course materials. The AI will search through your uploaded files to find relevant answers.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-semibold text-lg">Get Answers</h3>
            </div>
            <p className="text-muted-foreground ml-13">
              Receive instant, accurate answers with citations from your course materials. Perfect for studying and understanding complex topics.
            </p>
          </div>
        </div>
      </Card>

      {/* Features */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Multi-Format Support</h3>
              <p className="text-sm text-muted-foreground">
                Upload PDFs, PowerPoint slides, Word documents, Excel files, and text files. The AI reads them all.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Instant Answers</h3>
              <p className="text-sm text-muted-foreground">
                Get real-time responses with streaming answers. The AI processes your questions instantly.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Context-Aware</h3>
              <p className="text-sm text-muted-foreground">
                The AI remembers your conversation and provides contextually relevant answers based on your course materials.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">All Courses</h3>
              <p className="text-sm text-muted-foreground">
                Works with any NYU course. Upload materials from any subject and get intelligent, course-specific help.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* CTA */}
      <div className="text-center pt-4 space-x-3 flex items-center justify-center">
        <Button
          onClick={onGetStarted}
          size="lg"
          className="bg-gradient-to-r from-purple-500 to-purple-400 hover:from-purple-600 hover:to-purple-500 text-white shadow-lg px-8 py-6 text-lg"
        >
          <Upload className="h-5 w-5 mr-2" />
          Upload Materials
        </Button>
        <Button
          onClick={() => {
            if (typeof window !== 'undefined') {
              const event = new CustomEvent('go-to-chat');
              window.dispatchEvent(event);
            }
          }}
          size="lg"
          className="bg-gradient-to-r from-purple-500 to-purple-400 hover:from-purple-600 hover:to-purple-500 text-white shadow-lg px-8 py-6 text-lg"
        >
          <MessageSquare className="h-5 w-5 mr-2" />
          Start Chatting
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}

