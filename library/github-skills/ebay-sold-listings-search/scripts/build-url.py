import argparse
import json
import sys
from urllib.parse import urlencode, quote_plus


SITE_HOSTS = {
    'ebay.com': 'www.ebay.com',
    'ebay.co.uk': 'www.ebay.co.uk',
    'ebay.de': 'www.ebay.de',
    'ebay.fr': 'www.ebay.fr',
    'ebay.it': 'www.ebay.it',
    'ebay.es': 'www.ebay.es',
    'ebay.ca': 'www.ebay.ca',
    'ebay.com.au': 'www.ebay.com.au',
}

SORT_MAP = {
    'endedRecently': '13',
    'timeNewlyListed': '10',
    'pricePlusPostageLowest': '15',
    'pricePlusPostageHighest': '16',
    'distanceNearest': '7',
}

LOCATION_MAP = {
    'default': '98',
    'domestic': '1',
    'worldwide': '2',
}

CONDITION_MAP = {
    'any': None,
    'new': '1000',
    'used': '3000',
}


def main():
    sys.stdout.reconfigure(encoding='utf-8', newline='\n')
    parser = argparse.ArgumentParser(description='Build eBay sold-listings search URL')
    parser.add_argument('keyword', help='Search keyword')
    parser.add_argument('--ebaySite', default='ebay.com', choices=list(SITE_HOSTS.keys()))
    parser.add_argument('--sortOrder', default='endedRecently', choices=list(SORT_MAP.keys()))
    parser.add_argument('--categoryId', default='0', help='Main category filter (_sacat)')
    parser.add_argument('--subcategoryId', default='', help='Subcategory filter; overrides categoryId when set')
    parser.add_argument('--itemLocation', default='default', choices=list(LOCATION_MAP.keys()))
    parser.add_argument('--itemCondition', default='any', help='any|new|used or a numeric eBay condition id (e.g. 1500 open box)')
    parser.add_argument('--minPrice', default='', help='Minimum sold price (integer or decimal, blank to skip)')
    parser.add_argument('--maxPrice', default='', help='Maximum sold price (integer or decimal, blank to skip)')
    parser.add_argument('--includeCompletedListings', default='true', choices=['true', 'false'])
    parser.add_argument('--ipg', default='60', help='Items per page (eBay supports 60/120/240)')
    parser.add_argument('--page', default='1', help='Page number (_pgn)')
    args = parser.parse_args()

    host = SITE_HOSTS[args.ebaySite]

    params = [
        ('_nkw', args.keyword),
        ('LH_Sold', '1'),
    ]
    if args.includeCompletedListings == 'true':
        params.append(('LH_Complete', '1'))

    params.append(('_ipg', args.ipg))
    params.append(('_pgn', args.page))
    params.append(('_sop', SORT_MAP[args.sortOrder]))

    effective_cat = args.subcategoryId.strip() or args.categoryId.strip() or '0'
    if effective_cat and effective_cat != '0':
        params.append(('_sacat', effective_cat))

    if args.itemLocation != 'default':
        params.append(('LH_PrefLoc', LOCATION_MAP[args.itemLocation]))

    cond = args.itemCondition.strip()
    if cond and cond != 'any':
        if cond in CONDITION_MAP and CONDITION_MAP[cond]:
            params.append(('LH_ItemCondition', CONDITION_MAP[cond]))
        elif cond.isdigit():
            params.append(('LH_ItemCondition', cond))

    if args.minPrice:
        params.append(('_udlo', args.minPrice))
    if args.maxPrice:
        params.append(('_udhi', args.maxPrice))

    url = f'https://{host}/sch/i.html?' + urlencode(params, quote_via=quote_plus)
    print(url)


if __name__ == '__main__':
    main()
