import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="24" cy="24" r="5" fill="currentColor" />
            <circle
                cx="24"
                cy="24"
                r="17"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            <circle cx="39" cy="16" r="3" fill="currentColor" />
        </svg>
    );
}
