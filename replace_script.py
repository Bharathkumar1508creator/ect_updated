import os, re
d = r'e:\ECT web all file\ect_full_copy\home\templates'
for f in os.listdir(d):
    if f.endswith('.html') and f != 'footer.html':
        p = os.path.join(d, f)
        try:
            with open(p, 'r', encoding='utf-8', errors='ignore') as file:
                content = file.read()
            if '<!-- Footer -->' in content or '<!-- ========== ECOG Footer Section Start ========== -->' in content:
                # Find the start and end
                start = content.find('<!-- ========== ECOG Footer Section Start ========== -->')
                if start == -1:
                    start = content.find('    <!-- Footer -->')
                if start == -1:
                    start = content.find('  <!-- Footer -->')

                end = content.find('<!-- ========== ECOG Footer Section End ========== -->')
                if end != -1:
                    end += len('<!-- ========== ECOG Footer Section End ========== -->')
                else:
                    end = content.find('  <script src=')
                if start != -1 and end != -1:
                    new_content = content[:start] + "{% include 'footer.html' %}\n" + content[end:]
                    with open(p, 'w', encoding='utf-8') as fw:
                        fw.write(new_content)
                    print(f, 'updated')
                else:
                    print(f, 'could not find bounds', start, end)
        except Exception as e:
            print(f, 'error', e)
