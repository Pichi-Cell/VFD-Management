import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, Database, Users, Settings, Plus, History } from 'lucide-react';
import NewRepairModal from './NewRepairModal';

const Layout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [isNewRepairModalOpen, setIsNewRepairModalOpen] = useState(false);

    React.useEffect(() => {
        const handleOpen = () => setIsNewRepairModalOpen(true);
        window.addEventListener('open-new-repair', handleOpen);
        return () => window.removeEventListener('open-new-repair', handleOpen);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Determine title based on location
    const getPageTitle = () => {
        if (location.pathname === '/') return 'Repair Dashboard';
        if (location.pathname === '/settings') return 'Settings & Management';
        if (location.pathname.includes('/repair/')) {
            if (location.pathname.endsWith('/report')) return 'Technical Report';
            return 'Repair Detail';
        }
        return 'VFD Manager';
    };

    return (
        <div className="h-screen flex bg-bg overflow-hidden">
            {/* Sidebar */}
            <aside className="no-print z-50 w-64 bg-primary text-white flex flex-col fixed inset-y-0 shadow-2xl">
                <div className="p-6 text-xl font-bold border-b border-primary-light flex items-center gap-2">
                    <Database className="text-accent" />
                    <span>VFD Manager</span>
                </div>

                <nav className="flex-1 p-4 flex flex-col gap-2">
                    <button
                        onClick={() => navigate('/')}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors w-full text-left ${location.pathname === '/' ? 'bg-accent text-white' : 'hover:bg-primary-light text-slate-400 hover:text-white'
                            }`}
                    >
                        <LayoutDashboard size={20} />
                        <span>Workflow</span>
                    </button>
                    <button
                        onClick={() => navigate('/history')}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors w-full text-left ${location.pathname === '/history' ? 'bg-accent text-white' : 'hover:bg-primary-light text-slate-400 hover:text-white'
                            }`}
                    >
                        <History size={20} />
                        <span>History</span>
                    </button>
                    <button
                        onClick={() => navigate('/settings')}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors w-full text-left ${location.pathname === '/settings' ? 'bg-accent/50 text-white' : 'hover:bg-primary-light text-slate-400 hover:text-white'
                            }`}
                    >
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
            <main className="flex-1 ml-64 h-screen flex flex-col overflow-hidden relative">
                <header className="no-print h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center px-10 justify-between flex-shrink-0 z-40">
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">{getPageTitle()}</h1>
                        <p className="text-[10px] font-black text-slate-400 border-t border-slate-100 flex items-center gap-1">
                            DMD COMPRESORES <span className="text-accent">•</span> V1.0.4
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsNewRepairModalOpen(true)}
                            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-all shadow-xl shadow-slate-200 active:scale-95 font-black text-xs uppercase tracking-widest flex items-center gap-2"
                        >
                            <Plus size={18} />
                            New Repair
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-auto">
                    <div className="p-8 min-h-full">
                        {children}
                    </div>
                </div>
            </main>

            <NewRepairModal
                isOpen={isNewRepairModalOpen}
                onClose={() => setIsNewRepairModalOpen(false)}
            />
        </div>
    );
};

export default Layout;
