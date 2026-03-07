import { NextResponse } from 'next/server';

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 500,
    public details?: Record<string, string[]>
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown) {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          timestamp,
          requestId,
        },
      },
      { status: error.status }
    );
  }

  console.error('Unhandled error:', error);
  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
        timestamp,
        requestId,
      },
    },
    { status: 500 }
  );
}
