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
          // Buscamos por el campo 'madre_id' que es donde guardas el crotal de la madre
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
    <main className="p-4 bg-gray-50 min-h-screen">
      <Link href="/madres" className="text-green-700 font-bold mb-6 inline-block flex items-center gap-1">
        <span>←</span> Volver al Censo
      </Link>

      {/* CABECERA */}
      <div className="bg-white p-6 rounded-[35px] shadow-sm border border-green-100 mb-6 flex justify-between items-center">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Identificación Madre</p>
          <h1 className="text-4xl font-black text-gray-800 tracking-tighter">{madre.numero_crotal_adulto}</h1>
          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase mt-1 ${madre.estado === 'Activa' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {madre.estado}
          </span>
        </div>
        <button onClick={() => setMostrarArbol(true)} className="bg-green-700 text-white p-5 rounded-[30px] shadow-lg active:scale-95 transition-all">
          <span className="text-2xl block">🌳</span>
          <span className="text-[9px] font-black uppercase">Esquema</span>
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
                  <p className="text-xl font-black">{hija.numero_crotal_adulto}</p>
                </div>
                <button 
                  onClick={() => router.push(`/madres/${hija.id}`)}
                  className="bg-white text-purple-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-sm"
                >
                  Ver Ficha
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-400 italic px-2">No se han encontrado hijas registradas como adultas.</p>
          )}
        </div>
      </div>

      {/* SECCIÓN 2: HISTORIAL DE PARTOS (TODAS LAS CRÍAS) */}
      <div className="mb-10">
        <h2 className="text-sm font-black text-gray-400 uppercase mb-4 px-2 italic">Historial de Partos</h2>
        <div className="space-y-3">
          {partos.map(p => (
            <div key={p.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1">Crotal Nacimiento</p>
                <p className="font-black text-gray-700 text-lg">{p.crotal_nacimiento}</p>
                <p className="text-[10px] font-bold text-gray-400 mt-1 italic">Destino: {p.destino || 'S/D'}</p>
              </div>
              <p className="text-xs font-bold text-gray-400">{new Date(p.fecha_nacimiento).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DEL ÁRBOL */}
      {mostrarArbol && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 backdrop-blur-md" onClick={() => setMostrarArbol(false)}>
          <div className="bg-white w-full max-w-sm rounded-[50px] p-8 relative" onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-center text-gray-800 uppercase italic mb-8">Árbol de Descendencia</h3>
            
            <div className="bg-green-800 text-white p-4 rounded-2xl font-black text-center text-xl mb-10 relative">
              {madre.numero_crotal_adulto}
              <div className="absolute -bottom-10 left-1/2 w-0.5 h-10 bg-gray-200"></div>
            </div>

            <div className="space-y-3 max-h-[40vh] overflow-y-auto">
              {/* Combinamos visualmente en el árbol */}
              {partos.map(p => {
                const esRecria = recriasAdultas.find(r => r.numero_crotal_adulto === p.crotal_nacimiento);
                return (
                  <div key={p.id} className={`p-4 rounded-2xl border-2 ${esRecria ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                    <p className="text-[8px] font-black uppercase">Nacimiento: {p.crotal_nacimiento}</p>
                    {esRecria ? (
                      <p className="font-black">Adulto: {esRecria.numero_crotal_adulto} (Recría)</p>
                    ) : (
                      <p className="font-black text-sm italic">Destino: {p.destino || 'S/D'}</p>
                    )}
                  </div>
                );
              })}
            </div>
            <button onClick={() => setMostrarArbol(false)} className="mt-8 w-full p-4 bg-gray-100 rounded-2xl font-black text-gray-400 uppercase text-[10px]">Cerrar</button>
          </div>
        </div>
      )}
    </main>
  );
}