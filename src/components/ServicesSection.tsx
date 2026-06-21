import React, { useState } from 'react';
import { CONSTRUCTION_SERVICES, GUATEMALA_DEPARTMENTS } from '@/lib/constructionData';
import { ArrowRight, X, HardHat, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useFormValidation } from '@/hooks/useValidation';
import { serviceRequestSchema } from '@/lib/validation';

const ServicesSection: React.FC = () => {
  const [selected, setSelected] = useState<typeof CONSTRUCTION_SERVICES[0] | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', department: '', projectSize: '', description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  
  const { errors, validate, touchField, hasErrors } = useFormValidation(
    serviceRequestSchema,
    form
  );

  const submit = async () => {
    if (!selected) return;
    
    touchField('name');
    touchField('email');
    
    const validationResult = validate({
      ...form,
      serviceType: selected.name,
    });

    if (!validationResult.success || hasErrors) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('constructora_service_requests').insert({
        name: form.name,
        email: form.email,
        phone: form.phone,
        service_type: selected.name,
        department: form.department,
        project_size: form.projectSize,
        description: form.description,
      });
      if (error) throw error;

      await fetch('https://famous.ai/api/crm/6a1093dc76aee1f11d76c7cd/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          source: 'service-request',
          tags: ['servicio', selected.id],
        }),
      });

      // Enviar email de confirmación de solicitud
      const { emailService } = await import('@/lib/emailService');
      await emailService.sendServiceRequest({
        name: form.name,
        email: form.email,
        serviceType: selected.name,
        department: form.department,
        description: form.description,
      });

      toast.success('¡Solicitud enviada! Nos contactaremos contigo en menos de 24 horas.');
      setSelected(null);
      setForm({ name: '', email: '', phone: '', department: '', projectSize: '', description: '' });
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="servicios" className="py-20 md:py-28 bg-[#1a2332] text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/40 text-orange-300 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <HardHat className="w-4 h-4" />
            Servicios de Construcción
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Profesionales en Cada <span className="text-orange-400">Etapa</span> de tu Obra
          </h2>
          <p className="text-white/70 text-lg">
            Desde la medición del terreno hasta la entrega llave en mano.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CONSTRUCTION_SERVICES.map(s => (
            <div
              key={s.id}
              className="bg-white/5 hover:bg-white/10 backdrop-blur border border-white/10 rounded-2xl overflow-hidden transition-all group"
            >
              <div className="h-48 overflow-hidden">
                <img
                  src={s.image}
                  alt={s.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{s.name}</h3>
                <p className="text-white/70 text-sm mb-4">{s.description}</p>
                <ul className="space-y-1.5 mb-5">
                  {s.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/80">
                      <Check className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className="text-orange-400 font-semibold text-sm">{s.startingPrice}</span>
                  <button
                    onClick={() => setSelected(s)}
                    className="text-white hover:text-orange-400 font-semibold text-sm flex items-center gap-1"
                  >
                    Solicitar <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-gray-900 rounded-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelected(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-bold text-[#1a2332] mb-1">Solicitar: {selected.name}</h3>
            <p className="text-gray-600 text-sm mb-5">Completa el formulario y te contactaremos.</p>
            <div className="space-y-3">
              <div>
                <input
                  placeholder="Nombre completo *"
                  className={`w-full border rounded-lg px-4 py-2.5 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  onBlur={() => touchField('name')}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Correo electrónico *"
                  className={`w-full border rounded-lg px-4 py-2.5 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  onBlur={() => touchField('email')}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <input
                  placeholder="Teléfono / WhatsApp"
                  className={`w-full border rounded-lg px-4 py-2.5 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  onBlur={() => touchField('phone')}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}
              >
                <option value="">Selecciona departamento</option>
                {GUATEMALA_DEPARTMENTS.map(d => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
              <input
                placeholder="Tamaño / alcance (ej: 200 m², 5 manzanas)"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                value={form.projectSize}
                onChange={e => setForm({ ...form, projectSize: e.target.value })}
              />
              <textarea
                placeholder="Describe tu proyecto"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
              <button
                onClick={submit}
                disabled={submitting}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ServicesSection;
