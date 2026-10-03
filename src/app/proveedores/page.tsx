import { ModulePage } from "@/components/module-page";
export default function Page(){return <ModulePage title="Proveedores" subtitle="Compara costos y tiempos de entrega antes de comprar." action="Nuevo proveedor"
columns={["Proveedor","WhatsApp","Productos","Calidad","Costo promedio","Entrega","Estado"]}
rows={[
["Proveedor A","+593 99 111 2200","18","TOP QUALITY","$52.40","4 días","Activo"],
["Proveedor B","+593 98 223 4100","24","TOP QUALITY","$44.80","5 días","Activo"],
["Proveedor C","+593 96 781 5000","12","CALIDAD 1:1","$41.20","6 días","Activo"]
]}/>}