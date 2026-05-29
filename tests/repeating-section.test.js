import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import '../src/repeating-section.js'

const TEMPLATE_HTML = `
  <form id="test">
    <repeating-section name="items">
      <template>
        <input name="item-name" type="text">
        <input name="item-value" type="text">
      </template>
      <button type="button" data-add>Add</button>
    </repeating-section>
  </form>
`

function setup(html = TEMPLATE_HTML) {
  const root = document.createElement('div')
  root.innerHTML = html
  document.body.appendChild(root)
  return root
}

function submit(root) {
  root.querySelector('form').dispatchEvent(
    new Event('submit', { bubbles: true, cancelable: true })
  )
}

function addRow(root) {
  root.querySelector('[data-add]').click()
}

function getRows(root) {
  return [...root.querySelectorAll('[data-row-id]')]
}

beforeEach(() => localStorage.clear())
afterEach(() => {
  localStorage.clear()
  document.body.innerHTML = ''
})

describe('rendering', () => {
  it('inserts a rows container on connect', () => {
    const root = setup()
    const section = root.querySelector('repeating-section')
    expect(section.querySelector('div')).not.toBeNull()
  })

  it('inserts the rows container before the add button', () => {
    const root = setup()
    const section = root.querySelector('repeating-section')
    const children = [...section.children].filter(el => el.tagName !== 'TEMPLATE')
    expect(children[0].tagName).toBe('DIV')
    expect(children[1].getAttribute('data-add')).not.toBeNull()
  })
})

describe('adding rows', () => {
  it('adds a row when the add button is clicked', () => {
    const root = setup()
    addRow(root)
    expect(getRows(root)).toHaveLength(1)
  })

  it('each row contains the template fields', () => {
    const root = setup()
    addRow(root)
    const row = getRows(root)[0]
    expect(row.querySelector('[data-name="item-name"]')).not.toBeNull()
    expect(row.querySelector('[data-name="item-value"]')).not.toBeNull()
  })

  it('each row has a remove button', () => {
    const root = setup()
    addRow(root)
    const row = getRows(root)[0]
    expect(row.querySelector('button')).not.toBeNull()
  })

  it('generated input names are unique across rows', () => {
    const root = setup()
    addRow(root)
    addRow(root)
    const names = [...root.querySelectorAll('[data-name="item-name"]')].map(el => el.name)
    expect(new Set(names).size).toBe(2)
  })
})

describe('removing rows', () => {
  it('removes the correct row when remove is clicked', () => {
    const root = setup()
    addRow(root)
    addRow(root)

    const [row1] = getRows(root)
    row1.querySelector('button').click()

    expect(getRows(root)).toHaveLength(1)
  })
})

describe('saving', () => {
  it('saves row data to localStorage on submit', () => {
    const root = setup()
    addRow(root)

    const row = getRows(root)[0]
    row.querySelector('[data-name="item-name"]').value = 'foo'
    row.querySelector('[data-name="item-value"]').value = 'bar'

    submit(root)

    const stored = JSON.parse(localStorage.getItem('test.items'))
    expect(stored).toHaveLength(1)
    expect(stored[0]['item-name']).toBe('foo')
    expect(stored[0]['item-value']).toBe('bar')
  })

  it('persists the row ID with saved data', () => {
    const root = setup()
    addRow(root)

    const row = getRows(root)[0]
    const rowId = row.dataset.rowId
    row.querySelector('[data-name="item-name"]').value = 'foo'

    submit(root)

    const stored = JSON.parse(localStorage.getItem('test.items'))
    expect(stored[0]._rowId).toBe(rowId)
  })

  it('does not save empty rows', () => {
    const root = setup()
    addRow(root)

    submit(root)

    const stored = JSON.parse(localStorage.getItem('test.items'))
    expect(stored).toHaveLength(0)
  })
})

describe('loading', () => {
  it('restores rows from localStorage on connect', () => {
    localStorage.setItem('test.items', JSON.stringify([
      { _rowId: 'abc', 'item-name': 'foo', 'item-value': 'bar' }
    ]))

    const root = setup()

    expect(getRows(root)).toHaveLength(1)
    expect(root.querySelector('[data-name="item-name"]').value).toBe('foo')
    expect(root.querySelector('[data-name="item-value"]').value).toBe('bar')
  })

  it('restores the persisted row ID', () => {
    localStorage.setItem('test.items', JSON.stringify([
      { _rowId: 'abc', 'item-name': 'foo', 'item-value': 'bar' }
    ]))

    const root = setup()

    expect(getRows(root)[0].dataset.rowId).toBe('abc')
  })

  it('restores multiple rows in order', () => {
    localStorage.setItem('test.items', JSON.stringify([
      { _rowId: 'abc', 'item-name': 'first', 'item-value': '1' },
      { _rowId: 'def', 'item-name': 'second', 'item-value': '2' }
    ]))

    const root = setup()
    const rows = getRows(root)

    expect(rows).toHaveLength(2)
    expect(rows[0].querySelector('[data-name="item-name"]').value).toBe('first')
    expect(rows[1].querySelector('[data-name="item-name"]').value).toBe('second')
  })
})
