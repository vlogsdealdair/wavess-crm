import { ModulePage } from "@/components/module-page";
export default function Page(){return <ModulePage title="Clientes" subtitle="Historial, preferencias, segmentación y valor de cada cliente." action="Nuevo cliente"
columns={["Nombre","WhatsApp","Compras","Total gastado","Última compra","Talla","Segmento"]}
rows={[
["Carlos Andrade","+593 99 482 1090","4","$286.00","2 Oct 2026","42","Recurrente"],
["María López","+593 98 201 4421","2","$155.00","1 Oct 2026","38","Recurrente"],
["Valentina Rojas","+593 96 713 5502","1","$90.00","29 Sep 2026","37","Nuevo"],
["Diego Morales","+593 99 043 8871","3","$218.00","28 Sep 2026","41","Recurrente"]
]}/>}