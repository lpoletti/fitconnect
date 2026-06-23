import { NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';

export function validateBody<T>(schema: ZodSchema<T>, body: unknown): { data: T } | { error: NextResponse } {
  try {
    const data = schema.parse(body);
    return { data };
  } catch (err) {
    if (err instanceof ZodError) {
      const firstError = err.errors[0];
      return { error: NextResponse.json({ error: firstError.message }, { status: 400 }) };
    }
    return { error: NextResponse.json({ error: 'Dados invalidos' }, { status: 400 }) };
  }
}
