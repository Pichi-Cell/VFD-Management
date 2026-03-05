import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, clientService, vfdService } from '../services/dataService';
import { Users, Database, Shield, Settings as SettingsIcon, Search, Plus, ExternalLink, X } from 'lucide-react';

const Settings = () => {
    const queryClient = useQueryClient();
    const [activeSection, setActiveSection] = useState('users');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({});

    const { data: users, isLoading: usersLoading } = useQuery({
        queryKey: ['users'],
        queryFn: userService.getAll
    });

    const { data: clients, isLoading: clientsLoading } = useQuery({
        queryKey: ['clients'],
        queryFn: clientService.getAll
    });

    const { data: models, isLoading: modelsLoading } = useQuery({
        queryKey: ['models'],
        queryFn: vfdService.getModels
    });

    const createUserMutation = useMutation({
        mutationFn: userService.create,
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
            setIsModalOpen(false);
            setFormData({});
        }
    });

    const createClientMutation = useMutation({
        mutationFn: clientService.create,
        onSuccess: () => {
            queryClient.invalidateQueries(['clients']);
            setIsModalOpen(false);
            setFormData({});
        }
    });

    const createModelMutation = useMutation({
        mutationFn: vfdService.createModel,
        onSuccess: () => {
            queryClient.invalidateQueries(['models']);
            setIsModalOpen(false);
            setFormData({});
        }
    });

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (activeSection === 'users') createUserMutation.mutate(formData);
        if (activeSection === 'clients') createClientMutation.mutate(formData);
        if (activeSection === 'models') createModelMutation.mutate(formData);
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const sections = [
        { id: 'users', label: 'Users', icon: Users, count: users?.length },
        { id: 'clients', label: 'Clients', icon: Database, count: clients?.length },
        { id: 'models', label: 'VFD Models', icon: SettingsIcon, count: models?.length }
    ];

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 space-y-2">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => { setActiveSection(section.id); setSearchTerm(''); }}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${activeSection === section.id
                                ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 translate-x-1'
                                : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <section.icon size={20} className={activeSection === section.id ? 'text-accent' : 'text-slate-400'} />
                                <span className="font-bold text-sm tracking-tight">{section.label}</span>
                            </div>
                            {section.count !== undefined && (
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeSection === section.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    {section.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 space-y-6">
                    {/* Header & Search */}
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input
                                type="text"
                                placeholder={`Search ${activeSection}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-medium text-sm"
                            />
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-accent text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-accent-hover shadow-lg shadow-accent/20 transition-all flex items-center gap-2 flex-shrink-0"
                        >
                            <Plus size={16} /> Add {activeSection.slice(0, -1)}
                        </button>
                    </div>

                    {/* Tables */}
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                        {activeSection === 'users' && !usersLoading && (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">User</th>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Role</th>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Joined</th>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {users?.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                                        <tr key={user.id} className="group hover:bg-slate-50/30 transition-colors">
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center font-black text-white text-xs shadow-inner">
                                                        {user.username[0].toUpperCase()}
                                                    </div>
                                                    <span className="font-black text-slate-800 tracking-tight">{user.username}</span>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2">
                                                    <Shield size={14} className={user.role === 'admin' ? 'text-accent' : 'text-slate-300'} />
                                                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${user.role === 'admin' ? 'bg-accent/10 text-accent' : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        {user.role}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-sm font-bold text-slate-400">
                                                {new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="p-6">
                                                <button className="text-[10px] font-black text-slate-300 uppercase hover:text-accent transition-colors tracking-widest">
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {activeSection === 'clients' && !clientsLoading && (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Client Name</th>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact</th>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {clients?.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(client => (
                                        <tr key={client.id} className="group hover:bg-slate-50/30 transition-colors">
                                            <td className="p-6">
                                                <span className="font-black text-slate-800 tracking-tight">{client.name}</span>
                                            </td>
                                            <td className="p-6 text-sm font-bold text-slate-500 italic max-w-xs truncate">
                                                {client.contact_info || 'No contact info provided'}
                                            </td>
                                            <td className="p-6">
                                                <button className="flex items-center gap-1 text-[10px] font-black text-slate-300 uppercase hover:text-accent transition-colors tracking-widest">
                                                    View Details <ExternalLink size={12} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {activeSection === 'models' && !modelsLoading && (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Model</th>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Brand</th>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Power</th>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Voltage</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {models?.filter(m => m.model.toLowerCase().includes(searchTerm.toLowerCase())).map(model => (
                                        <tr key={model.id} className="group hover:bg-slate-50/30 transition-colors">
                                            <td className="p-6">
                                                <span className="font-black text-slate-900 tracking-tighter">{model.model}</span>
                                            </td>
                                            <td className="p-6 text-xs font-black text-accent uppercase">{model.brand}</td>
                                            <td className="p-6 text-sm font-bold text-slate-500">{model.power}</td>
                                            <td className="p-6 text-sm font-bold text-slate-500">{model.input_voltage}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {((activeSection === 'users' && usersLoading) ||
                            (activeSection === 'clients' && clientsLoading) ||
                            (activeSection === 'models' && modelsLoading)) && (
                                <div className="p-20 flex flex-col items-center gap-4">
                                    <div className="w-8 h-8 border-4 border-slate-100 border-t-accent rounded-full animate-spin" />
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Loading {activeSection}...</p>
                                </div>
                            )}
                    </div>
                </div>
            </div>

            {/* Creation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Add {activeSection.slice(0, -1)}</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Management System</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white rounded-2xl shadow-sm border border-transparent hover:border-slate-100 transition-all">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="p-8 space-y-6 overflow-y-auto">
                            {activeSection === 'users' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                                        <input required name="username" onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                                        <input required type="password" name="password" onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role</label>
                                        <select name="role" onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-bold appearance-none">
                                            <option value="technician">Technician</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                </>
                            )}
                            {activeSection === 'clients' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Name</label>
                                        <input required name="name" onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Info</label>
                                        <textarea name="contact_info" onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-bold h-32" />
                                    </div>
                                </>
                            )}
                            {activeSection === 'models' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand</label>
                                            <input required name="brand" onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-bold" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Model</label>
                                            <input required name="model" onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-bold" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Power</label>
                                            <input name="power" onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-bold" placeholder="e.g. 15kW" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Voltage</label>
                                            <input name="input_voltage" onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-bold" placeholder="e.g. 380V" />
                                        </div>
                                    </div>
                                </>
                            )}

                            <button
                                type="submit"
                                disabled={createUserMutation.isPending || createClientMutation.isPending || createModelMutation.isPending}
                                className="w-full bg-accent text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-accent/20 hover:bg-accent-hover transition-all active:scale-95 disabled:opacity-50 mt-4"
                            >
                                {createUserMutation.isPending || createClientMutation.isPending || createModelMutation.isPending ? 'Syncing...' : `Create ${activeSection.slice(0, -1)}`}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
