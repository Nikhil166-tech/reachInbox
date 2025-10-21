const http = require('http');

console.log('Starting guaranteed test server...');

const server = http.createServer((req, res) => {
  console.log('✓ Request received:', req.url);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    success: true,
    message: 'Server is definitely working!',
    timestamp: new Date().toISOString(),
    url: req.url
  }));
});

const PORT = 3005;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Server running on http://127.0.0.1:${PORT}`);
  console.log(`✓ Test with: curl http://localhost:${PORT}/`);
});

// Verify the server is actually listening
server.on('listening', () => {
  console.log('✓ Server is actually listening on port', PORT);
});

server.on('error', (err) => {
  console.error('✗ Server error:', err);
});

// Test the server immediately
setTimeout(() => {
  const testRequest = http.get(`http://localhost:${PORT}/`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('✓ Internal test passed:', JSON.parse(data));
    });
  });
  
  testRequest.on('error', (err) => {
    console.error('✗ Internal test failed:', err.message);
  });
}, 1000);