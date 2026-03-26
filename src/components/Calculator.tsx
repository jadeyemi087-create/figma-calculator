import { useMemo, useState } from 'react';

type AngleMode = 'deg' | 'rad';

type Operator = '+' | '-' | '×' | '÷';

function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function safeParseNumber(s: string): number | null {
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function applyTrig(fn: 'sin' | 'cos' | 'tan', value: number, angleMode: AngleMode) {
  const v = angleMode === 'deg' ? degToRad(value) : value;
  switch (fn) {
    case 'sin':
      return Math.sin(v);
    case 'cos':
      return Math.cos(v);
    case 'tan':
      return Math.tan(v);
  }
}

function formatNumber(n: number) {
  if (!Number.isFinite(n)) return 'Error';
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e10 || abs < 1e-6)) return n.toExponential(6).replace(/0+e/, 'e');
  const s = n.toString();
  return s.length > 12 ? n.toPrecision(12).replace(/\.?0+$/, '') : s;
}

function normalizeOperators(expr: string) {
  return expr.replaceAll('×', '*').replaceAll('÷', '/');
}

function evaluateExpression(expr: string): number | null {
  const normalized = normalizeOperators(expr);
  if (!/^[0-9+\-*/().\s]+$/.test(normalized)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${normalized});`)() as unknown;
    return typeof result === 'number' && Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

const backspaceSvg = (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.2 8.5H22.5C24.1569 8.5 25.5 9.84315 25.5 11.5V20.5C25.5 22.1569 24.1569 23.5 22.5 23.5H13.2C12.3319 23.5 11.5062 23.1242 10.9355 22.4698L6.73553 17.4698C5.8421 16.4135 5.8421 14.5865 6.73553 13.5302L10.9355 8.5302C11.5062 7.87577 12.3319 7.5 13.2 7.5Z"
      stroke="white"
      strokeOpacity="0.9"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M15 13L22 20"
      stroke="white"
      strokeOpacity="0.9"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M22 13L15 20"
      stroke="white"
      strokeOpacity="0.9"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

function CalcButton(props: {
  label?: string;
  variant?: 'normal' | 'accent';
  onClick?: () => void;
  children?: React.ReactNode;
  ariaLabel?: string;
}) {
  const { label, variant = 'normal', onClick, children, ariaLabel } = props;
  return (
    <button
      type="button"
      aria-label={ariaLabel ?? label}
      onClick={onClick}
      className={[
        'h-[72px] w-[72px] rounded-calc-btn flex items-center justify-center',
        'text-white text-[32px] leading-none font-work',
        'select-none active:translate-y-[1px] transition-transform',
        variant === 'accent' ? 'bg-calc-accent' : 'bg-calc-button',
      ].join(' ')}
    >
      {children ?? label}
    </button>
  );
}

export default function Calculator() {
  const [isScientific, setIsScientific] = useState(false);
  const [angleMode, setAngleMode] = useState<AngleMode>('deg');

  const [topLine, setTopLine] = useState('5×477');
  const [display, setDisplay] = useState('2345');
  const [expr, setExpr] = useState<string>('2345');

  const gridCols = isScientific ? 5 : 4;

  const rows = useMemo(() => {
    const sci = isScientific
      ? ([
          ['sin', 'cos', 'tan'] as const,
          [null, null, null] as const,
          [null, null, null] as const,
          [null, null, null] as const,
          [null, null, null] as const,
        ] as const)
      : null;

    const base = [
      ['C', '±', '%', '÷'] as const,
      ['7', '8', '9', '×'] as const,
      ['4', '5', '6', '-'] as const,
      ['1', '2', '3', '+'] as const,
      ['.', '0', '⌫', '='] as const,
    ];

    if (!sci) return base.map((r) => r.map((x) => x));

    return base.map((r, i) => {
      const trig = sci[i][0];
      const trig2 = sci[i][1];
      const trig3 = sci[i][2];
      const left = [trig, trig2, trig3].filter(Boolean) as string[];
      return [...left, ...r] as string[];
    });
  }, [isScientific]);

  function syncDisplay(nextExpr: string) {
    setExpr(nextExpr);
    setDisplay(nextExpr === '' ? '0' : nextExpr);
  }

  function clearAll() {
    setTopLine('');
    syncDisplay('0');
  }

  function backspace() {
    if (expr === '0') return;
    const next = expr.length <= 1 ? '0' : expr.slice(0, -1);
    syncDisplay(next);
  }

  function toggleSign() {
    const n = safeParseNumber(expr);
    if (n === null) return;
    syncDisplay(formatNumber(-n));
  }

  function percent() {
    const n = safeParseNumber(expr);
    if (n === null) return;
    syncDisplay(formatNumber(n / 100));
  }

  function appendDigitOrDot(ch: string) {
    if (ch === '.') {
      const parts = expr.split(/[\+\-×÷]/);
      const last = parts[parts.length - 1] ?? '';
      if (last.includes('.')) return;
    }
    if (expr === '0' && ch !== '.') {
      syncDisplay(ch);
      return;
    }
    syncDisplay(expr + ch);
  }

  function appendOperator(op: Operator) {
    const trimmed = expr.trim();
    const last = trimmed.at(-1);
    if (!trimmed || last === '+' || last === '-' || last === '×' || last === '÷' || last === '.') return;
    syncDisplay(trimmed + op);
  }

  function equals() {
    const result = evaluateExpression(expr);
    if (result === null) {
      setTopLine(expr);
      syncDisplay('Error');
      return;
    }
    setTopLine(expr);
    syncDisplay(formatNumber(result));
  }

  function trig(fn: 'sin' | 'cos' | 'tan') {
    const current = safeParseNumber(expr);
    if (current === null) {
      syncDisplay('Error');
      return;
    }
    const result = applyTrig(fn, current, angleMode);
    setTopLine(`${fn}(${expr})`);
    syncDisplay(formatNumber(result));
  }

  function handleKey(k: string) {
    if (/^\d$/.test(k)) return appendDigitOrDot(k);
    if (k === '.') return appendDigitOrDot('.');
    if (k === '+') return appendOperator('+');
    if (k === '-') return appendOperator('-');
    if (k === '*') return appendOperator('×');
    if (k === '/') return appendOperator('÷');
    if (k === 'Enter' || k === '=') return equals();
    if (k === 'Backspace') return backspace();
    if (k === 'Escape') return clearAll();
  }

  return (
    <div
      className="relative w-[390px] h-[844px] bg-calc-bg overflow-hidden"
      tabIndex={0}
      onKeyDown={(e) => handleKey(e.key)}
      aria-label="Calculator"
    >
      <div className="absolute left-[24px] top-[228px] w-[342px] flex flex-col items-end gap-8">
        <div className="relative w-full flex flex-col items-end gap-6">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsScientific((v) => !v)}
                className={[
                  'text-white/90 text-xs tracking-wide',
                  'px-3 py-2 rounded-full bg-white/5',
                  'transition-colors hover:bg-white/10',
                ].join(' ')}
              >
                {isScientific ? 'Basic' : 'Scientific'}
              </button>
              <button
                type="button"
                onClick={() => setAngleMode((m) => (m === 'deg' ? 'rad' : 'deg'))}
                className={[
                  'text-white/80 text-xs',
                  'px-3 py-2 rounded-full bg-white/5',
                  'transition-colors hover:bg-white/10',
                ].join(' ')}
                aria-label="Toggle degrees and radians"
              >
                Deg/Rad: <span className="text-white">{angleMode.toUpperCase()}</span>
              </button>
            </div>
          </div>

          <p className="w-full text-right text-[32px] leading-7 text-calc-muted font-work">{topLine}</p>
          <p className="w-full text-right text-[80px] leading-[64px] text-white font-work">{display}</p>
        </div>

        <div
          className={[
            'w-full flex flex-col items-start gap-[18px]',
            'transition-[transform,opacity] duration-300 ease-out',
          ].join(' ')}
        >
          {rows.map((row, ri) => (
            <div
              key={ri}
              className={[
                'w-full flex items-center gap-[18px]',
                'transition-all duration-300 ease-out',
                isScientific ? 'justify-start' : 'justify-start',
              ].join(' ')}
              style={{
                width: '100%',
              }}
            >
              {row.map((k, ci) => {
                const isAccent = k === '÷' || k === '×' || k === '-' || k === '+' || k === '=';
                const isTrig = k === 'sin' || k === 'cos' || k === 'tan';

                const base =
                  k === 'C'
                    ? () => clearAll()
                    : k === '⌫'
                      ? () => backspace()
                      : k === '±'
                        ? () => toggleSign()
                        : k === '%'
                          ? () => percent()
                          : k === '='
                            ? () => equals()
                            : k === '÷' || k === '×' || k === '-' || k === '+'
                              ? () => appendOperator(k as Operator)
                              : isTrig
                                ? () => trig(k as 'sin' | 'cos' | 'tan')
                                : () => appendDigitOrDot(k);

                const label = k === '⌫' ? undefined : k;

                return (
                  <div
                    key={`${k}-${ci}`}
                    className={[
                      'transition-[width,transform,opacity] duration-300 ease-out',
                      isScientific ? 'opacity-100' : '',
                    ].join(' ')}
                    style={{
                      width: 72,
                      height: 72,
                    }}
                  >
                    <CalcButton
                      variant={isAccent ? 'accent' : 'normal'}
                      label={label}
                      onClick={base}
                      ariaLabel={k === '⌫' ? 'Backspace' : k}
                    >
                      {k === '⌫' ? backspaceSvg : k}
                    </CalcButton>
                  </div>
                );
              })}

              {isScientific && row.length < gridCols ? (
                <div className="flex-1" />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

