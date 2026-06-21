import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useFormValidation } from '@/hooks/useValidation';
import { loginSchema } from '@/lib/validation';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { errors, validate, touchField, hasErrors } = useFormValidation(
    loginSchema,
    { email, password }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    touchField('email');
    touchField('password');
    
    const validationResult = validate({ email, password });

    if (!validationResult.success || hasErrors) {
      setError('Por favor corrige los errores en el formulario');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Inicio de sesión exitoso');
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
      toast.error('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al sitio
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <Lock className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Acceso Administrativo
            </h1>
            <p className="text-gray-600 text-sm">
              Ingresa tus credenciales para acceder al panel
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => touchField('email')}
                  placeholder="admin@construsmart.gt"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => touchField('password')}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Área restringida solo para personal autorizado
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;