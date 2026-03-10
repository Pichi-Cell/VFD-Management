import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Lock, User, ArrowRight } from 'lucide-react';
import { authService } from '../services/auth';
import { toast } from 'sonner';

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
            console.error(err);
            setError('Invalid username or password');
            toast.error('Login failed: Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-96 bg-accent origin-top-left -skew-y-6 transform shadow-2xl z-0" />

            <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-8 gap-3 items-center text-white drop-shadow-md">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-accent shadow-lg">
                        <Database className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight leading-none">VFD Management</h2>
                        <p className="text-accent-hover font-bold text-sm tracking-widest uppercase">Member Login</p>
                    </div>
                </div>

                <div className="bg-white px-8 py-10 shadow-2xl rounded-[2.5rem] border border-slate-100 backdrop-blur-sm sm:px-12 relative overflow-hidden group">
                    {error && (
                        <div className="mb-6 p-4 bg-danger/10 border border-danger/20 text-danger text-xs rounded-2xl text-center font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div className="group/input">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 font-sans">Username / Email</label>
                            <div className="relative">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-accent transition-colors" size={18} />
                                <input
                                    type="text"
                                    required
                                    className="appearance-none block w-full pl-12 pr-5 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-white transition-all"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="group/input">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 font-sans">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-accent transition-colors" size={18} />
                                <input
                                    type="password"
                                    required
                                    className="appearance-none block w-full pl-12 pr-5 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-white transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-accent/20 font-black text-[10px] uppercase tracking-widest text-white bg-accent hover:bg-accent-hover transition-all active:scale-95 disabled:opacity-50 group/btn"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">Authenticating...</span>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span>Sign In Now</span>
                                        <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </div>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-50 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Authorized Access Only
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
