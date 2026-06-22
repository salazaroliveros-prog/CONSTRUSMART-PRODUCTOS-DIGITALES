import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const ContactSection: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) return;
    setSubmitting(true);
    try {
      await supabase.from('constructora_leads').insert({
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: form.message,
        source: 'contact-form',
      });

      await fetch('https://famous.ai/api/crm/6a1093dc76aee1f11d76c7cd/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          source: 'contact-form',
          tags: ['contacto'],
        }),
      });

      toast.success('¡Mensaje enviado! Te contactaremos pronto.');
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contacto" className="py-20 md:py-28 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 md:px-8 grid lg:grid-cols-2 gap-12">
        <div>
          <h2 className="text-4xl md:text-5xl font-bold text-[#1a2332] mb-4">
            ¿Listo para tu <span className="text-orange-500">próximo proyecto?</span>
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Escríbenos y un asesor especializado te atenderá. Cobertura nacional en los 22 departamentos.
          </p>

          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="font-semibold text-[#1a2332]">Teléfono / WhatsApp</div>
                <div className="text-gray-600">+502 4060 1526 / +502 5560 6172</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="font-semibold text-[#1a2332]">Correo</div>
                <div className="text-gray-600">salazaroliveros@gmail.com</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="font-semibold text-[#1a2332]">Oficinas</div>
                <div className="text-gray-600">Barrio el Centro, Quesada, Jutiapa</div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
          <h3 className="text-2xl font-bold text-[#1a2332] mb-5">Envíanos un mensaje</h3>
          <div className="space-y-4">
            <input
              required
              placeholder="Nombre completo *"
              className="w-full border border-gray-300 rounded-lg px-4 py-3"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <input
              required
              type="email"
              placeholder="Correo electrónico *"
              className="w-full border border-gray-300 rounded-lg px-4 py-3"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
            <input
              placeholder="Teléfono"
              className="w-full border border-gray-300 rounded-lg px-4 py-3"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />
            <textarea
              required
              rows={4}
              placeholder="¿En qué te podemos ayudar? *"
              className="w-full border border-gray-300 rounded-lg px-4 py-3"
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1a2332] hover:bg-[#243042] text-white py-3.5 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              {submitting ? 'Enviando...' : 'Enviar Mensaje'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ContactSection;
