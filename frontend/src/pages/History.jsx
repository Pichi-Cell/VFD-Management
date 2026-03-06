import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { repairService } from '../services/dataService';
import {
    Search, Filter, Eye, EyeOff, Calendar,
    MoreVertical, ChevronRight, Hash,
    User, Activity, CheckCircle2, Clock, Trash2
} from 'lucide-react';
import { toast } from 'sonner';

const History = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = userData.role === 'admin';
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const { data: repairs, isLoading } = useQuery({
        queryKey: ['repairs', 'all'],
        queryFn: () => repairService.getAll(true)
    });

    const visibilityMutation = useMutation({
        mutationFn: ({ id, isHidden }) => repairService.updateVisibility(id, isHidden),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['repairs'] });
            toast.success('Visibility updated');
        },
        onError: () => {
            toast.error('Failed to update visibility');
        }
    });

    const deleteRepairMutation = useMutation({
        mutationFn: repairService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['repairs'] });
            toast.success('Repair deleted');
        },
        onError: (err) => {
            toast.error(err.response?.data?.msg || 'Failed to delete repair');
        }
    });

    const handleDeleteRepair = (id) => {
        if (window.confirm('Are you sure you want to delete this repair? This will also delete all associated images and component states.')) {
            deleteRepairMutation.mutate(id);
        }
    };

    const filteredRepairs = repairs?.filter(repair => {
        const brand = repair.brand || '';
        const model = repair.model || '';
        const serial = repair.serial_number || '';
        const client = repair.client_name || '';

        const matchesSearch =
            brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
            model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'All' || repair.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
            <p className="text-slate-500 font-medium">Loading history...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by brand, model, serial or client..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all font-medium"
                    />
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="flex-1 md:flex-none px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 font-bold text-slate-600 appearance-none"
                    >
                        <option value="All">All Status</option>
                        <option value="Received">Received</option>
                        <option value="Testing">Testing</option>
                        <option value="Finished">Finished</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Device</th>
                                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Client</th>
                                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Technician</th>
                                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Actions</th>
                                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredRepairs?.map(repair => (
                                <tr key={repair.id} className={`group hover:bg-slate-50/50 transition-colors ${repair.is_hidden ? 'opacity-60 font-medium italic' : ''}`}>
                                    <td className="p-6">
                                        <div className="flex flex-col">
                                            <span className="font-extrabold text-slate-900 leading-tight">{repair.brand} {repair.model}</span>
                                            <span className="text-[11px] font-bold text-slate-400 font-mono mt-1">{repair.serial_number}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className="font-bold text-slate-700">{repair.client_name}</span>
                                    </td>
                                    <td className="p-6">
                                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${repair.status === 'Finished' ? 'bg-success/10 text-success' :
                                            repair.status === 'Received' ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning'
                                            }`}>
                                            {repair.status}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-[10px] font-black text-white">
                                                {repair.technician_name?.[0]?.toUpperCase()}
                                            </div>
                                            <span className="text-sm font-bold text-slate-600">{repair.technician_name}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                                            <Calendar size={16} className="text-slate-300" />
                                            {new Date(repair.entry_date).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => visibilityMutation.mutate({ id: repair.id, isHidden: !repair.is_hidden })}
                                                className={`p-2 rounded-xl transition-all ${repair.is_hidden
                                                    ? 'bg-slate-100 text-slate-400 hover:bg-success/10 hover:text-success'
                                                    : 'bg-success/10 text-success hover:bg-slate-100 hover:text-slate-400'
                                                    }`}
                                                title={repair.is_hidden ? "Show on Board" : "Hide from Board"}
                                            >
                                                {repair.is_hidden ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleDeleteRepair(repair.id)}
                                                    className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:bg-danger/10 hover:text-danger transition-all"
                                                    title="Delete Repair"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <button
                                            onClick={() => navigate(`/repair/${repair.id}`)}
                                            className="p-2 rounded-xl hover:bg-accent/10 text-slate-400 hover:text-accent transition-all"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredRepairs?.length === 0 && (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
                                <Search size={32} />
                            </div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No repairs found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default History;
