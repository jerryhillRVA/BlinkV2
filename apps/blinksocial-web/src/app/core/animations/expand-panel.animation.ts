import { trigger, transition, style, animate } from '@angular/animations';

export const expandPanel = trigger('expandPanel', [
  transition(':enter', [
    style({ height: '0', opacity: 0 }),
    animate('200ms ease-out', style({ height: '*', opacity: 1 })),
  ]),
  transition(':leave', [
    animate('150ms ease-in', style({ height: '0', opacity: 0 })),
  ]),
]);
