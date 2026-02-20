'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import React, { Suspense } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  let errorMessage = 'Ha ocurrido un error inesperado.';

  if (error === 'CredentialsSignin') {
    errorMessage = 'Email o contrasena incorrectos. Por favor, intentalo de nuevo.';
  } else if (error === 'Configuration') {
    errorMessage = 'Hay un problema con la configuracion del servidor. Por favor, contacta al administrador.';
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Error de Autenticacion</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link href="/login">Volver a Intentar</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md p-8 text-center">
          <p className="text-muted-foreground">Cargando...</p>
        </Card>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
