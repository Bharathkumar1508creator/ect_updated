# Projects Filter and Card Interaction Follow-up

## Scope

- Keep category filtering and pagination inside the Projects page without a full document reload.
- Preserve shareable URLs and browser Back/Forward navigation.
- Remove visible shadows from project cards and their **View Project** buttons.
- Add consistent hover, press, keyboard-focus, loading, and reduced-motion behavior.
- Reinitialize project image fallbacks and video controls after dynamic result updates.

## Implementation

The server-rendered category and pagination URLs remain the source of truth. JavaScript progressively enhances those links by fetching the destination HTML and replacing only the project-listing section. If JavaScript or the request fails, the original links still perform normal navigation.

The selected filter exposes `aria-current`, the results region has a stable target, filter status changes are announced through a live region, and keyboard focus moves to the newly selected filter after replacement. Each successful update changes browser history, and `popstate` restores earlier result sets without reloading the document.

Project media initialization now supports dynamically inserted cards without duplicating event listeners. Card and button shadows are disabled, while short transform and color transitions provide hover and press feedback. All motion transitions are disabled when the user prefers reduced motion.

A two-pixel white mask now covers the antialiased media edge that browsers could render beneath the button notch. The shared card rule applies the correction to every Projects card without changing its image, rounded corners, link area, or button position.

## Verification

- All 58 Django tests passed.
- JavaScript syntax and Git whitespace checks passed.
- Chrome and Edge kept the same document marker through category filtering and Back navigation.
- Chrome and Edge retained keyboard focus, reported no page errors or failed local requests, and computed all tested card/button shadows as `none`.
- The Projects page had no horizontal overflow at 360px after filtering.
- Every tested card exposed the shared two-pixel white bottom-edge mask.
- The nine-width Chrome and Edge hero matrix from 320px through 1920px retained navbar clearance and zero overflow.

No database schema, production data, uploaded media, third-party submission, or live-server files were changed.
