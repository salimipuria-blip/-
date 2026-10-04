import argparse
import sys


def main():
    sys.stdout.reconfigure(encoding='utf-8', newline='\n')
    parser = argparse.ArgumentParser(description='Extract sold-listing cards from an eBay search results page (already navigated).')
    parser.add_argument('--keyword', default='', help='Original search keyword to tag each result (optional; passthrough only).')
    args = parser.parse_args()

    keyword_json = args.keyword.replace('\\', '\\\\').replace('"', '\\"')

    js = f"""
    (function() {{
      try {{
        const KEYWORD = "{keyword_json}";

        const CONDITION_ID_LOOKUP = {{
          "new": 1000, "brand new": 1000, "neu": 1000, "neuf": 1000, "nuovo": 1000, "nuevo": 1000,
          "new other (see details)": 1500, "new other": 1500, "open box": 1500, "opened – never used": 1500, "opened - never used": 1500, "neu (sonstige)": 1500, "neuf (autre)": 1500, "nuovo (altro)": 1500, "nuevo (otro)": 1500,
          "new with defects": 1750,
          "certified refurbished": 2000, "excellent - refurbished": 2010, "very good - refurbished": 2020, "good - refurbished": 2030,
          "seller refurbished": 2500, "runderneuert": 2500, "reconditionné": 2500, "ricondizionato": 2500, "reacondicionado": 2500,
          "like new": 2750,
          "used": 3000, "pre-owned": 3000, "pre owned": 3000, "gebraucht": 3000, "occasion": 3000, "usato": 3000, "usado": 3000,
          "for parts or not working": 7000, "parts only": 7000, "nur ersatzteile": 7000, "pour pièces ou ne fonctionnant pas": 7000, "solo per parti o non funzionante": 7000, "para piezas o no funciona": 7000
        }};

        const SELLER_TYPE_LOOKUP = {{
          "private": "private", "privat": "private", "particulier": "private", "privato": "private", "particular": "private",
          "business": "business", "gewerblich": "business", "professionnel": "business", "azienda": "business", "empresa": "business", "commercial": "business"
        }};

        const CURRENCY_MAP = {{
          "$": "USD", "US $": "USD", "£": "GBP", "€": "EUR", "EUR": "EUR", "AU $": "AUD", "AU$": "AUD", "C $": "CAD", "C$": "CAD", "CA$": "CAD"
        }};

        const parsePrice = (text) => {{
          if (!text) return {{ amount: null, currency: null }};
          const t = text.trim();
          const currMatch = t.match(/(?:US\\s*\\$|AU\\s*\\$|C\\s*\\$|CA\\$|\\$|£|€|EUR|GBP|USD|AUD|CAD)/i);
          const rawCurr = currMatch ? currMatch[0].trim().toUpperCase().replace(/\\s+/g, ' ') : null;
          let currency = null;
          if (rawCurr) {{
            for (const [k, v] of Object.entries(CURRENCY_MAP)) {{
              if (rawCurr.replace(/\\s+/g, '') === k.replace(/\\s+/g, '').toUpperCase()) {{ currency = v; break; }}
            }}
          }}
          const cleaned = t.replace(/[^0-9.,-]/g, '');
          if (!cleaned) return {{ amount: null, currency }};
          let normalized;
          if (cleaned.includes(',') && cleaned.includes('.')) {{
            if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) normalized = cleaned.replace(/\\./g, '').replace(',', '.');
            else normalized = cleaned.replace(/,/g, '');
          }} else if (cleaned.includes(',')) {{
            const parts = cleaned.split(',');
            if (parts.length === 2 && parts[1].length <= 2) normalized = cleaned.replace(',', '.');
            else normalized = cleaned.replace(/,/g, '');
          }} else {{
            normalized = cleaned;
          }}
          const n = parseFloat(normalized);
          return {{ amount: isNaN(n) ? null : n.toFixed(2), currency }};
        }};

        const parseSoldDate = (captionText) => {{
          if (!captionText) return null;
          const t = captionText.replace(/\\s+/g, ' ').trim();
          const cleaned = t.replace(/^(Sold|Verkauft|Vendu|Venduto|Vendido)\\s+/i, '').trim();
          const months = {{
            jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
            januar: 0, februar: 1, marz: 2, april: 3, mai: 4, juni: 5, juli: 6, august: 7, september: 8, oktober: 9, november: 10, dezember: 11,
            janv: 0, fevr: 1, mars: 2, avr: 3, juin: 5, juil: 6, aout: 7, oct: 9, dec: 11,
            gen: 0, feb: 1, mar: 2, apr: 3, mag: 4, giu: 5, lug: 6, ago: 7, set: 8, ott: 9, nov: 10, dic: 11,
            ene: 0, febr: 1, marzo: 2, abr: 3, mayo: 4, junio: 5, julio: 6, agosto: 7, sept: 8, oct: 9, nov: 10, dic: 11
          }};
          let m = cleaned.match(/(\\d{{1,2}})\\.?\\s+([A-Za-zàäéèêöüßáíóúñçÀÄÉÈÊÖÜÁÍÓÚÑÇ]+)\\.?\\s+(\\d{{4}})/);
          if (m) {{
            const day = parseInt(m[1], 10);
            const monKey = m[2].toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').slice(0, 4);
            const year = parseInt(m[3], 10);
            let mon = months[monKey.slice(0,3)] ?? months[monKey];
            if (mon === undefined) {{
              for (const k of Object.keys(months)) {{ if (monKey.startsWith(k)) {{ mon = months[k]; break; }} }}
            }}
            if (mon !== undefined) return new Date(Date.UTC(year, mon, day)).toISOString();
          }}
          m = cleaned.match(/([A-Za-z]+)\\s+(\\d{{1,2}}),?\\s+(\\d{{4}})/);
          if (m) {{
            const monKey = m[1].toLowerCase().slice(0, 4);
            let mon = months[monKey.slice(0,3)] ?? months[monKey];
            if (mon === undefined) {{
              for (const k of Object.keys(months)) {{ if (monKey.startsWith(k)) {{ mon = months[k]; break; }} }}
            }}
            const day = parseInt(m[2], 10);
            const year = parseInt(m[3], 10);
            if (mon !== undefined) return new Date(Date.UTC(year, mon, day)).toISOString();
          }}
          return null;
        }};

        const parseSubtitle = (subtitleText) => {{
          if (!subtitleText) return {{ condition: null, sellerType: null }};
          const parts = subtitleText.split(/[|·]/).map(p => p.trim()).filter(Boolean);
          let condition = null;
          let sellerType = null;
          for (const p of parts) {{
            const key = p.toLowerCase();
            if (SELLER_TYPE_LOOKUP[key]) sellerType = SELLER_TYPE_LOOKUP[key];
            else if (!condition) condition = p;
          }}
          if (condition) {{
            const lower = condition.toLowerCase();
            for (const k of Object.keys(CONDITION_ID_LOOKUP)) {{ if (lower === k) return {{ condition, conditionId: CONDITION_ID_LOOKUP[k], sellerType }}; }}
            for (const k of Object.keys(CONDITION_ID_LOOKUP)) {{ if (lower.includes(k)) return {{ condition, conditionId: CONDITION_ID_LOOKUP[k], sellerType }}; }}
            return {{ condition, conditionId: null, sellerType }};
          }}
          return {{ condition: null, conditionId: null, sellerType }};
        }};

        const detectBidCount = (attrs) => {{
          for (const a of attrs) {{
            const m = a.match(/^(\\d+)\\s+(bids?|Gebote?|enchères?|offerte?|pujas?)/i);
            if (m) return parseInt(m[1], 10);
          }}
          return null;
        }};

        const detectShipping = (attrs) => {{
          const shippingLine = attrs.find(a =>
            /delivery|shipping|Versand|livraison|spedizione|envío|envio/i.test(a)
          );
          if (!shippingLine) return {{ shippingPrice: null, shippingCurrency: null, shippingType: 'unknown' }};
          if (/free|kostenlos|gratuit|gratis|gratuito/i.test(shippingLine)) {{
            return {{ shippingPrice: '0.00', shippingCurrency: null, shippingType: 'free' }};
          }}
          if (/pickup|abholung|retrait|ritiro|recogida/i.test(shippingLine)) {{
            return {{ shippingPrice: null, shippingCurrency: null, shippingType: 'pickup' }};
          }}
          if (/Keine Angaben|not specified|no especificado|non spécifié|non specificato/i.test(shippingLine)) {{
            return {{ shippingPrice: null, shippingCurrency: null, shippingType: 'unknown' }};
          }}
          const p = parsePrice(shippingLine);
          if (p.amount !== null) return {{ shippingPrice: p.amount, shippingCurrency: p.currency, shippingType: 'paid' }};
          return {{ shippingPrice: null, shippingCurrency: null, shippingType: 'unknown' }};
        }};

        const detectBuyingFormat = (attrs, priceHasStrikethrough) => {{
          const attrsLower = attrs.map(a => a.toLowerCase());
          const hasBids = attrsLower.some(a => /^\\d+\\s+(bids?|gebote|enchères|offerte|pujas)/.test(a));
          const hasBIN = attrsLower.some(a => /buy it now|sofort-kaufen|achat immédiat|compralo subito|cómpralo ahora/i.test(a));
          const hasBOAText = attrsLower.some(a => /best offer accepted|preisvorschlag angenommen|meilleure offre acceptée|migliore offerta accettata|mejor oferta aceptada/i.test(a));
          const hasOrBestOffer = attrsLower.some(a => /or best offer|oder preisvorschlag|ou meilleure offre|o proposta|o mejor oferta/i.test(a));

          let listingType = null;
          let isBestOfferAccepted = false;
          let buyingFormat = null;

          if (hasBOAText || (priceHasStrikethrough && !hasBids)) {{
            listingType = 'best_offer_accepted';
            isBestOfferAccepted = true;
            buyingFormat = 'buyItNow';
          }} else if (hasBids && hasBIN) {{
            listingType = 'auction';
            buyingFormat = 'auctionWithBIN';
          }} else if (hasBids) {{
            listingType = 'auction';
            buyingFormat = 'auction';
          }} else if (hasBIN || hasOrBestOffer) {{
            listingType = 'buy_it_now';
            buyingFormat = 'buyItNow';
          }}

          return {{ listingType, isBestOfferAccepted, buyingFormat }};
        }};

        const parseSeller = (attrs) => {{
          for (const a of attrs) {{
            const m = a.match(/([\\w.\\-*_]+)\\s+(\\d+(?:[.,]\\d+)?)\\s*%\\s*(positive|positiv|positivo|positivos|positif)\\s*\\(([\\d.,]+[KkMm]?)\\)/i);
            if (m) {{
              const scoreRaw = m[4].toUpperCase();
              let score;
              if (scoreRaw.endsWith('K')) score = Math.round(parseFloat(scoreRaw) * 1000);
              else if (scoreRaw.endsWith('M')) score = Math.round(parseFloat(scoreRaw) * 1000000);
              else score = parseInt(scoreRaw.replace(/[.,]/g, ''), 10);
              const posPct = parseFloat(m[2].replace(',', '.'));
              return {{ sellerUsername: m[1], sellerPositivePercent: isNaN(posPct) ? null : posPct, sellerFeedbackScore: isNaN(score) ? null : score }};
            }}
          }}
          return {{ sellerUsername: null, sellerPositivePercent: null, sellerFeedbackScore: null }};
        }};

        const buildFullRes = (thumbUrl) => {{
          if (!thumbUrl || !thumbUrl.includes('i.ebayimg.com')) return null;
          try {{
            return thumbUrl.replace(/s-l\\d+/, 's-l1600');
          }} catch(e) {{ return null; }}
        }};

        const cards = Array.from(document.querySelectorAll('li.s-card'));
        if (cards.length === 0) {{
          return JSON.stringify({{ error: true, message: 'no s-card elements found; page may be blocked or not an eBay search results page' }});
        }}

        const headingText = document.querySelector('.srp-controls__count-heading')?.textContent?.trim() || null;
        const currentUrl = window.location.href;
        const urlObj = new URL(currentUrl);
        const categoryId = urlObj.searchParams.get('_sacat') || null;

        const categoryLabel = (() => {{
          const sel = document.querySelector('select[name=_sacat]');
          if (!sel) return null;
          const opt = sel.querySelector('option[selected]') || sel.options[sel.selectedIndex];
          return opt?.textContent?.trim() || null;
        }})();

        const nowIso = new Date().toISOString();
        const items = [];

        for (const card of cards) {{
          try {{
            const listingId = card.getAttribute('data-listingid');
            if (!listingId) continue;
            const titleEl = card.querySelector('.s-card__title');
            const title = titleEl?.textContent?.trim() || null;
            if (!title || title === 'Shop on eBay') continue;

            const linkEl = card.querySelector('a.su-link[href*="/itm/"], a[href*="/itm/"]');
            const rawUrl = linkEl?.href || null;
            let url = rawUrl;
            let itemId = listingId;
            if (rawUrl) {{
              try {{
                const u = new URL(rawUrl);
                const pathMatch = u.pathname.match(/\\/itm\\/(?:.+?\\/)?(\\d+)/);
                if (pathMatch) itemId = pathMatch[1];
                url = `${{u.protocol}}//${{u.host}}${{u.pathname}}`;
              }} catch(_) {{}}
            }}

            const priceEl = card.querySelector('.s-card__price');
            const priceText = priceEl?.textContent?.trim() || '';
            const priceClass = priceEl?.className || '';
            const priceHasStrikethrough = priceClass.includes('strikethrough') || card.querySelectorAll('.s-card__price .STRIKETHROUGH, .s-card__price [class*="strike"]').length > 0;
            const priceParsed = parsePrice(priceText);

            const captionEl = card.querySelector('.s-card__caption');
            const captionText = captionEl?.textContent?.trim() || '';
            const endedAt = parseSoldDate(captionText);

            const subtitleEl = card.querySelector('.s-card__subtitle');
            const subtitleText = subtitleEl?.textContent?.trim() || '';
            const subtitleParsed = parseSubtitle(subtitleText);

            const attrRows = Array.from(card.querySelectorAll('.s-card__attribute-row')).map(a => a.textContent.trim()).filter(Boolean);

            const bidCount = detectBidCount(attrRows);
            const {{ shippingPrice, shippingCurrency, shippingType }} = detectShipping(attrRows);
            const {{ listingType, isBestOfferAccepted, buyingFormat }} = detectBuyingFormat(attrRows, priceHasStrikethrough);
            const seller = parseSeller(attrRows);

            const imgEl = card.querySelector('img');
            const thumbnailUrl = imgEl?.src || null;
            const fullResThumbnailUrl = buildFullRes(thumbnailUrl);

            let totalPrice = priceParsed.amount;
            if (priceParsed.amount !== null && shippingPrice !== null && shippingPrice !== '0.00' && priceParsed.currency === (shippingCurrency || priceParsed.currency)) {{
              const sum = parseFloat(priceParsed.amount) + parseFloat(shippingPrice);
              totalPrice = sum.toFixed(2);
            }} else if (priceParsed.amount !== null && shippingType === 'free') {{
              totalPrice = priceParsed.amount;
            }}

            items.push({{
              itemId,
              url,
              title,
              condition: subtitleParsed.condition,
              conditionId: subtitleParsed.conditionId,
              categoryId,
              category: categoryLabel,
              endedAt,
              soldPrice: priceParsed.amount,
              soldCurrency: priceParsed.currency,
              listingType,
              isBestOfferAccepted,
              buyingFormat,
              bidCount,
              shippingPrice,
              shippingCurrency,
              shippingType,
              totalPrice,
              thumbnailUrl,
              fullResThumbnailUrl,
              sellerUsername: seller.sellerUsername,
              sellerPositivePercent: seller.sellerPositivePercent,
              sellerFeedbackScore: seller.sellerFeedbackScore,
              sellerType: subtitleParsed.sellerType,
              keyword: KEYWORD || null,
              scrapedAt: nowIso
            }});
          }} catch(itemErr) {{
            continue;
          }}
        }}

        const nextLink = document.querySelector('a[type=next], a[rel=next], .pagination__next a');
        const nextUrl = nextLink?.href || null;

        return JSON.stringify({{
          error: false,
          pageUrl: currentUrl,
          heading: headingText,
          categoryId,
          category: categoryLabel,
          itemCount: items.length,
          hasNextPage: !!nextUrl,
          nextUrl,
          items
        }});
      }} catch(e) {{
        return JSON.stringify({{ error: true, message: e.message, stack: (e.stack||'').slice(0,500) }});
      }}
    }})()
    """
    print(js)


if __name__ == '__main__':
    main()
