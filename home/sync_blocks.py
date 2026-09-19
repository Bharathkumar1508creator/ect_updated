import sys

def get_block(filepath, start_marker, end_marker):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    start = content.find(start_marker)
    if start == -1: return None
    end = content.find(end_marker, start)
    if end == -1: return None
    return content[start:end+len(end_marker)]

def replace_block(filepath, start_marker, end_marker, new_block):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    start = content.find(start_marker)
    end = content.find(end_marker, start)
    if start != -1 and end != -1:
        new_content = content[:start] + new_block + content[end+len(end_marker):]
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print('Success on ' + filepath)
    else:
        print('Markers not found in ' + filepath)

html_source = 'd:/ect_loki/ECT_CLIENT/testing/ECT_10days/ECT_10days/ect_full/home/templates/website.html'
html_target = 'd:/ect_loki/ECT_CLIENT/testing/ECT_10days/ECT_10days/ect_full/home/templates/software.html'

html_start_marker = '<section class="ect-web-solutions" aria-labelledby="ect-web-solutions-title">'
html_end_marker = '</section>'

js_source = 'd:/ect_loki/ECT_CLIENT/testing/ECT_10days/ECT_10days/ect_full/home/js/website.js'
js_target = 'd:/ect_loki/ECT_CLIENT/testing/ECT_10days/ECT_10days/ect_full/home/js/software.js'

js_start_marker = '(() => {\n  const AUTO_PLAY_DELAY'
js_end_marker = '  });\n})();'

new_html = get_block(html_source, html_start_marker, html_end_marker)
replace_block(html_target, html_start_marker, html_end_marker, new_html)

new_js = get_block(js_source, js_start_marker, js_end_marker)
replace_block(js_target, js_start_marker, js_end_marker, new_js)
