#!/usr/bin/env bash
# Regenerates the fixed-fill ink rules in app/globals.css.
#
# Themed surfaces (bg-card, bg-canvas, …) flip with the theme, so the ink on
# them flips too. Literal fills (bg-[#00FFFF], bg-black, bg-zinc-300, …) do not:
# a bright one stays bright and a dark one stays dark in every theme. Text on
# them therefore has to be pinned, or it inherits the theme ink and disappears.
#
# This prints both rules — bright fills get dark ink, dark fills get light ink.
# Run it after adding a new literal background colour and paste the output
# between the BEGIN/END markers in app/globals.css.
set -euo pipefail
cd "$(dirname "$0")/.."

git ls-files 'app/**/*.tsx' 'components/**/*.tsx' 'features/**/*.tsx' 'app/*.tsx' 'components/*.tsx' \
  | grep -v ' 2\.' \
  | xargs grep -ohE 'bg-\[#[0-9A-Fa-f]{6}\]' \
  | sort -u \
  | python3 -c "
import sys

def luminance(hex_value):
    channels = [int(hex_value[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    channels = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]

bright, dark = [], []
for line in sys.stdin:
    cls = line.strip()
    L = luminance(cls[5:-1].lstrip('#'))
    # Whichever of black or white text reads better on the fill decides.
    (bright if (L + 0.05) / 0.05 > 1.05 / (L + 0.05) else dark).append(cls)

BRIGHT_NAMED = ['bg-zinc-200', 'bg-zinc-300', 'bg-zinc-400', 'bg-slate-200', 'bg-slate-300',
                'bg-gray-200', 'bg-gray-300', 'bg-yellow-300']
DARK_NAMED = ['bg-black', 'bg-zinc-600', 'bg-zinc-700', 'bg-zinc-800', 'bg-zinc-900',
              'bg-slate-700', 'bg-slate-800', 'bg-slate-900', 'bg-slate-950']

def rule(classes, primary, muted, note):
    selectors = ',\n  '.join('[class~=\"%s\"]' % c for c in classes)
    return ('  /* %s */\n  %s {\n    --text-primary: %s;\n    --text-muted: %s;\n'
            '    color: var(--text-primary);\n  }') % (note, selectors, primary, muted)

print(rule(sorted(bright) + BRIGHT_NAMED,
           'var(--text-on-accent)',
           'color-mix(in srgb, var(--text-on-accent) 70%, transparent)',
           'Bright literal fills: pinned to dark ink in every theme.'))
print()
print(rule(sorted(dark) + DARK_NAMED,
           'var(--text-on-dark)',
           'var(--text-on-dark-muted)',
           'Dark literal fills: pinned to light ink in every theme.'))
"
