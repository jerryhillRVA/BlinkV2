import { Component, ElementRef, HostBinding, HostListener, inject, input, output, signal, computed } from '@angular/core';

export interface DropdownOption {
  value: string;
  label: string;
  color?: string;
}

@Component({
  selector: 'app-dropdown',
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.scss',
})
export class DropdownComponent {
  private readonly elRef = inject(ElementRef);

  options = input.required<DropdownOption[]>();
  value = input.required<string>();
  size = input<'default' | 'compact' | 'sm'>('default');
  fullWidth = input<boolean>(false);
  filled = input<boolean>(false);
  placeholder = input<string>('');
  valueChange = output<string>();

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
