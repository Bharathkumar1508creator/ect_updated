document.addEventListener('DOMContentLoaded', function() {
    function toggleMediaFields(prefix) {
        var mediaTypeSelect = document.querySelector('#id_' + prefix + '_media_type');
        var imageFieldRow = document.querySelector('.field-' + prefix + '_image');
        var videoFieldRow = document.querySelector('.field-' + prefix + '_video');

        if (!mediaTypeSelect || !imageFieldRow || !videoFieldRow) return;

        function updateVisibility() {
            var val = mediaTypeSelect.value;
            if (val === 'image') {
                imageFieldRow.style.display = 'block';
                videoFieldRow.style.display = 'none';
            } else if (val === 'video') {
                imageFieldRow.style.display = 'none';
                videoFieldRow.style.display = 'block';
            } else {
                imageFieldRow.style.display = 'none';
                videoFieldRow.style.display = 'none';
            }
        }

        mediaTypeSelect.addEventListener('change', updateVisibility);
        updateVisibility();
    }

    // Toggle for Hero Media
    toggleMediaFields('hero');
    
    // Toggle for Content Media
    toggleMediaFields('content');
});
