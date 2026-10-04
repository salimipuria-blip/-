import argparse
import sys


def main():
    sys.stdout.reconfigure(encoding='utf-8', newline='\n')
    parser = argparse.ArgumentParser(description="Extract product listing cards from an Etsy search / category / shop page")
    args = parser.parse_args()

    js = r"""
    (function() {
      try {
        const cards = document.querySelectorAll('div.v2-listing-card[data-listing-id]');
        if (cards.length === 0) {
          const cap = document.querySelector('iframe[src*="captcha"], #show-human-auth');
          if (cap) {
            return JSON.stringify({error: true, message: 'blocked by anti-bot verification page', url: location.href});
          }
          return JSON.stringify({error: true, message: 'no listing cards found on page', url: location.href});
        }

        // Derive shop context from URL for shop pages
        let pageShopFromUrl = null;
        const shopUrlMatch = location.pathname.match(/^\/shop\/([^\/]+)/);
        if (shopUrlMatch) pageShopFromUrl = decodeURIComponent(shopUrlMatch[1]);

        const seen = new Set();
        const listings = [];
        cards.forEach((card) => {
          const listingId = card.getAttribute('data-listing-id');
          if (!listingId || seen.has(listingId)) return;
          seen.add(listingId);
          const shopId = card.getAttribute('data-shop-id');
          const link = card.querySelector('a[data-listing-link], a.v2-listing-card__img');
          const url = link ? link.href.split('?')[0] : null;

          // Title: prefer h3 or .v2-listing-card__title (clean), fallback to link aria-label
          let title = null;
          const titleH3 = card.querySelector('h3');
          const titleClass = card.querySelector('.v2-listing-card__title');
          if (titleH3) title = titleH3.textContent.replace(/\s+/g, ' ').trim();
          else if (titleClass) title = titleClass.textContent.replace(/\s+/g, ' ').trim();
          else if (link) title = (link.getAttribute('aria-label') || link.textContent.replace(/\s+/g, ' ').trim());

          const img = card.querySelector('img');
          const image = img ? (img.getAttribute('data-preload-lp-src') || img.getAttribute('data-src-delay') || img.src) : null;

          let salePrice = null, originalPrice = null;
          const priceSR = card.querySelectorAll('.wt-screen-reader-only');
          priceSR.forEach(el => {
            const t = el.textContent.replace(/\s+/g, ' ').trim();
            const saleMatch = t.match(/Sale Price\s+(.+)/i);
            const origMatch = t.match(/Original Price\s+(.+)/i);
            if (saleMatch) salePrice = saleMatch[1].trim();
            if (origMatch) originalPrice = origMatch[1].trim();
          });
          if (!salePrice) {
            const priceValEl = card.querySelector('.n-listing-card__price .currency-value, .currency-value');
            const symbolEl = card.querySelector('.n-listing-card__price .currency-symbol, .currency-symbol');
            if (priceValEl) {
              salePrice = (symbolEl ? symbolEl.textContent.trim() : '') + priceValEl.textContent.trim();
            }
          }

          let currency = null;
          const cSymbol = card.querySelector('.currency-symbol');
          if (cSymbol) currency = cSymbol.textContent.trim();

          let rating = null, reviewCount = null;
          const ratingContainer = card.querySelector('.shop-name-with-rating, .streamline-spacing-shop-rating');
          if (ratingContainer) {
            const t = ratingContainer.textContent.replace(/\s+/g, ' ').trim();
            const m = t.match(/(\d+(?:\.\d+)?)\s*\((\S+)\)/);
            if (m) { rating = parseFloat(m[1]); reviewCount = m[2]; }
          }

          const cardText = card.textContent.replace(/\s+/g, ' ').trim();

          // Shop name resolution priority:
          //  1. 'Ad by Etsy seller' / 'Ad from Etsy seller' — anonymized offsite ad, seller not exposed → null
          //  2. In-card 'Ad from shop / Made by' pattern (search / category with seller-attributed cards)
          //  3. '<name> From shop <name>' pattern (standard non-ad cards)
          //  4. Anchor to '/shop/<name>' inside the card
          //  5. Page-level shop context from URL (shop storefront pages)
          const isAnonymizedAd = /Ad (?:by|from) Etsy seller/i.test(cardText);
          let shopName = null;
          if (!isAnonymizedAd) {
            const shopMatch = cardText.match(/(?:Ad from shop|Made by)\s+([A-Za-z0-9_.-]+)/);
            if (shopMatch) shopName = shopMatch[1];
            if (!shopName) {
              const fromShopMatch = cardText.match(/From shop\s+([A-Za-z0-9_.-]+)/);
              if (fromShopMatch) shopName = fromShopMatch[1];
            }
            if (!shopName) {
              const shopAnchor = card.querySelector('a[href*="/shop/"]');
              if (shopAnchor) {
                const m2 = shopAnchor.href.match(/\/shop\/([^\/?]+)/);
                if (m2) shopName = decodeURIComponent(m2[1]);
              }
            }
            if (!shopName && pageShopFromUrl) shopName = pageShopFromUrl;
          }

          const isAd = /Ad from shop|Ad by|Ad from Etsy/i.test(cardText);
          const freeShipping = /Free shipping|FREE shipping/i.test(cardText);

          const badgeEl = card.querySelector('clg-signal, .rank-badge');
          const badge = badgeEl ? badgeEl.textContent.replace(/\s+/g, ' ').trim() : null;

          const dataIndex = card.querySelector('[data-index]');
          const positionIdx = dataIndex ? parseInt(dataIndex.getAttribute('data-index'), 10) : null;

          listings.push({
            listingId,
            shopId,
            title,
            url,
            image,
            salePrice,
            originalPrice,
            currency,
            rating,
            reviewCount,
            shopName,
            isAd,
            freeShipping,
            badge,
            positionIndex: positionIdx
          });
        });

        const pagLinks = document.querySelectorAll('.search-pagination a[href*="page="], a[href*="items-pagination"]');
        let nextPageUrl = null, currentPage = null;
        pagLinks.forEach(a => {
          const text = a.textContent.replace(/\s+/g, ' ').trim();
          if ((text === 'Next' || text === 'Next page') && a.href) {
            nextPageUrl = a.href;
          }
        });
        const urlPage = new URL(location.href).searchParams.get('page');
        currentPage = urlPage ? parseInt(urlPage, 10) : 1;

        return JSON.stringify({
          error: false,
          url: location.href,
          currentPage,
          count: listings.length,
          nextPageUrl,
          listings
        });
      } catch (e) {
        return JSON.stringify({error: true, message: e.message, stack: e.stack ? e.stack.substring(0, 400) : null});
      }
    })()
    """
    print(js)


if __name__ == '__main__':
    main()
