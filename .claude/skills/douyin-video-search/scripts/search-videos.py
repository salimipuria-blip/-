import argparse
import sys


def main():
    sys.stdout.reconfigure(encoding='utf-8', newline='\n')
    parser = argparse.ArgumentParser(description='Generate JS to fetch Douyin video search results')
    parser.add_argument('keyword', help='Search keyword')
    parser.add_argument('--offset', type=int, default=0,
                        help='Pagination offset (0, 20, 40, ...)')
    parser.add_argument('--count', type=int, default=20,
                        help='Results per page (default 20, max 20)')
    parser.add_argument('--sort-type', type=int, default=0,
                        help='Sort order: 0=comprehensive(default) 1=most-liked 2=latest')
    parser.add_argument('--publish-time', type=int, default=0,
                        help='Date filter in days: 0=all(default) 1=1day 7=7days 180=6months 365=1year')
    parser.add_argument('--search-id', default='',
                        help='search_id from first page response (required for page 2+)')
    args = parser.parse_args()

    keyword = args.keyword.replace("'", "\\'")
    search_id = args.search_id.replace("'", "\\'")
    is_filter = 1 if (args.sort_type != 0 or args.publish_time != 0) else 0

    js = f"""
(async function() {{
  try {{
    const keyword = encodeURIComponent('{keyword}');
    const offset = {args.offset};
    const count = {args.count};
    const sortType = {args.sort_type};
    const publishTime = {args.publish_time};
    const searchId = '{search_id}';
    const isFilter = {is_filter};

    let url = 'https://www.douyin.com/aweme/v1/web/search/item/'
      + '?device_platform=webapp&aid=6383&channel=channel_pc_web'
      + '&search_channel=aweme_video_web&enable_history=1'
      + '&keyword=' + keyword
      + '&search_source=normal_search&query_correct_type=1'
      + '&is_filter_search=' + isFilter
      + '&sort_type=' + sortType
      + '&publish_time=' + publishTime
      + '&from_group_id=&disable_rs=0'
      + '&offset=' + offset
      + '&count=' + count
      + '&need_filter_settings=1&list_type=single'
      + '&update_version_code=170400&pc_client_type=1'
      + '&version_code=170400&version_name=17.4.0'
      + '&cookie_enabled=true&screen_width=1920&screen_height=1080'
      + '&browser_language=en-US&browser_platform=Win32'
      + '&browser_name=Chrome&browser_version=144.0.0.0'
      + '&browser_online=true&engine_name=Blink&engine_version=144.0.0.0'
      + '&os_name=Windows&os_version=10&device_memory=8&platform=PC';

    if (searchId) url += '&search_id=' + encodeURIComponent(searchId);

    const resp = await fetch(url, {{ credentials: 'include' }});
    if (!resp.ok) {{
      return JSON.stringify({{ error: true, message: 'HTTP ' + resp.status }});
    }}
    const data = await resp.json();

    if (data.status_code !== 0) {{
      return JSON.stringify({{ error: true, message: 'API status_code: ' + data.status_code }});
    }}

    const items = (data.data || [])
      .filter(x => x && x.aweme_info)
      .map(x => {{
        const info = x.aweme_info;
        const author = info.author || {{}};
        const stats = info.statistics || {{}};
        const video = info.video || {{}};
        const coverUrls = video.cover && video.cover.url_list;
        const playUrls = video.play_addr && video.play_addr.url_list;
        const dlUrls = video.download_addr && video.download_addr.url_list;
        const hashtags = (info.text_extra || [])
          .filter(t => t.hashtag_name)
          .map(t => '#' + t.hashtag_name);

        return {{
          aweme_id:          info.aweme_id || null,
          title:             info.desc || null,
          author_name:       author.nickname || null,
          author_profile_url: author.sec_uid
            ? 'https://www.douyin.com/user/' + author.sec_uid
            : null,
          video_url:         info.aweme_id
            ? 'https://www.douyin.com/video/' + info.aweme_id
            : null,
          cover_url:         (coverUrls && coverUrls[0]) || null,
          description:       info.desc || null,
          hashtags:          hashtags,
          download_url:      (dlUrls && dlUrls[0]) || null,
          digg_count:        stats.digg_count != null ? stats.digg_count : null,
          comment_count:     stats.comment_count != null ? stats.comment_count : null,
          share_count:       stats.share_count != null ? stats.share_count : null,
          publish_time:      info.create_time || null,
          publish_time_str:  info.create_time ? new Date(info.create_time * 1000).toISOString().slice(0, 10) : null
        }};
      }});

    const nextSearchId = (data.extra && data.extra.logid) ? data.extra.logid : '';

    return JSON.stringify({{
      items:         items,
      count:         items.length,
      has_more:      data.has_more || 0,
      next_offset:   offset + items.length,
      next_search_id: nextSearchId
    }});
  }} catch (e) {{
    return JSON.stringify({{ error: true, message: e.message }});
  }}
}})()
"""
    print(js)


if __name__ == '__main__':
    main()
