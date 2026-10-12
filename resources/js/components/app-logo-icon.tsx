import type { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export default function AppLogoIcon({
    className,
    alt = '',
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <>
            <img
                {...props}
                src="/imgs/logos/orbium-black.png"
                alt={alt}
                draggable={false}
                className={cn('object-contain dark:hidden', className)}
            />
            <img
                {...props}
                src="/imgs/logos/orbium-white.png"
                alt={alt}
                draggable={false}
                className={cn('hidden object-contain dark:block', className)}
            />
        </>
    );
}
