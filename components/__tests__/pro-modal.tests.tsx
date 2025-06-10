import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProModal } from '../../components/pro-modal';
import { useProModal } from '@/hooks/use-pro-modal';

vi.mock('@/hooks/use-pro-modal');

vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { url: 'mock-stripe-url' } }))
  }
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn()
  }
}));

const mockUseProModal = useProModal as any;

describe('ProModal Snapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal Closed State', () => {
    it('should match snapshot when modal is closed', () => {
      mockUseProModal.mockReturnValue({
        isOpen: false,
        onClose: vi.fn(),
        onOpen: vi.fn()
      });

      const { container } = render(<ProModal />);
      expect(container).toMatchSnapshot();
    });
  });

  describe('Modal Open State', () => {
    it('should match snapshot when modal is open', () => {
      mockUseProModal.mockReturnValue({
        isOpen: true,
        onClose: vi.fn(),
        onOpen: vi.fn()
      });

      const { container } = render(<ProModal />);
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot with different onClose handler', () => {
      const customOnClose = vi.fn();
      mockUseProModal.mockReturnValue({
        isOpen: true,
        onClose: customOnClose,
        onOpen: vi.fn()
      });

      const { container } = render(<ProModal />);
      expect(container).toMatchSnapshot();
    });
  });

  describe('Component Structure Snapshots', () => {
    beforeEach(() => {
      mockUseProModal.mockReturnValue({
        isOpen: true,
        onClose: vi.fn(),
        onOpen: vi.fn()
      });
    });

    it('should match snapshot for dialog header section', () => {
      const { container } = render(<ProModal />);
      const dialogHeader = container.querySelector('[class*="flex justify-center items-center flex-col gap-y-4 pb-2"]');
      expect(dialogHeader).toMatchSnapshot();
    });

    it('should match snapshot for tools section', () => {
      const { container } = render(<ProModal />);
      const toolsSection = container.querySelector('[class*="text-center pt-2 space-y-2 text-zinc-900 font-medium"]');
      expect(toolsSection).toMatchSnapshot();
    });

    it('should match snapshot for upgrade button section', () => {
      const { container } = render(<ProModal />);
      const buttonSection = container.querySelector('button[class*="w-full"]');
      expect(buttonSection).toMatchSnapshot();
    });
  });

  describe('Tools Array Snapshot', () => {
    it('should match snapshot showing all tool cards', () => {
      mockUseProModal.mockReturnValue({
        isOpen: true,
        onClose: vi.fn(),
        onOpen: vi.fn()
      });

      const { container } = render(<ProModal />);
      
      // Get all tool cards
      const toolCards = container.querySelectorAll('[class*="p-3 border-black/5 flex items-center justify-between"]');
      
      toolCards.forEach((card, index) => {
        expect(card).toMatchSnapshot(`tool-card-${index}`);
      });
    });
  });

  describe('Badge and Icon Snapshots', () => {
    beforeEach(() => {
      mockUseProModal.mockReturnValue({
        isOpen: true,
        onClose: vi.fn(),
        onOpen: vi.fn()
      });
    });

    it('should match snapshot for premium badge', () => {
      const { container } = render(<ProModal />);
      const badge = container.querySelector('[variant="premium"]');
      expect(badge).toMatchSnapshot();
    });

    it('should match snapshot for zap icon in button', () => {
      const { container } = render(<ProModal />);
      const zapIcon = container.querySelector('button [class*="w-4 h-4 ml-2 fill-white"]');
      expect(zapIcon).toMatchSnapshot();
    });

    it('should match snapshot for check icons', () => {
      const { container } = render(<ProModal />);
      const checkIcons = container.querySelectorAll('[class*="text-primary w-5 h-5"]');
      
      checkIcons.forEach((icon, index) => {
        expect(icon).toMatchSnapshot(`check-icon-${index}`);
      });
    });
  });

  describe('CSS Classes Snapshots', () => {
    beforeEach(() => {
      mockUseProModal.mockReturnValue({
        isOpen: true,
        onClose: vi.fn(),
        onOpen: vi.fn()
      });
    });

    it('should match snapshot for tool icon styling', () => {
      const { container } = render(<ProModal />);
      
      // Get all tool icons with their colored backgrounds
      const toolIcons = container.querySelectorAll('[class*="p-2 w-fit rounded-md"]');
      
      toolIcons.forEach((iconContainer, index) => {
        expect(iconContainer).toMatchSnapshot(`tool-icon-container-${index}`);
      });
    });
  });

  describe('Accessibility Snapshots', () => {
    beforeEach(() => {
      mockUseProModal.mockReturnValue({
        isOpen: true,
        onClose: vi.fn(),
        onOpen: vi.fn()
      });
    });

    it('should match snapshot for semantic structure', () => {
      const { container } = render(<ProModal />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for button with all attributes', () => {
      const { container } = render(<ProModal />);
      const button = container.querySelector('button');
      expect(button).toMatchSnapshot();
    });
  });

  describe('Color Theme Snapshots', () => {
    it('should match snapshot showing all color variations', () => {
      mockUseProModal.mockReturnValue({
        isOpen: true,
        onClose: vi.fn(),
        onOpen: vi.fn()
      });

      const { container } = render(<ProModal />);
      
      // Capture the color classes for each tool
      const expectedColors = [
        'text-violet-500', 'bg-violet-500/10',
        'text-emerald-500', 'bg-emerald-500/10',
        'text-pink-700', 'bg-pink-700/10',
        'text-orange-700', 'bg-orange-700/10',
        'text-green-700', 'bg-green-700/10'
      ];

      expectedColors.forEach(colorClass => {
        const element = container.querySelector(`[class*="${colorClass}"]`);
        if (element) {
          expect(element).toMatchSnapshot(`color-${colorClass.replace('/', '-')}`);
        }
      });
    });
  });
});