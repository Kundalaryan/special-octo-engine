import { useQuery } from '@tanstack/react-query';
import { 
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  ShoppingCart, Package, Truck, CheckCircle, XCircle, Banknote, 
  TrendingUp, TrendingDown, Calendar, RefreshCw 
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import api from '../api/axios';
import type { ApiResponse, DashboardSummary, DailySalesData, SalesComparison } from '../types/dashboard';

// --- 1. Top Stat Card Component ---
const StatCard = ({ label, value, subLabel, icon: Icon, colorClass, iconBg }: any) => (
  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-2">
      <div className="flex flex-col">
        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">{label}</span>
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
      <div className={`p-2.5 rounded-lg ${iconBg} ${colorClass}`}>
        <Icon size={20} />
      </div>
    </div>
    <span className="text-xs text-gray-400 font-medium">{subLabel}</span>
  </div>
);

// --- 2. Bottom Comparison Card Component ---
const ComparisonCard = ({ title, icon: Icon, today, yesterday, percent, trend, isCurrency = false }: any) => {
    const isPositive = trend === 'UP';
    
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex-1">
            <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-lg ${title.includes('Revenue') ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                    <Icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            </div>

            <div className="flex items-end justify-between">
                <div>
                    <p className="text-gray-500 text-sm mb-1">Today</p>
                    <p className="text-4xl font-bold text-gray-900 tracking-tight">
                        {isCurrency ? `₹${today.toLocaleString()}` : today}
                    </p>
                </div>

                {/* Vertical Divider */}
                <div className="h-12 w-px bg-gray-200 mx-4"></div>

                <div>
                    <p className="text-gray-400 text-xs mb-1">Yesterday</p>
                    <p className="text-2xl font-semibold text-gray-400">
                        {isCurrency ? `₹${yesterday.toLocaleString()}` : yesterday}
                    </p>
                </div>

                <div className={`ml-auto flex flex-col items-end`}>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm font-bold 
                        ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {isPositive ? '+' : ''}{percent}%
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 uppercase font-bold">{trend}</span>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
  // --- Data Fetching ---
  
  // 1. Summary (Top Cards)
  const { data: summary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DashboardSummary>>('/admin/dashboard/summary');
      return res.data.data;
    }
  });

  // 2. Trend (Main Chart)
  const { data: trendData } = useQuery({
    queryKey: ['sales-trend'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DailySalesData[]>>('/admin/analytics/sales/7-days');
      return res.data.data;
    }
  });

  // 3. Comparison (Bottom Cards)
  const { data: comparison } = useQuery({
    queryKey: ['sales-comparison'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<SalesComparison>>('/admin/analytics/sales/today-vs-yesterday');
      return res.data.data;
    }
  });

  // Prepare Chart Data
  const chartData = trendData?.map(item => ({
    name: format(parseISO(item.date), 'EEE'),
    total: item.totalOrders,
    delivered: item.deliveredOrders,
    cancelled: item.cancelledOrders,
    cash: item.totalCashCollected
  })) || [];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Analytics Overview</h2>
        <div className="flex gap-3">
             <div className="bg-gray-100 flex items-center px-3 py-2 rounded-lg text-sm text-gray-500 w-64">
                <RefreshCw size={16} className="mr-2 animate-spin-slow" /> 
                <span>Last updated: Just now</span>
             </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors">
                <Calendar size={16} /> Last 7 Days
            </button>
        </div>
      </div>

      {/* --- Section 1: Top Stats Grid (6 Columns) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard 
            label="Total Orders" 
            value={summary?.totalOrders || 0} 
            subLabel="Daily count"
            icon={ShoppingCart}
            iconBg="bg-blue-50" colorClass="text-blue-600"
        />
        <StatCard 
            label="Packed" 
            value={summary?.packedOrders || 0} 
            subLabel="Ready for pickup"
            icon={Package}
            iconBg="bg-indigo-50" colorClass="text-indigo-600"
        />
        <StatCard 
            label="In Transit" 
            value={summary?.outForDelivery || 0} 
            subLabel="On the way"
            icon={Truck}
            iconBg="bg-orange-50" colorClass="text-orange-600"
        />
        <StatCard 
            label="Delivered" 
            value={summary?.deliveredOrders || 0} 
            subLabel="Completed today"
            icon={CheckCircle}
            iconBg="bg-emerald-50" colorClass="text-emerald-600"
        />
        <StatCard 
            label="Cancelled" 
            value={summary?.cancelledOrders || 0} 
            subLabel="Returned/Failed"
            icon={XCircle}
            iconBg="bg-red-50" colorClass="text-red-600"
        />
        <StatCard 
            label="Cash" 
            value={`₹${(summary?.totalCashCollected || 0).toLocaleString()}`} 
            subLabel="Total revenue"
            icon={Banknote}
            iconBg="bg-teal-50" colorClass="text-teal-600"
        />
      </div>

      {/* --- Section 2: Main Dual-Axis Chart --- */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
                <h3 className="text-lg font-bold text-gray-900">Order Performance Trends</h3>
                <p className="text-sm text-gray-500">Daily comparison: Orders, Delivery, Returns & Cash</p>
            </div>
            
            {/* Custom Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium bg-gray-50 px-3 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span> Total
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400"></span> Delivered
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span> Cancelled
                </div>
                <div className="flex items-center gap-2 text-purple-600">
                    <span className="w-3 h-1 rounded-full bg-purple-500"></span> Cash Flow
                </div>
            </div>
        </div>
        
        <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9ca3af', fontSize: 12 }} 
                        dy={10} 
                    />
                    
                    {/* Left Axis: Orders (Count) */}
                    <YAxis 
                        yAxisId="left"
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9ca3af', fontSize: 12 }} 
                    />

                    {/* Right Axis: Cash (Currency) */}
                    <YAxis 
                        yAxisId="right"
                        orientation="right"
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#d8b4fe', fontSize: 12 }} 
                        tickFormatter={(val) => `₹${val}`}
                    />

                    <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any, name: string) => {
                            if(name === 'cash') return [`₹${value}`, 'Cash Flow'];
                            return [value, name.charAt(0).toUpperCase() + name.slice(1)];
                        }}
                    />
                    
                    {/* Areas for Order Counts */}
                    <Area yAxisId="left" type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fill="url(#colorTotal)" />
                    <Area yAxisId="left" type="monotone" dataKey="delivered" stroke="#34d399" strokeWidth={2} fill="url(#colorDelivered)" />
                    
                    {/* Line for Cancelled */}
                    <Line yAxisId="left" type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={2} dot={false} />
                    
                    {/* Dashed Line for Cash (Right Axis) */}
                    <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="cash" 
                        stroke="#a855f7" 
                        strokeWidth={2} 
                        strokeDasharray="5 5"
                        dot={{ r: 4, fill: '#a855f7', strokeWidth: 2, stroke: '#fff' }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* --- Section 3: Today vs Yesterday Comparison --- */}
      <div>
         <div className="flex justify-between items-center mb-4">
             <h3 className="text-xl font-bold text-gray-800">Today vs Yesterday</h3>
             <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-xs font-medium border border-gray-200">
                Real-time Data
             </span>
         </div>
         
         <div className="flex flex-col md:flex-row gap-6">
            <ComparisonCard 
                title="Total Orders"
                icon={ShoppingCart}
                today={comparison?.today.totalOrders || 0}
                yesterday={comparison?.yesterday.totalOrders || 0}
                percent={comparison?.change.ordersPercent || 0}
                trend={comparison?.change.trend}
            />

            <ComparisonCard 
                title="Revenue Collected"
                icon={Banknote}
                isCurrency={true}
                today={comparison?.today.totalCashCollected || 0}
                yesterday={comparison?.yesterday.totalCashCollected || 0}
                percent={comparison?.change.revenuePercent || 0}
                trend={comparison?.change.trend}
            />
         </div>
      </div>

    </div>
  );
};

export default Dashboard;