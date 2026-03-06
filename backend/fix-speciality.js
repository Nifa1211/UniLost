/**
 * fix-speciality.js
 * Run once from the backend folder:  node fix-speciality.js
 *
 * What it does:
 *  1. Shows all items currently in the DB
 *  2. Sets speciality = 'Others' for any row where speciality is NULL or empty
 *  3. Reports what was changed
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const readline = require('readline');

const dbPath = path.join(__dirname, 'unilost.db');
const db = new sqlite3.Database(dbPath);

const VALID = [
  'Mobile Phones', 'Keys', 'Notes & Books',
  'Lunches & Bottles', 'Wearables', 'Wallets & Bags',
  'Electronics', 'Others'
];

async function run() {
  console.log('\n📦 Current items in DB:\n');

  db.all('SELECT id, name, speciality FROM items', [], (err, rows) => {
    if (err) { console.error(err); process.exit(1); }

    if (rows.length === 0) {
      console.log('  No items found.');
      db.close();
      return;
    }

    rows.forEach(r => {
      const valid = VALID.includes(r.speciality);
      console.log(`  [${r.id}] "${r.name}" → speciality: "${r.speciality}" ${valid ? '✅' : '❌ INVALID'}`);
    });

    const badRows = rows.filter(r => !VALID.includes(r.speciality));

    if (badRows.length === 0) {
      console.log('\n✅ All items have valid categories. Nothing to fix.\n');
      db.close();
      return;
    }

    console.log(`\n⚠️  Found ${badRows.length} item(s) with invalid/missing speciality.`);
    console.log('   These will be set to "Others".\n');

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Proceed? (y/n): ', (answer) => {
      rl.close();
      if (answer.toLowerCase() !== 'y') {
        console.log('Aborted.');
        db.close();
        return;
      }

      const ids = badRows.map(r => r.id);
      const placeholders = ids.map(() => '?').join(',');

      db.run(
        `UPDATE items SET speciality = 'Others' WHERE id IN (${placeholders})`,
        ids,
        function (err) {
          if (err) { console.error('Update failed:', err); db.close(); return; }
          console.log(`\n✅ Fixed ${this.changes} item(s) → speciality set to "Others"\n`);
          db.close();
        }
      );
    });
  });
}

run();