'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { checkCapacity, lockTicketsAction, releaseLockAction, finalizeRegistration, getPricing, uploadReceipt } from '@/actions/registration';

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
  adultTickets: z.number().min(1, "You must select at least one ticket").max(10),
  kidsTickets: z.number().min(0).max(10),
});

type FormData = z.infer<typeof step1Schema> & z.infer<typeof step2Schema>;

export default function RegistrationWizard() {
  const [step, setStep] = useState(1);
  const [sessionId, setSessionId] = useState('');
  const [isLocking, setIsLocking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [pricing, setPricing] = useState({ adultPrice: 50, adultPriceOriginal: 70, kidsPrice: 25, kidsPriceOriginal: 35, isEarlyBird: true });
  
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

  const cancelLock = async () => {
    setIsLocking(true);
    await releaseLockAction(sessionId);
    setStep(2);
    setIsLocking(false);
  };

  const onSubmitFinal = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await finalizeRegistration(getValues(), sessionId);
      if (result.success && result.registrationId) {
        setRegistrationId(result.registrationId);
        setStep(4); // Payment Upload step
      } else {
        setError(result.message || 'Failed to complete registration.');
      }
    } catch (err) {
      setError('A network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.7 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const onUploadReceipt = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!registrationId) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const form = e.currentTarget;
      const fileInput = form.elements.namedItem('receipt') as HTMLInputElement;
      const file = fileInput.files?.[0];
      
      if (!file) {
        setError("Please select a file.");
        setIsSubmitting(false);
        return;
      }

      // Compress image to Base64 to ensure instant upload
      const compressedBase64 = await compressImage(file);
      
      const formData = new FormData();
      formData.append('receiptBase64', compressedBase64);

      const res = await uploadReceipt(registrationId, formData);
      if (res.success) {
        setStep(5); // Success step
      } else {
        setError(res.message || 'Failed to upload receipt.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while uploading. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm relative overflow-hidden min-h-[450px]">
      
      {/* Step Indicator */}
      {step < 5 && (
        <div className="flex space-x-2 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${step >= i ? 'bg-poster-accent' : 'bg-white/10'}`} />
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
                <div className="flex flex-col items-start gap-0.5 mt-1">
                  <p className={pricing.isEarlyBird ? "text-emerald-400 text-xl font-bold" : "text-slate-400 text-lg"}>
                    RM {pricing.adultPrice.toFixed(2)}
                  </p>
                  {pricing.isEarlyBird && pricing.adultPriceOriginal && (
                    <div className="relative inline-block text-slate-500 font-medium text-sm">
                      RM {pricing.adultPriceOriginal.toFixed(2)}
                      <div className="absolute left-[-10%] top-1/2 w-[120%] h-[1.5px] bg-red-500/80 -translate-y-1/2 -rotate-12"></div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button type="button" onClick={() => { const val = getValues('adultTickets'); if(val > 0) register('adultTickets').onChange({target: {name: 'adultTickets', value: val - 1}}) }} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">-</button>
                <span className="w-4 text-center font-medium">{formData.adultTickets}</span>
                <button type="button" onClick={() => { const val = getValues('adultTickets'); if(val < 10) register('adultTickets').onChange({target: {name: 'adultTickets', value: val + 1}}) }} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">+</button>
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
              <div className="space-y-1">
                <div className="font-medium text-white text-lg">{formData.name}</div>
                <div className="text-slate-400 text-sm">{formData.email}</div>
              </div>
              <hr className="border-white/10" />
              {formData.adultTickets > 0 && (
                <div className="flex justify-between">
                  <span>{formData.adultTickets}x Adult Ticket</span>
                  <span>RM {(formData.adultTickets * pricing.adultPrice).toFixed(2)}</span>
                </div>
              )}
              <hr className="border-white/10" />
              <div className="flex justify-between font-bold text-xl pt-2">
                <span>Total</span>
                <span>RM {totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex space-x-3 mt-8">
              <button type="button" onClick={cancelLock} disabled={isSubmitting} className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/10 transition-colors">
                Back
              </button>
              <button type="button" onClick={onSubmitFinal} disabled={isSubmitting} className="flex-1 bg-poster-accent text-poster-bg font-medium py-4 rounded-xl hover:bg-poster-accent-bright transition-colors disabled:opacity-70 shadow-[0_0_20px_rgba(140,174,176,0.2)]">
                {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div 
            key="step4"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h3 className="text-2xl font-semibold mb-2">Payment Details</h3>
            <p className="text-slate-300 text-sm mb-4">Please transfer the total amount of <strong className="text-white text-lg font-mono">RM {totalAmount.toFixed(2)}</strong> to the bank account below and upload your receipt.</p>
            
            <div className="bg-black/40 p-4 rounded-xl border border-white/10 mb-6 font-mono text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Bank Name</span>
                <span className="font-medium">Maybank</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account Name</span>
                <span className="font-medium">CALVARY COMMUNITY TT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account Number</span>
                <span className="font-medium tracking-widest text-poster-accent-bright">551016737305</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Reference</span>
                <span className="font-medium tracking-widest text-poster-accent-bright">BIL CONF</span>
              </div>
            </div>

            <form onSubmit={onUploadReceipt} className="space-y-6">
              <div className="bg-poster-accent/10 border border-poster-accent/20 rounded-lg p-4 text-sm text-slate-300 text-center">
                Provide a screenshot or PDF receipt showing amount, date, and reference for payment verification.
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Upload Payment Receipt</label>
                <input 
                  type="file" 
                  name="receipt" 
                  accept="image/*" 
                  required
                  className="w-full text-sm text-slate-300 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-poster-accent file:text-poster-bg hover:file:bg-poster-accent-bright border border-white/10 rounded-lg bg-black/30"
                />
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full bg-poster-accent text-poster-bg font-medium py-4 rounded-xl hover:bg-poster-accent-bright transition-colors disabled:opacity-70 shadow-[0_0_20px_rgba(140,174,176,0.2)]">
                {isSubmitting ? 'Uploading...' : 'Submit Proof'}
              </button>
            </form>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div 
            key="step5"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center py-10"
          >
            <div className="w-20 h-20 bg-poster-accent rounded-full mx-auto flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(140,174,176,0.4)]">
              <svg className="w-10 h-10 text-poster-bg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-3xl font-bold mb-4">You're In!</h3>
            <p className="text-slate-300 mb-8 max-w-sm mx-auto">
              Your registration and payment receipt have been submitted. Our team will review the transaction and send your ticket confirmation to your email shortly.
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
