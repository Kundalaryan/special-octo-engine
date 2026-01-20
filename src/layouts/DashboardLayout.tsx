import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Package, ShoppingCart, LogOut, Bell, Search, Menu, MessageSquare, LifeBuoy, X, Truck
} from 'lucide-react';
import { SidebarItem } from '../components/SidebarItem';

const DashboardLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <div className="flex min-h-screen bg-gray-50">

            {/* Mobile Menu Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={closeMobileMenu}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`
                w-64 bg-white border-r border-gray-200 fixed min-h-screen flex flex-col z-50 transition-transform duration-200
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 md:static
            `}>
                {/* Logo */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Package size={18} className="text-white" />
                            </div>
                            <div>
                                <h1 className="font-semibold text-gray-900">FreshCart</h1>
                                <span className="text-xs text-gray-500">Admin</span>
                            </div>
                        </div>
                        <button onClick={closeMobileMenu} className="md:hidden text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <SidebarItem
                        icon={LayoutDashboard}
                        label="Dashboard"
                        path="/dashboard"
                        active={location.pathname === '/dashboard'}
                        onClick={closeMobileMenu}
                    />
                    <SidebarItem
                        icon={Package}
                        label="Inventory"
                        path="/inventory"
                        active={location.pathname === '/inventory'}
                        onClick={closeMobileMenu}
                    />
                    <SidebarItem
                        icon={ShoppingCart}
                        label="Orders"
                        path="/orders"
                        active={location.pathname === '/orders'}
                        onClick={closeMobileMenu}
                    />
                    <SidebarItem
                        icon={MessageSquare}
                        label="Feedback"
                        path="/feedback"
                        active={location.pathname === '/feedback'}
                        onClick={closeMobileMenu}
                    />
                    <SidebarItem
                        icon={LifeBuoy}
                        label="Support"
                        path="/support"
                        active={location.pathname === '/support'}
                        onClick={closeMobileMenu}
                    />
                    <SidebarItem icon={Truck} label="Delivery" path="/delivery" active={location.pathname === '/delivery'} />
                </nav>

                {/* Bottom Section */}
                <div className="p-4 border-t border-gray-200">
                    <div
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors mb-4"
                    >
                        <LogOut size={18} />
                        <span className="text-sm font-medium">Logout</span>
                    </div>

                    <div className="flex items-center gap-3 px-3 py-2">
                        <img
                            src="https://ui-avatars.com/api/?name=Admin&background=3b82f6&color=fff"
                            className="w-9 h-9 rounded-full"
                            alt="Profile"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
                            <p className="text-xs text-gray-500">Manager</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleMobileMenu}
                            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            <Menu size={20} />
                        </button>
                        <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300 w-64"
                            />
                        </div>
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg relative">
                            <Bell size={18} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 md:p-8 overflow-x-hidden flex-1">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;