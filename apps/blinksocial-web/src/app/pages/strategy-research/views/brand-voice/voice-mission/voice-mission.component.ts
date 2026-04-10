import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AI_SIMULATION_DELAY_MS } from '../../../strategy-research.constants';
import { safeTimeout } from '../../../strategy-research.utils';
import { ToastService } from '../../../../../core/toast/toast.service';
import { StrategyResearchStateService } from '../../../strategy-research-state.service';

const MOCK_MISSION = 'Empower women over 40 to reclaim their strength, vitality, and confidence through evidence-backed fitness, nutrition, and community — because your best years are not behind you.';

@Component({
  selector: 'app-voice-mission',
  imports: [FormsModule],
  templateUrl: './voice-mission.component.html',
  styleUrl: './voice-mission.component.scss',
})
export class VoiceMissionComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);
  private readonly stateService = inject(StrategyResearchStateService);

  readonly missionStatement = computed(() => this.stateService.brandVoice().missionStatement);
  readonly isDrafting = signal(false);

  updateMission(value: string): void {
    this.stateService.brandVoice.update(bv => ({ ...bv, missionStatement: value }));
  }

  saveMission(): void {
    if (!this.missionStatement().trim()) return;
    this.stateService.saveBrandVoice(this.stateService.brandVoice());
    this.toast.showSuccess('Mission statement saved');
  }

  draftMission(): void {
    this.isDrafting.set(true);
    safeTimeout(() => {
      this.stateService.brandVoice.update(bv => ({ ...bv, missionStatement: MOCK_MISSION }));
      this.isDrafting.set(false);
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }
}
