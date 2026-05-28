class RepeatingSection extends HTMLElement {
  /** @type {HTMLTemplateElement | null} */
  #template = null
  /** @type {HTMLElement | null} */
  #rowsContainer = null
  /** @type {HTMLFormElement | null} */
  #form = null
  #boundSave = this.#save.bind(this)

  connectedCallback() {
    this.#template = this.querySelector('template')
    this.#render()

    this.#form = this.closest('form')
    if (this.#form) {
      this.#form.addEventListener('submit', this.#boundSave)
      this.#load(this.#form.id)
    }
  }

  disconnectedCallback() {
    if (this.#form) {
      this.#form.removeEventListener('submit', this.#boundSave)
      this.#form = null
    }
  }

  /**
   * @param {Record<string, string>} [data]
   */
  #addRow(data = {}) {
    if (!this.#template || !this.#rowsContainer) return

    const row = document.createElement('div')
    const content = /** @type {DocumentFragment} */ (this.#template.content.cloneNode(true))

    for (const el of content.querySelectorAll('[data-name]')) {
      const name = el.dataset.name ?? ''
      if (el instanceof HTMLInputElement && el.type === 'checkbox') {
        el.checked = data[name] === 'true'
      } else if (
        el instanceof HTMLInputElement
        || el instanceof HTMLTextAreaElement
        || el instanceof HTMLSelectElement
      ) {
        el.value = data[name] ?? ''
      }
    }

    const removeBtn = document.createElement('button')
    removeBtn.type = 'button'
    removeBtn.textContent = 'Remove'
    removeBtn.addEventListener('click', () => row.remove())

    row.appendChild(content)
    row.appendChild(removeBtn)
    this.#rowsContainer.appendChild(row)
  }

  /**
   * @param {Event} event
   */
  #save(event) {
    if (!this.#rowsContainer) return
    const form = event.target
    if (!(form instanceof HTMLFormElement) || !form.id) return

    const rows = this.#rowsContainer.querySelectorAll(':scope > div')
    const data = [...rows]
      .map(row =>
        Object.fromEntries(
          [...row.querySelectorAll('[data-name]')].map((el) => {
            const name = /** @type {HTMLElement} */ (el).dataset.name ?? ''
            if (el instanceof HTMLInputElement && el.type === 'checkbox') {
              return [name, String(el.checked)]
            }
            if (
              el instanceof HTMLInputElement
              || el instanceof HTMLTextAreaElement
              || el instanceof HTMLSelectElement
            ) {
              return [name, el.value]
            }
            return [name, '']
          })
        )
      )
      .filter(rowData => Object.values(rowData).some(v => v !== '' && v !== 'false'))

    try {
      localStorage.setItem(`${form.id}.${this.getAttribute('name')}`, JSON.stringify(data))
    } catch (error) {
      throw new Error(`Failed to save repeating section: ${error}`)
    }
  }

  /**
   * @param {string} formId
   */
  #load(formId) {
    if (!formId) return
    try {
      const stored = localStorage.getItem(`${formId}.${this.getAttribute('name')}`)
      if (!stored) return
      /** @type {Record<string, string>[]} */
      const data = JSON.parse(stored)
      for (const rowData of data) {
        this.#addRow(rowData)
      }
    } catch (error) {
      throw new Error(`Failed to load repeating section: ${error}`)
    }
  }

  #render() {
    const rows = document.createElement('div')
    const addBtn = document.createElement('button')
    addBtn.type = 'button'
    addBtn.textContent = 'Add'
    addBtn.addEventListener('click', () => this.#addRow())
    this.appendChild(rows)
    this.appendChild(addBtn)
    this.#rowsContainer = rows
  }
}

if (customElements.get('repeating-section') === undefined) {
  customElements.define('repeating-section', RepeatingSection)
}
