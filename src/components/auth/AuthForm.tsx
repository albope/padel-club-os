'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

// Define the validation schema for the form
const FormSchema = z.object({
  email: z.string().min(1, 'El email es requerido.').email('Email inválido.'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida.')
    .min(8, 'La contraseña debe tener al menos 8 caracteres.'),
  name: z.string().optional(),
});

interface AuthFormProps {
  isRegister?: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({ isRegister = false }) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { email: '', password: '', name: '' },
  });

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    setIsLoading(true);
    setError(null);
    if (isRegister) {
      // Handle registration
      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        if (response.ok) {
          router.push('/login');
        } else {
          const data = await response.json();
          setError(data.message || 'Error en el registro.');
        }
      } catch (e) {
        setError('No se pudo conectar con el servidor.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Handle login
      const result = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
      });
      setIsLoading(false);
      if (result?.error) {
        setError('Email o contraseña incorrectos.');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 border border-gray-700 rounded-2xl shadow-lg">
      <h2 className="text-3xl font-bold text-center text-white">
        {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
      </h2>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {isRegister && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-400">Nombre</label>
            <input id="name" type="text" {...form.register('name')} className="w-full px-4 py-3 mt-1 bg-gray-700 border border-gray-600 text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-400">Email</label>
          <input id="email" type="email" {...form.register('email')} className="w-full px-4 py-3 mt-1 bg-gray-700 border border-gray-600 text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          {form.formState.errors.email && <p className="mt-2 text-sm text-red-400">{form.formState.errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-400">Contraseña</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              {...form.register('password')}
              className="w-full px-4 py-3 mt-1 bg-gray-700 border border-gray-600 text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 hover:text-indigo-400"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {form.formState.errors.password && <p className="mt-2 text-sm text-red-400">{form.formState.errors.password.message}</p>}
        </div>
        {error && <p className="text-sm text-center text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center px-4 py-3 font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors disabled:bg-indigo-800 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : (isRegister ? 'Registrarse' : 'Entrar')}
        </button>
      </form>
      
      <p className="text-sm text-center text-gray-400 pt-4">
        {isRegister ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
        <a href={isRegister ? '/login' : '/register'} className="font-medium text-indigo-400 hover:underline">
          {isRegister ? ' Inicia sesión' : ' Regístrate'}
        </a>
      </p>
    </div>
  );
};

export default AuthForm;