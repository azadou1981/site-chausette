import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import App from './App'

it('renders the shop call to action', () => {
  render(<App />)
  expect(screen.getByRole('button', { name: /shop now/i })).toBeTruthy()
})
