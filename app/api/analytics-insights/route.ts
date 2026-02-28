import { NextRequest, NextResponse } from 'next/server';
import { callPortkeyDirectly } from '@/lib/portkey';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { questions, courseName, model } = await req.json();

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'No questions provided' }, { status: 400 });
    }

    const questionList = questions
      .slice(0, 50)
      .map((q: { question: string; count: number }, i: number) => `${i + 1}. [Asked ${q.count}x] ${q.question}`)
      .join('\n');

    const prompt = `You are an academic analytics expert analyzing student questions from an NYU course: "${courseName}".

Here are the most frequently asked student questions (sorted by frequency):

${questionList}

Analyze these questions and return a JSON object with exactly this structure:
{
  "summary": "2-3 sentence overview of student engagement and overall understanding",
  "strugglingTopics": [
    { "topic": "Topic name", "reason": "Why students struggle here", "frequency": "high/medium/low" }
  ],
  "learningGaps": [
    { "gap": "Description of the gap", "suggestion": "What the professor can do" }
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2"
  ],
  "engagementLevel": "high/medium/low",
  "engagementReason": "One sentence explaining the engagement assessment"
}

Be specific and actionable. Base everything strictly on the questions provided.`;

    const messages = [
      { role: 'system', content: 'You are an academic analytics expert. Always respond with valid JSON only, no markdown fences.' },
      { role: 'user', content: prompt },
    ];

    const response = await callPortkeyDirectly(messages, model || '@gpt-4o/gpt-4o', false);
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    let insights;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      insights = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Analytics insights error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
