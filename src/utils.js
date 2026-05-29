/**
 * Narrows an `Event` to `SubmitEvent`.
 *
 * @param {Event} event
 * @returns {event is SubmitEvent}
 */
export function isSubmitEvent(event) {
  return event instanceof SubmitEvent
}

/**
 * Narrows an `Element | EventTarget` to `HTMLFormElement`.
 *
 * @param {Element | EventTarget} element
 * @returns {element is HTMLFormElement}
 */
export function isFormElement(element) {
  return element instanceof HTMLFormElement
}

/**
 * Populates a form's fields from a plain data object, handling every standard
 * input type:
 *
 * - **text / textarea / select** — sets `element.value`
 * - **radio group** — checks the radio whose `value` matches the stored string
 * - **single checkbox** — checks the box when its `value` matches the stored string
 * - **checkbox group** (multiple `<input type="checkbox">` sharing a `name`) —
 *   checks every box whose `value` appears in the stored array
 *
 * Fields not present in `data` are left untouched. Unknown keys in `data` are
 * silently ignored.
 *
 * @param {HTMLFormElement} form - The form to populate.
 * @param {Record<string, string | string[]>} data - Key/value pairs where each
 *   key is a field `name` and the value is either a single string or an array
 *   of strings (for multi-value checkboxes).
 *
 * @example
 * fillForm(document.querySelector('form'), {
 *   username: 'alice',
 *   plan: 'pro',
 *   interests: ['music', 'code'],
 * })
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
        for (const node of el) {
          if (node instanceof HTMLInputElement) {
            node.checked = node.value === value
          }
        }
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
