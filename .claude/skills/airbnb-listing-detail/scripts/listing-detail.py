import argparse
import base64
import json
import sys


def main():
    sys.stdout.reconfigure(encoding='utf-8', newline='\n')
    parser = argparse.ArgumentParser()
    parser.add_argument('listing_id')                     # numeric Airbnb listing ID
    parser.add_argument('--checkin', default=None)        # check-in date YYYY-MM-DD
    parser.add_argument('--checkout', default=None)       # check-out date YYYY-MM-DD
    parser.add_argument('--adults', default='1')          # number of adults
    parser.add_argument('--locale', default='en')         # response locale
    parser.add_argument('--currency', default='USD')      # price currency
    args = parser.parse_args()

    stay_id = base64.b64encode(('StayListing:' + args.listing_id).encode()).decode()
    demand_id = base64.b64encode(('DemandStayListing:' + args.listing_id).encode()).decode()
    p3_id = 'p3_forge_' + args.listing_id

    body = {
        'operationName': 'StaysPdpSections',
        'variables': {
            'id': stay_id,
            'demandStayListingId': demand_id,
            'pdpSectionsRequest': {
                'adults': args.adults,
                'amenityFilters': None,
                'bypassTargetings': False,
                'categoryTag': None,
                'causeId': None,
                'children': None,
                'disasterId': None,
                'discountedGuestFeeVersion': None,
                'federatedSearchId': None,
                'forceBoostPriorityMessageType': None,
                'hostPreview': False,
                'infants': None,
                'interactionType': None,
                'layouts': ['SIDEBAR', 'SINGLE_COLUMN'],
                'pets': 0,
                'pdpTypeOverride': None,
                'photoId': None,
                'preview': False,
                'previousStateCheckIn': None,
                'previousStateCheckOut': None,
                'priceDropSource': None,
                'partner': None,
                'partnerProgram': None,
                'privateBooking': False,
                'promotionUuid': None,
                'relaxedAmenityIds': None,
                'searchId': None,
                'selectedCancellationPolicyId': None,
                'selectedRatePlanId': None,
                'splitStays': None,
                'staysBookingMigrationEnabled': False,
                'translateUgc': None,
                'useNewSectionWrapperApi': False,
                'checkIn': args.checkin,
                'checkOut': args.checkout,
                'p3ImpressionId': p3_id
            },
            'categoryTag': None,
            'federatedSearchId': None,
            'federatedSearchSessionId': None,
            'p3ImpressionId': p3_id,
            'photoId': None,
            'amenityIds': None,
            'dateRange': None,
            'guestCounts': None,
            'numberOfChildren': None,
            'numberOfInfants': None,
            'numberOfPets': None,
            'includePdpMigrationAccessibilityFeaturesModalFragment': False,
            'includeGpAccessibilityFeaturesFragment': True,
            'includePdpMigrationAccessibilityFeaturesPreviewCarouselFragment': False,
            'includePdpMigrationLuxeServicesFragment': False,
            'includeGpLuxeServicesFragment': True,
            'includeGpAdminBannerFragment': True,
            'includePdpMigrationBookItNavFragment': False,
            'includeGpBookItFragment': True,
            'includePdpMigrationAmenitiesFragment': False,
            'includeGpAmenitiesFragment': True,
            'includeGpCancellationPolicyPickerModalFragment': True,
            'includePdpMigrationAvailabilityCalendarInlineFragment': False,
            'includeGpAvailabilityCalendarInlineFragment': True,
            'includePdpMigrationAvailabilityCalendarFragment': False,
            'includeGpAvailabilityCalendarFragment': True,
            'includePdpMigrationDescriptionFragment': False,
            'includeGpDescriptionFragment': True,
            'includePdpMigrationHeroFragment': False,
            'includeGpHeroFragment': True,
            'includePdpMigrationHighlightsCompactFragment': False,
            'includeGpHighlightsCompactFragment': True,
            'includePdpMigrationHighlightsFragment': False,
            'includeGpHighlightsFragment': True,
            'includePdpMigrationLocationPdpFragment': False,
            'includeGpLocationPdpFragment': True,
            'includePdpMigrationMeetYourHostFragment': False,
            'includeGpMeetYourHostFragment': True,
            'includePdpMigrationMessageBannerFragment': False,
            'includeGpMessageBannerFragment': True,
            'includePdpMigrationNavFragment': False,
            'includeGpNavFragment': True,
            'includePdpMigrationNavMobileFragment': False,
            'includeGpNavMobileFragment': True,
            'includePdpMigrationBookItFloatingFooterFragment': False,
            'includePdpMigrationBookItSidebarFragment': False,
            'includePdpMigrationBookItCalendarSheetFragment': False,
            'includePdpMigrationBookItNonExperiencedGuestFragment': False,
            'includeGpBookItNonExperiencedGuestFragment': True,
            'includePdpMigrationBathroomFragment': False,
            'includeGpBathroomFragment': True,
            'includePdpMigrationOverviewV2Fragment': False,
            'includeGpOverviewV2Fragment': True,
            'includePdpMigrationPropertyAvailableRoomsFragment': False,
            'includeGpPropertyAvailableRoomsFragment': True,
            'includePdpMigrationReviewsHighlightBannerFragment': False,
            'includeGpReviewsHighlightBannerFragment': True,
            'includePdpMigrationHostOverviewDefaultFragment': False,
            'includeGpHostOverviewDefaultFragment': True,
            'includePdpMigrationNonExperiencedGuestLearnMoreModalFragment': False,
            'includeGpNonExperiencedGuestLearnMoreModalFragment': True,
            'includePdpMigrationReportToAirbnbFragment': False,
            'includeGpReportToAirbnbFragment': True,
            'includePdpMigrationReviewsFragment': False,
            'includeGpReviewsFragment': True,
            'includePdpMigrationReviewsEmptyFragment': False,
            'includeGpReviewsEmptyFragment': True,
            'includePdpMigrationSeoLinksFragment': False,
            'includeGpSeoLinksFragment': True,
            'includePdpMigrationSleepingArrangementFragment': False,
            'includeGpSleepingArrangementFragment': True,
            'includePdpMigrationSleepingArrangementImagesFragment': False,
            'includeGpSleepingArrangementImagesFragment': True,
            'includePdpMigrationTitleFragment': False,
            'includeGpTitleFragment': True,
            'includeGpUgcTranslationFragment': True,
            'includePdpMigrationPoliciesFragment': False,
            'includeGpPoliciesFragment': True,
            'includePdpMigrationMarqueeBookItFloatingFooterFragment': False,
            'includeGpMarqueeBookItFloatingFooterFragment': True,
            'includePdpMigrationMarqueeBookItNavFragment': False,
            'includeGpMarqueeBookItNavFragment': True,
            'includePdpMigrationMarqueeBookItSidebarFragment': False,
            'includeGpMarqueeBookItSidebarFragment': True,
            'includePdpMigrationOnlyOnBookItFragment': False,
            'includePdpMigrationOnlyOnBookItNavFragment': False,
            'includePdpMigrationPdpEducationFragment': False
        },
        'extensions': {
            'persistedQuery': {
                'version': 1,
                'sha256Hash': 'ac5b42448e1234d39ffc14291325d4e5b7b084a0fec571dfcde15d1e7d228bdc'
            }
        }
    }

    body_js = json.dumps(json.dumps(body))  # double-encode: JS string literal containing JSON
    listing_id = args.listing_id
    locale = args.locale
    currency = args.currency

    js = f"""
(async function() {{
  try {{
    const url = 'https://www.airbnb.com/api/v3/StaysPdpSections/ac5b42448e1234d39ffc14291325d4e5b7b084a0fec571dfcde15d1e7d228bdc?operationName=StaysPdpSections&locale={locale}&currency={currency}';
    const res = await fetch(url, {{
      method: 'POST',
      headers: {{
        'X-Airbnb-API-Key': 'd306zoyjsyarp7ifhu67rjxn52tv0t20',
        'X-CSRF-Without-Token': '1',
        'X-Niobe-Short-Circuited': 'true',
        'Content-Type': 'application/json'
      }},
      body: {body_js}
    }});
    if (!res.ok) return JSON.stringify({{error: true, message: 'HTTP ' + res.status, status: res.status}});
    const data = await res.json();
    if (!data.data) return JSON.stringify({{error: true, message: 'No data in response', raw: JSON.stringify(data).slice(0, 300)}});

    const sections = data.data.presentation.stayProductDetailPage.sections.sections;
    const getSec = (id) => sections.find(s => s.sectionId === id);

    const titleSec = getSec('TITLE_DEFAULT');
    const descSec = getSec('DESCRIPTION_DEFAULT');
    const heroSec = getSec('HERO_DEFAULT');
    const locSec = getSec('LOCATION_DEFAULT');
    const amenSec = getSec('AMENITIES_DEFAULT');
    const polSec = getSec('POLICIES_DEFAULT');
    const hlSec = getSec('HIGHLIGHTS_DEFAULT');
    const revSec = getSec('REVIEWS_DEFAULT');
    const sleepSec = getSec('SLEEPING_ARRANGEMENT_WITH_IMAGES');

    const result = {{
      id: '{listing_id}',
      url: 'https://www.airbnb.com/rooms/{listing_id}',
      title: titleSec?.section?.title,
      room_type: titleSec?.section?.roomType,
      description: descSec?.section?.htmlDescription?.htmlText,
      photos: (heroSec?.section?.previewImages || []).map(p => p.baseUrl),
      lat: locSec?.section?.lat,
      lng: locSec?.section?.lng,
      city: locSec?.section?.subtitle,
      amenities: (amenSec?.section?.previewAmenitiesGroups || [])
        .flatMap(g => g.amenities || [])
        .map(a => ({{name: a.title, available: a.isPresent !== false}})),
      house_rules: (polSec?.section?.houseRules || []).map(r => r.title),
      highlights: (hlSec?.section?.highlights || []).map(h => ({{title: h.title, subtitle: h.subtitle}})),
      rating_overall: revSec?.section?.overallRating,
      review_count: revSec?.section?.overallCount,
      ratings: (revSec?.section?.ratings || []).map(r => ({{category: r.categoryType, value: r.localizedRating}})),
      bedrooms: (sleepSec?.section?.arrangementDetails || []).map(b => ({{title: b.title, subtitle: b.subtitle}}))
    }};

    return JSON.stringify(result);
  }} catch(e) {{
    return JSON.stringify({{error: true, message: e.message}});
  }}
}})()
"""
    print(js)


if __name__ == '__main__':
    main()
