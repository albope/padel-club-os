import AuthForm from '@/components/auth/AuthForm';
import Link from 'next/link';

const LoginPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="text-center mb-8">
        <Link href="/">
          <span className="text-4xl font-bold text-indigo-400 cursor-pointer">PadelClub OS</span>
        </Link>
        <p className="text-gray-400 mt-2">La nueva era en la gestión de clubes.</p>
      </div>
      <AuthForm />
    </div>
  );
};

export default LoginPage;