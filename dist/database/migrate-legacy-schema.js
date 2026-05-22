"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLegacySchema = migrateLegacySchema;
/**
 * Upgrades tables left over from Coltium-Auto before Sequelize sync runs.
 * Avoids NOT NULL / ENUM alter failures on existing rows.
 */
async function migrateLegacySchema(sequelize) {
    const [tables] = (await sequelize.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users';
  `));
    if (!tables?.length)
        return;
    const [companyCol] = (await sequelize.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'company';
  `));
    if (!companyCol?.length) {
        await sequelize.query(`
      ALTER TABLE users ADD COLUMN company VARCHAR(255);
    `);
        console.log('[migrate] Added users.company');
    }
    await sequelize.query(`
    UPDATE users
    SET company = COALESCE(NULLIF(TRIM(name), ''), 'Legacy User')
    WHERE company IS NULL;
  `);
    await sequelize.query(`
    ALTER TABLE users ALTER COLUMN company SET DEFAULT 'Unknown';
  `);
    try {
        await sequelize.query(`
      ALTER TABLE users ALTER COLUMN company SET NOT NULL;
    `);
    }
    catch {
        /* already NOT NULL */
    }
    const [roleCol] = (await sequelize.query(`
    SELECT data_type, udt_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role';
  `));
    if (roleCol?.[0]) {
        const { data_type, udt_name } = roleCol[0];
        if (data_type === 'USER-DEFINED' || udt_name?.includes('enum')) {
            await sequelize.query(`
        ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(32)
        USING (
          CASE role::text
            WHEN 'user' THEN 'buyer'
            WHEN 'technician' THEN 'buyer'
            WHEN 'admin' THEN 'admin'
            WHEN 'vendor' THEN 'vendor'
            ELSE 'buyer'
          END
        );
      `);
            console.log('[migrate] Converted users.role enum → varchar (buyer/admin/vendor)');
        }
        else {
            await sequelize.query(`
        UPDATE users SET role = 'buyer' WHERE role IN ('user', 'technician') OR role IS NULL;
        UPDATE users SET role = 'admin' WHERE role = 'admin';
      `);
        }
    }
    console.log('[migrate] Legacy users table prepared for Dubiken');
}
