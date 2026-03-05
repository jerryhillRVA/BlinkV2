import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  template: `
    <nav class="navbar">
      <div class="navbar-brand">
        <span class="brand-text">BLINK SOCIAL</span>
      </div>
      <div class="navbar-end">
        <div class="avatar-placeholder">
          <span>KW</span>
        </div>
      </div>
    </nav>
  `,
  styles: `
    .navbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      height: 64px;
      background: linear-gradient(135deg, #e8533f 0%, #ff7b6b 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .brand-text {
      font-weight: 800;
      font-size: 18px;
      letter-spacing: 2px;
    }

    .avatar-placeholder {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
  `,
})
export class NavbarComponent {}
