"use client";

import { useState, useEffect } from 'react';
import { Course } from '@/types';
import { getVisibleCourses, setSelectedCourseId, getSelectedCourseId } from '@/lib/course-management';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BookOpen, Check } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface CourseSelectorProps {
  onCourseSelected?: (courseId: string) => void;
}

export function CourseSelector({ onCourseSelected }: CourseSelectorProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseIdState] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
    const currentSelected = getSelectedCourseId();
    setSelectedCourseIdState(currentSelected);
    
    // Listen for course changes
    const handleCoursesChange = () => loadCourses();
    window.addEventListener('courses-change', handleCoursesChange);
    return () => window.removeEventListener('courses-change', handleCoursesChange);
  }, []);

  const loadCourses = async () => {
    const allCourses = await getVisibleCourses();
    setCourses(allCourses);
  };

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedCourseIdState(courseId);
    onCourseSelected?.(courseId);
  };

  if (courses.length === 0) {
    return (
      <Card className="p-6 text-center">
        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">
          No courses available yet. Ask your professor to create a course and upload materials.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold mb-4">Select a Course</h3>
      {courses.map((course) => (
        <Card
          key={course.id}
          className={`p-4 cursor-pointer transition-all ${
            selectedCourseId === course.id
              ? 'border-[#57068C] bg-purple-50 dark:bg-purple-950/20'
              : 'border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700'
          }`}
          onClick={() => handleSelectCourse(course.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{course.name}</h4>
                {selectedCourseId === course.id && (
                  <Check className="h-4 w-4 text-[#57068C]" />
                )}
              </div>
              {course.description && (
                <p className="text-sm text-muted-foreground mb-2">{course.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                By {course.professorName} • {formatDate(course.updatedAt)}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

