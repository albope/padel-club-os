'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: values.email,
            password: values.password,
            name: values.name,
          }),
        });

        if (response.ok) {
          router.push('/login');
        } else {
          // Improved error handling: check if response is JSON
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.indexOf('application/json') !== -1) {
            const data = await response.json();
            setError(data.message || 'Error en el registro.');
          } else {
            setError('Error inesperado del servidor. Revisa la consola del servidor.');
          }
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
        router.push('/dashboard'); // Redirect to dashboard on successful login
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
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Nombre
            </label>
            <input
              id="name"
              type="text"
              {...form.register('name')}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        )}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            {...form.register('email')}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          {form.formState.errors.email && (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            {...form.register('password')}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
           {form.formState.errors.password && (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.password.message}</p>
          )}
        </div>
        {error && <p className="text-sm text-center text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {isRegister ? 'Registrarse' : 'Entrar'}
        </button>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 text-gray-500 bg-white">O continuar con</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
        className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M24 9.5c3.9 0 6.8 1.6 8.4 3.2l6.3-6.3C34.9 2.7 30 .5 24 .5 14.9.5 7.7 5.8 4.8 13.7l7.4 5.8C13.6 13.5 18.4 9.5 24 9.5z"></path>
            <path fill="#34A853" d="M46.2 25.1c0-1.6-.1-3.2-.4-4.7H24v8.9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.3 5.7c4.3-4 6.9-10 6.9-16.8z"></path>
            <path fill="#FBBC05" d="M12.2 19.5c-.4-1.2-.7-2.5-.7-3.8s.3-2.6.7-3.8l-7.4-5.8C2.6 10.4.5 15 .5 20s2.1 9.6 4.9 13.7l7.4-5.8c-.4-1.2-.6-2.5-.6-3.8z"></path>
            <path fill="#EA4335" d="M24 45.5c5.1 0 9.5-1.7 12.6-4.6l-7.3-5.7c-1.7 1.1-3.9 1.8-6.3 1.8-5.6 0-10.4-4-12.2-9.5l-7.4 5.8C7.7 40.2 14.9 45.5 24 45.5z"></path>
        </svg>
        Google
      </button>
      <p className="text-sm text-center text-gray-600">
        {isRegister ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
        <a href={isRegister ? '/login' : '/register'} className="font-medium text-indigo-600 hover:text-indigo-500">
          {isRegister ? ' Inicia sesión' : ' Regístrate'}
        </a>
      </p>
    </div>
  );
};

export default AuthForm;
