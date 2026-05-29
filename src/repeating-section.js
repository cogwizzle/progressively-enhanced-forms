/**
 * `<repeating-section>` — a zero-configuration custom element that manages a
 * dynamic list of cloned template rows with automatic localStorage persistence.
 *
 * ## How it works
 *
 * - **On connect** — injects a rows container `<div>` immediately before the
 *   `[data-add]` button, then restores any previously saved rows from
 *   localStorage.
 * - **On form submit** — serializes every non-empty row to localStorage. Empty
 *   rows (all fields blank) are not saved.
 * - **On disconnect** — removes the submit listener from the parent form.
 *
 * ## HTML attributes
 *
 * | Attribute | Required | Description |
 * |-----------|----------|-------------|
 * | `name`    | yes      | Identifies this section. Also determines the localStorage key suffix (`formId.name`). |
 *
 * ## localStorage key
 *
 * Each section is stored under `{formId}.{name}`:
 * ```
 * localStorage["profile.contacts"] = '[{"_rowId":"abc","contact-name":"Alice"}]'
 * ```
 *
 * ## Template structure
 *
 * Define row fields inside a `<template>` as the first direct child.
 * Use standard `name` attributes — the element reads them for accessibility
 * and internally renames each field to `{name}-{rowId}` to guarantee
 * uniqueness across rows.
 *
 * A `data-name` attribute is also added to each field so the element can
 * locate field values by their original name when saving, without relying
 * on the generated `name` attribute.
 *
 * ## Add button
 *
 * Place any element with `data-add` as a direct child — clicking it appends a
 * new row. You control the button's markup, placement, and styling.
 *
 * ## Requirements
 *
 * - Must be placed inside a `<form id="...">`.
 * - The parent form **must** have an `id` attribute.
 * - No JavaScript wiring is needed — drop the element into HTML and it works.
 * - No shadow DOM — styles pass through to template fields naturally.
 * - Nested `<repeating-section>` elements are not supported.
 *
 * @attr {string} name - Identifies this section within the form and determines
 *   the localStorage key suffix. The full key is `{formId}.{name}`. Required.
 *
 * @example
 * <form id="profile">
 *   <repeating-section name="contacts">
 *     <template>
 *       <label>Name  <input name="contact-name"  type="text"></label>
 *       <label>Email <input name="contact-email" type="email"></label>
 *     </template>
 *     <button type="button" data-add>Add Contact</button>
 *   </repeating-section>
 *   <button type="submit">Save</button>
 * </form>
 *
 * @example
 * // Works standalone without <local-storage-form> — it attaches its own
 * // submit listener directly to the parent <form>:
 * <form id="order">
 *   <repeating-section name="items">
 *     <template>
 *       <input name="item-name"  type="text">
 *       <input name="item-price" type="number">
 *     </template>
 *     <button type="button" data-add>Add Item</button>
 *   </repeating-section>
 *   <button type="submit">Place Order</button>
 * </form>
 */
class RepeatingSection extends HTMLElement {
  /** @type {HTMLTemplateElement | null} */
  #template = null
  /** @type {HTMLElement | null} */
  #rowsContainer = null
  /** @type {HTMLFormElement | null} */
  #form = null
  #boundSave = this.#save.bind(this)

  connectedCallback() {
    this.#template = this.querySelector(':scope > template')
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
   * Generates a collision-free UUID for a new row by comparing against all
   * row IDs already present in the container.
   *
   * @returns {string}
   */
  #generateRowId() {
    const existing = new Set(
      [.../** @type {NodeListOf<HTMLElement>} */ (this.#rowsContainer?.querySelectorAll(':scope > [data-row-id]') ?? [])]
        .map(el => el.dataset.rowId)
    )
    let id
    do { id = crypto.randomUUID() } while (existing.has(id))
    return id
  }

  /**
   * Clones the `<template>`, stamps each field with a `data-name` attribute
   * (preserving the original `name` for accessibility lookups) and renames
   * the field to `{name}-{rowId}` to guarantee form uniqueness. Pre-populates
   * field values from `data` when restoring saved rows.
   *
   * @param {Record<string, string>} [data] - Optional saved field values keyed
   *   by their original `name`. `_rowId` is reserved for the row identifier.
   */
  #addRow(data = {}) {
    if (!this.#template || !this.#rowsContainer) return

    const rowId = data._rowId ?? this.#generateRowId()
    const row = document.createElement('div')
    row.dataset.rowId = rowId

    const content = /** @type {DocumentFragment} */ (this.#template.content.cloneNode(true))

    for (const el of content.querySelectorAll('[name]')) {
      if (
        el instanceof HTMLInputElement
        || el instanceof HTMLTextAreaElement
        || el instanceof HTMLSelectElement
      ) {
        const fieldName = el.name
        el.dataset.name = fieldName
        el.name = `${fieldName}-${rowId}`

        if (el instanceof HTMLInputElement && el.type === 'checkbox') {
          el.checked = data[fieldName] === 'true'
        } else {
          el.value = data[fieldName] ?? ''
        }
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
   * Collects all row field values and writes them to localStorage under
   * `{formId}.{name}`. Rows where every field is blank (or unchecked) are
   * filtered out so empty rows are never persisted.
   *
   * @param {Event} event
   */
  #save(event) {
    if (!this.#rowsContainer) return
    const form = event.target
    if (!(form instanceof HTMLFormElement) || !form.id) return

    const rows = this.#rowsContainer.querySelectorAll(':scope > div')
    const data = [...rows]
      .map(row => {
        const rowId = /** @type {HTMLElement} */ (row).dataset.rowId ?? ''
        const fields = Object.fromEntries(
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
        return { _rowId: rowId, ...fields }
      })
      .filter(({ _rowId, ...fields }) => Object.values(fields).some(v => v !== '' && v !== 'false'))

    try {
      localStorage.setItem(`${form.id}.${this.getAttribute('name')}`, JSON.stringify(data))
    } catch (error) {
      throw new Error(`Failed to save repeating section: ${error}`)
    }
  }

  /**
   * Reads saved row data from localStorage and replays each row via `#addRow`,
   * restoring field values and the original row IDs.
   *
   * @param {string} formId - The `id` of the parent `<form>`.
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

  /**
   * Creates the rows container `<div>` and inserts it before the `[data-add]`
   * button. Wires the add button's click event to `#addRow`.
   */
  #render() {
    const rows = document.createElement('div')
    const addBtn = this.querySelector(':scope > [data-add]')
    this.insertBefore(rows, addBtn)
    this.#rowsContainer = rows
    addBtn?.addEventListener('click', () => this.#addRow())
  }
}

if (customElements.get('repeating-section') === undefined) {
  customElements.define('repeating-section', RepeatingSection)
}
