"use client";
import { supabase } from "@/lib/supabase";

export default function NuevaMadre() {
  const guardarMadre = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const { error } = await supabase.from('madres').insert([{
      numero_crotal_adulto: formData.get('crotal'),
      ano_nacimiento: parseInt(formData.get('ano') as string),
      activa: true
    }]);

    if (!error) {
      alert("Madre dada de alta correctamente");
      window.location.href = "/madres";
    } else {
      alert("Error: Tal vez ese crotal ya existe");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6">Añadir Madre Fundadora</h1>
      <form onSubmit={guardarMadre} className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-1">Número de Crotal</label>
          <input name="crotal" type="text" required className="w-full border-2 p-3 rounded-xl" placeholder="Ej: ES0123..." />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Año de Nacimiento</label>
          <input name="ano" type="number" defaultValue={new Date().getFullYear()} className="w-full border-2 p-3 rounded-xl" />
        </div>
        <button type="submit" className="w-full bg-green-800 text-white p-4 rounded-2xl font-bold mt-4 shadow-lg">
          Guardar en el Censo
        </button>
      </form>
    </div>
  );
}