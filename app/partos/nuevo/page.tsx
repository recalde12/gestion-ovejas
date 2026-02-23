"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function NuevoParto() {
  const [numCrias, setNumCrias] = useState(1);
  // Añadimos el estado de la fecha, por defecto "hoy" en formato YYYY-MM-DD
  const [fechaNacimiento, setFechaNacimiento] = useState(new Date().toISOString().split('T')[0]);
  const [crias, setCrias] = useState([{ crotal: "", sexo: "Hembra" }]);
  const [guardando, setGuardando] = useState(false);

  const guardarParto = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const madreCrotal = formData.get("madre") as string;

      // 1. Buscamos el ID real de la madre en la BBDD
      const { data: madreObj, error: errMadre } = await supabase
        .from("madres")
        .select("id")
        .eq("numero_crotal_adulto", madreCrotal)
        .single();

      // Si no encuentra la madre, avisamos y cortamos
      if (errMadre || !madreObj) {
        alert(`¡Ojo! La madre con crotal ${madreCrotal} no existe en el censo.`);
        setGuardando(false);
        return;
      }

      // 2. Preparamos y guardamos SOLAMENTE las crías (sin registrar incidencia)
      const nuevasCrias = crias.map(c => ({
        crotal_nacimiento: c.crotal,
        sexo: c.sexo,
        id_madre_vinculada: madreObj.id,
        fecha_nacimiento: fechaNacimiento, // Pasamos la fecha en formato YYYY-MM-DD
        destino: null // Para que salgan como "En Finca" en el censo
      }));

      const { error: errorCrias } = await supabase.from("crias").insert(nuevasCrias);

      if (errorCrias) {
        console.error("Fallo al guardar crías:", errorCrias);
        alert("Error al guardar las crías: " + errorCrias.message);
        setGuardando(false);
        return;
      }

      // ¡TODO PERFECTO!
      alert("✅ ¡Parto registrado con éxito!");
      window.location.href = "/crias"; 

    } catch (error) {
      console.error("Error general:", error);
      alert("Hubo un error inesperado al guardar.");
    } finally {
      setGuardando(false);
    }
  };

  const handleNumCriasChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseInt(e.target.value);
    setNumCrias(val);
    const nuevasCrias = Array.from({ length: val }, () => ({ crotal: "", sexo: "Hembra" }));
    setCrias(nuevasCrias);
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-md mx-auto">
        <Link href="/" className="text-green-700 font-black bg-white px-5 py-3 rounded-2xl shadow-sm border border-green-50 text-xs inline-block mb-6">
          ← INICIO
        </Link>
        
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 relative overflow-hidden">
          <h1 className="text-3xl font-black text-gray-800 tracking-tighter mb-2">Registrar Parto</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">Añadir nuevos individuos</p>
          
          <form onSubmit={guardarParto} className="space-y-6">
            
            {/* BUSCADOR DE MADRE Y FECHA */}
            <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Crotal de la Madre</label>
                <input 
                  name="madre" 
                  type="text" 
                  required 
                  className="w-full bg-white p-4 rounded-2xl border-none shadow-sm outline-none font-black text-xl text-gray-800 focus:ring-4 ring-green-500/20" 
                  placeholder="Ej: ES12..." 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Fecha de Nacimiento</label>
                <input 
                  type="date" 
                  required 
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                  className="w-full bg-white p-4 rounded-2xl border-none shadow-sm outline-none font-bold text-gray-700 focus:ring-4 ring-green-500/20" 
                />
              </div>
            </div>

            {/* CANTIDAD DE CRÍAS */}
            <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Número de crías</label>
              <select 
                className="w-full bg-white p-4 rounded-2xl border-none shadow-sm outline-none font-bold text-gray-700 focus:ring-4 ring-green-500/20"
                value={numCrias}
                onChange={handleNumCriasChange}
              >
                <option value="1">1 (Simple)</option>
                <option value="2">2 (Doble)</option>
                <option value="3">3 (Triple)</option>
              </select>
            </div>

            {/* DATOS DE CADA CRÍA */}
            <div className="space-y-4 pt-2">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Identificación de las crías</h3>
              
              {crias.map((cria, i) => (
                <div key={i} className="p-5 bg-green-50 rounded-3xl border border-green-100 relative">
                  <span className="absolute -top-3 left-4 bg-green-600 text-white text-[9px] font-black uppercase px-3 py-1 rounded-full shadow-md">
                    Cría #{i + 1}
                  </span>
                  
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="block text-[8px] font-black text-green-700 uppercase mb-1">Crotal Corto</label>
                      <input 
                        placeholder="Ej: 245" 
                        className="w-full border-none p-3 rounded-xl shadow-sm outline-none font-bold text-gray-700"
                        value={cria.crotal}
                        onChange={(e) => {
                          const newCrias = [...crias];
                          newCrias[i].crotal = e.target.value;
                          setCrias(newCrias);
                        }}
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-green-700 uppercase mb-1">Sexo</label>
                      <select 
                        className="w-full border-none p-3 rounded-xl shadow-sm outline-none font-bold text-gray-700"
                        value={cria.sexo}
                        onChange={(e) => {
                          const newCrias = [...crias];
                          newCrias[i].sexo = e.target.value;
                          setCrias(newCrias);
                        }}
                      >
                        <option value="Hembra">Hembra</option>
                        <option value="Macho">Macho</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              type="submit" 
              disabled={guardando}
              className={`w-full text-white p-5 rounded-3xl font-black uppercase tracking-tighter text-lg shadow-xl transition-all ${
                guardando ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 active:scale-95'
              }`}
            >
              {guardando ? 'Guardando...' : 'Confirmar Parto'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}