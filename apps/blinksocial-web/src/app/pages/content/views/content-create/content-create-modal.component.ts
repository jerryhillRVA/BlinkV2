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
import { ContentCreateFormComponent } from './content-create-form.component';
import type {
  AudienceSegment,
  ContentCreatePayload,
  ContentItemType,
  ContentPillar,
  IdeaPayload,
} from '../../content.types';

@Component({
  selector: 'app-content-create-modal',
  imports: [ContentCreateFormComponent],
  templateUrl: './content-create-modal.component.html',
  styleUrl: './content-create-modal.component.scss',
})
export class ContentCreateModalComponent implements AfterViewInit {
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

  @ViewChild('modalTpl', { static: true }) modalTpl!: TemplateRef<unknown>;
  private modalView: EmbeddedViewRef<unknown> | null = null;

  ngAfterViewInit(): void {
    this.modalView = this.vcr.createEmbeddedView(this.modalTpl);
    this.modalView.detectChanges();
    const body = this.doc.body;
    for (const node of this.modalView.rootNodes as Node[]) {
      if (node.nodeType === 1) body.appendChild(node);
    }
    body.style.overflow = 'hidden';
    this.destroyRef.onDestroy(() => {
      if (this.modalView) {
        this.modalView.destroy();
        this.modalView = null;
      }
      if (this.doc.body) this.doc.body.style.overflow = '';
    });
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancelCreate.emit();
    }
  }

  protected onEscape(): void {
    this.cancelCreate.emit();
  }

  protected stopEvent(event: Event): void {
    event.stopPropagation();
  }
}
