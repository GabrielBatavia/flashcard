import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
    return nextResolve(`${specifier}.ts`, context);
  }
  return nextResolve(specifier, context);
} });
const { parseFlexibleDeckJson, importDecksFromJson, exportDecksToJson, SAMPLE_HANDWRITING_JSON } = await import('../src/utils/storage.ts');
const sample = parseFlexibleDeckJson(SAMPLE_HANDWRITING_JSON);
assert.equal(sample.type, 'deck');
assert.equal(sample.deck.language, 'zh-TW');
assert.equal(sample.deck.cards[1].back, '我喜歡喝茶。');
assert.ok(sample.deck.cards.every(card => card.type === 'handwriting' && !card.options));
const restored = importDecksFromJson(exportDecksToJson(importDecksFromJson(SAMPLE_HANDWRITING_JSON)));
assert.equal(restored[0].language, 'zh-TW');
assert.equal(restored[0].cards[1].back, sample.deck.cards[1].back);
assert.equal(restored[0].cards[0].type, 'handwriting');
const neutral = parseFlexibleDeckJson(JSON.stringify({ cards: [{ type: 'handwriting', front: 'Write A', back: 'A', options: ['Wrong', 'Other'] }] }));
assert.equal(neutral.deck.language, undefined);
assert.equal(neutral.deck.cards[0].back, 'A');
assert.equal(neutral.deck.cards[0].options, undefined);
const old = parseFlexibleDeckJson(JSON.stringify({ cards: [{ front: 'Question', back: 'Answer' }, { question: 'Choose', answer: 'A', options: ['First', 'Second'] }] }));
assert.equal(old.deck.cards[0].type, 'flashcard');
assert.equal(old.deck.cards[1].type, 'quiz');
assert.equal(old.deck.cards[1].back, 'First');
const other = parseFlexibleDeckJson(JSON.stringify({ language: 'ja', cards: [{ type: 'handwriting', front: 'Water', back: '水' }] }));
assert.equal(other.deck.language, 'ja');
assert.equal(other.deck.cards[0].back, '水');
assert.throws(() => parseFlexibleDeckJson('{broken'));
assert.throws(() => parseFlexibleDeckJson('{"cards":[{"type":"handwriting","front":"No answer"}]}'));
console.log('PASS: handwriting import, literal answers, optional language, multi-deck round trip, legacy cards/quiz, invalid input.');
