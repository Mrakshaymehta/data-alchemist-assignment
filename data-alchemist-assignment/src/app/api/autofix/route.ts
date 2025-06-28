import { NextRequest, NextResponse } from 'next/server';
import { generateValidationFixes } from '../../../lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { errors, data, entityType } = await request.json();

    if (!errors || !data || !entityType) {
      return NextResponse.json(
        { error: 'Missing required fields: errors, data, entityType' },
        { status: 400 }
      );
    }

    const validationFixes = await generateValidationFixes(errors, data);

    return NextResponse.json(validationFixes);
  } catch (error) {
    console.error('Error in autofix API:', error);
    return NextResponse.json(
      { error: 'Failed to generate validation fixes' },
      { status: 500 }
    );
  }
} 