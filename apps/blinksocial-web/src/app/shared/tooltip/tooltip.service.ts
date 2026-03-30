import { Injectable } from '@angular/core';

const GAP = 8;
const EDGE_PADDING = 8;

@Injectable({ providedIn: 'root' })
export class TooltipService {
  private el: HTMLDivElement | null = null;

  show(trigger: HTMLElement, text: string): void {
    const popup = this.getOrCreateElement();
    popup.textContent = text;

    // Make visible but off-screen so we can measure it
    popup.style.visibility = 'hidden';
    popup.style.display = 'block';
    popup.style.top = '0px';
    popup.style.left = '0px';

    // Let browser lay it out, then measure and position
    requestAnimationFrame(() => {
      const tr = trigger.getBoundingClientRect();
      const pr = popup.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Vertical: prefer above, fallback below
      let top: number;
      if (tr.top >= pr.height + GAP) {
        top = tr.top - pr.height - GAP;
      } else if (vh - tr.bottom >= pr.height + GAP) {
        top = tr.bottom + GAP;
      } else {
        top = tr.top >= vh - tr.bottom
          ? Math.max(EDGE_PADDING, tr.top - pr.height - GAP)
          : tr.bottom + GAP;
      }

      // Horizontal: center on trigger, clamp to viewport
      let left = tr.left + tr.width / 2 - pr.width / 2;
      left = Math.max(EDGE_PADDING, Math.min(left, vw - pr.width - EDGE_PADDING));

      popup.style.top = `${top}px`;
      popup.style.left = `${left}px`;
      popup.style.visibility = 'visible';
    });
  }

  hide(): void {
    if (this.el) {
      this.el.style.display = 'none';
      this.el.style.visibility = 'hidden';
    }
  }

  private getOrCreateElement(): HTMLDivElement {
    if (!this.el) {
      this.el = document.createElement('div');
      this.el.className = 'blink-tooltip-popup';
      this.el.style.display = 'none';
      document.body.appendChild(this.el);
    }
    return this.el;
  }
}
