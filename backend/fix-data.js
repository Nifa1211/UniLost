const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./unilost.db');

const fixes = [
  { id: 1, speciality: 'Mobile Phones' },
  { id: 2, speciality: 'Mobile Phones' },
];

fixes.forEach(({ id, speciality }) => {
  db.run(
    `UPDATE items SET speciality = ? WHERE id = ?`,
    [speciality, id],
    function () {
      console.log(`Item ${id} → speciality set to "${speciality}" (${this.changes} row updated)`);
    }
  );
});

setTimeout(() => { db.close(); console.log('Done!'); }, 500);