import argparse
import sys


def main():
    sys.stdout.reconfigure(encoding='utf-8', newline='\n')
    parser = argparse.ArgumentParser()
    args = parser.parse_args()

    js = r"""
(function() {
  try {
    var data = window.__NEXT_DATA__ && window.__NEXT_DATA__.props && window.__NEXT_DATA__.props.pageProps && window.__NEXT_DATA__.props.pageProps.initialData && window.__NEXT_DATA__.props.pageProps.initialData.data;
    if (!data || !data.product) return JSON.stringify({error: true, message: 'No product in __NEXT_DATA__. Ensure the page is a Walmart product detail page (walmart.com/ip/...).'});

    var pd = data.product;
    var idml = data.idml || {};
    var reviewData = data.reviews || {};

    // Images
    var images = [];
    if (pd.imageInfo && pd.imageInfo.allImages) {
      for (var i = 0; i < pd.imageInfo.allImages.length; i++) {
        if (pd.imageInfo.allImages[i].url) images.push(pd.imageInfo.allImages[i].url);
      }
    }

    // Variants
    var variants = [];
    if (pd.variantCriteria) {
      for (var vi = 0; vi < pd.variantCriteria.length; vi++) {
        var vc = pd.variantCriteria[vi];
        var opts = [];
        if (vc.variantList) {
          for (var vli = 0; vli < vc.variantList.length; vli++) {
            var v = vc.variantList[vli];
            opts.push({id: v.id, name: v.name, availability: v.availabilityStatus, itemIds: v.products || []});
          }
        }
        variants.push({name: vc.name, type: vc.type, options: opts});
      }
    }

    // Fulfillment options
    var fulfillment = [];
    if (pd.fulfillmentOptions) {
      for (var fi = 0; fi < pd.fulfillmentOptions.length; fi++) {
        var fo = pd.fulfillmentOptions[fi];
        var speed = fo.speedDetails || {};
        fulfillment.push({
          type: fo.type || fo.__typename,
          status: fo.availabilityStatus,
          freeShipping: speed.freeFulfillment || false,
          deliveryDate: speed.deliveryDate || null,
          fulfillmentBadge: speed.fulfillmentBadge || null
        });
      }
    }

    // Category path
    var category = [];
    if (pd.category && pd.category.path) {
      for (var ci = 0; ci < pd.category.path.length; ci++) {
        var c = pd.category.path[ci];
        category.push({name: c.name, url: c.url ? 'https://www.walmart.com' + c.url : null});
      }
    }

    // Specifications from IDML
    var specs = {};
    if (idml.specifications) {
      for (var si = 0; si < idml.specifications.length; si++) {
        var s = idml.specifications[si];
        if (s.name && s.value !== undefined) specs[s.name] = s.value;
      }
    }

    // Product highlights
    var highlights = [];
    if (idml.productHighlights) {
      for (var hi = 0; hi < idml.productHighlights.length; hi++) {
        var h = idml.productHighlights[hi];
        highlights.push({name: h.name, value: h.value});
      }
    }

    // Review summary
    var reviewSummary = null;
    if (reviewData.totalReviewCount) {
      reviewSummary = {
        averageRating: reviewData.averageOverallRating || null,
        totalReviews: reviewData.totalReviewCount || 0,
        ratingBreakdown: {
          5: reviewData.ratingValueFiveCount || 0,
          4: reviewData.ratingValueFourCount || 0,
          3: reviewData.ratingValueThreeCount || 0,
          2: reviewData.ratingValueTwoCount || 0,
          1: reviewData.ratingValueOneCount || 0
        },
        reviewsLookupId: reviewData.lookupId || null
      };
    }

    var canonUrl = pd.canonicalUrl || null;
    var cleanUrl = canonUrl ? 'https://www.walmart.com' + canonUrl.split('?')[0] : null;
    var priceInfo = pd.priceInfo || {};
    var currPrice = priceInfo.currentPrice || {};
    var wasP = priceInfo.wasPrice;
    var wasPrice = wasP && typeof wasP === 'object' ? wasP.price : null;

    var result = {
      itemId: pd.usItemId,
      url: cleanUrl,
      title: pd.name,
      brand: pd.brand || null,
      brandUrl: pd.brandUrl ? 'https://www.walmart.com' + pd.brandUrl : null,
      model: pd.model || null,
      upc: pd.upc || null,
      manufacturerProductId: pd.manufacturerProductId || null,
      classType: pd.classType || null,
      price: currPrice.price || null,
      priceString: currPrice.priceString || null,
      currencyUnit: currPrice.currencyUnit || 'USD',
      wasPrice: wasPrice,
      availability: pd.availabilityStatus || null,
      category: category,
      sellerId: pd.sellerId || null,
      sellerName: pd.sellerName || null,
      sellerDisplayName: pd.sellerDisplayName || null,
      sellerType: pd.sellerType || null,
      sellerAverageRating: pd.sellerAverageRating || null,
      sellerReviewCount: pd.sellerReviewCount || null,
      averageRating: pd.averageRating || null,
      numberOfReviews: pd.numberOfReviews || null,
      thumbnail: (pd.imageInfo && pd.imageInfo.thumbnailUrl) || null,
      images: images,
      shortDescription: idml.shortDescription || pd.shortDescription || null,
      longDescription: idml.longDescription || null,
      productHighlights: highlights,
      specifications: specs,
      variants: variants,
      fulfillmentOptions: fulfillment,
      returnPolicy: pd.returnPolicy ? {
        returnable: pd.returnPolicy.returnable,
        freeReturns: pd.returnPolicy.freeReturns,
        returnWindowDays: pd.returnPolicy.returnWindow ? pd.returnPolicy.returnWindow.value : null,
        returnPolicyText: pd.returnPolicy.returnPolicyText
      } : null,
      reviewSummary: reviewSummary
    };

    return JSON.stringify(result);
  } catch(e) {
    return JSON.stringify({error: true, message: e.message});
  }
})()
"""
    print(js)


if __name__ == '__main__':
    main()
