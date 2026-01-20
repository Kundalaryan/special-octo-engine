import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Search, Calendar, MoreHorizontal, Phone, MapPin, Clock, Loader2, X,
  Check, Package, Truck, Home, AlertCircle, FileText, ChevronDown
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import api from '../api/axios';

// --- Components ---
import { LiveIndicator } from '../components/LiveIndicator';
import { Pagination } from '../components/Pagination';
import type { OrdersApiResponse, OrderStatus, OrderDetailsResponse, TimelineResponse } from '../types/orders';

// --- Config ---
const ITEMS_PER_PAGE = 9;

const TABS: { label: string; value: OrderStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'ORDER_PLACED' },
  { label: 'Packed', value: 'PACKED' },
  { label: 'Shipped', value: 'OUT_FOR_DELIVERY' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const ORDER_STEPS: { label: string; status: OrderStatus; icon: React.ElementType }[] = [
  { label: 'Pending', status: 'ORDER_PLACED', icon: Clock },
  { label: 'Packed', status: 'PACKED', icon: Package },
  { label: 'Shipped', status: 'OUT_FOR_DELIVERY', icon: Truck },
  { label: 'Delivered', status: 'DELIVERED', icon: Home },
];

// ==========================================
// SUB-COMPONENT: ORDER DETAILS MODAL
// ==========================================
const OrderDetailsModal = ({ orderId, onClose }: { orderId: number; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // 1. Fetch Order Details
  const { data: detailsRes, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['order-details', orderId],
    queryFn: async () => {
      const res = await api.get<OrderDetailsResponse>(`/admin/orders/getdetails/${orderId}`);
      return res.data.data;
    }
  });

  // 2. Fetch Timeline
  const { data: timelineRes, isLoading: isLoadingTimeline } = useQuery({
    queryKey: ['order-timeline', orderId],
    queryFn: async () => {
      const res = await api.get<TimelineResponse>(`/admin/orders/${orderId}/timeline`);
      return res.data.data;
    }
  });

  // 3. Invoice Download
  const downloadInvoiceMutation = useMutation({
    mutationFn: async () => {
      const res = await api.get(`/admin/orders/${orderId}/receipt`, { responseType: 'blob' });
      return res.data;
    },
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Invoice downloaded');
    },
    onError: () => toast.error('Failed to download invoice')
  });

  // 4. Update Status
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: OrderStatus) => {
      return await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
    },
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-details', orderId] });
      queryClient.invalidateQueries({ queryKey: ['order-timeline', orderId] });
      toast.success(`Order status updated to ${newStatus}`);
      setIsStatusDropdownOpen(false);
      // Auto-close modal after successful update
      setTimeout(() => onClose(), 500);
    },
    onError: () => toast.error('Failed to update status')
  });

  // 5. Cancel Order
  const cancelOrderMutation = useMutation({
    mutationFn: async () => {
      return await api.patch(`/admin/orders/${orderId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-details', orderId] });
      queryClient.invalidateQueries({ queryKey: ['order-timeline', orderId] });
      toast.success('Order cancelled successfully');
      // Auto-close modal after successful cancellation
      setTimeout(() => onClose(), 500);
    },
    onError: () => toast.error('Failed to cancel order')
  });

  const getNextAction = (currentStatus: OrderStatus) => {
    switch (currentStatus) {
      case 'ORDER_PLACED': return { label: 'Ready to Pack', next: 'PACKED' as OrderStatus };
      case 'PACKED': return { label: 'Ship Order', next: 'OUT_FOR_DELIVERY' as OrderStatus };
      case 'OUT_FOR_DELIVERY': return { label: 'Mark Delivered', next: 'DELIVERED' as OrderStatus };
      default: return null;
    }
  };

  if (isLoadingDetails || isLoadingTimeline) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-2xl flex flex-col items-center">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
          <p className="text-gray-500 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  const details = detailsRes!;
  const timeline = timelineRes || [];
  const nextAction = getNextAction(details.status);
  const isCancelled = details.status === 'CANCELLED';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-auto animate-fade-in relative flex flex-col max-h-[90vh]">

        {/* --- Sticky Header --- */}
        <div className="sticky top-0 bg-white px-8 py-6 border-b border-gray-100 flex justify-between items-start rounded-t-xl z-20 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">Order #{details.orderId}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border 
                            ${details.status === 'ORDER_PLACED' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                  details.status === 'PACKED' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    details.status === 'OUT_FOR_DELIVERY' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                      details.status === 'DELIVERED' ? 'bg-green-100 text-green-700 border-green-200' :
                        'bg-red-100 text-red-700 border-red-200'}`}>
                {details.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-1">Placed on {format(parseISO(details.createdAt), 'MMM dd, yyyy at hh:mm a')}</p>
          </div>

          <div className="flex items-center gap-3">
            {!isCancelled && details.status !== 'DELIVERED' && (
              <div className="relative">
                <button
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  Update Status <ChevronDown size={16} />
                </button>
                {isStatusDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsStatusDropdownOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden py-1 z-20">
                      {ORDER_STEPS.map(step => (
                        <button
                          key={step.status}
                          onClick={() => updateStatusMutation.mutate(step.status)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                        >
                          Mark as {step.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-8 space-y-8">
          {/* Timeline */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6">Order Journey</h3>
            <div className="relative flex justify-between items-center max-w-3xl mx-auto">
              <div className="absolute top-5 left-0 w-full h-1 bg-gray-100 -z-0"></div>
              <div className="absolute top-5 left-0 h-1 bg-blue-500 -z-0 transition-all duration-500"
                style={{ width: isCancelled ? '0%' : details.status === 'DELIVERED' ? '100%' : details.status === 'OUT_FOR_DELIVERY' ? '66%' : details.status === 'PACKED' ? '33%' : '0%' }}>
              </div>
              {ORDER_STEPS.map((step) => {
                const isCompleted = timeline.some(t => t.status === step.status);
                const eventData = timeline.find(t => t.status === step.status);
                const isCurrent = details.status === step.status;
                return (
                  <div key={step.status} className="flex flex-col items-center relative z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300
                                        ${isCompleted || isCurrent ? 'bg-blue-600 border-blue-100 text-white' : 'bg-white border-gray-200 text-gray-300'}`}>
                      {isCompleted ? <Check size={18} strokeWidth={3} /> : <step.icon size={18} />}
                    </div>
                    <p className={`text-sm font-semibold mt-3 ${isCompleted || isCurrent ? 'text-blue-600' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    {eventData && (
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                        {format(parseISO(eventData.timestamp), 'hh:mm a, MMM dd')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Customer Details</h4>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">CP</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Customer Phone</p>
                  <p className="text-blue-600 font-medium text-sm mb-1">{details.customerPhone}</p>
                  <div className="flex items-center gap-2 text-gray-500 text-xs mt-2">
                    <Phone size={12} />
                    <span>{details.deliveryPhone} (Delivery)</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Delivery Address</h4>
              <div className="flex items-start gap-4">
                <div className="mt-1 text-red-500"><MapPin size={20} /></div>
                <div><p className="text-gray-900 text-sm font-medium leading-relaxed">{details.address}</p></div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Ordered Items</h3>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3">Product</th>
                    <th className="px-6 py-3 text-center">Qty</th>
                    <th className="px-6 py-3 text-right">Price</th>
                    <th className="px-6 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {details.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400"><Package size={14} /></div>
                        {item.productName}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">{item.quantity}</td>
                      <td className="px-6 py-4 text-right text-gray-600">₹{item.price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">₹{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-right text-gray-500 font-medium">Subtotal</td>
                    <td className="px-6 py-4 text-right font-bold text-lg text-gray-900">₹{details.totalAmount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-between items-center">
          <div className="flex gap-4">
            {!isCancelled && details.status !== 'DELIVERED' && (
              <button onClick={() => { if (confirm('Are you sure you want to cancel this order?')) cancelOrderMutation.mutate() }} className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <AlertCircle size={16} /> Cancel Order
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => downloadInvoiceMutation.mutate()} disabled={downloadInvoiceMutation.isPending} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
              {downloadInvoiceMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />} Print Invoice
            </button>
            {nextAction && !isCancelled && (
              <button onClick={() => updateStatusMutation.mutate(nextAction.next)} disabled={updateStatusMutation.isPending} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-md shadow-blue-200 transition-all flex items-center gap-2">
                {updateStatusMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                {nextAction.label}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN ORDERS COMPONENT
// ==========================================
const Orders = () => {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<OrderStatus | ''>('');
  const [page, setPage] = useState(0);

  // Search & Dates
  const [searchPhoneInput, setSearchPhoneInput] = useState('');
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');

  // Computed Query Keys
  const [debouncedPhone, setDebouncedPhone] = useState('');
  const [queryDates, setQueryDates] = useState<{ from: string, to: string } | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedPhone(searchPhoneInput); setPage(0); }, 500);
    return () => clearTimeout(handler);
  }, [searchPhoneInput]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStartDateInput(val);
    if (val && endDateInput) {
      setQueryDates({ from: val, to: endDateInput });
      setPage(0);
    } else if (!val && !endDateInput) {
      setQueryDates(null);
      setPage(0);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEndDateInput(val);
    if (startDateInput && val) {
      setQueryDates({ from: startDateInput, to: val });
      setPage(0);
    } else if (!startDateInput && !val) {
      setQueryDates(null);
      setPage(0);
    }
  };

  const handleClearDates = () => {
    setStartDateInput('');
    setEndDateInput('');
    setQueryDates(null);
    setPage(0);
  };

  // --- API Fetch ---
  const { data: response, isLoading, isFetching, error } = useQuery({
    queryKey: ['orders', page, activeTab, debouncedPhone, queryDates],
    queryFn: async () => {
      console.log('Fetching orders with params:', { page, activeTab, debouncedPhone, queryDates });
      const params: Record<string, string | number> = { page: page, size: ITEMS_PER_PAGE };
      if (activeTab) params.status = activeTab;
      if (debouncedPhone) params.phone = debouncedPhone;
      if (queryDates) { params.from = queryDates.from; params.to = queryDates.to; }

      const res = await api.get<OrdersApiResponse>('/admin/orders', { params });
      console.log('Orders API Response:', res.data);
      return res.data;
    },
    // Removed placeholderData to allow immediate updates
    refetchInterval: 15000,
  });

  console.log('Render State:', { isLoading, isFetching, error, response });

  const orders = response?.data?.content || [];
  const totalPages = response?.data?.totalPages || 0;

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'ORDER_PLACED': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'PACKED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'OUT_FOR_DELIVERY': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'DELIVERED': return 'bg-green-100 text-green-700 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatStatus = (status: OrderStatus) => {
    if (!status) return 'Unknown';
    if (status === 'ORDER_PLACED') return 'Pending';
    if (status === 'OUT_FOR_DELIVERY') return 'On The Way';
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans">

      {selectedOrderId && (
        <OrderDetailsModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Orders Management</h2>
          <p className="text-sm text-gray-500 mt-1">Track and manage customer orders.</p>
        </div>
        {/* Live Indicator Added Here */}
        <LiveIndicator isFetching={isFetching} />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" value={searchPhoneInput} onChange={(e) => setSearchPhoneInput(e.target.value)} placeholder="Search by phone number..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
              <Calendar size={16} className="text-gray-500" />
              <input type="date" value={startDateInput} onChange={handleStartDateChange} className="bg-transparent text-sm text-gray-700 outline-none w-32 cursor-pointer" />
              <span className="text-gray-400">-</span>
              <input type="date" value={endDateInput} onChange={handleEndDateChange} className="bg-transparent text-sm text-gray-700 outline-none w-32 cursor-pointer" />
            </div>
            {(startDateInput || endDateInput) && <button onClick={handleClearDates} className="text-xs text-red-500 hover:text-red-700 font-medium px-2">Clear</button>}
          </div>
        </div>
        <div className="border-t border-gray-100 pt-4 overflow-x-auto">
          <div className="flex gap-2">
            {TABS.map((tab) => (
              <button key={tab.label} onClick={() => { setActiveTab(tab.value); setPage(0); }} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.value ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{tab.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-72 bg-gray-200 rounded-xl"></div>)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
          <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-gray-50 mb-4"><Search className="text-gray-400" size={24} /></div>
          <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {orders.map((order) => {
            if (!order) return null;
            return (
              <div key={order.id} onClick={() => setSelectedOrderId(order.id)} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer ring-2 ring-transparent hover:ring-blue-500/20 hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div><span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded transition-all duration-200 hover:bg-blue-100">#{order.id}</span><h3 className="font-bold text-gray-900 text-lg mt-2 line-clamp-1">{order.customerName || 'Guest Customer'}</h3></div>
                  <MoreHorizontal className="text-gray-400 transition-colors duration-200 hover:text-gray-600" size={20} />
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-gray-600"><Clock size={16} className="text-gray-400" /><span>{order.createdAt ? format(parseISO(order.createdAt), 'MMM dd, yyyy • hh:mm a') : 'N/A'}</span></div>
                  <div className="flex items-center gap-3 text-sm text-gray-600"><Phone size={16} className="text-gray-400" /><span className="font-mono">{order.customerPhone || 'No Phone'}</span></div>
                  <div className="flex items-start gap-3 text-sm text-gray-600"><MapPin size={16} className="text-gray-400 mt-0.5" /><span className="line-clamp-2">{order.address || 'No address provided'}</span></div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div><p className="text-xs text-gray-500 font-medium">Total Amount</p><p className="text-xl font-bold text-gray-900">₹{order.totalAmount?.toFixed(2) || '0.00'}</p></div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>{formatStatus(order.status || 'ORDER_PLACED')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reusable Pagination */}
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default Orders;