"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Palette,
  Share2,
  Zap,
  FileOutput,
  LayoutTemplate,
} from "lucide-react";

const features = [
  {
    icon: <BarChart3 className="w-6 h-6 text-orange-500" />,
    title: "Beautiful Charts",
    description: "Bar, line, pie and more — pixel-perfect out of the box.",
  },
  {
    icon: <Palette className="w-6 h-6 text-orange-500" />,
    title: "Customizable Themes",
    description: "Create and save your own color palettes and styles.",
  },
  {
    icon: <Share2 className="w-6 h-6 text-orange-500" />,
    title: "Easy Sharing",
    description: "Share templates and visualizations with your team.",
  },
  {
    icon: <Zap className="w-6 h-6 text-orange-500" />,
    title: "Real-time Preview",
    description: "See changes instantly as you edit data and settings.",
  },
  {
    icon: <FileOutput className="w-6 h-6 text-orange-500" />,
    title: "Export Anywhere",
    description: "Download as PNG, SVG, PDF or embeddable HTML.",
  },
  {
    icon: <LayoutTemplate className="w-6 h-6 text-orange-500" />,
    title: "Template Library",
    description: "Start fast with pre-built templates and save your own.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export default function Features() {
  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-[38px] font-outfit font-bold text-slate-900 mb-4 leading-tight"
          >
            Everything you need to visualize data
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[16px] text-slate-600"
          >
            A full-featured toolkit for creating professional charts and
            dashboards.
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-slate-50/50 border border-slate-100 p-8 rounded-2xl hover:shadow-xl hover:shadow-orange-500/5 hover:border-orange-100 transition-all group"
            >
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-orange-100 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-outfit font-bold text-slate-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-[16px] text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
