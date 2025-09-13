/**
 * Unit tests for utility functions
 * These tests ensure core functionality works correctly
 */

import {
  validateEmail,
  validateToken,
  validateDepartment,
  validateFileType,
  validateFileSize,
  formatFileSize,
  formatDate,
  formatNumber,
  formatPercentage,
  searchInText,
  filterByDateRange,
  sortByField,
  sanitizeInput,
  generateSecureToken,
  maskSensitiveData,
  calculateTrend,
  calculateAverage,
  calculateMedian,
  buildUrlWithParams,
  parseUrlParams,
  generateColorPalette,
  createErrorMessage,
  safeLocalStorage
} from '../utils/testUtils'

// Simple test runner since we don't have a full testing framework
class TestRunner {
  private tests: Array<{ name: string; fn: () => void | Promise<void> }> = []
  private results: Array<{ name: string; passed: boolean; error?: string }> = []

  test(name: string, fn: () => void | Promise<void>) {
    this.tests.push({ name, fn })
  }

  expect(actual: any) {
    return {
      toBe: (expected: any) => {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, but got ${actual}`)
        }
      },
      toEqual: (expected: any) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`)
        }
      },
      toBeTruthy: () => {
        if (!actual) {
          throw new Error(`Expected truthy value, but got ${actual}`)
        }
      },
      toBeFalsy: () => {
        if (actual) {
          throw new Error(`Expected falsy value, but got ${actual}`)
        }
      },
      toContain: (expected: any) => {
        if (!actual.includes(expected)) {
          throw new Error(`Expected ${actual} to contain ${expected}`)
        }
      },
      toBeGreaterThan: (expected: number) => {
        if (actual <= expected) {
          throw new Error(`Expected ${actual} to be greater than ${expected}`)
        }
      },
      toBeLessThan: (expected: number) => {
        if (actual >= expected) {
          throw new Error(`Expected ${actual} to be less than ${expected}`)
        }
      }
    }
  }

  async run() {
    console.log(`Running ${this.tests.length} tests...\n`)

    for (const test of this.tests) {
      try {
        await test.fn()
        this.results.push({ name: test.name, passed: true })
        console.log(`✅ ${test.name}`)
      } catch (error) {
        this.results.push({ 
          name: test.name, 
          passed: false, 
          error: error instanceof Error ? error.message : String(error)
        })
        console.log(`❌ ${test.name}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    const passed = this.results.filter(r => r.passed).length
    const failed = this.results.filter(r => !r.passed).length

    console.log(`\nTest Results: ${passed} passed, ${failed} failed`)
    
    if (failed > 0) {
      console.log('\nFailed Tests:')
      this.results
        .filter(r => !r.passed)
        .forEach(r => console.log(`  - ${r.name}: ${r.error}`))
    }

    return { passed, failed, total: this.tests.length }
  }
}

// Create test runner instance
const runner = new TestRunner()

// Email validation tests
runner.test('validateEmail - valid emails', () => {
  const validEmails = [
    'user@gail.in',
    'test.user@company.com',
    'admin+123@domain.org'
  ]
  
  validEmails.forEach(email => {
    runner.expect(validateEmail(email)).toBeTruthy()
  })
})

runner.test('validateEmail - invalid emails', () => {
  const invalidEmails = [
    'invalid.email',
    '@domain.com',
    'user@',
    '',
    'user space@domain.com'
  ]
  
  invalidEmails.forEach(email => {
    runner.expect(validateEmail(email)).toBeFalsy()
  })
})

// Token validation tests
runner.test('validateToken - valid tokens', () => {
  const validTokens = [
    'abcd1234567890123456',
    'ABC_123-456_789_012345',
    '1234567890abcdefghij'
  ]
  
  validTokens.forEach(token => {
    runner.expect(validateToken(token)).toBeTruthy()
  })
})

runner.test('validateToken - invalid tokens', () => {
  const invalidTokens = [
    'short',
    '',
    'token with spaces',
    'token@with#special$chars'
  ]
  
  invalidTokens.forEach(token => {
    runner.expect(validateToken(token)).toBeFalsy()
  })
})

// Department validation tests
runner.test('validateDepartment - valid departments', () => {
  const validDepartments = [
    'Engineering',
    'Human Resources',
    'Finance',
    'Operations'
  ]
  
  validDepartments.forEach(dept => {
    runner.expect(validateDepartment(dept)).toBeTruthy()
  })
})

runner.test('validateDepartment - invalid departments', () => {
  const invalidDepartments = [
    'Invalid Department',
    '',
    'engineering', // case sensitive
    'HR' // not full name
  ]
  
  invalidDepartments.forEach(dept => {
    runner.expect(validateDepartment(dept)).toBeFalsy()
  })
})

// File type validation tests
runner.test('validateFileType - valid file types', () => {
  const validFiles = [
    'document.pdf',
    'spreadsheet.xlsx',
    'image.jpg',
    'video.mp4',
    'archive.zip'
  ]
  
  validFiles.forEach(file => {
    runner.expect(validateFileType(file)).toBeTruthy()
  })
})

runner.test('validateFileType - invalid file types', () => {
  const invalidFiles = [
    'script.exe',
    'malware.bat',
    'virus.com',
    'noextension'
  ]
  
  invalidFiles.forEach(file => {
    runner.expect(validateFileType(file)).toBeFalsy()
  })
})

// File size validation tests
runner.test('validateFileSize - within limits', () => {
  runner.expect(validateFileSize(1024 * 1024)).toBeTruthy() // 1MB
  runner.expect(validateFileSize(10 * 1024 * 1024)).toBeTruthy() // 10MB
})

runner.test('validateFileSize - exceeds limits', () => {
  runner.expect(validateFileSize(100 * 1024 * 1024)).toBeFalsy() // 100MB (default limit is 50MB)
})

// Format file size tests
runner.test('formatFileSize - correct formatting', () => {
  runner.expect(formatFileSize(0)).toBe('0 Bytes')
  runner.expect(formatFileSize(1024)).toBe('1 KB')
  runner.expect(formatFileSize(1024 * 1024)).toBe('1 MB')
  runner.expect(formatFileSize(1536)).toBe('1.5 KB')
})

// Format date tests
runner.test('formatDate - correct formatting', () => {
  const date = '2025-01-23T10:30:00Z'
  const formatted = formatDate(date)
  runner.expect(formatted).toContain('Jan')
  runner.expect(formatted).toContain('23')
  runner.expect(formatted).toContain('2025')
})

// Format number tests
runner.test('formatNumber - correct formatting', () => {
  runner.expect(formatNumber(1000)).toBe('1,000')
  runner.expect(formatNumber(1234.5678, 2)).toBe('1,234.57')
})

// Format percentage tests
runner.test('formatPercentage - correct calculation', () => {
  runner.expect(formatPercentage(25, 100)).toBe('25.0%')
  runner.expect(formatPercentage(1, 3)).toBe('33.3%')
  runner.expect(formatPercentage(0, 0)).toBe('0%')
})

// Search in text tests
runner.test('searchInText - case insensitive search', () => {
  runner.expect(searchInText('Hello World', 'hello')).toBeTruthy()
  runner.expect(searchInText('Hello World', 'WORLD')).toBeTruthy()
  runner.expect(searchInText('Hello World', 'xyz')).toBeFalsy()
  runner.expect(searchInText('Hello World', '')).toBeTruthy()
})

// Filter by date range tests
runner.test('filterByDateRange - within range', () => {
  const date = '2025-01-15'
  const startDate = '2025-01-01'
  const endDate = '2025-01-31'
  
  runner.expect(filterByDateRange(date, startDate, endDate)).toBeTruthy()
})

runner.test('filterByDateRange - outside range', () => {
  const date = '2025-02-15'
  const startDate = '2025-01-01'
  const endDate = '2025-01-31'
  
  runner.expect(filterByDateRange(date, startDate, endDate)).toBeFalsy()
})

// Sort by field tests
runner.test('sortByField - ascending order', () => {
  const data = [
    { name: 'Charlie', age: 30 },
    { name: 'Alice', age: 25 },
    { name: 'Bob', age: 35 }
  ]
  
  const sorted = sortByField(data, 'name', 'asc')
  runner.expect(sorted[0].name).toBe('Alice')
  runner.expect(sorted[2].name).toBe('Charlie')
})

// Sanitize input tests
runner.test('sanitizeInput - removes dangerous content', () => {
  const dangerousInput = '<script>alert("xss")</script>Hello<>World'
  const sanitized = sanitizeInput(dangerousInput)
  
  runner.expect(sanitized).toBe('HelloWorld')
})

// Generate secure token tests
runner.test('generateSecureToken - correct length and format', () => {
  const token = generateSecureToken(32)
  
  runner.expect(token.length).toBe(32)
  runner.expect(/^[A-Za-z0-9_-]+$/.test(token)).toBeTruthy()
})

// Mask sensitive data tests
runner.test('maskSensitiveData - masks correctly', () => {
  const sensitive = 'secret123456'
  const masked = maskSensitiveData(sensitive, 4)
  
  runner.expect(masked).toBe('********3456')
})

// Calculate trend tests
runner.test('calculateTrend - upward trend', () => {
  const trend = calculateTrend(110, 100)
  
  runner.expect(trend.direction).toBe('up')
  runner.expect(trend.percentage).toBe(10)
})

runner.test('calculateTrend - downward trend', () => {
  const trend = calculateTrend(90, 100)
  
  runner.expect(trend.direction).toBe('down')
  runner.expect(trend.percentage).toBe(10)
})

runner.test('calculateTrend - stable trend', () => {
  const trend = calculateTrend(100, 100)
  
  runner.expect(trend.direction).toBe('stable')
  runner.expect(trend.percentage).toBe(0)
})

// Calculate average tests
runner.test('calculateAverage - correct calculation', () => {
  runner.expect(calculateAverage([1, 2, 3, 4, 5])).toBe(3)
  runner.expect(calculateAverage([])).toBe(0)
  runner.expect(calculateAverage([10])).toBe(10)
})

// Calculate median tests
runner.test('calculateMedian - odd number of items', () => {
  runner.expect(calculateMedian([1, 3, 5])).toBe(3)
})

runner.test('calculateMedian - even number of items', () => {
  runner.expect(calculateMedian([1, 2, 3, 4])).toBe(2.5)
})

// Build URL with params tests
runner.test('buildUrlWithParams - adds parameters correctly', () => {
  const url = buildUrlWithParams('https://api.example.com/users', {
    page: 1,
    limit: 10,
    department: 'Engineering'
  })
  
  runner.expect(url).toContain('page=1')
  runner.expect(url).toContain('limit=10')
  runner.expect(url).toContain('department=Engineering')
})

// Parse URL params tests
runner.test('parseUrlParams - extracts parameters correctly', () => {
  const url = 'https://api.example.com/users?page=1&limit=10'
  const params = parseUrlParams(url)
  
  runner.expect(params.page).toBe('1')
  runner.expect(params.limit).toBe('10')
})

// Generate color palette tests
runner.test('generateColorPalette - generates correct number of colors', () => {
  const colors = generateColorPalette(5)
  
  runner.expect(colors.length).toBe(5)
  colors.forEach(color => {
    runner.expect(color.startsWith('#') || color.startsWith('hsl')).toBeTruthy()
  })
})

// Create error message tests
runner.test('createErrorMessage - handles different error types', () => {
  runner.expect(createErrorMessage(new Error('Test error'))).toBe('Test error')
  runner.expect(createErrorMessage('String error')).toBe('String error')
  runner.expect(createErrorMessage(null)).toBe('An unexpected error occurred')
})

// Safe localStorage tests
runner.test('safeLocalStorage - handles errors gracefully', () => {
  // These tests would need a proper test environment to mock localStorage failures
  // For now, we just verify the functions exist and return appropriate types
  runner.expect(typeof safeLocalStorage.getItem).toBe('function')
  runner.expect(typeof safeLocalStorage.setItem).toBe('function')
  runner.expect(typeof safeLocalStorage.removeItem).toBe('function')
  runner.expect(typeof safeLocalStorage.clear).toBe('function')
})

// Export test runner for manual execution
export { runner }

// Auto-run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  console.log('Metahuman Admin Console - Unit Tests')
  console.log('====================================')
  
  runner.run().then(results => {
    console.log(`\nTest Summary: ${results.passed}/${results.total} tests passed`)
    
    if (results.failed === 0) {
      console.log('🎉 All tests passed!')
    } else {
      console.log(`⚠️  ${results.failed} tests failed`)
    }
  })
}
