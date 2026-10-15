import { Component, computed, input, output } from '@angular/core';
import { Guess } from './game-engine';
import { Category, Fact, formatValue } from './question-pack';

/** One card of the pair: the fact with its value, or with the Higher / Lower buttons. */
@Component({
  selector: 'app-fact-card',
  templateUrl: './fact-card.html',
  styleUrl: './fact-card.scss',
})
export class FactCard {
  readonly fact = input.required<Fact>();
  readonly category = input.required<Category>();
  /** The value to show (it counts up on reveal); null while the player has to guess it. */
  readonly value = input.required<number | null>();
  /** Name of the other card, for the question. */
  readonly versus = input('');

  readonly guess = output<Guess>();

  protected readonly shownValue = computed(() => {
    const value = this.value();
    return value === null ? '' : formatValue(value, this.category().format);
  });

  protected readonly question = computed(() =>
    this.category().question.replace('{name}', this.versus()),
  );
}
