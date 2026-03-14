import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, AppError } from '@/lib/api-error';
import { getSupabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const supabase = getSupabase();

    // Check if email already exists
    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('email', data.email)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      console.error('Error checking existing user:', existingError);
      throw new Error(existingError.message);
    }

    if (existing) throw new AppError('CONFLICT', 'Email já cadastrado', 409);

    // Count users to determine role
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting users:', countError);
      throw new Error(countError.message);
    }

    const role = (count ?? 0) === 0 ? 'ADMIN' : 'VIEWER';
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name: data.name,
        email: data.email,
        password_hash: passwordHash,
        role,
      })
      .select('id, name, email, role, created_at')
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw new Error(error.message);
    }

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
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
