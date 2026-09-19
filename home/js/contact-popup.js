
(function () {
  "use strict";

  function getCookie(name) {
    const cookies = document.cookie ? document.cookie.split(";") : [];
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(name + "=")) {
        return decodeURIComponent(cookie.slice(name.length + 1));
      }
    }
    return "";
  }

  function setStatus(form, message, type) {
    const status = form.querySelector(".ect-form-status");
    if (!status) return;
    status.textContent = message || "";
    status.classList.remove("is-error", "is-success");
    if (type) status.classList.add(type);
  }

  function clearFieldError(field) {
    const group = field.closest(".wf-input-group");
    if (!group) return;
    group.classList.remove("has-error");
    const error = group.querySelector(".wf-field-error");
    if (error) error.remove();
  }

  function setFieldError(field, message) {
    const group = field.closest(".wf-input-group");
    if (!group) return;
    clearFieldError(field);
    group.classList.add("has-error");
    const error = document.createElement("span");
    error.className = "wf-field-error";
    error.textContent = message;
    group.appendChild(error);
  }

  function validateForm(form) {
    let valid = true;
    const name = form.elements.name;
    const email = form.elements.email;
    const message = form.elements.message;
    const phone = form.elements.phone;
    const honeypot = form.elements.website;

    form.querySelectorAll("input, select, textarea").forEach(clearFieldError);
    setStatus(form, "");

    if (honeypot && honeypot.value.trim()) {
      return false;
    }

    if (!name || !name.value.trim()) {
      setFieldError(name, "Full Name cannot be empty");
      valid = false;
    }

    if (!email || !email.value.trim()) {
      setFieldError(email, "Email cannot be empty");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.value.trim())) {
      setFieldError(email, "Enter a valid Email");
      valid = false;
    }

    if (phone && phone.value.trim() && !/^[0-9a-zA-Z+().;\-\s]{7,50}$/.test(phone.value.trim())) {
      setFieldError(phone, "Enter a valid Phone Number");
      valid = false;
    }

    if (!message || !message.value.trim()) {
      setFieldError(message, "Message cannot be empty");
      valid = false;
    }

    if (!valid) {
      const firstError = form.querySelector(".has-error input, .has-error select, .has-error textarea");
      if (firstError) firstError.focus();
    }

    return valid;
  }

  function setLoading(form, loading) {
    const button = form.querySelector(".btn-submit");
    if (!button) return;
    button.disabled = loading;
    button.classList.toggle("is-loading", loading);
    const label = button.querySelector(".ect-submit-label");
    if (label) label.textContent = loading ? "Sending..." : "Send Message";
  }

  async function submitForm(form) {
    if (!validateForm(form)) return;

    setLoading(form, true);
    setStatus(form, "Sending your message...", "");

    const data = new FormData(form);
    const csrf = getCookie("csrftoken");

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: data,
        credentials: "same-origin",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "Accept": "application/json",
          ...(csrf ? { "X-CSRFToken": csrf } : {})
        }
      });

      const raw = await response.text();
      let result = null;

      try {
        result = raw ? JSON.parse(raw) : null;
      } catch (parseError) {
        result = null;
      }

      if (!response.ok) {
        const message =
          (result && result.message) ||
          (response.status === 403
            ? "Security validation failed. Please refresh the page and try again."
            : "We couldn't submit your message right now. Please try again.");
        throw new Error(message);
      }

      if (!result || result.status !== "success") {
        throw new Error(
          (result && result.message) ||
          "We couldn't submit your message right now. Please try again."
        );
      }

      form.reset();
      form.querySelectorAll(".wf-input-group").forEach(group => {
        group.classList.remove("has-error");
        const error = group.querySelector(".wf-field-error");
        if (error) error.remove();
      });

      setStatus(
        form,
        result.message || "Thank you! Your message has been sent successfully.",
        "is-success"
      );

      const popup = form.closest(".ect-contact-popup");
      if (popup) {
        window.setTimeout(() => closePopup(popup), 2200);
      }
    } catch (error) {
      console.error("ECT contact form submission failed:", error);
      setStatus(
        form,
        error.message || "Something went wrong. Please try again.",
        "is-error"
      );
    } finally {
      setLoading(form, false);
    }
  }

  let activePopup = null;
  let lastFocusedElement = null;

  function openPopup(popup) {
    if (!popup) return;

    activePopup = popup;
    lastFocusedElement = document.activeElement;

    popup.classList.add("is-open");
    popup.setAttribute("aria-hidden", "false");
    document.body.classList.add("ect-contact-popup-open");

    const firstInput = popup.querySelector(
      "input:not([type='hidden']), select, textarea, button"
    );
    if (firstInput) {
      window.setTimeout(() => firstInput.focus(), 50);
    }
  }

  function closePopup(popup) {
    if (!popup) return;

    // Move focus out of the popup BEFORE marking it aria-hidden. Setting
    // aria-hidden="true" while a descendant (e.g. the close button just
    // clicked) still has focus is an ARIA violation — browsers block it
    // and log a warning, because a screen reader user's focus would
    // otherwise sit inside a subtree hidden from assistive tech.
    if (activePopup === popup && popup.contains(document.activeElement)) {
      if (lastFocusedElement && document.contains(lastFocusedElement)) {
        lastFocusedElement.focus();
      }
      // .focus() is a silent no-op on an element that isn't actually
      // focusable, which would leave focus trapped on the popup's close
      // button. Verify it actually left, and force it out if not — this
      // guarantees the popup never gets aria-hidden while still focused,
      // regardless of what lastFocusedElement turned out to be.
      if (popup.contains(document.activeElement)) {
        document.activeElement.blur();
      }
    }

    popup.classList.remove("is-open");
    popup.setAttribute("aria-hidden", "true");
    document.body.classList.remove("ect-contact-popup-open");

    const form = popup.querySelector(".ect-contact-form");
    if (form) {
      setStatus(form, "");
      setLoading(form, false);
    }

    if (activePopup === popup) {
      activePopup = null;
    }
  }

  function init() {
    const popup = document.getElementById("ectContactPopup");
    if (!popup) return;

    document.querySelectorAll("[data-contact-trigger], .popup-trigger").forEach(trigger => {
      trigger.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        openPopup(popup);
      });
    });

    popup.querySelectorAll("[data-contact-close]").forEach(control => {
      control.addEventListener("click", () => closePopup(popup));
    });

    const popupForm = popup.querySelector(".ect-contact-form");
    if (popupForm) {
      popupForm.addEventListener("submit", event => {
        event.preventDefault();
        submitForm(popupForm);
      });
    }

    document.querySelectorAll(".ect-contact-form").forEach(form => {
      if (form === popupForm) return;
      form.addEventListener("submit", event => {
        event.preventDefault();
        submitForm(form);
      });

      form.querySelectorAll("input, select, textarea").forEach(field => {
        field.addEventListener("input", () => clearFieldError(field));
        field.addEventListener("change", () => clearFieldError(field));
      });
    });

    popup.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePopup(popup);
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = [...popup.querySelectorAll(
        "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]"
      )].filter(el => el.offsetParent !== null);

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
