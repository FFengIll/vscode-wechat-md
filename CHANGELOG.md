# Change Log

All notable changes to the "vscode-wechat-md" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

- Added per-category custom style: every style-preset category (headings, blockquote, list, link, image, divider, table, inline code) now has a "Custom" option that reads user-authored CSS from `.wechat/custom/<category>.css`.
- Removed the legacy global `.wechat/theme.override.ts` override mechanism in favor of the per-category custom style above.
- Initial release