import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, AppError } from '@/lib/api-error';

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const { prisma } = await import('@/lib/prisma');
    const bcrypt = await import('bcryptjs');

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError('CONFLICT', 'Email já cadastrado', 409);

    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'VIEWER';
    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, passwordHash, role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details: Record<string, string[]> = {};
      (error.issues ?? []).forEach((e) => {
        const field = e.path.join('.');
        if (!details[field]) details[field] = [];
        details[field].push(e.message);
      });
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos', details, timestamp: new Date().toISOString(), requestId: crypto.randomUUID() } },
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
}
