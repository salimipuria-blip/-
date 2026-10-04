import argparse
import sys


def main():
    sys.stdout.reconfigure(encoding='utf-8', newline='\n')
    parser = argparse.ArgumentParser()
    args = parser.parse_args()

    js = """
    (function() {
      try {
        const origin = location.origin;
        const cards = Array.from(document.querySelectorAll('#gridItemRoot'));
        if (cards.length === 0) {
          return JSON.stringify({ error: true, message: 'no bestseller cards found - is this a /bestsellers/, /gp/bestsellers/ or /zgbs/ page?' });
        }
        const parseNumber = (t) => {
          if (!t) return null;
          const s = String(t).replace(/[,\\s]/g, '');
          const m = s.match(/[\\d.]+/);
          return m ? parseFloat(m[0]) : null;
        };
        const parsePrice = (t) => {
          if (!t) return null;
          const m = String(t).match(/([\\$\\u00A3\\u20ac\\u00a5]|CDN\\$|AU\\$|R\\$|Rp|kr|zl|Ft|\\u20b9|\\u20a9)?\\s*([\\d.,]+)/);
          if (!m) return null;
          const value = parseFloat(m[2].replace(/,/g, ''));
          return isNaN(value) ? null : { value, currencyRaw: (m[1] || '').trim(), raw: t.trim() };
        };
        const items = cards.map((card, idx) => {
          const asin = card.querySelector('[data-asin]')?.getAttribute('data-asin');
          const rankText = card.querySelector('.zg-bdg-text')?.textContent?.trim();
          const rank = rankText ? parseInt(rankText.replace(/[^\\d]/g, ''), 10) : (idx + 1);
          const link = card.querySelector('a.a-link-normal[href*="/dp/"]');
          const rawHref = link?.getAttribute('href') || null;
          const url = rawHref ? (rawHref.startsWith('http') ? rawHref : origin + rawHref) : null;
          const img = card.querySelector('img');
          const titleEl = Array.from(card.querySelectorAll('div')).find(d => (d.className || '').includes('p13n-sc-css-line-clamp')) || card.querySelector('.a-link-normal .a-color-base');
          const priceEl = card.querySelector('._cDEzb_p13n-sc-price_3mJ9Z, .a-price .a-offscreen, .p13n-sc-price');
          const ratingEl = card.querySelector('.a-icon-star-small .a-icon-alt');
          const reviewCountEl = card.querySelector('.a-size-small');
          return {
            rank,
            asin,
            title: titleEl?.textContent?.trim() || null,
            url,
            image: img?.getAttribute('src') || null,
            imageAlt: img?.getAttribute('alt') || null,
            price: parsePrice(priceEl?.textContent),
            stars: parseNumber(ratingEl?.textContent),
            reviewCount: parseNumber(reviewCountEl?.textContent),
            ratingRaw: ratingEl?.textContent?.trim() || null
          };
        });
        // Header info - avoid picking up cart 'Subtotal' h1; use page title as primary
        const rawTitle = (document.title || '').replace(/^Amazon Best Sellers:\\s*/, '').replace(/\\s*-\\s*Amazon\\.com$/, '').trim();
        const categoryName = rawTitle.replace(/^Best\\s+/, '') || null;
        const categoryFullName = rawTitle || null;
        // Pagination (bestsellers pages are typically 2 pages of 50 items)
        const pagLinks = Array.from(document.querySelectorAll('.a-pagination li a')).map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href') }));
        const nextEl = pagLinks.find(l => /Next/i.test(l.text));
        const currentPageEl = document.querySelector('.a-pagination .a-selected');
        const currentPage = currentPageEl ? parseInt(currentPageEl.textContent.trim(), 10) : 1;
        const nextPageUrl = nextEl ? (nextEl.href && nextEl.href.startsWith('http') ? nextEl.href : origin + nextEl.href) : null;
        return JSON.stringify({
          categoryName,
          categoryFullName,
          categoryUrl: location.origin + location.pathname,
          currentPage,
          hasNextPage: !!nextPageUrl,
          nextPageUrl,
          itemCount: items.length,
          items
        });
      } catch (e) {
        return JSON.stringify({ error: true, message: e.message });
      }
    })()
    """
    print(js)


if __name__ == '__main__':
    main()
