import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  className = "",
  children,
}: PageHeaderProps) {
  return (
    <header
      className={`mb-6 flex flex-col gap-2 sm:gap-3 md:gap-4 ${className}`.trim()}
    >
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="text-muted-foreground text-base sm:text-lg md:text-xl">
          {description}
        </p>
      )}
      {children}
    </header>
  );
}
