'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Sparkles } from 'lucide-react';

export default function FeatureTable() {
  const features = [
    { name: 'Beautiful Templates', competitors: true, us: true },
    { name: 'Custom Color Palettes', competitors: false, us: true },
    { name: 'Pixel-Perfect Export (SVG, PNG, PDF)', competitors: 'Paid Only', us: true },
    { name: 'HTML Embed Export', competitors: false, us: true },
    { name: 'Folder Management', competitors: false, us: true },
    { name: 'Bulk Export', competitors: 'Paid Only', us: true },
    { name: 'Full Customization', competitors: 'Limited', us: true },
    { name: 'Price', competitors: '$15-$30/mo', us: '100% Free (Beta)' },
  ];

  return (
    <section id="compare" className="py-24 bg-slate-50 relative overflow-hidden border-t border-slate-200">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-100 text-orange-600 text-sm font-semibold mb-6 border border-orange-200"
          >
            <Sparkles size={16} />
            <span>Why GraphCooker?</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-[38px] font-outfit font-bold text-slate-900 mb-4 leading-tight"
          >
            Everything you need, without the limits
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[16px] text-slate-600 max-w-2xl mx-auto"
          >
            During our beta period, you get unlimited access to all premium features completely free. No credit card required.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 sm:p-6 text-[10px] sm:text-[14px] font-bold text-slate-500 uppercase tracking-wider w-1/2">Feature</th>
                  <th className="p-3 sm:p-6 text-[10px] sm:text-[14px] font-bold text-slate-500 uppercase tracking-wider text-center border-l border-slate-200">Other Tools</th>
                  <th className="p-3 sm:p-6 text-[14px] sm:text-[16px] tracking-wider text-center border-l border-orange-200 bg-orange-50/50">
                    <span className="font-shantell font-normal text-slate-900">graph</span><span className="font-shantell font-normal text-orange-500">cooker</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {features.map((feature, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 sm:p-6 text-[12px] sm:text-[16px] text-slate-700 font-medium">{feature.name}</td>
                    <td className="p-3 sm:p-6 text-center border-l border-slate-200">
                      {typeof feature.competitors === 'boolean' ? (
                        feature.competitors ? (
                          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-[10px] sm:text-[14px] text-slate-500 font-medium">{feature.competitors}</span>
                      )}
                    </td>
                    <td className="p-3 sm:p-6 text-center border-l border-orange-200 bg-orange-50/30">
                      {typeof feature.us === 'boolean' ? (
                        feature.us ? (
                          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-[10px] sm:text-[14px] text-orange-600 font-bold bg-orange-100 px-2 py-1 sm:px-3 sm:py-1 rounded-lg">{feature.us}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
