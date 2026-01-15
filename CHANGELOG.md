# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial release of `@nexwave/cli`
  - Template path resolution - automatically resolves `templates/` paths relative to package directory
  - Development default credentials - auto-uses `localhost:8080` with `nxw_test_example` for local testing
  - Path resolution utility for handling template and file paths

### Changed

- CLI now automatically uses development credentials when no explicit credentials are set
- Template paths (e.g., `templates/agent-dca.yaml`) now work from any directory
  - Full-featured command-line interface for Nexwave
  - Authentication commands (login, logout, status)
  - Intent management (submit, status, list, cancel, validate)
  - Agent management (create, list, start, stop, logs, delete)
  - Market data commands (quote, state, watch)
  - Execution control (queue, metrics, kill, pause, resume)
  - System commands (health, config, info)
  - Configuration management (set, get, list, reset)
  - Quick shortcuts (swap, limit orders)
  - Shell completions (bash, zsh)
  - Multiple output formats (table, JSON, YAML)
  - Secure credential storage with keytar/keychain fallback
  - Rich error handling with helpful suggestions
  - Template files for intents and agents

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
