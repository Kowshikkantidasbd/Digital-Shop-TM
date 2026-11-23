# Digital Shop T.M — Standalone Frontend (`frontend`)

এই `frontend/` ফোল্ডারটি সম্পূর্ণ স্বয়ংসম্পূর্ণ (Standalone) React + Vite + Tailwind + Firebase ফ্রন্টএন্ড। এতে কোনো ব্যাকএন্ড সার্ভার কোড বা প্রাইভেট সিক্রেট কী নেই—আপনি এই ফোল্ডারটি আলাদাভাবে কপি করে Firebase Hosting, Vercel বা Netlify-এ সরাসরি লাইভ করতে পারবেন।

## লোকাল কম্পিউটারে চালানো
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
- ডিফল্টভাবে `http://localhost:5173`-এ চালু হবে এবং `/api` ও `/uploads` রিকোয়েস্ট `VITE_DEV_API_TARGET` (`http://localhost:5000` — `Backend` সার্ভার)-এ প্রক্সি হবে।

## Firebase Hosting-এ আলাদাভাবে লাইভ করা
1. `.env` ফাইলে আপনার আলাদা হোস্ট করা `Backend` সার্ভারের URL সেট করুন:
   ```env
   VITE_API_BASE_URL=https://your-backend-api.onrender.com
   ```
2. বিল্ড ও ডিপ্লয় করুন:
   ```bash
   npx firebase-tools login
   npm run deploy:firebase
   ```
