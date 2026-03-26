import { Component, ElementRef, HostListener, inject, input, output, signal, computed } from '@angular/core';

export interface DropdownOption {
  value: string;
  label: string;
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
  size = input<'default' | 'compact'>('default');
  valueChange = output<string>();

  open = signal(false);

  selectedLabel = computed(() => {
    const match = this.options().find((o) => o.value === this.value());
    return match?.label ?? this.value();
  });

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
