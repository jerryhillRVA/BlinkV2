import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;
  let snackBar: MatSnackBar;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ToastService,
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    });
    service = TestBed.inject(ToastService);
    snackBar = TestBed.inject(MatSnackBar);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('showError', () => {
    it('should call MatSnackBar.open with error panelClass', () => {
      service.showError('Validation failed');
      expect(snackBar.open).toHaveBeenCalledWith('Validation failed', 'Dismiss', {
        duration: 5000,
        panelClass: ['blink-toast', 'blink-toast-error'],
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
    });

    it('should use default message when none provided', () => {
      service.showError('');
      expect(snackBar.open).toHaveBeenCalledWith(
        'An unexpected error occurred.',
        'Dismiss',
        expect.objectContaining({ panelClass: ['blink-toast', 'blink-toast-error'] })
      );
    });
  });

  describe('showSuccess', () => {
    it('should call MatSnackBar.open with success panelClass', () => {
      service.showSuccess('Workspace created!');
      expect(snackBar.open).toHaveBeenCalledWith('Workspace created!', 'Dismiss', {
        duration: 3000,
        panelClass: ['blink-toast', 'blink-toast-success'],
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
    });
  });
});
