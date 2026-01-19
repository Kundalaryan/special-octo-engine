import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  Plus, Search, ChevronDown, Edit3, Trash2, 
  ChevronLeft, ChevronRight, Package, AlertTriangle, AlertCircle, X,
  CheckCircle, Ban, CloudUpload, FileSpreadsheet, Loader2
} from 'lucide-react';
import api from '../api/axios';
import type { InventoryResponse, Product } from '../types/inventory';

// --- Types ---
interface CreateProductDTO {
  name: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
  description: string;
}

interface UpdateProductDTO {
  price?: number;
  stock?: number;
  category?: string;
}

// --- Constants ---
const CATEGORIES = ["Produce", "Dairy", "Bakery", "Meat", "Beverages", "Snacks", "Pantry"];
const UNIT_TYPES = ["kg", "g", "L", "ml", "pcs", "pack", "oz", "lb"];
const PRICE_RANGES = [
  { label: "Under $5", min: 0, max: 5 },
  { label: "$5 - $10", min: 5, max: 10 },
  { label: "$10 - $20", min: 10, max: 20 },
  { label: "Over $20", min: 20, max: Infinity }
];

const Inventory = () => {
  const queryClient = useQueryClient();
  
  // --- Global State ---
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [priceFilter, setPriceFilter] = useState<string>('');

  // --- Modals State ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // --- Dropdowns & Refs ---
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  
  const catRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null); // Ref for CSV Input

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- Click Outside Logic ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(event.target as Node)) setShowCategoryDropdown(false);
      if (priceRef.current && !priceRef.current.contains(event.target as Node)) setShowPriceDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- API: Fetch Products ---
  const { data: response, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get<InventoryResponse>('/admin/products');
      return res.data;
    }
  });

  const products = response?.data || [];

  // --- API: Mutations ---

  // 1. CSV Upload Mutation
  const csvUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return await api.post('/admin/products/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('CSV uploaded and processed successfully');
      // Reset input value so same file can be selected again if needed
      if (csvInputRef.current) csvInputRef.current.value = '';
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload CSV');
      if (csvInputRef.current) csvInputRef.current.value = '';
    }
  });

  // 2. Image Mutation
  const imageMutation = useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const formData = new FormData();
      formData.append('image', file);
      return await api.post(`/admin/products/${id}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
  });

  // 3. Status Toggle
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const path = isActive ? 'disable' : 'enable';
      return await api.patch(`/admin/products/${id}/${path}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`Product ${variables.isActive ? 'disabled' : 'enabled'}`);
    },
    onError: () => toast.error('Failed to change status')
  });

  // --- Handlers ---
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        // Optional: Check if it's actually a CSV
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            toast.error('Please upload a valid CSV file');
            return;
        }
        csvUploadMutation.mutate(file);
    }
  };

  // --- Filtering & Stats ---
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
      let matchesStatus = true;
      if (statusFilter === 'LOW') matchesStatus = product.stock > 0 && product.stock < 20;
      if (statusFilter === 'OUT') matchesStatus = product.stock === 0;
      const matchesCategory = categoryFilter ? product.category === categoryFilter : true;
      let matchesPrice = true;
      if (priceFilter) {
        const range = PRICE_RANGES.find(r => r.label === priceFilter);
        if (range) matchesPrice = product.price >= range.min && product.price < range.max;
      }
      return matchesSearch && matchesStatus && matchesCategory && matchesPrice;
    });
  }, [products, search, statusFilter, categoryFilter, priceFilter]);

  const stats = useMemo(() => ({
    total: products.length,
    lowStock: products.filter(p => p.stock > 0 && p.stock < 20).length,
    outOfStock: products.filter(p => p.stock === 0).length,
  }), [products]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const clearFilters = () => {
    setSearch(''); setCategoryFilter(''); setPriceFilter(''); setStatusFilter('ALL'); setCurrentPage(1);
  };
  
  const getStockBadge = (stock: number) => {
    if (stock === 0) return <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Out of Stock</span>;
    if (stock < 20) return <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Low Stock ({stock})</span>;
    return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">In Stock ({stock})</span>;
  };

  // ==========================================
  // COMPONENT: ADD PRODUCT MODAL
  // ==========================================
  const AddProductModal = () => {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors }, reset } = useForm({
       defaultValues: { name: '', category: '', unitValue: '', unitType: 'kg', price: '', stock: '', description: '' }
    });

    const createMutation = useMutation({
        mutationFn: async (data: CreateProductDTO) => {
            const res = await api.post('/admin/products', data);
            return res.data; 
        },
        onSuccess: async (response) => {
            const newProductId = response.data?.id; 
            if (selectedImage && newProductId) {
                try {
                    await imageMutation.mutateAsync({ id: newProductId, file: selectedImage });
                } catch (err) {
                    toast.error('Product created, but image upload failed.');
                }
            }
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Product created successfully!');
            setIsAddModalOpen(false);
            reset();
            setSelectedImage(null);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to create product');
        }
    });

    const onSubmit = (data: any) => {
        const finalUnit = `${data.unitValue}${data.unitType}`;
        const payload: CreateProductDTO = {
            name: data.name,
            category: data.category,
            unit: finalUnit,
            price: Number(data.price),
            stock: Number(data.stock),
            description: data.description || "No description provided"
        };
        createMutation.mutate(payload);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                <h3 className="text-lg font-bold text-gray-900">Add New Product</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="p-6 overflow-y-auto">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                        <input {...register('name', { required: 'Name is required' })} placeholder="e.g. Organic Bananas" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"/>
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                            <div className="flex">
                                <input type="number" {...register('unitValue', { required: true })} placeholder="e.g. 1" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-l-lg border-r-0 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"/>
                                <select {...register('unitType')} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-r-lg px-3 focus:ring-blue-500 focus:border-blue-500 outline-none">
                                    {UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <div className="relative">
                                <select {...register('category', { required: 'Category is required' })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none">
                                    <option value="">Select Category</option>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            </div>
                            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message as string}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Price</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span><input type="number" step="0.01" {...register('price', { required: 'Price is required', min: 0 })} placeholder="0.00" className="w-full pl-7 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"/></div></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label><input type="number" {...register('stock', { required: 'Stock is required', min: 0 })} placeholder="0" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"/></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea {...register('description')} rows={2} placeholder="Brief product description..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"></textarea></div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                        <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors group cursor-pointer">
                            <input type="file" onChange={handleImageChange} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            {previewUrl ? (
                                <div className="relative w-32 h-32 mb-2"><img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-lg shadow-sm" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg text-white font-medium text-xs">Change</div></div>
                            ) : (
                                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><CloudUpload size={24} /></div>
                            )}
                            <p className="text-sm font-medium text-gray-900">{selectedImage ? selectedImage.name : 'Click to upload or drag and drop'}</p>
                            <p className="text-xs text-gray-500 mt-1">SVG, PNG, JPG or GIF (max. 2MB)</p>
                        </div>
                    </div>
                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">Cancel</button>
                        <button type="submit" disabled={createMutation.isPending || imageMutation.isPending} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                            {(createMutation.isPending || imageMutation.isPending) ? <Loader2 className="animate-spin" size={18} /> : null}
                            Add Product
                        </button>
                    </div>
                </form>
            </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // COMPONENT: EDIT PRODUCT MODAL
  // ==========================================
  const EditModal = () => {
    if (!editingProduct) return null;
    const { register, handleSubmit } = useForm({
      defaultValues: { price: editingProduct.price, stock: editingProduct.stock, category: editingProduct.category }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: UpdateProductDTO }) => api.patch(`/admin/products/${id}`, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); toast.success('Updated successfully'); setEditingProduct(null); },
        onError: () => toast.error('Update failed')
    });

    const editImageMutation = useMutation({
        mutationFn: async ({ id, file }: { id: number; file: File }) => {
            const formData = new FormData(); formData.append('image', file);
            return api.post(`/admin/products/${id}/image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); toast.success('Image updated'); }
    });

    const onSubmit = (data: any) => {
      const payload: UpdateProductDTO = {};
      if (Number(data.price) !== editingProduct.price) payload.price = Number(data.price);
      if (Number(data.stock) !== editingProduct.stock) payload.stock = Number(data.stock);
      if (data.category !== editingProduct.category) payload.category = data.category;
      if (Object.keys(payload).length > 0) updateMutation.mutate({ id: editingProduct.id, data: payload });
      else toast('No changes made');
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Edit Product</h3>
            <button onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <div className="p-6">
            <div className="flex flex-col items-center mb-6">
               <div className="relative group w-24 h-24 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden mb-2">
                   {editingProduct.imageUrl ? <img src={editingProduct.imageUrl} className="w-full h-full object-cover" /> : <Package size={32} className="m-auto text-gray-400"/>}
                   <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files?.[0] && editImageMutation.mutate({ id: editingProduct.id, file: e.target.files[0] })} />
               </div>
               <span className="text-sm text-blue-600 font-medium">Click image to change</span>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Name</label><input value={editingProduct.name} disabled className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-gray-500 cursor-not-allowed"/></div>
              <div className="grid grid-cols-2 gap-4">
                 <div><label className="block text-sm font-medium mb-1">ID</label><input value={editingProduct.id} disabled className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-gray-500 cursor-not-allowed"/></div>
                 <div><label className="block text-sm font-medium mb-1">Category</label><select {...register("category")} className="w-full px-3 py-2 bg-white border rounded-lg">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div><label className="block text-sm font-medium mb-1">Price</label><input type="number" step="0.01" {...register("price", {required:true})} className="w-full px-3 py-2 bg-white border rounded-lg"/></div>
                 <div><label className="block text-sm font-medium mb-1">Stock</label><input type="number" {...register("stock", {required:true})} className="w-full px-3 py-2 bg-white border rounded-lg"/></div>
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t"><button type="button" onClick={() => setEditingProduct(null)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button><button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button></div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // MAIN RENDER
  // ==========================================
  if (isLoading) return <div className="p-10 text-center text-gray-500 animate-pulse">Loading inventory data...</div>;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans relative">
      {isAddModalOpen && <AddProductModal />}
      {editingProduct && <EditModal />}

      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
            <p className="text-sm text-gray-500 mt-1">Manage your products, stock levels, and prices.</p>
        </div>
        
        {/* ACTION BUTTONS */}
        <div className="flex gap-3">
             {/* HIDDEN CSV INPUT */}
             <input 
                type="file" 
                ref={csvInputRef} 
                accept=".csv" 
                className="hidden" 
                onChange={handleCsvFileChange} 
             />
             
             {/* BULK ADD BUTTON */}
             <button 
                onClick={() => csvInputRef.current?.click()}
                disabled={csvUploadMutation.isPending}
                className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
             >
                {csvUploadMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <FileSpreadsheet size={18} />}
                Bulk Add
             </button>

             {/* ADD NEW PRODUCT BUTTON */}
             <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm shadow-blue-200 transition-all">
                <Plus size={18} /> Add New Product
             </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm z-10 relative">
        <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
            <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by product name..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"/>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button onClick={() => setStatusFilter('ALL')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${statusFilter === 'ALL' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>All</button>
                <button onClick={() => setStatusFilter('LOW')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${statusFilter === 'LOW' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-500 hover:text-gray-700'}`}>Low Stock</button>
                <button onClick={() => setStatusFilter('OUT')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${statusFilter === 'OUT' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500 hover:text-gray-700'}`}>Out of Stock</button>
            </div>
        </div>
        <div className="flex gap-3 w-full xl:w-auto">
            <div className="relative" ref={catRef}>
                <button onClick={() => setShowCategoryDropdown(!showCategoryDropdown)} className={`px-4 py-2 rounded-lg text-sm font-medium border flex items-center gap-2 transition-colors w-full justify-between md:w-48 ${categoryFilter ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>{categoryFilter || 'Category'} {categoryFilter ? <X size={14} onClick={(e) => { e.stopPropagation(); setCategoryFilter(''); }} /> : <ChevronDown size={16} />}</button>
                {showCategoryDropdown && <div className="absolute z-20 top-full right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden py-1">{CATEGORIES.map(cat => <div key={cat} onClick={() => { setCategoryFilter(cat); setShowCategoryDropdown(false); }} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer hover:text-blue-600">{cat}</div>)}</div>}
            </div>
            <div className="relative" ref={priceRef}>
                <button onClick={() => setShowPriceDropdown(!showPriceDropdown)} className={`px-4 py-2 rounded-lg text-sm font-medium border flex items-center gap-2 transition-colors w-full justify-between md:w-48 ${priceFilter ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>{priceFilter || 'Price Range'} {priceFilter ? <X size={14} onClick={(e) => { e.stopPropagation(); setPriceFilter(''); }} /> : <ChevronDown size={16} />}</button>
                {showPriceDropdown && <div className="absolute z-20 top-full right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden py-1">{PRICE_RANGES.map(range => <div key={range.label} onClick={() => { setPriceFilter(range.label); setShowPriceDropdown(false); }} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer hover:text-blue-600">{range.label}</div>)}</div>}
            </div>
            {(categoryFilter || priceFilter || search || statusFilter !== 'ALL') && <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700 font-medium px-2">Reset</button>}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                    <th className="px-6 py-4">Product Info</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Stock Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {paginatedProducts.length > 0 ? (
                    paginatedProducts.map((product) => (
                        <tr key={product.id} className={`transition-colors group ${!product.active ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'}`}>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                                        {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" /> : <Package size={20} className="text-gray-400" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-gray-900">{product.name}</p>
                                            {!product.active && <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 rounded">DISABLED</span>}
                                        </div>
                                        <p className="text-xs text-gray-500">ID: #{product.id}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{product.category}</span></td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">${product.price.toFixed(2)}<span className="text-gray-400 font-normal ml-1">/{product.unit}</span></td>
                            <td className="px-6 py-4">{getStockBadge(product.stock)}</td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingProduct(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 size={16} /></button>
                                    <button onClick={() => toggleStatusMutation.mutate({ id: product.id, isActive: product.active })} className={`p-2 rounded-lg ${product.active ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>{product.active ? <Ban size={16} /> : <CheckCircle size={16} />}</button>
                                </div>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No products found</td></tr>
                )}
            </tbody>
        </table>
        {/* Pagination & Footer Stats (Same as before) */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">Page {currentPage} of {totalPages || 1}</span>
            <div className="flex items-center gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"><ChevronLeft size={16} /></button>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"><ChevronRight size={16} /></button>
            </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4"><div className="p-3 bg-blue-50 text-blue-600 rounded-full"><Package size={24} /></div><div><p className="text-gray-500 text-xs font-bold uppercase">Total Items</p><p className="text-2xl font-bold text-gray-900">{stats.total}</p></div></div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4"><div className="p-3 bg-amber-50 text-amber-600 rounded-full"><AlertTriangle size={24} /></div><div><p className="text-gray-500 text-xs font-bold uppercase">Low Stock</p><p className="text-2xl font-bold text-gray-900">{stats.lowStock}</p></div></div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4"><div className="p-3 bg-red-50 text-red-600 rounded-full"><AlertCircle size={24} /></div><div><p className="text-gray-500 text-xs font-bold uppercase">Out of Stock</p><p className="text-2xl font-bold text-gray-900">{stats.outOfStock}</p></div></div>
      </div>
    </div>
  );
};

export default Inventory;