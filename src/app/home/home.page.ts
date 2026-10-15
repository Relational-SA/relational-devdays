import { Component } from '@angular/core';
import { IonContent, IonHeader, IonToolbar } from '@ionic/angular';
import { BrandLogo } from '../brand/brand-logo';

/** Placeholder landing page; the booth content is scoped in a follow-up PBI. */
@Component({
  selector: 'app-home',
  imports: [IonHeader, IonToolbar, IonContent, BrandLogo],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {}
