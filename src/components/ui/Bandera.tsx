import type { ComponentType, SVGProps } from 'react';
import {
  AE, AR, BE, BR, BY, CA, CH, CL, CN, CO, CR, DE, DO, EC, ES, FR, GB, GF, GP, GR, GT, HK, HN, IL, IN, IT, JO, JP, KR,
  LB, LT, MA, MQ, MX, MY, NI, NL, NZ, PA, PE, PL, PR, PT, QA, RU, SA, SG, SV, TH, TR, TW, UA, US, VE, VN, ZA,
} from 'country-flag-icons/react/3x2';
import { codigoPais } from '@/lib/paises';
import { cn } from '@/lib/format';

// Solo se importan las banderas que aparecen en la data, para no cargar las 250
const FLAGS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  AE, AR, BE, BR, BY, CA, CH, CL, CN, CO, CR, DE, DO, EC, ES, FR, GB, GF, GP, GR, GT, HK, HN, IL, IN, IT, JO, JP, KR,
  LB, LT, MA, MQ, MX, MY, NI, NL, NZ, PA, PE, PL, PR, PT, QA, RU, SA, SG, SV, TH, TR, TW, UA, US, VE, VN, ZA,
} as Record<string, ComponentType<SVGProps<SVGSVGElement>>>;

/** Bandera del país (18×12). Si no la conocemos, muestra las dos primeras letras. */
export function Bandera({ pais, className }: { pais: string; className?: string }) {
  const code = codigoPais(pais);
  const Flag = code ? FLAGS[code] : undefined;
  if (Flag) {
    return (
      <Flag
        aria-hidden
        className={cn('h-3 w-[18px] shrink-0 rounded-[2.5px] shadow-[0_0_0_1px_rgba(0,0,0,0.08)]', className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn('grid h-3 w-[18px] shrink-0 place-items-center rounded-[2.5px] bg-line text-[7.5px] font-bold text-muted', className)}
    >
      {pais.slice(0, 2).toUpperCase()}
    </span>
  );
}