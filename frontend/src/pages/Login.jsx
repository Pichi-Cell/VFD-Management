import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Lock, User, ArrowRight } from 'lucide-react';
import { authService } from '../services/auth';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await authService.login({ username, password });
            navigate('/');
        } catch (err) {
            setError('Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-primary relative overflow-hidden">
            {/* Abstract Background Elements */}
            <div className="absolute top-0 -left-20 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-0 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />

            <div className="w-full max-w-md p-10 glass rounded-3xl shadow-2xl relative z-10 mx-4 border border-white/10">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 bg-accent rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-accent/20 rotate-3 hover:rotate-0 transition-transform duration-300">
                        <Database className="text-white" size={40} />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">DMD Compresores</h1>
                    <p className="text-slate-400 mt-2 font-medium">VFD Management System</p>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-danger/10 border border-danger/20 text-danger text-sm rounded-xl text-center font-medium animate-bounce">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="group">
                        <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2 ml-1 opacity-70">Username</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent transition-colors" size={20} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-primary/40 border border-slate-700/50 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder-slate-600"
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                    </div>

                    <div className="group">
                        <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2 ml-1 opacity-70">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent transition-colors" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-primary/40 border border-slate-700/50 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder-slate-600"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-accent/30 flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? 'Authenticating...' : (
                            <>
                                <span>Sign In</span>
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-slate-500 text-xs mt-10 font-medium">
                    Authorized personnel only. Contact admin for access.
                </p>
            </div>
        </div>
    );
};

export default Login;
