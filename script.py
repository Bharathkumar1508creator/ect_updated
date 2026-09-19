import os, re

base_dir = r'e:\ECT web all file\ect_full_copy\blog\templates'
index_path = r'e:\ECT web all file\ect_full_copy\home\templates\index.html'

with open(index_path, 'r', encoding='utf-8') as f:
    index_content = f.read()

# Extract the new footer block
footer_match = re.search(r'<!-- ========== ECOG Footer Section Start ========== -->.*?<!-- ========== ECOG Footer Section End ========== -->', index_content, re.DOTALL)
if not footer_match:
    print('Failed to find footer block in index.html')
    exit(1)

new_footer_block = footer_match.group(0)

modified_files = []
for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Replace old style footer block if it exists
            content = re.sub(r'<!-- ================= FOOTER ================= -->\s*<footer class="footer">.*?</footer>', new_footer_block, content, flags=re.DOTALL)
            content = re.sub(r'<footer class="footer">.*?</footer>', new_footer_block, content, flags=re.DOTALL)
            
            # Replace new style footer block if it exists
            content = re.sub(r'<!-- ========== ECOG Footer Section Start ========== -->.*?<!-- ========== ECOG Footer Section End ========== -->', new_footer_block, content, flags=re.DOTALL)
            
            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                modified_files.append(file)

print('Modified files in blog/templates:', modified_files)
