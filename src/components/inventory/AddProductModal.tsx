import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X, CloudUpload, Loader2, ChevronDown } from 'lucide-react';
import api from '../../api/axios';
import { CATEGORIES, UNIT_TYPES } from '../../utils/inventory-constants';

interface CreateProductDTO {
  name: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
  description: string;
}

const AddProductModal = ({ onClose }: { onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  // Image Upload Mutation
  const imageMutation = useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const formData = new FormData();
      formData.append('image', file);
      return await api.post(`/admin/products/${id}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
  });

  // Create Product Mutation
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
      onClose();
      reset();
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

  const isLoading = createMutation.isPending || imageMutation.isPending;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
              <h3 className="text-lg font-bold text-gray-900">Add New Product</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
          </div>
          
          <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Name */}
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                      <input {...register('name', { required: 'Name is required' })} placeholder="e.g. Organic Bananas" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-all"/>
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
                  </div>

                  {/* Unit & Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                          <div className="flex">
                              <input type="number" {...register('unitValue', { required: true })} placeholder="1" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-l-lg border-r-0 outline-none focus:border-blue-500"/>
                              <select {...register('unitType')} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-r-lg px-3 outline-none">
                                  {UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
                              </select>
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <div className="relative">
                              <select {...register('category', { required: true })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg appearance-none outline-none focus:border-blue-500">
                                  <option value="">Select Category</option>
                                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                          </div>
                      </div>
                  </div>

                  {/* Price & Stock */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                          <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                              <input type="number" step="0.01" {...register('price', { required: true, min: 0 })} placeholder="0.00" className="w-full pl-7 pr-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500"/>
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                          <input type="number" {...register('stock', { required: true, min: 0 })} placeholder="0" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500"/>
                      </div>
                  </div>

                  {/* Description */}
                  <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                       <textarea {...register('description')} rows={2} placeholder="Brief product description..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 resize-none"></textarea>
                  </div>

                  {/* Image */}
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                      <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors group cursor-pointer">
                          <input type="file" onChange={handleImageChange} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                          {previewUrl ? (
                              <div className="relative w-32 h-32 mb-2"><img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-lg shadow-sm" /></div>
                          ) : (
                              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-3"><CloudUpload size={24} /></div>
                          )}
                          <p className="text-sm font-medium text-gray-900">{selectedImage ? selectedImage.name : 'Click to upload'}</p>
                      </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                      <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
                      <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 disabled:opacity-70">
                          {isLoading ? <Loader2 className="animate-spin" size={18} /> : null} Add Product
                      </button>
                  </div>
              </form>
          </div>
      </div>
    </div>
  );
};

export default AddProductModal;