export const dynamic = "force-dynamic"; // <--- ESTA ES LA LÍNEA MÁGICA QUE OBLIGA A ACTUALIZAR EN TIEMPO REAL

import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function Home() {
  // 1. CONSULTA DE MADRES
  const { count: totalHistoricoMadres } = await supabase
    .from('madres')
    .select('*', { count: 'exact', head: true });

  const { count: vivasMadres } = await supabase
    .from('madres')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'Activa');

  // 2. CONSULTA DE CRÍAS (Las que no tienen destino asignado aún)
  const { count: totalCrias } = await supabase
    .from('crias')
    .select('*', { count: 'exact', head: true })
    .is('destino', null);

  // 3. CONSULTA DE DINERO (Ventas)
  const { data: ventasCrias } = await supabase
    .from('crias')
    .select('precio_venta')
    .not('precio_venta', 'is', null);

  // Sumamos todos los precios de venta
  const totalDinero = ventasCrias?.reduce((acc, v) => acc + (Number(v.precio_venta) || 0), 0) || 0;

  return (
    <main className="p-4 bg-gray-50 min-h-screen pb-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-green-800 tracking-tighter uppercase italic">Ganadería Control</h1>
        <div className="bg-yellow-100 px-3 py-1 rounded-full border border-yellow-200">
           <span className="text-[10px] font-black text-yellow-700 uppercase">Balance: {totalDinero.toLocaleString('es-ES')}€</span>
        </div>
      </div>
      
      {/* SECCIÓN DE ESTADÍSTICAS RÁPIDAS */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-4 rounded-[30px] shadow-sm border border-green-100 flex flex-col items-center justify-center text-center">
          <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Censo Madres</p>
          <p className="text-4xl font-black text-green-700">{vivasMadres || 0}</p>
          <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">Historial: {totalHistoricoMadres || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-[30px] shadow-sm border border-blue-100 flex flex-col items-center justify-center text-center">
          <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Crías en Finca</p>
          <p className="text-4xl font-black text-blue-700">{totalCrias || 0}</p>
          <p className="text-[9px] text-blue-300 font-bold mt-1 uppercase tracking-tighter italic">Pendientes gestión</p>
        </div>
      </div>

      {/* SECCIÓN DE NAVEGACIÓN */}
      <div className="flex flex-col gap-3">
        
        {/* CONTABILIDAD / VENTAS */}
        <Link href="/ventas" className="bg-gray-900 p-6 rounded-[35px] shadow-xl flex items-center justify-between hover:scale-[1.02] transition-all active:scale-95">
          <div className="flex items-center gap-4">
            <span className="text-4xl">💰</span>
            <div>
              <h2 className="font-black text-lg text-white tracking-tight">Ventas y Ganancias</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Total: {totalDinero.toLocaleString('es-ES')} €</p>
            </div>
          </div>
          <span className="text-2xl text-yellow-500 font-black">→</span>
        </Link>

        {/* REGISTRAR PARTO */}
        <Link href="/partos/nuevo" className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100 flex items-center justify-between active:scale-95 transition-all">
          <div className="flex items-center gap-4">
            <span className="text-4xl">🐑</span>
            <div>
              <h2 className="font-black text-lg text-gray-800 tracking-tight">Registrar Parto</h2>
              <p className="text-xs text-gray-500 font-bold uppercase">Nacimientos del día</p>
            </div>
          </div>
          <span className="text-2xl text-green-500 font-black">→</span>
        </Link>

        {/* CENSOS (Botones cuadrados) */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/crias" className="bg-blue-50 p-5 rounded-[30px] border border-blue-100 flex flex-col gap-2 active:scale-95 transition-all">
            <span className="text-3xl">📋</span>
            <h2 className="font-black text-blue-900 leading-none">Censo<br/>Crías</h2>
          </Link>

          <Link href="/madres" className="bg-green-50 p-5 rounded-[30px] border border-green-100 flex flex-col gap-2 active:scale-95 transition-all">
            <span className="text-3xl">🧾</span>
            <h2 className="font-black text-green-900 leading-none">Censo<br/>Madres</h2>
          </Link>
        </div>

        {/* RANKING Y RENTABILIDAD */}
        <Link href="/rendimiento" className="bg-yellow-50 p-6 rounded-[30px] shadow-sm border border-yellow-100 flex items-center justify-between active:scale-95 transition-all mt-1">
          <div className="flex items-center gap-4">
            <span className="text-4xl">🏆</span>
            <div>
              <h2 className="font-black text-lg text-yellow-900 tracking-tight">Ranking de Madres</h2>
              <p className="text-[10px] text-yellow-700 font-black uppercase tracking-widest">Rentabilidad y Desvieje</p>
            </div>
          </div>
          <span className="text-2xl text-yellow-500 font-black">→</span>
        </Link>

        {/* REGISTRAR INCIDENCIA */}
        <Link href="/incidencias/" className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100 flex items-center justify-between active:scale-95 transition-all mb-10">
          <div className="flex items-center gap-4">
            <span className="text-4xl">⚠️</span>
            <div>
              <h2 className="font-black text-lg text-gray-800 tracking-tight">Incidencias</h2>
              <p className="text-xs text-gray-500 font-bold uppercase">Bajas y tratamientos</p>
            </div>
          </div>
          <span className="text-2xl text-red-500 font-black">→</span>
        </Link>

      </div>
    </main>
  );
}