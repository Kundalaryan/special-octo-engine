import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, MessageSquare, User, Calendar, Loader2 
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import api from '../api/axios';
import type { FeedbackResponse, FeedbackStatus } from '../types/feedback';

// --- NEW IMPORTS ---
import { Pagination } from '../components/Pagination';
import { LiveIndicator } from '../components/LiveIndicator';

const ITEMS_PER_PAGE = 10;

const Feedback = () => {
  // --- State ---
  const [page, setPage] = useState(0);
  
  // Search State
  const [searchInput, setSearchInput] = useState('');
  const [debouncedPhone, setDebouncedPhone] = useState('');

  // Client-Side Filter State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Debounce Search (500ms delay)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedPhone(searchInput);
      setPage(0); // Reset to first page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // --- API Fetch ---
  const { data: response, isLoading, isFetching } = useQuery({
    queryKey: ['suggestions', page, debouncedPhone],
    queryFn: async () => {
      const params: any = {
        page: page,
        size: ITEMS_PER_PAGE,
      };
      
      if (debouncedPhone) {
        params.phone = debouncedPhone;
      }

      const res = await api.get<FeedbackResponse>('/admin/suggestions', { params });
      return res.data;
    },
    placeholderData: (prev) => prev,
    refetchInterval: 60000, // <--- Polling: Update every 60 seconds
  });

  const rawSuggestions = response?.data?.content || [];
  const totalPages = response?.data?.totalPages || 0;

  // --- Client-Side Date Filtering ---
  const displayedSuggestions = useMemo(() => {
    if (!startDate && !endDate) return rawSuggestions;

    return rawSuggestions.filter((item) => {
      const itemDate = item.createdDate; // Format is YYYY-MM-DD from API

      // Simple String Comparison works for YYYY-MM-DD
      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
      
      return true;
    });
  }, [rawSuggestions, startDate, endDate]);

  // --- Helpers ---
  const getStatusColor = (status: FeedbackStatus) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'IN_REVIEW': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'RESOLVED': return 'bg-green-100 text-green-700 border-green-200';
      case 'CLOSED': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusLabel = (status: FeedbackStatus) => {
    return status.replace(/_/g, ' ');
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Suggestions & Feedback</h2>
          <p className="text-sm text-gray-500 mt-1">View-only archive of customer voices and service requests.</p>
        </div>
        {/* Live Indicator Added Here */}
        <LiveIndicator isFetching={isFetching} />
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        
        {/* Search */}
        <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by phone number..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
        </div>

        {/* Client Side Date Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white">
                <Calendar size={16} className="text-gray-500" />
                <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-sm text-gray-700 outline-none w-32 cursor-pointer"
                />
                <span className="text-gray-400">-</span>
                <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-sm text-gray-700 outline-none w-32 cursor-pointer"
                />
            </div>
            {(startDate || endDate) && (
                <button 
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="text-xs text-red-500 hover:text-red-700 font-medium px-2"
                >
                    Clear Dates
                </button>
            )}
        </div>
      </div>

      {/* Content List */}
      <div className="space-y-4">
        
        {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
                <p className="text-gray-500">Loading feedback...</p>
            </div>
        )}

        {!isLoading && displayedSuggestions.length === 0 && (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
                <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                    <MessageSquare className="text-gray-400" size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No suggestions found</h3>
                <p className="text-gray-500 text-sm mt-1">
                    {startDate || endDate ? 'Try adjusting your date filters.' : 'Try searching for a different phone number.'}
                </p>
            </div>
        )}

        {displayedSuggestions.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                        {/* Avatar / Initials */}
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100">
                            <User size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm">{item.userPhone}</h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {format(parseISO(item.createdAt), 'MMM dd, yyyy • hh:mm a')}
                            </p>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(item.status)}`}>
                        {getStatusLabel(item.status)}
                    </span>
                </div>

                {/* Message Body */}
                <div className="pl-14">
                    <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                        "{item.message}"
                    </p>
                </div>
            </div>
        ))}
      </div>

      {/* Reusable Pagination */}
      <Pagination 
        page={page} 
        totalPages={totalPages} 
        onPageChange={setPage} 
      />
    </div>
  );
};

export default Feedback;