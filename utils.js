/**
 * @param {Event} event
 * @returns {event is SubmitEvent}
 */
export function isSubmitEvent(event) {
  return event instanceof SubmitEvent
}

/**
 * @param {Element | EventTarget} element
 * @returns {element is HTMLFormElement}
 */
export function isFormElement(element) {
  return element instanceof HTMLFormElement
}

/**
 * @param {HTMLFormElement} form
 * @param {Record<string, string | string[]>} data
 */
export function fillForm(form, data) {
  for (const [name, value] of Object.entries(data)) {
    const el = form.elements.namedItem(name)
    if (!el) continue

    if (el instanceof RadioNodeList) {
      const isCheckboxGroup = el[0] instanceof HTMLInputElement && el[0].type === 'checkbox'
      if (isCheckboxGroup) {
        /** @type {string[]} */
        const values = Array.isArray(value) ? value : [value]
        for (const node of el) {
          if (node instanceof HTMLInputElement) {
            node.checked = values.includes(node.value)
          }
        }
      } else {
        el.value = /** @type {string} */ (value)
      }
    } else if (el instanceof HTMLInputElement && el.type === 'checkbox') {
      el.checked = el.value === value
    } else {
      if (
        el instanceof HTMLInputElement
        || el instanceof HTMLTextAreaElement
        || el instanceof HTMLSelectElement
      ) {
        el.value = /** @type {string} */ (value)
      }
    }
  }
}
