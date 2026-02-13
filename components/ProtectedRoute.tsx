import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    allowedEmail: string;
    redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedEmail, redirectPath = '/' }) => {
    const [loading, setLoading] = useState(true);
    const [isAllowed, setIsAllowed] = useState(false);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user?.email === allowedEmail) {
            setIsAllowed(true);
        } else {
            setIsAllowed(false);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <Loader2 className="animate-spin text-brand-primary" size={32} />
            </div>
        );
    }

    if (!isAllowed) {
        return <Navigate to={redirectPath} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
