import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Mail, Lock, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AdminAuth = ({ onBack }) => {
  const { login } = useAuth();
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Validation / Message states
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let tempErrors = {};
    
    if (!email.trim()) {
      tempErrors.email = "Email or phone number is required";
    }

    if (!password) {
      tempErrors.password = "Password is required";
    } else if (password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMsg('');
    
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await login('admin', email.trim(), password);
      if (res.success) {
        setSuccessMsg("Administrator authenticated successfully! Redirecting...");
      } else {
        setServerError(res.error || "Invalid credentials.");
      }
    } catch (err) {
      setServerError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white/95 rounded-[2.5rem] border border-amber-100 shadow-2xl p-8 transition-all duration-300">
      {/* Header Navigation */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-extrabold text-slate-500 hover:text-amber-700 transition cursor-pointer mb-6"
      >
        <ArrowLeft size={14} />
        <span>Return to Portals</span>
      </button>

      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="mx-auto h-14 w-14 bg-slate-800 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-800/20">
          <ShieldAlert size={30} className="text-amber-500 animate-pulse" />
        </div>
        <h2 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">
          Admin Console
        </h2>
        <p className="text-xs text-slate-500 font-bold mt-1">
          Moderator authorization login
        </p>
      </div>

      {serverError && (
        <div className="mb-4 p-4 bg-red-50/90 border border-red-100 text-red-800 text-xs font-semibold rounded-2xl flex items-start gap-2 animate-in fade-in duration-200">
          <AlertCircle size={16} className="flex-shrink-0 text-red-600 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-4 bg-amber-50/90 border border-amber-100 text-amber-950 text-xs font-bold rounded-2xl flex items-start gap-2 animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="flex-shrink-0 text-amber-600 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
            Email Address or Phone
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="e.g. admin@kissan.com or 9999999999"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-semibold bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                errors.email ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-amber-200 focus:border-slate-800'
              }`}
            />
          </div>
          {errors.email && <p className="text-[10px] font-bold text-red-600 ml-1">{errors.email}</p>}
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
            <input
              type="password"
              placeholder="6+ characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-semibold bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                errors.password ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-amber-200 focus:border-slate-800'
              }`}
            />
          </div>
          {errors.password && <p className="text-[10px] font-bold text-red-600 ml-1">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-3 rounded-xl transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-slate-800/10 text-sm disabled:opacity-50 mt-2"
        >
          {loading ? 'Validating...' : 'Sign In Admin'}
        </button>
      </form>
    </div>
  );
};
