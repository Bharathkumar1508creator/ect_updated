import re

with open('home/templates/index.html', 'r', encoding='utf-8') as f:
    idx_content = f.read()

start_nav = idx_content.find('<div class="nav-wrap">')
end_nav = idx_content.find('</nav>') + 6
navbar_html = idx_content[start_nav:end_nav] + '\n  </div>'

with open('home/templates/career.html', 'r', encoding='utf-8') as f:
    car_content = f.read()

start_car_nav = car_content.find('<div class="nav-wrap">')
end_car_nav = car_content.find('<div class="ect-hero-outer">')

if start_car_nav != -1 and end_car_nav != -1:
    new_content = car_content[:start_car_nav] + navbar_html + '\n\n  ' + car_content[end_car_nav:]
    with open('home/templates/career.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Patched successfully!')
else:
    print('Could not find markers.')
