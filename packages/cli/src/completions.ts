import { Command } from 'commander';

/**
 * Generate bash completion script
 */
export function generateBashCompletion(program: Command): string {
  const commands = program.commands.map((c) => c.name()).join(' ');

  return `
_nexwave_completions() {
  local cur prev commands
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  commands="${commands}"

  case "\${prev}" in
    nexwave)
      COMPREPLY=( $(compgen -W "\${commands}" -- \${cur}) )
      return 0
      ;;
    intent)
      COMPREPLY=( $(compgen -W "submit status list cancel validate" -- \${cur}) )
      return 0
      ;;
    agent)
      COMPREPLY=( $(compgen -W "create list info start stop logs delete" -- \${cur}) )
      return 0
      ;;
    market)
      COMPREPLY=( $(compgen -W "quote state watch" -- \${cur}) )
      return 0
      ;;
    execution|exec)
      COMPREPLY=( $(compgen -W "queue metrics kill pause resume" -- \${cur}) )
      return 0
      ;;
    system)
      COMPREPLY=( $(compgen -W "health config info" -- \${cur}) )
      return 0
      ;;
    config)
      COMPREPLY=( $(compgen -W "set get list reset" -- \${cur}) )
      return 0
      ;;
    auth)
      COMPREPLY=( $(compgen -W "login logout status" -- \${cur}) )
      return 0
      ;;
    --output|-o)
      COMPREPLY=( $(compgen -W "table json yaml" -- \${cur}) )
      return 0
      ;;
    --status|-s)
      COMPREPLY=( $(compgen -W "PENDING RUNNING STOPPED CONFIRMED FAILED" -- \${cur}) )
      return 0
      ;;
  esac

  if [[ \${cur} == -* ]] ; then
    COMPREPLY=( $(compgen -W "--output --verbose --quiet --no-color --help --version" -- \${cur}) )
    return 0
  fi
}

complete -F _nexwave_completions nexwave
`.trim();
}

/**
 * Generate zsh completion script
 */
export function generateZshCompletion(program: Command): string {
  return `
#compdef nexwave

_nexwave() {
  local -a commands
  commands=(
    'auth:Authentication commands'
    'config:CLI configuration'
    'intent:Manage intents'
    'agent:Manage agents'
    'market:Market data'
    'execution:Execution control'
    'system:System health'
    'swap:Quick market swap'
    'limit:Quick limit order'
  )

  _arguments -C \\
    '-o[Output format]:format:(table json yaml)' \\
    '--output[Output format]:format:(table json yaml)' \\
    '--verbose[Verbose output]' \\
    '--quiet[Quiet mode]' \\
    '--no-color[Disable colors]' \\
    '-h[Show help]' \\
    '--help[Show help]' \\
    '-v[Show version]' \\
    '--version[Show version]' \\
    '1: :->command' \\
    '*::arg:->args'

  case $state in
    command)
      _describe 'command' commands
      ;;
  esac
}

_nexwave
`.trim();
}
