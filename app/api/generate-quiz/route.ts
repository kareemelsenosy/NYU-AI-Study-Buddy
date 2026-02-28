import { NextRequest, NextResponse } from 'next/server';
import { callPortkeyDirectly } from '@/lib/portkey';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, numQuestions = 10, difficulty = 'medium', courseId, courseName, selectedFileIds, model } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Fetch relevant chunks from document_chunks using RAG approach
    // If selectedFileIds provided, filter to only those files; otherwise use all course chunks
    let chunksQuery = supabase
      .from('document_chunks')
      .select('file_name, chunk_index, content')
      .eq('course_id', courseId)
      .order('file_name')
      .order('chunk_index')
      .limit(60);

    if (selectedFileIds && selectedFileIds.length > 0) {
      chunksQuery = chunksQuery.in('file_id', selectedFileIds);
    }

    const { data: chunks, error } = await chunksQuery;

    if (error) {
      console.error('Error fetching chunks:', error);
      return NextResponse.json({ error: 'Failed to load course materials' }, { status: 500 });
    }

    if (!chunks || chunks.length === 0) {
      return NextResponse.json({ error: 'No course materials found. Please upload materials first.' }, { status: 400 });
    }

    // Build context from chunks
    const context = chunks
      .map((c: { file_name: string; chunk_index: number; content: string }) =>
        `[${c.file_name}, section ${c.chunk_index + 1}]\n${c.content}`
      )
      .join('\n\n---\n\n');

    const topicClause = topic?.trim()
      ? `Focus specifically on the topic: "${topic.trim()}". Only generate questions about this topic if it appears in the materials.`
      : 'Generate questions that cover the breadth of the materials provided.';

    const userPrompt = `Generate a quiz with ${numQuestions} ${difficulty}-difficulty multiple-choice questions for the course "${courseName}".

${topicClause}

COURSE MATERIALS:
${context}

CRITICAL: Base every question STRICTLY on the course materials above. Do not use external knowledge.

Format your response as JSON:
{
  "title": "Quiz Title",
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation citing the source section"
    }
  ]
}`;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert academic quiz generator. Always respond with valid JSON only, no markdown fences. Base questions strictly on provided materials.',
      },
      { role: 'user', content: userPrompt },
    ];

    const response = await callPortkeyDirectly(messages, model || '@gpt-4o/gpt-4o', false);
    const data = await response.json();
    const content2 = data.choices?.[0]?.message?.content || '';

    let quizData;
    try {
      const jsonMatch = content2.match(/\{[\s\S]*\}/);
      quizData = JSON.parse(jsonMatch ? jsonMatch[0] : content2);
    } catch {
      return NextResponse.json({ error: 'Failed to parse quiz response' }, { status: 500 });
    }

    const quiz = {
      title: quizData.title || (topic ? `Quiz: ${topic}` : `${courseName} Quiz`),
      questions: quizData.questions || [],
      courseId,
      courseName: courseName || 'Course',
      createdAt: new Date(),
    };

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error('Error generating quiz:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}
