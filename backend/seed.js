const { runQuery, initializeDatabase } = require('./database');

const sampleItems = [
  {
    name: 'iPhone 13 Pro',
    speciality: 'Mobile Phones',
    image: '/uploads/items/sample-phone.jpg',
    degree: 'Black Color',
    experience: 'Found 2 days ago',
    about: 'Black iPhone 13 Pro found near the library. Has a blue case with initials "JD" scratched on the back.',
    address_line1: 'Central Library',
    address_line2: 'Ground Floor, Near Reception'
  },
  {
    name: 'Hostel Room Keys',
    speciality: 'Keys',
    image: '/uploads/items/sample-keys.jpg',
    degree: 'Metal Keychain',
    experience: 'Found 1 day ago',
    about: 'Set of keys with a red keychain. Appears to be hostel room keys with a small teddy bear charm attached.',
    address_line1: 'Boys Hostel',
    address_line2: 'Block A, Near Entrance'
  },
  {
    name: 'Engineering Notes',
    speciality: 'Notes & Books',
    image: '/uploads/items/sample-notes.jpg',
    degree: 'Blue Notebook',
    experience: 'Found 3 days ago',
    about: 'Blue spiral notebook containing engineering notes. Has "Mechanical Engineering Sem 5" written on the cover.',
    address_line1: 'Academic Block',
    address_line2: 'Room 301, Left on desk'
  },
  {
    name: 'Water Bottle',
    speciality: 'Lunches & Bottles',
    image: '/uploads/items/sample-bottle.jpg',
    degree: 'Stainless Steel',
    experience: 'Found today',
    about: 'Milton stainless steel water bottle. Blue color with some stickers on it.',
    address_line1: 'Sports Complex',
    address_line2: 'Basketball Court'
  },
  {
    name: 'Smart Watch',
    speciality: 'Wearables',
    image: '/uploads/items/sample-watch.jpg',
    degree: 'Black Band',
    experience: 'Found 1 day ago',
    about: 'Fitness smartwatch with black band. Screen is cracked but device seems to be working.',
    address_line1: 'Gym',
    address_line2: 'Lost & Found Counter'
  },
  {
    name: 'Calculator',
    speciality: 'Others',
    image: '/uploads/items/sample-calc.jpg',
    degree: 'Scientific Calculator',
    experience: 'Found 2 days ago',
    about: 'Casio scientific calculator. Has name written on the back in permanent marker (faded).',
    address_line1: 'Exam Hall',
    address_line2: 'Hall 2, Desk 45'
  },
  {
    name: 'Samsung Galaxy S21',
    speciality: 'Mobile Phones',
    image: '/uploads/items/sample-samsung.jpg',
    degree: 'Gray Color',
    experience: 'Found 4 days ago',
    about: 'Gray Samsung phone found in the cafeteria. Screen lock is on.',
    address_line1: 'Main Cafeteria',
    address_line2: 'Table near window'
  },
  {
    name: 'Backpack',
    speciality: 'Others',
    image: '/uploads/items/sample-bag.jpg',
    degree: 'Black Backpack',
    experience: 'Found 1 day ago',
    about: 'Black Nike backpack with laptop compartment. Contains some books and stationery.',
    address_line1: 'Bus Stop',
    address_line2: 'University Main Gate'
  },
  {
    name: 'Prescription Glasses',
    speciality: 'Wearables',
    image: '/uploads/items/sample-glasses.jpg',
    degree: 'Black Frame',
    experience: 'Found today',
    about: 'Black framed prescription glasses in a brown case.',
    address_line1: 'Lecture Hall',
    address_line2: 'LH-5, Row 3'
  },
  {
    name: 'Lunch Box',
    speciality: 'Lunches & Bottles',
    image: '/uploads/items/sample-lunchbox.jpg',
    degree: 'Blue Container',
    experience: 'Found today',
    about: 'Blue plastic lunch box with two compartments. Has cartoon stickers on the lid.',
    address_line1: 'Cafeteria',
    address_line2: 'Cleaning Counter'
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    
    await initializeDatabase();
    
    
    for (const item of sampleItems) {
      await runQuery(
        `INSERT INTO items (name, speciality, image, degree, experience, about, address_line1, address_line2, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available')`,
        [item.name, item.speciality, item.image, item.degree, item.experience, item.about, item.address_line1, item.address_line2]
      );
    }
    
    console.log('✅ Database seeded successfully!');
    console.log(`📦 Inserted ${sampleItems.length} sample items`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();