const http = require('http');
http.get('http://localhost:3000/api/document-templates', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(parsed.data.filter(c => c.constituent_type === "establishment").map(c => ({ id: c.id, name: c.name })));
    } catch (e) {
      console.log(data);
    }
  });
});
