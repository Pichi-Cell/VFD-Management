import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-primary/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div className="bg-white rounded-[2rem] shadow-2xl relative z-10 w-full max-w-lg border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-xl font-black text-slate-800">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-8">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
