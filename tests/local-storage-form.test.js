import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import '../src/local-storage-form.js'

function setup(html) {
  const root = document.createElement('div')
  root.innerHTML = html
  document.body.appendChild(root)
  return root
}

function submit(root) {
  root.querySelector('form').dispatchEvent(
    new SubmitEvent('submit', { bubbles: true, cancelable: true })
  )
}

beforeEach(() => localStorage.clear())
afterEach(() => {
  localStorage.clear()
  document.body.innerHTML = ''
})

describe('saving', () => {
  it('saves a text input', () => {
    const root = setup(`
      <local-storage-form>
        <form id="test">
          <input type="text" name="username">
        </form>
      </local-storage-form>
    `)
    root.querySelector('input').value = 'alice'
    submit(root)
    expect(JSON.parse(localStorage.getItem('test'))).toEqual({ username: 'alice' })
  })

  it('saves a textarea', () => {
    const root = setup(`
      <local-storage-form>
        <form id="test">
          <textarea name="bio">hello</textarea>
        </form>
      </local-storage-form>
    `)
    submit(root)
    expect(JSON.parse(localStorage.getItem('test'))).toEqual({ bio: 'hello' })
  })

  it('saves a select', () => {
    const root = setup(`
      <local-storage-form>
        <form id="test">
          <select name="role">
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
        </form>
      </local-storage-form>
    `)
    root.querySelector('select').value = 'viewer'
    submit(root)
    expect(JSON.parse(localStorage.getItem('test'))).toEqual({ role: 'viewer' })
  })

  it('saves a radio group', () => {
    const root = setup(`
      <local-storage-form>
        <form id="test">
          <input type="radio" name="plan" value="free">
          <input type="radio" name="plan" value="pro">
        </form>
      </local-storage-form>
    `)
    root.querySelector('input[value="pro"]').checked = true
    submit(root)
    expect(JSON.parse(localStorage.getItem('test'))).toEqual({ plan: 'pro' })
  })

  it('saves a single checkbox', () => {
    const root = setup(`
      <local-storage-form>
        <form id="test">
          <input type="checkbox" name="newsletter" value="yes">
        </form>
      </local-storage-form>
    `)
    root.querySelector('input').checked = true
    submit(root)
    expect(JSON.parse(localStorage.getItem('test'))).toEqual({ newsletter: 'yes' })
  })

  it('saves multi-value checkboxes as an array', () => {
    const root = setup(`
      <local-storage-form>
        <form id="test">
          <input type="checkbox" name="interests" value="music">
          <input type="checkbox" name="interests" value="code">
          <input type="checkbox" name="interests" value="sports">
        </form>
      </local-storage-form>
    `)
    root.querySelector('input[value="music"]').checked = true
    root.querySelector('input[value="code"]').checked = true
    submit(root)
    expect(JSON.parse(localStorage.getItem('test'))).toEqual({ interests: ['music', 'code'] })
  })
})

describe('loading', () => {
  it('restores a text input', () => {
    localStorage.setItem('test', JSON.stringify({ username: 'alice' }))
    const root = setup(`
      <local-storage-form>
        <form id="test">
          <input type="text" name="username">
        </form>
      </local-storage-form>
    `)
    expect(root.querySelector('input[name="username"]').value).toBe('alice')
  })

  it('restores a select', () => {
    localStorage.setItem('test', JSON.stringify({ role: 'viewer' }))
    const root = setup(`
      <local-storage-form>
        <form id="test">
          <select name="role">
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
        </form>
      </local-storage-form>
    `)
    expect(root.querySelector('select').value).toBe('viewer')
  })

  it('restores a radio group', () => {
    localStorage.setItem('test', JSON.stringify({ plan: 'pro' }))
    const root = setup(`
      <local-storage-form>
        <form id="test">
          <input type="radio" name="plan" value="free">
          <input type="radio" name="plan" value="pro">
        </form>
      </local-storage-form>
    `)
    expect(root.querySelector('input[value="pro"]').checked).toBe(true)
    expect(root.querySelector('input[value="free"]').checked).toBe(false)
  })

  it('restores a single checkbox', () => {
    localStorage.setItem('test', JSON.stringify({ newsletter: 'yes' }))
    const root = setup(`
      <local-storage-form>
        <form id="test">
          <input type="checkbox" name="newsletter" value="yes">
        </form>
      </local-storage-form>
    `)
    expect(root.querySelector('input[name="newsletter"]').checked).toBe(true)
  })

  it('restores multi-value checkboxes', () => {
    localStorage.setItem('test', JSON.stringify({ interests: ['music', 'code'] }))
    const root = setup(`
      <local-storage-form>
        <form id="test">
          <input type="checkbox" name="interests" value="music">
          <input type="checkbox" name="interests" value="code">
          <input type="checkbox" name="interests" value="sports">
        </form>
      </local-storage-form>
    `)
    expect(root.querySelector('input[value="music"]').checked).toBe(true)
    expect(root.querySelector('input[value="code"]').checked).toBe(true)
    expect(root.querySelector('input[value="sports"]').checked).toBe(false)
  })
})
