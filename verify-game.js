const http = require('http');

const tests = [
  {
    name: 'Server responds',
    fn: () => new Promise((resolve, reject) => {
      http.get('http://localhost:8080/', (res) => {
        resolve(res.statusCode === 200);
      }).on('error', () => reject('Connection failed'));
    })
  },
  {
    name: 'Has root element',
    fn: () => new Promise((resolve, reject) => {
      http.get('http://localhost:8080/', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data.includes('id="root"')));
      }).on('error', reject);
    })
  },
  {
    name: 'Has game script',
    fn: () => new Promise((resolve, reject) => {
      http.get('http://localhost:8080/', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data.includes('/src/main.tsx')));
      }).on('error', reject);
    })
  },
  {
    name: 'CSS is loaded',
    fn: () => new Promise((resolve, reject) => {
      http.get('http://localhost:8080/', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data.includes('style.css')));
      }).on('error', reject);
    })
  }
];

(async () => {
  console.log('Running verification tests...\n');
  let passed = 0;
  for (const test of tests) {
    try {
      const result = await test.fn();
      console.log(`[${result ? '✓' : '✗'}] ${test.name}`);
      if (result) passed++;
    } catch (err) {
      console.log(`[✗] ${test.name} - ${err}`);
    }
  }
  console.log(`\n${passed}/${tests.length} tests passed\n`);
  process.exit(passed === tests.length ? 0 : 1);
})();
