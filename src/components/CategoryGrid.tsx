import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Product } from '../types';
import {
  Baby,
  BookOpen,
  Briefcase,
  Camera,
  Car,
  Cpu,
  Dumbbell,
  Flower2,
  Footprints,
  Gamepad2,
  Headphones,
  Laptop,
  LayoutGrid,
  Package,
  PawPrint,
  Refrigerator,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Sofa,
  Watch,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface CategoryGridProps {
  products: Product[];
  selectedCategory: string;
  onSelect: (categoryKey: string) => void;
  title?: string;
  scrollTargetId?: string;
}

type CategoryDef = {
  key: string;
  label: string;
  bengali?: string;
};

type Tile = CategoryDef & {
  count: number;
};

const DEFAULTS: CategoryDef[] = [
  { key: 'All', label: 'All Products', bengali: 'সব পণ্য' },
  { key: 'Smartphones & Mobiles', label: 'Mobiles', bengali: 'মোবাইল' },
  { key: 'Laptops & Computers', label: 'Laptops & PC', bengali: 'ল্যাপটপ' },
  { key: 'Headphones & Audio', label: 'Audio', bengali: 'অডিও' },
  { key: 'Fashions', label: 'Fashion', bengali: 'ফ্যাশন' },
  { key: 'Health & Beauty', label: 'Beauty', bengali: 'বিউটি' },
  { key: 'Home & Lifestyle', label: 'Home & Living', bengali: 'হোম ও লিভিং' },
  { key: 'Home Appliances', label: 'Appliances', bengali: 'অ্যাপ্লায়েন্স' },
  { key: 'Sports & Outdoors', label: 'Sports', bengali: 'স্পোর্টস' },
  { key: 'Groceries', label: 'Groceries', bengali: 'গ্রোসারি' },
  { key: 'Automotive', label: 'Automotive', bengali: 'অটোমোটিভ' },
  { key: 'Watches & Wearables', label: 'Watches', bengali: 'ঘড়ি ও স্মার্ট' },
  { key: 'Cameras & Photography', label: 'Cameras', bengali: 'ক্যামেরা' },
  { key: 'Gaming & Consoles', label: 'Gaming', bengali: 'গেমিং' },
  { key: 'Electronic Accessories', label: 'Accessories', bengali: 'এক্সেসরিজ' },
  { key: 'Bags & Luggage', label: 'Bags & Travel', bengali: 'ব্যাগ ও লাগেজ' },
  { key: 'Footwear & Shoes', label: 'Footwear', bengali: 'ফুটওয়্যার' },
  { key: 'Books & Stationery', label: 'Books', bengali: 'বই ও খাতা' },
  { key: 'Toys & Kids', label: 'Kids & Toys', bengali: 'শিশু ও খেলনা' },
  { key: 'Pet Supplies', label: 'Pet Care', bengali: 'পেট কেয়ার' },
];

const renderDepartmentIcon = (categoryKey: string) => {
  const props = { size: 22, strokeWidth: 1.8, className: 'w-[22px] h-[22px] sm:w-6 sm:h-6 transition-transform duration-150 group-hover:scale-105' };
  switch (categoryKey) {
    case 'All':
      return <LayoutGrid {...props} />;
    case 'Smartphones & Mobiles':
      return <Smartphone {...props} />;
    case 'Laptops & Computers':
      return <Laptop {...props} />;
    case 'Headphones & Audio':
      return <Headphones {...props} />;
    case 'Fashions':
      return <Shirt {...props} />;
    case 'Health & Beauty':
      return <Flower2 {...props} />;
    case 'Home & Lifestyle':
      return <Sofa {...props} />;
    case 'Home Appliances':
      return <Refrigerator {...props} />;
    case 'Sports & Outdoors':
      return <Dumbbell {...props} />;
    case 'Groceries':
      return <ShoppingBasket {...props} />;
    case 'Automotive':
      return <Car {...props} />;
    case 'Watches & Wearables':
      return <Watch {...props} />;
    case 'Cameras & Photography':
      return <Camera {...props} />;
    case 'Gaming & Consoles':
      return <Gamepad2 {...props} />;
    case 'Electronic Accessories':
      return <Cpu {...props} />;
    case 'Bags & Luggage':
      return <Briefcase {...props} />;
    case 'Footwear & Shoes':
      return <Footprints {...props} />;
    case 'Books & Stationery':
      return <BookOpen {...props} />;
    case 'Toys & Kids':
      return <Baby {...props} />;
    case 'Pet Supplies':
      return <PawPrint {...props} />;
    default:
      return <Package {...props} />;
  }
};

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  products,
  selectedCategory,
  onSelect,
  title,
  scrollTargetId,
}) => {
  const { isBangla, t, translateCategory } = useLanguage();
  const navigate = useNavigate();
  const headingTitle = title || t('Categories', 'পণ্য ক্যাটাগরি');

  const tiles = useMemo<Tile[]>(() => {
    const visible = (products || []).filter(
      (p) => !p.isHidden && p.isDeleted !== true && p.status !== 'rejected' && p.status !== 'pending'
    );

    const byCat = new Map<string, Product[]>();
    visible.forEach((p) => {
      const c = (p.category || '').trim();
      if (!c) return;
      const normalized = c.toLowerCase();
      byCat.set(normalized, [...(byCat.get(normalized) || []), p]);
    });

    const result: Tile[] = DEFAULTS.map((d) => {
      const list = d.key === 'All' ? visible : byCat.get(d.key.toLowerCase());
      return {
        ...d,
        count: list?.length || 0,
      };
    });

    const defaultKeys = new Set(DEFAULTS.map((d) => d.key.toLowerCase()));
    visible.forEach((p) => {
      const key = (p.category || '').trim();
      if (!key) return;
      const lower = key.toLowerCase();
      if (!defaultKeys.has(lower)) {
        defaultKeys.add(lower);
        result.push({
          key,
          label: key,
          count: byCat.get(lower)?.length || 0,
        });
      }
    });

    return result.filter((item) => item.key === 'All' || item.count > 0);
  }, [products]);

  const handleSelect = (key: string) => {
    onSelect(key);
    if (scrollTargetId) {
      requestAnimationFrame(() => {
        const el = document.getElementById(scrollTargetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
      return;
    }
    navigate(`/search?category=${encodeURIComponent(key)}`);
  };

  return (
    <section aria-label="Categories" className="space-y-4">
      <div className="flex items-center justify-between border-b border-gray-200/80 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-orange-50 text-brand-orange flex items-center justify-center shrink-0">
            <LayoutGrid size={16} />
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-display tracking-tight">
            {headingTitle}
          </h2>
        </div>
        <span className="text-xs font-medium text-gray-500 hidden sm:inline-block">
          {t('Shop by Department', 'ডিপার্টমেন্ট অনুযায়ী দেখুন')}
        </span>
      </div>

      <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-10 gap-2 sm:gap-3 py-1">
        {tiles.map((tile, idx) => {
          const active = selectedCategory === tile.key;

          return (
            <motion.button
              key={tile.key}
              type="button"
              onClick={() => handleSelect(tile.key)}
              aria-pressed={active}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.015, 0.16), duration: 0.16 }}
              className={`group relative flex flex-col items-center text-center w-full rounded-xl sm:rounded-2xl px-2 py-2.5 sm:px-2.5 sm:py-3 transition-all duration-150 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${
                active
                  ? 'bg-orange-50/50 border-2 border-brand-orange shadow-sm'
                  : 'bg-white border border-gray-200/90 hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
              }`}
            >
              {/* Clean Real Department Icon Container */}
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-colors duration-150 shrink-0 ${
                  active
                    ? 'bg-brand-orange text-white shadow-xs'
                    : 'bg-slate-100/90 text-slate-700 group-hover:bg-orange-50 group-hover:text-brand-orange'
                }`}
              >
                {renderDepartmentIcon(tile.key)}
              </div>

              {/* Department Title & Tabular Product Count */}
              <div className="mt-2 min-h-[1.85rem] w-full flex items-center justify-center px-0.5">
                <span
                  className={`text-[11px] sm:text-xs font-semibold leading-tight line-clamp-2 transition-colors ${
                    active ? 'text-brand-orange font-bold' : 'text-gray-800 group-hover:text-gray-950'
                  }`}
                >
                  {isBangla ? tile.bengali || translateCategory(tile.label) : tile.label}
                </span>
              </div>

              <span className="mt-auto pt-0.5 text-[10px] sm:text-[11px] font-medium tabular-nums text-gray-500">
                {isBangla ? `${tile.count}টি পণ্য` : `${tile.count} items`}
              </span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
};


