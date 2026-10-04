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
        const titleEl = document.querySelector('#productTitle');
        if (!titleEl) {
          const has404 = document.body.textContent.includes("we couldn't find that page") || document.body.textContent.includes('Page Not Found');
          return JSON.stringify({ error: true, message: has404 ? 'product_not_found: 404 page' : 'productTitle not found - page may not be a product detail page' });
        }
        const asin = (location.pathname.match(/\\/dp\\/([A-Z0-9]{10})/) || location.pathname.match(/\\/gp\\/product\\/([A-Z0-9]{10})/) || [])[1] || null;
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
        // Price: multiple selectors, take first non-empty
        const priceSelectors = [
          '#corePriceDisplay_desktop_feature_div .a-price:not(.a-text-price):not([data-a-strike="true"]) .a-offscreen',
          '#apex_desktop .a-price:not(.a-text-price):not([data-a-strike="true"]) .a-offscreen',
          '#corePrice_feature_div .a-price:not(.a-text-price):not([data-a-strike="true"]) .a-offscreen',
          '.a-price:not(.a-text-price):not([data-a-strike="true"]) .a-offscreen'
        ];
        let priceText = null;
        for (const s of priceSelectors) {
          const el = document.querySelector(s);
          if (el && el.textContent.trim()) { priceText = el.textContent.trim(); break; }
        }
        const listPriceText = document.querySelector('.basisPrice .a-price .a-offscreen')?.textContent
          || document.querySelector('span[data-a-strike="true"] .a-offscreen')?.textContent
          || document.querySelector('.a-price.a-text-price .a-offscreen')?.textContent
          || null;
        // Availability / stock
        const availabilityEl = document.querySelector('#availability span') || document.querySelector('#availability');
        const availabilityText = availabilityEl?.textContent?.trim().split(/\\{|\\n/)[0].trim() || null;
        const inStock = availabilityText ? /in stock|available/i.test(availabilityText) && !/unavailable|out of stock/i.test(availabilityText) : null;
        // Rating
        const ratingRaw = document.querySelector('#acrPopover')?.getAttribute('title')
          || document.querySelector('[data-hook="rating-out-of-text"]')?.textContent
          || null;
        const stars = parseNumber(ratingRaw);
        const reviewCountText = document.querySelector('#acrCustomerReviewText')?.textContent?.trim();
        const reviewsCount = parseNumber(reviewCountText);
        // Answered questions
        const aqText = document.querySelector('#askATFLink .a-size-base')?.textContent
          || document.querySelector('a[href*="/ask/questions"]')?.textContent
          || null;
        const answeredQuestions = aqText && /\\d/.test(aqText) ? parseNumber(aqText) : null;
        // Brand
        const bylineText = document.querySelector('#bylineInfo')?.textContent?.trim();
        let brand = null;
        if (bylineText) {
          const m = bylineText.match(/(?:Brand:|Visit the|Store):?\\s*([^\\n]+?)(?:Store)?\\s*$/i);
          brand = m ? m[1].trim() : bylineText.replace(/^Brand:\\s*/i, '').replace(/\\s*Store$/i, '').trim();
          if (brand && brand.length > 80) brand = null;
        }
        // Breadcrumbs
        const breadCrumbs = Array.from(document.querySelectorAll('#wayfinding-breadcrumbs_feature_div a')).map(a => a.textContent.trim()).filter(Boolean);
        // Feature bullets
        const features = Array.from(document.querySelectorAll('#feature-bullets ul li:not(.aok-hidden) span'))
          .map(s => s.textContent.trim().replace(/\\s+/g, ' '))
          .filter(t => t.length > 0 && !/^\\s*$/.test(t));
        // Description
        const description = (document.querySelector('#productDescription')?.textContent?.trim().replace(/\\s+/g, ' ')) || null;
        // Book description (Kindle/books)
        const bookDescription = document.querySelector('#bookDescription_feature_div')?.textContent?.trim().replace(/\\s+/g, ' ') || null;
        // Images
        const thumbnailImage = document.querySelector('#landingImage')?.src || document.querySelector('#imgTagWrapperId img')?.src || null;
        const dataDynamic = document.querySelector('#imgTagWrapperId img')?.getAttribute('data-a-dynamic-image');
        let highResolutionImages = [];
        if (dataDynamic) {
          try {
            const map = JSON.parse(dataDynamic);
            highResolutionImages = Object.keys(map);
          } catch (_) {}
        }
        const galleryThumbnails = Array.from(document.querySelectorAll('#altImages img')).map(i => i.src).filter(Boolean);
        // Attributes - Overview table (Brand, Model, etc.)
        const productOverview = Array.from(document.querySelectorAll('#productOverview_feature_div table tr')).map(tr => {
          const cells = tr.querySelectorAll('td');
          return { key: cells[0]?.textContent.trim(), value: cells[1]?.textContent.trim() };
        }).filter(x => x.key);
        // Attributes - Tech spec / detail bullets
        const attributes = Array.from(document.querySelectorAll('#productDetails_techSpec_section_1 tr, #productDetails_techSpec_section_2 tr, #productDetails_detailBullets_sections1 tr, .prodDetTable tr')).map(tr => {
          const th = tr.querySelector('th')?.textContent.trim();
          const td = tr.querySelector('td')?.textContent.trim().replace(/\\s+/g, ' ');
          return { key: th, value: td };
        }).filter(x => x.key);
        // Detail bullets (fallback structured list)
        const detailBullets = Array.from(document.querySelectorAll('#detailBullets_feature_div li:not(.zg_hrsr_item)')).map(li => {
          const t = li.textContent.trim().replace(/\\s+/g, ' ');
          const parts = t.split(':');
          if (parts.length >= 2) {
            return { key: parts[0].trim(), value: parts.slice(1).join(':').trim() };
          }
          return null;
        }).filter(Boolean);
        // Merge into flat attributesMapped
        const attributesMapped = {};
        productOverview.forEach(x => { if (x.key) attributesMapped[x.key] = x.value; });
        attributes.forEach(x => { if (x.key) attributesMapped[x.key] = x.value; });
        detailBullets.forEach(x => { if (x.key) attributesMapped[x.key] = x.value; });
        // Bestseller Ranks - inside detailBullets or productDetails
        const bestsellerRanks = [];
        document.querySelectorAll('li, tr').forEach(row => {
          const text = row.textContent;
          if (/Best Sellers Rank/i.test(text)) {
            const links = Array.from(row.querySelectorAll('a')).map(a => ({ category: a.textContent.trim(), url: a.getAttribute('href') }));
            const rankMatches = text.match(/#[\\d,]+\\s+in\\s+[^(#\\n)]+/g) || [];
            rankMatches.forEach((rm, i) => {
              const nm = rm.match(/#([\\d,]+)\\s+in\\s+(.+)/);
              if (nm) {
                const link = links[i];
                bestsellerRanks.push({
                  rank: parseInt(nm[1].replace(/,/g, ''), 10),
                  category: nm[2].trim().replace(/See Top 100.*$/i, '').trim(),
                  url: link ? (link.url && link.url.startsWith('http') ? link.url : (link?.url ? origin + link.url : null)) : null
                });
              }
            });
          }
        });
        // Ratings histogram (percent per star)
        const starsBreakdown = {};
        Array.from(document.querySelectorAll('[aria-label*="percent of reviews have"]')).forEach(el => {
          const aria = el.getAttribute('aria-label');
          const m = aria.match(/(\\d+)\\s+percent of reviews have\\s+(\\d)\\s+stars?/i);
          if (m) starsBreakdown[m[2] + ' star'] = parseInt(m[1], 10);
        });
        // Variant attributes (Color/Size/Style currently selected)
        const variantAttributes = Array.from(document.querySelectorAll('[id^="variation_"]')).map(row => {
          const label = row.querySelector('.a-form-label')?.textContent?.trim().replace(/:$/, '') || null;
          const value = row.querySelector('.selection')?.textContent?.trim() || null;
          if (!label) return null;
          return { key: label, value };
        }).filter(Boolean);
        // Variant ASINs (from swatches / twister)
        const variantAsins = Array.from(new Set(Array.from(document.querySelectorAll('#twister li[data-asin], #twister li[data-defaultasin], #twister li[data-dp-url], #twister_feature_div li[data-asin], #twister_feature_div li[data-defaultasin], #twister_feature_div li[data-dp-url]'))
          .map(li => li.getAttribute('data-asin')
            || li.getAttribute('data-defaultasin')
            || (li.getAttribute('data-dp-url') || '').match(/\\/dp\\/([A-Z0-9]{10})/)?.[1])
          .filter(Boolean)));
        // Seller / merchant
        const sellerName = document.querySelector('#sellerProfileTriggerId')?.textContent?.trim() || null;
        const sellerHref = document.querySelector('#sellerProfileTriggerId')?.getAttribute('href') || null;
        const sellerId = sellerHref ? (sellerHref.match(/seller=([A-Z0-9]+)/) || [])[1] || null : null;
        // Amazon's Choice badge
        const acBadge = document.querySelector('.ac-badge-rectangle')?.textContent?.trim() || null;
        const isAmazonChoice = !!acBadge;
        // Bought volume
        const boughtVolume = document.querySelector('#social-proofing-faceout-title-tk_bought')?.textContent?.trim()
          || (document.body.textContent.match(/(\\d[\\d.,K+]*\\s+bought in past month)/) || [])[1]
          || null;
        // Delivery
        const delivery = document.querySelector('#mir-layout-DELIVERY_BLOCK-slot-PRIMARY_DELIVERY_MESSAGE_LARGE')?.textContent?.trim()
          || document.querySelector('#deliveryBlockMessage')?.textContent?.trim().replace(/\\s+/g, ' ')
          || null;
        const fastestDelivery = document.querySelector('#mir-layout-DELIVERY_BLOCK-slot-SECONDARY_DELIVERY_MESSAGE_LARGE')?.textContent?.trim() || null;
        // Return policy
        const returnPolicy = document.querySelector('#returnsInfoFeature_feature_div')?.textContent?.trim().replace(/\\s+/g, ' ').slice(0, 250)
          || document.querySelector('[data-hook="return-info"]')?.textContent?.trim() || null;
        // Videos count
        const videosCount = document.querySelectorAll('#altImages li.video, #altImages li video').length || null;
        // Location text
        const locationText = document.querySelector('#glow-ingress-line2')?.textContent?.trim() || null;
        // A+ content presence
        const hasAPlusContent = !!document.querySelector('#aplus') || !!document.querySelector('.aplus-v2');
        const hasBrandStory = !!document.querySelector('#brand-snapshot_feature_div') || !!document.querySelector('.brand-snapshot-container');
        // AI review summary
        const aiReviewsSummary = document.querySelector('[data-hook="cr-summary-widget"]')?.textContent?.trim().replace(/\\s+/g, ' ').slice(0, 500)
          || document.querySelector('#product-summary')?.textContent?.trim().replace(/\\s+/g, ' ').slice(0, 500)
          || null;
        // Reviews link
        const reviewsLink = document.querySelector('a[data-hook="see-all-reviews-link-foot"]')?.href
          || (document.querySelector('#acrCustomerReviewLink')?.href)
          || (asin ? origin + '/product-reviews/' + asin : null);
        // Sample product page reviews
        const productPageReviews = Array.from(document.querySelectorAll('[data-hook="review"]')).slice(0, 10).map(r => ({
          username: r.querySelector('.a-profile-name')?.textContent?.trim() || null,
          ratingScore: parseNumber(r.querySelector('[data-hook="review-star-rating"] .a-icon-alt, [data-hook="cmps-review-star-rating"] .a-icon-alt')?.textContent),
          reviewTitle: r.querySelector('[data-hook="review-title"] span:not([class])')?.textContent?.trim() || r.querySelector('[data-hook="review-title"]')?.textContent?.trim(),
          reviewDescription: r.querySelector('[data-hook="review-body"] span')?.textContent?.trim(),
          date: r.querySelector('[data-hook="review-date"]')?.textContent?.trim()
        }));
        return JSON.stringify({
          asin,
          url: location.origin + location.pathname,
          title: titleEl.textContent.trim(),
          brand: brand || attributesMapped['Brand'] || attributesMapped['Brand Name'] || attributesMapped['Manufacturer'] || null,
          price: parsePrice(priceText),
          listPrice: parsePrice(listPriceText),
          stars,
          reviewsCount,
          starsBreakdown,
          answeredQuestions,
          inStock,
          inStockText: availabilityText,
          delivery,
          fastestDelivery,
          returnPolicy,
          breadCrumbs: breadCrumbs.join(' > '),
          features,
          description,
          bookDescription,
          thumbnailImage,
          highResolutionImages,
          galleryThumbnails,
          productOverview,
          attributes,
          attributesMapped,
          bestsellerRanks,
          variantAttributes,
          variantAsins,
          seller: sellerName ? { name: sellerName, id: sellerId, url: sellerHref && !sellerHref.startsWith('http') ? origin + sellerHref : sellerHref } : null,
          isAmazonChoice,
          amazonChoiceText: acBadge,
          monthlyPurchaseVolume: boughtVolume,
          hasAPlusContent,
          hasBrandStory,
          aiReviewsSummary,
          reviewsLink,
          productPageReviews,
          videosCount,
          locationText,
          loadedCountryCode: (location.hostname.match(/amazon\\.([a-z.]+)$/) || [])[1] || null
        });
      } catch (e) {
        return JSON.stringify({ error: true, message: e.message });
      }
    })()
    """
    print(js)


if __name__ == '__main__':
    main()
