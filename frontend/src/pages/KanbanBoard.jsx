import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { repairService } from '../services/dataService';
import { Clock, MoreVertical, Plus, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const STAGES = [
    'Received', 'Testing', 'Disassembled', 'Cleaned', 'Measured', 'Diagnosed', 'Assembled', 'Finished'
];

const KanbanBoard = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: repairs, isLoading } = useQuery({
        queryKey: ['repairs'],
        queryFn: () => repairService.getAll()
    });

    const mutation = useMutation({
        mutationFn: ({ id, status }) => repairService.updateStatus(id, status),
        onMutate: async ({ id, status }) => {
            await queryClient.cancelQueries({ queryKey: ['repairs'] });
            const previousRepairs = queryClient.getQueryData(['repairs']);

            queryClient.setQueryData(['repairs'], (old) => {
                if (!old) return [];
                const repairToMove = old.find(r => r.id.toString() === id.toString());
                if (!repairToMove) return old;

                const updatedRepair = { ...repairToMove, status };
                const otherRepairs = old.filter(r => r.id.toString() !== id.toString());

                // Match the server's ORDER BY updated_at DESC by moving it to the top
                return [updatedRepair, ...otherRepairs];
            });

            return { previousRepairs };
        },
        onError: (err, variables, context) => {
            if (context?.previousRepairs) {
                queryClient.setQueryData(['repairs'], context.previousRepairs);
            }
            toast.error('Failed to update repair status');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['repairs'] });
        },
    });

    const visibilityMutation = useMutation({
        mutationFn: ({ id, isHidden }) => repairService.updateVisibility(id, isHidden),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['repairs'] });
            toast.success('Repair hidden from board');
        },
        onError: () => {
            toast.error('Failed to hide repair');
        }
    });


    const onDragEnd = (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        mutation.mutate({ id: draggableId, status: destination.droppableId });
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
            <p className="text-slate-500 font-medium animate-pulse">Loading repairs...</p>
        </div>
    );

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-10 pb-8 min-w-max">
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
                                onClick={() => window.dispatchEvent(new CustomEvent('open-new-repair'))}
                                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"
                            >
                                <Plus size={18} />
                            </button>
                        </div>

                        <Droppable droppableId={stage}>
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={`flex flex-col gap-4 min-h-[600px] p-3 rounded-3xl border-2 border-dashed transition-colors ${snapshot.isDraggingOver ? 'bg-slate-200/60 border-accent/30' : 'bg-slate-100/40 border-slate-200/60 shadow-inner'
                                        }`}
                                >
                                    {repairs?.filter(r => r.status === stage).map((repair, index) => (
                                        <Draggable key={repair.id.toString()} draggableId={repair.id.toString()} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    onClick={() => navigate(`/repair/${repair.id}`)}
                                                    className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-xl hover:border-accent/30 hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden ${snapshot.isDragging ? 'shadow-2xl border-accent/50 scale-[1.02] z-50' : ''
                                                        }`}
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
                                                        <div className="flex items-center gap-2">
                                                            {repair.status === 'Finished' && (
                                                                <button
                                                                    title="Hide from board"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (window.confirm('Hide this repair from the board?')) {
                                                                            visibilityMutation.mutate({ id: repair.id, isHidden: true });
                                                                        }
                                                                    }}
                                                                    className="p-1.5 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-lg transition-all"
                                                                >
                                                                    <EyeOff size={14} />
                                                                </button>
                                                            )}
                                                            <div className="w-fit h-7 px-2 pb-1 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-s font-black text-white ring-2 ring-slate-100">
                                                                {repair.technician_name || 'Tecnico'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}

                                    {repairs?.filter(r => r.status === stage).length === 0 && (
                                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200/50 rounded-2xl m-2">
                                            <p className="text-xs font-bold uppercase tracking-widest">Empty Stage</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </div>
        </DragDropContext>
    );
};

export default KanbanBoard;
