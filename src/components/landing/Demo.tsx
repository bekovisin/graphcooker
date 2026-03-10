"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout, Type, Palette, MousePointer2, Database, Download, BarChart3, PieChart, LineChart } from "lucide-react";

export default function Demo() {
  const [activeTab, setActiveTab] = useState("Chart Type");
  const [activeChart, setActiveChart] = useState("Bar");
  const [activePalette, setActivePalette] = useState(0);
  const [chartLabels, setChartLabels] = useState({ title: "Monthly Revenue", subtitle: "Q1-Q2 2026", xAxis: "Months", yAxis: "Revenue ($)" });

  const tabs = [
    { id: "Chart Type", icon: Layout },
    { id: "Data", icon: Database },
    { id: "Graph", icon: BarChart3 },
    { id: "Colors", icon: Palette },
    { id: "Labels", icon: Type },
    { id: "Export", icon: Download },
  ];

  const palettes = [
    { id: 0, colors: ["#f97316", "#fdba74"], bg: "bg-orange-500", bg2: "bg-orange-400", bg3: "bg-orange-300", border: "border-orange-500", highlight: "bg-orange-50" },
    { id: 1, colors: ["#3b82f6", "#60a5fa"], bg: "bg-blue-500", bg2: "bg-cyan-400", bg3: "bg-teal-300", border: "border-blue-500", highlight: "bg-blue-50" },
    { id: 2, colors: ["#f43f5e", "#fb7185"], bg: "bg-rose-500", bg2: "bg-pink-400", bg3: "bg-fuchsia-300", border: "border-rose-500", highlight: "bg-rose-50" }
  ];

  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-[38px] font-outfit font-bold text-slate-900 mb-4 leading-tight"
          >
            From data to dashboard in minutes
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[16px] text-slate-600"
          >
            Paste your data, pick a chart type, customize the look — done.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative max-w-4xl mx-auto rounded-xl border border-slate-200/60 bg-white shadow-2xl shadow-slate-200/50 overflow-hidden"
        >
          {/* Browser Chrome */}
          <div className="h-12 border-b border-slate-100 bg-slate-50/80 flex items-center px-4 gap-4">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-white border border-slate-200 rounded-md px-3 py-1 text-xs text-slate-500 font-medium w-48 sm:w-64 text-center flex items-center justify-center gap-2 truncate">
                <span className="w-3 h-3 rounded-sm bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-sm bg-orange-500" />
                </span>
                <span className="truncate">graphcooker.com</span>
              </div>
            </div>
          </div>

          {/* App UI */}
          <div className="flex flex-col md:flex-row h-auto md:h-[500px]">
            {/* Sidebar */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/30 p-4 flex flex-col gap-2 md:gap-6 overflow-x-auto hide-scrollbar">
              <div>
                <h4 className="hidden md:block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Settings
                </h4>
                <div className="flex flex-row md:flex-col gap-2 md:space-y-1 min-w-max md:min-w-0">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <motion.button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        whileHover={{ x: 4 }}
                        className={`flex-shrink-0 md:w-full text-left px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors flex items-center gap-2 md:gap-3
                          ${isActive ? "bg-orange-50 text-orange-600" : "text-slate-600 hover:bg-slate-100"}
                        `}
                      >
                        <Icon size={16} />
                        {tab.id}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Main Canvas */}
            <div className="flex-1 bg-white p-4 sm:p-8 relative flex items-center justify-center overflow-hidden min-h-[400px] md:min-h-0">
              {/* Animated Cursor (Only show on Colors tab to simulate editing) */}
              {activeTab === "Colors" && (
                <motion.div
                  animate={{
                    x: [0, 150, 150, 0],
                    y: [0, 50, -50, 0],
                    scale: [1, 0.9, 1, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute top-1/4 left-1/4 z-50 text-slate-800 drop-shadow-md pointer-events-none"
                >
                  <MousePointer2 className="w-6 h-6 fill-slate-800" />
                </motion.div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="w-full max-w-2xl bg-white rounded-xl border border-slate-100 shadow-sm p-8"
                >
                  {activeTab === "Chart Type" && (
                    <div className="h-64 flex flex-col items-center justify-center gap-6">
                      <h3 className="font-outfit font-bold text-xl text-slate-900">Select Chart Type</h3>
                      <div className="flex gap-4">
                        <div onClick={() => setActiveChart("Bar")} className={`w-24 h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${activeChart === "Bar" ? "border-orange-500 bg-orange-50 text-orange-600" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}>
                          <BarChart3 size={32} />
                          <span className="text-xs font-bold">Bar</span>
                        </div>
                        <div onClick={() => setActiveChart("Pie")} className={`w-24 h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${activeChart === "Pie" ? "border-orange-500 bg-orange-50 text-orange-600" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}>
                          <PieChart size={32} />
                          <span className="text-xs font-bold">Pie</span>
                        </div>
                        <div onClick={() => setActiveChart("Line")} className={`w-24 h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${activeChart === "Line" ? "border-orange-500 bg-orange-50 text-orange-600" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}>
                          <LineChart size={32} />
                          <span className="text-xs font-bold">Line</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "Data" && (
                    <div className="h-64 flex flex-col">
                      <h3 className="font-outfit font-bold text-xl text-slate-900 mb-4">Data Grid</h3>
                      <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden">
                        <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500">
                          <div className="p-2 border-r border-slate-200">Month</div>
                          <div className="p-2 border-r border-slate-200">Revenue</div>
                          <div className="p-2">Target</div>
                        </div>
                        {[
                          ['Jan', '$40,000', '$45,000'],
                          ['Feb', '$70,000', '$65,000'],
                          ['Mar', '$45,000', '$50,000'],
                          ['Apr', '$90,000', '$85,000'],
                        ].map((row, i) => (
                          <div key={i} className="grid grid-cols-3 border-b border-slate-100 text-sm text-slate-700">
                            <div className="p-2 border-r border-slate-100">{row[0]}</div>
                            <div className="p-2 border-r border-slate-100">{row[1]}</div>
                            <div className="p-2">{row[2]}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "Graph" && (
                    <div>
                      <div className="mb-8">
                        <h3 className="font-outfit font-bold text-xl text-slate-900">
                          {chartLabels.title}
                        </h3>
                        <p className="text-sm text-slate-500">{chartLabels.subtitle}</p>
                      </div>

                      <div className="flex items-end gap-4 h-64">
                        {[40, 70, 45, 90, 60, 85, 50, 75].map((height, i) => (
                          <div key={i} className="w-full h-full flex items-end group relative cursor-pointer">
                            {/* Tooltip */}
                            <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                              ${height},000
                            </div>
                            <motion.div
                              initial={{ height: "20%" }}
                              animate={{ height: `${height}%` }}
                              transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                              className={`w-full rounded-t-md ${i % 2 === 0 ? "bg-orange-400" : "bg-orange-500"} group-hover:brightness-110 transition-all`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "Colors" && (
                    <div className="h-64 flex flex-col items-center justify-center gap-8">
                      <h3 className="font-outfit font-bold text-xl text-slate-900 self-start">Color Palettes</h3>
                      <div className="flex items-center gap-12 w-full justify-center">
                        <div className="flex gap-4">
                          {palettes.map((palette) => (
                            <div
                              key={palette.id}
                              onClick={() => setActivePalette(palette.id)}
                              className={`flex flex-col gap-1 cursor-pointer p-2 rounded-lg border-2 transition-colors ${
                                activePalette === palette.id
                                  ? `${palette.border} ${palette.highlight}`
                                  : "border-transparent hover:border-slate-200"
                              }`}
                            >
                              <div className={`w-6 h-6 rounded-full ${palette.bg}`}></div>
                              <div className={`w-6 h-6 rounded-full ${palette.bg2}`}></div>
                              <div className={`w-6 h-6 rounded-full ${palette.bg3}`}></div>
                            </div>
                          ))}
                        </div>
                        <div className="relative w-32 h-32">
                          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            <motion.circle
                              initial={{ strokeDasharray: "0 100" }}
                              animate={{ strokeDasharray: "75 100", stroke: palettes[activePalette].colors[0] }}
                              transition={{ duration: 1 }}
                              cx="50" cy="50" r="40" fill="transparent" strokeWidth="20"
                            />
                            <motion.circle
                              initial={{ strokeDasharray: "0 100" }}
                              animate={{ strokeDasharray: "25 100", stroke: palettes[activePalette].colors[1] }}
                              transition={{ duration: 1 }}
                              cx="50" cy="50" r="40" fill="transparent" strokeWidth="20" strokeDashoffset="-75"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "Labels" && (
                    <div className="h-64 flex flex-col gap-4">
                      <h3 className="font-outfit font-bold text-xl text-slate-900 mb-2">Chart Labels</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Chart Title</label>
                          <input type="text" value={chartLabels.title} onChange={(e) => setChartLabels({...chartLabels, title: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Subtitle</label>
                          <input type="text" value={chartLabels.subtitle} onChange={(e) => setChartLabels({...chartLabels, subtitle: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">X-Axis Label</label>
                            <input type="text" value={chartLabels.xAxis} onChange={(e) => setChartLabels({...chartLabels, xAxis: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Y-Axis Label</label>
                            <input type="text" value={chartLabels.yAxis} onChange={(e) => setChartLabels({...chartLabels, yAxis: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "Export" && (
                    <div className="h-64 flex flex-col items-center justify-center gap-6">
                      <h3 className="font-outfit font-bold text-xl text-slate-900">Export Chart</h3>
                      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                        <button className="flex items-center justify-center gap-2 py-3 rounded-lg border border-slate-200 hover:border-orange-500 hover:text-orange-600 font-medium text-slate-700 transition-colors">
                          <Download size={18} /> PNG Image
                        </button>
                        <button className="flex items-center justify-center gap-2 py-3 rounded-lg border border-slate-200 hover:border-orange-500 hover:text-orange-600 font-medium text-slate-700 transition-colors">
                          <Download size={18} /> SVG Vector
                        </button>
                        <button className="flex items-center justify-center gap-2 py-3 rounded-lg border border-slate-200 hover:border-orange-500 hover:text-orange-600 font-medium text-slate-700 transition-colors">
                          <Download size={18} /> PDF Document
                        </button>
                        <button className="flex items-center justify-center gap-2 py-3 rounded-lg border border-slate-200 hover:border-orange-500 hover:text-orange-600 font-medium text-slate-700 transition-colors">
                          <Download size={18} /> HTML Embed
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
