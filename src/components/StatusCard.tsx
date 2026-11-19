import type { ReactNode } from 'react';
import Image from 'next/image';
import { Card, CardContent } from './ui/card';

type StatusCardProps = {
  title?: string;
  message: string;
  icon?: string;
  /** Illustration shown instead of the icon. */
  image?: string;
  actions?: ReactNode;
  className?: string;
};

export default function StatusCard({ title, message, icon, image, actions, className = '' }: StatusCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6 text-center space-y-4">
        {image ? (
          <div className="relative mx-auto h-40 w-40">
            <Image src={image} alt="" fill sizes="160px" className="object-contain" />
          </div>
        ) : icon ? <div className="text-5xl" aria-hidden="true">{icon}</div> : null}
        {title ? <h2 className="text-xl font-semibold text-black">{title}</h2> : null}
        <p className="text-neutral-700" aria-live="polite">{message}</p>
        {actions ? <div className="flex gap-3 justify-center flex-wrap">{actions}</div> : null}
      </CardContent>
    </Card>
  );
}
