import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { type Platform } from '../../strategy-research.types';

type PostRole = 'Hook' | 'Value' | 'Proof' | 'Pivot' | 'Conversion';

interface SeriesPost {
  number: number;
  title: string;
  role: PostRole;
  hook: string;
  captionDirection: string;
  cta: string;
}

interface SeriesOverview {
  title: string;
  narrativeArc: string;
  platform: Platform;
  postCount: number;
  goal: string;
  posts: SeriesPost[];
}

const GOAL_OPTIONS = [
  'Grow Followers',
  'Drive Sales',
  'Build Authority',
  'Increase Engagement',
  'Launch Product',
];

const PLATFORM_OPTIONS: { id: Platform; label: string }[] = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'facebook', label: 'Facebook' },
];

const MOCK_SERIES: SeriesOverview = {
  title: '5-Day Strength After 40 Challenge',
  narrativeArc: 'Takes the audience from awareness of the problem (losing strength in midlife) through education, social proof, and a mindset shift, ending with a clear conversion moment.',
  platform: 'instagram',
  postCount: 5,
  goal: 'Grow Followers',
  posts: [
    {
      number: 1,
      title: 'The Strength Myth',
      role: 'Hook',
      hook: 'You\'re not getting weaker because of your age. You\'re getting weaker because of what you\'ve been told about your age.',
      captionDirection: 'Challenge the myth that women lose strength inevitably after 40. Share a surprising statistic about muscle retention.',
      cta: 'Save this for Day 2 tomorrow',
    },
    {
      number: 2,
      title: '3 Moves That Change Everything',
      role: 'Value',
      hook: 'These 3 exercises took me from exhausted to energized in 2 weeks.',
      captionDirection: 'Teach 3 beginner-friendly strength exercises with clear form cues and modifications for joint issues.',
      cta: 'Try move #1 today and tell me how it felt',
    },
    {
      number: 3,
      title: 'Maria\'s Transformation',
      role: 'Proof',
      hook: 'At 52, Maria thought her body had given up on her. 90 days later, she proved everyone wrong.',
      captionDirection: 'Share a real community member transformation story with before/after mindset shift (not just physical).',
      cta: 'Drop a fire emoji if this inspires you',
    },
    {
      number: 4,
      title: 'What Nobody Tells You About Perimenopause & Exercise',
      role: 'Pivot',
      hook: 'Your workout isn\'t failing you. Your workout doesn\'t know you\'re in perimenopause.',
      captionDirection: 'Educate on how hormonal changes require exercise adaptation. Position your program as the solution.',
      cta: 'Share this with a friend who needs to hear it',
    },
    {
      number: 5,
      title: 'Your 7-Day Plan Is Ready',
      role: 'Conversion',
      hook: 'You\'ve seen the proof. You\'ve learned the moves. Now it\'s time to start.',
      captionDirection: 'Summarize the series journey, reinforce community belonging, and present the free 7-day plan as the natural next step.',
      cta: 'Click the link in bio to start your free 7-day plan',
    },
  ],
};

@Component({
  selector: 'app-series-builder',
  imports: [CommonModule, FormsModule],
  templateUrl: './series-builder.component.html',
  styleUrl: './series-builder.component.scss',
})
export class SeriesBuilderComponent {
  readonly isGenerating = signal(false);
  readonly series = signal<SeriesOverview | null>(null);

  selectedGoal = GOAL_OPTIONS[0];
  seriesLength = 5;
  selectedPlatform: Platform = 'instagram';

  readonly goalOptions = GOAL_OPTIONS;
  readonly platformOptions = PLATFORM_OPTIONS;
  readonly lengthOptions = [3, 5, 7];

  getRoleClass(role: PostRole): string {
    switch (role) {
      case 'Hook': return 'role--hook';
      case 'Value': return 'role--value';
      case 'Proof': return 'role--proof';
      case 'Pivot': return 'role--pivot';
      case 'Conversion': return 'role--conversion';
      default: return '';
    }
  }

  buildSeries(): void {
    this.isGenerating.set(true);
    this.series.set(null);
    setTimeout(() => {
      this.series.set({
        ...MOCK_SERIES,
        platform: this.selectedPlatform,
        postCount: this.seriesLength,
        goal: this.selectedGoal,
        posts: MOCK_SERIES.posts.slice(0, this.seriesLength),
      });
      this.isGenerating.set(false);
    }, 2500);
  }

  createInIdeation(_postNumber: number): void {
    // placeholder
  }
}
