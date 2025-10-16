import type { IStorage } from "./storage";

export class SnapshotScheduler {
  private storage: IStorage;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Start the snapshot scheduler
   * Captures portfolio snapshots daily at midnight
   */
  start(): void {
    if (this.isRunning) {
      console.log('📸 Snapshot scheduler is already running');
      return;
    }

    console.log('📸 Starting snapshot scheduler - checking every 24 hours');
    this.isRunning = true;

    // Run immediately on start (for testing)
    this.captureSnapshots();

    // Then run every 24 hours (once per day)
    this.intervalId = setInterval(() => {
      this.captureSnapshots();
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Stop the snapshot scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('📸 Snapshot scheduler stopped');
    }
  }

  /**
   * Capture portfolio snapshots for all organizations
   */
  private async captureSnapshots(): Promise<void> {
    try {
      const now = new Date();
      const snapshotDate = now.toISOString().split('T')[0];
      console.log(`📊 Capturing portfolio snapshots for date: ${snapshotDate}`);

      // Get all organizations
      const { organizations } = await import('@shared/schema');
      const { db } = await import('./db');

      const allOrganizations = await db
        .select()
        .from(organizations);

      if (allOrganizations.length === 0) {
        console.log('✅ No organizations found');
        return;
      }

      console.log(`📊 Found ${allOrganizations.length} organization(s) to snapshot`);

      // Process each organization
      for (const org of allOrganizations) {
        try {
          await this.captureOrganizationSnapshot(org.id, snapshotDate);
        } catch (error) {
          console.error(`❌ Error capturing snapshot for org ${org.id}:`, error);
          // Continue processing other organizations even if one fails
        }
      }

      console.log(`✅ Finished capturing daily portfolio snapshots`);
    } catch (error) {
      console.error('❌ Error in snapshot scheduler:', error);
    }
  }

  /**
   * Capture a snapshot for a specific organization
   */
  private async captureOrganizationSnapshot(organizationId: string, snapshotDate: string): Promise<void> {
    try {
      // Check if snapshot already exists for this date
      const existing = await this.storage.getSnapshotByDate(organizationId, snapshotDate);
      if (existing) {
        console.log(`⏭️  Snapshot already exists for org ${organizationId} on ${snapshotDate}`);
        return;
      }

      // Get all active loans
      const activeLoans = await this.storage.getActiveLoansByUser(organizationId);
      
      // Calculate portfolio metrics
      const totalOutstanding = activeLoans.reduce((sum, loan) => 
        sum + Number(loan.amount?.toString() || 0), 0
      );
      
      const activeLoansCount = activeLoans.length;
      
      // Get all facilities to calculate total credit limit
      const facilities = await this.storage.getUserFacilities(organizationId);
      const totalCreditLimit = facilities.reduce((sum, facility) => 
        sum + Number(facility.creditLimit?.toString() || 0), 0
      );
      
      // Calculate LTV
      const collateralAssignments = await this.storage.getUserCollateralAssignments(organizationId);
      const totalCollateralValue = collateralAssignments.reduce((sum: number, assignment: any) => {
        const collateral = assignment.collateral;
        return sum + Number(collateral?.currentValue?.toString() || 0);
      }, 0);
      
      const portfolioLtv = totalCollateralValue > 0 
        ? ((totalOutstanding / totalCollateralValue) * 100).toFixed(2) 
        : "0";
      
      // Group loans by bank for bank exposures
      const bankExposures: Record<string, any> = {};
      for (const loan of activeLoans) {
        const facility = facilities.find(f => f.id === loan.facilityId);
        if (facility && facility.bank) {
          const bankId = facility.bank.id;
          const bankName = facility.bank.name;
          
          if (!bankExposures[bankId]) {
            bankExposures[bankId] = {
              bankId,
              bankName,
              totalExposure: 0,
              loanCount: 0,
              facilities: []
            };
          }
          
          bankExposures[bankId].totalExposure += Number(loan.amount?.toString() || 0);
          bankExposures[bankId].loanCount += 1;
          
          const facilityExists = bankExposures[bankId].facilities.find(
            (f: any) => f.facilityId === facility.id
          );
          if (!facilityExists) {
            bankExposures[bankId].facilities.push({
              facilityId: facility.id,
              facilityType: facility.facilityType,
              exposure: Number(loan.amount?.toString() || 0)
            });
          } else {
            facilityExists.exposure += Number(loan.amount?.toString() || 0);
          }
        }
      }
      
      // Additional metrics
      const metrics = {
        avgLoanSize: activeLoansCount > 0 ? totalOutstanding / activeLoansCount : 0,
        maxLoanSize: activeLoans.length > 0 
          ? Math.max(...activeLoans.map(l => Number(l.amount?.toString() || 0))) 
          : 0,
        minLoanSize: activeLoans.length > 0 
          ? Math.min(...activeLoans.map(l => Number(l.amount?.toString() || 0))) 
          : 0,
        utilizationRate: totalCreditLimit > 0 
          ? ((totalOutstanding / totalCreditLimit) * 100).toFixed(2) 
          : "0",
        bankCount: Object.keys(bankExposures).length,
        facilityCount: facilities.length
      };
      
      await this.storage.createPortfolioSnapshot({
        organizationId,
        snapshotDate,
        totalOutstanding: totalOutstanding.toString(),
        totalCreditLimit: totalCreditLimit.toString(),
        portfolioLtv,
        activeLoansCount,
        bankExposuresJson: bankExposures,
        metricsJson: metrics
      });
      
      console.log(`✅ Snapshot created for org ${organizationId} on ${snapshotDate}`);
    } catch (error) {
      console.error(`❌ Error in captureOrganizationSnapshot:`, error);
      throw error;
    }
  }
}
