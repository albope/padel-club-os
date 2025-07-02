'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import React from 'react';

const AuthErrorPage = () => {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  let errorMessage = 'Ha ocurrido un error inesperado.';

  // NextAuth provides specific error codes we can check
  if (error === 'CredentialsSignin') {
    errorMessage = 'Email o contraseña incorrectos. Por favor, inténtalo de nuevo.';
  } else if (error === 'Configuration') {
    errorMessage = 'Hay un problema con la configuración del servidor. Por favor, contacta al administrador.';
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center px-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Error de Autenticación</h1>
        <p className="text-gray-700 mb-6">{errorMessage}</p>
        <Link href="/login">
          <span className="px-6 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer">
            Volver a Intentar
          </span>
        </Link>
      </div>
    </div>
  );
};

export default AuthErrorPage;