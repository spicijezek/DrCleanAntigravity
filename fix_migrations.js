import fs from 'fs';
import path from 'path';

const migrationsDir = path.join(process.cwd(), 'supabase/migrations');
const files = fs.readdirSync(migrationsDir);

let renamedCount = 0;

files.forEach(file => {
    // skip the new emergency file which we created just now (it doesn't have a mismatch history)
    if (file.startsWith('20260120120000')) return;

    // Match format YYYYMMDDHHMMSS_...
    const match = file.match(/^(\d{14})_(.+)$/);
    if (match) {
        const timestampStr = match[1];
        const rest = match[2];

        // Parse timestamp
        const year = parseInt(timestampStr.substring(0, 4));
        const month = parseInt(timestampStr.substring(4, 6)) - 1; // JS months are 0-based
        const day = parseInt(timestampStr.substring(6, 8));
        const hour = parseInt(timestampStr.substring(8, 10));
        const minute = parseInt(timestampStr.substring(10, 12));
        const second = parseInt(timestampStr.substring(12, 14));

        const date = new Date(year, month, day, hour, minute, second);

        // Subtract 1 second
        date.setSeconds(date.getSeconds() - 1);

        // Format back to string
        const newYear = date.getFullYear();
        const newMonth = String(date.getMonth() + 1).padStart(2, '0');
        const newDay = String(date.getDate()).padStart(2, '0');
        const newHour = String(date.getHours()).padStart(2, '0');
        const newMinute = String(date.getMinutes()).padStart(2, '0');
        const newSecond = String(date.getSeconds()).padStart(2, '0');

        const newTimestamp = `${newYear}${newMonth}${newDay}${newHour}${newMinute}${newSecond}`;
        const newFilename = `${newTimestamp}_${rest}`;

        const oldPath = path.join(migrationsDir, file);
        const newPath = path.join(migrationsDir, newFilename);

        console.log(`Renaming ${file} -> ${newFilename}`);
        fs.renameSync(oldPath, newPath);
        renamedCount++;
    }
});

console.log(`Total files renamed: ${renamedCount}`);
