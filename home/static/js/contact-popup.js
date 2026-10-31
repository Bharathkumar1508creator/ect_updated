(function () {
  "use strict";

  let activePopup = null;
  let lastFocusedElement = null;
  let scrollYAtOpen = 0;

  function focusableElements(popup) {
    return [...popup.querySelectorAll(
      "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]"
    )].filter(element => element.offsetParent !== null);
  }

  function openPopup(popup) {
    if (!popup) return;
    activePopup = popup;
    lastFocusedElement = document.activeElement;
    scrollYAtOpen = window.scrollY;
    popup.classList.add("is-open");
    popup.setAttribute("aria-hidden", "false");
    document.body.classList.add("ect-contact-popup-open");

    const first = focusableElements(popup)[0];
    // preventScroll: moving focus must never scroll the page behind the form.
    if (first) window.setTimeout(() => first.focus({ preventScroll: true }), 50);
  }

  function closePopup(popup) {
    if (!popup) return;
    if (activePopup === popup && popup.contains(document.activeElement)) {
      if (lastFocusedElement && document.contains(lastFocusedElement)) {
        lastFocusedElement.focus({ preventScroll: true });
      }
      if (popup.contains(document.activeElement)) document.activeElement.blur();
    }

    popup.classList.remove("is-open");
    popup.setAttribute("aria-hidden", "true");
    document.body.classList.remove("ect-contact-popup-open");
    if (activePopup === popup) activePopup = null;

    // Pages with pinned scroll scenes (the "Why Choose" cards) must come back exactly where they were.
    if (Math.abs(window.scrollY - scrollYAtOpen) > 1) {
      window.scrollTo({ top: scrollYAtOpen, left: 0, behavior: "instant" });
    }
  }

  function bindPopup(popup, triggerSelector, closeSelector) {
    if (!popup) return;

    document.querySelectorAll(triggerSelector).forEach(trigger => {
      trigger.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        openPopup(popup);
      });
    });

    popup.querySelectorAll(closeSelector).forEach(control => {
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

  function init() {
    bindPopup(
      document.getElementById("ectContactPopup"),
      "[data-contact-trigger], .popup-trigger",
      "[data-contact-close]"
    );
  }

  document.addEventListener("DOMContentLoaded", init);
})();
