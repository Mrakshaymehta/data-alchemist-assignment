import { NextRequest, NextResponse } from 'next/server';
import { generateRuleSuggestions } from '../../../lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { clients, workers, tasks } = await request.json();

    if (!clients || !workers || !tasks) {
      return NextResponse.json(
        { error: 'Missing required fields: clients, workers, tasks' },
        { status: 400 }
      );
    }

    const ruleSuggestions = await generateRuleSuggestions(clients, workers, tasks);

    return NextResponse.json(ruleSuggestions);
  } catch (error) {
    console.error('Error in rule-suggestions API:', error);
    return NextResponse.json(
      { error: 'Failed to generate rule suggestions' },
      { status: 500 }
    );
  }
} 