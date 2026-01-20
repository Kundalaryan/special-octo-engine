import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// Create a client for API caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Only retry failed requests once
      staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
      refetchOnWindowFocus: false, // Don't refetch just because I clicked alt-tab
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)