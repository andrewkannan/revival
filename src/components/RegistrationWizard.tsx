'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { checkCapacity, lockTicketsAction, finalizeRegistration, getPricing } from '@/actions/registration';

const OutreachLocationEnum = z.enum([
  'JOHOR_BAHRU', 'ISKANDAR_PUTERI', 'TAMAN_DAYA', 
  'PELANGI_INDAH', 'MELAKA', 'SIMPANG_RENGGAM', 'OTHERS'
]);

const step1Schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Phone number is required'),
  outreach: OutreachLocationEnum,
});

const step2Schema = z.object({
  adultTickets: z.number().min(0).max(10),
  kidsTickets: z.number().min(0).max(10),
}).refine(data => data.adultTickets + data.kidsTickets > 0, {
  message: "You must select at least one ticket",
  path: ["adultTickets"]
});

type FormData = z.infer<typeof step1Schema> & z.infer<typeof step2Schema>;

export default function RegistrationWizard() {
  const [step, setStep] = useState(1);
  const [sessionId, setSessionId] = useState('');
  const [isLocking, setIsLocking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pricing, setPricing] = useState({ adultPrice: 50, kidsPrice: 25, isEarlyBird: true });
  
  const { register, handleSubmit, formState: { errors }, watch, trigger, getValues } = useForm<FormData>({
    resolver: zodResolver(step === 1 ? step1Schema : step2Schema) as any,
    defaultValues: {
      name: '', email: '', phone: '', outreach: 'JOHOR_BAHRU',
      adultTickets: 0, kidsTickets: 0
    },
    mode: 'onChange'
  });

  const formData = watch();

  useEffect(() => {
    // Generate a simple session ID for the Redis lock
    setSessionId(Math.random().toString(36).substring(2, 15));
    // Fetch dynamic pricing from backend
    getPricing().then(p => setPricing(p));
  }, []);

  const totalAmount = (formData.adultTickets * pricing.adultPrice) + (formData.kidsTickets * pricing.kidsPrice);

  const nextStep = async () => {
    const isStepValid = await trigger();
    if (!isStepValid) return;

    if (step === 2) {
      // Trying to move to Step 3 (Lock & Summary)
      setIsLocking(true);
      setError(null);
      try {
        const res = await lockTicketsAction(sessionId, formData.adultTickets, formData.kidsTickets);
        if (res.success) {
          setStep(3);
        } else {
          setError(res.message || 'Failed to secure tickets. They may be sold out.');
        }
      } catch (err) {
        setError('A network error occurred.');
      } finally {
        setIsLocking(false);
      }
    } else {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
    setError(null);
  };

  const onSubmitFinal = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await finalizeRegistration(getValues(), sessionId);
      if (result.success) {
        setStep(4); // Success step
      } else {
        setError(result.message || 'Failed to complete registration.');
      }
    } catch (err) {
      setError('A network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm relative overflow-hidden min-h-[450px]">
      
      {/* Step Indicator */}
      {step < 4 && (
        <div className="flex space-x-2 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${step >= i ? 'bg-white' : 'bg-white/20'}`} />
          ))}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h3 className="text-2xl font-semibold mb-6">Your Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
              <input {...register('name')} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30" placeholder="John Doe" />
              {errors.name && <span className="text-red-400 text-xs mt-1 block">{errors.name.message}</span>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
              <input type="email" {...register('email')} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30" placeholder="john@example.com" />
              {errors.email && <span className="text-red-400 text-xs mt-1 block">{errors.email.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Phone Number</label>
              <input type="tel" {...register('phone')} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30" placeholder="+60 12-345 6789" />
              {errors.phone && <span className="text-red-400 text-xs mt-1 block">{errors.phone.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Outreach Location</label>
              <select {...register('outreach')} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30">
                <option value="JOHOR_BAHRU">Johor Bahru</option>
                <option value="ISKANDAR_PUTERI">Iskandar Puteri</option>
                <option value="TAMAN_DAYA">Taman Daya</option>
                <option value="PELANGI_INDAH">Pelangi Indah</option>
                <option value="MELAKA">Melaka</option>
                <option value="SIMPANG_RENGGAM">Simpang Renggam</option>
                <option value="OTHERS">Others</option>
              </select>
            </div>

            <button type="button" onClick={nextStep} className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-slate-200 transition-colors mt-6">
              Continue to Tickets
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h3 className="text-2xl font-semibold mb-2">Select Tickets</h3>
            {pricing.isEarlyBird && <p className="text-sm text-green-400 mb-6 font-medium">✨ Early Bird Pricing Active</p>}

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div>
                <h4 className="font-medium text-lg">Adult Ticket</h4>
                <p className="text-slate-400">RM {pricing.adultPrice.toFixed(2)}</p>
              </div>
              <div className="flex items-center space-x-3">
                <button type="button" onClick={() => { const val = getValues('adultTickets'); if(val > 0) register('adultTickets').onChange({target: {name: 'adultTickets', value: val - 1}}) }} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">-</button>
                <span className="w-4 text-center font-medium">{formData.adultTickets}</span>
                <button type="button" onClick={() => { const val = getValues('adultTickets'); if(val < 10) register('adultTickets').onChange({target: {name: 'adultTickets', value: val + 1}}) }} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">+</button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div>
                <h4 className="font-medium text-lg">Kids Ticket</h4>
                <p className="text-slate-400">RM {pricing.kidsPrice.toFixed(2)}</p>
              </div>
              <div className="flex items-center space-x-3">
                <button type="button" onClick={() => { const val = getValues('kidsTickets'); if(val > 0) register('kidsTickets').onChange({target: {name: 'kidsTickets', value: val - 1}}) }} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">-</button>
                <span className="w-4 text-center font-medium">{formData.kidsTickets}</span>
                <button type="button" onClick={() => { const val = getValues('kidsTickets'); if(val < 10) register('kidsTickets').onChange({target: {name: 'kidsTickets', value: val + 1}}) }} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">+</button>
              </div>
            </div>

            {errors.adultTickets && <span className="text-red-400 text-xs block">{errors.adultTickets.message}</span>}

            <div className="flex space-x-3 mt-8">
              <button type="button" onClick={prevStep} className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/10 transition-colors">
                Back
              </button>
              <button type="button" onClick={nextStep} disabled={isLocking} className="flex-1 bg-white text-black font-medium py-3 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-70 flex items-center justify-center">
                {isLocking ? 'Securing Tickets...' : 'Review & Lock Seats'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center space-x-2 text-green-400 mb-6 bg-green-400/10 p-3 rounded-lg border border-green-400/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <span className="text-sm font-medium">Your seats are locked for 10 minutes.</span>
            </div>

            <h3 className="text-2xl font-semibold mb-2">Order Summary</h3>
            
            <div className="space-y-3 bg-black/30 p-5 rounded-xl border border-white/5">
              <div className="flex justify-between text-slate-300">
                <span>{formData.name}</span>
                <span>{formData.email}</span>
              </div>
              <hr className="border-white/10" />
              {formData.adultTickets > 0 && (
                <div className="flex justify-between">
                  <span>{formData.adultTickets}x Adult Ticket</span>
                  <span>RM {(formData.adultTickets * pricing.adultPrice).toFixed(2)}</span>
                </div>
              )}
              {formData.kidsTickets > 0 && (
                <div className="flex justify-between">
                  <span>{formData.kidsTickets}x Kids Ticket</span>
                  <span>RM {(formData.kidsTickets * pricing.kidsPrice).toFixed(2)}</span>
                </div>
              )}
              <hr className="border-white/10" />
              <div className="flex justify-between font-bold text-xl pt-2">
                <span>Total</span>
                <span>RM {totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex space-x-3 mt-8">
              <button type="button" onClick={onSubmitFinal} disabled={isSubmitting} className="w-full bg-white text-black font-medium py-4 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-70 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                {isSubmitting ? 'Finalizing...' : 'Confirm Registration'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div 
            key="step4"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center py-10"
          >
            <div className="w-20 h-20 bg-green-500 rounded-full mx-auto flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-3xl font-bold mb-4">You're In!</h3>
            <p className="text-slate-400 mb-8 max-w-sm mx-auto">
              Your registration has been created. An email will be sent to you shortly with instructions on how to complete the payment via bank transfer.
            </p>
            <button type="button" onClick={() => window.location.reload()} className="bg-white/10 border border-white/20 text-white px-6 py-3 rounded-lg hover:bg-white/20 transition-colors">
              Register Another Person
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
