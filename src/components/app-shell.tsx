"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {useState} from "react";
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
  { label: "CATÁLOGO", items: [["Productos","/productos",Boxes],["Combos","/combos",Boxes],["Categorías","/categorias",PackageCheck]] },
  { label: "OPERACIONES", items: [["Proveedores","/proveedores",Warehouse],["Compras","/compras",PackageCheck]] },
  { label: "FINANZAS", items: [["Resumen","/finanzas",ChartNoAxesCombined],["Ingresos","/ingresos",BadgeDollarSign],["Gastos","/gastos",WalletCards],["Utilidad","/utilidad",CircleDollarSign]] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router=useRouter();const [dark,setDark]=useState(false);
  return (
    <div className={"app"+(dark?" wavess-dark":"")}>
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
        <Link href="/ayuda" className="nav-link"><PackageCheck size={17}/>Cómo usar WAVESS</Link>
        <form action={logout}><button className="nav-link logout-btn" type="submit"><LogOut size={17}/>Cerrar sesión</button></form>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="search"><Search size={18}/><select aria-label="Ir a un módulo" value="" onChange={e=>{if(e.target.value) router.push(e.target.value);}}><option value="">Ir a un módulo…</option>{groups.flatMap(g=>g.items).map(([label,href])=><option key={href as string} value={href as string}>{label as string}</option>)}</select></div>
          <div className="top-actions">
            <Link href="/dashboard" className="icon-btn" aria-label="Ver alertas"><Bell size={19}/></Link>
            <button className="icon-btn" type="button" onClick={()=>setDark(!dark)} aria-label="Cambiar tema"><MoonStar size={19}/></button>
            <Link href="/configuracion" className="profile"><div className="avatar">L</div><div><strong>Leandro</strong><small>Administrador</small></div><ChevronDown size={16}/></Link>
          </div>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
