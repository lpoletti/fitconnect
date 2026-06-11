'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border/50 group-[.toaster]:shadow-lg group-[.toaster]:backdrop-blur-xl group-[.toaster]:rounded-2xl',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-[#10B981] group-[.toast]:text-white group-[.toast]:rounded-lg group-[.toast]:hover:bg-[#34D399]',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg',
          success: 'group-[.toaster]:border-emerald-500/20',
          error: 'group-[.toaster]:border-red-500/20',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
