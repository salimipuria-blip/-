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

    var tempModel = root.tempModel || {{}};
    var sellerModel = root.frontSellerMemberModel || {{}};
    var productTitleFields = ctx.productTitle && ctx.productTitle.fields || {{}};
    var shopInfoRaw = productTitleFields.shopInfo || {{}};
    var shopInfo = typeof shopInfoRaw === 'string' ? JSON.parse(shopInfoRaw) : shopInfoRaw;

    // offerMemberTags — needed as POST body param for shopcard API
    var offerMemberTags = root.offerMemberTags || [];

    // offerSign — needed as offerModelSign for shopcard API
    var offerSign = root.offerSign || {{}};

    // winportUrl
    var winportUrl = tempModel.winportUrl || '';

    // Build sellerWinportUrlMap from winportUrl
    var sellerWinportUrlMap = {{}};
    if (winportUrl) {{
      sellerWinportUrlMap = {{
        offerlistUrl: winportUrl + '/page/offerlist.html',
        newofferlistUrl: winportUrl + '/page/newofferlist.html',
        contactinfoUrl: winportUrl + '/page/contactinfo.html',
        creditdetailUrl: winportUrl + '/page/creditdetail.html',
        indexUrl: winportUrl + '/page/index.html',
        shopdynamicUrl: winportUrl + '/page/shopdynamic.html',
        defaultUrl: winportUrl
      }};
    }}

    return JSON.stringify({{
      offerId: tempModel.offerId || '{args.offer_id}',
      seller: {{
        companyName: tempModel.companyName || shopInfo.companyName,
        authCompanyName: shopInfo.authCompanyName,
        loginId: tempModel.sellerLoginId || sellerModel.frontSellerLoginId,
        memberId: tempModel.sellerMemberId || sellerModel.frontSellerMemberId,
        userId: tempModel.sellerUserId || sellerModel.frontSellerUserId,
        shopUrl: winportUrl,
        sellerType: sellerModel.sellerType,
        cardType: shopInfo.cardType,
        isPmPlus: shopInfo.isPmPlus,
        serviceScore: shopInfo.sellerSlrServiceScore,
        buyerRepeatRate3m: shopInfo.byrRepeatRate3m
      }},
      shopcardParams: {{
        offerId: tempModel.offerId || '{args.offer_id}',
        userId: 0,
        offerMemberTags: offerMemberTags,
        sellerUserId: tempModel.sellerUserId || sellerModel.frontSellerUserId,
        sellerMemberId: tempModel.sellerMemberId || sellerModel.frontSellerMemberId,
        topCategoryId: tempModel.topCategoryId,
        offerModelSign: offerSign,
        sellerIdentity: shopInfo.cardType || 'cht',
        sellerWinportUrlMap: sellerWinportUrlMap,
        winportUrl: winportUrl
      }}
    }});
  }} catch(e) {{
    return JSON.stringify({{ error: true, message: e.message }});
  }}
}})()
"""
    print(js)

if __name__ == '__main__':
    main()
