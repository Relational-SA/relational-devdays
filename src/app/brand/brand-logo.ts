import { Component, computed, input } from '@angular/core';

/**
 * The Relational logo (Brand Manual 2025): `primary` on white or aqua backgrounds, `secondary`
 * on navy or black. The host keeps the manual's clear space and minimum width (see the styles).
 * Size it with the `--brand-logo-width` CSS property.
 */
@Component({
  selector: 'app-brand-logo',
  template: `<img [src]="src()" alt="Relational" width="220" height="63" />`,
  styleUrl: './brand-logo.scss',
})
export class BrandLogo {
  readonly variant = input<'primary' | 'secondary'>('primary');

  protected readonly src = computed(() => `brand/relational-logo-${this.variant()}.svg`);
}
