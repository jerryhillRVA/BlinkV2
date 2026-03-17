import { Component, EventEmitter, Output, inject } from '@angular/core';
import { ThemeService } from '../../core/theme/theme.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  @Output() logout = new EventEmitter<void>();

  protected readonly themeService = inject(ThemeService);
}
