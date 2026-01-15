# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0-alpha.1] - 2026-01-XX

### Added

- Initial release of `@nexwave/sdk`
  - `NexwaveClient` for API communication
  - `IntentBuilder` for fluent intent construction
  - `AgentConfigBuilder` for agent configuration
  - Full service coverage: intents, agents, execution, market, system
  - SSE streaming for real-time updates
  - Comprehensive error types

- Initial release of `@nexwave/types`
  - Zod schemas for all API types
  - TypeScript type definitions
  - Runtime validation

- Initial release of `@nexwave/mock-server`
  - Full API mock implementation
  - Realistic execution simulation
  - Mock controls for testing

### Security

- API key validation (must start with `nxw_`)
- Request timeout defaults
- Retry limits to prevent infinite loops
