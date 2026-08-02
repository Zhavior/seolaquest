import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AppLayout from './layout'

describe('onboarding route-group layout', () => {
  it('does not add a duplicate shell or main landmark', () => {
    render(
      <AppLayout>
        <main>Onboarding content</main>
      </AppLayout>,
    )

    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })
})
