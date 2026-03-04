import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-md bg-[linear-gradient(110deg,hsl(var(--muted))_8%,hsl(var(--primary))_18%,hsl(var(--muted))_33%)] bg-[length:200%_100%] opacity-20",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
