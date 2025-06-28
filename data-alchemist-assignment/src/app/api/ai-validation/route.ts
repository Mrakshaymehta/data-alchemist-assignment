import { NextRequest, NextResponse } from 'next/server';
import { generateAIValidationWarnings } from '../../../lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { data, entityType } = await request.json();

    if (!data || !entityType) {
      return NextResponse.json(
        { error: 'Missing required fields: data, entityType' },
        { status: 400 }
      );
    }

    const aiWarnings = await generateAIValidationWarnings(data, entityType);

    return NextResponse.json(aiWarnings);
  } catch (error) {
    console.error('Error in ai-validation API:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI validation warnings' },
      { status: 500 }
    );
  }
} 