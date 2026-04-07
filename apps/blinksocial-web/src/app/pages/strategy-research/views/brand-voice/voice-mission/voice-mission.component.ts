import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AI_SIMULATION_DELAY_MS } from '../../../strategy-research.constants';
import { safeTimeout } from '../../../strategy-research.utils';

const MOCK_MISSION = 'Empower women over 40 to reclaim their strength, vitality, and confidence through evidence-backed fitness, nutrition, and community — because your best years are not behind you.';

@Component({
  selector: 'app-voice-mission',
  imports: [FormsModule],
  templateUrl: './voice-mission.component.html',
  styleUrl: './voice-mission.component.scss',
})
export class VoiceMissionComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly missionStatement = signal('');
  readonly isDrafting = signal(false);

  updateMission(value: string): void {
    this.missionStatement.set(value);
  }

  draftMission(): void {
    this.isDrafting.set(true);
    safeTimeout(() => {
      this.missionStatement.set(MOCK_MISSION);
      this.isDrafting.set(false);
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }
}
