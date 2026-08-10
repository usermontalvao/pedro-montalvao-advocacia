/**
 * Ícones em SVG inline. Nenhuma biblioteca: são poucos, e assim eles entram no
 * HTML pré-renderizado e aparecem junto com o texto, sem esperar JavaScript.
 */
type Props = { tamanho?: number; className?: string };

const base = (tamanho: number) => ({
  width: tamanho,
  height: tamanho,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export function IconeWhatsApp({ tamanho = 20, className }: Props) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.08-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.78 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23a8.23 8.23 0 0 1 8.23 8.24c0 4.54-3.7 8.23-8.23 8.23z" />
    </svg>
  );
}

export function IconeSeta({ tamanho = 16, className }: Props) {
  return (
    <svg {...base(tamanho)} className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconeMais({ tamanho = 15, className }: Props) {
  return (
    <svg {...base(tamanho)} className={className} strokeWidth={1.8}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconeBalanca({ tamanho = 24, className }: Props) {
  return (
    <svg {...base(tamanho)} className={className}>
      <path d="M12 3v18M8 21h8M3 7l9-2 9 2" />
      <path d="M6.5 7 3.5 14a3 3 0 0 0 6 0L6.5 7zM17.5 7l-3 7a3 3 0 0 0 6 0l-3-7z" />
    </svg>
  );
}

export function IconeEscudo({ tamanho = 24, className }: Props) {
  return (
    <svg {...base(tamanho)} className={className}>
      <path d="M12 3l7.5 3v5.5c0 4.4-3.1 8.3-7.5 9.5-4.4-1.2-7.5-5.1-7.5-9.5V6L12 3z" />
      <path d="m9.2 12 2 2 3.6-3.7" />
    </svg>
  );
}

export function IconeRelogio({ tamanho = 24, className }: Props) {
  return (
    <svg {...base(tamanho)} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  );
}

export function IconeFamilia({ tamanho = 24, className }: Props) {
  return (
    <svg {...base(tamanho)} className={className}>
      <circle cx="8" cy="8" r="3" />
      <circle cx="17" cy="9.5" r="2.4" />
      <path d="M2.5 20c0-3 2.5-5.2 5.5-5.2s5.5 2.2 5.5 5.2M15 20c0-2.2 1-4 3.5-4s3 1.6 3 3.4" />
    </svg>
  );
}

export function IconeDocumento({ tamanho = 24, className }: Props) {
  return (
    <svg {...base(tamanho)} className={className}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}

export function IconeEmail({ tamanho = 20, className }: Props) {
  return (
    <svg {...base(tamanho)} className={className}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export function IconeMapa({ tamanho = 20, className }: Props) {
  return (
    <svg {...base(tamanho)} className={className}>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

export function IconeAgenda({ tamanho = 20, className }: Props) {
  return (
    <svg {...base(tamanho)} className={className}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}

export const ICONES_AREA = {
  balanca: IconeBalanca,
  escudo: IconeEscudo,
  relogio: IconeRelogio,
  familia: IconeFamilia,
  documento: IconeDocumento,
} as const;

export type NomeIcone = keyof typeof ICONES_AREA;
