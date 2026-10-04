import argparse
import sys

def main():
    sys.stdout.reconfigure(encoding='utf-8', newline='\n')
    parser = argparse.ArgumentParser()
    parser.add_argument('offer_id', help='1688 offer/product ID (numeric string)')
    args = parser.parse_args()

    js = f"""
(function() {{
  try {{
    var ctx = window.context && window.context.result && window.context.result.data;
    if (!ctx) return JSON.stringify({{ error: true, message: 'window.context not found on this page' }});

    var root = ctx.Root && ctx.Root.fields && ctx.Root.fields.dataJson;
    if (!root) return JSON.stringify({{ error: true, message: 'Root.dataJson not found' }});

    var priceModel = ctx.mainPrice && ctx.mainPrice.fields && ctx.mainPrice.fields.priceModel || {{}};
    var finalPriceModel = ctx.mainPrice && ctx.mainPrice.fields && ctx.mainPrice.fields.finalPriceModel || {{}};
    var skuMap = finalPriceModel.tradeWithoutPromotion && finalPriceModel.tradeWithoutPromotion.skuMapOriginal || [];
    var galleryFields = ctx.gallery && ctx.gallery.fields || {{}};
    var productTitleFields = ctx.productTitle && ctx.productTitle.fields || {{}};
    var packFields = ctx.productPackInfo && ctx.productPackInfo.fields || {{}};
    var descFields = ctx.description && ctx.description.fields || {{}};
    var mainServicesFields = ctx.mainServices && ctx.mainServices.fields || {{}};
    var shippingFields = ctx.shippingServices && ctx.shippingServices.fields || {{}};
    var crossBorderModel = root.offerCrossBorderModel || {{}};
    var offerSign = root.offerSign || {{}};
    var sellerModel = root.frontSellerMemberModel || {{}};
    var shopInfoRaw = productTitleFields.shopInfo || {{}};
    var shopInfo = typeof shopInfoRaw === 'string' ? JSON.parse(shopInfoRaw) : shopInfoRaw;

    // Tiered pricing
    var tiers = [];
    var prices = priceModel.currentPrices || priceModel.originalPrices || [];
    prices.forEach(function(p) {{
      tiers.push({{ minQty: p.beginAmount, price: p.price }});
    }});

    // SKU variants count
    var skuCount = skuMap.length;

    // Images
    var images = galleryFields.offerImgList || [];

    // Product attributes from DOM
    var attributes = {{}};
    try {{
      var attrEls = document.querySelectorAll('[class*=attribute]');
      attrEls.forEach(function(el) {{
        var rows = el.querySelectorAll('tr, li, [class*=item], [class*=row]');
        rows.forEach(function(row) {{
          var label = row.querySelector('[class*=label], [class*=key], th, dt');
          var value = row.querySelector('[class*=value], [class*=val], td, dd');
          if (label && value) {{
            var k = label.textContent.trim();
            var v = value.textContent.trim();
            if (k && v) attributes[k] = v;
          }}
        }});
      }});
    }} catch(e) {{}}

    // Guarantees/services
    var guarantees = [];
    var gList = mainServicesFields.guaranteeList || [];
    gList.forEach(function(g) {{ guarantees.push(g.serviceName); }});

    // Seller info
    var tempModel = root.tempModel || {{}};
    var orderParamModel = root.orderParamModel || {{}};
    var beginNum = orderParamModel.beginNum;

    // Pack info - pieceWeightScale
    var packInfo = packFields.pieceWeightScale;
    if (typeof packInfo === 'string') {{ try {{ packInfo = JSON.parse(packInfo); }} catch(e) {{}} }}
    var pieceWeightList = packInfo && packInfo.pieceWeightScaleInfo || [];

    // Buyer protection
    var buyerProtection = shippingFields.buyerProtectionModel || [];

    return JSON.stringify({{
      offerId: tempModel.offerId || '{args.offer_id}',
      title: productTitleFields.title || tempModel.offerTitle,
      unit: tempModel.offerUnit || '',
      category: {{ topCategoryId: tempModel.topCategoryId, postCategoryId: tempModel.postCategoryId }},
      pricing: {{
        tiers: tiers,
        priceDisplayType: priceModel.priceDisplayType,
        minOrderQty: beginNum,
        currency: 'CNY'
      }},
      sales: {{
        totalSold: tempModel.saledCount,
        displaySaleNum: productTitleFields.saleNum,
        saleCountLabel: productTitleFields.saleCountDate
      }},
      images: images,
      attributes: attributes,
      skuCount: skuCount,
      skuWeightData: pieceWeightList.slice(0, 5),
      seller: {{
        companyName: tempModel.companyName || shopInfo.companyName,
        authCompanyName: shopInfo.authCompanyName,
        loginId: tempModel.sellerLoginId || sellerModel.frontSellerLoginId,
        memberId: tempModel.sellerMemberId || sellerModel.frontSellerMemberId,
        userId: tempModel.sellerUserId || sellerModel.frontSellerUserId,
        shopUrl: tempModel.winportUrl,
        cardType: shopInfo.cardType,
        isPmPlus: shopInfo.isPmPlus,
        serviceScore: shopInfo.sellerSlrServiceScore,
        buyerRepeatRate: shopInfo.byrRepeatRate3m
      }},
      offerFlags: {{
        isSkuOffer: offerSign.isSkuOffer,
        isPreSell: offerSign.isPreSell,
        isConsignMarketOffer: offerSign.isConsignMarketOffer,
        isDistribution: offerSign.isDistribution,
        isChtOffer: offerSign.isChtOffer,
        isBuyerProtection: offerSign.isBuyerProtection
      }},
      crossBorder: crossBorderModel,
      guarantees: guarantees,
      buyerProtection: buyerProtection,
      descriptionUrl: descFields.detailUrl || '',
      offerMemberTags: root.offerMemberTags || [],
      sellerWinportUrlMap: root.offerWinportUrlMap || {{}}
    }});
  }} catch(e) {{
    return JSON.stringify({{ error: true, message: e.message }});
  }}
}})()
"""
    print(js)

if __name__ == '__main__':
    main()
