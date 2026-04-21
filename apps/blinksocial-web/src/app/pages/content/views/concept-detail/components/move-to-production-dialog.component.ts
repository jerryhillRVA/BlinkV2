import {
  AfterViewInit,
  Component,
  DestroyRef,
  EmbeddedViewRef,
  EventEmitter,
  Output,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  inject,
  input,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  PLATFORM_CONTENT_TYPES,
  PLATFORM_OPTIONS,
} from '../../../content.constants';
import type { ProductionTarget } from '../concept-detail.types';

@Component({
  selector: 'app-move-to-production-dialog',
  templateUrl: './move-to-production-dialog.component.html',
  styleUrl: './move-to-production-dialog.component.scss',
})
export class MoveToProductionDialogComponent implements AfterViewInit {
  private readonly doc = inject(DOCUMENT);
  private readonly vcr = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly title = input<string>('this concept');
  readonly targets = input.required<ProductionTarget[]>();

  @Output() selectAll = new EventEmitter<void>();
  @Output() selectAllKeepConcept = new EventEmitter<void>();
  @Output() workOn = new EventEmitter<number>();
  @Output() cancelDialog = new EventEmitter<void>();

  @ViewChild('dialogTpl', { static: true }) dialogTpl!: TemplateRef<unknown>;
  private view: EmbeddedViewRef<unknown> | null = null;

  ngAfterViewInit(): void {
    this.view = this.vcr.createEmbeddedView(this.dialogTpl);
    this.view.detectChanges();
    const body = this.doc.body;
    for (const node of this.view.rootNodes as Node[]) {
      if (node.nodeType === 1) body.appendChild(node);
    }
    body.style.overflow = 'hidden';
    this.destroyRef.onDestroy(() => {
      if (this.view) {
        this.view.destroy();
        this.view = null;
      }
      if (this.doc.body) this.doc.body.style.overflow = '';
    });
  }

  protected targetLabel(target: ProductionTarget): string {
    const platformLabel =
      PLATFORM_OPTIONS.find((p) => p.value === target.platform)?.label ??
      target.platform;
    const typeLabel =
      PLATFORM_CONTENT_TYPES[target.platform]?.find(
        (ct) => ct.value === target.contentType,
      )?.label ?? target.contentType;
    return `${platformLabel} ${typeLabel}`;
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancelDialog.emit();
    }
  }

  protected onEscape(): void {
    this.cancelDialog.emit();
  }

  protected stopEvent(event: Event): void {
    event.stopPropagation();
  }

  protected onSelectAll(): void {
    this.selectAll.emit();
  }

  protected onSelectAllKeep(): void {
    this.selectAllKeepConcept.emit();
  }

  protected onWorkOn(index: number): void {
    this.workOn.emit(index);
  }

  protected trackByPlatformType(index: number, t: ProductionTarget): string {
    return `${t.platform}:${t.contentType}:${index}`;
  }
}
