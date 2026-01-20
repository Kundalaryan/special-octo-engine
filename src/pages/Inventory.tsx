import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Search, Plus, ChevronDown, Edit3, Package, Trash2, Filter, RefreshCw, AlertCircle, TrendingDown
} from 'lucide-react';
import api from '../api/axios';
import type { InventoryResponse, Product } from '../types/inventory';
import { CATEGORIES, PRICE_RANGES } from '../utils/inventory-constants';
import { Pagination } from '../components/Pagination';
import AddProductModal from '../components/inventory/AddProductModal';
import EditProductModal from '../components/inventory/EditProductModal';
import { StatusBadge } from '../components/StatusBadge';

const ITEMS_PER_PAGE = 10;

const Inventory = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Fetch all products (client-side filtering)
  const { data, isLoading, isError, error, refetch } = useQuery<InventoryResponse>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/admin/products');
      return res.data;
    },
  });

  const allProducts = data?.data || [];

  // Client-side filtering
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Price range filter
    if (selectedPriceRange) {
      const priceRange = PRICE_RANGES.find(r => r.label === selectedPriceRange);
      if (priceRange) {
        filtered = filtered.filter(product =>
          product.price >= priceRange.min &&
          (priceRange.max === Infinity || product.price <= priceRange.max)
        );
      }
    }

    return filtered;
  }, [allProducts, search, selectedCategory, selectedPriceRange]);

  // Client-side pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, page]);

  // Reset to page 0 when filters change
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setPage(0);
  };

  const handlePriceRangeChange = (value: string) => {
    setSelectedPriceRange(value);
    setPage(0);
  };

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/products/${id}`);
    },
    onSuccess: () => {
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => {
      toast.error('Failed to delete product');
    }
  });

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedPriceRange('');
    setPage(0);
  };

  // Calculate stats
  const totalProducts = allProducts.length;
  const lowStockCount = allProducts.filter(p => p.stock > 0 && p.stock < 10).length;
  const outOfStockCount = allProducts.filter(p => p.stock === 0).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Inventory Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your products, stock levels, and prices.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus size={18} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase">Total Products</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{totalProducts}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Package className="text-blue-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase">Low Stock</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{lowStockCount}</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <TrendingDown className="text-amber-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase">Out of Stock</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{outOfStockCount}</p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="text-red-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Filter className="text-gray-600" size={16} />
            <h3 className="font-medium text-gray-900">Filters</h3>
            <span className="ml-auto text-xs text-gray-500">
              {filteredProducts.length} of {totalProducts} products
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-gray-300"
            />
          </div>

          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-gray-300 appearance-none cursor-pointer text-gray-700"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
          </div>

          <div className="relative">
            <select
              value={selectedPriceRange}
              onChange={(e) => handlePriceRangeChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-gray-300 appearance-none cursor-pointer text-gray-700"
            >
              <option value="">Any Price</option>
              {PRICE_RANGES.map(r => <option key={r.label} value={r.label}>{r.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
          </div>

          <button
            onClick={handleClearFilters}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <Package className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24} />
            </div>
            <p className="mt-4 font-medium">Loading products...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-24 text-red-500">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <p className="text-lg font-semibold text-gray-900">Failed to load inventory</p>
            <p className="text-sm text-gray-500 mt-1 mb-4">{(error as any)?.response?.data?.message || error.message}</p>
            <button
              onClick={() => refetch()}
              className="px-5 py-2.5 bg-white border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Package size={32} className="text-gray-400" />
            </div>
            <p className="text-lg font-semibold text-gray-900">No products found</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
            {(search || selectedCategory || selectedPriceRange) && (
              <button
                onClick={handleClearFilters}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b-2 border-gray-200 text-xs uppercase tracking-wider text-gray-600 font-bold">
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Stock Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200 hover:shadow-sm"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-200 overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-7 h-7 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{product.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <span className="font-bold text-gray-900 text-base">${product.price.toFixed(2)}</span>
                          <span className="text-gray-500 text-xs ml-1.5">/ {product.unit}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge
                          className={
                            product.stock === 0 ? 'bg-red-100 text-red-700 border-red-300' :
                              product.stock < 10 ? 'bg-amber-100 text-amber-700 border-amber-300' :
                                'bg-green-100 text-green-700 border-green-300'
                          }
                        >
                          {product.stock === 0 ? 'Out of Stock' : product.stock < 10 ? `Low (${product.stock})` : `In Stock (${product.stock})`}
                        </StatusBadge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110 border border-transparent hover:border-blue-200"
                            title="Edit"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110 border border-transparent hover:border-red-200"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {isAddModalOpen && <AddProductModal onClose={() => setIsAddModalOpen(false)} />}
      {editingProduct && <EditProductModal product={editingProduct} onClose={() => setEditingProduct(null)} />}
    </div>
  );
};

export default Inventory;