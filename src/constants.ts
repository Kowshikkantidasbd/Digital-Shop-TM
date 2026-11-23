import { Product } from './types';
import { ADDITIONAL_20_PRODUCTS } from './data/additionalProducts';

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Digital Shop Premium Comfort Fit Solid Crew Neck T-Shirt for Men',
    price: 5635,
    originalPrice: 11385,
    category: 'Fashions',
    stock: 120,
    status: 'approved',
    createdAt: '2026-09-08T10:00:00.000Z',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80'
    ],
    description: 'A premium quality crew neck t-shirt made from 100% pure cotton. Perfect for daily wear and layering.',
    details: 'Material: 100% Organic Cotton\nFit: Slim Fit\nNeck: Crew Neck\nSleeve: Short Sleeve\nCare: Machine Wash cold',
    reviews: 1240,
    rating: 4.8,
    soldCount: 5400,
    freeShipping: true,
    brand: 'Digital Shop Originals',
    variants: {
      colors: ['Charcoal Black', 'Heather Grey', 'Navy Blue', 'Pure White'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL']
    },
    seller: {
      name: 'Digital Shop Official Store',
      rating: 4.9,
      followers: '124k',
      chatResponse: '98%'
    }
  },
  {
    id: '2',
    name: 'Casual Streetwear Over-sized Graphic Print Hoodie - Winter Collection',
    price: 10235,
    originalPrice: 18285,
    category: 'Fashions',
    stock: 65,
    status: 'approved',
    isSponsored: true,
    adBudget: 1000,
    adStatus: 'active',
    adImpressions: 148,
    adClicks: 12,
    createdAt: '2026-09-07T14:30:00.000Z',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80'
    ],
    description: 'Stay warm and stylish with our oversized hoodie. Featuring high-quality graphic print and fleece lining.',
    details: 'Material: Heavyweight Fleece\nFit: Oversized Streetwear\nStyle: Urban Graphic\nElasticated cuffs and hem\nCare: Machine wash cold, tumble dry low',
    reviews: 850,
    rating: 4.7,
    soldCount: 1200,
    brand: 'Urban Trends',
    variants: {
      colors: ['Onyx Black', 'Stone Grey', 'Forest Green', 'Sand Beige'],
      sizes: ['M', 'L', 'XL', 'XXL']
    },
    seller: {
      name: 'Urban Trends',
      rating: 4.7,
      followers: '45k',
      chatResponse: '95%'
    }
  },
  {
    id: '3',
    name: 'Women High-Waist Slim Fit Denim Jeans - Classic Blue',
    price: 8625,
    originalPrice: 14375,
    category: 'Fashions',
    stock: 85,
    status: 'pending',
    createdAt: '2026-09-09T09:15:00.000Z',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?auto=format&fit=crop&q=80'
    ],
    description: 'Premium stretch denim for the perfect fit. Our high-waist jeans are designed to flatter every silhouette.',
    details: 'Material: 98% Cotton, 2% Elastane\nRise: High Waist\nStretch: Medium Stretch\nFive-pocket styling\nCare: Machine wash inside out',
    reviews: 2100,
    rating: 4.9,
    soldCount: 8900,
    freeShipping: true,
    brand: 'Denim Co.',
    variants: {
      colors: ['Classic Blue', 'Vintage Indigo', 'Faded Charcoal'],
      sizes: ['28', '30', '32', '34']
    },
    seller: {
      name: 'Denim Co.',
      rating: 4.8,
      followers: '320k',
      chatResponse: '99%'
    }
  },
  {
    id: '4',
    name: 'Modern Minimalist Leather Watch with Mesh Strap - Unisex',
    price: 13800,
    originalPrice: 22885,
    category: 'Fashions',
    stock: 40,
    status: 'approved',
    createdAt: '2026-09-06T11:20:00.000Z',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&q=80'
    ],
    description: 'A timeless accessory for every occasion. This minimalist watch features a scratch-resistant glass and premium mesh strap.',
    details: 'Movement: Japanese Quartz Precision\nCase Material: Stainless Steel\nStrap: Stainless Steel Mesh / Genuine Leather\nWater Resistance: 3ATM / 30m',
    reviews: 560,
    rating: 4.6,
    soldCount: 450,
    brand: 'TimeKeepers',
    variants: {
      colors: ['Rose Gold', 'Midnight Silver', 'Matte Black'],
      sizes: ['Standard 40mm']
    },
    seller: {
      name: 'TimeKeepers',
      rating: 4.5,
      followers: '12k',
      chatResponse: '88%'
    }
  },
  {
    id: '5',
    name: 'Summer Breeze Floral Print Maxi Dress for Women',
    price: 7475,
    originalPrice: 12650,
    category: 'Fashions',
    stock: 95,
    status: 'pending',
    createdAt: '2026-09-08T16:45:00.000Z',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80'
    ],
    description: 'Lightweight and breathable fabric perfect for summer outings. Elegant floral print with adjustable waist tie.',
    details: 'Material: Rayon Blend Breathable\nLength: Maxi\nSleeve: Sleeveless\nFully lined for comfort',
    reviews: 1400,
    rating: 4.8,
    soldCount: 3200,
    freeShipping: true,
    brand: 'Digital Shop Official Store',
    variants: {
      colors: ['Pastel Floral', 'Blush Coral', 'Sky Azure'],
      sizes: ['S', 'M', 'L', 'XL']
    },
    seller: {
      name: 'Digital Shop Official Store',
      rating: 4.9,
      followers: '124k',
      chatResponse: '98%'
    }
  },
  {
    id: '6',
    name: 'Vintage Style Leather Messenger Bag - Dark Brown',
    price: 17250,
    originalPrice: 32200,
    category: 'Fashions',
    stock: 35,
    status: 'approved',
    createdAt: '2026-09-05T08:00:00.000Z',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&q=80'
    ],
    description: 'Handcrafted from premium full-grain leather. This messenger bag develops a unique patina over time.',
    details: 'Material: Full-grain Hide Leather\nDimensions: 15" x 11" x 3"\nCompartments: Padded Laptop Sleeve + 3 Pockets\nHardware: Antique Brass Finish',
    reviews: 340,
    rating: 4.5,
    soldCount: 150,
    brand: 'LeatherCraft',
    variants: {
      colors: ['Dark Cognac', 'Espresso Brown', 'Obsidian Black'],
      sizes: ['15-inch Laptop Fit']
    },
    seller: {
      name: 'LeatherCraft',
      rating: 4.6,
      followers: '8k',
      chatResponse: '92%'
    }
  },
  {
    id: '7',
    name: 'Digital Shop Premium Pure Cotton Summer Face Mask & Bandana Band',
    price: 5635,
    originalPrice: 11385,
    category: 'Fashions',
    stock: 180,
    status: 'pending',
    createdAt: '2026-09-10T12:00:00.000Z',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80'
    ],
    description: 'A versatile, breathable headband and face bandana made from pure organic cotton to shield you in warm conditions.',
    details: 'Material: 100% Organic Cotton\nStretchable: Multi-directional Stretch\nFit: Unisex Comfort Fit\nCare: Washable & Reusable',
    reviews: 420,
    rating: 4.9,
    soldCount: 1800,
    freeShipping: true,
    brand: 'Digital Shop Official Store',
    variants: {
      colors: ['Stealth Black', 'Navy Blue', 'Olive Green'],
      sizes: ['Universal Stretch']
    },
    seller: {
      name: 'Digital Shop Official Store',
      rating: 4.9,
      followers: '124k',
      chatResponse: '98%'
    }
  },
  {
    id: '8',
    name: 'Classic Unisex Winter Knit Beanie Hat - Heat Retention Tech',
    price: 7475,
    originalPrice: 13800,
    category: 'Fashions',
    stock: 110,
    status: 'pending',
    createdAt: '2026-09-10T15:30:00.000Z',
    image: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80'
    ],
    description: 'Ultra-warm knitted casual beanie hat, providing thermal defense and dynamic style pairing for winter.',
    details: 'Material: Hypoallergenic Thermal Acrylic Yarn\nSize: Flexible One Size\nFit: Snug Thermal Comfort\nWash: Hand wash cold',
    reviews: 310,
    rating: 4.8,
    soldCount: 950,
    brand: 'Urban Trends',
    variants: {
      colors: ['Heather Charcoal', 'Deep Mustard', 'Burgundy Wine'],
      sizes: ['Free Size']
    },
    seller: {
      name: 'Urban Trends',
      rating: 4.7,
      followers: '45k',
      chatResponse: '95%'
    }
  },
  {
    id: '9',
    name: 'Minimalist Ultra-Thin Aluminum Cardholder & Wallet - RFID Shielded',
    price: 9775,
    originalPrice: 17250,
    category: 'Fashions',
    stock: 75,
    status: 'rejected',
    rejectionReason: 'Image clarity does not meet platform standards. Please upload high-resolution product photography with a clear solid background.',
    createdAt: '2026-09-09T18:00:00.000Z',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80'
    ],
    description: 'Secure, lightweight aluminum card sleeve with RFID block feature to keep digital cards safe.',
    details: 'Material: Aerospace-Grade Aluminum Alloy\nCapacity: Holds up to 7 Cards + Cash Clip\nWeight: 45g Ultra-light\nRFID Blocking: Yes (13.56 MHz frequency)',
    reviews: 180,
    rating: 4.6,
    soldCount: 340,
    freeShipping: true,
    brand: 'Smart Gadget Hub',
    variants: {
      colors: ['Gunmetal Grey', 'Carbon Matte', 'Royal Navy'],
      sizes: ['Slim Pocket Fit']
    },
    seller: {
      name: 'Smart Gadget Hub',
      rating: 4.5,
      followers: '21k',
      chatResponse: '90%'
    }
  },
  ...ADDITIONAL_20_PRODUCTS
];

export { CATEGORIES } from './constants/categories';
