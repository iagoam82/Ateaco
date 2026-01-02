import type { SVGProps } from 'react';

export default function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg 
      fill="currentColor"
      viewBox="0 0 24 24" 
      {...props}
    >
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2.5 2.5-2.5H19V2H15c-4 0-5 2-5 5v2H7v4h3v8h4v-8Z" />
    </svg>
  );
}
