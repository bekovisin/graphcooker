'use client';

import { motion } from 'framer-motion';
import { Download, Folder, Table2, CheckCircle2, SlidersHorizontal, BarChart3, PieChart } from 'lucide-react';

export default function FeatureShowcase() {
  return (
    <section id="features" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-32">

        {/* Showcase 1: Customization & Export */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1 relative"
          >
            <div className="absolute inset-0 bg-orange-500/5 blur-3xl rounded-full" />
            <div className="relative bg-slate-50 border border-slate-200 rounded-xl shadow-xl overflow-hidden">
              <div className="h-10 border-b border-slate-200 bg-white flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                </div>
                <div className="text-xs font-medium text-slate-400 ml-4">Editor / Customization</div>
              </div>
              <div className="flex h-[400px]">
                {/* Editor Sidebar */}
                <div className="w-48 border-r border-slate-200 bg-white p-4 flex flex-col gap-6 overflow-y-auto">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Templates</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="aspect-square rounded border-2 border-orange-500 bg-orange-50" />
                      <div className="aspect-square rounded border border-slate-200 bg-slate-50" />
                      <div className="aspect-square rounded border border-slate-200 bg-slate-50" />
                      <div className="aspect-square rounded border border-slate-200 bg-slate-50" />
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Saved Palettes</div>
                    <div className="space-y-2">
                      <div className="flex h-6 rounded overflow-hidden cursor-pointer border border-slate-200">
                        <div className="flex-1 bg-orange-500" /><div className="flex-1 bg-orange-400" /><div className="flex-1 bg-orange-300" />
                      </div>
                      <div className="flex h-6 rounded overflow-hidden cursor-pointer border border-slate-200 opacity-50 hover:opacity-100">
                        <div className="flex-1 bg-blue-500" /><div className="flex-1 bg-cyan-400" /><div className="flex-1 bg-teal-300" />
                      </div>
                      <div className="flex h-6 rounded overflow-hidden cursor-pointer border border-slate-200 opacity-50 hover:opacity-100">
                        <div className="flex-1 bg-rose-500" /><div className="flex-1 bg-pink-400" /><div className="flex-1 bg-fuchsia-300" />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Editor Canvas */}
                <div className="flex-1 p-6 flex flex-col items-center justify-center relative bg-slate-50/50">
                  <div className="w-full max-w-xs bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="h-4 w-1/2 bg-slate-200 rounded mb-4" />
                    <div className="flex items-end gap-2 h-32">
                      <div className="w-full bg-orange-200 rounded-t h-[40%]" />
                      <div className="w-full bg-orange-500 rounded-t h-[80%]" />
                      <div className="w-full bg-orange-300 rounded-t h-[60%]" />
                      <div className="w-full bg-orange-400 rounded-t h-[90%]" />
                    </div>
                  </div>
                  {/* Export Menu Mockup */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="absolute bottom-6 right-6 bg-white border border-slate-200 rounded-lg shadow-lg p-2 w-40"
                  >
                    <div className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1">Pixel-Perfect Export</div>
                    <div className="text-xs text-slate-700 hover:bg-slate-50 px-2 py-1.5 rounded cursor-pointer flex justify-between"><span>SVG Vector</span><Download size={14}/></div>
                    <div className="text-xs text-slate-700 hover:bg-slate-50 px-2 py-1.5 rounded cursor-pointer flex justify-between"><span>PNG Image</span><Download size={14}/></div>
                    <div className="text-xs text-slate-700 hover:bg-slate-50 px-2 py-1.5 rounded cursor-pointer flex justify-between"><span>PDF Document</span><Download size={14}/></div>
                    <div className="text-xs text-slate-700 hover:bg-slate-50 px-2 py-1.5 rounded cursor-pointer flex justify-between"><span>HTML Embed</span><Download size={14}/></div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-100 text-orange-600 text-sm font-semibold mb-6 border border-orange-200">
              <SlidersHorizontal size={16} />
              <span>Full Control</span>
            </div>
            <h2 className="text-[38px] font-outfit font-bold text-slate-900 mb-6 leading-tight">
              The most flexible editor on the market
            </h2>
            <p className="text-[16px] text-slate-600 mb-8 leading-relaxed">
              Start with beautiful templates, apply your saved brand palettes, and tweak every single pixel. When you&apos;re done, export in any format you need without losing quality.
            </p>
            <ul className="space-y-4">
              {[
                'Hundreds of starting templates',
                'Save and reuse custom color palettes',
                'Fully customizable chart elements',
                'Pixel-perfect SVG, PNG, PDF, and HTML export'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700">
                  <CheckCircle2 className="text-orange-500 w-6 h-6 flex-shrink-0" />
                  <span className="text-[16px]">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Showcase 2: Data & Folders */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-100 text-orange-600 text-sm font-semibold mb-6 border border-orange-200">
              <Table2 size={16} />
              <span>Data Management</span>
            </div>
            <h2 className="text-[38px] font-outfit font-bold text-slate-900 mb-6 leading-tight">
              Powerful data screen, simple interface
            </h2>
            <p className="text-[16px] text-slate-600 mb-8 leading-relaxed">
              Manage complex datasets with a clean, spreadsheet-like interface. Organize your charts into folders and export multiple visualizations at once with our bulk export tool.
            </p>
            <ul className="space-y-4">
              {[
                'Clean, intuitive data entry grid',
                'Folder-based file management',
                'Bulk export multiple charts at once',
                'Real-time sync between data and visuals'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700">
                  <CheckCircle2 className="text-orange-500 w-6 h-6 flex-shrink-0" />
                  <span className="text-[16px]">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-orange-500/5 blur-3xl rounded-full" />
            <div className="relative bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col h-[500px] md:h-[400px]">
              <div className="h-12 border-b border-slate-200 bg-slate-50 flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="h-6 w-px bg-slate-200" />
                  <div className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Folder size={16} className="text-orange-500" /> Q3 Reports
                  </div>
                </div>
                <button className="text-xs font-medium bg-slate-900 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition-colors">
                  <Download size={14} /> Bulk Export
                </button>
              </div>
              <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* Folder Tree */}
                <div className="w-full md:w-48 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Workspace</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-200/50 px-2 py-1.5 rounded cursor-pointer">
                      <Folder size={14} className="text-orange-500" /> Q3 Reports
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 hover:bg-slate-200/50 px-2 py-1.5 rounded cursor-pointer ml-4">
                      <BarChart3 size={14} /> Revenue.gc
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 hover:bg-slate-200/50 px-2 py-1.5 rounded cursor-pointer ml-4">
                      <PieChart size={14} /> Market Share.gc
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 hover:bg-slate-200/50 px-2 py-1.5 rounded cursor-pointer mt-2">
                      <Folder size={14} className="text-slate-400" /> Marketing
                    </div>
                  </div>
                </div>
                {/* Data Grid */}
                <div className="flex-1 p-0 bg-white overflow-hidden flex flex-col">
                  <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500">
                    <div className="p-3 border-r border-slate-200">Region</div>
                    <div className="p-3 border-r border-slate-200">Jul</div>
                    <div className="p-3 border-r border-slate-200">Aug</div>
                    <div className="p-3">Sep</div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {[
                      ['North America', '$120k', '$135k', '$150k'],
                      ['Europe', '$80k', '$85k', '$90k'],
                      ['Asia Pacific', '$60k', '$75k', '$85k'],
                      ['Latin America', '$30k', '$35k', '$40k'],
                      ['Middle East', '$20k', '$22k', '$25k'],
                    ].map((row, i) => (
                      <div key={i} className="grid grid-cols-4 border-b border-slate-100 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                        <div className="p-3 border-r border-slate-100 font-medium">{row[0]}</div>
                        <div className="p-3 border-r border-slate-100">{row[1]}</div>
                        <div className="p-3 border-r border-slate-100">{row[2]}</div>
                        <div className="p-3">{row[3]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
