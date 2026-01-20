import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Search, CheckCircle, ChevronDown, Phone, PlayCircle, Check, Package
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import api from '../api/axios';
import type { IssuesResponse, IssueSeverity, IssueStatus, Issue } from '../types/support';

import { SEVERITY_COLORS, STATUS_COLORS } from '../utils/theme';

import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { formatEnum } from '../utils/helpers';
import { LiveIndicator } from '../components/LiveIndicator'; // 1. Import LiveIndicator

const ITEMS_PER_PAGE = 8;

// --- Helpers ---
const getSeverityColor = (severity: IssueSeverity) => {
  return SEVERITY_COLORS[severity] || SEVERITY_COLORS.DEFAULT;
};

const getStatusBtnColor = (status: IssueStatus) => {
  return STATUS_COLORS[status] || STATUS_COLORS.DEFAULT;
};

// --- Sub-Component: Issue Card ---
const IssueCard = ({ issue }: { issue: Issue }) => {
  const queryClient = useQueryClient();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const acknowledgeMutation = useMutation({
    mutationFn: async () => await api.patch(`/admin/issues/${issue.id}/acknowledge`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['issues'] }); toast.success('Ticket acknowledged'); setIsDropdownOpen(false); }
  });

  const resolveMutation = useMutation({
    mutationFn: async () => await api.patch(`/admin/issues/${issue.id}/resolve`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['issues'] }); toast.success('Ticket resolved'); setIsDropdownOpen(false); }
  });

  const isLoading = acknowledgeMutation.isPending || resolveMutation.isPending;

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col h-full relative group">

      {/* Header with StatusBadge */}
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-mono text-gray-400 font-semibold">TICKET #{issue.id}</span>
        <StatusBadge className={getSeverityColor(issue.severity)}>
          {issue.severity}
        </StatusBadge>
      </div>

      <h3 className="font-bold text-gray-900 text-lg mb-2 leading-tight">{formatEnum(issue.issueType)}</h3>

      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
          <Phone size={14} className="text-blue-600" />
        </div>
        <p className="text-sm text-gray-600 font-medium">{issue.customerPhone}</p>
      </div>

      <p className="text-sm text-gray-500 line-clamp-3 mb-6 flex-grow leading-relaxed">"{issue.description}"</p>

      {/* Footer with Actions */}
      <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto relative">
        <div className="relative">
          <button
            onClick={() => !isLoading && setIsDropdownOpen(!isDropdownOpen)}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-bold uppercase transition-all duration-200 
                    ${getStatusBtnColor(issue.status)} ${isLoading ? 'opacity-50' : 'hover:brightness-95 hover:shadow-md'}`}
          >
            <span className={`w-2 h-2 rounded-full ${issue.status === 'RESOLVED' ? 'bg-green-500' : issue.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-amber-500'}`}></span>
            {isLoading ? 'Updating...' : formatEnum(issue.status)}
            <ChevronDown size={14} className="transition-transform duration-200 group-hover:translate-y-0.5" />
          </button>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
              <div className="absolute left-0 bottom-full mb-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-20 animate-fade-in">
                <div className="p-1">
                  {issue.status === 'OPEN' && (
                    <button onClick={() => acknowledgeMutation.mutate()} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg flex items-center gap-2 transition-colors duration-200">
                      <PlayCircle size={14} /> Mark In Progress
                    </button>
                  )}
                  {issue.status !== 'RESOLVED' && (
                    <button onClick={() => resolveMutation.mutate()} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg flex items-center gap-2 transition-colors duration-200">
                      <Check size={14} /> Mark Resolved
                    </button>
                  )}
                  {issue.status === 'RESOLVED' && (
                    <div className="px-3 py-2 text-xs text-gray-400 italic text-center">Ticket is resolved</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <span className="text-xs text-gray-400 font-medium">{formatDistanceToNow(parseISO(issue.createdAt), { addSuffix: true })}</span>
      </div>

      <div className="absolute bottom-5 right-32 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded flex items-center gap-1 border border-gray-200">
          <Package size={10} /> #{issue.orderId}
        </span>
      </div>
    </div>
  );
};

// --- Main Page ---
const Support = () => {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<IssueStatus | ''>('');
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity | ''>('');
  const [search, setSearch] = useState('');

  // 2. Add isFetching and refetchInterval
  const { data: response, isLoading, isFetching } = useQuery({
    queryKey: ['issues', page, statusFilter, severityFilter],
    queryFn: async () => {
      const params: Record<string, string | number | undefined> = { page, size: ITEMS_PER_PAGE };
      if (statusFilter) params.status = statusFilter;
      if (severityFilter) params.severity = severityFilter;
      const res = await api.get<IssuesResponse>('/admin/issues', { params });
      return res.data;
    },
    placeholderData: (prev) => prev,
    refetchInterval: 10000, // Poll every 10 seconds (High Priority)
  });

  const issues = response?.data?.content || [];
  const totalPages = response?.data?.totalPages || 0;

  const filteredIssues = issues.filter(issue =>
    search === '' ||
    issue.customerPhone.includes(search) ||
    issue.description.toLowerCase().includes(search.toLowerCase()) ||
    issue.id.toString().includes(search)
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Help & Support Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Manage and resolve customer support tickets.</p>
        </div>

        {/* 3. Add LiveIndicator to the actions area */}
        <div className="flex items-center gap-3">
          <LiveIndicator isFetching={isFetching} />

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as IssueStatus | '')} className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500 hover:bg-gray-50 cursor-pointer">
            <option value="">Status: All</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value as IssueSeverity | '')} className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500 hover:bg-gray-50 cursor-pointer">
            <option value="">Severity: All</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
        </div>
        <div className="text-sm text-gray-500 font-medium">{response?.data?.totalElements || 0} Active Tickets</div>
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 animate-pulse">{[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>)}</div>
      ) : filteredIssues.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
          <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-gray-50 mb-4"><CheckCircle className="text-gray-400" size={24} /></div>
          <h3 className="text-lg font-medium text-gray-900">No tickets found</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 animate-fade-in">
          {filteredIssues.map((issue) => <IssueCard key={issue.id} issue={issue} />)}
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

export default Support;