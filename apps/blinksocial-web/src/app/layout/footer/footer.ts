import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <p>&copy; 2026 Blink Social. All rights reserved.</p>
    </footer>
  `,
  styles: `
    .footer {
      text-align: center;
      padding: 24px;
      color: #888;
      font-size: 13px;
      border-top: 1px solid #e0e0e0;
      background: white;
    }

    p {
      margin: 0;
    }
  `,
})
export class FooterComponent {}
