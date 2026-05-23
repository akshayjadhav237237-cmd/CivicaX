/**
 * Database seed script — populates demo data for Lonavla, Maharashtra region.
 *
 * Run with: node seeds/seed.js
 *
 * Seeds:
 * 1. 4 demo users (citizen, dept_op, government, admin)
 * 2. 3 emergency alert zones (GeoJSON polygons around Lonavla)
 * 3. 6 safe zones (schools, community halls in Lonavla region)
 * 4. 4 civic departments
 * 5. 10 sample civic reports
 * 6. 5 sample safety reports
 * 7. Elevation cross-section data (SRTM-derived for Lonavla-Khandala stretch)
 * 8. Population density data for the region
 */
require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Lonavla coordinates center: ~18.7557, 73.4091
// Khandala: ~18.7690, 73.3775

const ZONE_POLYGONS = {
  alpha: { // Lonavla Valley — Yellow
    type: 'Polygon',
    coordinates: [[
      [73.3950, 18.7450],
      [73.4250, 18.7450],
      [73.4250, 18.7700],
      [73.3950, 18.7700],
      [73.3950, 18.7450],
    ]],
  },
  beta: { // Khandala Slope — Orange
    type: 'Polygon',
    coordinates: [[
      [73.3600, 18.7600],
      [73.3900, 18.7600],
      [73.3900, 18.7800],
      [73.3600, 18.7800],
      [73.3600, 18.7600],
    ]],
  },
  gamma: { // Bushi Dam Catchment — Red
    type: 'Polygon',
    coordinates: [[
      [73.4100, 18.7300],
      [73.4400, 18.7300],
      [73.4400, 18.7550],
      [73.4100, 18.7550],
      [73.4100, 18.7300],
    ]],
  },
};

// Elevation profile: cross-section from Lonavla station to Khandala ghat
// Derived from SRTM 30m data for the region (publicly available from USGS EarthExplorer)
const ELEVATION_DATA = [
  { latitude: 18.7557, longitude: 73.4091, elevationM: 625, sequence: 1 },
  { latitude: 18.7570, longitude: 73.4050, elevationM: 618, sequence: 2 },
  { latitude: 18.7585, longitude: 73.4010, elevationM: 605, sequence: 3 },
  { latitude: 18.7600, longitude: 73.3970, elevationM: 580, sequence: 4 },
  { latitude: 18.7615, longitude: 73.3930, elevationM: 550, sequence: 5 },
  { latitude: 18.7630, longitude: 73.3890, elevationM: 510, sequence: 6 },
  { latitude: 18.7645, longitude: 73.3850, elevationM: 465, sequence: 7 },
  { latitude: 18.7655, longitude: 73.3810, elevationM: 420, sequence: 8 },
  { latitude: 18.7665, longitude: 73.3780, elevationM: 385, sequence: 9 },
  { latitude: 18.7680, longitude: 73.3750, elevationM: 362, sequence: 10 },
  { latitude: 18.7690, longitude: 73.3720, elevationM: 345, sequence: 11 },
  { latitude: 18.7700, longitude: 73.3690, elevationM: 320, sequence: 12 },
  { latitude: 18.7710, longitude: 73.3660, elevationM: 295, sequence: 13 },
  { latitude: 18.7720, longitude: 73.3630, elevationM: 270, sequence: 14 },
  { latitude: 18.7730, longitude: 73.3600, elevationM: 248, sequence: 15 },
];

async function seed() {
  console.log('🌱 Starting CivicaX database seed...');

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
    prisma.user.create({ data: { name: 'Priya Citizen', email: 'citizen@civicax.demo', passwordHash, role: 'citizen', city: 'Lonavla', phone: '+919876543210' } }),
    prisma.user.create({ data: { name: 'Ramesh Dept', email: 'dept@civicax.demo', passwordHash, role: 'department_op', city: 'Lonavla' } }),
    prisma.user.create({ data: { name: 'Collector Singh', email: 'gov@civicax.demo', passwordHash, role: 'government', city: 'Pune' } }),
    prisma.user.create({ data: { name: 'Admin CivicaX', email: 'admin@civicax.demo', passwordHash, role: 'admin', city: 'Lonavla' } }),
  ]);
  console.log('✅ Created 4 demo users');

  // 2. Create emergency zones
  const [zoneAlpha, zoneBeta, zoneGamma] = await Promise.all([
    prisma.emergencyZone.create({ data: { name: 'Zone Alpha — Lonavla Valley', level: 'yellow', geojson: ZONE_POLYGONS.alpha, description: 'Low-lying valley area with moderate flood risk during monsoon season.' } }),
    prisma.emergencyZone.create({ data: { name: 'Zone Beta — Khandala Slope', level: 'orange', geojson: ZONE_POLYGONS.beta, description: 'Steep ghat section with elevated landslide and debris-flow risk.' } }),
    prisma.emergencyZone.create({ data: { name: 'Zone Gamma — Bushi Dam Catchment', level: 'red', geojson: ZONE_POLYGONS.gamma, description: 'Dam catchment area — critical flood risk zone. Immediate evacuation on red alert.' } }),
  ]);
  console.log('✅ Created 3 emergency zones');

  // 3. Create alerts for zones
  await Promise.all([
    prisma.emergencyAlert.create({ data: { zoneId: zoneAlpha.id, level: 'yellow', title: 'Yellow Watch: Elevated Rainfall', description: 'Rainfall exceeding 40mm/hr detected. Citizens in Zone Alpha advised to monitor conditions and prepare emergency kit.', evacuationOrder: false, isActive: true, createdBy: govUser.id } }),
    prisma.emergencyAlert.create({ data: { zoneId: zoneBeta.id, level: 'orange', title: 'Orange Warning: Landslide Risk', description: 'Soil saturation at 78%. Geotechnical risk elevated. Avoid travel on NH-48 ghat section. Prepare for possible evacuation.', evacuationOrder: false, isActive: true, createdBy: govUser.id } }),
    prisma.emergencyAlert.create({ data: { zoneId: zoneGamma.id, level: 'red', title: 'RED ALERT: Bushi Dam Catchment Overflow', description: 'Dam storage at 97%. Flash flood imminent in downstream areas. EVACUATION ORDER IN EFFECT for Zone Gamma residents.', evacuationOrder: true, isActive: true, createdBy: govUser.id } }),
  ]);
  console.log('✅ Created 3 emergency alerts');

  // 4. Create safe zones
  await Promise.all([
    prisma.safeZone.create({ data: { name: 'Lonavla Municipal School', type: 'school', latitude: 18.7520, longitude: 73.4060, capacity: 500, status: 'available', address: 'Near Lonavla Bus Stand, Lonavla, MH 410401' } }),
    prisma.safeZone.create({ data: { name: 'Khandala Community Hall', type: 'community_hall', latitude: 18.7700, longitude: 73.3740, capacity: 350, status: 'available', address: 'Khandala Village Centre, Dist. Pune, MH 410301' } }),
    prisma.safeZone.create({ data: { name: 'Lonavla Sports Stadium', type: 'stadium', latitude: 18.7480, longitude: 73.4120, capacity: 2000, status: 'available', address: 'Shivaji Nagar, Lonavla, MH 410401' } }),
    prisma.safeZone.create({ data: { name: 'Amby Valley Elevated Shelter', type: 'government_building', latitude: 18.7350, longitude: 73.4200, capacity: 800, status: 'available', address: 'Amby Valley Road, Lonavla, MH 410401' } }),
    prisma.safeZone.create({ data: { name: 'Bhushi Dam Relief Centre', type: 'community_hall', latitude: 18.7380, longitude: 73.4080, capacity: 600, status: 'activated', address: 'Bhushi Lake Road, Lonavla, MH 410401' } }),
    prisma.safeZone.create({ data: { name: 'Walvan Dam High Ground', type: 'other', latitude: 18.7600, longitude: 73.4300, capacity: 400, status: 'available', address: 'Walvan Dam Area, Malavali, MH 410401' } }),
  ]);
  console.log('✅ Created 6 safe zones');

  // 5. Create civic departments
  const [pwdDept, electricDept, wasteDept, drainageDept] = await Promise.all([
    prisma.civicDepartment.create({ data: { name: 'Public Works Department (PWD)', categories: ['pothole', 'other'], email: 'pwd@lonavla.gov.in' } }),
    prisma.civicDepartment.create({ data: { name: 'Electricity Department', categories: ['broken_streetlight'], email: 'electric@lonavla.gov.in' } }),
    prisma.civicDepartment.create({ data: { name: 'Waste Management MCGM', categories: ['waste_management'], email: 'waste@lonavla.gov.in' } }),
    prisma.civicDepartment.create({ data: { name: 'Drainage & Sewerage', categories: ['drainage'], email: 'drainage@lonavla.gov.in' } }),
  ]);
  console.log('✅ Created 4 civic departments');

  // 6. Create sample civic reports
  const civicReportsData = [
    { category: 'pothole', description: 'Large pothole on Bazaar Peth road causing accidents. Has been there for 3 weeks.', latitude: 18.7520, longitude: 73.4065, address: 'Bazaar Peth, Lonavla', status: 'resolved', deptId: pwdDept.id },
    { category: 'broken_streetlight', description: 'Street light at the corner of Old Mumbai-Pune highway is broken. Area is dark and unsafe at night.', latitude: 18.7540, longitude: 73.4080, address: 'Old Mumbai-Pune Hwy, Lonavla', status: 'in_progress', deptId: electricDept.id },
    { category: 'waste_management', description: 'Garbage not collected for 5 days near Shivaji Chowk. Creating unhygienic conditions.', latitude: 18.7535, longitude: 73.4090, address: 'Shivaji Chowk, Lonavla', status: 'assigned', deptId: wasteDept.id },
    { category: 'drainage', description: 'Storm drain blocked near the market. Flooding during even mild rain. Mosquito breeding happening.', latitude: 18.7525, longitude: 73.4070, address: 'Market Area, Lonavla', status: 'in_progress', deptId: drainageDept.id },
    { category: 'pothole', description: 'Multiple potholes on Tungarli Lake road. Road is in very bad condition.', latitude: 18.7610, longitude: 73.4050, address: 'Tungarli Lake Road, Lonavla', status: 'submitted', deptId: null },
    { category: 'broken_streetlight', description: 'Entire stretch of 5 street lights broken on the approach to railway station.', latitude: 18.7512, longitude: 73.4030, address: 'Station Road, Lonavla', status: 'assigned', deptId: electricDept.id },
    { category: 'waste_management', description: 'Illegal dumping happening near forest edge. Attracting wildlife and spreading disease risk.', latitude: 18.7660, longitude: 73.4100, address: 'Forest Edge, Lonavla', status: 'submitted', deptId: null },
    { category: 'drainage', description: 'Open manhole on main bazaar road. Very dangerous for pedestrians and two-wheelers.', latitude: 18.7542, longitude: 73.4055, address: 'Main Bazaar Road, Lonavla', status: 'in_progress', deptId: drainageDept.id },
    { category: 'pothole', description: 'Road completely dug up but not repaired for 2 months. Major traffic disruption.', latitude: 18.7503, longitude: 73.4142, address: 'Frichley Hill Area, Lonavla', status: 'submitted', deptId: null },
    { category: 'other', description: 'Public park bench broken. Elderly residents have nowhere to sit. Needs urgent repair.', latitude: 18.7558, longitude: 73.4075, address: 'Central Park, Lonavla', status: 'submitted', deptId: pwdDept.id },
  ];

  for (const rd of civicReportsData) {
    const report = await prisma.civicReport.create({
      data: {
        userId: citizen.id,
        category: rd.category,
        description: rd.description,
        latitude: rd.latitude,
        longitude: rd.longitude,
        address: rd.address,
        status: rd.status,
        departmentId: rd.deptId,
      },
    });
    await prisma.civicReportTimeline.create({
      data: { reportId: report.id, status: 'submitted', note: 'Report submitted by citizen', changedById: citizen.id },
    });
    if (rd.status !== 'submitted') {
      await prisma.civicReportTimeline.create({
        data: { reportId: report.id, status: rd.status, note: `Escalated to ${rd.status}`, changedById: deptOp.id },
      });
    }
  }
  console.log('✅ Created 10 civic reports');

  // 7. Create sample safety reports
  await Promise.all([
    prisma.safetyReport.create({ data: { userId: citizen.id, incidentType: 'road_accident', description: 'Two-vehicle collision on ghat road. One person injured.', latitude: 18.7640, longitude: 73.3870, address: 'NH-48 Ghat Section, Khandala', urgency: 'immediate', credibilityScore: 5, status: 'dispatched' } }),
    prisma.safetyReport.create({ data: { userId: citizen.id, incidentType: 'suspicious_activity', description: 'Group of persons seen near closed factory premises at late night.', latitude: 18.7490, longitude: 73.4130, address: 'Industrial Area, Lonavla', urgency: 'non_urgent', credibilityScore: 2, status: 'pending' } }),
    prisma.safetyReport.create({ data: { incidentType: 'civil_unrest', description: 'Large crowd blocking road near bus depot. Traffic unable to pass.', latitude: 18.7515, longitude: 73.4040, address: 'Bus Depot, Lonavla', urgency: 'immediate', credibilityScore: 7, status: 'pending' } }),
    prisma.safetyReport.create({ data: { userId: citizen.id, incidentType: 'violence', description: 'Altercation reported at a hotel on Mumbai-Pune expressway.', latitude: 18.7560, longitude: 73.4200, address: 'Expressway Hotel Zone, Lonavla', urgency: 'immediate', credibilityScore: 3, status: 'dispatched' } }),
    prisma.safetyReport.create({ data: { incidentType: 'road_accident', description: 'Small vehicle slipped off ghat road. No casualties, but vehicle blocking lane.', latitude: 18.7650, longitude: 73.3820, address: 'Duke\'s Nose Trail, Khandala', urgency: 'non_urgent', credibilityScore: 4, status: 'resolved' } }),
  ]);
  console.log('✅ Created 5 safety reports');

  // 8. Elevation data (SRTM-derived for Lonavla-Khandala cross-section)
  for (const ed of ELEVATION_DATA) {
    await prisma.elevationData.create({ data: { ...ed, region: 'lonavla' } });
  }
  console.log('✅ Created elevation cross-section data (SRTM-derived, Lonavla-Khandala)');

  // 9. Population density for the region
  await prisma.populationDensity.create({
    data: { regionName: 'Lonavla Municipal Council', densityPerSqkm: 350 },
  });
  await prisma.populationDensity.create({
    data: { regionName: 'Khandala Village', densityPerSqkm: 120 },
  });
  console.log('✅ Created population density data');

  // 10. Sample notifications
  await Promise.all([
    prisma.notification.create({ data: { userId: citizen.id, type: 'alert', title: 'RED ALERT: Bushi Dam Catchment', body: 'Flash flood imminent in your area. Please evacuate immediately.', isRead: false } }),
    prisma.notification.create({ data: { userId: citizen.id, type: 'report_update', title: 'Your Report Updated', body: 'Your pothole report on Bazaar Peth has been resolved.', isRead: true } }),
  ]);
  console.log('✅ Created sample notifications');

  console.log('\n🎉 Seeding complete! Demo credentials:');
  console.log('   citizen@civicax.demo / demo1234');
  console.log('   dept@civicax.demo / demo1234');
  console.log('   gov@civicax.demo / demo1234');
  console.log('   admin@civicax.demo / demo1234');
}

seed()
  .catch((err) => { console.error('❌ Seed failed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
