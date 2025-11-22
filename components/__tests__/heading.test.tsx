import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Heading } from '@/components/heading'
import { LucideIcon } from 'lucide-react'

// Create a mock icon that satisfies LucideIcon type
const createMockIcon = (): LucideIcon => {
  const MockIcon = ({ className }: { className?: string }) => (
    <div data-testid="icon" className={className}>Icon</div>
  )
  return MockIcon as LucideIcon
}

// Mock utils
vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}))

describe('Heading', () => {
  const MockIcon = createMockIcon()

  describe('Basic rendering', () => {
    it('renders with title and description', () => {
      render(
        <Heading
          title="Conversation"
          description="Our most advanced conversation model."
          icon={MockIcon}
          iconColor="text-violet-500"
          bgColor="bg-violet-500/10"
        />
      )

      expect(screen.getByText('Conversation')).toBeInTheDocument()
      expect(screen.getByText('Our most advanced conversation model.')).toBeInTheDocument()
    })

    it('renders the icon component', () => {
      render(
        <Heading
          title="Test Title"
          description="Test description"
          icon={MockIcon}
          iconColor="text-blue-500"
          bgColor="bg-blue-500/10"
        />
      )

      expect(screen.getByTestId('icon')).toBeInTheDocument()
    })

    it('renders without optional color props', () => {
      render(
        <Heading
          title="Test Title"
          description="Test description"
          icon={MockIcon}
        />
      )

      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByTestId('icon')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('applies icon color class to icon', () => {
      render(
        <Heading
          title="Image Generation"
          description="Turn your prompt into an image."
          icon={MockIcon}
          iconColor="text-pink-700"
          bgColor="bg-pink-700/10"
        />
      )

      const icon = screen.getByTestId('icon')
      expect(icon).toHaveClass('w-10 h-10 text-pink-700')
    })

    it('applies background color to icon container', () => {
      const { container } = render(
        <Heading
          title="Code Generation"
          description="Generate code using descriptive text."
          icon={MockIcon}
          iconColor="text-green-700"
          bgColor="bg-green-700/10"
        />
      )

      const iconContainer = container.querySelector('.p-2.w-fit.rounded-md')
      expect(iconContainer).toBeInTheDocument()
      expect(iconContainer).toHaveClass('bg-green-700/10')
    })

    it('applies base icon classes without color', () => {
      render(
        <Heading
          title="Test"
          description="Test"
          icon={MockIcon}
        />
      )

      const icon = screen.getByTestId('icon')
      expect(icon).toHaveClass('w-10', 'h-10')
    })

    it('applies base container classes without bgColor', () => {
      const { container } = render(
        <Heading
          title="Test"
          description="Test"
          icon={MockIcon}
        />
      )

      const iconContainer = container.querySelector('.p-2.w-fit.rounded-md')
      expect(iconContainer).toBeInTheDocument()
    })
  })

  describe('Different color combinations', () => {
    it('renders with violet color scheme', () => {
      render(
        <Heading
          title="Conversation"
          description="Chat with AI"
          icon={MockIcon}
          iconColor="text-violet-500"
          bgColor="bg-violet-500/10"
        />
      )

      const icon = screen.getByTestId('icon')
      expect(icon).toHaveClass('text-violet-500')
    })

    it('renders with emerald color scheme', () => {
      render(
        <Heading
          title="Music"
          description="Generate music"
          icon={MockIcon}
          iconColor="text-emerald-500"
          bgColor="bg-emerald-500/10"
        />
      )

      const icon = screen.getByTestId('icon')
      expect(icon).toHaveClass('text-emerald-500')
    })

    it('renders with pink color scheme', () => {
      render(
        <Heading
          title="Image"
          description="Generate images"
          icon={MockIcon}
          iconColor="text-pink-700"
          bgColor="bg-pink-700/10"
        />
      )

      const icon = screen.getByTestId('icon')
      expect(icon).toHaveClass('text-pink-700')
    })

    it('renders with orange color scheme', () => {
      render(
        <Heading
          title="Video"
          description="Generate videos"
          icon={MockIcon}
          iconColor="text-orange-700"
          bgColor="bg-orange-700/10"
        />
      )

      const icon = screen.getByTestId('icon')
      expect(icon).toHaveClass('text-orange-700')
    })

    it('renders with green color scheme', () => {
      render(
        <Heading
          title="Code"
          description="Generate code"
          icon={MockIcon}
          iconColor="text-green-700"
          bgColor="bg-green-700/10"
        />
      )

      const icon = screen.getByTestId('icon')
      expect(icon).toHaveClass('text-green-700')
    })
  })

  describe('Title element', () => {
    it('renders title as h2 element', () => {
      render(
        <Heading
          title="Music Generation"
          description="Turn your prompt into music."
          icon={MockIcon}
          iconColor="text-emerald-500"
          bgColor="bg-emerald-500/10"
        />
      )

      const title = screen.getByText('Music Generation')
      expect(title.tagName).toBe('H2')
    })

    it('applies correct title styling', () => {
      render(
        <Heading
          title="Test Title"
          description="Test description"
          icon={MockIcon}
        />
      )

      const title = screen.getByText('Test Title')
      expect(title).toHaveClass('text-3xl', 'font-bold')
    })
  })

  describe('Description element', () => {
    it('renders description as p element', () => {
      render(
        <Heading
          title="Video Generation"
          description="Turn your prompt into video."
          icon={MockIcon}
          iconColor="text-orange-700"
          bgColor="bg-orange-700/10"
        />
      )

      const description = screen.getByText('Turn your prompt into video.')
      expect(description.tagName).toBe('P')
    })

    it('applies correct description styling', () => {
      render(
        <Heading
          title="Test"
          description="Test description"
          icon={MockIcon}
        />
      )

      const description = screen.getByText('Test description')
      expect(description).toHaveClass('text-sm', 'text-muted-foreground')
    })
  })

  describe('Component structure', () => {
    it('applies correct wrapper classes', () => {
      const { container } = render(
        <Heading
          title="Test"
          description="Test"
          icon={MockIcon}
        />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('px-4', 'lg:px-8', 'flex', 'items-center', 'gap-x-3', 'mb-8')
    })

    it('has correct nested structure', () => {
      const { container } = render(
        <Heading
          title="Test"
          description="Test"
          icon={MockIcon}
        />
      )

      const iconContainer = container.querySelector('.p-2.w-fit.rounded-md')
      const textContainer = iconContainer?.nextElementSibling
      
      expect(iconContainer).toBeInTheDocument()
      expect(textContainer).toBeInTheDocument()
      expect(textContainer?.querySelector('h2')).toBeInTheDocument()
      expect(textContainer?.querySelector('p')).toBeInTheDocument()
    })

    it('matches snapshot with all props', () => {
      const { container } = render(
        <Heading
          title="Conversation"
          description="Chat with AI"
          icon={MockIcon}
          iconColor="text-violet-500"
          bgColor="bg-violet-500/10"
        />
      )

      expect(container).toMatchSnapshot()
    })

    it('matches snapshot without optional props', () => {
      const { container } = render(
        <Heading
          title="Test"
          description="Test description"
          icon={MockIcon}
        />
      )

      expect(container).toMatchSnapshot()
    })
  })

  describe('Different content', () => {
    it('renders with long title and description', () => {
      const longTitle = 'This is a very long title that should still render correctly'
      const longDescription = 'This is a very long description that provides detailed information about the feature and what it can do for users'

      render(
        <Heading
          title={longTitle}
          description={longDescription}
          icon={MockIcon}
        />
      )

      expect(screen.getByText(longTitle)).toBeInTheDocument()
      expect(screen.getByText(longDescription)).toBeInTheDocument()
    })

    it('renders with special characters', () => {
      render(
        <Heading
          title="AI & Machine Learning"
          description="Generate content with AI/ML models"
          icon={MockIcon}
        />
      )

      expect(screen.getByText('AI & Machine Learning')).toBeInTheDocument()
      expect(screen.getByText('Generate content with AI/ML models')).toBeInTheDocument()
    })
  })
})