import fs from 'node:fs';
import path from 'node:path';

export class CompanyBrain {
  constructor(file) {
    this.file = file;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (!fs.existsSync(file)) fs.writeFileSync(file, '[]');
  }

  all() { return JSON.parse(fs.readFileSync(this.file, 'utf8')); }

  remember(entry) {
    const rows = this.all();
    const record = { id: `D-${String(rows.length + 1).padStart(4,'0')}`, at: new Date().toISOString(), ...entry };
    rows.push(record);
    fs.writeFileSync(this.file, JSON.stringify(rows, null, 2));
    return record;
  }

  lessons(limit = 5) {
    return this.all().filter(x => x.reflection).slice(-limit).map(x => ({ decision: x.decision, reflection: x.reflection, outcome: x.outcome }));
  }
}
