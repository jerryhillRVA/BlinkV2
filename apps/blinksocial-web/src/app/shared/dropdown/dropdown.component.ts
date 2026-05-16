import { Component, ElementRef, HostBinding, HostListener, inject, input, output, signal, computed } from '@angular/core';
import { IconComponent } from '../icons/icon.component';
import type { IconName } from '../icons/icons';
import { PlatformIconComponent, type PlatformName } from '../platform-icon/platform-icon.component';

export interface DropdownOption {
  value: string;
  label: string;
  color?: string;
  iconPaths?: string[];
  iconColor?: string;
  platformIcon?: PlatformName;
  // Reference into the centralized icon registry. Preferred over
  // `iconPaths` for new callers — supports the full primitive set
  // (circle, polyline, line, rect, path) and stays in sync with Lucide.
  iconName?: IconName;
}

@Component({
  selector: 'app-dropdown',
  imports: [PlatformIconComponent, IconComponent],
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.scss',
})
export class DropdownComponent {
  private readonly elRef = inject(ElementRef);
  /* v8 ignore next 6 — V8's function-call-throws branches on input()/signal() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  options = input.required<DropdownOption[]>();
  value = input.required<string>();
  size = input<'default' | 'compact' | 'sm'>('default');
  fullWidth = input<boolean>(false);
  filled = input<boolean>(false);
  placeholder = input<string>('');
  valueChange = output<string>();
  /* v8 ignore next 1 — V8's function-call-throws branches on input()/signal() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  open = signal(false);

  @HostBinding('class.dropdown-host-full')
  get hostFull(): boolean {
    return this.fullWidth();
  }

  selectedOption = computed(() => this.options().find((o) => o.value === this.value()) ?? null);

  selectedLabel = computed(() => {
    const value = this.value();
    if (!value) return this.placeholder();
    return this.selectedOption()?.label ?? value;
  });

  selectedColor = computed(() => this.selectedOption()?.color ?? null);

  selectedIconPaths = computed(() => this.selectedOption()?.iconPaths ?? null);

  selectedIconColor = computed(() => this.selectedOption()?.iconColor ?? null);

  selectedPlatformIcon = computed(() => this.selectedOption()?.platformIcon ?? null);

  selectedIconName = computed(() => this.selectedOption()?.iconName ?? null);

  isPlaceholder = computed(() => !this.value());

  toggle(): void {
    this.open.set(!this.open());
  }

  select(value: string): void {
    this.valueChange.emit(value);
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.open.set(false);
    }
  }
}
