// File: scripts/rescue-admin.ts
// ============================================================
// Notesby — Sovereign Cloud CLI Admin Rescue Script
// Allows the server owner to reset passwords or create an emergency
// admin directly from Google Cloud Shell or terminal without SMTP.
// Usage: pnpm run rescue:admin <email> <newPassword>
// ============================================================

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users, siteSettings } from '@/db/schema';
import { hashPassword } from '@/lib/auth';

async function rescue() {
  const args = process.argv.slice(2);
  const email = args[0]?.trim().toLowerCase();
  const newPassword = args[1];

  console.log('\n============================================================');
  console.log('🔑 Notesby Sovereign CLI Admin Rescue Utility');
  console.log('============================================================\n');

  const existingUsers = await db.select().from(users);

  if (existingUsers.length === 0) {
    console.log('ℹ️  No registered users found in the database.');
    console.log(
      '👉 Complete first-run onboarding by visiting: http://localhost:4330/admin/setup\n'
    );
    process.exit(0);
  }

  if (!email || !newPassword) {
    console.log('📋 Existing Registered Users:');
    existingUsers.forEach((u) => {
      console.log(`   • ${u.name} (${u.email}) [Role: ${u.role}]`);
    });
    console.log('\nUsage to reset password:');
    console.log('   pnpm run rescue:admin <email> <newPassword>\n');
    console.log('Example:');
    console.log('   pnpm run rescue:admin admin@example.com MyNewSecretPassword123\n');
    process.exit(0);
  }

  if (newPassword.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters long.');
    process.exit(1);
  }

  const targetUser = existingUsers.find((u) => u.email.toLowerCase() === email);

  if (!targetUser) {
    console.error(`❌ Error: User with email "${email}" not found.`);
    console.log('Available emails: ' + existingUsers.map((u) => u.email).join(', '));
    process.exit(1);
  }

  const passwordHash = await hashPassword(newPassword);

  await db
    .update(users)
    .set({
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, targetUser.id));

  // Ensure site settings is marked completed
  await db
    .insert(siteSettings)
    .values({
      id: 1,
      isSetupCompleted: true,
      siteTitle: 'Notesby',
      authorName: targetUser.name,
    })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: { isSetupCompleted: true },
    });

  console.log(`✅ Master password successfully reset for "${targetUser.name}" (${email})!`);
  console.log('👉 You can now sign in at: http://localhost:4330/admin/login\n');
  process.exit(0);
}

rescue().catch((err) => {
  console.error('❌ Rescue operation failed:', err);
  process.exit(1);
});
