import { NextRequest, NextResponse } from 'next/server';
import { generateEdit } from '../../../lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { userQuery, data, entityType } = await request.json();

    if (!userQuery || !data || !entityType) {
      return NextResponse.json(
        { error: 'Missing required fields: userQuery, data, entityType' },
        { status: 400 }
      );
    }

    const editResult = await generateEdit(userQuery, data, entityType);

    return NextResponse.json(editResult);
  } catch (error) {
    console.error('Error in query-edit API:', error);
    return NextResponse.json(
      { error: 'Failed to process query edit' },
      { status: 500 }
    );
  }
} 