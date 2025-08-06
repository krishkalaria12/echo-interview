import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

interface EmptyStateProps {
  title: string;
  description: string;
  className?: string;
  image?: string;
}

export function EmptyState({ 
  title, 
  description, 
  className = '',
  image = "/empty.svg"
}: EmptyStateProps) {
  return (
    <Card className={`border-dashed ${className}`}>
      <Image src={image} alt={title} width={100} height={100} />
      <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {title}
        </h3>
        
        <p className="text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}