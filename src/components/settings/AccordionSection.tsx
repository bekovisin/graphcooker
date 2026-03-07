'use client';

import { ReactNode } from 'react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface AccordionSectionProps {
  id: string;
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  searchQuery?: string;
}

export function AccordionSection({
  id,
  title,
  children,
}: AccordionSectionProps) {
  return (
    <AccordionItem value={id} className="border-b border-gray-300/60 border-t-0">
      <AccordionTrigger className="px-5 py-2.5 text-[13px] font-bold text-gray-900 hover:bg-gray-50 hover:no-underline [&[data-state=open]]:bg-blue-50/80 [&[data-state=open]]:text-blue-900">
        {title}
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-3 bg-gray-50/50">
        <div className="space-y-2 pt-2">{children}</div>
      </AccordionContent>
    </AccordionItem>
  );
}
