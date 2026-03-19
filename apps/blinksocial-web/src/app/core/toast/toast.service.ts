import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  showError(message: string): void {
    this.snackBar.open(message || 'An unexpected error occurred.', 'Dismiss', {
      duration: 5000,
      panelClass: ['blink-toast', 'blink-toast-error'],
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  showSuccess(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 3000,
      panelClass: ['blink-toast', 'blink-toast-success'],
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
