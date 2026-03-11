'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { DashboardSidebar, DashboardSidebarProps } from './DashboardSidebar';

export function MobileSidebar(props: DashboardSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden p-2">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72 [&>button]:hidden">
        <DashboardSidebar
          {...props}
          onFolderSelect={(id) => {
            props.onFolderSelect(id);
            setOpen(false);
          }}
          onTrashSelect={props.onTrashSelect ? () => {
            props.onTrashSelect?.();
            setOpen(false);
          } : undefined}
          onTemplatesSelect={props.onTemplatesSelect ? () => {
            props.onTemplatesSelect?.();
            setOpen(false);
          } : undefined}
        />
      </SheetContent>
    </Sheet>
  );
}
