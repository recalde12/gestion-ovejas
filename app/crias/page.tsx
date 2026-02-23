"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function CensoCrias() {
  const [crias, setCrias] = useState<any[]>([]);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [filtroSexo, setFiltroSexo] = useState("TODOS");
  const [filtroDestino, setFiltroDestino] = useState("TODOS");
  const [cargando, setCargando] = useState(true);

  const destinos = ["TODOS", "VENTA", "RECRIA", "REGALO", "BAJA"];

  useEffect(() => {
    cargarCrias();
  }, []);

  const cargarCrias = async () => {
    setCargando(true);
    try {
      const { data: dataCrias, error } = await supabase
        .from("crias")
        .select(`
          *,
          madre:madres!id_madre_vinculada(numero_crotal_adulto)
        `)
        .order("fecha_nacimiento", { ascending: false });

      if (error) throw error;

      const { data: dataMadres } = await supabase.from("madres").select("numero_crotal_adulto, madre_id, fecha_nacimiento");

      const criasCompletas = (dataCrias || []).map(cria => {
        let crotalDeAdulta = null;

        if (cria.destino === 'Recria') {
          const crotalMadreBiologica = cria.madre?.numero_crotal_adulto;
          const yoDeAdulta = dataMadres?.find(m => 
            m.madre_id === crotalMadreBiologica && 
            m.fecha_nacimiento === cria.fecha_nacimiento
          );

          if (yoDeAdulta) {
            crotalDeAdulta = yoDeAdulta.numero_crotal_adulto;
          }
        }
        
        return {
          ...cria,
          miCrotalAdulto: crotalDeAdulta 
        };
      });

      setCrias(criasCompletas);
    } catch (err) {
      console.error("Error cargando crías:", err);
    } finally {
      setCargando(false);
    }
  };

  const criasFiltradas = crias.filter((cria) => {
    const query = filtroTexto.toLowerCase().trim();
    
    const cumpleTexto = 
      cria.crotal_nacimiento?.toLowerCase().includes(query) ||
      cria.miCrotalAdulto?.toLowerCase().includes(query) ||
      cria.madre?.numero_crotal_adulto?.toLowerCase().includes(query) ||
      cria.cliente_venta?.toLowerCase().includes(query);

    const cumpleSexo = filtroSexo === "TODOS" || cria.sexo?.toUpperCase() === filtroSexo;
    const cumpleDestino = filtroDestino === "TODOS" || (cria.destino || "FINCA").toUpperCase() === filtroDestino;

    // FILTRO DE FECHAS MEJORADO (Ignora horas para ser exacto)
    let cumpleFecha = true;
    if (cria.fecha_nacimiento) {
      // Extraemos solo la parte YYYY-MM-DD
      const fechaCria = cria.fecha_nacimiento.split('T')[0]; 
      
      if (fechaInicio && fechaFin) {
        cumpleFecha = fechaCria >= fechaInicio && fechaCria <= fechaFin;
      } else if (fechaInicio) {
        cumpleFecha = fechaCria >= fechaInicio;
      } else if (fechaFin) {
        cumpleFecha = fechaCria <= fechaFin;
      }
    }

    return cumpleTexto && cumpleSexo && cumpleDestino && cumpleFecha;
  });

  if (cargando) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-black text-gray-400">CRUZANDO TABLAS...</div>;

  return (
    <main className="p-4 bg-gray-50 min-h-screen pb-24">
      {/* FILTROS STICKY */}
      <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-md pt-2 pb-4 space-y-3 px-2">
        <div className="flex justify-between items-center mb-2">
          <Link href="/" className="text-blue-700 font-black bg-white px-5 py-3 rounded-2xl shadow-sm border border-blue-50 text-xs">← INICIO</Link>
          <div className="flex items-center gap-2">
            {(fechaInicio || fechaFin || filtroTexto || filtroSexo !== "TODOS" || filtroDestino !== "TODOS") && (
              <button 
                onClick={() => { setFechaInicio(""); setFechaFin(""); setFiltroTexto(""); setFiltroSexo("TODOS"); setFiltroDestino("TODOS"); }}
                className="text-[9px] font-black text-red-500 uppercase underline"
              >
                Limpiar
              </button>
            )}
            <p className="text-lg font-black text-blue-600 bg-white px-3 py-1 rounded-xl shadow-sm border border-gray-100">{criasFiltradas.length} Crías</p>
          </div>
        </div>

        <input 
          placeholder="Buscar crotal cría, adulta, madre o cliente..." 
          className="w-full p-4 rounded-2xl border-none shadow-lg text-sm font-bold text-gray-700 bg-white outline-none"
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
        />

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {["TODOS", "MACHO", "HEMBRA"].map((op) => (
            <button key={op} onClick={() => setFiltroSexo(op)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black border transition-all shrink-0 ${filtroSexo === op ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-100'}`}>
              {op}
            </button>
          ))}
          <div className="w-[1px] bg-gray-200 shrink-0"></div>
          {destinos.map((dest) => (
            <button key={dest} onClick={() => setFiltroDestino(dest)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black border transition-all shrink-0 ${filtroDestino === dest ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-400 border-gray-100'}`}>
              {dest}
            </button>
          ))}
        </div>

        {/* SELECTOR DE FECHAS AÑADIDO */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="flex flex-col">
            <label className="text-[8px] font-black text-gray-400 uppercase ml-2 mb-1">Nacidas desde</label>
            <input 
              type="date" 
              className="p-3 rounded-xl border-none shadow-sm text-[11px] font-bold text-gray-600 bg-white outline-none"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[8px] font-black text-gray-400 uppercase ml-2 mb-1">Nacidas hasta</label>
            <input 
              type="date" 
              className="p-3 rounded-xl border-none shadow-sm text-[11px] font-bold text-gray-600 bg-white outline-none"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* LISTADO */}
      <div className="space-y-4 px-1">
        {criasFiltradas.length > 0 ? criasFiltradas.map((cria) => (
          <div key={cria.id} className="bg-white rounded-[35px] shadow-sm border border-gray-100 overflow-hidden relative">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  
                  <div className="flex flex-col gap-1">
                    <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">
                      {cria.crotal_nacimiento}
                    </h2>
                    
                    {cria.destino === 'Recria' && (
                      <p className="text-sm font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-lg inline-block w-fit mt-1 border border-purple-100">
                        Adulta: {cria.miCrotalAdulto || 'No encontrada'}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`text-[10px] font-black ${cria.sexo?.toUpperCase() === 'MACHO' ? 'text-blue-500' : 'text-pink-500'}`}>
                      {cria.sexo?.toUpperCase() || 'S/D'}
                    </span>
                    <span className="text-gray-200">|</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase">
                      Madre: <span className="text-gray-800 font-extrabold">{cria.madre?.numero_crotal_adulto || '---'}</span>
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                   <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${
                      cria.destino === 'Recria' ? 'bg-purple-600 text-white' : 
                      cria.destino === 'Venta' ? 'bg-green-600 text-white' : 
                      cria.destino === 'Baja' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                   }`}>
                      {cria.destino || 'Finca'}
                   </span>
                   <Link href={`/crias/gestionar/${cria.id}`} className="bg-gray-100 p-3 rounded-2xl shadow-inner text-xl">⚙️</Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[7px] font-black text-gray-400 uppercase">Nacido el</p>
                  <p className="text-[11px] font-bold text-gray-700">{new Date(cria.fecha_nacimiento).toLocaleDateString('es-ES')}</p>
                </div>
                
                {cria.destino === 'Recria' ? (
                  <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100 text-center flex flex-col justify-center">
                    <p className="text-[7px] font-black text-purple-400 uppercase">Estado en Censo</p>
                    <p className="text-[10px] font-black text-purple-800 uppercase italic">Madre Activa</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-center flex flex-col justify-center">
                    <p className="text-[7px] font-black text-gray-400 uppercase">Estado</p>
                    <p className="text-[10px] font-black text-gray-800 uppercase italic">Identificado</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-20 bg-white rounded-[35px] border-2 border-dashed border-gray-100">
            <p className="text-4xl mb-2">📅</p>
            <p className="font-black text-gray-400 uppercase italic text-xs">No hay crías en ese rango de fechas</p>
          </div>
        )}
      </div>
    </main>
  );
}