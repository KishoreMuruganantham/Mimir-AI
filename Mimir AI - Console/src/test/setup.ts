// Setup file for testing environment
// Note: This is a basic setup. For full testing, install:
// npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event

declare global {
  interface Window {
    IntersectionObserver: any
    ResizeObserver: any
  }
}

// Mock IntersectionObserver
window.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock ResizeObserver
window.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock fetch
;(window as any).fetch = async () => ({
  ok: true,
  status: 200,
  json: async () => ({}),
  text: async () => '',
})

// Mock localStorage
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  length: 0,
  key: () => null,
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
})

// Mock URL.createObjectURL
Object.defineProperty(window.URL, 'createObjectURL', {
  value: () => 'mocked-url',
})

Object.defineProperty(window.URL, 'revokeObjectURL', {
  value: () => {},
})

// Mock console methods to reduce noise in tests
const originalConsole = console
Object.defineProperty(window, 'console', {
  value: {
    ...originalConsole,
    warn: () => {},
    error: () => {},
  },
})
