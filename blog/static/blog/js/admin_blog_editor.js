(function () {
  "use strict";

  function getCsrfToken() {
    var input = document.querySelector('[name="csrfmiddlewaretoken"]');
    return input ? input.value : "";
  }

  function editorConfig() {
    var node = document.getElementById("blog-editor-config");
    if (!node) return {};
    try { return JSON.parse(node.textContent); } catch (error) { return {}; }
  }

  function plainText(html) {
    var element = document.createElement("div");
    element.innerHTML = html || "";
    return (element.textContent || "").trim();
  }

  function getEditor() {
    return window.tinymce ? tinymce.get("id_article_content") : null;
  }

  function collectDraft(editor) {
    var fields = {};
    ["id_title", "id_slug", "id_hero_description", "id_meta_title", "id_meta_description", "id_primary_keyword"].forEach(function (id) {
      var field = document.getElementById(id);
      if (field) fields[id] = field.value;
    });
    return { savedAt: new Date().toISOString(), html: editor ? editor.getContent() : "", fields: fields };
  }

  function saveLocalDraft(editor, config) {
    if (!config.autosaveKey || !window.localStorage) return;
    try {
      localStorage.setItem(config.autosaveKey, JSON.stringify(collectDraft(editor)));
      var status = document.getElementById("blogAutosaveStatus");
      if (status) status.textContent = "Local backup saved at " + new Date().toLocaleTimeString();
      var restore = document.getElementById("blogRestoreDraft");
      if (restore) restore.hidden = false;
    } catch (error) {
      var failed = document.getElementById("blogAutosaveStatus");
      if (failed) failed.textContent = "Browser backup is unavailable.";
    }
  }

  function restoreLocalDraft(editor, config) {
    try {
      var draft = JSON.parse(localStorage.getItem(config.autosaveKey) || "null");
      if (!draft) return;
      if (editor && typeof draft.html === "string") editor.setContent(draft.html);
      Object.keys(draft.fields || {}).forEach(function (id) {
        var field = document.getElementById(id);
        if (field) field.value = draft.fields[id];
      });
      refreshTocAndSeo(editor);
      var status = document.getElementById("blogAutosaveStatus");
      if (status) status.textContent = "Local backup restored. Review it, then save the article.";
    } catch (error) {
      window.alert("The local backup could not be restored.");
    }
  }

  function addCounter(fieldId, recommended) {
    var field = document.getElementById(fieldId);
    if (!field || field.dataset.counterReady) return;
    field.dataset.counterReady = "true";
    var counter = document.createElement("div");
    counter.className = "seo-char-count";
    field.insertAdjacentElement("afterend", counter);
    function update() {
      counter.textContent = field.value.length + " / " + recommended + " characters recommended";
      counter.classList.toggle("over", field.value.length > recommended);
    }
    field.addEventListener("input", update);
    update();
  }

  function refreshTocAndSeo(editor) {
    var html = editor ? editor.getContent() : "";
    var wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    var headings = Array.prototype.slice.call(wrapper.querySelectorAll("h2"));
    var toc = document.getElementById("blogTocPreview");
    if (toc) {
      toc.innerHTML = "";
      if (!headings.length) {
        toc.innerHTML = '<li class="empty">Add an H2 to create the table of contents.</li>';
      } else {
        headings.forEach(function (heading) {
          var item = document.createElement("li");
          item.textContent = heading.textContent.trim() || "Untitled H2";
          toc.appendChild(item);
        });
      }
    }

    var title = (document.getElementById("id_meta_title") || {}).value ||
      (document.getElementById("id_title") || {}).value || "";
    var description = (document.getElementById("id_meta_description") || {}).value || "";
    var keyword = ((document.getElementById("id_primary_keyword") || {}).value || "").trim().toLowerCase();
    var heroImage = document.getElementById("id_hero_image");
    var heroAlt = (document.getElementById("id_hero_image_alt") || {}).value || "";
    var images = Array.prototype.slice.call(wrapper.querySelectorAll("img"));
    var checks = [
      ["SEO title", !!title],
      ["Meta description", !!description],
      ["Article content", !!plainText(html)],
      ["At least one H2", headings.length > 0],
      ["Internal link", !!wrapper.querySelector('a[href^="/"]:not([href^="//"])')],
      ["Image alt text", images.every(function (image) { return !!image.getAttribute("alt"); })],
      ["Hero image alt", !heroImage || !heroImage.value || !!heroAlt],
      ["Primary keyword", !!keyword],
      ["Keyword in title", !keyword || title.toLowerCase().indexOf(keyword) !== -1],
      ["Keyword in description", !keyword || description.toLowerCase().indexOf(keyword) !== -1]
    ];
    var list = document.getElementById("blogSeoChecks");
    if (list) {
      list.innerHTML = "";
      checks.forEach(function (check) {
        var item = document.createElement("li");
        item.className = check[1] ? "seo-pass" : "seo-fail";
        item.textContent = (check[1] ? "✓ " : "✕ ") + check[0];
        list.appendChild(item);
      });
    }
    var score = Math.round(checks.filter(function (check) { return check[1]; }).length / checks.length * 100);
    var scoreNode = document.getElementById("blogSeoScore");
    if (scoreNode) scoreNode.textContent = String(score);
  }

  function insertBlock(tag) {
    var editor = getEditor();
    if (!editor) return;
    var label = tag === "p" ? "Write your paragraph here…" : "Add your section heading";
    editor.focus();
    editor.insertContent("<" + tag + ">" + label + "</" + tag + "><p><br></p>");
    refreshTocAndSeo(editor);
  }

  function openLinkDialog(external) {
    var editor = getEditor();
    if (!editor) return;
    editor.focus();
    editor.execCommand("mceLink");
    if (external) {
      window.setTimeout(function () {
        var target = document.querySelector('.tox-dialog select[aria-label="Open link in..."]');
        if (target) target.value = "_blank";
      }, 100);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var config = editorConfig();
    if (!window.tinymce || !document.getElementById("id_article_content")) return;

    tinymce.init({
      selector: "textarea#id_article_content",
      license_key: "gpl",
      height: 680,
      menubar: "edit insert format tools table help",
      plugins: "advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen table help wordcount",
      toolbar: "undo redo | blocks | bold italic underline strikethrough | bullist numlist blockquote | link image table | removeformat | preview code",
      block_formats: "Paragraph=p;Heading 2=h2;Heading 3=h3;Heading 4=h4;Heading 5=h5;Heading 6=h6",
      content_style: "body{font-family:Inter,Arial,sans-serif;font-size:17px;line-height:1.8;max-width:820px;margin:32px auto;padding:0 24px}h2,h3,h4,h5,h6{color:#12271b}img{max-width:100%;height:auto}",
      link_list: config.linksUrl || undefined,
      link_target_list: [
        { title: "Same window", value: "" },
        { title: "New window", value: "_blank" }
      ],
      link_rel_list: [
        { title: "Normal", value: "" },
        { title: "Nofollow", value: "nofollow" },
        { title: "Sponsored", value: "sponsored" },
        { title: "User generated content", value: "ugc" }
      ],
      image_title: true,
      image_list: config.imagesUrl || undefined,
      convert_urls: false,
      automatic_uploads: true,
      images_file_types: "jpg,jpeg,png,webp",
      images_upload_handler: function (blobInfo, progress) {
        return new Promise(function (resolve, reject) {
          var form = new FormData();
          form.append("file", blobInfo.blob(), blobInfo.filename());
          var request = new XMLHttpRequest();
          request.open("POST", config.uploadUrl, true);
          request.setRequestHeader("X-CSRFToken", getCsrfToken());
          request.upload.onprogress = function (event) {
            if (event.lengthComputable) progress(event.loaded / event.total * 100);
          };
          request.onload = function () {
            var response;
            try { response = JSON.parse(request.responseText); } catch (error) { response = {}; }
            if (request.status < 200 || request.status >= 300 || !response.location) {
              reject(response.error || "Image upload failed.");
              return;
            }
            resolve(response.location);
          };
          request.onerror = function () { reject("Image upload failed."); };
          request.send(form);
        });
      },
      setup: function (editor) {
        editor.on("init", function () {
          var restore = document.getElementById("blogRestoreDraft");
          if (restore && config.autosaveKey && localStorage.getItem(config.autosaveKey)) restore.hidden = false;
          refreshTocAndSeo(editor);
        });
        editor.on("input change undo redo SetContent", function () {
          refreshTocAndSeo(editor);
        });
      }
    });

    document.querySelectorAll("[data-blog-block]").forEach(function (button) {
      button.addEventListener("click", function () { insertBlock(button.dataset.blogBlock); });
    });
    document.querySelector('[data-blog-action="image"]')?.addEventListener("click", function () {
      var editor = getEditor();
      if (editor) editor.execCommand("mceImage");
    });
    document.querySelector('[data-blog-action="internal-link"]')?.addEventListener("click", function () {
      openLinkDialog(false);
    });
    document.querySelector('[data-blog-action="external-link"]')?.addEventListener("click", function () {
      openLinkDialog(true);
    });

    ["id_title", "id_meta_title", "id_meta_description", "id_primary_keyword", "id_hero_image_alt"].forEach(function (id) {
      var field = document.getElementById(id);
      if (field) field.addEventListener("input", function () { refreshTocAndSeo(getEditor()); });
    });
    addCounter("id_meta_title", 60);
    addCounter("id_meta_description", 160);

    var linkButton = document.getElementById("blogLinkCheck");
    if (linkButton) linkButton.addEventListener("click", function () {
      var editor = getEditor();
      var result = document.getElementById("blogLinkResult");
      var form = new FormData();
      form.append("html", editor ? editor.getContent() : "");
      fetch(config.validateLinksUrl, {
        method: "POST",
        body: form,
        headers: { "X-CSRFToken": getCsrfToken() }
      }).then(function (response) { return response.json(); }).then(function (data) {
        if (!result) return;
        var invalid = (data.results || []).filter(function (item) { return !item.valid; });
        result.textContent = invalid.length
          ? invalid.length + " broken link(s): " + invalid.map(function (item) { return item.original + " — " + item.message; }).join("; ")
          : data.count + " link(s) checked; all internal routes and anchors are valid.";
        result.className = "blog-tool-help " + (invalid.length ? "seo-fail" : "seo-pass");
      }).catch(function () {
        if (result) result.textContent = "Link checking is temporarily unavailable.";
      });
    });

    var editor = getEditor();
    window.setInterval(function () { saveLocalDraft(getEditor(), config); }, 10000);
    document.getElementById("blogSaveLocalDraft")?.addEventListener("click", function () { saveLocalDraft(getEditor(), config); });
    document.getElementById("blogRestoreDraft")?.addEventListener("click", function () {
      if (window.confirm("Restore the latest browser backup into this editor?")) restoreLocalDraft(getEditor(), config);
    });
  });
})();
