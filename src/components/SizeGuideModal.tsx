import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Ruler, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose, category }) => {
  const [unit, setUnit] = useState<'in' | 'cm'>('in');
  const { t } = useLanguage();

  if (!isOpen) return null;

  const sizeChartInches = [
    { size: 'S', chest: '36 - 38', length: '27.5', waist: '30 - 32', shoulder: '17.5' },
    { size: 'M', chest: '39 - 41', length: '28.5', waist: '33 - 35', shoulder: '18.5' },
    { size: 'L', chest: '42 - 44', length: '29.5', waist: '36 - 38', shoulder: '19.5' },
    { size: 'XL', chest: '45 - 47', length: '30.5', waist: '39 - 41', shoulder: '20.5' },
    { size: 'XXL', chest: '48 - 50', length: '31.5', waist: '42 - 44', shoulder: '21.5' },
  ];

  const sizeChartCm = [
    { size: 'S', chest: '91 - 96', length: '70', waist: '76 - 81', shoulder: '44' },
    { size: 'M', chest: '99 - 104', length: '72', waist: '84 - 89', shoulder: '47' },
    { size: 'L', chest: '107 - 112', length: '75', waist: '91 - 97', shoulder: '50' },
    { size: 'XL', chest: '114 - 119', length: '77', waist: '99 - 104', shoulder: '52' },
    { size: 'XXL', chest: '122 - 127', length: '80', waist: '107 - 112', shoulder: '55' },
  ];

  const activeChart = unit === 'in' ? sizeChartInches : sizeChartCm;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl z-10 my-auto border border-gray-100 p-6 sm:p-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 text-brand-orange flex items-center justify-center shadow-xs">
                <Ruler size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 font-display">{t('Body Measurement & Size Guide', 'সাইজ গাইড ও মাপ')}</h3>
                <p className="text-xs text-gray-400 font-medium">{t('Standard Bangladeshi & International Sizing', 'বাংলাদেশি ও আন্তর্জাতিক স্ট্যান্ডার্ড মাপ')}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Unit Toggle */}
          <div className="flex items-center justify-between mt-5 mb-4">
            <span className="text-xs font-bold text-gray-700">{t('Measurement Units:', 'পরিমাপের একক:')}</span>
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setUnit('in')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  unit === 'in' ? 'bg-white text-brand-orange shadow-xs font-mono' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {t('Inches (in)', 'ইঞ্চি (in)')}
              </button>
              <button
                type="button"
                onClick={() => setUnit('cm')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  unit === 'cm' ? 'bg-white text-brand-orange shadow-xs font-mono' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {t('Centimeters (cm)', 'সেন্টিমিটার (cm)')}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto custom-scrollbar pb-2 rounded-2xl border border-gray-100 bg-gray-50/50">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-gray-100/80 text-gray-700 uppercase font-mono text-[10.5px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">{t('Size', 'সাইজ')}</th>
                  <th className="py-3 px-4">{t('Chest', 'বুক')}</th>
                  <th className="py-3 px-4">{t('Length', 'দৈর্ঘ্য')}</th>
                  <th className="py-3 px-4">{t('Waist', 'কোমর')}</th>
                  <th className="py-3 px-4">{t('Shoulder', 'কাঁধ')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {activeChart.map((row) => (
                  <tr key={row.size} className="hover:bg-orange-50/40 transition-colors">
                    <td className="py-3 px-4 font-black text-brand-orange">{row.size}</td>
                    <td className="py-3 px-4 text-gray-700 font-semibold">{row.chest} {unit}</td>
                    <td className="py-3 px-4 text-gray-700 font-semibold">{row.length} {unit}</td>
                    <td className="py-3 px-4 text-gray-700 font-semibold">{row.waist} {unit}</td>
                    <td className="py-3 px-4 text-gray-700 font-semibold">{row.shoulder} {unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* How to Measure note */}
          <div className="mt-5 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-900 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <Check size={14} className="text-amber-600" />
              <span>{t('How to Find Your Exact Fit:', 'সঠিক মাপ নির্ণয়ের নিয়ম:')}</span>
            </p>
            <ul className="text-[11px] text-amber-800/90 list-disc list-inside space-y-0.5 font-normal leading-relaxed">
              <li><strong>{t('Chest:', 'বুক:')}</strong> {t('Measure around the fullest part of your chest, keeping tape horizontal.', 'বুকের সবচেয়ে চওড়া অংশে অনুভূমিকভাবে ফিতা ধরে মাপুন।')}</li>
              <li><strong>{t('Length:', 'দৈর্ঘ্য:')}</strong> {t('Measure from the highest point of the shoulder seam down to the bottom hem.', 'কাঁধের সর্বোচ্চ অংশ থেকে নিচের প্রান্ত পর্যন্ত মাপুন।')}</li>
              <li>{t('If you prefer a relaxed or streetwear oversized fit, choose one size up.', 'ঢিলেঢালা বা আরামদায়ক ফিট পছন্দ করলে এক সাইজ বড় বেছে নিন।')}</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
