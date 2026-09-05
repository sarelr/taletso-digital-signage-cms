# Phase 2 player candidate

This player is built alongside the proven Phase 1 player and must not replace it without sandbox and physical-TV validation.

It adds:

- strict configuration and media-path validation;
- last-known-good configuration persistence in browser storage;
- restoration after a player reload while the CMS is unavailable;
- preloading before media replacement, so a failed new asset does not clear valid content;
- continued display during CMS, network, JSON, or assigned-media errors;
- adaptive polling using the validated `refreshSeconds` value.

Browser storage preserves the configuration and normal browser caching may preserve media. Guaranteed offline media storage remains a later native-player or service-worker milestone and requires Android TV validation.
