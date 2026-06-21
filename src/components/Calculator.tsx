import React, { useState, useMemo, useEffect } from 'react';
import {
  GUATEMALA_DEPARTMENTS,
  CONSTRUCTION_TYPES,
  QUALITY_LEVELS,
  calculateCost,
  formatQ,
} from '@/lib/constructionData';
import { Calculator as CalcIcon, MapPin, Home, Sparkles, Lock, Crown, X, Save, FolderOpen, Trash2, Share2, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useFormValidation } from '@/hooks/useValidation';
import { calculatorQuoteSchema } from '@/lib/validation';

const Calculator: React.FC = () => {
  const [department, setDepartment] = useState('Guatemala');
  const [constructionType, setConstructionType] = useState('vivienda-1n');
  const [quality, setQuality] = useState('estandar');
  const [meters, setMeters] = useState<number>(100);
  const [showPremium, setShowPremium] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [showProjects, setShowProjects] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailForm, setEmailForm] = useState({ name: '', email: '' });
  const [emailSending, setEmailSending] = useState(false);
  
  const { errors, validate, touchField, hasErrors } = useFormValidation(
    calculatorQuoteSchema,
    form
  );

  const result = useMemo(
    () => calculateCost(department, constructionType, quality, meters),
    [department, constructionType, quality, meters]
  );

  const dept = GUATEMALA_DEPARTMENTS.find(d => d.name === department);
  const type = CONSTRUCTION_TYPES.find(t => t.id === constructionType);

  // Cargar proyectos guardados
  useEffect(() => {
    const saved = localStorage.getItem('calculator_projects');
    if (saved) {
      setSavedProjects(JSON.parse(saved));
    }
  }, []);

  // Guardar proyecto actual
  const saveProject = () => {
    if (!projectName.trim()) {
      toast.error('Por favor ingresa un nombre para el proyecto');
      return;
    }

    const newProject = {
      id: Date.now().toString(),
      name: projectName,
      department,
      constructionType,
      quality,
      meters,
      result,
      createdAt: new Date().toISOString(),
    };

    const updatedProjects = [...savedProjects, newProject];
    setSavedProjects(updatedProjects);
    localStorage.setItem('calculator_projects', JSON.stringify(updatedProjects));
    
    setProjectName('');
    toast.success('Proyecto guardado exitosamente');
  };

  // Cargar proyecto guardado
  const loadProject = (project: any) => {
    setDepartment(project.department);
    setConstructionType(project.constructionType);
    setQuality(project.quality);
    setMeters(project.meters);
    setProjectName(project.name);
    setShowProjects(false);
    toast.success('Proyecto cargado');
  };

  // Eliminar proyecto
  const deleteProject = (projectId: string) => {
    const updatedProjects = savedProjects.filter(p => p.id !== projectId);
    setSavedProjects(updatedProjects);
    localStorage.setItem('calculator_projects', JSON.stringify(updatedProjects));
    toast.success('Proyecto eliminado');
  };

  // Comparar con proyectos guardados
  const compareProjects = () => {
    if (savedProjects.length === 0) {
      toast.info('No tienes proyectos guardados para comparar');
      return;
    }
    setShowProjects(true);
  };

  const sendResultsByEmail = async () => {
    if (!emailForm.name || !emailForm.email) {
      toast.error('Completa tu nombre y correo');
      return;
    }
    if (!result) return;
    setEmailSending(true);
    try {
      const { emailService } = await import('@/lib/emailService');
      await emailService.sendQuoteNotification({
        name: emailForm.name,
        email: emailForm.email,
        department,
        squareMeters: meters,
        estimatedCost: result.avg,
      });

      await supabase.from('constructora_quotes').insert({
        name: emailForm.name,
        email: emailForm.email,
        department,
        construction_type: type?.name || constructionType,
        quality_level: quality,
        square_meters: meters,
        estimated_min: result.min,
        estimated_max: result.max,
        estimated_avg: result.avg,
        status: 'new',
      });

      toast.success('Resultados enviados a tu correo');
      setShowEmailForm(false);
      setEmailForm({ name: '', email: '' });
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setEmailSending(false);
    }
  };

  const requestPremium = async () => {
    touchField('name');
    touchField('email');
    
    const validationResult = validate({
      ...form,
      department,
      constructionType,
      qualityLevel: quality,
      squareMeters: meters,
    });

    if (!validationResult.success || hasErrors) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    if (!result) return;
    setSubmitting(true);
    try {
      await supabase.from('constructora_quotes').insert({
        name: form.name,
        email: form.email,
        phone: form.phone,
        department,
        construction_type: type?.name || constructionType,
        quality_level: quality,
        square_meters: meters,
        estimated_min: result.min,
        estimated_max: result.max,
        estimated_avg: result.avg,
        premium_requested: true,
        status: 'new',
      });

      await fetch('https://famous.ai/api/crm/6a1093dc76aee1f11d76c7cd/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          source: 'calculator-premium',
          tags: ['calculadora', 'premium-lead', department.toLowerCase()],
        }),
      });

      // Enviar email de notificación de cotización
      const { emailService } = await import('@/lib/emailService');
      await emailService.sendQuoteNotification({
        name: form.name,
        email: form.email,
        department,
        squareMeters: meters,
        estimatedCost: result.avg,
      });

      toast.success('¡Solicitud recibida! Te enviaremos el presupuesto detallado.');
      setShowPremium(false);
      setForm({ name: '', email: '', phone: '' });
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="calculadora" className="py-20 md:py-28 bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 bg-[#1a2332] text-orange-300 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <CalcIcon className="w-4 h-4" />
            Calculadora de Construcción
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[#1a2332] mb-4">
            Calcula el Costo de tu <span className="text-orange-500">Obra</span>
          </h2>
          <p className="text-gray-600 text-lg">
            Costos actualizados de materiales y mano de obra para los 22 departamentos de Guatemala.
          </p>
        </div>

        {/* Project Management Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Nombre del proyecto (ej: Casa de playa)"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-4 py-2"
            />
            <button
              onClick={saveProject}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              <Save className="w-4 h-4" /> Guardar
            </button>
            <button
              onClick={() => setShowProjects(true)}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              <FolderOpen className="w-4 h-4" /> Mis Proyectos ({savedProjects.length})
            </button>
            <button
              onClick={compareProjects}
              className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              <Share2 className="w-4 h-4" /> Comparar
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
            <h3 className="text-xl font-bold text-[#1a2332] mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" /> Parámetros de tu Proyecto
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-orange-500" /> Departamento
                </label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-orange-500 outline-none"
                >
                  {GUATEMALA_DEPARTMENTS.map(d => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <Home className="w-4 h-4 text-orange-500" /> Tipo de Construcción
                </label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {CONSTRUCTION_TYPES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setConstructionType(t.id)}
                      className={`text-left p-3 rounded-lg border-2 transition ${
                        constructionType === t.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-sm text-[#1a2332]">{t.name}</div>
                      <div className="text-xs text-gray-500">{t.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nivel de Calidad</label>
                <div className="grid grid-cols-3 gap-2">
                  {QUALITY_LEVELS.map(q => (
                    <button
                      key={q.id}
                      onClick={() => setQuality(q.id)}
                      className={`p-3 rounded-lg border-2 transition ${
                        quality === q.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-sm text-[#1a2332]">{q.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{q.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Metros cuadrados (m²)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    value={meters}
                    onChange={e => setMeters(Number(e.target.value) || 0)}
                    className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-3 text-lg font-bold focus:border-orange-500 outline-none"
                  />
                  <span className="text-gray-500 font-semibold">m²</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="1000"
                  step="10"
                  value={Math.min(meters, 1000)}
                  onChange={e => setMeters(Number(e.target.value))}
                  className="w-full mt-3 accent-orange-500"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>20 m²</span><span>500 m²</span><span>1000 m²</span>
                </div>
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-[#1a2332] to-[#243042] text-white rounded-2xl shadow-xl p-6 md:p-8 sticky top-24">
              <div className="text-orange-400 text-sm font-semibold mb-2">ESTIMACIÓN BÁSICA GRATUITA</div>
              <h3 className="text-2xl font-bold mb-4">Costo Estimado</h3>

              {result ? (
                <>
                  <div className="bg-white/10 rounded-xl p-4 mb-4">
                    <div className="text-xs text-white/70 mb-1">Costo por m²</div>
                    <div className="text-2xl font-bold text-orange-400">{formatQ(result.pricePerM2)}</div>
                  </div>

                  <div className="bg-orange-500/20 border border-orange-500/40 rounded-xl p-5 mb-4">
                    <div className="text-xs text-orange-300 mb-1">COSTO TOTAL ESTIMADO</div>
                    <div className="text-4xl md:text-5xl font-bold text-white mb-2">{formatQ(result.avg)}</div>
                    <div className="text-sm text-white/80">
                      Rango: {formatQ(result.min)} – {formatQ(result.max)}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-white/80 mb-5">
                    <div className="flex justify-between"><span>Departamento:</span><span className="font-semibold text-white">{department}</span></div>
                    <div className="flex justify-between"><span>Tipo:</span><span className="font-semibold text-white">{type?.name}</span></div>
                    <div className="flex justify-between"><span>Calidad:</span><span className="font-semibold text-white capitalize">{quality}</span></div>
                    <div className="flex justify-between"><span>Área:</span><span className="font-semibold text-white">{meters} m²</span></div>
                  </div>

                  {/* Email results (free) */}
                  {!showEmailForm ? (
                    <button
                      onClick={() => setShowEmailForm(true)}
                      className="w-full bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition mb-4 border border-white/20"
                    >
                      <Mail className="w-4 h-4" />
                      Recibir resultados por correo (gratis)
                    </button>
                  ) : (
                    <div className="bg-white/10 rounded-xl p-4 mb-4 space-y-2">
                      <div className="text-xs text-white/70 mb-1">Recibe estos resultados gratis:</div>
                      <input
                        placeholder="Tu nombre"
                        value={emailForm.name}
                        onChange={e => setEmailForm({ ...emailForm, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg text-sm text-gray-900"
                      />
                      <input
                        type="email"
                        placeholder="Tu correo"
                        value={emailForm.email}
                        onChange={e => setEmailForm({ ...emailForm, email: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg text-sm text-gray-900"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={sendResultsByEmail}
                          disabled={emailSending}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                        >
                          {emailSending ? 'Enviando...' : 'Enviar'}
                        </button>
                        <button
                          onClick={() => setShowEmailForm(false)}
                          className="px-3 py-2 text-xs text-white/60 hover:text-white"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Premium lock */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 text-orange-400 font-semibold mb-2">
                      <Lock className="w-4 h-4" />
                      Bloqueado – Plan Premium
                    </div>
                    <ul className="text-xs text-white/60 space-y-1">
                      <li>• Desglose detallado de materiales</li>
                      <li>• Planos constructivos PDF</li>
                      <li>• Cronograma de obra</li>
                      <li>• Lista de proveedores recomendados</li>
                    </ul>
                  </div>

                  <button
                    onClick={() => setShowPremium(true)}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-orange-500/30"
                  >
                    <Crown className="w-5 h-5" />
                    Obtener Presupuesto Premium
                  </button>
                  <p className="text-xs text-white/50 text-center mt-3">
                    Esta es una estimación referencial. Para precisión total solicita el plan premium.
                  </p>
                </>
              ) : (
                <p className="text-white/60">Ingresa los datos para ver tu estimación.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Projects Modal */}
      {showProjects && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowProjects(false)} className="absolute top-4 right-4 text-gray-400">
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-bold text-[#1a2332] mb-4">Mis Proyectos Guardados</h3>
            
            {savedProjects.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No tienes proyectos guardados. Calcula tu proyecto y guárdalo con un nombre.
              </p>
            ) : (
              <div className="space-y-3">
                {savedProjects.map((project) => (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <div className="font-semibold text-[#1a2332]">{project.name}</div>
                      <div className="text-sm text-gray-500">
                        {project.department} · {project.meters} m² · Q{project.result?.avg?.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        Guardado: {new Date(project.createdAt).toLocaleDateString('es-GT')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => loadProject(project)}
                        className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                      >
                        <FolderOpen className="w-3 h-3" /> Cargar
                      </button>
                      <button
                        onClick={() => deleteProject(project.id)}
                        className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Premium modal */}
      {showPremium && result && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowPremium(false)} className="absolute top-4 right-4 text-gray-400">
              <X className="w-6 h-6" />
            </button>
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-100 rounded-full mb-3">
                <Crown className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-[#1a2332]">Presupuesto Premium</h3>
              <p className="text-sm text-gray-600 mt-2">
                Te enviaremos un desglose detallado, planos preliminares y una propuesta personalizada para tu proyecto en {department}.
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 text-sm">
              <div className="font-semibold text-[#1a2332]">Resumen de tu solicitud:</div>
              <div className="text-gray-700">{meters} m² – {type?.name} – {quality}</div>
              <div className="text-orange-600 font-bold">Estimación: {formatQ(result.avg)}</div>
            </div>

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
              <button
                onClick={requestPremium}
                disabled={submitting}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Solicitar Presupuesto Premium'}
              </button>
              <p className="text-xs text-gray-500 text-center">
                Sin compromiso. Un asesor te contactará en menos de 24 horas.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Calculator;
