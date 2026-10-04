document.addEventListener("DOMContentLoaded", function(event) {
    const limits = {
        'id_paragraph_1': 135,
        'id_paragraph_2': 135,
        'id_paragraph_3': 135,
        'id_paragraph_4': 300,
        'id_paragraph_5': 300,
    };

    tinymce.init({
        selector: 'textarea#id_paragraph_1, textarea#id_paragraph_2, textarea#id_paragraph_3, textarea#id_paragraph_4, textarea#id_paragraph_5',
        license_key: 'gpl',
        height: 600,
        plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table code help wordcount',
        toolbar: 'undo redo | blocks | ' +
        'bold italic underline strikethrough | alignleft aligncenter ' +
        'alignright alignjustify | bullist numlist outdent indent | ' +
        'link image media table | removeformat | help',
        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:16px }',
        image_title: true,
        automatic_uploads: false, // For a real setup, configure a Django view to handle image uploads
        setup: function(editor) {
            editor.on('init', function() {
                const maxWords = limits[editor.id];
                if (!maxWords) return;

                // Create counter element below editor
                const container = editor.getContainer();
                const counterDiv = document.createElement('div');
                counterDiv.id = editor.id + '-wordcount';
                counterDiv.style.padding = '8px 4px';
                counterDiv.style.fontWeight = 'bold';
                counterDiv.style.fontSize = '14px';
                container.parentNode.insertBefore(counterDiv, container.nextSibling);

                const updateCount = () => {
                    const wordCount = editor.plugins.wordcount ? editor.plugins.wordcount.getCount() : 0;
                    counterDiv.textContent = wordCount + ' / ' + maxWords + ' Words';
                    
                    if (wordCount > maxWords) {
                        counterDiv.style.color = '#dc3545';
                        container.style.border = '2px solid #dc3545';
                        counterDiv.textContent += ' - Maximum ' + maxWords + ' words allowed.';
                    } else {
                        counterDiv.style.color = '#28a745';
                        container.style.border = 'none';
                    }
                };

                editor.on('input keyup change paste', updateCount);
                // TinyMCE sets wordcount asynchronously sometimes, use small timeout for initial count
                setTimeout(updateCount, 500); 
            });
        }
    });

    // Prevent form submission if any editor is over limit
    const form = document.getElementById('blog_form'); // Default django admin form id
    if (form) {
        form.addEventListener('submit', function(e) {
            let hasError = false;
            for (const [id, maxWords] of Object.entries(limits)) {
                const editor = tinymce.get(id);
                if (editor) {
                    const wordCount = editor.plugins.wordcount ? editor.plugins.wordcount.getCount() : 0;
                    if (wordCount > maxWords) {
                        hasError = true;
                    }
                }
            }
            if (hasError) {
                e.preventDefault();
                alert('Please fix the word counts! Some paragraphs exceed the maximum allowed words.');
            }
        });
    }
});
