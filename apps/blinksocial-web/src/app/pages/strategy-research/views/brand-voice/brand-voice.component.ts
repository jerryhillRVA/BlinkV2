import { Component } from '@angular/core';
import { VoiceMissionComponent } from './voice-mission/voice-mission.component';
import { VoiceAttributesComponent } from './voice-attributes/voice-attributes.component';
import { ToneContextComponent } from './tone-context/tone-context.component';
import { PlatformAdjustmentsComponent } from './platform-adjustments/platform-adjustments.component';
import { VocabularyGuideComponent } from './vocabulary-guide/vocabulary-guide.component';

@Component({
  selector: 'app-brand-voice',
  imports: [
    VoiceMissionComponent,
    VoiceAttributesComponent,
    ToneContextComponent,
    PlatformAdjustmentsComponent,
    VocabularyGuideComponent,
  ],
  templateUrl: './brand-voice.component.html',
  styleUrl: './brand-voice.component.scss',
})
export class BrandVoiceComponent {}
