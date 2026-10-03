"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
import {
  BadgeDollarSign, Boxes, ChartNoAxesCombined, ChevronDown, CircleDollarSign,
  CreditCard, LayoutDashboard, LogOut, Megaphone, PackageCheck, Search,
  Settings, ShoppingBag, Truck, UserRoundSearch, UsersRound, WalletCards,
  Warehouse, Bell, MoonStar
} from "lucide-react";

const groups = [
  { label: "PRINCIPAL", items: [["Dashboard","/dashboard",LayoutDashboard]] },
  { label: "CRM", items: [["Clientes","/clientes",UsersRound],["Leads","/leads",UserRoundSearch],["Remarketing","/remarketing",Megaphone]] },
  { label: "VENTAS", items: [["Pedidos","/pedidos",ShoppingBag],["Pagos","/pagos",CreditCard],["Despachos","/despachos",Truck]] },
  { label: "CATÁLOGO", items: [["Productos","/productos",Boxes],["Categorías","/categorias",PackageCheck]] },
  { label: "OPERACIONES", items: [["Proveedores","/proveedores",Warehouse],["Compras","/compras",PackageCheck]] },
  { label: "FINANZAS", items: [["Resumen","/finanzas",ChartNoAxesCombined],["Ingresos","/ingresos",BadgeDollarSign],["Gastos","/gastos",WalletCards],["Utilidad","/utilidad",CircleDollarSign]] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><span/><span/><span/></div>
          <div><strong>WAVESS</strong><small>Commerce Management System</small></div>
        </div>
        <nav>
          {groups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p>{group.label}</p>
              {group.items.map(([label,href,Icon]) => {
                const ActiveIcon = Icon as typeof LayoutDashboard;
                const active = pathname === href;
                return <Link key={href as string} href={href as string} className={active ? "nav-link active" : "nav-link"}><ActiveIcon size={17}/><span>{label as string}</span></Link>;
              })}
            </div>
          ))}
        </nav>
        <Link href="/configuracion" className={pathname==="/configuracion" ? "nav-link active settings" : "nav-link settings"}><Settings size={17}/>Configuración</Link>
        <form action={logout}><button className="nav-link logout-btn" type="submit"><LogOut size={17}/>Cerrar sesión</button></form>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="search"><Search size={18}/><input placeholder="Buscar pedidos, clientes, productos..." /></div>
          <div className="top-actions">
            <button className="icon-btn"><Bell size={19}/><span className="dot"/></button>
            <button className="icon-btn"><MoonStar size={19}/></button>
            <div className="profile"><div className="avatar">L</div><div><strong>Leandro</strong><small>Administrador</small></div><ChevronDown size={16}/></div>
          </div>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
