"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function HistorialIncidencias() {
  const [incidencias, setIncidencias] = useState<any[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<string>("TODAS");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [cargando, setCargando] = useState(true);

  // Lista de tipos para los botones del filtro
  const tiposComunes = ["TODAS", "BAJA", "VENTA", "MUERTA", "MAMIA", "VIEJA", "ESPONJAS", "VACUNA"];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      // 1. Traemos todas las incidencias (las más nuevas primero)
      const { data: dataIncidencias, error: errInc } = await supabase
        .from("incidencias")
        .select("*")
        .order("fecha_incidencia", { ascending: false });

      if (errInc) throw errInc;

      // 2. Traemos las madres para saber su crotal
      const { data: dataMadres } = await supabase.from("madres").select("id, numero_crotal_adulto");

      // 3. Cruzamos los datos
      const incidenciasCompletas = (dataIncidencias || []).map(inc => {
        const madreVinculada = (dataMadres || []).find(m => m.id === inc.id_madre_vinculada);
        return {
          ...inc,
          crotalMadre: madreVinculada ? madreVinculada.numero_crotal_adulto : "Oveja Borrada"
        };
      });

      setIncidencias(incidenciasCompletas);
    } catch (error) {
      console.error("Error cargando incidencias:", error);
    } finally {
      setCargando(false);
    }
  };

  // Aplicamos los filtros (Por Tipo y Por Fecha)
  const incidenciasFiltradas = incidencias.filter(inc => {
    // 1. Filtro de Tipo
    let cumpleTipo = true;
    if (filtroTipo !== "TODAS") {
      cumpleTipo = inc.tipo_incidencia?.toUpperCase() === filtroTipo;
    }

    // 2. Filtro de Fecha
    let cumpleFecha = true;
    if (fechaInicio || fechaFin) {
      if (inc.fecha_incidencia) {
        const fechaInc = inc.fecha_incidencia.split('T')[0];
        if (fechaInicio && fechaFin) cumpleFecha = fechaInc >= fechaInicio && fechaInc <= fechaFin;
        else if (fechaInicio) cumpleFecha = fechaInc >= fechaInicio;
        else if (fechaFin) cumpleFecha = fechaInc <= fechaFin;
      } else {
        cumpleFecha = false; // Si no tiene fecha y hay filtro activo, la ocultamos
      }
    }

    return cumpleTipo && cumpleFecha;
  });

  // Función para darle un color chulo a cada tipo de etiqueta
  const obtenerColorEtiqueta = (tipo: string) => {
    const t = tipo?.toUpperCase() || "";
    if (["BAJA", "MUERTA", "VIEJA"].includes(t)) return "bg-red-100 text-red-700 border-red-200";
    if (t === "VENTA") return "bg-green-100 text-green-700 border-green-200";
    if (t === "MAMIA") return "bg-purple-100 text-purple-700 border-purple-200";
    if (["ESPONJA", "VACUNA"].includes(t)) return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  if (cargando) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-black text-gray-400 animate-pulse uppercase">Cargando historial...</div>;

  return (
    <main className="p-4 bg-gray-50 min-h-screen pb-24">
      {/* CABECERA Y FILTROS FIJOS ARRIBA */}
      <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-md pt-2 pb-4 px-1">
        
        <div className="flex justify-between items-center mb-4">
          <Link href="/" className="text-gray-700 font-black bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 text-xs">← INICIO</Link>
          <div className="text-right flex items-center gap-3">
            {/* Botón de limpiar filtros si hay alguno activo */}
            {(filtroTipo !== "TODAS" || fechaInicio || fechaFin) && (
              <button 
                onClick={() => { setFiltroTipo("TODAS"); setFechaInicio(""); setFechaFin(""); }}
                className="text-[9px] font-black text-red-500 uppercase underline"
              >
                Limpiar
              </button>
            )}
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase leading-none">Registro Médico</p>
              <p className="text-xl font-black text-gray-800 leading-none">Historial</p>
            </div>
          </div>
        </div>

        {/* SELECTOR DE FECHAS */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex flex-col">
            <label className="text-[8px] font-black text-gray-400 uppercase ml-2 mb-1">Desde fecha</label>
            <input 
              type="date" 
              className="p-3 rounded-xl border border-gray-100 shadow-sm text-[11px] font-bold text-gray-600 bg-white outline-none focus:ring-2 ring-gray-200"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[8px] font-black text-gray-400 uppercase ml-2 mb-1">Hasta fecha</label>
            <input 
              type="date" 
              className="p-3 rounded-xl border border-gray-100 shadow-sm text-[11px] font-bold text-gray-600 bg-white outline-none focus:ring-2 ring-gray-200"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
        </div>

        {/* FILTROS POR TIPO (Scroll Horizontal) */}
        <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar hide-scrollbar">
          {tiposComunes.map(tipo => (
            <button
              key={tipo}
              onClick={() => setFiltroTipo(tipo)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm border ${
                filtroTipo === tipo 
                  ? 'bg-gray-900 text-white border-gray-900 scale-105' 
                  : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
              }`}
            >
              {tipo}
            </button>
          ))}
        </div>
      </div>

      {/* LISTADO DE INCIDENCIAS */}
      <div className="space-y-4 px-1 mt-2">
        <div className="flex justify-between items-center px-2 mb-2">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Mostrando {incidenciasFiltradas.length} registros
          </p>
          <Link href="/incidencias/nueva" className="text-[10px] font-black text-red-600 uppercase bg-red-50 px-3 py-1 rounded-lg">
            + Nueva
          </Link>
        </div>

        {incidenciasFiltradas.length > 0 ? incidenciasFiltradas.map((inc) => (
          <div key={inc.id} className="bg-white rounded-[30px] shadow-sm border border-gray-100 overflow-hidden p-5 relative">
            
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Oveja Afectada</p>
                <Link href={`/madres/${inc.id_madre_vinculada}`} className="text-2xl font-black text-gray-900 tracking-tighter leading-none hover:text-red-600 transition-colors">
                  {inc.crotalMadre}
                </Link>
              </div>
              
              <div className="text-right flex flex-col items-end">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border shadow-sm ${obtenerColorEtiqueta(inc.tipo_incidencia)}`}>
                  {inc.tipo_incidencia}
                </span>
                <p className="text-[10px] font-bold text-gray-400 mt-2">
                  {new Date(inc.fecha_incidencia).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>

            {/* CAJA DE DESCRIPCIÓN */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mt-4">
              <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Observaciones / Tratamiento</p>
              <p className={`text-sm font-bold ${inc.comentarios ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                {inc.comentarios || "Sin observaciones adicionales."}
              </p>
            </div>
            
          </div>
        )) : (
          <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-gray-200 mt-6">
            <p className="text-4xl mb-2">📋</p>
            <p className="font-black text-gray-400 uppercase italic text-xs">
              No hay incidencias registradas con estos filtros
            </p>
          </div>
        )}
      </div>
    </main>
  );
}