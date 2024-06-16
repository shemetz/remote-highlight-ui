# Changelog
All notable changes to this project will be documented in this file.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2024-06-16
- Added smooth transition effects
- Improved scrolling behavior, should be nice now
- Marked as compatible with Foundry V12
- Refactored code

## [2.0.0] - 2023-09-03
- Improved module performance a hundredfold, by using a single listener and document.elementFromPoint, rather than
going through 1000+ elements on the screen and individually adding event listeners  
- Changed scroll to vertically focus the highlighted element

## [1.2.2] - 2023-06-15
- Marked as compatible with Foundry V11

## [1.2.1] - 2022-12-30
- Fixed Firefox compatibility (#6)

## [1.2.0] - 2022-08-08
- Marked as compatible with Foundry V10
- Improved highlight UI to look nicer
- Improved tab switching logic

## [1.1.0] - 2022-02-18
- Improved highlight: will activate correct tab
- Added option to target a specific user when highlighting (right click their name in the player list)

## [1.0.1] - 2022-02-17
- Added setting to allow right-clicking anyway

## [1.0.0] - 2022-02-17
- Increased version number because the module feels ready enough

## [0.4.0] - 2022-02-17
- Added keybinding configuration (Ctrl, Shift, or Ctrl+Shift)
- Improved a bunch of code stuff

## [0.2.0] - 2022-02-13
- Released basic version because it's probably good enough to try out!

## [0.1.0] - 2022-02-12
- Initial prototype

## See also: [Unreleased]

[0.1.0]: https://github.com/shemetz/remote-highlight-ui/compare/0.1.0...0.1.0
[0.2.0]: https://github.com/shemetz/remote-highlight-ui/compare/0.1.0...0.2.0
[0.4.0]: https://github.com/shemetz/remote-highlight-ui/compare/0.2.0...0.4.0
[1.0.0]: https://github.com/shemetz/remote-highlight-ui/compare/0.4.0...1.0.0
[1.0.1]: https://github.com/shemetz/remote-highlight-ui/compare/1.0.0...1.0.1
[1.1.0]: https://github.com/shemetz/remote-highlight-ui/compare/1.0.1...1.1.0
[1.2.0]: https://github.com/shemetz/remote-highlight-ui/compare/1.1.0...1.2.0
[1.2.1]: https://github.com/shemetz/remote-highlight-ui/compare/1.2.0...1.2.1
[1.2.2]: https://github.com/shemetz/remote-highlight-ui/compare/1.2.1...1.2.2
[2.0.0]: https://github.com/shemetz/remote-highlight-ui/compare/1.2.2...2.0.0
[2.0.0]: https://github.com/shemetz/remote-highlight-ui/compare/2.0.0...2.1.0
[Unreleased]: https://github.com/shemetz/remote-highlight-ui/compare/2.1.0...HEAD
