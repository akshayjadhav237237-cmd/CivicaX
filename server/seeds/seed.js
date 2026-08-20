/**
 * Database seed script — populates demo data for Kedarnath Valley & Mandakini Basin region.
 *
 * Run with: node seeds/seed.js
 */
require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const ZONE_POLYGONS = {
  kedarnath: {
    type: 'Polygon',
    coordinates: [[
      [79.0550, 30.7250],
      [79.0800, 30.7250],
      [79.0800, 30.7450],
      [79.0550, 30.7450],
      [79.0550, 30.7250]
    ]],
  },
  rambara: {
    type: 'Polygon',
    coordinates: [[
      [79.0380, 30.6850],
      [79.0620, 30.6850],
      [79.0620, 30.7100],
      [79.0380, 30.7100],
      [79.0380, 30.6850]
    ]],
  },
  gaurikund: {
    type: 'Polygon',
    coordinates: [[
      [79.0150, 30.6400],
      [79.0400, 30.6400],
      [79.0400, 30.6650],
      [79.0150, 30.6650],
      [79.0150, 30.6400]
    ]],
  },
  guptkashi: {
    type: 'Polygon',
    coordinates: [[
      [79.0600, 30.5080],
      [79.0950, 30.5080],
      [79.0950, 30.5400],
      [79.0600, 30.5400],
      [79.0600, 30.5080]
    ]],
  },
};

const ELEVATION_DATA = [
  { latitude: 30.7346, longitude: 79.0669, elevationM: 3583, sequence: 1 },
  { latitude: 30.7200, longitude: 79.0600, elevationM: 3350, sequence: 2 },
  { latitude: 30.7050, longitude: 79.0550, elevationM: 3100, sequence: 3 },
  { latitude: 30.6975, longitude: 79.0494, elevationM: 2750, sequence: 4 },
  { latitude: 30.6800, longitude: 79.0400, elevationM: 2400, sequence: 5 },
  { latitude: 30.6650, longitude: 79.0320, elevationM: 2150, sequence: 6 },
  { latitude: 30.6508, longitude: 79.0272, elevationM: 1980, sequence: 7 },
  { latitude: 30.6315, longitude: 79.0325, elevationM: 1820, sequence: 8 },
  { latitude: 30.5750, longitude: 79.0410, elevationM: 1500, sequence: 9 },
  { latitude: 30.5235, longitude: 79.0792, elevationM: 1319, sequence: 10 },
];

async function seed() {
  console.log('🌱 Starting CivicaX database seed (Kedarnath Valley)...');

  try {
    // Clear existing data
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.safetyReport.deleteMany();
    await prisma.civicReportTimeline.deleteMany();
    await prisma.civicReport.deleteMany();
    await prisma.civicDepartment.deleteMany();
    await prisma.emergencyAlert.deleteMany();
    await prisma.emergencyZone.deleteMany();
    await prisma.safeZone.deleteMany();
    await prisma.elevationData.deleteMany();
    await prisma.populationDensity.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Cleared existing data');

    // 1. Create demo users
    const passwordHash = await bcrypt.hash('demo1234', 12);
    const [citizen, deptOp, govUser, adminUser] = await Promise.all([
      prisma.user.create({ data: { name: 'Priya Citizen', email: 'citizen@civicax.demo', passwordHash, role: 'citizen', city: 'Kedarnath', phone: '+919876543210' } }),
      prisma.user.create({ data: { name: 'Ramesh Dept', email: 'dept@civicax.demo', passwordHash, role: 'department_op', city: 'Rudraprayag' } }),
      prisma.user.create({ data: { name: 'Collector Singh', email: 'gov@civicax.demo', passwordHash, role: 'government', city: 'Dehradun' } }),
      prisma.user.create({ data: { name: 'Admin CivicaX', email: 'admin@civicax.demo', passwordHash, role: 'admin', city: 'Kedarnath' } }),
    ]);
    console.log('✅ Created 4 demo users');

    // 2. Create emergency zones
    const [zone1, zone2, zone3, zone4] = await Promise.all([
      prisma.emergencyZone.create({ data: { id: 'zone-kedarnath-001', name: 'Zone 1 — Chorabari Glacial Lake Catchment & Kedarnath Temple Basin', level: 'red', geojson: ZONE_POLYGONS.kedarnath, description: 'Chorabari glacial lake breach risk with rapid glacial runoff into Mandakini River. Immediate evacuation order for temple precinct and riverbed.' } }),
      prisma.emergencyZone.create({ data: { id: 'zone-rambara-002', name: 'Zone 2 — Rambara Gorge & Mandakini River Sector', level: 'orange', geojson: ZONE_POLYGONS.rambara, description: 'Severe gorge bottleneck with high landslide and mudflow risk along the pedestrian trail. River bank shearing detected.' } }),
      prisma.emergencyZone.create({ data: { id: 'zone-gaurikund-003', name: 'Zone 3 — Gaurikund Basecamp & Thermal Springs', level: 'yellow', geojson: ZONE_POLYGONS.gaurikund, description: 'Elevated water levels near hot spring embankment and parking terminal. Moderate river bank erosion risk.' } }),
      prisma.emergencyZone.create({ data: { id: 'zone-guptkashi-004', name: 'Zone 4 — Guptkashi & Triyuginarayan Safe Haven Plateau', level: 'green', geojson: ZONE_POLYGONS.guptkashi, description: 'Safe high ground plateau relief center receiving diverted pilgrim traffic and helicopter medical evacuations.' } }),
    ]);
    console.log('✅ Created 4 emergency zones');

    // 3. Create alerts for zones
    await Promise.all([
      prisma.emergencyAlert.create({ data: { zoneId: zone1.id, level: 'red', title: 'RED ALERT: Chorabari Glacial Lake Catchment & Kedarnath Temple Basin Flash Flood', description: 'Chorabari glacial lake catchment rainfall at 94.5 mm/hr. Mandakini discharge at 420 m³/s. Immediate mandatory evacuation order for Kedarnath Temple precinct and downstream banks.', evacuationOrder: true, isActive: true, createdBy: govUser.id } }),
      prisma.emergencyAlert.create({ data: { zoneId: zone2.id, level: 'orange', title: 'ORANGE WARNING: Rambara Gorge Landslide & Mudflow Advisory', description: 'Precipitation rate 72.0 mm/hr. High geotechnical slope instability in Rambara gorge sector. Trekking route suspended; SDRF teams deployed.', evacuationOrder: false, isActive: true, createdBy: govUser.id } }),
      prisma.emergencyAlert.create({ data: { zoneId: zone3.id, level: 'yellow', title: 'YELLOW WATCH: Gaurikund Basecamp River Rise', description: 'Mandakini river swelling past warning mark near Gaurikund hot springs. Rainfall 48.2 mm/hr. Riverbank parking evacuated.', evacuationOrder: false, isActive: true, createdBy: govUser.id } }),
    ]);
    console.log('✅ Created 3 emergency alerts');

    // 4. Create safe zones
    await Promise.all([
      prisma.safeZone.create({ data: { id: 'safe-001', name: 'Guptkashi Helipad Ground Relief Shelter', type: 'government_building', latitude: 30.5235, longitude: 79.0792, capacity: 2500, status: 'activated', address: 'Guptkashi Main Helipad, Kedarnath Highway, Rudraprayag, UK 246439' } }),
      prisma.safeZone.create({ data: { id: 'safe-002', name: 'Phata Disaster Relief Base', type: 'community_hall', latitude: 30.5750, longitude: 79.0410, capacity: 1800, status: 'activated', address: 'Phata Aviation Hub, Kedarnath Route, UK 246471' } }),
      prisma.safeZone.create({ data: { id: 'safe-003', name: 'Sonprayag Community Hall Shelter', type: 'community_hall', latitude: 30.6315, longitude: 79.0325, capacity: 1200, status: 'activated', address: 'Sonprayag Sangam Road, Mandakini Valley, UK 246471' } }),
      prisma.safeZone.create({ data: { id: 'safe-004', name: 'Ukhimath Youth Center & Relief Camp', type: 'school', latitude: 30.5180, longitude: 79.0950, capacity: 1500, status: 'available', address: 'Ukhimath Administrative Block, Rudraprayag, UK 246469' } }),
      prisma.safeZone.create({ data: { id: 'safe-005', name: 'Triyuginarayan Temple Complex Safe Ridge', type: 'other', latitude: 30.6410, longitude: 78.9880, capacity: 800, status: 'available', address: 'Triyuginarayan Temple Ridge, Rudraprayag, UK 246471' } }),
    ]);
    console.log('✅ Created 5 safe zones');

    // 5. Create civic departments
    const [pwdDept, electricDept, wasteDept, drainageDept] = await Promise.all([
      prisma.civicDepartment.create({ data: { name: 'Public Works Department (PWD Uttarakhand)', categories: ['pothole', 'other'], email: 'pwd@rudraprayag.gov.in' } }),
      prisma.civicDepartment.create({ data: { name: 'Uttarakhand Power Corporation (UPCL)', categories: ['broken_streetlight'], email: 'upcl@rudraprayag.gov.in' } }),
      prisma.civicDepartment.create({ data: { name: 'Swachh Kedarnath Waste Management', categories: ['waste_management'], email: 'waste@rudraprayag.gov.in' } }),
      prisma.civicDepartment.create({ data: { name: 'Irrigation & Flood Control Board', categories: ['drainage'], email: 'floodcontrol@rudraprayag.gov.in' } }),
    ]);
    console.log('✅ Created 4 civic departments');

    // 6. Elevation data
    for (const ed of ELEVATION_DATA) {
      await prisma.elevationData.create({ data: { ...ed, region: 'kedarnath' } });
    }
    console.log('✅ Created elevation cross-section data (Kedarnath-Guptkashi transect)');

    // 7. Population density
    await prisma.populationDensity.create({
      data: { regionName: 'Kedarnath Temple Township', densityPerSqkm: 4000 },
    });
    await prisma.populationDensity.create({
      data: { regionName: 'Gaurikund Transit Zone', densityPerSqkm: 2500 },
    });
    console.log('✅ Created population density data');

    console.log('\n🎉 Seeding complete for Kedarnath Valley!');
  } catch (err) {
    console.error('Seed execution error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
