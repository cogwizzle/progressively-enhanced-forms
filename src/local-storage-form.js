import { isSubmitEvent, isFormElement, fillForm } from './utils.js'

/**
 * `<local-storage-form>` — a zero-configuration wrapper that automatically
 * saves and restores the field values of any `<form id="...">` it contains.
 *
 * ## How it works
 *
 * - **On connect** — reads `localStorage` for each wrapped form and restores
 *   any previously saved values.
 * - **On submit** — serializes all form fields to `localStorage` under the
 *   form's `id`. Fields that belong to a nested `<repeating-section>` are
 *   excluded because that element manages its own storage.
 *
 * ## localStorage key
 *
 * Each form is stored under its `id` attribute:
 * ```
 * localStorage["my-form"] = '{"username":"alice","plan":"pro"}'
 * ```
 *
 * ## Requirements
 *
 * - The inner `<form>` **must** have an `id` attribute. Forms without an `id`
 *   are silently skipped.
 * - No JavaScript wiring is needed — drop the element into HTML and it works.
 * - No shadow DOM — styles applied to form elements pass through naturally.
 *
 * ## Supported field types
 *
 * text, email, password, number, date, and other text-like inputs; `<textarea>`;
 * `<select>`; radio groups; single checkboxes; multi-value checkbox groups.
 *
 * @example
 * <local-storage-form>
 *   <form id="profile">
 *     <input type="text"  name="username">
 *     <input type="email" name="email">
 *     <select name="role">
 *       <option value="admin">Admin</option>
 *       <option value="viewer">Viewer</option>
 *     </select>
 *     <input type="radio" name="plan" value="free">
 *     <input type="radio" name="plan" value="pro">
 *     <input type="checkbox" name="newsletter" value="yes">
 *     <button type="submit">Save</button>
 *   </form>
 * </local-storage-form>
 *
 * @example
 * // Multiple forms in one wrapper are each stored under their own id:
 * <local-storage-form>
 *   <form id="step-1">...</form>
 *   <form id="step-2">...</form>
 * </local-storage-form>
 */
class LocalStorageForm extends HTMLElement {
  #boundHandleFormSubmit = this.#handleFormSubmit.bind(this)

  connectedCallback() {
    this.addEventListener('submit', this.#boundHandleFormSubmit)
    this.#loadForms()
  }

  disconnectedCallback() {
    this.removeEventListener('submit', this.#boundHandleFormSubmit)
  }

  /**
   * Serializes `formData` to a plain object and writes it to `localStorage`
   * under `key`. Multi-value fields (same-name checkboxes) are stored as arrays;
   * single-value fields are stored as strings.
   *
   * @param {string} key
   * @param {FormData} formData
   */
  #write(key, formData) {
    const data = /** @type {Record<string, string | string[]>} */ ({})
    for (const name of formData.keys()) {
      if (name in data) continue
      const values = formData.getAll(name)
      data[name] = values.length === 1 ? /** @type {string} */ (values[0]) : /** @type {string[]} */ (values)
    }
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      throw new Error(`Failed to write to localStorage: ${error}`)
    }
  }

  /**
   * Reads and parses a JSON object from `localStorage`. Returns `null` when
   * no entry exists for `key`.
   *
   * @param {string} key
   * @returns {Record<string, string | string[]> | null}
   */
  #read(key) {
    try {
      const value = localStorage.getItem(key)
      if (!value) return null
      return JSON.parse(value)
    } catch (error) {
      throw new Error(`Failed to read from localStorage: ${error}`)
    }
  }

  /**
   * Handles a form submit event: prevents the default navigation, extracts
   * `FormData` from the submitted form, strips any fields owned by a nested
   * `<repeating-section>`, then persists the remainder to localStorage.
   *
   * @param {Event} event
   */
  #handleFormSubmit(event) {
    event.preventDefault()
    if (!isSubmitEvent(event)) {
      throw new Error('Event is not a SubmitEvent')
    }
    const element = event.target
    if (!element || !isFormElement(element)) {
      throw new Error('Event target is not a form element')
    }
    const { id } = element
    if (!id) {
      throw new Error('Form element must have an id attribute')
    }
    const formData = new FormData(element)
    for (const el of element.querySelectorAll('repeating-section [name]')) {
      formData.delete(el.getAttribute('name') ?? '')
    }
    this.#write(id, formData)
  }

  /**
   * Iterates every `<form id="...">` inside this element and restores any
   * previously saved values from localStorage.
   */
  #loadForms() {
    this.querySelectorAll('form').forEach((form) => {
      if (!form.id) return
      const stored = this.#read(form.id)
      if (!stored) return
      fillForm(form, stored)
    })
  }
}

if (customElements.get('local-storage-form') === undefined) {
  customElements.define('local-storage-form', LocalStorageForm)
}
