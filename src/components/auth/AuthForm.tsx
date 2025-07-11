'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react'; // Import icons for password visibility

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
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    setError(null);

    if (isRegister) {
      // Handle registration
      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: values.email,
            password: values.password,
            name: values.name,
          }),
        });
        if (response.ok) {
          router.push('/login');
        } else {
          const data = await response.json();
          setError(data.message || 'Error en el registro.');
        }
      } catch (e) {
        setError('No se pudo conectar con el servidor.');
      }
    } else {
      // Handle login
      const result = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
      });
      if (result?.error) {
        setError('Email o contraseña incorrectos.');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-900">
        {isRegister ? 'Crear una cuenta' : 'Iniciar Sesión'}
      </h2>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {isRegister && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre</label>
            <input id="name" type="text" {...form.register('name')} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900" />
          </div>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input id="email" type="email" {...form.register('email')} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900" />
          {form.formState.errors.email && <p className="mt-1 text-sm text-red-600">{form.formState.errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              {...form.register('password')}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 pr-10 text-gray-900"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-indigo-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {form.formState.errors.password && <p className="mt-1 text-sm text-red-600">{form.formState.errors.password.message}</p>}
        </div>
        {error && <p className="text-sm text-center text-red-600">{error}</p>}
        <button type="submit" className="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          {isRegister ? 'Registrarse' : 'Entrar'}
        </button>
      </form>
      
      <p className="text-sm text-center text-gray-600 pt-4">
        {isRegister ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
        <a href={isRegister ? '/login' : '/register'} className="font-medium text-indigo-600 hover:text-indigo-500">
          {isRegister ? ' Inicia sesión' : ' Regístrate'}
        </a>
      </p>
    </div>
  );
};

export default AuthForm;