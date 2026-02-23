"use client";
import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";

export default function GestionarCria({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [destino, setDestino] = useState("");
  const [cria, setCria] = useState<any>(null);

  useEffect(() => {
    if (id) {
      // Traemos también el crotal de la madre para la recría
      supabase.from('crias').select('*, madres(numero_crotal_adulto)').eq('id', id).single().then(({ data }) => setCria(data));
    }
  }, [id]);

  const finalizarGestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    try {
      if (destino === 'Recria') {
        // 1. Creamos la ficha en la tabla MADRES
        const { data: nuevaMadre } = await supabase.from('madres').insert([{
          numero_crotal_adulto: formData.get('nuevo_crotal'),
          madre_id: cria.madres?.numero_crotal_adulto, // IMPORTANTE para el árbol
          fecha_nacimiento: cria.fecha_nacimiento,
          estado: 'Activa'
        }]).select().single();

        // 2. Marcamos la cría como recría y vinculamos el ID
        await supabase.from('crias').update({ 
          destino: 'Recria',
          id_madre_vinculada: cria.id_madre_vinculada // Mantenemos el vínculo original
        }).eq('id', id);

      } else if (destino === 'Venta') {
        // Lógica de Venta: Usamos los nombres exactos de la base de datos
        await supabase.from('crias').update({ 
          destino: 'Venta',
          cliente_venta: formData.get('cliente_venta'), // Antes era comprador
          precio_venta: formData.get('precio_venta'),  // Antes era precio
          fecha_venta: formData.get('fecha_venta')
        }).eq('id', id);

      } else {
        await supabase.from('crias').update({ destino }).eq('id', id);
      }
      
      // Registrar en el diario
      await supabase.from('partos_incidencias').insert([{
        tipo: destino,
        crotal_animal: cria.crotal_nacimiento,
        descripcion: `Movimiento: ${destino} ${destino === 'Venta' ? '- Cliente: ' + formData.get('cliente_venta') : ''}`
      }]);

      alert("¡Registro actualizado con éxito!");
      window.location.href = "/ventas"; // Te mando directo a ver el dinero
    } catch (error) {
      alert("Error al procesar el cambio");
    }
  };

  if (!cria) return <div className="p-10 text-center animate-pulse">Cargando datos...</div>;

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-black mb-6 text-gray-800">Gestionar: {cria.crotal_nacimiento}</h1>
      
      <form onSubmit={finalizarGestion} className="space-y-6">
        <div>
          <label className="block text-[10px] font-black mb-2 text-gray-400 uppercase tracking-widest">¿Qué destino tiene la cría?</label>
          <select 
            className="w-full border-2 p-5 rounded-[25px] bg-white shadow-sm focus:border-blue-500 outline-none transition-all font-bold text-gray-700"
            onChange={(e) => setDestino(e.target.value)}
            required
          >
            <option value="">-- Seleccionar --</option>
            <option value="Recria">🐑 Pasar a Recría (Nueva Madre)</option>
            <option value="Venta">💰 Venta</option>
            <option value="Baja">❌ Baja (Muerte)</option>
          </select>
        </div>

        {/* CAMPOS PARA VENTA */}
        {destino === 'Venta' && (
          <div className="p-6 bg-blue-600 rounded-[35px] space-y-4 shadow-xl text-white">
            <h3 className="font-black uppercase text-xs italic opacity-80">Detalles de Facturación</h3>
            <div>
              <label className="text-[10px] font-black uppercase opacity-70 ml-2">Cliente / Comprador</label>
              <input name="cliente_venta" type="text" className="w-full p-4 rounded-2xl mt-1 text-gray-800 font-bold outline-none" placeholder="Nombre" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase opacity-70 ml-2">Precio (€)</label>
                <input name="precio_venta" type="number" step="0.01" className="w-full p-4 rounded-2xl mt-1 text-gray-800 font-bold outline-none" placeholder="0.00" required />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase opacity-70 ml-2">Fecha</label>
                <input name="fecha_venta" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-4 rounded-2xl mt-1 text-gray-800 font-bold outline-none text-xs" required />
              </div>
            </div>
          </div>
        )}

        {/* CAMPOS PARA RECRÍA */}
        {destino === 'Recria' && (
          <div className="p-6 bg-green-700 rounded-[35px] text-white shadow-xl">
            <h3 className="font-black uppercase text-xs italic opacity-80 mb-3">Promoción a Madre</h3>
            <label className="text-[10px] font-black uppercase opacity-70 ml-2">Confirmar Crotal Adulta</label>
            <input name="nuevo_crotal" defaultValue={cria.crotal_nacimiento} className="w-full p-4 rounded-2xl mt-1 text-gray-800 font-bold outline-none" required />
            <p className="text-[9px] mt-2 opacity-60">* Se creará automáticamente en el censo de madres.</p>
          </div>
        )}

        <button type="submit" className="w-full bg-gray-900 text-white p-6 rounded-[30px] font-black uppercase tracking-tighter shadow-xl active:scale-95 transition-transform">
          Finalizar Gestión
        </button>
      </form>
    </div>
  );
}