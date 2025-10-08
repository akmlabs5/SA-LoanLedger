import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '../../shared/schema.js';
import { eq, inArray, isNull } from 'drizzle-orm';

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const db = drizzle({ client: pool, schema });

async function backfillOrganizations() {
  console.log('Starting organization backfill migration...');

  try {
    const allUsers = await db.select().from(schema.users);
    console.log(`Found ${allUsers.length} users to migrate`);

    for (const user of allUsers) {
      const displayName = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`
        : user.email?.split('@')[0] || 'User';
        
      console.log(`\nProcessing user: ${displayName} (${user.email})`);

      let organization;

      const existingMembership = await db.select()
        .from(schema.organizationMembers)
        .where(eq(schema.organizationMembers.userId, user.id))
        .limit(1);

      if (existingMembership.length > 0) {
        console.log(`  User already belongs to an organization, getting organization...`);
        const orgResult = await db.select()
          .from(schema.organizations)
          .where(eq(schema.organizations.id, existingMembership[0].organizationId));
        
        if (orgResult.length === 0) {
          console.warn(`  ⚠️ Organization ${existingMembership[0].organizationId} not found, creating new organization...`);
          const orgName = user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}'s Organization`
            : `${user.email?.split('@')[0] || 'User'}'s Organization`;
          
          const [newOrg] = await db.insert(schema.organizations)
            .values({
              name: orgName,
              ownerId: user.id,
              createdAt: new Date(),
            })
            .returning();
          organization = newOrg;
        } else {
          organization = orgResult[0];
          console.log(`  Using existing organization: ${organization.name} (${organization.id})`);
        }
      } else {
        const orgName = user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}'s Organization`
          : `${user.email?.split('@')[0] || 'User'}'s Organization`;

        let insertResult;
        try {
          insertResult = await db.insert(schema.organizations)
            .values({
              name: orgName,
              ownerId: user.id,
              createdAt: new Date(),
            })
            .returning();
        } catch (err) {
          console.error('Insert error:', err);
          throw err;
        }

        if (!insertResult || insertResult.length === 0) {
          throw new Error(`Failed to create organization for user ${user.id}`);
        }

        organization = insertResult[0];
        console.log(`  Created organization: ${organization.name} (${organization.id})`);

        await db.insert(schema.organizationMembers)
          .values({
            userId: user.id,
            organizationId: organization.id,
            isOwner: true,
            joinedAt: new Date(),
          });

        console.log(`  Added user as owner to organization`);
      }

      const userFacilities = await db.select()
        .from(schema.facilities)
        .where(eq(schema.facilities.userId, user.id));

      const bankIds = Array.from(new Set(userFacilities.map(f => f.bankId)));
      
      const updateResults = await Promise.all([
        bankIds.length > 0 
          ? db.update(schema.banks)
              .set({ organizationId: organization.id })
              .where(inArray(schema.banks.id, bankIds))
              .returning({ id: schema.banks.id })
          : Promise.resolve([]),
        
        db.update(schema.facilities)
          .set({ organizationId: organization.id })
          .where(eq(schema.facilities.userId, user.id))
          .returning({ id: schema.facilities.id }),
        
        db.update(schema.creditLines)
          .set({ organizationId: organization.id })
          .where(eq(schema.creditLines.userId, user.id))
          .returning({ id: schema.creditLines.id }),
        
        db.update(schema.collateral)
          .set({ organizationId: organization.id })
          .where(eq(schema.collateral.userId, user.id))
          .returning({ id: schema.collateral.id }),
        
        db.update(schema.loans)
          .set({ organizationId: organization.id })
          .where(eq(schema.loans.userId, user.id))
          .returning({ id: schema.loans.id }),
        
        db.update(schema.guarantees)
          .set({ organizationId: organization.id })
          .where(eq(schema.guarantees.userId, user.id))
          .returning({ id: schema.guarantees.id }),
      ]);

      const [banks, facilities, creditLines, collateral, loans, guarantees] = updateResults;
      
      console.log(`  Updated records:`);
      console.log(`    - ${banks.length} banks`);
      console.log(`    - ${facilities.length} facilities`);
      console.log(`    - ${creditLines.length} credit lines`);
      console.log(`    - ${collateral.length} collateral items`);
      console.log(`    - ${loans.length} loans`);
      console.log(`    - ${guarantees.length} guarantees`);
    }

    console.log('\n📋 Handling banks without organization...');
    const orphanedBanks = await db.select()
      .from(schema.banks)
      .where(isNull(schema.banks.organizationId));

    if (orphanedBanks.length > 0) {
      console.log(`Found ${orphanedBanks.length} banks without organization`);
      
      for (const bank of orphanedBanks) {
        const facilityUsingBank = await db.select()
          .from(schema.facilities)
          .where(eq(schema.facilities.bankId, bank.id))
          .limit(1);

        if (facilityUsingBank.length > 0) {
          const facility = facilityUsingBank[0];
          await db.update(schema.banks)
            .set({ organizationId: facility.organizationId })
            .where(eq(schema.banks.id, bank.id));
          console.log(`  Assigned bank "${bank.name}" to organization via facility`);
        } else {
          console.log(`  ⚠️ Bank "${bank.name}" has no facilities - leaving as NULL (will be assigned when first used)`);
        }
      }
    } else {
      console.log('All banks have organization assigned');
    }

    console.log('\n✅ Organization backfill completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

backfillOrganizations();
