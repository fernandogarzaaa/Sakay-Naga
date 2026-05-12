import { getDb } from "../api/queries/connection";
import { routes, stops, routeStops, jeepneys } from "./schema";

async function seed() {
  const db = getDb();

  // Seed Routes - Real Naga City jeepney routes
  const routeData = [
    { name: "Bagumbayan - CBD", code: "BGM-CBD", origin: "Bagumbayan", destination: "CBD", description: "From Bagumbayan to City Business District via Magsaysay Avenue", color: "#EF4444" },
    { name: "Cararayan - CBD", code: "CAR-CBD", origin: "Cararayan", destination: "CBD", description: "From Cararayan to CBD via Panganiban Drive", color: "#3B82F6" },
    { name: "Concepcion - CBD", code: "CON-CBD", origin: "Concepcion", destination: "CBD", description: "From Concepcion Pequena to CBD via Roxas Avenue", color: "#10B981" },
    { name: "Pacol - CBD", code: "PAC-CBD", origin: "Pacol", destination: "CBD", description: "From Pacol to CBD via Maharlika Highway", color: "#F59E0B" },
    { name: "San Felipe - CBD", code: "SFL-CBD", origin: "San Felipe", destination: "CBD", description: "From San Felipe to CBD via Magsaysay Avenue", color: "#8B5CF6" },
    { name: "Tabuco - CBD", code: "TAB-CBD", origin: "Tabuco", destination: "CBD", description: "From Tabuco to CBD via Panganiban Drive", color: "#EC4899" },
    { name: "Triangulo - CBD", code: "TRI-CBD", origin: "Triangulo", destination: "CBD", description: "From Triangulo to CBD via Roxas Avenue", color: "#6366F1" },
    { name: "Magsaysay - CBD", code: "MAG-CBD", origin: "Magsaysay", destination: "CBD", description: "From Magsaysay Village to CBD via Magsaysay Avenue", color: "#14B8A6" },
  ];

  const insertedRoutes = await db.insert(routes).values(routeData).$returningId();
  console.log(`Seeded ${insertedRoutes.length} routes`);

  // Seed Stops
  const stopData = [
    { name: "Bagumbayan Terminal", latitude: "13.6285", longitude: "123.1856", landmark: "Near Bagumbayan Church" },
    { name: "Magsaysay Ave - J. Hernandez", latitude: "13.6260", longitude: "123.1860", landmark: "Jollibee Magsaysay" },
    { name: "Magsaysay Ave - Panganiban", latitude: "13.6230", longitude: "123.1865", landmark: "Metrobank Magsaysay" },
    { name: "CBD - SM City", latitude: "13.6215", longitude: "123.1870", landmark: "SM City Naga" },
    { name: "CBD - Panganiban Gate", latitude: "13.6210", longitude: "123.1880", landmark: "Old Panganiban Gate" },
    { name: "Cararayan Barangay Hall", latitude: "13.6245", longitude: "123.1900", landmark: "Cararayan Plaza" },
    { name: "Panganiban Drive - UP", latitude: "13.6225", longitude: "123.1895", landmark: "UP Naga" },
    { name: "Panganiban Drive - Bicol Med", latitude: "13.6210", longitude: "123.1905", landmark: "Bicol Medical Center" },
    { name: "Concepcion Pequena", latitude: "13.6190", longitude: "123.1840", landmark: "Concepcion Market" },
    { name: "Roxas Ave - Diversion", latitude: "13.6200", longitude: "123.1830", landmark: "Shell Station" },
    { name: "Roxas Ave - CBD", latitude: "13.6210", longitude: "123.1820", landmark: "Rizal Park" },
    { name: "Pacol Barangay Hall", latitude: "13.6350", longitude: "123.1950", landmark: "Pacol Elementary School" },
    { name: "Maharlika Highway - Pacol", latitude: "13.6330", longitude: "123.1930", landmark: "Petron Pacol" },
    { name: "San Felipe Barangay Hall", latitude: "13.6180", longitude: "123.1920", landmark: "San Felipe Church" },
    { name: "Magsaysay Ave - San Felipe", latitude: "13.6195", longitude: "123.1900", landmark: "7-Eleven" },
    { name: "Tabuco Bridge", latitude: "13.6170", longitude: "123.1865", landmark: "Tabuco Bridge" },
    { name: "Tabuco Market", latitude: "13.6160", longitude: "123.1880", landmark: "Tabuco Public Market" },
    { name: "Triangulo Barangay Hall", latitude: "13.6150", longitude: "123.1830", landmark: "Triangulo Plaza" },
    { name: "Roxas Ave - Triangulo", latitude: "13.6165", longitude: "123.1840", landmark: "Naga City Hospital" },
    { name: "Magsaysay Village", latitude: "13.6270", longitude: "123.1880", landmark: "Magsaysay Village Gate" },
  ];

  const insertedStops = await db.insert(stops).values(stopData).$returningId();
  console.log(`Seeded ${insertedStops.length} stops`);

  // Seed Route-Stops mapping
  const routeStopData = [
    // Bagumbayan - CBD
    { routeId: insertedRoutes[0].id, stopId: insertedStops[0].id, sequence: 1 },
    { routeId: insertedRoutes[0].id, stopId: insertedStops[1].id, sequence: 2 },
    { routeId: insertedRoutes[0].id, stopId: insertedStops[2].id, sequence: 3 },
    { routeId: insertedRoutes[0].id, stopId: insertedStops[3].id, sequence: 4 },
    // Cararayan - CBD
    { routeId: insertedRoutes[1].id, stopId: insertedStops[5].id, sequence: 1 },
    { routeId: insertedRoutes[1].id, stopId: insertedStops[6].id, sequence: 2 },
    { routeId: insertedRoutes[1].id, stopId: insertedStops[7].id, sequence: 3 },
    { routeId: insertedRoutes[1].id, stopId: insertedStops[4].id, sequence: 4 },
    // Concepcion - CBD
    { routeId: insertedRoutes[2].id, stopId: insertedStops[8].id, sequence: 1 },
    { routeId: insertedRoutes[2].id, stopId: insertedStops[9].id, sequence: 2 },
    { routeId: insertedRoutes[2].id, stopId: insertedStops[10].id, sequence: 3 },
    { routeId: insertedRoutes[2].id, stopId: insertedStops[4].id, sequence: 4 },
    // Pacol - CBD
    { routeId: insertedRoutes[3].id, stopId: insertedStops[11].id, sequence: 1 },
    { routeId: insertedRoutes[3].id, stopId: insertedStops[12].id, sequence: 2 },
    { routeId: insertedRoutes[3].id, stopId: insertedStops[3].id, sequence: 3 },
    // San Felipe - CBD
    { routeId: insertedRoutes[4].id, stopId: insertedStops[13].id, sequence: 1 },
    { routeId: insertedRoutes[4].id, stopId: insertedStops[14].id, sequence: 2 },
    { routeId: insertedRoutes[4].id, stopId: insertedStops[2].id, sequence: 3 },
    { routeId: insertedRoutes[4].id, stopId: insertedStops[3].id, sequence: 4 },
    // Tabuco - CBD
    { routeId: insertedRoutes[5].id, stopId: insertedStops[15].id, sequence: 1 },
    { routeId: insertedRoutes[5].id, stopId: insertedStops[16].id, sequence: 2 },
    { routeId: insertedRoutes[5].id, stopId: insertedStops[7].id, sequence: 3 },
    { routeId: insertedRoutes[5].id, stopId: insertedStops[4].id, sequence: 4 },
    // Triangulo - CBD
    { routeId: insertedRoutes[6].id, stopId: insertedStops[17].id, sequence: 1 },
    { routeId: insertedRoutes[6].id, stopId: insertedStops[18].id, sequence: 2 },
    { routeId: insertedRoutes[6].id, stopId: insertedStops[10].id, sequence: 3 },
    { routeId: insertedRoutes[6].id, stopId: insertedStops[4].id, sequence: 4 },
    // Magsaysay - CBD
    { routeId: insertedRoutes[7].id, stopId: insertedStops[19].id, sequence: 1 },
    { routeId: insertedRoutes[7].id, stopId: insertedStops[1].id, sequence: 2 },
    { routeId: insertedRoutes[7].id, stopId: insertedStops[2].id, sequence: 3 },
    { routeId: insertedRoutes[7].id, stopId: insertedStops[3].id, sequence: 4 },
  ];

  await db.insert(routeStops).values(routeStopData);
  console.log(`Seeded ${routeStopData.length} route-stops`);

  // Seed Jeepneys
  const jeepneyData = [
    { plateNumber: "ABC-123", qrCode: "SKN-JEEP-001", capacity: 20, make: "Mitsubishi", model: "L300", year: 2019 },
    { plateNumber: "DEF-456", qrCode: "SKN-JEEP-002", capacity: 22, make: "Isuzu", model: "NHR", year: 2020 },
    { plateNumber: "GHI-789", qrCode: "SKN-JEEP-003", capacity: 20, make: "Mitsubishi", model: "L300", year: 2018 },
    { plateNumber: "JKL-012", qrCode: "SKN-JEEP-004", capacity: 24, make: "Isuzu", model: "NHR", year: 2021 },
    { plateNumber: "MNO-345", qrCode: "SKN-JEEP-005", capacity: 20, make: "Toyota", model: "Dyna", year: 2020 },
    { plateNumber: "PQR-678", qrCode: "SKN-JEEP-006", capacity: 22, make: "Mitsubishi", model: "L300", year: 2019 },
    { plateNumber: "STU-901", qrCode: "SKN-JEEP-007", capacity: 20, make: "Isuzu", model: "NHR", year: 2022 },
    { plateNumber: "VWX-234", qrCode: "SKN-JEEP-008", capacity: 24, make: "Toyota", model: "Dyna", year: 2021 },
    { plateNumber: "YZA-567", qrCode: "SKN-JEEP-009", capacity: 20, make: "Mitsubishi", model: "L300", year: 2020 },
    { plateNumber: "BCD-890", qrCode: "SKN-JEEP-010", capacity: 22, make: "Isuzu", model: "NHR", year: 2022 },
  ];

  await db.insert(jeepneys).values(jeepneyData);
  console.log(`Seeded ${jeepneyData.length} jeepneys`);

  console.log("Seed complete!");
}

seed().catch(console.error);
