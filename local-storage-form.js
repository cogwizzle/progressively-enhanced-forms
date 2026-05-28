import { isSubmitEvent, isFormElement, fillForm } from './utils.js'

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
