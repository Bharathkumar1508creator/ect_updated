import os
import re

base_dir = r"d:\ect_loki\ECT_CLIENT\testing\ECT_10days\ECT_10days\ect_full\home\templates"
pages = ["career", "contact"]

for page in pages:
    file_path = os.path.join(base_dir, f"{page}.html")
    if not os.path.exists(file_path):
        continue
        
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Replace <form ...> with <form ... method="POST"> {% csrf_token %}
    # We will just add {% csrf_token %} after <form ...>
    # First, let's make sure forms have method="POST"
    
    def form_replacer(match):
        form_tag = match.group(0)
        if 'method=' not in form_tag.lower():
            form_tag = form_tag.replace('<form', '<form method="POST"')
        
        # Add action if missing, or replace action="#"
        if 'action=' not in form_tag.lower() or 'action="#"' in form_tag.lower():
             form_tag = re.sub(r'action=".*?"', '', form_tag) # remove existing action
             form_tag = form_tag.replace('<form', '<form action=""')
             
        # Add csrf_token if not present
        if '{% csrf_token %}' not in content:
            return form_tag + '\n{% csrf_token %}'
        return form_tag

    new_content = re.sub(r'<form[^>]*>', form_replacer, content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
print("Forms updated with CSRF tokens.")
