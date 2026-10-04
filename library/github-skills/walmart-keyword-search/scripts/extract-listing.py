import argparse
import sys


def main():
    sys.stdout.reconfigure(encoding='utf-8', newline='\n')
    parser = argparse.ArgumentParser()
    args = parser.parse_args()

    js = r"""
(function() {
  try {
    var sr = window.__NEXT_DATA__ && window.__NEXT_DATA__.props && window.__NEXT_DATA__.props.pageProps && window.__NEXT_DATA__.props.pageProps.initialData && window.__NEXT_DATA__.props.pageProps.initialData.searchResult;
    if (!sr) return JSON.stringify({error: true, message: 'No searchResult in __NEXT_DATA__. Ensure the page is fully loaded at the correct search URL.'});

    var seen = {};
    var items = [];
    var stacks = sr.itemStacks || [];
    for (var si = 0; si < stacks.length; si++) {
      var stack = stacks[si];
      var stackItems = stack.items || [];
      for (var ii = 0; ii < stackItems.length; ii++) {
        var item = stackItems[ii];
        if (!item.usItemId || seen[item.usItemId]) continue;
        seen[item.usItemId] = true;
        var canonUrl = item.canonicalUrl || null;
        var cleanUrl = canonUrl ? 'https://www.walmart.com' + canonUrl.split('?')[0] : null;
        var price = item.price || (item.priceInfo && item.priceInfo.currentPrice && item.priceInfo.currentPrice.price) || null;
        var priceStr = (item.priceInfo && (item.priceInfo.linePriceDisplay || (item.priceInfo.currentPrice && item.priceInfo.currentPrice.priceString))) || null;
        var wasPrice = (item.priceInfo && item.priceInfo.wasPrice && item.priceInfo.wasPrice.price) || null;
        var avail = (item.availabilityStatusV2 && item.availabilityStatusV2.value) || item.availabilityStatus || null;
        var availText = (item.availabilityStatusV2 && item.availabilityStatusV2.display) || null;
        items.push({
          itemId: item.usItemId,
          url: cleanUrl,
          title: item.name || null,
          brand: item.brand || null,
          image: (item.imageInfo && item.imageInfo.thumbnailUrl) || null,
          price: price,
          priceString: priceStr,
          wasPrice: wasPrice,
          rating: item.averageRating || null,
          reviewCount: item.numberOfReviews || null,
          availability: avail,
          availabilityText: availText,
          sellerName: item.sellerName || null,
          sellerType: item.sellerType || null,
          fulfillmentBadge: item.fulfillmentBadge || null,
          classType: item.classType || null,
          shortDescription: item.shortDescription || null
        });
      }
    }

    var primaryStack = stacks[0] || {};
    var pag = sr.paginationV2 || {};
    var pageProps = pag.pageProperties || {};
    return JSON.stringify({
      pageType: pageProps.pageType || null,
      query: pageProps.query || null,
      currentPage: pageProps.page || null,
      totalCount: primaryStack.count || 0,
      maxPage: pag.maxPage || 1,
      itemCount: items.length,
      items: items
    });
  } catch(e) {
    return JSON.stringify({error: true, message: e.message});
  }
})()
"""
    print(js)


if __name__ == '__main__':
    main()
