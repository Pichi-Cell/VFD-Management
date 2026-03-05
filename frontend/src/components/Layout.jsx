import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Database, Users, Settings } from 'lucide-react';

const Layout = ({ children }) => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex bg-bg">
            {/* Sidebar */}
            <aside className="w-64 bg-primary text-white flex flex-col fixed inset-y-0">
                <div className="p-6 text-xl font-bold border-b border-primary-light flex items-center gap-2">
                    <Database className="text-accent" />
                    <span>VFD Manager</span>
                </div>

                <nav className="flex-1 p-4 flex flex-col gap-2">
                    <button className="flex items-center gap-3 p-3 rounded-lg bg-accent text-white w-full text-left transition-colors">
                        <LayoutDashboard size={20} />
                        <span>Workflow</span>
                    </button>
                    <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary-light text-slate-400 hover:text-white w-full text-left transition-colors">
                        <Users size={20} />
                        <span>Clients</span>
                    </button>
                    <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary-light text-slate-400 hover:text-white w-full text-left transition-colors">
                        <Settings size={20} />
                        <span>Settings</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-primary-light bg-primary-light/30">
                    <div className="flex items-center gap-3 p-3 text-slate-300">
                        <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center font-bold text-sm shadow-inner">
                            {user.username?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-semibold truncate text-white">{user.username}</p>
                            <p className="text-xs opacity-50 capitalize">{user.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="mt-2 flex items-center gap-3 p-3 rounded-lg hover:bg-danger/10 hover:text-danger text-slate-400 w-full text-left transition-all duration-200"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 min-h-screen flex flex-col">
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-8 justify-between sticky top-0 z-20">
                    <h1 className="text-lg font-bold text-slate-800">Repair Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <button className="px-5 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl transition-all shadow-md active:scale-95 font-semibold text-sm">
                            + New Repair
                        </button>
                    </div>
                </header>

                <div className="p-8 flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
