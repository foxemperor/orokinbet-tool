// ============================================================
// orokinPhoneticize.ts
// TypeScript port of the Orokin phonetics engine from TennoTyper
// Original: https://github.com/Clarvel/TennoTyper (MIT License)
// ============================================================

/** All valid Orokin phoneme tokens */
export type OrokinPhoneme =
  | 'aye' | 'ae' | 'ow' | 'aw' | 'ee' | 'i' | 'e' | 'a' | 'u' | 'oo' | 'o'
  | 'th' | 'dh' | 'sh' | 'zh' | 'ch' | 'kh' | 'ng'
  | 'p' | 'b' | 't' | 'd' | 's' | 'z' | 'j' | 'k' | 'g' | 'f' | 'v'
  | 'm' | 'n' | 'h' | 'r' | 'l'
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | '.' | ',' | '-';

/** Vowel phonemes — rendered ABOVE the next consonant */
export const VOWELS: OrokinPhoneme[] = [
  'aye', 'ae', 'ow', 'aw', 'ee', 'i', 'e', 'a', 'u', 'oo', 'o',
];

/** Misc phonemes — punctuation & digits, rendered inline */
export const MISC: OrokinPhoneme[] = [
  ',', '.', '-',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
];

/** Consonant phonemes — rendered on the baseline */
export const CONSONANTS: OrokinPhoneme[] = [
  'th', 'dh', 'sh', 'zh', 'ch', 'kh', 'ng',
  'p', 'b', 't', 'd', 's', 'z', 'j', 'k', 'g', 'f', 'v',
  'm', 'n', 'h', 'r', 'l',
];

/** All chars in order (longest-first for greedy matching in literal mode) */
export const ALL_CHARS: OrokinPhoneme[] = [
  'aye', 'ae', 'ow', 'aw', 'ee', 'i', 'e', 'a', 'u', 'oo', 'o',
  'th', 'dh', 'sh', 'zh', 'ch', 'kh', 'ng',
  'p', 'b', 't', 'd', 's', 'z', 'j', 'k', 'g', 'f', 'v',
  'm', 'n', 'h', 'r', 'l',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  '.', ',', '-',
];

export function isVowel(p: string): boolean {
  return (VOWELS as string[]).includes(p);
}

export function isMisc(p: string): boolean {
  return (MISC as string[]).includes(p);
}

export function isConsonant(p: string): boolean {
  return (CONSONANTS as string[]).includes(p);
}

/** 
 * Literal (non-phonetic) mode:
 * Maps input characters 1-to-1 to Orokin phonemes without
 * applying English pronunciation rules.
 */
export function literal(word: string): OrokinPhoneme[] {
  const result: OrokinPhoneme[] = [];
  let a = 0;
  while (a < word.length) {
    let found = false;
    switch (word[a]) {
      case 'y':
        result.push('ee');
        a++;
        found = true;
        break;
      case 'w':
        result.push('oo');
        a++;
        found = true;
        break;
      case 'c':
        if (!(a < word.length - 1 && word[a + 1] === 'h')) {
          result.push('k');
          a++;
          found = true;
          break;
        }
        // fall through to default for 'ch'
        // eslint-disable-next-line no-fallthrough
      default:
        for (const char of ALL_CHARS) {
          if (word.indexOf(char, a) === a) {
            result.push(char);
            a += char.length;
            found = true;
            break;
          }
        }
    }
    if (!found) a++;
  }
  return result;
}

/**
 * Phonetic mode (default):
 * Converts English text to Orokin phonemes following TennoTyper rules.
 * Input should be a single lowercase word (no spaces).
 */
export function phoneticize(word: string): OrokinPhoneme[] {
  const out: OrokinPhoneme[] = [];

  for (let a = 0; a < word.length; a++) {
    if (a < word.length - 1) {
      // There is at least one character after position a
      let handled = false;

      switch (word[a]) {
        // ── C ──────────────────────────────────────────────
        case 'c': {
          switch (word[a + 1]) {
            case 'h':
              if (a > 0 && isVowel(word[a - 1])) {
                out.push('kh');
              } else {
                out.push('ch');
              }
              a++;
              break;
            case 'o':
              if (a < word.length - 2 && word[a + 2] === 'u') {
                out.push('k');
                out.push('ow');
                a += 2;
                break;
              }
              // default c → k
              out.push('k');
              // a stays, will be incremented by loop
              // we consumed only 'c', next iteration handles 'o'
              // but original code does a-- then a++ → net 0
              // replicate: don't advance extra
              break;
            default:
              out.push('k');
          }
          handled = true;
          break;
        }

        // ── O ──────────────────────────────────────────────
        case 'o': {
          switch (word[a + 1]) {
            case 'o':
            case 'u':
              out.push('oo');
              a++;
              break;
            case 'w':
              out.push('ow');
              a++;
              break;
            default:
              if (
                isVowel(word[a + 1]) ||
                isMisc(word[a + 1]) ||
                word[a + 1] === 'l'
              ) {
                out.push('o');
              } else {
                out.push('aw');
              }
              // original: a-- then a++ → net 0 (already at a+1 next iter)
          }
          handled = true;
          break;
        }

        // ── W ──────────────────────────────────────────────
        case 'w': {
          out.push('oo');
          if (word[a + 1] === 'a') {
            out.push('o');
            a++;
          }
          handled = true;
          break;
        }

        // ── Y ──────────────────────────────────────────────
        case 'y': {
          switch (word[a + 1]) {
            case 'i':
              out.push('aye');
              a++;
              break;
            case 'o':
              if (
                a < word.length - 2 &&
                word[a + 2] === 'u' &&
                (word.length === 3 || isMisc(word[a + 3] ?? ''))
              ) {
                out.push('ee');
                out.push('oo');
                out.push('h');
                a += 2;
                break;
              }
              out.push('ee');
              break;
            default:
              out.push('ee');
          }
          handled = true;
          break;
        }

        // ── A ──────────────────────────────────────────────
        case 'a': {
          switch (word[a + 1]) {
            case 'e':
            case 'i':
              out.push('ae');
              a++;
              handled = true;
              break;
            case 'y':
              if (a < word.length - 2 && word[a + 2] === 'e') {
                out.push('aye');
                a += 2;
              } else {
                out.push('ae');
                a++;
              }
              handled = true;
              break;
            case 'w':
              out.push('aw');
              a++;
              handled = true;
              break;
            case 's':
              out.push('zh');
              a++;
              handled = true;
              break;
            default:
              if (
                a < word.length - 2 &&
                word[a + 2] === 'e' &&
                !isVowel(word[a + 1]) &&
                !isMisc(word[a + 1])
              ) {
                out.push(word[a + 1] === 'r' ? 'aw' : 'ae');
                handled = true;
              }
          }
          break;
        }

        // ── B ──────────────────────────────────────────────
        case 'b': {
          if (
            a < word.length - 2 &&
            word[a + 1] === 'o' &&
            word[a + 2] === 'u'
          ) {
            out.push('b');
            out.push('ow');
            a += 2;
            handled = true;
          }
          break;
        }

        // ── D ──────────────────────────────────────────────
        case 'd': {
          switch (word[a + 1]) {
            case 'h':
              out.push('dh');
              a++;
              handled = true;
              break;
            case 'o':
              if (a < word.length - 2 && word[a + 2] === 'u') {
                out.push('d');
                out.push('ow');
                a += 2;
                handled = true;
              }
              break;
          }
          break;
        }

        // ── E ──────────────────────────────────────────────
        case 'e': {
          switch (word[a + 1]) {
            case 'a':
            case 'e':
              out.push('ee');
              a++;
              handled = true;
              break;
          }
          break;
        }

        // ── G ──────────────────────────────────────────────
        case 'g': {
          if (word[a + 1] === 'e') {
            out.push('j');
            out.push('i');
            a++;
            handled = true;
          }
          break;
        }

        // ── I ──────────────────────────────────────────────
        case 'i': {
          if (word[a + 1] === 'e') {
            out.push('aye');
            a++;
            handled = true;
          } else if (word[a + 1] === 'a') {
            out.push('ee');
            handled = true;
          } else if (
            a < word.length - 2 &&
            word[a + 2] === 'e' &&
            !isVowel(word[a + 3] ?? '') &&
            !isVowel(word[a + 1]) &&
            !isMisc(word[a + 1])
          ) {
            out.push('aye');
            handled = true;
          }
          break;
        }

        // ── N ──────────────────────────────────────────────
        case 'n': {
          if (a === word.length - 2 && word[a + 1] === 'g') {
            out.push('ng');
            a++;
            handled = true;
          }
          break;
        }

        // ── S ──────────────────────────────────────────────
        case 's': {
          if (word[a + 1] === 'h') {
            out.push('sh');
            a++;
            handled = true;
          }
          break;
        }

        // ── T ──────────────────────────────────────────────
        case 't': {
          if (word[a + 1] === 'h') {
            out.push('th');
            // special case: "the" as full word
            if (
              a < word.length - 2 &&
              word[a + 2] === 'e' &&
              (word.length === 3 || isMisc(word[a + 3] ?? ''))
            ) {
              out.push('u');
              out.push('h');
              a++;
            }
            a++;
            handled = true;
          } else if (
            a < word.length - 3 &&
            word[a + 1] === 'i' &&
            word[a + 2] === 'o' &&
            word[a + 3] === 'n'
          ) {
            // -tion → sh u m
            out.push('sh');
            out.push('u');
            out.push('m');
            a += 3;
            handled = true;
          }
          break;
        }

        // ── U ──────────────────────────────────────────────
        case 'u': {
          if (
            a < word.length - 2 &&
            !isVowel(word[a + 1]) &&
            !isMisc(word[a + 1]) &&
            isVowel(word[a + 2])
          ) {
            out.push('oo');
            handled = true;
          }
          break;
        }
      }

      if (!handled) {
        out.push(word[a] as OrokinPhoneme);
      }
    } else {
      // ── Last character in word ───────────────────────────
      switch (word[a]) {
        case 'c':   out.push('k');   break;
        case 'e':
          // silent final 'e', unless it's the ONLY letter
          if (a === 0) out.push('e');
          break;
        case 'o':   out.push('o');   break;
        case 'w':   out.push('oo');  break;
        case 'x':   out.push('z');   break;
        case 'i':
          // standalone 'i' → aye; otherwise → i
          out.push(a === 0 ? 'aye' : 'i');
          break;
        case 'y':   out.push('aye'); break;
        default:    out.push(word[a] as OrokinPhoneme);
      }
    }
  }

  // ── Post-processing: remove consecutive duplicates
