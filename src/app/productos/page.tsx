import { ModulePage } from "@/components/module-page";
export default function Page(){return <ModulePage title="Productos" subtitle="Catálogo, precios, calidades y costos por proveedor." action="Nuevo producto"
columns={["SKU","Modelo","Marca","Calidad","Tallas","Precio","Mejor costo","Margen"]}
rows={[
["NK-DNK-PND","Dunk Low Panda","Nike","TOP QUALITY","36–44","$75.00","$39.00","48%"],
["JD-4-RET","Jordan 4 Retro","Jordan","CALIDAD 1:1","37–44","$85.00","$48.00","44%"],
["NB-9060","9060","New Balance","TOP QUALITY","36–44","$80.00","$43.00","46%"],
["NK-AF1","Air Force 1 Low","Nike","TOP QUALITY","36–44","$90.00","$51.00","43%"]
]}/>}