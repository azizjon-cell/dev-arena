/**
 * Code Execution Service - Выполнение и проверка кода
 * Запускает JavaScript код и проверяет тесты
 */

const vm = require('vm');

// Ограничение времени выполнения (мс)
const TIMEOUT = 5000;

async function evaluateCode(code, testCases, solution = null) {
  const testResults = [];
  let passedCount = 0;
  let executionTime = 0;
  const startTime = Date.now();

  // Создаём безопасный контекст для выполнения
  const context = {
    console: {
      log: () => {}, // Блокируем console.log
      error: () => {},
      warn: () => {}
    },
    setTimeout: () => { throw new Error('setTimeout запрещён'); },
    setInterval: () => { throw new Error('setInterval запрещён'); },
    fetch: () => { throw new Error('fetch запрещён'); },
    require: () => { throw new Error('require запрещён'); }
  };

  try {
    // Компилируем код
    const script = new vm.Script(code);
    const vmContext = vm.createContext(context);

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const testStartTime = Date.now();

      try {
        // Создаём новый контекст для каждого теста
        const testContext = vm.createContext({
          ...context,
          console: { log: () => {} }
        });

        // Выполняем код
        script.runInContext(testContext, { timeout: TIMEOUT });

        // Находим имя функции (предполагаем, что это первая функция в коде)
        const functionName = extractFunctionName(code);
        
        if (!functionName) {
          testResults.push({
            testNumber: i + 1,
            passed: false,
            error: 'Функция не найдена в коде',
            input: testCase.input,
            expected: testCase.expected,
            actual: undefined
          });
          continue;
        }

        // Вызываем функцию с тестовыми аргументами
        const fn = testContext[functionName];
        
        if (!fn) {
          testResults.push({
            testNumber: i + 1,
            passed: false,
            error: `Функция ${functionName} не найдена`,
            input: testCase.input,
            expected: testCase.expected,
            actual: undefined
          });
          continue;
        }

        // Выполняем функцию
        let result;
        if (Array.isArray(testCase.input)) {
          result = fn(...testCase.input);
        } else if (typeof testCase.input === 'object') {
          result = fn(...Object.values(testCase.input));
        } else {
          result = fn(testCase.input);
        }

        // Сравниваем результат
        const isPassed = deepEqual(result, testCase.expected);

        if (isPassed) {
          passedCount++;
        }

        testResults.push({
          testNumber: i + 1,
          passed: isPassed,
          input: testCase.input,
          expected: testCase.expected,
          actual: result,
          executionTime: Date.now() - testStartTime
        });

      } catch (error) {
        testResults.push({
          testNumber: i + 1,
          passed: false,
          error: error.message,
          input: testCase.input,
          expected: testCase.expected,
          actual: undefined,
          executionTime: Date.now() - testStartTime
        });
      }
    }

    executionTime = Date.now() - startTime;

    return {
      passedCount,
      totalTests: testCases.length,
      allPassed: passedCount === testCases.length,
      testResults,
      executionTime
    };

  } catch (error) {
    return {
      passedCount: 0,
      totalTests: testCases.length,
      allPassed: false,
      testResults: testCases.map((tc, i) => ({
        testNumber: i + 1,
        passed: false,
        error: error.message,
        input: tc.input,
        expected: tc.expected,
        actual: undefined
      })),
      executionTime: Date.now() - startTime
    };
  }
}

// Извлечение имени функции из кода
function extractFunctionName(code) {
  // Ищем function name() или const name = или function name =
  const patterns = [
    /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/,
    /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?\(/,
    /let\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?\(/,
    /var\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?\(/,
    /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?\s*\([^)]*\)\s*=>/
  ];

  for (const pattern of patterns) {
    const match = code.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// Глубокое сравнение объектов
function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  
  if (typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      return a.every((val, i) => deepEqual(val, b[i]));
    }
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => deepEqual(a[key], b[key]));
  }
  
  return false;
}

module.exports = { evaluateCode };
