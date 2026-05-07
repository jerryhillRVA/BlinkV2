import {
  Component,
  DestroyRef,
  EmbeddedViewRef,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  AfterViewInit,
  inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ContentCreateFormComponent } from '../content-create-form.component';
import type {
  AudienceSegment,
  ContentCreatePayload,
  ContentItemType,
  ContentPillar,
  IdeaPayload,
} from '../../../content.types';

@Component({
  selector: 'app-content-create-drawer',
  imports: [ContentCreateFormComponent],
  templateUrl: './content-create-drawer.component.html',
  styleUrl: './content-create-drawer.component.scss',
})
export class ContentCreateDrawerComponent implements AfterViewInit {
  private readonly doc = inject(DOCUMENT);
  private readonly vcr = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) pillars: ContentPillar[] = [];
  @Input({ required: true }) segments: AudienceSegment[] = [];
  @Input() initialType?: ContentItemType;

  @Output() saveContent = new EventEmitter<ContentCreatePayload>();
  @Output() saveMany = new EventEmitter<IdeaPayload[]>();
  @Output() moveToProduction = new EventEmitter<ContentCreatePayload>();
  @Output() draftAssets = new EventEmitter<ContentCreatePayload>();
  @Output() createConcept = new EventEmitter<IdeaPayload>();
  @Output() cancelCreate = new EventEmitter<void>();

  @ViewChild('drawerTpl', { static: true }) drawerTpl!: TemplateRef<unknown>;
  private drawerView!: EmbeddedViewRef<unknown>;
  private rootEl!: HTMLElement;
  private previouslyFocused!: HTMLElement;

  ngAfterViewInit(): void {
    this.previouslyFocused = this.doc.activeElement as HTMLElement;
    this.drawerView = this.vcr.createEmbeddedView(this.drawerTpl);
    this.drawerView.detectChanges();
    const body = this.doc.body;
    this.rootEl = this.drawerView.rootNodes[0] as HTMLElement;
    body.appendChild(this.rootEl);
    body.style.overflow = 'hidden';
    // Add the .open class on the next frame so the slide-up transition runs
    // from translateY(100%) → translateY(0).
    requestAnimationFrame(() => {
      this.rootEl.classList.add('open');
      this.rootEl
        .querySelector<HTMLElement>('input, textarea, select, button')
        ?.focus();
    });
    this.destroyRef.onDestroy(() => {
      this.drawerView.destroy();
      body.style.overflow = '';
      this.previouslyFocused.focus();
    });
  }

  protected onEscape(): void {
    this.cancelCreate.emit();
  }
}
