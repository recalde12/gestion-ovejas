"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function RendimientoRebano() {
  const [ranking, setRanking] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modoVista, setModoVista] = useState<"TOP" | "ALERTA">("TOP");

  // CONFIGURACIÓN: ¿Cuánto valoras una cría que te quedas para recría?
  const VALOR_RECRIA_EUROS = 120;

  useEffect(() => {
    calcularRendimiento();
  }, []);

  const calcularRendimiento = async () => {
    setCargando(true);
    try {
      // 1. Descargamos TODA la base de datos necesaria
      const { data: madres } = await supabase.from("madres").select("id, numero_crotal_adulto, estado");
      const { data: crias } = await supabase.from("crias").select("id_madre_vinculada, destino, precio_venta");
      const { data: incidencias } = await supabase.from("incidencias").select("id_madre_vinculada");

      // 2. Procesamos madre a madre
      const madresCalculadas = (madres || []).filter(m => m.estado === 'Activa').map(madre => {
        // Filtramos lo que pertenece a esta madre
        const misCrias = (crias || []).filter(c => c.id_madre_vinculada === madre.id);
        const misIncidencias = (incidencias || []).filter(i => i.id_madre_vinculada === madre.id).length;

        // Contadores
        let ingresosVentas = 0;
        let numVentas = 0;
        let numRecrias = 0;
        let numBajas = 0;

        misCrias.forEach(cria => {
          if (cria.destino === 'Venta') {
            ingresosVentas += (Number(cria.precio_venta) || 0);
            numVentas++;
          }
          if (cria.destino === 'Recria') numRecrias++;
          if (cria.destino === 'Baja') numBajas++;
        });

        // Cálculo Económico
        const valorRecriaTotal = numRecrias * VALOR_RECRIA_EUROS;
        const totalGenerado = ingresosVentas + valorRecriaTotal;

        // Tasa de Supervivencia
        const tasaSupervivencia = misCrias.length > 0 
          ? Math.round(((misCrias.length - numBajas) / misCrias.length) * 100) 
          : 0;

        return {
          ...madre,
          totalCrias: misCrias.length,
          ingresosVentas,
          numVentas,
          numRecrias,
          valorRecriaTotal,
          totalGenerado,
          numBajas,
          misIncidencias,
          tasaSupervivencia
        };
      });

      // 3. Ordenamos: Por defecto las que más dinero han generado arriba
      const rankingOrdenado = madresCalculadas.sort((a, b) => b.totalGenerado - a.totalGenerado);
      setRanking(rankingOrdenado);

    } catch (err) {
      console.error("Error calculando rendimiento:", err);
    } finally {
      setCargando(false);
    }
  };

  // Filtrar según la pestaña seleccionada
  const ovejasMostrar = modoVista === "TOP" 
    ? ranking.filter(o => o.totalGenerado > 0) // Las mejores
    : ranking.filter(o => o.misIncidencias > 2 || o.numBajas > 1 || (o.totalCrias > 0 && o.tasaSupervivencia < 50)).sort((a,b) => b.misIncidencias - a.misIncidencias); // Problemáticas

  if (cargando) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-black text-gray-400 animate-pulse uppercase">Analizando rentabilidad...</div>;

  return (
    <main className="p-4 bg-gray-50 min-h-screen pb-24">
      {/* CABECERA */}
      <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-md pt-2 pb-4 space-y-4 px-2">
        <div className="flex justify-between items-center mb-2">
          <Link href="/" className="text-yellow-700 font-black bg-white px-5 py-3 rounded-2xl shadow-sm border border-yellow-50 text-xs">← INICIO</Link>
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase leading-none">Análisis</p>
            <p className="text-xl font-black text-yellow-600 leading-none">Rendimiento</p>
          </div>
        </div>

        {/* PESTAÑAS (TOP vs ALERTAS) */}
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
          <button 
            onClick={() => setModoVista("TOP")}
            className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${modoVista === "TOP" ? 'bg-yellow-500 text-white shadow-md' : 'text-gray-400'}`}
          >
            🏆 TOP MADRES
          </button>
          <button 
            onClick={() => setModoVista("ALERTA")}
            className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${modoVista === "ALERTA" ? 'bg-red-500 text-white shadow-md' : 'text-gray-400'}`}
          >
            ⚠️ DESVIEJE / ALERTAS
          </button>
        </div>
      </div>

      {/* LISTADO DE RESULTADOS */}
      <div className="space-y-4 px-1 mt-2">
        {ovejasMostrar.length > 0 ? ovejasMostrar.map((oveja, index) => (
          <div key={oveja.id} className="bg-white rounded-[35px] shadow-sm border border-gray-100 overflow-hidden relative">
            
            {/* MEDALLA DE POSICIÓN (Solo en modo TOP) */}
            {modoVista === "TOP" && (
              <div className={`absolute top-0 right-8 px-4 py-2 rounded-b-xl text-sm font-black shadow-sm ${
                index === 0 ? 'bg-yellow-400 text-yellow-900' : 
                index === 1 ? 'bg-gray-300 text-gray-800' : 
                index === 2 ? 'bg-amber-600 text-amber-100' : 'bg-blue-50 text-blue-800 text-[10px]'
              }`}>
                {index === 0 ? '🥇 #1' : index === 1 ? '🥈 #2' : index === 2 ? '🥉 #3' : `#${index + 1}`}
              </div>
            )}

            <div className="p-6">
              <div className="flex justify-between items-start mb-4 mt-2">
                <div>
                  <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">{oveja.numero_crotal_adulto}</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">
                    {oveja.totalCrias} crías paridas en total
                  </p>
                </div>
              </div>

              {/* PANEL DE DINERO (Lo más importante) */}
              <div className="bg-green-50 rounded-3xl p-5 border border-green-100 mb-4 flex justify-between items-center">
                <div>
                  <p className="text-[9px] font-black text-green-700 uppercase tracking-widest">Valor Total Generado</p>
                  <p className="text-3xl font-black text-green-800 mt-1">{oveja.totalGenerado}€</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-green-600">Ventas: <span className="font-black">{oveja.ingresosVentas}€</span></p>
                  <p className="text-[10px] font-bold text-green-600">Recría: <span className="font-black">{oveja.valorRecriaTotal}€</span></p>
                </div>
              </div>

              {/* MÉTRICAS DE EFICIENCIA Y SALUD */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col justify-center text-center">
                  <p className="text-[8px] font-black text-gray-400 uppercase">Supervivencia</p>
                  <p className={`text-lg font-black ${oveja.tasaSupervivencia >= 80 ? 'text-blue-600' : 'text-red-500'}`}>
                    {oveja.tasaSupervivencia}%
                  </p>
                  <p className="text-[8px] text-gray-400 font-bold">{oveja.numBajas} bajas</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col justify-center text-center">
                  <p className="text-[8px] font-black text-gray-400 uppercase">Salud (Incidencias)</p>
                  <p className={`text-lg font-black ${oveja.misIncidencias === 0 ? 'text-green-500' : oveja.misIncidencias > 2 ? 'text-red-500' : 'text-amber-500'}`}>
                    {oveja.misIncidencias}
                  </p>
                  <p className="text-[8px] text-gray-400 font-bold">Registros</p>
                </div>
              </div>

            </div>
          </div>
        )) : (
          <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-gray-200">
            <p className="text-4xl mb-2">{modoVista === "TOP" ? '📊' : '✅'}</p>
            <p className="font-black text-gray-400 uppercase italic text-xs">
              {modoVista === "TOP" ? 'No hay datos de ventas aún' : 'Rebaño sano, no hay alertas de desvieje'}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}