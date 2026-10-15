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
  /** The value to show (it runs towards the fact's value on reveal); null while the player guesses. */
  readonly value = input.required<number | null>();
  /** Name of the other card, for the question. */
  readonly versus = input('');

  readonly guess = output<Guess>();

  protected readonly shownValue = computed(() => {
    const value = this.value();
    // A no-break space keeps the hidden value's line, so the card has its final height already.
    return value === null
      ? ' '
      : formatValue(value, this.category().format, this.fact().value);
  });

  protected readonly question = computed(() =>
    this.category().question.replace('{name}', this.versus()),
  );
}
