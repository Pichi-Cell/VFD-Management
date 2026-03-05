import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { repairService } from '../services/dataService';
import { Clock, MoreVertical, Plus } from 'lucide-react';
import NewRepairModal from '../components/NewRepairModal';

const STAGES = [
    'Received', 'Testing', 'Disassembled', 'Cleaned', 'Measured', 'Diagnosed', 'Assembled', 'Finished'
];

const KanbanBoard = () => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data: repairs, isLoading } = useQuery({
        queryKey: ['repairs'],
        queryFn: repairService.getAll
    });

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
            <p className="text-slate-500 font-medium animate-pulse">Loading repairs...</p>
        </div>
    );

    return (
        <div className="flex gap-6 overflow-x-auto pb-8 min-h-[calc(100vh-200px)] snap-x snaps-mandatory">
            {STAGES.map(stage => (
                <div key={stage} className="flex-shrink-0 w-[350px] snap-center">
                    <div className="flex items-center justify-between mb-5 px-3">
                        <div className="flex items-center gap-3">
                            <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{stage}</h2>
                            <span className="bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full text-[11px] font-black">
                                {repairs?.filter(r => r.status === stage).length || 0}
                            </span>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    <div className="flex flex-col gap-4 min-h-[600px] p-3 bg-slate-100/40 rounded-3xl border-2 border-dashed border-slate-200/60 shadow-inner">
                        {repairs?.filter(r => r.status === stage).map(repair => (
                            <div
                                key={repair.id}
                                onClick={() => navigate(`/repair/${repair.id}`)}
                                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-xl hover:border-accent/30 hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden"
                            >
                                {/* Status Indicator Bar */}
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${repair.type === 'Approval' ? 'bg-success' : 'bg-warning'}`} />

                                <div className="flex justify-between items-start mb-4">
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-widest ${repair.type === 'Approval' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                        {repair.type}
                                    </span>
                                    <button className="text-slate-300 hover:text-slate-600 transition-colors" onClick={(e) => e.stopPropagation()}>
                                        <MoreVertical size={18} />
                                    </button>
                                </div>

                                <h3 className="font-extrabold text-slate-900 text-lg leading-tight mb-2 group-hover:text-accent transition-colors">
                                    {repair.brand} {repair.model}
                                </h3>

                                <div className="flex items-center gap-2 mb-5">
                                    <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-tighter">S/N</span>
                                    <p className="text-xs text-slate-500 font-mono font-medium">{repair.serial_number}</p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                                        <Clock size={14} className="text-slate-300" />
                                        <span>{new Date(repair.entry_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-7 h-7 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-[10px] font-black text-white ring-2 ring-slate-100">
                                            {repair.technician_name?.[0] || 'T'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {repairs?.filter(r => r.status === stage).length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200/50 rounded-2xl m-2">
                                <p className="text-xs font-bold uppercase tracking-widest">Empty Stage</p>
                            </div>
                        )}
                    </div>
                </div>
            ))}
            <NewRepairModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
};

export default KanbanBoard;
