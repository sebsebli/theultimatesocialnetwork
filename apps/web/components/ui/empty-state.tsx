import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  headline: string;
  subtext?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  compact?: boolean;
  children?: React.ReactNode;
}

export function EmptyState({
  icon,
  headline,
  subtext,
  actionLabel,
  onAction,
  className,
  compact = false,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8",
        compact ? "py-12" : "py-24",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 text-tertiary">
          {/* If icon is a string (like a Material Icon name), we might need a mapping, 
              but for web we usually pass SVG nodes directly. 
              If it's passed as a node, render it. */}
          {typeof icon === "string" ? (
            <span className="material-icons text-4xl">{icon}</span>
          ) : (
            icon
          )}
        </div>
      )}
      <h3 className="text-lg font-semibold text-paper mb-2">{headline}</h3>
      {subtext && (
        <p className="text-secondary text-sm max-w-sm mb-6">{subtext}</p>
      )}
      {children}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="default">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
