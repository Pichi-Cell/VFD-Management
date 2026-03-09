import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AuthenticatedImage = ({ src, className, alt = '', style }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let objectUrl = null;

        const fetchImage = async () => {
            try {
                setLoading(true);
                setError(false);

                // Construct the full URL if it's relative
                const fullUrl = src.startsWith('http') ? src : `http://localhost:3000${src}`;

                const response = await api.get(fullUrl, {
                    responseType: 'blob'
                });

                objectUrl = URL.createObjectURL(response.data);
                setImageUrl(objectUrl);
                setLoading(false);
            } catch (err) {
                console.error('Error loading authenticated image:', err);
                setError(true);
                setLoading(false);
            }
        };

        if (src) {
            fetchImage();
        }

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [src]);

    if (loading) {
        return <div className={`${className} bg-slate-100 animate-pulse flex items-center justify-center text-[10px] text-slate-400 font-bold`}>LOADING...</div>;
    }

    if (error) {
        return <div className={`${className} bg-slate-100 flex items-center justify-center text-[10px] text-danger font-bold`}>ERROR</div>;
    }

    return <img src={imageUrl} className={className} alt={alt} style={style} crossOrigin="anonymous" />;
};

export default AuthenticatedImage;
