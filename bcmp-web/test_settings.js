const http = require('http');
http.get('http://localhost:3000/api/settings', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed.settings.customized_establishment_certificates, null, 2));
    } catch (e) {
      console.log("Error parsing");
    }
  });
});
