"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function CensoMadres() {
  const [madres, setMadres] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      // 1. Cargamos las madres
      const { data: dataMadres, error: errM } = await supabase
        .from("madres")
        .select("*")
        .order("numero_crotal_adulto", { ascending: true });

      if (errM) throw errM;

      // 2. Cargamos todas las incidencias
      const { data: dataInc } = await supabase.from("incidencias").select("*");
      
      // 3. Cargamos todas las crías
      const { data: dataCrias } = await supabase.from("crias").select("id_madre_vinculada");

      // 4. Procesamos Datos
      const madresCompletas = (dataMadres || []).map(madre => {
        const misIncidencias = (dataInc || []).filter(inc => inc.id_madre_vinculada === madre.id);
        const misPartos = (dataCrias || []).filter(cria => cria.id_madre_vinculada === madre.id).length;
        
        // CORRECCIÓN: Formateamos la fecha completa (Día/Mes/Año)
        let fechaMostrada = "S/F"; // Sin fecha por defecto
        if (madre.fecha_nacimiento) {
          fechaMostrada = new Date(madre.fecha_nacimiento).toLocaleDateString('es-ES');
        } else if (madre.ano_nacimiento) {
          fechaMostrada = madre.ano_nacimiento.toString(); // Por si hay ovejas antiguas de las que solo sabemos el año
        }

        // Metemos el tipo_incidencia en el saco de búsqueda
        const textoParaBusqueda = `
          ${madre.numero_crotal_adulto || ''} 
          ${madre.raza || ''} 
          ${misPartos} partos 
          ${misIncidencias.map(i => i.tipo_incidencia || '').join(" ")}
        `.toLowerCase();

        return {
          ...madre,
          fechaParaMostrar: fechaMostrada,
          listaIncidencias: misIncidencias,
          totalPartos: misPartos,
          textoBusqueda: textoParaBusqueda
        };
      });

      setMadres(madresCompletas);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setCargando(false);
    }
  };

  const madresFiltradas = madres.filter(m => {
    // 1. Lógica del Filtro de Texto
    let query = filtro.toLowerCase().trim();
    let cumpleTexto = true;
    
    if (query) {
      let tempQuery = query;
      if (tempQuery.endsWith('s') && tempQuery.length > 4) tempQuery = tempQuery.slice(0, -1);
      
      if (!isNaN(Number(tempQuery)) && tempQuery.length === 1) {
        cumpleTexto = m.totalPartos === Number(tempQuery);
      } else {
        cumpleTexto = m.textoBusqueda?.includes(tempQuery) || false;
      }
    }

    // 2. Lógica del Filtro de Fechas
    let cumpleFecha = true;
    if (fechaInicio || fechaFin) {
      if (m.fecha_nacimiento) {
        const fechaMadre = m.fecha_nacimiento.split('T')[0];
        if (fechaInicio && fechaFin) cumpleFecha = fechaMadre >= fechaInicio && fechaMadre <= fechaFin;
        else if (fechaInicio) cumpleFecha = fechaMadre >= fechaInicio;
        else if (fechaFin) cumpleFecha = fechaMadre <= fechaFin;
      } else {
        cumpleFecha = false; 
      }
    }

    return cumpleTexto && cumpleFecha;
  });

  if (cargando) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center font-black text-gray-400 animate-pulse">SINCRONIZANDO REBAÑO...</div>
    </div>
  );

  return (
    <main className="p-4 bg-gray-50 min-h-screen pb-20">
      <div className="flex flex-col gap-3 mb-8 sticky top-0 bg-gray-50/95 backdrop-blur-md py-4 z-10 px-2">
        <div className="flex justify-between items-center mb-1">
          <Link href="/" className="text-green-700 font-black bg-white px-5 py-3 rounded-2xl shadow-sm border border-green-50 text-xs">← INICIO</Link>
          <div className="flex items-center gap-2">
            {(filtro || fechaInicio || fechaFin) && (
              <button 
                onClick={() => { setFiltro(""); setFechaInicio(""); setFechaFin(""); }}
                className="text-[9px] font-black text-red-500 uppercase underline"
              >
                Limpiar
              </button>
            )}
            <div className="bg-green-600 text-white px-4 py-1.5 rounded-full font-black text-xs shadow-md">
              {madresFiltradas.length} ANIMALES
            </div>
          </div>
        </div>
        
        {/* BUSCADOR DE TEXTO */}
        <div className="relative">
          <input 
            placeholder="Escribe 'esponja', 'partos' o crotal..." 
            className="w-full p-4 rounded-2xl border-none shadow-sm text-sm font-bold text-gray-700 bg-white focus:ring-4 ring-green-500/20 outline-none"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>

        {/* SELECTOR DE FECHAS */}
        <div className="grid grid-cols-2 gap-2 mt-1">
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

      <div className="space-y-6 px-1">
        {madresFiltradas.length > 0 ? madresFiltradas.map((madre) => (
          <div key={madre.id} className="bg-white rounded-[45px] shadow-sm border border-gray-100 overflow-hidden relative">
            
            {/* BURBUJA DE PARTOS */}
            <div className="absolute top-8 right-24 flex flex-col items-center">
              <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center font-black text-xl shadow-lg rotate-3 ${madre.totalPartos > 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-300'}`}>
                {madre.totalPartos}
              </div>
              <p className="text-[8px] font-black text-blue-500 uppercase mt-2">Partos</p>
            </div>

            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${madre.estado === 'Activa' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {madre.estado}
                    </span>
                  </div>
                  <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">{madre.numero_crotal_adulto}</h2>
                </div>
                <Link href={`/madres/${madre.id}`} className="bg-gray-900 text-white w-14 h-14 rounded-[22px] flex items-center justify-center text-2xl shadow-xl">👁️</Link>
              </div>

              {/* GRID INFO TÉCNICA */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="bg-gray-50 p-4 rounded-3xl text-center">
                  <p className="text-[8px] font-black text-gray-400 uppercase mb-1 tracking-widest">Raza</p>
                  <p className="text-[11px] font-bold text-gray-800">{madre.raza || 'ASSAFF'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-3xl text-center">
                  <p className="text-[8px] font-black text-gray-400 uppercase mb-1 tracking-widest">Nacimiento</p>
                  <p className="text-[11px] font-bold text-gray-800">{madre.fechaParaMostrar}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-3xl text-center">
                  <p className="text-[8px] font-black text-gray-400 uppercase mb-1 tracking-widest">Ubicación</p>
                  <p className="text-[11px] font-bold text-gray-800 truncate">{madre.ubicacion || 'Finca'}</p>
                </div>
              </div>

              {/* LISTA DE INCIDENCIAS */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 italic">Historial de Incidencias</p>
                
                {madre.listaIncidencias && madre.listaIncidencias.length > 0 ? (
                  madre.listaIncidencias.map((inc: any) => (
                    <div 
                      key={inc.id} 
                      className={`p-4 rounded-2xl border flex justify-between items-center transition-all ${
                        filtro && inc.tipo_incidencia?.toLowerCase().includes(filtro.toLowerCase().replace(/s$/, '')) 
                        ? 'bg-yellow-100 border-yellow-400 shadow-md' 
                        : 'bg-white border-gray-100 shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col">
                        <p className="text-sm font-extrabold text-gray-900">
                          {inc.tipo_incidencia}
                        </p>
                        {inc.descripcion && <p className="text-[10px] text-gray-500 font-bold">{inc.descripcion}</p>}
                      </div>
                      <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg shrink-0">
                        {new Date(inc.fecha_incidencia).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-3xl border border-dashed border-gray-200 text-center text-[10px] text-gray-300 font-black uppercase italic">Sin incidencias</div>
                )}
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-20 bg-white rounded-[45px] border-2 border-dashed border-gray-100">
            <p className="text-4xl mb-4">🐑🚫</p>
            <p className="font-black text-gray-300 uppercase italic">No hay madres con esos filtros</p>
          </div>
        )}
      </div>
    </main>
  );
}