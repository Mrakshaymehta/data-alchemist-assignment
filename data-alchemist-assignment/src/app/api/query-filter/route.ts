import { NextRequest, NextResponse } from 'next/server';
import { generateFilter } from '../../../lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { userQuery, data, entityType } = await request.json();

    if (!userQuery || !data || !entityType) {
      return NextResponse.json(
        { error: 'Missing required fields: userQuery, data, entityType' },
        { status: 400 }
      );
    }

    const filterResult = await generateFilter(userQuery, data, entityType);

    return NextResponse.json(filterResult);
  } catch (error) {
    console.error('Error in query-filter API:', error);
    return NextResponse.json(
      { error: 'Failed to process query filter' },
      { status: 500 }
    );
  }
} 