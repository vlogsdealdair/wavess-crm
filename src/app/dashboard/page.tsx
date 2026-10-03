import { AppShell } from "@/components/app-shell";
import {
  ArrowRight, CircleDollarSign, Clock3, PackageCheck, ShoppingBag,
  TrendingUp, UserRoundPlus, UsersRound, WalletCards
} from "lucide-react";

const orders = [
  ["WV-00182","Carlos A.","Dunk Panda","$75.00","En tránsito","blue"],
  ["WV-00181","María L.","Jordan 4","$80.00","50% pagado","amber"],
  ["WV-00180","Andrés T.","NB 9060","$65.00","Listo despacho","violet"],
  ["WV-00179","Valentina R.","Air Force 1","$90.00","Entregado","green"],
  ["WV-00178","Diego M.","Dunk Low","$70.00","En tránsito","blue"],
];

export default function DashboardPage() {
  return <AppShell>
    <section className="page-head">
      <div><p className="eyebrow">SÁBADO, 3 OCT 2026</p><h1>Buenos días, Leandro 👋</h1><p>Aquí tienes un resumen de lo que está pasando en tu negocio.</p></div>
      <button className="primary-btn"><ShoppingBag size={17}/> Nuevo pedido</button>
    </section>

    <section className="metrics">
      <Metric title="Ventas" value="$4,280.50" change="↑ 18.4%" note="vs. período anterior" icon={<TrendingUp/>}/>
      <Metric title="Utilidad" value="$1,420.20" change="↑ 12.2%" note="Margen 33.2%" icon={<CircleDollarSign/>}/>
      <Metric title="Pedidos" value="58" change="↑ 8.3%" note="vs. período anterior" icon={<ShoppingBag/>}/>
      <Metric title="Clientes" value="326" change="+42 nuevos" note="este período" icon={<UsersRound/>}/>
    </section>

    <section className="grid-2">
      <div className="money-card">
        <div><p>Dinero disponible</p><h2>$2,840.50</h2><div className="money-row"><span><small>Por cobrar</small><b>$420.00</b></span><span><small>Por pagar</small><b>$650.00</b></span></div></div>
        <button>Ver finanzas <ArrowRight size={16}/></button>
      </div>
      <div className="card attention">
        <div className="card-title"><div><span className="kicker">OPERACIONES</span><h3>Requiere atención</h3></div><Clock3 size={20}/></div>
        <Attention color="red" value="3" label="Pagos pendientes"/>
        <Attention color="orange" value="2" label="Pedidos pendientes de compra"/>
        <Attention color="yellow" value="4" label="Productos recibidos"/>
        <Attention color="blue" value="7" label="Clientes para seguimiento"/>
      </div>
    </section>

    <section className="grid-chart">
      <div className="card chart-card">
        <div className="card-title"><div><span className="kicker">RENDIMIENTO</span><h3>Ventas — Últimos 7 días</h3></div><span className="period-pill">7 días</span></div>
        <div className="chart">
          {[55,74,48,90,66,84,72].map((h,i)=><div className="bar-wrap" key={i}><div className="bar" style={{height:h+"%"}}><i style={{height:Math.max(20,h-26)+"%"}}/></div><small>{["26 Sep","27 Sep","28 Sep","29 Sep","30 Sep","1 Oct","2 Oct"][i]}</small></div>)}
        </div>
        <div className="legend"><span><i className="legend-blue"/>Ventas</span><span><i className="legend-cyan"/>Utilidad</span></div>
      </div>
      <div className="card">
        <div className="card-title"><div><span className="kicker">CANALES</span><h3>Ventas por canal</h3></div></div>
        <div className="donut-wrap"><div className="donut"><div><small>Total</small><strong>$4,280</strong></div></div></div>
        <div className="channel"><span><i className="c1"/>WhatsApp</span><b>42%</b></div>
        <div className="channel"><span><i className="c2"/>Instagram</span><b>31%</b></div>
        <div className="channel"><span><i className="c3"/>TikTok</span><b>27%</b></div>
      </div>
    </section>

    <section className="card table-card">
      <div className="card-title"><div><span className="kicker">VENTAS</span><h3>Pedidos recientes</h3></div><button className="text-btn">Ver todos <ArrowRight size={15}/></button></div>
      <div className="table-scroll"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Producto</th><th>Total</th><th>Estado</th></tr></thead><tbody>
        {orders.map(o=><tr key={o[0]}><td><b>{o[0]}</b></td><td>{o[1]}</td><td>{o[2]}</td><td><b>{o[3]}</b></td><td><span className={"badge "+o[5]}>{o[4]}</span></td></tr>)}
      </tbody></table></div>
    </section>
  </AppShell>
}

function Metric({title,value,change,note,icon}:{title:string,value:string,change:string,note:string,icon:React.ReactNode}) {
  return <div className="metric card"><div className="metric-icon">{icon}</div><div><p>{title}</p><h2>{value}</h2><div><b>{change}</b><span>{note}</span></div></div></div>
}
function Attention({color,value,label}:{color:string,value:string,label:string}) {
  return <button className="attention-row"><span className={"attention-num "+color}>{value}</span><span>{label}</span><ArrowRight size={15}/></button>
}
