import { useState } from 'react';
import { useLogin } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white">Welcome back</h1>
        <p className="text-zinc-400 text-sm mt-1 mb-6">Sign in to your account</p>
        {login.isError && (
          <div className="bg-red-950 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
            Invalid Email or Password
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white fonst-semibold text-sm py-3 rounded-lg transition mt-1"
            type="submit"
            disabled={login.isPending}
          >
            {login.isPending ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-zinc-500 text-sm text-center mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};
