import AuthForm from '@/components/auth/AuthForm';

const RegisterPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <AuthForm isRegister={true} />
    </div>
  );
};

export default RegisterPage;
