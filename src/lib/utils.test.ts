import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn()', () => {
  it('combina clases correctamente', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('resuelve conflictos de Tailwind (ultima clase gana)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('maneja valores condicionales', () => {
    expect(cn('base', false && 'hidden', 'extra')).toBe('base extra');
  });

  it('maneja undefined y null', () => {
    expect(cn('base', undefined, null, 'extra')).toBe('base extra');
  });
});
