import { ModulePage } from "@/components/module-page";
export default function Page(){return <ModulePage title="Pedidos" subtitle="Control comercial, financiero y logístico sin mezclar estados." action="Nuevo pedido"
columns={["Pedido","Cliente","Producto","Talla","Total","Pago","Proveedor","Logística"]}
rows={[
["WV-00182","Carlos Andrade","Nike Dunk Panda","42","$75.00","Pagado","Proveedor B","En tránsito"],
["WV-00181","María López","Jordan 4 Retro","38","$80.00","50% pagado","Proveedor A","Comprado"],
["WV-00180","Andrés Torres","NB 9060","41","$65.00","Pagado","Proveedor C","Listo para despacho"],
["WV-00179","Valentina Rojas","Air Force 1","37","$90.00","Pagado","Proveedor B","Entregado"]
]}/>}