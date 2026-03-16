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
    if (!madreId) return alert("Por favor, selecciona una oveja del buscador.");

    setCargando(true);

    // 1. Insertar la incidencia
    const { error: errorInc } = await supabase.from("incidencias").insert([
      {
        id_madre_vinculada: madreId,
        tipo_incidencia: tipo,
        fecha_incidencia: fecha,
        comentarios: observaciones
      },
    ]);

    if (errorInc) {
      alert("Error al guardar la incidencia: " + errorInc.message);
    } else {
      // 2. LÓGICA CORREGIDA: Solo desactivamos la oveja si es una baja definitiva
      // Hemos quitado "MAMIA", "ESPONJA" y "VACUNA" de esta lista negra.
      if (["BAJA", "VENTA", "MUERTA", "VIEJA"].includes(tipo.toUpperCase())) {
        await supabase
          .from("madres")
          .update({ estado: 'Inactiva' })
          .eq("id", madreId);
      }
      
      // 3. AVISO DE ÉXITO Y REDIRECCIÓN AL INICIO
      alert("✅ ¡Incidencia registrada correctamente!");
      router.push("/");
      router.refresh();
    }
    setCargando(false);
  };

  return (
    <main className="p-4 bg-gray-50 min-h-screen">
      <Link href="/" className="text-red-600 font-bold mb-6 inline-block bg-white px-4 py-2 rounded-xl shadow-sm border border-red-50 text-xs">
        ← Cancelar
      </Link>
      
      <h1 className="text-2xl font-black text-gray-800 mb-6 px-1">Nueva Incidencia</h1>

      <form onSubmit={guardarIncidencia} className="space-y-6">
        {/* BUSCADOR DE OVEJA */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
          <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Crotal de la Oveja</label>
          <input
            type="text"
            placeholder="Escribe el crotal..."
            className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold text-gray-800 focus:ring-4 ring-red-500/20"
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
                  setMadres([]); // Limpiamos la lista al seleccionar
                }}
                className={`w-full text-left p-3 rounded-xl text-sm font-bold transition-all ${
                  madreId === m.id ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                  tipo === t ? 'bg-red-600 text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
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
              className="w-full font-bold text-gray-700 outline-none p-2" 
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Observaciones (Opcional)</label>
            <textarea 
              className="w-full text-sm font-bold text-gray-700 outline-none resize-none p-2 bg-gray-50 rounded-xl" 
              rows={3} 
              placeholder="Ej: Cojera pata trasera, tratamiento antibiótico..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={cargando || !madreId}
          className="w-full bg-gray-900 text-white p-5 rounded-[30px] font-black uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-50 transition-all mt-4 mb-8"
        >
          {cargando ? "Guardando..." : "Registrar Incidencia"}
        </button>
      </form>
    </main>
  );
}