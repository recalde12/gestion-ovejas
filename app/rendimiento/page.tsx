"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function RendimientoRebano() {
  const [ranking, setRanking] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modoVista, setModoVista] = useState<"TOP" | "ALERTA">("TOP");

  const VALOR_RECRIA_EUROS = 120;
  const AÑO_ACTUAL = 2026;

  useEffect(() => {
    calcularRendimiento();
  }, []);

  const calcularRendimiento = async () => {
    setCargando(true);
    try {
      const { data: madres } = await supabase.from("madres").select("*");
      const { data: crias } = await supabase.from("crias").select("*");
      const { data: incidencias } = await supabase.from("incidencias").select("*");

      const madresCalculadas = (madres || []).filter(m => m.estado === 'Activa').map(madre => {
        const misCrias = (crias || []).filter(c => c.id_madre_vinculada === madre.id);
        const misIncidencias = (incidencias || []).filter(i => i.id_madre_vinculada === madre.id).length;

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

        const valorRecriaTotal = numRecrias * VALOR_RECRIA_EUROS;
        const totalGenerado = ingresosVentas + valorRecriaTotal;

        const tasaSupervivencia = misCrias.length > 0 
          ? Math.round(((misCrias.length - numBajas) / misCrias.length) * 100) 
          : 0;

        let edad = 0;
        if (madre.fecha_nacimiento) {
          edad = AÑO_ACTUAL - new Date(madre.fecha_nacimiento).getFullYear();
        } else if (madre.ano_nacimiento) {
          edad = AÑO_ACTUAL - madre.ano_nacimiento;
        }

        return {
          ...madre,
          edad,
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

      const rankingOrdenado = madresCalculadas.sort((a, b) => b.totalGenerado - a.totalGenerado);
      setRanking(rankingOrdenado);

    } catch (err) {
      console.error("Error calculando rendimiento:", err);
    } finally {
      setCargando(false);
    }
  };

  const ovejasMostrar = modoVista === "TOP" 
    ? ranking.filter(o => o.totalGenerado > 0)
    : ranking.filter(o => 
        o.misIncidencias > 2 || 
        o.numBajas > 1 || 
        (o.totalCrias > 0 && o.tasaSupervivencia < 50) || 
        o.edad >= 6 
      ).sort((a,b) => b.edad - a.edad);

  if (cargando) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-black text-gray-400 animate-pulse uppercase">Analizando rentabilidad...</div>;

  return (
    <main className="p-4 bg-gray-50 min-h-screen pb-24">
      <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-md pt-2 pb-4 space-y-4 px-2">
        <div className="flex justify-between items-center mb-2">
          <Link href="/" className="text-yellow-700 font-black bg-white px-5 py-3 rounded-2xl shadow-sm border border-yellow-50 text-xs">← INICIO</Link>
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase leading-none">Análisis</p>
            <p className="text-xl font-black text-yellow-600 leading-none">Rendimiento</p>
          </div>
        </div>

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

      <div className="space-y-4 px-1 mt-2">
        {ovejasMostrar.length > 0 ? ovejasMostrar.map((oveja, index) => {
          
          // IDENTIFICADOR DE MOTIVOS DE ALERTA
          let motivosAlerta = [];
          if (oveja.edad >= 7) motivosAlerta.push({ texto: '🚨 Desvieje', color: 'bg-red-600' });
          else if (oveja.edad === 6) motivosAlerta.push({ texto: '⚠️ Edad', color: 'bg-orange-500' });
          
          if (oveja.misIncidencias > 2) motivosAlerta.push({ texto: '🏥 Mala Salud', color: 'bg-purple-500' });
          if (oveja.numBajas > 1 || (oveja.totalCrias > 0 && oveja.tasaSupervivencia < 50)) motivosAlerta.push({ texto: '☠️ Mortalidad', color: 'bg-slate-700' });

          return (
            <div key={oveja.id} className={`bg-white rounded-[35px] shadow-sm border border-gray-100 overflow-hidden relative`}>
              
              {modoVista === "TOP" && (
                <div className={`absolute top-0 right-8 px-4 py-2 rounded-b-xl text-sm font-black shadow-sm ${
                  index === 0 ? 'bg-yellow-400 text-yellow-900' : 
                  index === 1 ? 'bg-gray-300 text-gray-800' : 
                  index === 2 ? 'bg-amber-600 text-amber-100' : 'bg-blue-50 text-blue-800 text-[10px]'
                }`}>
                  {index === 0 ? '🥇 #1' : index === 1 ? '🥈 #2' : index === 2 ? '🥉 #3' : `#${index + 1}`}
                </div>
              )}

              {/* RENDERIZADO DE ETIQUETAS DE ALERTA */}
              {modoVista === "ALERTA" && motivosAlerta.length > 0 && (
                <div className="absolute top-0 right-4 flex gap-1">
                  {motivosAlerta.map((motivo, i) => (
                    <div key={i} className={`px-3 py-1.5 rounded-b-xl text-[9px] font-black uppercase shadow-sm text-white ${motivo.color}`}>
                      {motivo.texto}
                    </div>
                  ))}
                </div>
              )}

              <div className="p-6">
                <div className="flex justify-between items-start mb-4 mt-2">
                  <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">{oveja.numero_crotal_adulto}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {oveja.totalCrias} crías paridas
                      </p>
                      <span className="text-gray-200">|</span>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${
                        oveja.edad >= 7 ? 'text-red-500' : oveja.edad === 6 ? 'text-orange-500' : 'text-gray-400'
                      }`}>
                        Edad: {oveja.edad} años
                      </p>
                    </div>
                  </div>
                </div>

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
          );
        }) : (
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