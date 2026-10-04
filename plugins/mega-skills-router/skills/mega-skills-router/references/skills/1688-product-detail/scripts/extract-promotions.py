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

    // promotionData from mainPrice.fields
    var mainPriceFields = ctx.mainPrice && ctx.mainPrice.fields || {{}};
    var promotionData = mainPriceFields.promotionData || {{}};
    var activityModel = mainPriceFields.activityModel || {{}};

    // discountCoupon module
    var dcFields = ctx.discountCoupon && ctx.discountCoupon.fields || {{}};
    var couponList = dcFields.couponList || [];
    var promotionModel = dcFields.promotionModel || {{}};

    // promotionBanner
    var bannerFields = ctx.promotionBanner && ctx.promotionBanner.fields || {{}};

    return JSON.stringify({{
      offerId: '{args.offer_id}',
      coupons: couponList,
      promotionModel: promotionModel,
      activity: {{
        activityType: activityModel.activityType,
        activityName: activityModel.activityName,
        activityUrl: activityModel.activityUrl,
        countdown: activityModel.countdown,
        activityId: activityModel.activityId
      }},
      promotionData: {{
        couponList: promotionData.couponList || [],
        couponInfoList: promotionData.couponInfoList || [],
        linkUrl: promotionData.linkUrl
      }},
      bannerImage: bannerFields.bannerImage || ''
    }});
  }} catch(e) {{
    return JSON.stringify({{ error: true, message: e.message }});
  }}
}})()
"""
    print(js)

if __name__ == '__main__':
    main()
