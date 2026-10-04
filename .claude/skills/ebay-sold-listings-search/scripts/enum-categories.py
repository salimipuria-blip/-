import sys


def main():
    sys.stdout.reconfigure(encoding='utf-8', newline='\n')
    js = """
    (function() {
      try {
        const sel = document.querySelector('select[name=_sacat]');
        if (!sel) {
          return JSON.stringify({ error: true, message: 'category select not found; navigate to an eBay search page first' });
        }
        const seen = new Set();
        const items = [];
        for (const opt of sel.options) {
          const v = opt.value;
          const raw = opt.textContent || '';
          const text = raw.trim();
          if (!v || v === '0') continue;
          const key = v + '|' + text;
          if (seen.has(key)) continue;
          seen.add(key);
          const depth = (raw.match(/└/g) || []).length + (raw.match(/^\\s+/)?.[0]?.length ? 1 : 0);
          const cleanLabel = text.replace(/^[└\\s]+/, '').trim();
          items.push({ id: v, label: cleanLabel, depth });
        }
        return JSON.stringify({ error: false, count: items.length, items });
      } catch(e) {
        return JSON.stringify({ error: true, message: e.message });
      }
    })()
    """
    print(js)


if __name__ == '__main__':
    main()
