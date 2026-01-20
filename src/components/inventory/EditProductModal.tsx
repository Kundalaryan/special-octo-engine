import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X, Package, Loader2, Upload } from 'lucide-react';
import api from '../../api/axios';
import type { Product } from '../../types/inventory';
import { CATEGORIES } from '../../utils/inventory-constants';

interface UpdateProductDTO {
    price?: number;
    stock?: number;
    category?: string;
}

interface EditProductModalProps {
    product: Product;
    onClose: () => void;
}

const EditProductModal = ({ product, onClose }: EditProductModalProps) => {
    const queryClient = useQueryClient();
    const [previewUrl, setPreviewUrl] = useState<string | null>(product.imageUrl || null);

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            price: product.price,
            stock: product.stock,
            category: product.category,
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: UpdateProductDTO }) => api.patch(`/admin/products/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Product updated successfully');
            onClose();
        },
        onError: () => toast.error('Failed to update product')
    });

    const editImageMutation = useMutation({
        mutationFn: async ({ id, file }: { id: number; file: File }) => {
            const formData = new FormData();
            formData.append('image', file);
            return api.post(`/admin/products/${id}/image`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Image updated');
        },
        onError: () => toast.error('Failed to update image')
    });

    const onSubmit = (data: any) => {
        const payload: UpdateProductDTO = {};
        if (Number(data.price) !== product.price) payload.price = Number(data.price);
        if (Number(data.stock) !== product.stock) payload.stock = Number(data.stock);
        if (data.category !== product.category) payload.category = data.category;

        if (Object.keys(payload).length > 0) {
            updateMutation.mutate({ id: product.id, data: payload });
        } else {
            toast('No changes detected');
            onClose();
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPreviewUrl(URL.createObjectURL(file));
            editImageMutation.mutate({ id: product.id, file });
        }
    };

    const isLoading = updateMutation.isPending || editImageMutation.isPending;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Edit Product</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
                    {/* Image Upload Section */}
                    <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Product Image</label>
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-lg bg-white border border-gray-300 overflow-hidden">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                            <Package size={32} className="text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                {editImageMutation.isPending && (
                                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                        <Loader2 className="animate-spin text-white" size={24} />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors text-sm font-medium">
                                    <Upload size={16} />
                                    <span>Upload New Image</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        disabled={editImageMutation.isPending}
                                    />
                                </label>
                                <p className="text-xs text-gray-500 mt-2">Recommended: Square image, at least 500x500px</p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Product Name (Read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                            <input
                                value={product.name}
                                disabled
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
                            />
                        </div>

                        {/* ID and Unit (Read-only) */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
                                <input
                                    value={product.id}
                                    disabled
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                <input
                                    value={product.unit}
                                    disabled
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                {...register("category", { required: true })}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-gray-300 text-gray-700"
                            >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Price and Stock */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register("price", { required: true, min: 0 })}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-gray-300"
                                />
                                {errors.price && <p className="text-red-500 text-xs mt-1">Valid price required</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                                <input
                                    type="number"
                                    {...register("stock", { required: true, min: 0 })}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-gray-300"
                                />
                                {errors.stock && <p className="text-red-500 text-xs mt-1">Valid stock required</p>}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading && <Loader2 className="animate-spin" size={16} />}
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditProductModal;