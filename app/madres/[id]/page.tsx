"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function FichaMadre() {
  const { id } = useParams();
  const router = useRouter();
  const [madre, setMadre] = useState<any>(null);
  const [partos, setPartos] = useState<any[]>([]); 
  const [recriasAdultas, setRecriasAdultas] = useState<any[]>([]); 
  const [cargando, setCargando] = useState(true);
  const [mostrarArbol, setMostrarArbol] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      if (!id) return;
      setCargando(true);
      
      try {
        // 1. Datos de la oveja que estamos viendo
        const { data: ewe } = await supabase.from("madres").select("*").eq("id", id).single();
        
        if (ewe) {
          setMadre(ewe);

          // 2. Traer TODAS sus crías históricas (tabla crias)
          const { data: dataPartos } = await supabase
            .from("crias")
            .select("*")
            .eq("id_madre_vinculada", id)
            .order("fecha_nacimiento", { ascending: false });
          setPartos(dataPartos || []);

          // 3. Traer TODAS las ovejas que hoy son adultas y tienen a esta como madre (tabla madres)
          const { data: dataRecrias } = await supabase
            .from("madres")
            .select("id, numero_crotal_adulto, madre_id, fecha_nacimiento, estado")
            .eq("madre_id", ewe.numero_crotal_adulto);
          setRecriasAdultas(dataRecrias || []);
        }
      } catch (err) {
        console.error("Error cargando ficha:", err);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, [id]);

  if (cargando) return <div className="p-10 text-center font-black text-gray-400 animate-pulse">Cargando árbol genealógico...</div>;
  if (!madre) return <div className="p-10 text-center text-red-500 font-bold">Oveja no encontrada.</div>;

  return (
    <main className="p-4 bg-gray-50 min-h-screen pb-12">
      <Link href="/madres" className="text-green-700 font-bold mb-6 inline-flex items-center gap-1 bg-white px-4 py-2 rounded-xl shadow-sm border border-green-50 text-xs">
        <span>←</span> Volver al Censo
      </Link>

      {/* CABECERA */}
      <div className="bg-white p-6 rounded-[35px] shadow-sm border border-green-100 mb-6 flex justify-between items-center relative overflow-hidden">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Identificación Madre</p>
          <h1 className="text-4xl font-black text-gray-800 tracking-tighter">{madre.numero_crotal_adulto}</h1>
          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase mt-2 ${madre.estado === 'Activa' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {madre.estado}
          </span>
        </div>
        <button onClick={() => setMostrarArbol(true)} className="bg-green-700 text-white p-5 rounded-[30px] shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center h-24 w-24">
          <span className="text-3xl block mb-1">🌳</span>
          <span className="text-[9px] font-black uppercase tracking-widest leading-none">Árbol</span>
        </button>
      </div>

      {/* SECCIÓN 1: RECRÍA ACTUAL (MADRES HIJAS) */}
      <div className="mb-8">
        <h2 className="text-sm font-black text-purple-700 uppercase mb-4 px-2 italic">Hijas en el Censo (Recría)</h2>
        <div className="space-y-3">
          {recriasAdultas.length > 0 ? (
            recriasAdultas.map(hija => (
              <div key={hija.id} className="bg-purple-600 text-white p-5 rounded-[25px] shadow-md flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black uppercase opacity-70">Crotal Adulto</p>
                  <p className="text-2xl font-black tracking-tight">{hija.numero_crotal_adulto}</p>
                </div>
                <button 
                  onClick={() => router.push(`/madres/${hija.id}`)}
                  className="bg-white text-purple-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-sm active:scale-95 transition-all"
                >
                  Ver Ficha
                </button>
              </div>
            ))
          ) : (
            <div className="bg-white p-5 rounded-[25px] border border-dashed border-gray-200 text-center">
              <p className="text-xs font-bold text-gray-400 italic">No se han encontrado hijas registradas como adultas.</p>
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN 2: HISTORIAL DE PARTOS (TODAS LAS CRÍAS) */}
      <div className="mb-10">
        <h2 className="text-sm font-black text-gray-400 uppercase mb-4 px-2 italic">Historial de Partos ({partos.length})</h2>
        <div className="space-y-3">
          {partos.map(p => (
            <div key={p.id} className="bg-white p-5 rounded-3xl border border-gray-100 flex justify-between items-center shadow-sm relative overflow-hidden">
              
              {/* ETIQUETA DE SEXO LATERAL */}
              <div className={`absolute left-0 top-0 bottom-0 w-2 ${p.sexo?.toUpperCase() === 'MACHO' ? 'bg-blue-400' : 'bg-pink-400'}`}></div>

              <div className="pl-3">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[9px] font-bold text-gray-400 uppercase leading-none">Crotal Nac.</p>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${
                    p.sexo?.toUpperCase() === 'MACHO' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                  }`}>
                    {p.sexo || 'S/D'}
                  </span>
                </div>
                <p className="font-black text-gray-800 text-2xl tracking-tighter leading-none">{p.crotal_nacimiento}</p>
                <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase">
                  Destino: <span className="text-gray-600">{p.destino || 'En Finca'}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Nacimiento</p>
                <p className="text-sm font-bold text-gray-700 bg-gray-50 px-3 py-1 rounded-lg">
                  {new Date(p.fecha_nacimiento).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
          ))}
          {partos.length === 0 && (
            <div className="bg-white p-8 rounded-[30px] border border-dashed border-gray-200 text-center">
              <p className="text-3xl mb-2">🐑</p>
              <p className="text-xs font-black text-gray-300 uppercase">Sin partos registrados</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DEL ÁRBOL */}
      {mostrarArbol && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setMostrarArbol(false)}>
          <div className="bg-white w-full max-w-sm rounded-[40px] p-6 relative flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-center text-gray-800 uppercase italic mb-6">Árbol de Descendencia</h3>
            
            <div className="bg-green-800 text-white p-4 rounded-3xl font-black text-center text-2xl mb-8 relative shadow-lg">
              {madre.numero_crotal_adulto}
              <div className="absolute -bottom-8 left-1/2 w-1 h-8 bg-gray-200 -translate-x-1/2"></div>
            </div>

            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">
              {partos.map(p => {
                const esRecria = recriasAdultas.find(r => r.numero_crotal_adulto === p.crotal_nacimiento);
                const esMacho = p.sexo?.toUpperCase() === 'MACHO';
                
                return (
                  <div key={p.id} className={`p-4 rounded-3xl border-2 relative overflow-hidden ${
                    esRecria 
                      ? 'bg-purple-50 border-purple-200 text-purple-800' 
                      : esMacho ? 'bg-blue-50/50 border-blue-100 text-blue-800' : 'bg-pink-50/50 border-pink-100 text-pink-800'
                  }`}>
                    
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-[9px] font-black uppercase opacity-60">Nacimiento: {p.crotal_nacimiento}</p>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                        esMacho ? 'bg-blue-200 text-blue-800' : 'bg-pink-200 text-pink-800'
                      }`}>
                        {p.sexo?.charAt(0) || '?'}
                      </span>
                    </div>

                    {esRecria ? (
                      <p className="font-black text-lg">Adulto: {esRecria.numero_crotal_adulto}</p>
                    ) : (
                      <p className="font-bold text-xs uppercase opacity-80">Destino: {p.destino || 'Finca'}</p>
                    )}
                  </div>
                );
              })}
              {partos.length === 0 && (
                <p className="text-center text-xs font-bold text-gray-400 italic">No hay descendencia para mostrar en el árbol.</p>
              )}
            </div>
            
            <button onClick={() => setMostrarArbol(false)} className="mt-4 w-full p-4 bg-gray-100 rounded-2xl font-black text-gray-500 hover:bg-gray-200 transition-colors uppercase text-xs">
              Cerrar Esquema
            </button>
          </div>
        </div>
      )}
    </main>
  );
}