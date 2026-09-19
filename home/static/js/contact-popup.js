(function () {
  "use strict";

  let activePopup = null;
  let lastFocusedElement = null;

  function focusableElements(popup) {
    return [...popup.querySelectorAll(
      "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]"
    )].filter(element => element.offsetParent !== null);
  }

  function openPopup(popup) {
    if (!popup) return;
    activePopup = popup;
    lastFocusedElement = document.activeElement;
    popup.classList.add("is-open");
    popup.setAttribute("aria-hidden", "false");
    document.body.classList.add("ect-contact-popup-open");

    const first = focusableElements(popup)[0];
    if (first) window.setTimeout(() => first.focus(), 50);
  }

  function closePopup(popup) {
    if (!popup) return;
    if (activePopup === popup && popup.contains(document.activeElement)) {
      if (lastFocusedElement && document.contains(lastFocusedElement)) {
        lastFocusedElement.focus();
      }
      if (popup.contains(document.activeElement)) document.activeElement.blur();
    }

    popup.classList.remove("is-open");
    popup.setAttribute("aria-hidden", "true");
    document.body.classList.remove("ect-contact-popup-open");
    if (activePopup === popup) activePopup = null;
  }

  function init() {
    const popup = document.getElementById("ectContactPopup");
    if (!popup) return;

    document.querySelectorAll("[data-contact-trigger], .popup-trigger").forEach(trigger => {
      trigger.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        openPopup(popup);
      });
    });

    popup.querySelectorAll("[data-contact-close]").forEach(control => {
      control.addEventListener("click", () => closePopup(popup));
    });

    popup.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePopup(popup);
        return;
      }
      if (event.key !== "Tab") return;

      const elements = focusableElements(popup);
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
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
