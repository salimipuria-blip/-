import argparse
import sys


def main():
    sys.stdout.reconfigure(encoding='utf-8', newline='\n')
    parser = argparse.ArgumentParser(description="Extract product detail data from an Etsy listing page")
    parser.add_argument('--include-description', default='true',
                        help="Whether to include full description text (true/false), default true")
    args = parser.parse_args()

    include_desc = 'true' if args.include_description.lower() != 'false' else 'false'

    js = r"""
    (function() {
      try {
        const includeDescription = %s;
        const listingIdMatch = location.pathname.match(/\/listing\/(\d+)/);
        if (!listingIdMatch) {
          return JSON.stringify({error: true, message: 'not a listing page', url: location.href});
        }
        const listingId = listingIdMatch[1];

        // Check for anti-bot
        const cap = document.querySelector('iframe[src*="captcha"], #show-human-auth');
        if (cap) {
          return JSON.stringify({error: true, message: 'blocked by anti-bot verification page', url: location.href});
        }

        const titleEl = document.querySelector('h1[data-buy-box-listing-title], h1');
        const title = titleEl ? titleEl.textContent.replace(/\s+/g, ' ').trim() : null;

        const priceContainerEl = document.querySelector('div[data-buy-box-region="price"]');
        let priceCurrent = null, priceOriginal = null, currency = null;
        if (priceContainerEl) {
          const srEls = priceContainerEl.querySelectorAll('.wt-screen-reader-only');
          srEls.forEach(el => {
            const t = el.textContent.replace(/\s+/g, ' ').trim();
            const cur = t.match(/(?:Sale Price|Price)[:\s]+([^\n]+)/i);
            const orig = t.match(/Original Price[:\s]+([^\n]+)/i);
            if (cur && !priceCurrent) priceCurrent = cur[1].trim();
            if (orig && !priceOriginal) priceOriginal = orig[1].trim();
          });
          if (!priceCurrent) {
            const pEl = priceContainerEl.querySelector('p');
            if (pEl) priceCurrent = pEl.textContent.replace(/\s+/g, ' ').trim();
          }
          const symbolEl = priceContainerEl.querySelector('.currency-symbol');
          if (symbolEl) currency = symbolEl.textContent.trim();
        }

        // Images (unique)
        const imgSet = new Set();
        document.querySelectorAll('li[data-carousel-pane] img, ul.image-carousel-container img').forEach(img => {
          const src = img.getAttribute('data-src-zoom-image') || img.getAttribute('data-src-delay') || img.src;
          if (src && src.includes('etsystatic')) imgSet.add(src);
        });
        const images = Array.from(imgSet);

        // Description
        let description = null;
        if (includeDescription) {
          const descEl = document.querySelector('[data-product-details-description-text-content], p[data-product-details-description-text-content]');
          description = descEl ? descEl.textContent.trim() : null;
        }

        // Shop
        const shopLinkEl = document.querySelector('a[href*="/shop/"]');
        const shopName = shopLinkEl ? shopLinkEl.textContent.replace(/\s+/g, ' ').trim() : null;
        const shopUrl = shopLinkEl ? shopLinkEl.href.split('?')[0] : null;

        const bodyText = document.body.innerText;

        // Rating - prefer .rating-value / .rating-score, fallback to text
        let rating = null;
        const ratingScoreEl = document.querySelector('.rating-value, .rating-score');
        if (ratingScoreEl) {
          const rt = ratingScoreEl.textContent.trim();
          const rm = rt.match(/(\d+(?:\.\d+)?)/);
          if (rm) rating = parseFloat(rm[1]);
        }

        // Review count from body text
        let reviewCount = null;
        const revMatch = bodyText.match(/\((\d[\d.,]*[kK]?)\s+reviews?\)/);
        if (revMatch) reviewCount = revMatch[1];
        if (!reviewCount) {
          const revMatch2 = bodyText.match(/(\d[\d,]*)\s+reviews?/i);
          if (revMatch2) reviewCount = revMatch2[1].replace(/,/g, '');
        }

        // Favorites
        let favorites = null;
        const favMatch = bodyText.match(/(\d[\d,]*)\s+favorites?/i);
        if (favMatch) favorites = parseInt(favMatch[1].replace(/,/g, ''), 10);

        // Basket/cart count
        let inCartCount = null;
        const basketMatch = bodyText.match(/(\d[\d,]*)\s+people?\s+have\s+this\s+in\s+their\s+(?:basket|carts?)/i);
        if (basketMatch) inCartCount = parseInt(basketMatch[1].replace(/,/g, ''), 10);

        // Variations
        const variations = [];
        document.querySelectorAll('select[id^="variation-selector"]').forEach(sel => {
          const labelledbyId = sel.getAttribute('aria-labelledby');
          let label = null;
          if (labelledbyId) {
            const lblEl = document.getElementById(labelledbyId);
            if (lblEl) label = lblEl.textContent.replace(/\s+/g, ' ').trim();
          }
          if (!label) {
            const lblFor = document.querySelector('label[for="' + sel.id + '"]');
            if (lblFor) label = lblFor.textContent.replace(/\s+/g, ' ').trim();
          }
          if (!label) label = sel.getAttribute('aria-label') || null;
          const options = Array.from(sel.options).map(opt => {
            const rawText = opt.textContent.replace(/\s+/g, ' ').trim();
            const priceInOpt = rawText.match(/\(([^)]+)\)/);
            const name = rawText.replace(/\s*\(([^)]+)\)\s*$/, '').trim();
            return {
              value: opt.value,
              text: name,
              priceRange: priceInOpt ? priceInOpt[1] : null
            };
          }).filter(o => o.text && o.text !== 'Select an option');
          variations.push({label, options});
        });

        // Highlights
        const highlights = [];
        document.querySelectorAll('[data-product-details-highlights-list] li, ul[data-listing-highlights] li').forEach(li => {
          const t = li.textContent.replace(/\s+/g, ' ').trim();
          if (t.length > 0 && t.length < 500) highlights.push(t);
        });

        // Related search tags
        const relatedTags = [];
        const seenTags = new Set();
        document.querySelectorAll('a[href*="/search?q="], a[href*="/market/"]').forEach(a => {
          const text = a.textContent.replace(/\s+/g, ' ').trim();
          if (text.length > 0 && text.length < 60 && !seenTags.has(text)) {
            seenTags.add(text);
            relatedTags.push({text, url: a.href.split('&')[0]});
          }
        });

        // Listed date - 'Listed on ...'
        let listedDate = null;
        const listedMatch = bodyText.match(/Listed on\s+([A-Za-z]+\s+\d+,\s+\d{4})/);
        if (listedMatch) listedDate = listedMatch[1].trim();

        return JSON.stringify({
          error: false,
          url: location.href,
          listingId,
          title,
          priceCurrent,
          priceOriginal,
          currency,
          imageCount: images.length,
          images,
          description,
          shopName,
          shopUrl,
          rating,
          reviewCount,
          favorites,
          inCartCount,
          variations,
          highlights,
          listedDate,
          relatedTags: relatedTags.slice(0, 50)
        });
      } catch (e) {
        return JSON.stringify({error: true, message: e.message, stack: e.stack ? e.stack.substring(0, 400) : null});
      }
    })()
    """ % include_desc
    print(js)


if __name__ == '__main__':
    main()
