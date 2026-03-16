import { useState } from 'react';
import { useRegister } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

export const RegisterPage = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const register = useRegister();

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    register.mutate(form);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white"> Create account</h1>
        <p className="text-zinc-400 text-sm mt-1 mb-6"> Join the Chat platform</p>

        {register.isError && (
          <div className="bg-red-950 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
            Registration failed.Try a different email
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
          />
          <input
            className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition"
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition"
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm py-3 rounded-lg transition mt-1"
            type="submit"
            disabled={register.isPending}
          >
            {register.isPending ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-zinc-500 text-sm text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
