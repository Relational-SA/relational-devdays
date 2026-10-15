import { TestBed } from '@angular/core/testing';
import { BrandLogo } from './brand-logo';

describe('BrandLogo', () => {
  function logoImage(variant?: 'primary' | 'secondary'): HTMLImageElement {
    const fixture = TestBed.createComponent(BrandLogo);
    if (variant) fixture.componentRef.setInput('variant', variant);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('img');
  }

  it('shows the primary logo by default', () => {
    const img = logoImage();

    expect(img.getAttribute('src')).toBe('brand/relational-logo-primary.svg');
    expect(img.alt).toBe('Relational');
  });

  it('shows the secondary logo for dark backgrounds', () => {
    expect(logoImage('secondary').getAttribute('src')).toBe('brand/relational-logo-secondary.svg');
  });
});
