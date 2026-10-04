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
        const cards = Array.from(document.querySelectorAll('[data-component-type="s-search-result"]'));
        if (cards.length === 0) {
          return JSON.stringify({ error: true, message: 'no search result cards found on page' });
        }
        const parseNumber = (t) => {
          if (!t) return null;
          const m = String(t).replace(/[,\\s]/g, '').match(/[\\d.]+/);
          return m ? parseFloat(m[0]) : null;
        };
        const parsePrice = (t) => {
          if (!t) return null;
          const m = String(t).match(/([\\$\\u00A3\\u20ac\\u00a5]|CDN\\$|AU\\$|R\\$|Rp|kr|zl|Ft|\\u20b9|\\u20a9|USD|EUR|GBP|JPY|CAD|AUD|INR|CNY|BRL)?\\s*([\\d.,]+)/);
          if (!m) return null;
          const numStr = m[2].replace(/,(?=\\d{3}\\b)/g, '');
          const value = parseFloat(numStr.replace(/,/g, ''));
          return isNaN(value) ? null : { value, currencyRaw: (m[1] || '').trim(), raw: t.trim() };
        };
        const items = cards.map(card => {
          const asin = card.getAttribute('data-asin');
          const h2 = card.querySelector('h2');
          const titleAnchor = h2 ? h2.closest('a') : null;
          const titleText = h2 ? (h2.querySelector('span')?.textContent?.trim() || h2.textContent.trim()) : null;
          let rawHref = titleAnchor?.getAttribute('href') || card.querySelector('a[href*="/dp/"]')?.getAttribute('href') || null;
          let url = null;
          if (rawHref) {
            url = rawHref.startsWith('http') ? rawHref : origin + rawHref;
          }
          const img = card.querySelector('img.s-image');
          const priceOff = card.querySelector('.a-price:not(.a-text-price) .a-offscreen')?.textContent
            || card.querySelector('.a-price .a-offscreen')?.textContent;
          const listPriceOff = card.querySelector('.a-price.a-text-price .a-offscreen')?.textContent;
          const ratingText = card.querySelector('.a-icon-star-small .a-icon-alt')?.textContent
            || card.querySelector('[aria-label*="out of 5 stars"]')?.getAttribute('aria-label');
          const stars = parseNumber(ratingText);
          const reviewAria = card.querySelector('a[aria-label*="ratings"]')?.getAttribute('aria-label')
            || card.querySelector('a[aria-label*="rating"]')?.getAttribute('aria-label');
          const reviewCount = parseNumber(reviewAria || card.querySelector('.s-underline-text')?.textContent);
          const badges = Array.from(card.querySelectorAll('.a-badge-label')).map(b => ({
            label: b.querySelector('.a-badge-label-inner')?.textContent?.trim() || null,
            supp: b.querySelector('.a-badge-supplementary-text')?.textContent?.trim() || null
          }));
          const badgeTexts = badges.map(b => b.label).filter(Boolean).join(' | ');
          const isAmazonChoice = /Amazon\\u2019?s Choice|Amazon's Choice|Overall Pick/i.test(badgeTexts + ' ' + card.textContent.slice(0, 400));
          const isBestSeller = /Best Seller/i.test(badgeTexts);
          const sponsored = !!card.querySelector('.puis-sponsored-label-text')
            || !!card.querySelector('[aria-label="View Sponsored information or leave ad feedback"]');
          const deliveryEl = card.querySelector('[data-cy="delivery-recipe"]');
          let delivery = null;
          if (deliveryEl) {
            const clone = deliveryEl.cloneNode(true);
            clone.querySelectorAll('script, style').forEach(n => n.remove());
            delivery = clone.textContent.trim().replace(/\\s+/g, ' ');
            const m = delivery.match(/(FREE delivery[^A-Z]*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-zA-Z0-9,\\s]+)/i)
              || delivery.match(/(Delivery\\s+(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-zA-Z0-9,\\s]+)/i);
            delivery = m ? m[1].trim().slice(0, 200) : delivery.slice(0, 200);
          }
          const boughtInPast = (() => {
            const m = card.textContent.match(/([\\d.,]+K?\\+?\\s+bought in past month)/);
            return m ? m[1] : null;
          })();
          return {
            asin,
            uuid: card.getAttribute('data-uuid') || null,
            positionIndex: parseInt(card.getAttribute('data-index') || '0', 10) || null,
            title: titleText,
            url,
            image: img?.getAttribute('src') || null,
            imageAlt: img?.getAttribute('alt') || null,
            price: parsePrice(priceOff),
            listPrice: parsePrice(listPriceOff),
            stars,
            reviewCount,
            ratingRaw: ratingText || null,
            badges,
            isAmazonChoice,
            isBestSeller,
            isSponsored: sponsored,
            delivery,
            boughtInPast
          };
        });
        const currentPage = parseInt(document.querySelector('.s-pagination-selected')?.textContent || '1', 10) || 1;
        const nextEl = document.querySelector('a.s-pagination-next');
        const nextDisabled = !!document.querySelector('.s-pagination-next.s-pagination-disabled');
        const nextHref = nextEl?.getAttribute('href') || null;
        const nextPageUrl = nextHref && !nextDisabled ? (nextHref.startsWith('http') ? nextHref : origin + nextHref) : null;
        const totalMatch = (document.querySelector('.s-desktop-toolbar')?.textContent || document.body.textContent).match(/of\\s+(over\\s+)?([\\d,]+)\\s+results/i);
        const totalResultsApprox = totalMatch ? parseInt(totalMatch[2].replace(/,/g, ''), 10) : null;
        return JSON.stringify({
          currentPage,
          hasNextPage: !!nextPageUrl,
          nextPageUrl,
          totalResultsApprox,
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
