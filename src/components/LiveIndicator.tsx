import { RefreshCw } from "lucide-react";

export const LiveIndicator = ({ isFetching }: { isFetching: boolean }) => {
  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
      </span>
      <span className="text-xs font-medium text-gray-600">
        Live Updates
      </span>
      {isFetching && (
        <RefreshCw size={12} className="text-blue-500 animate-spin ml-1" />
      )}
    </div>
  );
};