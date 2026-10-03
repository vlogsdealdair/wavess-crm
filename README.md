# WAVESS — Commerce Management System

CRM y sistema de gestión para ecommerce de calzado bajo pedido.

## Stack
- Next.js 16
- React 19
- Supabase
- Vercel
- Lucide React

## Desarrollo
1. Copia `.env.example` a `.env.local`.
2. Configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Ejecuta `npm install`.
4. Ejecuta `npm run dev`.

La base de datos usa Row Level Security y mantiene separados los estados comercial, financiero y logístico de cada pedido.
