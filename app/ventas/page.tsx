"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function ResumenVentas() {
  const [ventas, setVentas] = useState<any[]>([]);
  const [filtroCliente, setFiltroCliente] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarVentas = async () => {
      const { data } = await supabase
        .from("crias")
        .select("*")
        .not("precio_venta", "is", null) 
        .order("fecha_venta", { ascending: false });
      
      setVentas(data || []);
      setCargando(false);
    };
    cargarVentas();
  }, []);

  const ventasFiltradas = filtroCliente 
    ? ventas.filter(v => v.cliente_venta?.toLowerCase().includes(filtroCliente.toLowerCase()))
    : ventas;

  const totalDinero = ventasFiltradas.reduce((acc, v) => acc + (Number(v.precio_venta) || 0), 0);

  return (
    <main className="p-4 bg-gray-50 min-h-screen">
      <Link href="/" className="text-blue-600 font-bold mb-6 inline-block">← Inicio</Link>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-800">Contabilidad</h1>
        <div className="flex gap-4 mt-4">
            <input 
                type="text" 
                placeholder="Filtrar por cliente..." 
                className="flex-1 p-3 rounded-xl border-none shadow-sm text-sm outline-none"
                value={filtroCliente}
                onChange={(e) => setFiltroCliente(e.target.value)}
            />
        </div>
      </div>

      {/* BALANCE TOTAL */}
      <div className="bg-gray-900 p-8 rounded-[40px] shadow-xl mb-8 text-white relative">
        <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Balance {filtroCliente ? `de ${filtroCliente}` : 'General'}</p>
        <p className="text-5xl font-black mt-2 text-yellow-400">{totalDinero.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€</p>
        <p className="text-[10px] mt-2 opacity-50 font-bold">{ventasFiltradas.length} individuos vendidos</p>
      </div>

      {/* LISTADO */}
      <div className="space-y-3">
        {cargando ? (
          <p className="text-center py-10 font-black text-gray-300 animate-pulse uppercase italic">Cargando facturación...</p>
        ) : ventasFiltradas.map((v) => (
          <div key={v.id} className="bg-white p-5 rounded-[30px] shadow-sm border border-gray-100 flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Crotal / Cliente</span>
              <p className="text-lg font-black text-gray-800 leading-tight">{v.crotal_nacimiento}</p>
              <p className="text-xs font-bold text-blue-600 uppercase mt-0.5">{v.cliente_venta || "S/N"}</p>
            </div>
            
            <div className="text-right">
              <p className="text-xl font-black text-green-600">+{v.precio_venta}€</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase">{v.fecha_venta ? new Date(v.fecha_venta).toLocaleDateString() : 'S/F'}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}