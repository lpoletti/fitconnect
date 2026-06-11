import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-2xl bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60 bg-[length:200%_100%]',
        'animate-shimmer',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
