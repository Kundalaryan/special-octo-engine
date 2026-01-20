import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
    icon: LucideIcon;
    label: string;
    path: string;
    active?: boolean;
    onClick?: () => void;
}

export const SidebarItem = ({ icon: Icon, label, path, active, onClick }: SidebarItemProps) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) {
            onClick();
        }
        navigate(path);
    };

    return (
        <div
            onClick={handleClick}
            className={`
                flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors
                ${active
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }
            `}
        >
            <Icon size={18} />
            <span className="text-sm font-medium">{label}</span>
        </div>
    );
};
