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

    var finalPriceModel = ctx.mainPrice && ctx.mainPrice.fields && ctx.mainPrice.fields.finalPriceModel || {{}};
    var tradeData = finalPriceModel.tradeWithoutPromotion || {{}};
    var skuMap = tradeData.skuMapOriginal || [];

    // SKU spec attrs (specAttrs is a "val1>val2" string, split by >)
    var skuInfos = [];
    skuMap.forEach(function(sku) {{
      var attrs = {{}};
      if (sku.specAttrs && typeof sku.specAttrs === 'string') {{
        // Format: "颜色值>型号值" — split by decoded >
        var parts = sku.specAttrs.replace(/&gt;/g, '>').split('>');
        if (parts.length >= 1 && parts[0]) attrs['sku1'] = parts[0].trim();
        if (parts.length >= 2 && parts[1]) attrs['sku2'] = parts[1].trim();
      }} else if (sku.specAttrs && Array.isArray(sku.specAttrs)) {{
        sku.specAttrs.forEach(function(attr) {{
          if (attr.attrName && attr.value) attrs[attr.attrName] = attr.value;
        }});
      }}
      skuInfos.push({{
        skuId: sku.skuId,
        specId: sku.specId,
        attrs: attrs,
        saleCount: sku.saleCount,
        canBookCount: sku.canBookCount,
        isPromotionSku: sku.isPromotionSku || false
      }});
    }});

    // SKU range prices — nested under orderParamModel.orderParam.skuParam
    var skuRangePrices = [];
    var orderParamModel = root.orderParamModel || {{}};
    var innerParam = orderParamModel.orderParam || {{}};
    if (innerParam.skuParam && innerParam.skuParam.skuRangePrices) {{
      skuRangePrices = innerParam.skuParam.skuRangePrices;
    }}

    // Weight per SKU from productPackInfo
    var packFields = ctx.productPackInfo && ctx.productPackInfo.fields || {{}};
    var packInfo = packFields.pieceWeightScale;
    if (typeof packInfo === 'string') {{ try {{ packInfo = JSON.parse(packInfo); }} catch(e) {{}} }}
    var weightBySkuId = {{}};
    var pieceList = packInfo && packInfo.pieceWeightScaleInfo || [];
    pieceList.forEach(function(p) {{
      if (p.skuId) weightBySkuId[p.skuId] = {{ weight: p.weight, length: p.length, width: p.width, height: p.height, volume: p.volume }};
    }});

    // Merge weight into SKU
    skuInfos.forEach(function(sku) {{
      if (weightBySkuId[sku.skuId]) sku.packInfo = weightBySkuId[sku.skuId];
    }});

    // SKU image map (from skuImageMap if present)
    var skuImageMap = tradeData.skuImageMap || {{}};

    return JSON.stringify({{
      offerId: '{args.offer_id}',
      skuCount: skuInfos.length,
      skuRangePrices: skuRangePrices,
      skus: skuInfos,
      skuImageMap: skuImageMap
    }});
  }} catch(e) {{
    return JSON.stringify({{ error: true, message: e.message }});
  }}
}})()
"""
    print(js)

if __name__ == '__main__':
    main()
