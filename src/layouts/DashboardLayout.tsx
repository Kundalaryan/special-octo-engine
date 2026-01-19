import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, BarChart3, Settings, 
  LogOut, Bell, Search, Menu 
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, path, active }: any) => {
  const navigate = useNavigate();
  return (
    <div 
      onClick={() => navigate(path)}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors mb-1
        ${active ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
    >
      <Icon size={20} />
      <span className="font-medium text-sm">{label}</span>
    </div>
  );
};

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full hidden md:flex flex-col z-10">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Package size={20} />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-tight">FreshCart</h1>
              <span className="text-xs text-gray-500">Management</span>
            </div>
          </div>

          <nav className="space-y-1">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" path="/dashboard" active={location.pathname === '/dashboard'} />
            <SidebarItem icon={Package} label="Inventory" path="/inventory" active={location.pathname === '/inventory'} />
            <SidebarItem icon={ShoppingCart} label="Orders" path="/orders" active={location.pathname === '/orders'} />
            <SidebarItem icon={BarChart3} label="Analytics" path="/analytics" active={location.pathname === '/analytics'} />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-gray-100">
            <SidebarItem icon={Settings} label="Settings" path="/settings" />
            <div onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer mt-1">
                <LogOut size={20} />
                <span className="font-medium text-sm">Logout</span>
            </div>
            
            <div className="flex items-center gap-3 mt-6 px-2">
                <img src="https://ui-avatars.com/api/?name=Alex+Johnson&background=0D8ABC&color=fff" className="w-10 h-10 rounded-full" alt="Profile" />
                <div>
                    <p className="text-sm font-semibold text-gray-900">Alex Johnson</p>
                    <p className="text-xs text-gray-500">Store Manager</p>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <Menu className="md:hidden text-gray-500" />
                <h2 className="text-xl font-bold text-gray-800">Overview</h2>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search data..." 
                        className="pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none w-64 transition-all"
                    />
                </div>
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>
            </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="p-8">
            <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;