import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Filter, MoreVertical, Edit2, 
  Trash2, Eye, Package, Tag, DollarSign,
  Layers, CheckCircle, XCircle, ChevronLeft, ChevronRight,
  LayoutGrid, List as ListIcon, X, Upload, Save,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Product } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface ProductManagementProps {
  products: Product[];
  onUpdate: (p: Product) => void;
  onDelete: (id: string) => void;
  onAdd: (p: Product) => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({ products = [], onUpdate, onDelete, onAdd }) => {
  const { t, language, translateCategory } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleSort = (key: keyof Product) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredProducts = useMemo(() => {
    const filtered = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === undefined || bValue === undefined) return 0;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [products, searchTerm, selectedCategory, sortConfig]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const [formError, setFormError] = useState<string | null>(null);

  const handleEdit = (product: Product) => {
    setFormError(null);
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    const rawPrice = formData.get('price');
    const priceNum = Number(rawPrice);

    if (rawPrice === null || rawPrice === '' || isNaN(priceNum) || priceNum <= 0) {
      setFormError(t('Product price must be a valid amount greater than 0 BDT.', 'পণ্যের মূল্য অবশ্যই ০ টাকার বেশি হতে হবে।'));
      return;
    }

    const rawStock = Number(formData.get('stock'));
    const stock = isNaN(rawStock) || rawStock < 0 ? 0 : rawStock;

    const rawOriginalPrice = formData.get('originalPrice');
    const originalPrice = rawOriginalPrice ? Number(rawOriginalPrice) : undefined;

    const pData: Partial<Product> = {
      id: editingProduct?.id || String(Date.now()),
      name: formData.get('name') as string,
      price: Math.round(priceNum),
      originalPrice: originalPrice ? Math.round(originalPrice) : undefined,
      category: formData.get('category') as string,
      stock,
      description: formData.get('description') as string,
      image: editingProduct?.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80',
      gallery: editingProduct?.gallery || [],
      details: editingProduct?.details || '',
      rating: editingProduct?.rating || 0,
      reviews: editingProduct?.reviews || 0,
    };

    if (editingProduct) {
      onUpdate(pData as Product);
    } else {
      onAdd(pData as Product);
    }
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black text-brand-navy tracking-tight uppercase">{t('Inventory Control', 'পণ্য ও ইনভেন্টরি নিয়ন্ত্রণ')}</h1>
           <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{t('Manage, Edit and Track Stock', 'পণ্য সম্পাদনা ও স্টক পরিচালনা করুন')}</p>
        </div>
        <button 
          onClick={() => { setFormError(null); setEditingProduct(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-orange/90 transition-all shadow-lg shadow-brand-orange/20 cursor-pointer"
        >
          <Plus size={16} /> {t('Add Product', 'নতুন পণ্য যোগ করুন')}
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-[2rem] border border-gray-100 daraz-shadow flex flex-col md:flex-row gap-4 items-center">
         <div className="flex-1 flex items-center gap-3 bg-gray-50 px-5 py-3 rounded-xl border border-gray-100 w-full md:w-auto">
            <Search size={16} className="text-gray-400" />
            <input 
              type="text" 
              placeholder={t('Filter by name, SKU or ID...', 'নাম, এসকেইউ বা আইডি দিয়ে খুঁজুন...')} 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="bg-transparent border-none outline-none text-xs w-full text-gray-600 font-bold uppercase tracking-wider" 
            />
         </div>
         <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
              className="bg-gray-50 border border-gray-100 rounded-xl px-6 py-3 text-[10px] font-black uppercase tracking-widest outline-none text-gray-500"
            >
               <option value="All">{t('All Categories', 'সকল ক্যাটাগরি')}</option>
               <option value="Men">{t('Men', 'পুরুষদের ফ্যাশন')}</option>
               <option value="Women">{t('Women', 'নারীদের ফ্যাশন')}</option>
               <option value="Accessories">{t('Accessories', 'অ্যাক্সেসরিজ')}</option>
            </select>
            <div className="flex border border-gray-100 rounded-xl overflow-hidden shadow-sm">
               <button 
                onClick={() => setViewMode('grid')}
                className={`p-3 transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-brand-navy text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                title={t('Grid View', 'গ্রিড ভিউ')}
               >
                 <LayoutGrid size={18} />
               </button>
               <button 
                onClick={() => setViewMode('list')}
                className={`p-3 transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-brand-navy text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                title={t('List View', 'তালিকা ভিউ')}
               >
                 <ListIcon size={18} />
               </button>
            </div>
         </div>
      </div>

      {/* Product List/Grid */}
      {paginatedProducts.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 daraz-shadow p-16 text-center text-gray-400">
          <Package size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-xs font-black uppercase tracking-widest">{t('No products found matching your filter', 'ফিল্টারের সাথে মিল থাকা কোনো পণ্য পাওয়া যায়নি')}</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 daraz-shadow overflow-hidden">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-gray-50/50">
                    <tr>
                       <th 
                          onClick={() => handleSort('name')}
                          className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 cursor-pointer hover:text-brand-orange transition-colors"
                        >
                           <div className="flex items-center gap-1">
                              {t('Product', 'পণ্য')}
                              {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />)}
                           </div>
                        </th>
                       <th 
                          onClick={() => handleSort('category')}
                          className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 cursor-pointer hover:text-brand-orange transition-colors"
                        >
                           <div className="flex items-center gap-1">
                              {t('Category', 'ক্যাটাগরি')}
                              {sortConfig?.key === 'category' && (sortConfig.direction === 'asc' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />)}
                           </div>
                        </th>
                       <th 
                          onClick={() => handleSort('price')}
                          className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 cursor-pointer hover:text-brand-orange transition-colors"
                        >
                           <div className="flex items-center gap-1">
                              {t('Price', 'মূল্য')}
                              {sortConfig?.key === 'price' && (sortConfig.direction === 'asc' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />)}
                           </div>
                        </th>
                       <th 
                          onClick={() => handleSort('stock')}
                          className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 cursor-pointer hover:text-brand-orange transition-colors"
                        >
                           <div className="flex items-center gap-1">
                              {t('Stock', 'স্টক')}
                              {sortConfig?.key === 'stock' && (sortConfig.direction === 'asc' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />)}
                           </div>
                        </th>
                       <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{t('Status', 'অবস্থা')}</th>
                       <th className="px-8 py-5"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {paginatedProducts.map((p) => (
                       <tr key={p.id} className="hover:bg-gray-50/30 transition-colors group">
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-14 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
                                   <img src={p.image} alt={p.name || t('Product item', 'পণ্য')} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                   <p className="text-xs font-black text-brand-navy line-clamp-1">{p.name}</p>
                                   <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t('ID', 'আইডি')}: #{p.id}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-5">
                             <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[9px] font-black uppercase tracking-widest">{translateCategory(p.category)}</span>
                          </td>
                          <td className="px-8 py-5">
                             <div className="flex flex-col">
                                <span className="text-xs font-black text-brand-orange">৳{p.price.toLocaleString()}</span>
                                {p.originalPrice && <span className="text-[10px] text-gray-400 line-through">৳{p.originalPrice.toLocaleString()}</span>}
                             </div>
                          </td>
                          <td className="px-8 py-5">
                             <div className="flex flex-col gap-1">
                                <span className={`text-xs font-black ${(p.stock || 0) < 10 ? 'text-rose-500' : 'text-brand-navy'}`}>
                                  {p.stock || 0} {t('left', 'টি বাকি')}
                                </span>
                                <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden">
                                   <div 
                                    className={`h-full ${(p.stock || 0) < 10 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                    style={{ width: `${Math.min(100, ((p.stock || 0) / 100) * 100)}%` }} 
                                   />
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-5">
                             <span className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${(p.stock || 0) > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {(p.stock || 0) > 0 ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                {(p.stock || 0) > 0 ? t('Active', 'সক্রিয়') : t('Out of Stock', 'স্টক শেষ')}
                             </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                             <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(p)} className="p-2 text-gray-400 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition-all cursor-pointer" title={t('Edit Product', 'পণ্য সম্পাদনা করুন')}>
                                   <Edit2 size={16} />
                                </button>
                                <button onClick={() => onDelete(p.id)} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer" title={t('Remove Product', 'পণ্য মুছুন')}>
                                   <Trash2 size={16} />
                                </button>
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
           {paginatedProducts.map((p) => (
             <motion.div 
               layout
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               key={p.id} 
               className="bg-white rounded-[2rem] border border-gray-100 daraz-shadow overflow-hidden group hover:border-brand-orange transition-all p-3"
             >
                <div className="aspect-[3/4] bg-gray-50 rounded-2xl overflow-hidden relative mb-4">
                   <img src={p.image} alt={p.name || t('Product thumbnail', 'পণ্যের ছবি')} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                   <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-12 group-hover:translate-x-0 transition-transform">
                      <button onClick={() => handleEdit(p)} className="p-2 bg-white/90 backdrop-blur rounded-full shadow-md text-gray-700 hover:text-brand-orange cursor-pointer" title={t('Edit Product', 'সম্পাদনা')}><Edit2 size={14} /></button>
                      <button onClick={() => onDelete(p.id)} className="p-2 bg-white/90 backdrop-blur rounded-full shadow-md text-gray-700 hover:text-rose-500 cursor-pointer" title={t('Delete Product', 'মুছুন')}><Trash2 size={14} /></button>
                   </div>
                </div>
                <div className="px-2">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{translateCategory(p.category)}</p>
                   <h3 className="text-xs font-black text-brand-navy line-clamp-1 mt-1">{p.name}</h3>
                   <div className="flex items-center justify-between mt-3">
                      <span className="text-sm font-black text-brand-orange">৳{p.price.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-gray-400">{p.stock || 0} {t('Stock', 'স্টক')}</span>
                   </div>
                </div>
             </motion.div>
           ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-6 bg-white rounded-[2rem] border border-gray-100 daraz-shadow mt-6">
           <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              {language === 'bn' ? (
                <>মোট <span className="text-brand-navy">{filteredProducts.length}</span>টি পণ্যের মধ্যে <span className="text-brand-navy">{(currentPage - 1) * itemsPerPage + 1}</span> থেকে <span className="text-brand-navy">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> দেখানো হচ্ছে</>
              ) : (
                <>Showing <span className="text-brand-navy">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-brand-navy">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> of <span className="text-brand-navy">{filteredProducts.length}</span> Products</>
              )}
           </p>
           <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-2 border border-gray-100 rounded-xl hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                 <ChevronLeft size={18} className="text-brand-navy" />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${
                    currentPage === i + 1 
                    ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20' 
                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
                >
                   {i + 1}
                </button>
              ))}
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-2 border border-gray-100 rounded-xl hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                 <ChevronRight size={18} className="text-brand-navy" />
              </button>
           </div>
        </div>
      )}

      {/* Product Edit/Add Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsModalOpen(false)}
               className="absolute inset-0 bg-brand-navy/60 backdrop-blur-md" 
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
             >
                <div className="p-8 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white z-10">
                   <div>
                      <h2 className="text-xl font-black text-brand-navy tracking-tight uppercase">{editingProduct ? t('Edit Product', 'পণ্য সম্পাদনা') : t('Add New Product', 'নতুন পণ্য যোগ করুন')}</h2>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t('Configure product attributes', 'পণ্যের বিবরণ ও বৈশিষ্ট্য নির্ধারণ করুন')}</p>
                   </div>
                   <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-brand-orange transition-colors cursor-pointer"><X size={24} /></button>
                </div>
                
                <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left: Images */}
                      <div className="space-y-6">
                         <div className="aspect-square bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 group hover:border-brand-orange hover:bg-orange-50/30 transition-all cursor-pointer overflow-hidden relative">
                            {editingProduct?.image ? (
                               <img src={editingProduct.image} alt={editingProduct.name || t('Editing product image', 'সম্পাদনার পণ্যের ছবি')} className="w-full h-full object-cover" />
                            ) : (
                               <>
                                 <Upload size={32} className="mb-4" />
                                 <p className="text-[10px] font-black uppercase tracking-[0.2em]">{t('Upload Main Image', 'মূল ছবি আপলোড করুন')}</p>
                                 <p className="text-[8px] font-medium mt-2">{t('Recommended: 1000x1000px', 'সুপারিশকৃত: ১০০০x১০০০ পিক্সেল')}</p>
                               </>
                            )}
                         </div>
                         <div className="grid grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                               <div key={i} className="aspect-square bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center text-gray-300">
                                  <Plus size={16} />
                               </div>
                            ))}
                         </div>
                      </div>

                      {/* Right: Info */}
                      <div className="space-y-6">
                         {formError && (
                            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-600 flex items-center gap-2">
                               <span>⚠️</span> {formError}
                            </div>
                         )}
                         <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">{t('Product Title', 'পণ্যের শিরোনাম')}</label>
                            <input 
                              name="name" 
                              defaultValue={editingProduct?.name} 
                              required 
                              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-brand-orange transition-all text-xs font-bold text-brand-navy" 
                              placeholder={t('e.g. Premium Cotton T-Shirt', 'যেমন: প্রিমিয়াম কটন টি-শার্ট')}
                            />
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                               <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">{t('Selling Price', 'বিক্রয় মূল্য')}</label>
                               <div className="relative">
                                  <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                  <input 
                                    name="price" 
                                    type="number" 
                                    defaultValue={editingProduct?.price} 
                                    required 
                                    className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-brand-orange transition-all text-xs font-black text-brand-orange" 
                                    placeholder="0"
                                  />
                               </div>
                            </div>
                            <div className="space-y-2">
                               <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">{t('Original Price', 'পূর্বের মূল্য')}</label>
                               <div className="relative">
                                  <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                  <input 
                                    name="originalPrice" 
                                    type="number" 
                                    defaultValue={editingProduct?.originalPrice} 
                                    className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-brand-orange transition-all text-xs font-bold text-gray-400" 
                                    placeholder="0"
                                  />
                               </div>
                            </div>
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                               <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">{t('Category', 'ক্যাটাগরি')}</label>
                               <select 
                                 name="category" 
                                 defaultValue={editingProduct?.category || 'Men'} 
                                 className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-brand-orange transition-all text-xs font-bold text-brand-navy appearance-none"
                               >
                                  <option value="Men">{t('Men', 'পুরুষদের ফ্যাশন')}</option>
                                  <option value="Women">{t('Women', 'নারীদের ফ্যাশন')}</option>
                                  <option value="Accessories">{t('Accessories', 'অ্যাক্সেসরিজ')}</option>
                               </select>
                            </div>
                            <div className="space-y-2">
                               <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">{t('Stock Level', 'স্টকের পরিমাণ')}</label>
                               <input 
                                 name="stock" 
                                 type="number" 
                                 defaultValue={editingProduct?.stock || 0} 
                                 required 
                                 className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-brand-orange transition-all text-xs font-bold text-brand-navy" 
                                 placeholder="100"
                               />
                            </div>
                         </div>

                         <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">{t('Description', 'বিবরণ')}</label>
                            <textarea 
                              name="description" 
                              rows={4} 
                              defaultValue={editingProduct?.description} 
                              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-brand-orange transition-all text-xs font-medium text-gray-600 resize-none" 
                              placeholder={t('Describe the product details...', 'পণ্যের বিস্তারিত বিবরণ লিখুন...')}
                            />
                         </div>
                      </div>
                   </div>
                   
                   <div className="pt-8 border-t border-gray-50 flex gap-4">
                      <button 
                        type="button" 
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 py-4 bg-gray-50 text-gray-400 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-gray-100 transition-all cursor-pointer"
                      >
                         {t('Discard Changes', 'বাতিল করুন')}
                      </button>
                      <button 
                        type="submit"
                        className="flex-3 py-4 bg-brand-navy text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-brand-navy/90 transition-all shadow-xl shadow-brand-navy/10 flex items-center justify-center gap-2 cursor-pointer"
                      >
                         <Save size={16} /> {editingProduct ? t('Update Inventory', 'আপডেট করুন') : t('Publish Product', 'প্রকাশ করুন')}
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

