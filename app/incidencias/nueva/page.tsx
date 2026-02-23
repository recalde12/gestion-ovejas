"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NuevaIncidencia() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [madres, setMadres] = useState<any[]>([]);
  
  // Formulario
  const [madreId, setMadreId] = useState("");
  const [tipo, setTipo] = useState("BAJA");
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [observaciones, setObservaciones] = useState("");

  // Tipos de incidencia comunes
  const tiposComunes = ["BAJA", "VENTA", "MUERTA", "MAMIA", "VIEJA", "ESPONJA", "VACUNA"];

  // Buscar la oveja por crotal mientras escribes
  useEffect(() => {
    const buscarOveja = async () => {
      if (busqueda.length > 2) {
        const { data } = await supabase
          .from("madres")
          .select("id, numero_crotal_adulto")
          .ilike("numero_crotal_adulto", `%${busqueda}%`)
          .limit(5);
        setMadres(data || []);
      }
    };
    buscarOveja();
  }, [busqueda]);

  const guardarIncidencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!madreId) return alert("Selecciona una oveja");

    setCargando(true);

    // 1. Insertar la incidencia
    const { error: errorInc } = await supabase.from("incidencias").insert([
      {
        id_madre_vinculada: madreId,
        tipo_incidencia: tipo,
        fecha_incidencia: fecha,
        comentarios: observaciones // O la columna que tengas para notas
      },
    ]);

    if (errorInc) {
      alert("Error al guardar: " + errorInc.message);
    } else {
      // 2. SI ES UNA BAJA/VENTA/MUERTE, actualizamos el estado de la madre automáticamente
      if (["BAJA", "VENTA", "MUERTA", "VIEJA", "MAMIA"].includes(tipo.toUpperCase())) {
        await supabase
          .from("madres")
          .update({ estado: 'Inactiva' })
          .eq("id", madreId);
      }
      
      router.push("/incidencias");
      router.refresh();
    }
    setCargando(false);
  };

  return (
    <main className="p-4 bg-gray-50 min-h-screen">
      <Link href="/incidencias" className="text-red-600 font-bold mb-6 inline-block">← Cancelar</Link>
      
      <h1 className="text-2xl font-black text-gray-800 mb-6">Nueva Incidencia</h1>

      <form onSubmit={guardarIncidencia} className="space-y-6">
        {/* BUSCADOR DE OVEJA */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
          <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Crotal de la Oveja</label>
          <input
            type="text"
            placeholder="Escribe el crotal..."
            className="w-full p-3 bg-gray-50 rounded-xl border-none outline-none font-bold"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          
          <div className="mt-2 space-y-2">
            {madres.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMadreId(m.id);
                  setBusqueda(m.numero_crotal_adulto);
                  setMadres([]);
                }}
                className={`w-full text-left p-3 rounded-xl text-sm font-bold ${
                  madreId === m.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {m.numero_crotal_adulto} {madreId === m.id ? '✓' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* TIPO DE INCIDENCIA */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
          <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block">Tipo de Incidencia</label>
          <div className="flex flex-wrap gap-2">
            {tiposComunes.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`px-4 py-2 rounded-full text-xs font-black transition-all ${
                  tipo === t ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* FECHA Y NOTAS */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Fecha</label>
            <input 
              type="date" 
              className="w-full font-bold outline-none" 
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Observaciones</label>
            <textarea 
              className="w-full text-sm outline-none resize-none" 
              rows={3} 
              placeholder="Ej: Cojera pata trasera, venta a particular..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={cargando || !madreId}
          className="w-full bg-gray-900 text-white p-5 rounded-[30px] font-black uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-50 transition-all"
        >
          {cargando ? "Guardando..." : "Registrar Incidencia"}
        </button>
      </form>
    </main>
  );
}