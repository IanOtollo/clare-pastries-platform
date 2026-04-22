import { SVGProps } from "react";

export function WheatMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <path d="M16 3v26" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none">
        {[6, 10, 14, 18, 22].map((y) => (
          <g key={y}>
            <path d={`M16 ${y} C 13 ${y - 1.5}, 11 ${y + 1}, 10 ${y + 3}`} />
            <path d={`M16 ${y} C 19 ${y - 1.5}, 21 ${y + 1}, 22 ${y + 3}`} />
          </g>
        ))}
      </g>
    </svg>
  );
}
