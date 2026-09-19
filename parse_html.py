from html.parser import HTMLParser

class P(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []
        self.void_tags = {'img', 'meta', 'link', 'br', 'hr', 'input', 'source', 'path', 'circle', 'svg', 'image', 'clipPath', 'defs'}
    
    def handle_starttag(self, tag, attrs):
        if tag in self.void_tags: return
        cls = dict(attrs).get('class', '')
        self.tags.append(f'<{tag} {cls}>')
        
    def handle_endtag(self, tag):
        if tag in self.void_tags: return
        self.tags.append(f'</{tag}>')

p = P()
p.feed(open('home/templates/career.html', encoding='utf-8').read())
level = 0
out = []
for t in p.tags:
    if t.startswith('</'):
        level -= 1
        out.append('  ' * level + t)
    else:
        out.append('  ' * level + t)
        level += 1

with open('dom_tree.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))
