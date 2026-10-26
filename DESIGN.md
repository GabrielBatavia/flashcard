# FlashQuiz: Liquid Glass

Approved direction: light Liquid Glass inspired by the user's iPhone reference.
ENERGY 1 / RHYTHM 2 / MOTION 2.

- Ice blue background creates depth beneath the translucent navigation without competing with study material.
- Apple system typography uses the device's native face on iPhone; system fallbacks keep other platforms legible.
- Glass is reserved for the floating dock and toolbar; reading surfaces stay opaque enough to preserve contrast.
- Decks are equal study units, so the collection uses a consistent two-column grid, collapsing to one on phones.
- Existing user-selected deck colors appear only in subject icons; blue identifies interactive actions.
- Generous spacing separates collection, search, and content; compact controls remain at least 44px tall.
- Book, layers, list, and pencil icons describe actual actions, using the existing icon library deliberately.
- Short entrance, press, flip, and sheet transitions explain navigation and touch feedback. No looping decoration.
- Dark mode, reduced motion, keyboard focus, safe areas, zoom, and no-blur fallback are required.

Implementation: shared CSS tokens, semantic library/navigation components, consistent study/editor surfaces, accessible modal focus handling. Preserve local deck storage and existing workflows.
Validation: production build, lint, browser checks at phone and desktop sizes, both themes, search, deck editing, card flip, quiz, and dialogs.
