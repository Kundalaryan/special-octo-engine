import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
    Search, Filter, Calendar, Package, MapPin,
    CheckSquare, Square, Truck, Phone, X, Loader2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import api from '../api/axios';
import { Pagination } from '../components/Pagination';
import { LiveIndicator } from '../components/LiveIndicator';
import type { OrdersApiResponse, Order } from '../types/orders';

const ITEMS_PER_PAGE = 8;

const Delivery = () => {
    const queryClient = useQueryClient();

    // --- State ---
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [deliveryPhone, setDeliveryPhone] = useState('');

    // --- API: Fetch Packed Orders ---
    const { data: response, isLoading, isFetching } = useQuery({
        queryKey: ['orders', 'PACKED', page, search], // Unique key for packed orders
        queryFn: async () => {
            const params: any = {
                page: page,
                size: ITEMS_PER_PAGE,
                status: 'PACKED', // Hardcoded requirement
            };

            // Basic client-side search simulation if backend doesn't support search param on this endpoint
            // If backend supports 'phone' or 'search' param, add it here:
            if (search) params.phone = search;

            const res = await api.get<OrdersApiResponse>('/admin/orders', { params });
            return res.data;
        },
        refetchInterval: 15000,
    });

    const orders = response?.data?.content || [];
    const totalPages = response?.data?.totalPages || 0;

    // --- Mutation: Bulk Assign ---
    const assignMutation = useMutation({
        mutationFn: async () => {
            if (!deliveryPhone) throw new Error("Phone number is required");

            // Create an array of promises to fire requests in parallel
            const promises = Array.from(selectedIds).map(id =>
                api.patch(`/admin/orders/${id}/assign`, null, {
                    params: { deliveryPhone: deliveryPhone }
                })
            );

            return Promise.all(promises);
        },
        onSuccess: () => {
            toast.success(`Successfully assigned ${selectedIds.size} orders!`);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            setSelectedIds(new Set()); // Clear selection
            setDeliveryPhone(''); // Clear input
        },
        onError: (error: any) => {
            console.error(error);
            toast.error("Failed to assign some orders. Check phone number.");
        }
    });

    // --- Handlers ---
    const toggleSelection = (id: number) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === orders.length && orders.length > 0) {
            setSelectedIds(new Set()); // Deselect all
        } else {
            const newSet = new Set(orders.map(o => o.id));
            setSelectedIds(newSet); // Select all on current page
        }
    };

    const isAllSelected = orders.length > 0 && selectedIds.size === orders.length;

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto font-sans relative pb-20">

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Bulk Delivery Assignment</h2>
                    <p className="text-sm text-gray-500 mt-1">Assign packed orders to delivery personnel.</p>
                </div>
                <LiveIndicator isFetching={isFetching} />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-md">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200" size={18} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search Order ID or Customer..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleSelectAll}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 active:scale-95"
                    >
                        {isAllSelected ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                        Select All Packed
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 active:scale-95 group">
                        <Filter size={18} className="group-hover:rotate-12 transition-transform duration-200" /> Filters
                    </button>
                </div>
            </div>

            {/* --- Floating Action Bar (Visible when items selected) --- */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl bg-blue-600 text-white p-3 rounded-xl shadow-2xl z-30 animate-slide-up-bounce flex flex-col md:flex-row items-center justify-between gap-4 border border-blue-500/50 backdrop-blur-sm">
                    <div className="flex items-center gap-4 pl-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center animate-pulse-soft">
                            <CheckSquare size={20} className="text-white" />
                        </div>
                        <div>
                            <p className="font-bold">{selectedIds.size} Orders Selected</p>
                            <p className="text-xs text-blue-100">Bulk assignment in progress</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-200 transition-all duration-200" size={16} />
                            <input
                                type="text"
                                value={deliveryPhone}
                                onChange={(e) => setDeliveryPhone(e.target.value)}
                                placeholder="Delivery Man Phone..."
                                className="w-full pl-10 pr-4 py-2 bg-blue-700 border border-blue-500 rounded-lg text-sm text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
                            />
                        </div>
                        <button
                            onClick={() => assignMutation.mutate()}
                            disabled={assignMutation.isPending || !deliveryPhone}
                            className="bg-white text-blue-600 px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2 active:scale-95"
                        >
                            {assignMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                            Assign Shipment
                        </button>
                        <button onClick={() => setSelectedIds(new Set())} className="p-2 hover:bg-blue-700 rounded-full transition-all duration-200 hover:rotate-90">
                            <X size={20} className="text-blue-200 hover:text-white transition-colors duration-200" />
                        </button>
                    </div>
                </div>
            )}

            {/* --- Grid Content --- */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl animate-shimmer" style={{ backgroundSize: '1000px 100%' }}></div>)}
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
                    <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-gray-50 mb-4"><Package className="text-gray-400" size={24} /></div>
                    <h3 className="text-lg font-medium text-gray-900">No packed orders</h3>
                    <p className="text-gray-500 text-sm mt-1">Wait for orders to be packed before assigning.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {orders.map((order: Order, index: number) => {
                        const isSelected = selectedIds.has(order.id);
                        return (
                            <div
                                key={order.id}
                                className={`relative bg-white rounded-xl p-5 border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer animate-fade-in-up
                        ${isSelected ? 'border-blue-500 ring-2 ring-blue-500 bg-blue-50/20 scale-[1.02]' : 'border-gray-200 shadow-sm hover:border-gray-300'}`}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Checkbox (Clicking card header toggles selection) */}
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded transition-all duration-200 hover:bg-blue-100">
                                            #{order.id}
                                        </span>
                                        <span className="ml-2 text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200 uppercase">
                                            PACKED
                                        </span>
                                    </div>
                                    <div onClick={() => toggleSelection(order.id)} className="cursor-pointer text-blue-600 hover:scale-110 transition-transform duration-200 active:scale-95">
                                        {isSelected ? <CheckSquare size={24} className="animate-scale-in" /> : <Square size={24} className="text-gray-300 hover:text-gray-400" />}
                                    </div>
                                </div>

                                {/* Order Info */}
                                <h3 className="font-bold text-gray-900 text-lg mb-1 transition-colors duration-200">{order.customerName || 'Guest'}</h3>
                                <div className="flex items-start gap-2 text-sm text-gray-500 mb-4 h-10 overflow-hidden">
                                    <MapPin size={16} className="mt-0.5 flex-shrink-0 transition-colors duration-200" />
                                    <span className="line-clamp-2">{order.address}</span>
                                </div>

                                {/* Footer Items */}
                                <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center gap-1 transition-colors duration-200">
                                        <Calendar size={14} />
                                        <span>{format(parseISO(order.createdAt), 'MMM dd, HH:mm')}</span>
                                    </div>
                                    <div className="flex items-center gap-1 font-medium text-gray-700 transition-colors duration-200">
                                        <Package size={14} />
                                        <span>{order.receiptNumber ? 'Receipt Generated' : 'No Receipt'}</span>
                                        {/* Note: API doesn't give item count in summary, usually needs details. 
                                    Using receipt status or totalAmount as placeholder if needed */}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />
        </div>
    );
};

export default Delivery;