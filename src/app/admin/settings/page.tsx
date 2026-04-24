'use client';

import { useState, useEffect } from 'react';
import { getAdminConfig, updateAdminConfig } from '@/actions/admin';
import { Save, Loader2, Info } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [formData, setFormData] = useState({
    totalCapacity: 400,
    isEarlyBird: true,
    adultPriceEarlyBird: 50,
    kidsPriceEarlyBird: 25,
    adultPriceRegular: 80,
    kidsPriceRegular: 40,
  });

  useEffect(() => {
    getAdminConfig().then((config) => {
      setFormData({
        totalCapacity: config.totalCapacity,
        isEarlyBird: config.isEarlyBird,
        adultPriceEarlyBird: Number(config.adultPriceEarlyBird),
        kidsPriceEarlyBird: Number(config.kidsPriceEarlyBird),
        adultPriceRegular: Number(config.adultPriceRegular),
        kidsPriceRegular: Number(config.kidsPriceRegular),
      });
      setLoading(false);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : Number(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    const result = await updateAdminConfig(formData);
    
    if (result.success) {
      setMessage({ text: 'Configuration saved successfully.', type: 'success' });
    } else {
      setMessage({ text: result.message || 'Failed to save.', type: 'error' });
    }
    setSaving(false);
    
    // Clear success message after 3 seconds
    if (result.success) {
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Conference Settings</h1>
        <p className="text-slate-400 mt-2">Manage capacity limits and ticket pricing.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          <Info className="w-5 h-5" />
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* General Settings */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6">General</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Total Capacity</label>
              <input
                type="number"
                name="totalCapacity"
                value={formData.totalCapacity}
                onChange={handleChange}
                min="0"
                className="w-full max-w-xs bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
              />
              <p className="text-xs text-slate-500 mt-2">Maximum number of total seats available for booking.</p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-white/5">
              <input
                type="checkbox"
                id="isEarlyBird"
                name="isEarlyBird"
                checked={formData.isEarlyBird}
                onChange={handleChange}
                className="w-5 h-5 rounded border-white/10 bg-black/50 text-white focus:ring-white/30 focus:ring-offset-black"
              />
              <label htmlFor="isEarlyBird" className="text-sm font-medium text-white cursor-pointer">
                Enable Early Bird Pricing
              </label>
            </div>
            <p className="text-xs text-slate-500 pl-8">If enabled, users will be charged the Early Bird rates below.</p>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6">Pricing Tiers (RM)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-medium text-slate-400 border-b border-white/5 pb-2">Early Bird</h3>
              
              <div>
                <label className="block text-sm text-slate-300 mb-1">Adult Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">RM</span>
                  <input
                    type="number"
                    name="adultPriceEarlyBird"
                    value={formData.adultPriceEarlyBird}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Kids Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">RM</span>
                  <input
                    type="number"
                    name="kidsPriceEarlyBird"
                    value={formData.kidsPriceEarlyBird}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-slate-400 border-b border-white/5 pb-2">Regular</h3>
              
              <div>
                <label className="block text-sm text-slate-300 mb-1">Adult Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">RM</span>
                  <input
                    type="number"
                    name="adultPriceRegular"
                    value={formData.adultPriceRegular}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Kids Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">RM</span>
                  <input
                    type="number"
                    name="kidsPriceRegular"
                    value={formData.kidsPriceRegular}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-white text-black font-medium px-8 py-3 rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Changes
        </button>
      </form>
    </div>
  );
}
