const app = require('../src/app');
const store = require('../src/core/store');

store.run();
app.listen(3000);

console.log("listening on 3000");
